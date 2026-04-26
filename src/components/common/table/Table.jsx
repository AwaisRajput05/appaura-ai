import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import FilterPopup from './components/FilterPopup';
import Navbar from './components/TableNavbar';
import Pagination from './components/Pagination';
import Spinner from '../spinner/Spinner';
import { Settings, ChevronDown } from 'lucide-react';

export default function Table({
  title,
  addButtonName,
  addButtonPath,
  data,
  columns,
  filterFields = [],
  filters: parentFilters,
  onFilterChange,
  pagination: parentPagination,
  onPaginationChange,
  onCheckboxToggle = () => {},
  useLiveFilter = false,
  loading = false,
  handleExportPDF,
  handleExportCSV,
  hideDefaultActions = false,
  serverSideFiltering = false,
  showColumnVisibility = true,
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnVisibilityMenu, setShowColumnVisibilityMenu] = useState(false);
  const columnMenuRef = useRef(null);
  
  // Get current page path for isolation
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Create a UNIQUE but PERSISTENT key for this specific page/table
  const tableIdentifier = useMemo(() => {
    // Combine: Page path + Table title + Specific column IDs
    const columnIds = columns.map(col => col.accessorKey || col.id).sort().join('-');
    const hash = btoa(`${currentPath}-${title}-${columnIds}`).replace(/[^a-zA-Z0-9]/g, '');
    return `table-${hash}`;
  }, [currentPath, title, columns]);
  
  const filterStorageKey = `${tableIdentifier}-filters`;
  const columnVisibilityStorageKey = `${tableIdentifier}-column-visibility`;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
        setShowColumnVisibilityMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize column visibility state - SPECIFIC TO THIS PAGE/TABLE
  const [columnVisibility, setColumnVisibility] = useState(() => {
    if (typeof window === 'undefined') return {};
    
    // Try to load from localStorage with our unique page-specific key
    const saved = localStorage.getItem(columnVisibilityStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        // Error parsing saved visibility
      }
    }
    
    // No saved visibility for this specific page/table
    return {};
  });

  // Save column visibility to localStorage when it changes
  useEffect(() => {
    if (Object.keys(columnVisibility).length > 0) {
      localStorage.setItem(columnVisibilityStorageKey, JSON.stringify(columnVisibility));
    }
  }, [columnVisibility, columnVisibilityStorageKey]);

  // Helper to initialize filters
  const initialFilters = useMemo(() => {
    return Object.fromEntries(
      filterFields.map((f) => [f.name, f.type === 'tags' ? [] : ''])
    );
  }, [filterFields]);

  // Local filters state
  const [filters, setFilters] = useState(() => parentFilters || initialFilters);

  // Sync with parent filters (server-side)
  useEffect(() => {
    if (parentFilters) {
      setFilters(parentFilters);
    }
  }, [parentFilters]);

  // Load saved filters from localStorage (client-side only)
  useEffect(() => {
    if (!serverSideFiltering) {
      const saved = localStorage.getItem(filterStorageKey);
      if (saved && !parentFilters) {
        setFilters((prev) => ({
          ...initialFilters,
          ...JSON.parse(saved),
        }));
      }
    }
  }, [filterStorageKey, parentFilters, serverSideFiltering, initialFilters]);

  // Pagination handling
  const [localPagination, setLocalPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const paginationState = serverSideFiltering
    ? {
        pageIndex: (parentPagination?.page || 1) - 1,
        pageSize: parentPagination?.page_size || 10,
      }
    : localPagination;

  const pageCount = serverSideFiltering
    ? parentPagination?.total
      ? Math.ceil(parentPagination.total / paginationState.pageSize)
      : -1
    : undefined;

  const handleFilterToggle = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleColumnVisibilityToggle = useCallback(() => {
    setShowColumnVisibilityMenu((prev) => !prev);
  }, []);

  const handleColumnVisibilityChange = useCallback((columnId, isVisible) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: isVisible,
    }));
  }, []);

  const handleResetColumnVisibility = useCallback(() => {
    setColumnVisibility({});
    localStorage.removeItem(columnVisibilityStorageKey);
  }, [columnVisibilityStorageKey]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    if (serverSideFiltering && onFilterChange) {
      Object.entries(filters).forEach(([key, value]) => {
        onFilterChange(key, value);
      });
    } else if (!serverSideFiltering) {
      localStorage.removeItem(filterStorageKey);
    }
    setShowFilters(false);
  }, [filters, onFilterChange, serverSideFiltering, filterStorageKey]);

  const handleClearFilters = useCallback(() => {
    const cleared = {};
    filterFields.forEach((f) => {
      if (f.type === 'dateRange') {
        cleared[f.fromName] = '';
        cleared[f.toName] = '';
      } else if (f.type === 'tags') {
        cleared[f.name] = [];
      } else {
        cleared[f.name] = '';
      }
    });

    setFilters(cleared);

    if (serverSideFiltering && onFilterChange) {
      filterFields.forEach((f) => {
        if (f.type === 'dateRange') {
          onFilterChange(f.fromName, '');
          onFilterChange(f.toName, '');
        } else if (f.type === 'tags') {
          onFilterChange(f.name, []);
        } else {
          onFilterChange(f.name, '');
        }
      });
    }
  }, [filterFields, onFilterChange, serverSideFiltering]);

  const handleSaveFilters = useCallback(() => {
    if (!serverSideFiltering) {
      localStorage.setItem(filterStorageKey, JSON.stringify(filters));
    }
    setShowFilters(false);
  }, [filters, filterStorageKey, serverSideFiltering]);

  // Only apply client-side filtering if NOT server-side
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let processedData = data;

    if (!serverSideFiltering) {
      processedData = processedData.filter((item) => {
        return Object.entries(filters).every(([key, value]) => {
          if (value === '' || (Array.isArray(value) && value.length === 0)) return true;

          const fieldConfig = filterFields.find((f) => f.name === key);

          // Tags filtering
          if (fieldConfig?.type === 'tags') {
            const filterTags = Array.isArray(value) ? value : [];
            const itemValue = item[key];
            const itemTags = Array.isArray(itemValue)
              ? itemValue.map(String)
              : String(itemValue || '').split(',').map(s => s.trim()).filter(Boolean);

            return filterTags.some(tag => itemTags.includes(tag));
          }

          // Date range (still needs cleanup if you use it)
          if (filters.fromDate || filters.toDate) {
            const toDateOnly = (d) => d.toISOString().split('T')[0];
            const itemDate = toDateOnly(new Date(item.uploadDate));
            const from = filters.fromDate ? toDateOnly(new Date(filters.fromDate)) : null;
            const to = filters.toDate ? toDateOnly(new Date(filters.toDate)) : null;

            if (from && to) return itemDate >= from && itemDate <= to;
            if (from) return itemDate >= from;
            if (to) return itemDate <= to;
          }

          if (useLiveFilter && ['customerId', 'status'].includes(key)) return true;

          const dateKeys = ['timeStamp', 'lastTransactionDate', 'date'];
          if (dateKeys.includes(key)) {
            const itemDate = new Date(item[key]).toISOString().split('T')[0];
            const filterDate = new Date(value).toISOString().split('T')[0];
            return itemDate === filterDate;
          }

          const selectFields = filterFields
            .filter((f) => f.type === 'select')
            .map((f) => f.name);
          if (selectFields.includes(key)) {
            if (String(value).toLowerCase() === 'all') return true;
            return String(item[key] ?? '').toLowerCase() === String(value).toLowerCase();
          }

          // Default includes filter
          return String(item[key] ?? '').toLowerCase().includes(String(value).toLowerCase());
        });
      });
    }

    return processedData;
  }, [data, filters, filterFields, serverSideFiltering, useLiveFilter]);

  const finalColumns = useMemo(
    () => (hideDefaultActions ? columns : [...columns]),
    [columns, hideDefaultActions]
  );

  const table = useReactTable({
    data: filteredData,
    columns: finalColumns,
    state: { 
      pagination: paginationState,
      columnVisibility,
    },
    onPaginationChange: serverSideFiltering
      ? (updater) => {
          const newPagination = typeof updater === 'function' ? updater(paginationState) : updater;
          onPaginationChange(newPagination.pageIndex + 1, newPagination.pageSize);
        }
      : setLocalPagination,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: serverSideFiltering,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Store visible columns for ExportReports
  useEffect(() => {
    const visibleCols = table?.getAllLeafColumns()
      ?.filter(col => col.getIsVisible())
      ?.map(col => col.id) || [];
    
    // Store for ExportReports to access
    window.__tableVisibleColumns = window.__tableVisibleColumns || {};
    window.__tableVisibleColumns[tableIdentifier] = {
      visibleColumns: visibleCols,
      tableTitle: title,
      currentPath: currentPath,
      timestamp: Date.now()
    };
  }, [table, title, columnVisibility, tableIdentifier, currentPath]);

  return (
    // THE FIX: Add relative positioning here
    <div className="bg-white relative">
      <FilterPopup
        title={title}
        isOpen={showFilters}
        onClose={handleFilterToggle}
        filters={filters}
        onChange={handleFilterChange}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onSave={handleSaveFilters}
        fields={filterFields}
        onCheckboxToggle={(e) => {
          e.stopPropagation();
          onCheckboxToggle(e);
        }}
        useLiveFilter={useLiveFilter}
      />

      <div className="px-6 pt-6">
        <Navbar
          title={title}
          addButtonName={addButtonName}
          addButtonPath={addButtonPath}
          handleExportPDF={handleExportPDF}
          handleExportCSV={handleExportCSV}
        />
      </div>

      {/* Action Buttons Row */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex justify-between items-center">
          {/* Left side: Filter button */}
          <div>
            {filterFields.length > 0 && (
              <button
                onClick={handleFilterToggle}
                className="px-4 py-2 bg-[#3C5690] text-white rounded-lg hover:bg-[#30426B] transition flex items-center gap-2"
              >
                <span>{showFilters ? 'Close Filters' : 'Filters'}</span>
              </button>
            )}
          </div>

          {/* Right side: Column visibility button */}
          <div>
            {showColumnVisibility && (
              <div className="relative" ref={columnMenuRef}>
                <button
                  onClick={handleColumnVisibilityToggle}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-[#30426B] transition flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Columns</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showColumnVisibilityMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showColumnVisibilityMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    {/* Header */}
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Visible Columns
                        </h3>
                        <button
                          onClick={handleResetColumnVisibility}
                          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
                        >
                          Reset All
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Toggle columns to show/hide in the table
                      </p>
                    </div>

                    {/* Column List */}
                    <div className="max-h-80 overflow-y-auto">
                      {table.getAllLeafColumns().map((column) => (
                        <div
                          key={column.id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition"
                        >
                          <span className="font-medium text-gray-700 truncate">
                            {typeof column.columnDef.header === 'function' 
                              ? column.columnDef.header({ column }).props?.title || column.id
                              : column.columnDef.header || column.id}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={column.getIsVisible()}
                              onChange={() => column.toggleVisibility()}
                            />
                            <div className={`w-10 h-5 rounded-full transition ${column.getIsVisible() ? 'bg-green-500' : 'bg-gray-300'}`}>
                              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${column.getIsVisible() ? 'transform translate-x-5' : ''}`} />
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-gray-50 rounded-b-lg border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {table.getAllLeafColumns().filter(col => col.getIsVisible()).length} of {table.getAllLeafColumns().length} visible
                        </span>
                        <button
                          onClick={handleColumnVisibilityToggle}
                          className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

     <div className="px-6 pb-6">
      <div className="overflow-x-auto shadow border rounded-lg bg-white">
        <table className="min-w-full text-sm" aria-label={`${title} table`}>
          <thead className="bg-gradient-to-r from-[#30426B] via-[#3C5690] to-[#5A75C7]">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    tabIndex={0}
                    role="columnheader"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        header.column.getToggleSortingHandler()?.(e);
                      }
                    }}
                    style={{
                      display: header.column.getIsVisible() ? undefined : 'none'
                    }}
                    className="px-5 py-4 text-base font-medium text-left underline text-white border-b border-gray-300 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#5A75C7]"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={finalColumns.length} className="py-6 text-center">
                  <Spinner aria-label="Loading table data" />
                </td>
              </tr>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="even:bg-[#3C5690]/5 odd:bg-white hover:bg-[#5A75C7]/10 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td 
                      key={cell.id} 
                      style={{
                        display: cell.column.getIsVisible() ? undefined : 'none'
                      }}
                      className="px-5 py-2 border-b border-gray-200"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={finalColumns.length} className="text-center py-12 text-[#3C5690] font-bold text-lg">
                  No record found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

      <div className="px-6 pb-6">
        <Pagination table={table} />
      </div>
    </div>
  );
}