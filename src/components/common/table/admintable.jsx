import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import FilterPopup from './components/FilterPopup';
import Navbar from './components/TableNavbar';
import Spinner from '../spinner/Spinner';
import { Settings, ChevronDown } from 'lucide-react';

export default function Table({
  title,
  addButtonName,
  addButtonPath,
  data,
  columns,
  filterFields = [],
  onCheckboxToggle = () => {},
  loading = false,
  handleExportPDF,
  handleExportCSV,
  hideDefaultActions = false,
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

  const handleFilterToggle = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleColumnVisibilityToggle = useCallback(() => {
    setShowColumnVisibilityMenu((prev) => !prev);
  }, []);

  const handleResetColumnVisibility = useCallback(() => {
    setColumnVisibility({});
    localStorage.removeItem(columnVisibilityStorageKey);
  }, [columnVisibilityStorageKey]);

  const finalColumns = useMemo(
    () => (hideDefaultActions ? columns : [...columns]),
    [columns, hideDefaultActions]
  );

  const table = useReactTable({
    data: data || [],
    columns: finalColumns,
    state: { 
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
    <div className="p-6 bg-white rounded-2xl shadow-md relative">
      <FilterPopup
        title={title}
        isOpen={showFilters}
        onClose={handleFilterToggle}
        filters={{}}
        onChange={() => {}}
        onApply={() => setShowFilters(false)}
        onClear={() => {}}
        onSave={() => setShowFilters(false)}
        fields={filterFields}
        onCheckboxToggle={(e) => {
          e.stopPropagation();
          onCheckboxToggle(e);
        }}
        useLiveFilter={false}
      />

      <Navbar
        title={title}
        addButtonName={addButtonName}
        addButtonPath={addButtonPath}
        handleExportPDF={handleExportPDF}
        handleExportCSV={handleExportCSV}
      />

      {/* Action Buttons Row - FIXED: Filter on left, Columns on right */}
      <div className="mb-4 flex justify-between items-center">
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

      <div className="overflow-x-auto overflow-visible shadow border rounded-lg bg-white">
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
                    className="px-2 py-4 text-base font-medium text-left underline text-white border-b border-gray-300 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#5A75C7]"
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
  );
}