// placeorder.jsx - WITH SORTING SUPPORT - FULLY RESPONSIVE
import React, { useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import { AuthContext } from '../../../auth/hooks/AuthContextDef';
import Table from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import { AlertTriangle, X, Plus, Minus, Trash2, CheckCircle, DollarSign, Package, TrendingUp, RefreshCw } from 'lucide-react';
import { getToken } from '../../../../services/tokenUtils';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/apiEndpoints';
import { ORDER_MODULE_CONSTANTS } from '././orderconstant/orderModuleConstants';

// Import reusable components
import Button from '../../../../components/ui/forms/Button';
import Alert from '../../../../components/ui/feedback/Alert';
import Card from '../../../../components/ui/Card';
import InputText from '../../../../components/ui/forms/InputText';
import InputSelect from '../../../../components/ui/forms/InputSelect';
import DatePicker from '../../../../components/ui/forms/DatePicker';
import Checkbox from '../../../../components/ui/forms/Checkbox';

// Priority options reused across modal
const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
];

export default function PlaceOrder() {
  const { user } = useContext(AuthContext);
  
  // Refs for cleanup
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  const previousFiltersRef = useRef({});
  const previousPaginationRef = useRef({});
  const previousSortingRef = useRef({});
  
  // State
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Sorting state - matches React Table format
  const [sorting, setSorting] = useState([{ id: '', desc: false }]);
  
  // Per-medicine state
  const [orderQuantities, setOrderQuantities] = useState({});
  const [needByDates, setNeedByDates] = useState({});
  const [priorities, setPriorities] = useState({});
  const [editableFields, setEditableFields] = useState({});

  // Filters and pagination
  const [pagination, setPagination] = useState({ page: 1, page_size: 10, total: 0 });
  const [threshold, setThreshold] = useState(50);
  const [nameFilter, setNameFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');

  // User info using constants
  const { vendorId, branchId, isMaster } = ORDER_MODULE_CONSTANTS.getUserInfo(user);
  
  const masterCheckboxRef = useRef(null);
  const selectedIdSet = useMemo(() => new Set(selectedStocks.map(s => s.id)), [selectedStocks]);

  // Get headers helper
  const getHeaders = useCallback((childId = null) => {
    const headers = ORDER_MODULE_CONSTANTS.getOrderHeaders(getToken());
    
    if (branchId) {
      headers[ORDER_MODULE_CONSTANTS.HEADER_KEYS.USER_BRANCH_ID] = branchId;
    }
    
    if (isMaster && childId) {
      headers[ORDER_MODULE_CONSTANTS.HEADER_KEYS.CHILD_ID] = childId;
    }
    
    return headers;
  }, [branchId, isMaster]);

  // Load saved filters
  useEffect(() => {
    const saved = ORDER_MODULE_CONSTANTS.loadSavedFilters("placeOrderFilters");
    if (saved) {
      if (saved.threshold) setThreshold(saved.threshold);
      if (saved.nameFilter) setNameFilter(saved.nameFilter);
      if (saved.startDate) setStartDate(saved.startDate);
      if (saved.endDate) setEndDate(saved.endDate);
      if (saved.manufacturerFilter) setManufacturerFilter(saved.manufacturerFilter);
      if (saved.sorting) setSorting(saved.sorting);
    }
  }, []);

  // Save filters
  useEffect(() => {
    ORDER_MODULE_CONSTANTS.saveFilters("placeOrderFilters", {
      threshold,
      nameFilter,
      startDate,
      endDate,
      manufacturerFilter,
      sorting
    });
  }, [threshold, nameFilter, startDate, endDate, manufacturerFilter, sorting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Client-side sorting function (fallback)
  const sortDataClientSide = useCallback((data, sortConfig) => {
    if (!sortConfig || !sortConfig.id || sortConfig.id === '') {
      return data;
    }

    const { id, desc } = sortConfig;
    
    return [...data].sort((a, b) => {
      let aValue = a[id];
      let bValue = b[id];
      
      if (id.includes('.')) {
        const keys = id.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return desc ? bValue - aValue : aValue - bValue;
      }
      
      if (id === 'expiry_date' || id === 'created_at') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        if (desc) {
          return bDate - aDate;
        }
        return aDate - bDate;
      }
      
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();
      
      if (desc) {
        return bStr.localeCompare(aStr);
      }
      return aStr.localeCompare(bStr);
    });
  }, []);

  // Build sort parameter for API
  const getSortParam = useCallback((sortConfig) => {
    if (!sortConfig || !sortConfig.id || sortConfig.id === '') {
      return '';
    }
    
    const fieldMapping = {
      'name': 'name',
      'manufacturer': 'manufacturer',
      'price': 'sale_price',
      'stock': 'stock',
      'total_sold_qty': 'total_sold_qty',
      'total_sales_amount': 'total_sales_amount',
      'batch_code': 'batch_code',
      'expiry_date': 'expiry_date'
    };
    
    const apiField = fieldMapping[sortConfig.id] || sortConfig.id;
    const sortDirection = sortConfig.desc ? 'desc' : 'asc';
    
    return `${apiField}:${sortDirection}`;
  }, []);

  // Fetch low stock with debouncing, abort controller, and sorting
  const fetchLowStock = useCallback(async (overrideFilters = null, overridePagination = null, overrideSorting = null) => {
    if (!vendorId && !branchId) {
      setLoading(false);
      return;
    }

    const currentFilters = {
      nameFilter: overrideFilters?.nameFilter || nameFilter,
      threshold: overrideFilters?.threshold !== undefined ? overrideFilters.threshold : threshold,
      startDate: overrideFilters?.startDate || startDate,
      endDate: overrideFilters?.endDate || endDate,
      manufacturerFilter: overrideFilters?.manufacturerFilter || manufacturerFilter
    };
    
    const currentPagination = overridePagination || pagination;
    const currentSorting = overrideSorting || (sorting[0]?.id ? sorting[0] : { id: '', desc: false });

    const filtersString = JSON.stringify(currentFilters);
    const prevFiltersString = JSON.stringify(previousFiltersRef.current);
    
    const paginationString = JSON.stringify({page: currentPagination.page, page_size: currentPagination.page_size});
    const prevPaginationString = JSON.stringify({page: previousPaginationRef.current.page, page_size: previousPaginationRef.current.page_size});
    
    const sortingString = JSON.stringify(currentSorting);
    const prevSortingString = JSON.stringify(previousSortingRef.current);
    
    if (filtersString === prevFiltersString && 
        paginationString === prevPaginationString &&
        sortingString === prevSortingString) {
      return;
    }

    previousFiltersRef.current = {...currentFilters};
    previousPaginationRef.current = {page: currentPagination.page, page_size: currentPagination.page_size};
    previousSortingRef.current = {...currentSorting};

    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        if (!isMountedRef.current) return;
        
        setLoading(true);
        setError(null);

        const sortParam = getSortParam(currentSorting);
        
        const endpoint = apiEndpoints.drugLowStockAlert(
          currentFilters.nameFilter || '',
          currentFilters.threshold,
          currentFilters.startDate || '',
          currentFilters.endDate || '',
          currentFilters.manufacturerFilter || '',
          currentPagination.page,
          currentPagination.page_size,
          sortParam
        );

        const headers = getHeaders();

        const response = await apiService.get(endpoint, { 
          headers,
          signal: controllerRef.current.signal 
        });

        if (!isMountedRef.current) return;

        let data = response.data?.data || [];
        const meta = response.data?.pagination || {};

        if (!Array.isArray(data)) {
          setStocks([]);
          setPagination(prev => ({ ...prev, total: 0 }));
          return;
        }

        let mapped = data.map((item) => ({
          id: `${item.item_id || item.medicine_id}-${item.batch_code || 'nobatch'}-${item.expiry_date || 'noexpiry'}`,
          medicine_id: item.item_id || item.medicine_id,
          name: item.name || 'N/A',
          strength: item.strength || 'N/A',
          form: item.type || 'Tablet',
          manufacturer: item.manufacturer || 'N/A',
          price: Number(item.sale_price) || 0,
          stock: Number(item.stock) || 0,
          expiry_date: item.expiry_date
            ? ORDER_MODULE_CONSTANTS.formatDate(item.expiry_date, false)
            : 'N/A',
          batch_code: item.batch_code || 'N/A',
          total_sales_amount: Number(item.total_sales_amount) || 0,
          total_sold_qty: Number(item.total_sold_qty) || 0,
          prescriptions_required: item.prescriptions_required || false,
          raw_expiry_date: item.expiry_date,
        }));

        const hasApiSorting = meta.sorted === true || sortParam;
        
        if (!hasApiSorting && currentSorting.id) {
          console.log('Using client-side sorting as fallback');
          mapped = sortDataClientSide(mapped, currentSorting);
        }

        setStocks(mapped);
        const total = meta.total_records || mapped.length;
        setPagination(prev => ({ ...prev, total }));
        
        if (mapped.length > 0) {
          const ids = mapped.map(s => s.id);
          const uniqueIds = new Set(ids);
          if (ids.length !== uniqueIds.size) {
            console.warn('⚠️ Duplicate IDs found:', {
              totalItems: ids.length,
              uniqueItems: uniqueIds.size,
              duplicates: ids.filter((id, index) => ids.indexOf(id) !== index)
            });
          }
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        if (err.name === 'AbortError') return;
        setError(ORDER_MODULE_CONSTANTS.getErrorMessage(err));
        setStocks([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }, 300);
  }, [vendorId, branchId, getHeaders, getSortParam, sortDataClientSide, nameFilter, threshold, startDate, endDate, manufacturerFilter, pagination, sorting]);

  // Fetch stocks on dependency changes
  useEffect(() => {
    fetchLowStock();
  }, [
    nameFilter,
    threshold,
    startDate,
    endDate,
    manufacturerFilter,
    pagination.page,
    pagination.page_size,
    sorting,
    fetchLowStock
  ]);

  // Initial fetch
  useEffect(() => {
    fetchLowStock();
  }, []);

  // Update master checkbox state
  useEffect(() => {
    const master = masterCheckboxRef.current;
    if (!master) return;

    let selectedOnPage = 0;
    for (let s of stocks) {
      if (selectedIdSet.has(s.id)) selectedOnPage++;
    }

    if (selectedOnPage === 0) {
      master.indeterminate = false;
      master.checked = false;
    } else if (selectedOnPage === stocks.length && stocks.length > 0) {
      master.indeterminate = false;
      master.checked = true;
    } else {
      master.indeterminate = true;
    }
  }, [selectedStocks, stocks, selectedIdSet]);

  // Helper functions
  const calculateNeedByDate = useCallback((priority) => {
    return ORDER_MODULE_CONSTANTS.calculateNeedByDate(priority);
  }, []);

  const toggleItem = useCallback((item) => {
    setSelectedStocks(prev => {
      const exists = prev.some(p => p.id === item.id);
      if (exists) {
        return prev.filter(p => p.id !== item.id);
      } else {
        if (prev.some(p => p.id === item.id)) return prev;
        return [...prev, item];
      }
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedStocks(prev => {
      const currentSelectedIds = new Set(prev.map(s => s.id));
      const stocksNotSelected = stocks.filter(s => !currentSelectedIds.has(s.id));
      const stocksSelected = stocks.filter(s => currentSelectedIds.has(s.id));
      
      if (stocksSelected.length === stocks.length && stocks.length > 0) {
        return prev.filter(p => !stocks.some(s => s.id === p.id));
      } else {
        const newSelected = [...prev];
        stocksNotSelected.forEach(stock => {
          if (!newSelected.some(s => s.id === stock.id)) {
            newSelected.push(stock);
          }
        });
        return newSelected;
      }
    });
  }, [stocks]);

  const handleReviewOrder = useCallback(() => {
    const selected = selectedStocks;
    if (selected.length === 0) return;

    const initialQty = {};
    const initialDates = {};
    const initialPrio = {};
    const initialEdits = {};

    selected.forEach(item => {
      initialQty[item.id] = 1;
      initialPrio[item.id] = 'Medium';
      initialDates[item.id] = calculateNeedByDate('Medium');
      initialEdits[item.id] = {
        strength: item.strength,
        form: item.form,
        manufacturer: item.manufacturer,
      };
    });

    setOrderQuantities(initialQty);
    setNeedByDates(initialDates);
    setPriorities(initialPrio);
    setEditableFields(initialEdits);
    setShowReviewModal(true);
  }, [selectedStocks, calculateNeedByDate]);

  const closeModal = useCallback(() => {
    setShowReviewModal(false);
    setOrderQuantities({});
    setNeedByDates({});
    setPriorities({});
    setEditableFields({});
  }, []);

  const updateQuantity = useCallback((id, delta) => {
    setOrderQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta),
    }));
  }, []);

  const removeItem = useCallback((id) => {
    setSelectedStocks(prev => prev.filter(s => s.id !== id));
    setOrderQuantities(prev => { const { [id]: _, ...rest } = prev; return rest; });
    setNeedByDates(prev => { const { [id]: _, ...rest } = prev; return rest; });
    setPriorities(prev => { const { [id]: _, ...rest } = prev; return rest; });
    setEditableFields(prev => { const { [id]: _, ...rest } = prev; return rest; });
  }, []);

  // Calculate totals
  const selectedItems = selectedStocks;
  const totals = useMemo(() => selectedItems.reduce(
    (acc, item) => {
      const qty = orderQuantities[item.id] || 1;
      acc.totalQty += qty;
      acc.totalPrice += qty * item.price;
      return acc;
    },
    { totalQty: 0, totalPrice: 0 }
  ), [selectedItems, orderQuantities]);

  // Group items
  const groups = useMemo(() => {
    const groupsObj = {};
    selectedItems.forEach(item => {
      const date = needByDates[item.id] || '';
      const prio = priorities[item.id] || 'Medium';
      const key = `${date}||${prio}`;
      if (!groupsObj[key]) groupsObj[key] = [];
      groupsObj[key].push(item.id);
    });
    return groupsObj;
  }, [selectedItems, needByDates, priorities]);

  const largeGroups = useMemo(() => 
    Object.entries(groups).filter(([_, ids]) => ids.length >= 2),
    [groups]
  );

  const applyToGroup = useCallback((groupKey, field, value) => {
    const ids = groups[groupKey];
    ids.forEach(id => {
      if (field === 'date') {
        setNeedByDates(prev => ({ ...prev, [id]: value }));
      }
      if (field === 'priority') {
        setPriorities(prev => ({ ...prev, [id]: value }));
        const newDate = calculateNeedByDate(value);
        setNeedByDates(prev => ({ ...prev, [id]: newDate }));
      }
    });
  }, [groups, calculateNeedByDate]);

  // Handle place order
  const handlePlaceOrder = useCallback(async () => {
    const missingDate = selectedItems.some(item => !needByDates[item.id]);
    if (missingDate) {
      setError("Please select Need By Date for all items.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        medicines: selectedItems.map((item) => {
          const edits = editableFields[item.id] || {};
          const qty = orderQuantities[item.id] || 1;
          return {
            medicineId: item.medicine_id,
            name: `${item.name} ${edits.strength || item.strength}`,
            currentStock: item.stock,
            requiredStock: qty,
            requiredByDate: new Date(needByDates[item.id]).toISOString(),
            priority: priorities[item.id]?.toUpperCase() || "MEDIUM",
            strength: edits.strength || item.strength,
            form: edits.form || item.form,
            manufacturer: edits.manufacturer || item.manufacturer,
          };
        }),
      };

      const headers = getHeaders();
      await apiService.post(apiEndpoints.placeOrder(), payload, { headers });

      setSuccessMessage(`Order placed successfully! Total: ₨${totals.totalPrice.toFixed(2)}`);
      closeModal();
      setSelectedStocks([]);
      
      fetchLowStock();
    } catch (err) {
      setError(ORDER_MODULE_CONSTANTS.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedItems, needByDates, editableFields, orderQuantities, priorities, totals, getHeaders, fetchLowStock, closeModal]);

  // Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    switch (key) {
      case 'threshold':
        const num = value === '' ? 50 : Number(value);
        if (!isNaN(num) && num >= 0) {
          setThreshold(num);
        }
        break;
      case 'name':
        setNameFilter(value);
        break;
      case 'manufacturer':
        setManufacturerFilter(value);
        break;
      case 'startDate':
        setStartDate(value);
        break;
      case 'endDate':
        setEndDate(value);
        break;
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePaginationChange = useCallback((page, page_size) => {
    setPagination(prev => ({ ...prev, page, page_size }));
  }, []);

  const handleSortingChange = useCallback((newSorting) => {
    setSorting(newSorting);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleRefresh = useCallback(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchLowStock();
  }, [fetchLowStock]);

  // Columns
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Medicine Name" />
      ),
      cell: ({ row }) => (
        <div className="font-semibold flex items-center gap-1">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-xs sm:text-sm">{row.original.name}</span>
        </div>
      ),
    },
    { 
      accessorKey: 'manufacturer', 
      header: ({ column }) => <HeaderWithSort column={column} title="Manufacturer" />,
      cell: ({ row }) => <span className="text-xs sm:text-sm">{row.original.manufacturer}</span>
    },
    { 
      accessorKey: 'price', 
      header: ({ column }) => <HeaderWithSort column={column} title="Price" />, 
      cell: ({ row }) => <div className="text-xs sm:text-sm font-medium">₨ {row.original.price.toFixed(2)}</div> 
    },
    { 
      accessorKey: 'stock', 
      header: ({ column }) => <HeaderWithSort column={column} title="Stock" />, 
      cell: ({ row }) => (
        <div className={`text-xs sm:text-sm font-bold ${row.original.stock <= threshold ? 'text-red-600' : 'text-orange-600'}`}>
          {row.original.stock}
        </div>
      ) 
    },
    { 
      accessorKey: 'total_sold_qty', 
      header: () => (
        <div className="flex items-center gap-1">
          <Package className="w-4 h-4 text-green-600" />
          <span className="hidden sm:inline">Sold Qty</span>
          <span className="sm:hidden">Qty</span>
        </div>
      ), 
      cell: ({ row }) => <div className="text-xs sm:text-sm font-medium text-green-700">{row.original.total_sold_qty}</div> 
    },
    { 
      accessorKey: 'total_sales_amount', 
      header: () => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-blue-600" />
          <span className="hidden sm:inline">Sales Amt</span>
          <span className="sm:hidden">Amt</span>
        </div>
      ), 
      cell: ({ row }) => <div className="text-xs sm:text-sm font-medium text-blue-700">₨ {row.original.total_sales_amount.toFixed(2)}</div> 
    },
    { 
      accessorKey: 'batch_code', 
      header: ({ column }) => <HeaderWithSort column={column} title="Batch Code" />,
      cell: ({ row }) => <span className="text-xs sm:text-sm">{row.original.batch_code}</span>
    },
    { 
      accessorKey: 'expiry_date', 
      header: ({ column }) => <HeaderWithSort column={column} title="Expiry Date" />,
      cell: ({ row }) => <span className="text-xs sm:text-sm">{row.original.expiry_date}</span>
    },
    {
      accessorKey: 'actions',
      header: () => (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="select-all"
            checked={selectedStocks.length > 0 && selectedStocks.length === stocks.length}
            onChange={toggleSelectAll}
            ref={masterCheckboxRef}
            className="h-4 w-4 text-[#3C5690] border-gray-300 rounded focus:ring-[#3C5690] cursor-pointer"
          />
          <span className="font-medium text-sm">Actions</span>
        </div>
      ),
      cell: ({ row }) => {
        const item = row.original;
        const checked = selectedIdSet.has(item.id);
        
        return (
          <div className="flex justify-center">
            <input
              type="checkbox"
              id={`select-${item.id}`}
              checked={checked}
              onChange={(e) => {
                e.stopPropagation();
                toggleItem(item);
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="h-4 w-4 text-[#3C5690] border-gray-300 rounded focus:ring-[#3C5690] cursor-pointer"
            />
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
      size: 100,
    },
  ], [threshold, selectedStocks, stocks, selectedIdSet, toggleItem, toggleSelectAll]);

  // Filter fields
  const filterFields = useMemo(() => [
    {
      type: 'number',
      name: 'threshold',
      label: 'Stock Threshold',
      placeholder: 'e.g. 50',
      min: 1,
      value: threshold,
      onChange: (e) => handleFilterChange('threshold', e.target.value),
      className: "w-full sm:w-auto",
    },
    {
      type: 'text',
      name: 'manufacturer',
      label: 'Manufacturer',
      placeholder: 'e.g. GSK',
      value: manufacturerFilter,
      onChange: (e) => handleFilterChange('manufacturer', e.target.value),
      className: "w-full sm:w-auto",
    },
  ], [threshold, manufacturerFilter, startDate, endDate, handleFilterChange]);

  return (
    <>
      {/* Alerts */}
      <Alert
        variant="success"
        message={successMessage}
        show={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        icon={<CheckCircle className="w-5 h-5" />}
        className="mb-4 px-4"
      />
      <Alert
        variant="error"
        message={error}
        show={!!error}
        onClose={() => setError(null)}
        action={handleRetry}
        actionLabel="Retry"
        className="mb-4 px-4"
      />

      {/* Main Card */}
      <Card 
        className="p-4 sm:p-6 w-full" 
        bodyClassName="p-0"
        title={
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Place Order</h2>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="secondary"
                onClick={() => setSelectedStocks([])}
                disabled={selectedStocks.length === 0}
                className="flex items-center justify-center gap-2 text-xs sm:text-sm px-4 sm:px-5 py-2 flex-1 min-w-[100px]"
                size="sm"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="whitespace-nowrap">Clear</span>
              </Button>
              <Button
                variant="primary"
                onClick={handleReviewOrder}
                disabled={selectedStocks.length === 0}
                className="flex items-center justify-center gap-2 text-xs sm:text-sm px-4 sm:px-5 py-2 flex-1 min-w-[100px]"
                size="sm"
              >
                <span>Review ({selectedStocks.length})</span>
              </Button>
            </div>
          </div>
        }
      >
        <Table
          data={stocks}
          columns={columns}
          searchField="name"
          filterFields={filterFields}
          filters={{ 
            threshold, 
            name: nameFilter,
            manufacturer: manufacturerFilter,
            startDate,
            endDate
          }}
          onFilterChange={handleFilterChange}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          hideDefaultActions
          loading={loading}
          serverSideFiltering={true}
        />
      </Card>

      {/* Review Order Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gray-50">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Review Order</h2>
              <button 
                onClick={closeModal} 
                className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {selectedItems.length === 0 ? (
                <p className="text-center text-gray-500">No items selected.</p>
              ) : (
                <div className="space-y-6">
                  {/* Large Groups Section */}
                  {largeGroups.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-3 text-sm sm:text-base">Apply to All in Group (2+ items)</h3>
                      <div className="space-y-3">
                        {largeGroups.map(([key, ids]) => {
                          const [date, prio] = key.split('||');
                          return (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 p-4 bg-white rounded-lg shadow-sm">
                              <span className="text-xs sm:text-sm font-medium text-gray-700 sm:pb-3">{ids.length} items</span>

                              {/* Custom DatePicker */}
                              <div className="w-full sm:w-56">
                                <DatePicker
                                  label="Need By Date"
                                  value={date}
                                  onChange={(val) => applyToGroup(key, 'date', val)}
                                  className="w-full"
                                  inputClassName="py-2 text-sm"
                                />
                              </div>

                              {/* Custom InputSelect for Priority */}
                              <div className="w-full sm:w-56">
                                <InputSelect
                                  label="Priority"
                                  name={`group-priority-${key}`}
                                  value={prio}
                                  onChange={(e) => applyToGroup(key, 'priority', e.target.value)}
                                  options={PRIORITY_OPTIONS}
                                  className="w-full"
                                  inputClassName="py-2 text-sm"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Items Table */}
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-blue-600">
                        <tr>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-white">Item</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-white">Strength</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-white">Form</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-white">Mfg</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-white">Price</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-white">Qty</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-white">Need By</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-white">Priority</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-white">Stock</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-white">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedItems.map((item) => {
                          const qty = orderQuantities[item.id] || 1;
                          const needBy = needByDates[item.id] || '';
                          const priority = priorities[item.id] || 'Medium';
                          const edits = editableFields[item.id] || {};

                          return (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-none">{item.name}</td>

                              {/* Strength */}
                              <td className="px-2 sm:px-3 py-2 sm:py-3">
                                <InputText
                                  value={edits.strength ?? item.strength}
                                  onChange={(e) => setEditableFields(prev => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], strength: e.target.value }
                                  }))}
                                  className="w-16 sm:w-20"
                                  inputClassName="text-xs sm:text-sm py-1 sm:py-2 px-1 sm:px-2 border-gray-300 h-7 sm:h-9"
                                  disabled
                                />
                              </td>

                              {/* Form */}
                              <td className="px-2 sm:px-3 py-2 sm:py-3">
                                <InputText
                                  value={edits.form ?? item.form}
                                  onChange={(e) => setEditableFields(prev => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], form: e.target.value }
                                  }))}
                                  className="w-16 sm:w-20"
                                  inputClassName="text-xs sm:text-sm py-1 sm:py-2 px-1 sm:px-2 border-gray-300 h-7 sm:h-9"
                                  disabled
                                />
                              </td>

                              {/* Manufacturer */}
                              <td className="px-2 sm:px-3 py-2 sm:py-3">
                                <InputText
                                  value={edits.manufacturer ?? item.manufacturer}
                                  onChange={(e) => setEditableFields(prev => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], manufacturer: e.target.value }
                                  }))}
                                  className="w-16 sm:w-20"
                                  inputClassName="text-xs sm:text-sm py-1 sm:py-2 px-1 sm:px-2 border-gray-300 h-7 sm:h-9"
                                  disabled
                                />
                              </td>

                              <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium">₨ {item.price.toFixed(2)}</td>

                              {/* Quantity */}
                              <td className="px-2 sm:px-3 py-2 sm:py-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={() => updateQuantity(item.id, -1)} 
                                    className="p-0.5 sm:p-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
                                  >
                                    <Minus className="w-2 h-2 sm:w-3 sm:h-3" />
                                  </button>
                                  <input
                                    type="text"
                                    value={qty}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '' || /^\d+$/.test(val)) {
                                        const num = val === '' ? 1 : parseInt(val, 10);
                                        setOrderQuantities(prev => ({ ...prev, [item.id]: Math.max(1, num) }));
                                      }
                                    }}
                                    className="w-8 sm:w-10 text-center text-xs sm:text-sm border border-gray-300 rounded px-1 py-0.5 sm:py-1 focus:outline-none focus:ring-1 focus:ring-[#3C5690]"
                                  />
                                  <button 
                                    onClick={() => updateQuantity(item.id, 1)} 
                                    className="p-0.5 sm:p-1 rounded bg-[#3C5690] text-white hover:bg-[#30426B] transition-colors"
                                  >
                                    <Plus className="w-2 h-2 sm:w-3 sm:h-3" />
                                  </button>
                                </div>
                              </td>

                              {/* Need By Date — custom DatePicker */}
                              <td className="px-2 sm:px-3 py-2 sm:py-3">
                                <div className="w-36 sm:w-44">
                                  <DatePicker
                                    label=""
                                    value={needBy}
                                    onChange={(val) =>
                                      setNeedByDates(prev => ({ ...prev, [item.id]: val }))
                                    }
                                    className="w-full"
                                    inputClassName="py-1 sm:py-2 text-xs sm:text-sm"
                                    required
                                  />
                                </div>
                              </td>

                              {/* Priority — custom InputSelect */}
                              <td className="px-2 sm:px-3 py-2 sm:py-3">
                                <div className="w-28 sm:w-36">
                                  <InputSelect
                                    label=""
                                    name={`priority-${item.id}`}
                                    value={priority}
                                    onChange={(e) => {
                                      const newPriority = e.target.value;
                                      setPriorities(prev => ({ ...prev, [item.id]: newPriority }));
                                      const newDate = calculateNeedByDate(newPriority);
                                      setNeedByDates(prev => ({ ...prev, [item.id]: newDate }));
                                    }}
                                    options={PRIORITY_OPTIONS}
                                    className="w-full"
                                    inputClassName="py-1 sm:py-2 text-xs sm:text-sm"
                                  />
                                </div>
                              </td>

                              <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-red-600">{item.stock}</td>

                              {/* Remove */}
                              <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => removeItem(item.id)}
                                  className="p-1 sm:p-2"
                                >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  <strong>{selectedItems.length}</strong> item{selectedItems.length !== 1 ? 's' : ''} •{' '}
                  <strong>{totals.totalQty}</strong> units • Total: <strong className="text-indigo-600">₨{totals.totalPrice.toFixed(2)}</strong>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button 
                    variant="secondary" 
                    onClick={closeModal}
                    className="w-full sm:w-auto text-xs sm:text-sm py-2"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    onClick={handlePlaceOrder}
                    disabled={loading || selectedItems.length === 0 || selectedItems.some(item => !needByDates[item.id])}
                    loading={loading}
                    loadingText="Placing..."
                    className="w-full sm:w-auto text-xs sm:text-sm py-2"
                    size="sm"
                  >
                    Place Order
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}