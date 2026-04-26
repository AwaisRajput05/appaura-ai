// SalesTrend.jsx - WITH MEDICINE TYPE FILTER
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

export default function SalesTrend() {
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const { user } = useAuth();

  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    category: "type",
    time_period: "month",
    search_term: "",
    medicineType: "medicine" // Default value is "medicine"
  });

  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

// Medicine Type Options - Now imported from constants
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

  // Initialize branch
  useEffect(() => {
    setSelectedValue('current');
    setSelectedBranch(currentBusinessName);
    setSelectedChildVendorId('');
    setSelectedBranchId(originalBranchId);
  }, [originalBranchId]);

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

  // Load saved filters - USING CONSTANTS
  useEffect(() => {
    const saved = SALES_MODULE_CONSTANTS.loadSavedFilters("salesTrendFilters");
    if (saved) {
      setFilters(prev => ({
        ...prev,
        category: ["type", "form", "supplier_name", "indication"].includes(saved.category) ? saved.category : "type",
        time_period: ["week", "month", "year"].includes(saved.time_period) ? saved.time_period : "month",
        search_term: saved.search_term || "",
        medicineType: saved.medicineType || "medicine",
      }));
    }
  }, []);

  // Save filters - USING CONSTANTS
  useEffect(() => {
    SALES_MODULE_CONSTANTS.saveFilters("salesTrendFilters", filters);
  }, [filters]);

  // Helper function to build endpoint with medicineType
  const buildEndpoint = useCallback((category, period, page, pageSize, searchTerm, medicineType = '') => {
    let endpoint = apiEndpoints.salesTrend(category, period, page, pageSize, searchTerm);
    const baseEndpoint = endpoint.split('?')[0];
    const params = new URLSearchParams();
    
    params.append('category', category);
    params.append('time_period', period);
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

  const categoryLabels = {
    type: "by Type",
    manufacturer: "by Manufacturer",
    name: "by Name",
   
  };

  const dynamicTitle = useMemo(() => {
    const label = categoryLabels[filters.category] || "by Type";
    const branchLabel = selectedBranch || currentBusinessName;
    const isCurrent = selectedValue === 'current';

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[180px] sm:max-w-full">
            Sales Trend
          </span>
          <span className="text-xs sm:text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
            {label}
          </span>
        </div>
        <span className="hidden sm:inline text-gray-500">—</span>
        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm w-fit ${
          isCurrent
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-blue-100 text-blue-800 border border-blue-300'
        }`}>
          {isCurrent ? currentBusinessName : `Branch: ${branchLabel}`}
        </span>
      </div>
    );
  }, [filters.category, selectedBranch, selectedValue, currentBusinessName]);

  const fetchData = async () => {
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

      const safeCategory = ["type", "form", "supplier_name", "indication"].includes(filters.category) ? filters.category : "type";
      const safePeriod = ["week", "month", "year"].includes(filters.time_period) ? filters.time_period : "month";

      const endpoint = buildEndpoint(
        safeCategory,
        safePeriod,
        pagination.page,
        pagination.page_size,
        filters.search_term?.trim() || "",
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
        timeout: 20000
      });

      // Check if component is still mounted
      if (!isMountedRef.current) return;

      const rawData = data?.data ?? [];
      const pag = data?.pagination || {};

      if (!Array.isArray(rawData)) {
        setTrends([]);
        setPagination(p => ({ ...p, total: 0 }));
        return;
      }

      const mapped = rawData.map((item, idx) => {
        const fieldValue = 
          safeCategory === "type" ? (item.type || "Unknown") :
          safeCategory === "form" ? (item.form || "Unknown") :
          safeCategory === "supplier_name" ? (item.supplier_name || "Unknown") :
          safeCategory === "indication" ? (item.indication || "Unknown") :
          "Unknown";

        return {
          id: `${fieldValue}-${item.period}-${idx}`,
         period: SALES_MODULE_CONSTANTS.formatPeriod(item.period, filters.time_period),
          category_value: fieldValue,
          total_revenue: Number(item.total_revenue) || 0,
          total_quantity: Number(item.total_quantity) || 0,
          transactions: Number(item.transactions) || 0,
        };
      });

      setTrends(mapped);
      setPagination(p => ({
        ...p,
        total: pag.total_records ?? mapped.length ?? 0,
      }));
    } catch (err) {
      if (!isMountedRef.current) return;
      
      if (err.name === 'AbortError') return;
      setError(SALES_MODULE_CONSTANTS.getErrorMessage(err));
      setTrends([]);
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
      fetchData();
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [
    filters,
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
      setSelectedBranchId(selectedOption.branch_id || originalBranchId);
    } else {
      setFilters(p => ({ ...p, [name]: value }));
      setPagination(p => ({ ...p, page: 1 }));
    }
  }, [fullBranchOptions, originalBranchId]);

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchData();
  };

  const columns = useMemo(() => {
    const titleMap = {
      type: "Type",
      form: "Form",
      supplier_name: "Supplier",
      indication: "Indication",
    };

    return [
      {
        accessorKey: "period",
        header: ({ column }) => <HeaderWithSort column={column} title="Period" />,
        cell: ({ row }) => <div className="font-medium">{row.original.period}</div>,
      },
      {
        accessorKey: "category_value",
        header: ({ column }) => <HeaderWithSort column={column} title={titleMap[filters.category] || "Category"} />,
        cell: ({ row }) => <div className="font-medium">{row.original.category_value}</div>,
      },
      {
        accessorKey: "total_quantity",
        header: ({ column }) => <HeaderWithSort column={column} title="Qty Sold" />,
        cell: ({ row }) => <div className="font-medium">{row.original.total_quantity.toLocaleString()}</div>,
      },
      {
        accessorKey: "transactions",
        header: ({ column }) => <HeaderWithSort column={column} title="Transactions" />,
        cell: ({ row }) => <div className="font-medium">{row.original.transactions}</div>,
      },
      {
        accessorKey: "total_revenue",
        header: ({ column }) => <HeaderWithSort column={column} title="Revenue" />,
        cell: ({ row }) => (
          <div className="font-medium">
            Rs {row.original.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        ),
      },
    ];
  }, [filters.category]);

  const filterFields = useMemo(() => [
    {
      type: "select",
      name: "category",
      label: "Group By",
      value: filters.category,
      onChange: e => handleFilterChange("category", e.target.value),
      options: [
        { value: "type", label: "Type" },
        { value: "manufacturer", label: "Manufacturer" },
        { value: "name", label: "Name" },
      
      ],
    },
    {
      type: "select",
      name: "time_period",
      label: "Period",
      value: filters.time_period,
      onChange: e => handleFilterChange("time_period", e.target.value),
      options: [
        { value: "week", label: "Weekly" },
        { value: "month", label: "Monthly" },
        { value: "year", label: "Yearly" },
      ],
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
    {
      type: "text",
      name: "search_term",
      label: "Search",
      placeholder: "Search category...",
      value: filters.search_term,
      onChange: e => handleFilterChange("search_term", e.target.value),
    },
    ...(isMaster && fullBranchOptions.length > 0 ? [{
      type: "select",
      name: "branch_id",
      label: "Branch",
      value: selectedValue,
      onChange: e => handleFilterChange("branch_id", e.target.value),
      options: fullBranchOptions,
    }] : []),
  ], [filters, selectedValue, isMaster, fullBranchOptions, handleFilterChange, medicineTypeOptions]);

  const exportEndpoint = useMemo(() => {
    return buildEndpoint(
      filters.category,
      filters.time_period,
      1,
      1000,
      filters.search_term?.trim() || "",
      filters.medicineType
    );
  }, [filters, buildEndpoint]);

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
        <ExportReports
          endpoint={exportEndpoint}
          data={trends}
          reportType={`Sales Trend - ${categoryLabels[filters.category] || "Type"}`}
          loading={loading}
          setLoading={setLoading}
          setError={setError}
        />
      </div>

      <HomeTable
        title={dynamicTitle}
        data={trends}
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
        noDataMessage="No sales trend data found for the selected filters."
      />
    </div>
  );
}