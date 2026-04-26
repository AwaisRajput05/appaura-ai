// Low.jsx — Updated for new drugLowStockAlert API
import React, { useState, useEffect, useCallback, useRef, useMemo} from 'react';
import Table from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import { getToken } from '../../../../services/tokenUtils';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/endpoint/inventory/inventoryEnd';
import ExportReports from '../../../common/reports/ExportReports';
import { useAuth } from '../../../auth/hooks/useAuth';
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { INVENTORY_MODULE_CONSTANTS } from './inventoryconstants/inventoryModuleConstants';

// UI Components
import { AlertTriangle, Plus, Minus, DollarSign,Activity, Package, Calendar, MapPin, Tag, TrendingDown, BarChart2, ShieldAlert, Beaker, Layers, Hash, Clock, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import Button from '../../../../components/ui/forms/Button';
import Modal from '../../../../components/ui/Modal';
import Alert from '../../../../components/ui/feedback/Alert';
import InputText from '../../../../components/ui/forms/InputText';
import InputSelect from '../../../../components/ui/forms/InputSelect';
import Card from '../../../../components/ui/Card';

// ─── Constants ──────────────────────────────────────────────────────────────
const SAFETY_BUFFER_MIN = 0.05;
const SAFETY_BUFFER_MAX = 2;
const LOOKBACK_DAYS_MIN = 7;
const LOOKBACK_DAYS_MAX = 365;

export default function LowStockAlert() {
  const { user } = useAuth();
  const controllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const timerRef = useRef(null);
  const masterCheckboxRef = useRef(null);

  const [stocks, setStocks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, page_size: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── New filter states ──────────────────────────────────────────────────────
  const [safetyBufferPct, setSafetyBufferPct] = useState(0.25);   // 0.05 – 2
  const [lookBackDays, setLookBackDays] = useState(7);            // 7 – 365
  const [medicineType, setMedicineType] = useState('');

  // ── Branch selection ───────────────────────────────────────────────────────
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const [selectedChildVendorId, setSelectedChildVendorId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // ── Bulk selection ─────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState([]);

  // ── Order modal ────────────────────────────────────────────────────────────
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [orderQuantities, setOrderQuantities] = useState({});
  const [needByDate, setNeedByDate] = useState('');
  const [priority, setPriority] = useState('Medium');

  // ── Constants ──────────────────────────────────────────────────────────────
  const {
    vendorId: currentVendorId,
    branchId: originalBranchId,
    isMaster,
    businessName: currentBusinessName,
  } = INVENTORY_MODULE_CONSTANTS.getUserInfo(user);

  const childVendors = useMemo(() => getVendorChildIds() || [], []);

  const medicineTypeOptions = useMemo(() => [
    { value: 'medicine', label: 'Medicine' },
    { value: 'local', label: 'Local Medicine' },
    { value: 'general', label: 'General Items' },
  ], []);

  const fullBranchOptions = useMemo(
    () => INVENTORY_MODULE_CONSTANTS.getBranchOptions(user, childVendors),
    [childVendors, user],
  );

  // ── Init branch ────────────────────────────────────────────────────────────
  useEffect(() => {
    setSelectedValue('current');
    setSelectedBranch(currentBusinessName);
    setSelectedChildVendorId('');
    setSelectedBranchId(originalBranchId);
  }, [originalBranchId, currentBusinessName]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (controllerRef.current) controllerRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ── Dynamic title ──────────────────────────────────────────────────────────
  const dynamicTitle = useMemo(() => {
    const isMainBranch = selectedValue === 'current';
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" />
          <span className="text-xl sm:text-2xl font-bold text-gray-800 truncate max-w-[180px] sm:max-w-full">
            Low Stock Alert
          </span>
        </div>
        <span className="hidden sm:inline text-gray-500">—</span>
        <span
          className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm w-fit ${
            isMainBranch
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-blue-100 text-blue-800 border border-blue-300'
          }`}
        >
          {isMainBranch ? currentBusinessName : `Branch: ${selectedBranch}`}
        </span>
      </div>
    );
  }, [selectedBranch, selectedValue, currentBusinessName]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLowStock = async () => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) return;

      // vendorIds is required — always read from localStorage
      const vendorIds = localStorage.getItem('userId') || '';
      if (!vendorIds) {
        setError('Vendor ID not found. Please log in again.');
        return;
      }

      const endpoint = apiEndpoints.drugLowStockAlert(
        vendorIds,
        safetyBufferPct,
        lookBackDays,
        medicineType,
        pagination.page,
        pagination.page_size,
      );

      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token);
      INVENTORY_MODULE_CONSTANTS.addBranchHeaders(
        headers,
        selectedBranchId,
        selectedChildVendorId,
        currentVendorId,
      );

      const response = await apiService.get(endpoint, {
        headers,
        signal: controllerRef.current.signal,
        timeout: 15000,
      });

      if (!isMountedRef.current) return;

      const apiResponse = response.data;
      const itemsArray = apiResponse?.data || [];
      const meta = apiResponse?.pagination || {};

      // Store summary for the stats bar
      setSummary(apiResponse?.summary || null);

   const mapped = itemsArray.map((item) => ({
  id: `${item.product_id}-${item.batch_code || 'nobatch'}`,
  product_id: item.product_id,
  name: item.name || 'N/A',
  batch_code: item.batch_code || 'N/A',
  current_stock: Number(item.current_stock) ?? 0,
  auto_threshold: Number(item.auto_threshold) ?? 0,
  stock_gap: Number(item.stock_gap) ?? 0,
  avg_daily_sales: Number(item.avg_daily_sales) ?? 0,
  total_qty_sold_last_n_days: Number(item.total_qty_sold_last_n_days) ?? 0,
  distinct_selling_days: Number(item.distinct_selling_days) ?? 0,
  sale_price: Number(item.sale_price) ?? 0,
  // FIXED: Use formatDate for expiry_date
  expiry_date: INVENTORY_MODULE_CONSTANTS.formatDate(item.expiry_date, false),
  location: item.location || 'N/A',
  category: item.category || 'N/A',
  unit_type: item.unit_type || 'N/A',
  strength: item.strength || 'N/A',
  data_quality: item.data_quality || 'N/A',
  lookback_days: item.lookback_days ?? lookBackDays,
  is_low_stock: item.is_low_stock ?? true,
  safety_buffer_pct: item.safety_buffer_pct ?? safetyBufferPct,
  // FIXED: Use formatDate with showTime=true for calculated_at
  calculated_at: INVENTORY_MODULE_CONSTANTS.formatDate(item.calculated_at, true),
}));

      setStocks(mapped);
      setPagination((p) => ({
        ...p,
        total: meta.total_records ?? meta.total_items ?? mapped.length ?? 0,
      }));
      setSelectedIds((prev) => prev.filter((id) => mapped.some((m) => m.id === id)));
    } catch (err) {
      if (!isMountedRef.current) return;
      if (INVENTORY_MODULE_CONSTANTS.isAbortError(err)) return;
      setError(INVENTORY_MODULE_CONSTANTS.getErrorMessage(err));
      setStocks([]);
      setPagination((p) => ({ ...p, total: 0 }));
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  // ── Debounced fetch trigger ────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (controllerRef.current) controllerRef.current.abort();

    timerRef.current = setTimeout(() => {
      fetchLowStock();
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [safetyBufferPct, lookBackDays, medicineType, pagination.page, pagination.page_size, selectedBranchId, selectedChildVendorId]);

  // ── Master checkbox indeterminate ──────────────────────────────────────────
  useEffect(() => {
    const master = masterCheckboxRef.current;
    if (!master) return;
    if (selectedIds.length === 0) {
      master.indeterminate = false;
      master.checked = false;
    } else if (selectedIds.length === stocks.length && stocks.length > 0) {
      master.indeterminate = false;
      master.checked = true;
    } else {
      master.indeterminate = true;
    }
  }, [selectedIds, stocks]);

  // ── Row selection ──────────────────────────────────────────────────────────
  const toggleRow = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === stocks.length ? [] : stocks.map((s) => s.id));

  // ── Order modal ────────────────────────────────────────────────────────────
  const handleReviewOrder = () => {
    const selected = stocks.filter((s) => selectedIds.includes(s.id));
    if (selected.length === 0) return;

    const initialQty = {};
    selected.forEach((item) => {
      initialQty[item.id] = Math.max(item.stock_gap || 1, 1);
    });
    setOrderQuantities(initialQty);
    setShowReviewModal(true);
  };

  const closeModal = () => {
    setShowReviewModal(false);
    setOrderQuantities({});
    setNeedByDate('');
    setPriority('Medium');
  };

  const updateQuantity = (id, delta) => {
    setOrderQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta),
    }));
  };

  const selectedItems = stocks.filter((s) => selectedIds.includes(s.id));
  const totals = selectedItems.reduce(
    (acc, item) => {
      const qty = orderQuantities[item.id] || 1;
      acc.totalQty += qty;
      acc.totalPrice += qty * item.sale_price;
      return acc;
    },
    { totalQty: 0, totalPrice: 0 },
  );

  const handlePlaceOrder = () => {
    if (!needByDate) {
      alert('Please select Need By Date');
      return;
    }
    alert(`Order Placed!\nTotal: ₨${totals.totalPrice.toFixed(2)} (${totals.totalQty} items)`);
    closeModal();
  };

  // ── Filter change handler ──────────────────────────────────────────────────
  const handleFilterChange = useCallback(
    (name, value) => {
      setPagination((p) => ({ ...p, page: 1 }));

      if (name === 'branch_id') {
        const opt = fullBranchOptions.find((o) => o.value === value);
        if (!opt) return;
        setSelectedValue(value);
        setSelectedBranch(opt.label);
        const isMain = value === 'current';
        setSelectedChildVendorId(isMain ? '' : value);
        setSelectedBranchId(opt.branch_id);
      } else if (name === 'safetyBufferPct') {
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          setSafetyBufferPct(
            Math.min(SAFETY_BUFFER_MAX, Math.max(SAFETY_BUFFER_MIN, parsed)),
          );
        }
      } else if (name === 'lookBackDays') {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed)) {
          setLookBackDays(
            Math.min(LOOKBACK_DAYS_MAX, Math.max(LOOKBACK_DAYS_MIN, parsed)),
          );
        }
      } else if (name === 'medicineType') {
        setMedicineType(value);
      }
    },
    [fullBranchOptions],
  );

  // ── Columns — every API field ──────────────────────────────────────────────
 const columns = useMemo(() => [
  {
    accessorKey: "name",
    header: ({ column }) => <HeaderWithSort column={column} title="Medicine Name" />,
    cell: ({ row }) => (
      <div className="font-semibold flex items-center gap-1 min-w-[140px]">
        <Package className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span>{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: "batch_code",
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <Tag className="w-4 h-4 text-gray-500" />
        <HeaderWithSort column={column} title="Batch Code" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-sm font-mono text-gray-700">{row.original.batch_code}</div>
    ),
  },
  {
    accessorKey: "strength",
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <Beaker className="w-4 h-4 text-indigo-500" />
        <HeaderWithSort column={column} title="Strength" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-sm text-gray-700">{row.original.strength}</div>
    ),
  },
  {
    accessorKey: "unit_type",
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <Layers className="w-4 h-4 text-teal-500" />
        <HeaderWithSort column={column} title="Unit Type" />
      </div>
    ),
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 capitalize">
        {row.original.unit_type}
      </span>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => <HeaderWithSort column={column} title="Category" />,
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 capitalize">
        {row.original.category}
      </span>
    ),
  },
  {
    accessorKey: "current_stock",
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <TrendingDown className="w-4 h-4 text-red-500" />
        <HeaderWithSort column={column} title="Current Stock" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-sm font-bold text-red-600">{row.original.current_stock}</div>
    ),
  },
  {
    accessorKey: "auto_threshold",
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <ShieldAlert className="w-4 h-4 text-orange-500" />
        <HeaderWithSort column={column} title="Auto Threshold" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-sm font-medium text-orange-600">{row.original.auto_threshold}</div>
    ),
  },
  {
    accessorKey: "stock_gap",
    header: ({ column }) => <HeaderWithSort column={column} title="Stock Gap" />,
    cell: ({ row }) => (
      <div className="text-sm font-bold text-rose-700">+{row.original.stock_gap}</div>
    ),
  },
  {
    accessorKey: "avg_daily_sales",
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <BarChart2 className="w-4 h-4 text-blue-500" />
        <HeaderWithSort column={column} title="Avg Daily Sales" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-sm text-gray-700">{row.original.avg_daily_sales.toFixed(2)}</div>
    ),
  },
  {
    accessorKey: "total_qty_sold_last_n_days",
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <Hash className="w-4 h-4 text-sky-500" />
        <HeaderWithSort column={column} title={`Qty Sold (${lookBackDays}d)`} />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-sm text-gray-700">{row.original.total_qty_sold_last_n_days}</div>
    ),
  },
  {
    accessorKey: "distinct_selling_days",
    header: ({ column }) => <HeaderWithSort column={column} title="Selling Days" />,
    cell: ({ row }) => (
      <div className="text-sm text-gray-600">
        {row.original.distinct_selling_days} / {row.original.lookback_days}
      </div>
    ),
  },
  {
    accessorKey: "sale_price",
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <Activity className="w-4 h-4 text-green-600" />
        <HeaderWithSort column={column} title="Sale Price" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-sm font-medium">₨ {row.original.sale_price.toFixed(2)}</div>
    ),
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <MapPin className="w-4 h-4 text-red-500" />
        <HeaderWithSort column={column} title="Location" />
      </div>
    ),
    cell: ({ row }) => <div className="text-sm">{row.original.location}</div>,
  },
  {
    accessorKey: "expiry_date",
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <Calendar className="w-4 h-4 text-orange-500" />
        <HeaderWithSort column={column} title="Expiry Date" />
      </div>
    ),
    cell: ({ row }) => {
      const expiryDateStr = row.original.expiry_date;
      let isExpiringSoon = false;
      if (expiryDateStr && expiryDateStr !== 'N/A' && expiryDateStr !== '—') {
        try {
          const expiryDate = new Date(expiryDateStr);
          const today = new Date();
          if (!isNaN(expiryDate)) {
            const daysUntilExpiry = (expiryDate - today) / (1000 * 60 * 60 * 24);
            isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry < 90;
          }
        } catch(e) {}
      }
      return (
        <div className={`text-sm ${isExpiringSoon ? 'text-red-600 font-bold' : ''}`}>
          {expiryDateStr}
        </div>
      );
    },
  },
  {
    accessorKey: "data_quality",
    header: ({ column }) => <HeaderWithSort column={column} title="Data Quality" />,
    cell: ({ row }) => {
      const dq = row.original.data_quality;
      const styleMap = {
        no_history: 'bg-gray-100 text-gray-600 border-gray-300',
        low_confidence: 'bg-yellow-50 text-yellow-700 border-yellow-300',
        high_confidence: 'bg-green-50 text-green-700 border-green-300',
      };
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styleMap[dq] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>
          {dq?.replace(/_/g, ' ') || 'N/A'}
        </span>
      );
    },
  },
  {
    accessorKey: "calculated_at",
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <Clock className="w-4 h-4 text-gray-400" />
        <HeaderWithSort column={column} title="Calculated At" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-xs text-gray-500 whitespace-nowrap">
        {row.original.calculated_at}
      </div>
    ),
  },
], [lookBackDays]);

  // ── Filter fields ──────────────────────────────────────────────────────────
  const filterFields = useMemo(() => [
    {
      type: 'number',
      name: 'safetyBufferPct',
      label: `Safety Buffer % (${SAFETY_BUFFER_MIN}–${SAFETY_BUFFER_MAX})`,
      placeholder: 'e.g. 0.25',
      min: SAFETY_BUFFER_MIN,
      max: SAFETY_BUFFER_MAX,
      step: 0.05,
      value: safetyBufferPct,
      onChange: (e) => handleFilterChange('safetyBufferPct', e.target.value),
      className: 'w-full sm:w-auto',
    },
    {
      type: 'number',
      name: 'lookBackDays',
      label: `Lookback Days (${LOOKBACK_DAYS_MIN}–${LOOKBACK_DAYS_MAX})`,
      placeholder: 'e.g. 7',
      min: LOOKBACK_DAYS_MIN,
      max: LOOKBACK_DAYS_MAX,
      step: 1,
      value: lookBackDays,
      onChange: (e) => handleFilterChange('lookBackDays', e.target.value),
      className: 'w-full sm:w-auto',
    },
    {
      type: 'select',
      name: 'medicineType',
      label: 'Medicine Type',
      placeholder: 'Select Medicine Type',
      value: medicineType,
      onChange: (e) => handleFilterChange('medicineType', e.target.value),
      options: medicineTypeOptions,
      className: 'w-full sm:w-auto',
    },
    ...(isMaster && fullBranchOptions.length > 0
      ? [
          {
            type: 'select',
            name: 'branch_id',
            label: 'Branch',
            placeholder: 'Select Branch',
            value: selectedValue,
            onChange: (e) => handleFilterChange('branch_id', e.target.value),
            options: fullBranchOptions,
            className: 'w-full sm:w-auto',
          },
        ]
      : []),
  ], [safetyBufferPct, lookBackDays, medicineType, selectedValue, isMaster, fullBranchOptions, medicineTypeOptions, handleFilterChange]);

  // ── Export endpoint ────────────────────────────────────────────────────────
  const exportEndpoint = useMemo(
    () =>
      apiEndpoints.drugLowStockAlert(
        '',
        safetyBufferPct,
        lookBackDays,
        medicineType,
        1,
        1000,
      ),
    [safetyBufferPct, lookBackDays, medicineType],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
        <ExportReports
          endpoint={exportEndpoint}
          data={stocks}
          reportType="Low Stock Alert"
          loading={loading}
          setLoading={setLoading}
          headers={columns.map((col) => col.accessorKey)}
          setError={setError}
        />
      </div>

      {error && (
        <Alert
          variant="error"
          message={error}
          action={fetchLowStock}
          actionLabel="Retry"
          className="mb-6"
        />
      )}

     

      <Table
        title={dynamicTitle}
        data={stocks}
        columns={columns}
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
        pagination={pagination}
        onPaginationChange={(page, size) =>
          setPagination((p) => ({ ...p, page, page_size: size }))
        }
        loading={loading}
        serverSideFiltering={true}
        error={error}
        onRetry={fetchLowStock}
        noDataMessage="No low stock items found"
        selectedIds={selectedIds}
        onRowSelect={toggleRow}
        onSelectAll={toggleSelectAll}
        masterCheckboxRef={masterCheckboxRef}
        onBulkAction={selectedIds.length > 0 ? handleReviewOrder : null}
        bulkActionLabel="Review Order"
        bulkActionIcon={<AlertTriangle className="w-4 h-4" />}
        hideDefaultActions
      />

      {/* ── REVIEW ORDER MODAL ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showReviewModal}
        onClose={closeModal}
        title="Review Order"
        size="xl"
      >
        <div className="space-y-4 mb-6">
          {selectedItems.map((item) => (
            <Card key={item.id} className="p-4" bodyClassName="p-0">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{item.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Batch:&nbsp;{item.batch_code}
                    &nbsp;|&nbsp;Stock:&nbsp;
                    <span className="text-red-600 font-medium">{item.current_stock}</span>
                    &nbsp;|&nbsp;Gap:&nbsp;
                    <span className="text-rose-700 font-medium">{item.stock_gap}</span>
                    &nbsp;|&nbsp;₨{item.sale_price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-8 h-8 p-0 rounded-full"
                  >
                    <Minus className="w-4 h-4 mx-auto" />
                  </Button>
                  <span className="w-16 text-center font-bold text-lg">
                    {orderQuantities[item.id] || 1}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-8 h-8 p-0 rounded-full"
                  >
                    <Plus className="w-4 h-4 mx-auto" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <InputText
            type="date"
            label="Need By Date"
            value={needByDate}
            onChange={(e) => setNeedByDate(e.target.value)}
            required
          />
          <InputSelect
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </InputSelect>
        </div>

        <div className="text-right text-xl font-bold mb-6 p-4 bg-gray-50 rounded-lg">
          Total: ₨{totals.totalPrice.toFixed(2)}&nbsp;
          <span className="text-base font-normal text-gray-500">
            ({totals.totalQty} items)
          </span>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handlePlaceOrder}
            disabled={!needByDate}
          >
            Place Order
          </Button>
        </div>
      </Modal>
    </div>
  );
}