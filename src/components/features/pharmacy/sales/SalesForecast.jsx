// SalesForecast.jsx - WITH MEDICINE TYPE FILTER
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

export default function SalesForecast() {
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // USE CONSTANTS FOR USER INFO
  const { 
    currentVendorId, 
    originalBranchId, 
    isMaster, 
    currentBusinessName 
  } = SALES_MODULE_CONSTANTS.getUserInfo(user);
  
  const childVendors = getVendorChildIds() || [];
  
  // USE CONSTANTS FOR BRANCH OPTIONS
  const branchOptions = useMemo(() => 
    SALES_MODULE_CONSTANTS.getBranchOptions(user, childVendors), 
    [childVendors, user]
  );

  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedChildVendorId, setSelectedChildVendorId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [filters, setFilters] = useState({
    forecast_days: "10",
    custom_days: "",
    medicineType: "medicine" // Default value is "medicine"
  });

  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

// Medicine Type Options - Now imported from constants
const medicineTypeOptions = SALES_MODULE_CONSTANTS.MEDICINE_TYPE_OPTIONS;

  // Initialize branch
  useEffect(() => {
    setSelectedValue('current');
    setSelectedBranch(currentBusinessName);
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

  // Load saved filters - USING CONSTANTS
  useEffect(() => {
    const saved = SALES_MODULE_CONSTANTS.loadSavedFilters("salesForecastFilters");
    if (saved) {
      setFilters({
        forecast_days: ["10", "20", "30"].includes(saved.forecast_days) ? saved.forecast_days : "10",
        custom_days: saved.custom_days || "",
        medicineType: saved.medicineType || "medicine",
      });
    }
  }, []);

  // Save filters - USING CONSTANTS
  useEffect(() => {
    SALES_MODULE_CONSTANTS.saveFilters("salesForecastFilters", filters);
  }, [filters]);

  // Helper function to build endpoint with medicineType
  const buildEndpoint = useCallback((days, page, pageSize, medicineType = '') => {
    let endpoint = apiEndpoints.salesForecast(days, page, pageSize);
    const baseEndpoint = endpoint.split('?')[0];
    const params = new URLSearchParams();
    
    params.append('days', days);
    params.append('page', page);
    params.append('page_size', pageSize);
    
    if (medicineType && medicineType.trim() !== '') {
      params.append('medicineType', medicineType);
    }
    
    const queryString = params.toString();
    return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
  }, []);

  const daysLabel = filters.custom_days ? `${filters.custom_days} Days` : `${filters.forecast_days} Days`;
  const dynamicTitle = useMemo(() => {
    const branchLabel = selectedBranch || currentBusinessName;
    const isCurrent = selectedValue === 'current';

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-full">
            Sales Forecast
          </span>
          <span className="text-xs sm:text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
            {daysLabel}
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
  }, [daysLabel, selectedBranch, selectedValue, currentBusinessName]);

  const fetchData = async () => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) return;

      const days = filters.custom_days || filters.forecast_days;
      const endpoint = buildEndpoint(days, pagination.page, pagination.page_size, filters.medicineType);

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

      const mapped = rawData.map((item, index) => ({
        id: `${item.medicine_id}-${index}`,
        drug_name: item.name || "N/A",
        forecasted_sales: Number(item.forecasted_units) || 0,
        avg_daily_sales: Number(item.avg_daily_sales) || 0,
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
      setError(isNotFound ? "No forecast data available." : SALES_MODULE_CONSTANTS.getErrorMessage(err));
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
      fetchData();
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [filters.custom_days, filters.forecast_days, filters.medicineType, pagination.page, pagination.page_size, selectedBranchId, selectedChildVendorId]);

  const handleFilterChange = useCallback((name, value) => {
    if (name === "branch_id") {
      const selectedOption = branchOptions.find(opt => opt.value === value);
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
  }, [branchOptions, originalBranchId]);

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const columns = useMemo(() => [
    {
      accessorKey: "drug_name",
      header: ({ column }) => <HeaderWithSort column={column} title="Medicine Name" />,
      cell: ({ row }) => <div className="font-medium">{row.original.drug_name}</div>,
    },
    {
      accessorKey: "forecasted_sales",
      header: ({ column }) => <HeaderWithSort column={column} title="Forecasted Units" />,
      cell: ({ row }) => (
        <div className="font-medium">
          {Math.round(row.original.forecasted_sales).toLocaleString()} units
        </div>
      ),
    },
    {
      accessorKey: "avg_daily_sales",
      header: ({ column }) => <HeaderWithSort column={column} title="Avg Daily Sales" />,
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.avg_daily_sales.toFixed(2)} units/day
        </div>
      ),
    },
  ], []);

  const filterFields = useMemo(() => [
    {
      type: "select",
      name: "forecast_days",
      label: "Forecast Days",
      options: [
        { value: "10", label: "10 Days" },
        { value: "20", label: "20 Days" },
        { value: "30", label: "30 Days" },
      ],
      value: filters.forecast_days,
      onChange: (e) => handleFilterChange("forecast_days", e.target.value),
    },
    {
      type: "number",
      name: "custom_days",
      label: "Custom Days",
      placeholder: "e.g. 45",
      min: 1,
      max: 365,
      value: filters.custom_days,
      onChange: (e) => handleFilterChange("custom_days", e.target.value),
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
    ...(isMaster && branchOptions.length > 0 ? [{
      type: "select",
      name: "branch_id",
      label: "Branch",
      placeholder: "Select Branch",
      value: selectedValue,
      onChange: (e) => handleFilterChange("branch_id", e.target.value),
      options: branchOptions,
    }] : []),
  ], [filters, selectedValue, branchOptions, isMaster, handleFilterChange, medicineTypeOptions]);

  const exportDays = filters.custom_days || filters.forecast_days;
  const exportEndpoint = useMemo(() => {
    if (!currentVendorId && !selectedChildVendorId) return null;
    return buildEndpoint(exportDays, 1, 1000, filters.medicineType);
  }, [exportDays, filters.medicineType, buildEndpoint]);

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
        {exportEndpoint && (
          <ExportReports
            endpoint={exportEndpoint}
            data={rows}
            reportType={`Sales Forecast (${daysLabel})`}
            headers={columns.map(col => col.accessorKey)}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
          />
        )}
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
        onRetry={() => fetchData()}
        noDataMessage={rows.length === 0 && !loading && !error ? "No forecast data available" : error}
      />
    </div>
  );
}