// MedicineAnalytics.jsx - WITH MEDICINE TYPE FILTER
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import HomeTable from "../../../common/table/Table";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/salesend/salesend";
import ExportReports from "../../../common/reports/ExportReports";
import { useAuth } from "../../../auth/hooks/useAuth";
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { SALES_MODULE_CONSTANTS } from "././salesconstants/salesModuleConstants";

export default function RevenueAnalytics() {
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    category: "manufacturer", // Changed from "indication" to "manufacturer"
    search_term: "",
    medicineType: "medicine" // Default value is "medicine"
  });

  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

const medicineTypeOptions = SALES_MODULE_CONSTANTS.MEDICINE_TYPE_OPTIONS;
  // USE CONSTANTS FOR USER INFO
  const { 
    currentVendorId, 
    originalBranchId, 
    isMaster, 
    currentBusinessName 
  } = SALES_MODULE_CONSTANTS.getUserInfo(user);
  
  const childVendors = getVendorChildIds() || [];
  
  // USE CONSTANTS FOR BRANCH OPTIONS
  const fullBranchOptions = useMemo(() => 
    SALES_MODULE_CONSTANTS.getBranchOptions(user, childVendors), 
    [childVendors, user]
  );

  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedChildVendorId, setSelectedChildVendorId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // Helper function to build endpoint with medicineType
  const buildEndpoint = useCallback((category, page, pageSize, searchTerm = '', medicineType = '') => {
    let endpoint = apiEndpoints.analyticsByCategory(category, page, pageSize, searchTerm);
    const baseEndpoint = endpoint.split('?')[0];
    const params = new URLSearchParams();
    
    params.append('category', category);
    params.append('page', page);
    params.append('page_size', pageSize);
    if (searchTerm && searchTerm.trim() !== '') {
      params.append('search_term', searchTerm);
    }
    if (medicineType && medicineType.trim() !== '') {
      params.append('medicineType', medicineType);
    }
    
    const queryString = params.toString();
    return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
  }, []);

  // Initialize branch
  useEffect(() => {
    setSelectedBranch(currentBusinessName);
    setSelectedValue('current');
    setSelectedChildVendorId('');
    setSelectedBranchId(originalBranchId);
  }, [originalBranchId, currentBusinessName]);

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

  // Load saved filters - USING CONSTANTS - MODIFIED to only allow manufacturer
  useEffect(() => {
    const saved = SALES_MODULE_CONSTANTS.loadSavedFilters("revenueAnalyticsFilters");
    if (saved) {
      // Only allow manufacturer category
      setFilters(prev => ({
        ...prev,
        category: "manufacturer", // Force manufacturer regardless of saved value
        search_term: saved.search_term || "",
        medicineType: saved.medicineType || "medicine",
      }));
    }
  }, []);

  // Save filters - USING CONSTANTS
  useEffect(() => {
    SALES_MODULE_CONSTANTS.saveFilters("revenueAnalyticsFilters", filters);
  }, [filters]);

  const dynamicTitle = useMemo(() => {
    const branchLabel = selectedBranch || currentBusinessName;
    const isCurrent = selectedValue === 'current';

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-full">
            Medicine Activity
          </span>
          <span className="text-xs sm:text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full whitespace-nowrap">
            By Manufacturer
          </span>
        </div>
        <span className="hidden sm:inline text-gray-500">—</span>
        <span className={`
          inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm w-fit
          ${isCurrent ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-blue-100 text-blue-800 border border-blue-300'}
        `}>
          {isCurrent ? currentBusinessName : `Branch: ${branchLabel}`}
        </span>
      </div>
    );
  }, [selectedBranch, selectedValue, currentBusinessName]);

  const fetchRevenue = async () => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        if (isMountedRef.current) setLoading(false);
        return;
      }

      // Always use "manufacturer" category
      const category = "manufacturer";

      const endpoint = buildEndpoint(
        category,
        pagination.page,
        pagination.page_size,
        filters.search_term.trim(),
        filters.medicineType
      );

      // USE CONSTANTS FOR HEADERS
      const headers = SALES_MODULE_CONSTANTS.getAuthHeaders(token);
      SALES_MODULE_CONSTANTS.addBranchHeaders(
        headers, 
        selectedBranchId, 
        selectedChildVendorId, 
        currentVendorId
      );

      const { data } = await apiService.get(endpoint, {
        headers,
        signal: controllerRef.current.signal,
        timeout: 30000
      });

      // Check if component is still mounted
      if (!isMountedRef.current) return;

      const rawData = data?.data || [];
      const meta = data?.pagination || {};

      if (!Array.isArray(rawData)) {
        setRows([]);
        setPagination(p => ({ ...p, total: 0 }));
        return;
      }

      // Always use manufacturer key
      const mapped = rawData.map((item, index) => ({
        id: `${item.manufacturer || "Unknown"}-${index}`,
        manufacturer: item.manufacturer || "Unknown",
        avg_price: Number(item.avg_price) || 0,
        total_stock: Number(item.total_stock) || 0,
      }));

      setRows(mapped);
      setPagination(p => ({
        ...p,
        total: meta.total_records || meta.total_items || mapped.length || 0,
      }));
    } catch (err) {
      if (!isMountedRef.current) return;
      
      if (err.name === 'AbortError') return;
      const isNotFound = err.response?.status === 404;
      setError(isNotFound ? "No data found for selected filters." : SALES_MODULE_CONSTANTS.getErrorMessage(err));
      setRows([]);
      setPagination(p => ({ ...p, total: 0 }));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Debounced effect
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (controllerRef.current) controllerRef.current.abort();

    timerRef.current = setTimeout(() => {
      fetchRevenue();
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [
    filters.search_term,
    filters.medicineType,
    pagination.page,
    pagination.page_size,
    selectedBranchId,
    selectedChildVendorId
  ]);

  const handleFilterChange = useCallback((name, value) => {
    if (name === "branch_id") {
      const selectedOption = fullBranchOptions.find(opt => opt.value === value);
      if (!selectedOption) return;
      
      setSelectedValue(value);
      setSelectedBranch(selectedOption.label);
      setPagination(p => ({ ...p, page: 1 }));
      
      const isMainBranch = value === 'current';
      setSelectedChildVendorId(isMainBranch ? "" : value);
      setSelectedBranchId(selectedOption.branch_id);
    } 
    else if (name === "search_term" || name === "medicineType") {
      setFilters(p => ({ ...p, [name]: value }));
      setPagination(p => ({ ...p, page: 1 }));
    }
  }, [fullBranchOptions]);

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchRevenue();
  };

  const columns = useMemo(() => {
    // Always use manufacturer
    return [
      {
        accessorKey: "manufacturer",
        header: ({ column }) => <HeaderWithSort column={column} title="Manufacturer" />,
        cell: ({ row }) => <div className="font-medium">{row.original.manufacturer}</div>,
      },
      {
        accessorKey: "avg_price",
        header: ({ column }) => <HeaderWithSort column={column} title="Average Price" />,
        cell: ({ row }) => (
          <div className="font-medium">
            ₨ {row.original.avg_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        ),
      },
      {
        accessorKey: "total_stock",
        header: ({ column }) => <HeaderWithSort column={column} title="Total Stock" />,
        cell: ({ row }) => (
          <div className="font-medium">
            {row.original.total_stock.toLocaleString()} units
          </div>
        ),
      },
    ];
  }, []); // Removed dependency on filters.category since it's constant

  const filterFields = useMemo(() => [
    // Removed the category select dropdown entirely
    {
      type: "text",
      name: "search_term",
      label: "Manufacturer",
      placeholder: "Type to search manufacturer...",
      value: filters.search_term,
      onChange: e => handleFilterChange("search_term", e.target.value),
    },
    {
      type: "select",
      name: "medicineType",
      label: "Medicine Type",
      placeholder: "Select Medicine Type",
      value: filters.medicineType,
      onChange: (e) => handleFilterChange("medicineType", e.target.value),
      options: medicineTypeOptions,
    },
    ...(isMaster && fullBranchOptions.length > 0 ? [{
      type: "select",
      name: "branch_id",
      label: "Branch",
      value: selectedValue,
      onChange: e => handleFilterChange("branch_id", e.target.value),
      options: fullBranchOptions,
    }] : []),
  ], [filters.search_term, filters.medicineType, selectedValue, fullBranchOptions, isMaster, handleFilterChange, medicineTypeOptions]);

  const exportEndpoint = useMemo(() => {
    return buildEndpoint(
      "manufacturer", // Always manufacturer
      1,
      1000,
      filters.search_term.trim(),
      filters.medicineType
    );
  }, [filters.search_term, filters.medicineType, buildEndpoint]);

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
        <ExportReports
          endpoint={exportEndpoint}
          data={rows}
          reportType="Revenue Analytics - By Manufacturer"
          headers={columns.map(col => col.accessorKey)}
          loading={loading}
          setLoading={setLoading}
          setError={setError}
        />
      </div>

      <HomeTable
        title={dynamicTitle}
        data={rows}
        columns={columns}
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
        hideDefaultActions
        loading={loading}
        serverSideFiltering={true}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        error={error}
        onRetry={handleRetry}
        noDataMessage={rows.length === 0 && !loading && !error ? "No manufacturer analytics data found." : error}
      />
    </div>
  );
}
