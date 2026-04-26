// DateRange.jsx - REFACTORED WITH SEARCH_MODULE_CONSTANTS
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import HomeTable from "../../../common/table/Table";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/search/searchend";
import ExportReports from "../../../common/reports/ExportReports";
import { NO_RECORD_FOUND } from "../../../constants/Messages";
import { useAuth } from "../../../auth/hooks/useAuth";
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { SEARCH_MODULE_CONSTANTS } from "././searchconstants/searchModuleConstants";

export default function MedicineDateRangeList() {
  // Refs for cleanup
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const { user } = useAuth();

  // State
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateError, setDateError] = useState("");

  // Branch state
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedChildVendorId, setSelectedChildVendorId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // Filters
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    type: "",
    medicine_name: "",
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

  // Get user info using constants
  const { 
    currentVendorId, 
    originalBranchId, 
    isMaster, 
    currentBusinessName 
  } = SEARCH_MODULE_CONSTANTS.getUserInfo(user);
  
  const childVendors = getVendorChildIds() || [];
  
  // Get branch options using constants
  const fullBranchOptions = useMemo(() => 
    SEARCH_MODULE_CONSTANTS.getBranchOptions(user, childVendors), 
    [childVendors, user]
  );

  // Initialize branch state using constants
  useEffect(() => {
    const businessName = localStorage.getItem('businessName') || 'Current Branch';
    SEARCH_MODULE_CONSTANTS.initializeBranchState(user, {
      setSelectedBranch,
      setSelectedValue,
      setSelectedChildVendorId,
      setSelectedBranchId
    });
  }, [originalBranchId, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      SEARCH_MODULE_CONSTANTS.cancelApiRequest(controllerRef);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Show branch dropdown
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  useEffect(() => {
    setShowBranchDropdown(childVendors.length > 0 || !!currentVendorId);
  }, [childVendors.length, currentVendorId]);

  // Set default 7-day date range on first load
  useEffect(() => {
    if (filters.start_date || filters.end_date) return;

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const formatDate = (date) => date.toISOString().split('T')[0];

    setFilters(prev => ({
      ...prev,
      start_date: formatDate(sevenDaysAgo),
      end_date: formatDate(today),
    }));
  }, []);

 // Dynamic title (custom for this component) - FIXED: Made responsive
const dynamicTitle = useMemo(() => {
  const branchLabel = selectedBranch;
  const isCurrent = selectedValue === currentVendorId;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-full">
          Medicine List (by Date Range)
        </span>
      </div>
      <span className="hidden sm:inline text-gray-500">—</span>
      <span
        className={`
          inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm w-fit
          ${isCurrent
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-blue-100 text-blue-800 border border-blue-300'
          }
        `}
      >
        {isCurrent ? currentBusinessName : `Branch: ${branchLabel}`}
      </span>
    </div>
  );
}, [selectedBranch, selectedValue, currentBusinessName, currentVendorId]);

  // Fetch data function
  const fetchDrugsByDateRange = useCallback(async () => {
    SEARCH_MODULE_CONSTANTS.cancelApiRequest(controllerRef);
    controllerRef.current = new AbortController();

    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);
      setDateError("");

      // Validate date range using constants
      if (!SEARCH_MODULE_CONSTANTS.validateDateRange(
        filters.start_date, 
        filters.end_date, 
        setDateError
      )) {
        setRows([]);
        setPagination(p => ({ ...p, total: 0 }));
        setLoading(false);
        return;
      }

      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const endpoint = apiEndpoints.searchByDateRange(
        filters.start_date,
        filters.end_date,
        filters.type,
        filters.medicine_name,
        pagination.page,
        pagination.page_size
      );

      // Get headers using constants
      const headers = SEARCH_MODULE_CONSTANTS.getAuthHeaders(token);
      SEARCH_MODULE_CONSTANTS.addBranchHeaders(
        headers, 
        selectedBranchId, 
        selectedChildVendorId, 
        currentVendorId
      );

      const { data } = await apiService.get(endpoint, { 
        headers, 
        timeout: SEARCH_MODULE_CONSTANTS.API_TIMEOUT 
      });

      if (!isMountedRef.current) return;

      const list = data?.data ?? [];
      const meta = data?.pagination ?? {};

      if (!Array.isArray(list)) {
        setRows([]);
        setPagination(p => ({ ...p, total: 0 }));
        return;
      }

     const mapped = list.map((it, i) => ({
  id: `${it.medicine_id}-${i}`,
  drug_name: it.name ?? "N/A",
  price: Number(it.sale_price) || 0,
  stock: Number(it.stock) || 0,
  expiry_date: it.expiry_date, 
  dosage: it.dosage ?? "",
  uses: it.uses ?? "",
  warnings: it.warnings ?? "",
  side_effects: it.side_effects ?? "",
}));

      setRows(mapped);
      setPagination(p => ({
        ...p,
        total: meta.total_records ?? list.length ?? 0,
      }));
    } catch (err) {
      if (!isMountedRef.current) return;
      SEARCH_MODULE_CONSTANTS.handleApiError(err, setError);
      setRows([]);
      setPagination(p => ({ ...p, total: 0 }));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    filters,
    pagination.page,
    pagination.page_size,
    selectedBranchId,
    selectedChildVendorId,
    currentVendorId
  ]);

  // Debounced effect using constants
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    SEARCH_MODULE_CONSTANTS.cancelApiRequest(controllerRef);

    timerRef.current = setTimeout(() => {
      fetchDrugsByDateRange();
    }, SEARCH_MODULE_CONSTANTS.DEBOUNCE_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchDrugsByDateRange]);

  // Filter change handler using constants
  const handleFilterChange = useCallback((name, value) => {
    if (name === "branch_id") {
      SEARCH_MODULE_CONSTANTS.handleFilterChange(
        name,
        value,
        {
          setSelectedValue,
          setSelectedBranch,
          setSelectedChildVendorId,
          setSelectedBranchId,
          setPagination
        },
        fullBranchOptions,
        currentVendorId,
        originalBranchId
      );
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [fullBranchOptions, currentVendorId, originalBranchId]);

  // Pagination change handler
  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handleRetry = () => {
    setError(null);
    setDateError("");
    fetchDrugsByDateRange();
  };

// Update the columns section (around line 200-220)
const columns = useMemo(() => [
  {
    accessorKey: "drug_name",
    header: ({ column }) => <HeaderWithSort column={column} title="Medicine Name" />,
    cell: ({ row }) => <div className="font-medium">{row.original.drug_name}</div>,
  },
  {
    accessorKey: "price",
    header: ({ column }) => <HeaderWithSort column={column} title="Price" />,
    cell: ({ row }) => <div>₨ {row.original.price.toFixed(2)}</div>,
  },
  {
    accessorKey: "stock",
    header: ({ column }) => <HeaderWithSort column={column} title="Stock" />,
    cell: ({ row }) => <div>{row.original.stock}</div>,
  },
  {
    accessorKey: "expiry_date",
    header: ({ column }) => <HeaderWithSort column={column} title="Expiry Date" />,
    cell: ({ row }) => <div className="font-medium">{SEARCH_MODULE_CONSTANTS.formatDate(row.original.expiry_date, false)}</div>,
  },
], []);
  // Filter fields
  const filterFields = useMemo(() => [
    {
      type: "dateRange",
      label: "Date",
      fromName: "start_date",
      toName: "end_date",
      value: { start_date: filters.start_date, end_date: filters.end_date },
      onChange: (e) => handleFilterChange(e.target.name, e.target.value),
      className: "date-input-black",
    },
    {
      type: "select",
      name: "type",
      label: "Type",
      options: [
        { value: "expiry", label: "Expiry" },
        { value: "supply", label: "Supply" },
        { value: "sales", label: "Sales" },
      ],
      value: filters.type,
      onChange: (e) => handleFilterChange("type", e.target.value),
    },
    {
      type: "text",
      name: "medicine_name",
      label: "Medicine Name",
      placeholder: "e.g. Panadol",
      value: filters.medicine_name,
      onChange: (e) => handleFilterChange("medicine_name", e.target.value),
    },
    ...(isMaster && fullBranchOptions.length > 0
      ? [{
          type: "select",
          name: "branch_id",
          label: "Branch",
          placeholder: "Select Branch",
          value: selectedValue,
          onChange: (e) => handleFilterChange("branch_id", e.target.value),
          options: fullBranchOptions,
        }]
      : []),
  ], [filters, selectedValue, fullBranchOptions, isMaster]);

  // Export endpoint
  const exportEndpoint = useMemo(() => {
    return apiEndpoints.searchByDateRange(
      filters.start_date,
      filters.end_date,
      filters.type,
      filters.medicine_name,
      1,
      1000
    );
  }, [filters]);

  return (
    <div className="relative">
    <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
  <ExportReports
    endpoint={exportEndpoint}
    data={rows}
    reportType="Medicine List by Date Range"
    headers={columns.map(c => c.accessorKey)}
    loading={loading}
    setLoading={setLoading}
    setError={setError}
  />
</div>

      {dateError && !loading && (
        <div className="date-error-message mx-4 mt-4">
          {dateError}
        </div>
      )}

      <HomeTable
        title={dynamicTitle}
        data={rows}
        columns={columns}
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
        loading={loading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        serverSideFiltering={true}
        error={error}
        onRetry={handleRetry}
        noDataMessage={
          rows.length === 0 && !loading && !error && !dateError
            ? "No records found for this branch."
            : error || dateError
        }
      />
    </div>
  );
}