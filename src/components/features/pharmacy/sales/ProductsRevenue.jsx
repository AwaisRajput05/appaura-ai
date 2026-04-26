// ProfitMargin.jsx - WITH MEDICINE TYPE FILTER
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import HomeTable from "../../../common/table/Table";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { useLocation } from "react-router-dom";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/salesend/salesend";
import ExportReports from "../../../common/reports/ExportReports";
import { useAuth } from "../../../auth/hooks/useAuth";
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { SALES_MODULE_CONSTANTS } from "././salesconstants/salesModuleConstants";

export default function ProductsRevenue() {
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const { user } = useAuth();
  const location = useLocation();

  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [filters, setFilters] = useState({ 
    drug_name: "",
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
    setSelectedBranch(currentBusinessName);
    setSelectedValue('current');
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

  // Success message handler
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(null), 5000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

 const dynamicTitle = useMemo(() => {
  const branchLabel = selectedBranch || currentBusinessName;
  const isCurrent = selectedValue === 'current';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-full">
          Products Revenue
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
}, [selectedBranch, selectedValue, currentBusinessName]);

  // Helper function to build endpoint with medicineType parameter
  const buildEndpoint = useCallback((drugName = '', page = 1, pageSize = 10, medicineType = '') => {
    let endpoint = apiEndpoints.drugInventoryProfitMargin(drugName, page, pageSize);
    const baseEndpoint = endpoint.split('?')[0];
    const params = new URLSearchParams();
    
    if (drugName && drugName.trim() !== '') {
      params.append('drug_name', drugName);
    }
    params.append('page', page);
    params.append('page_size', pageSize);
    
    if (medicineType && medicineType.trim() !== '') {
      params.append('medicineType', medicineType);
    }
    
    const queryString = params.toString();
    return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
  }, []);

  const fetchData = async () => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) return;

      const endpoint = buildEndpoint(
        filters.drug_name.trim(),
        pagination.page,
        pagination.page_size,
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

      const rawData = data?.data ?? [];
      const pag = data?.pagination ?? {};

      const mapped = rawData.map(item => ({
        id: `${item.name}-${item.batch_code}-${item.expiry_date}`,
        drug_name: item.name || "Unknown Drug",
        manufacturer: item.manufacturer || "N/A",
        sale_price: Number(item.sale_price) || 0,
        cost_price: Number(item.cost_price) || 0,
        stock: Number(item.stock) || 0,
        item_value: Number(item.item_value) || 0,
        profit_margin: Number(item.profit_margin) || 0,
      }));

      setRevenueData(mapped);
      setPagination(p => ({
        ...p,
        total: pag.total_records ?? pag.total_items ?? mapped.length ?? 0,
      }));
    } catch (err) {
      if (!isMountedRef.current) return;
      
      if (err.name === 'AbortError') return;
      setError(SALES_MODULE_CONSTANTS.getErrorMessage(err));
      setRevenueData([]);
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
  }, [filters.drug_name, filters.medicineType, pagination.page, pagination.page_size, selectedBranchId, selectedChildVendorId]);

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
    } else {
      setFilters(p => ({ ...p, [name]: value }));
      setPagination(p => ({ ...p, page: 1 }));
    }
  }, [fullBranchOptions]);

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const columns = useMemo(() => [
    { accessorKey: "drug_name", header: ({ column }) => <HeaderWithSort column={column} title="Medicine Name" />, cell: ({ row }) => <div className="font-medium">{row.original.drug_name}</div> },
    { accessorKey: "manufacturer", header: ({ column }) => <HeaderWithSort column={column} title="Manufacturer" />, cell: ({ row }) => <div className="font-medium">{row.original.manufacturer}</div> },
    { accessorKey: "sale_price", header: ({ column }) => <HeaderWithSort column={column} title="Sale Price" />, cell: ({ row }) => <div className="font-medium">Rs {row.original.sale_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div> },
    { accessorKey: "cost_price", header: ({ column }) => <HeaderWithSort column={column} title="Cost Price" />, cell: ({ row }) => <div className="font-medium">Rs {row.original.cost_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div> },
    { accessorKey: "stock", header: ({ column }) => <HeaderWithSort column={column} title="Stock" />, cell: ({ row }) => <div className="font-medium">{row.original.stock.toLocaleString()}</div> },
    { accessorKey: "item_value", header: ({ column }) => <HeaderWithSort column={column} title="Total Value" />, cell: ({ row }) => <div className="font-medium">Rs {row.original.item_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div> },
    { accessorKey: "profit_margin", header: ({ column }) => <HeaderWithSort column={column} title="Profit Margin (%)" />, cell: ({ row }) => (
      <div className={`font-medium ${row.original.profit_margin >= 30 ? '' : row.original.profit_margin > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
        {row.original.profit_margin.toFixed(1)}%
      </div>
    )},
  ], []);

  const filterFields = useMemo(() => [
    {
      type: "text",
      name: "drug_name",
      label: "Medicine Name",
      placeholder: "Enter drug name...",
      value: filters.drug_name,
      onChange: (e) => handleFilterChange("drug_name", e.target.value),
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
      placeholder: "Select Branch",
      value: selectedValue,
      onChange: (e) => handleFilterChange("branch_id", e.target.value),
      options: fullBranchOptions,
    }] : []),
  ], [filters.drug_name, filters.medicineType, selectedValue, fullBranchOptions, isMaster, handleFilterChange, medicineTypeOptions]);

  const exportEndpoint = useMemo(() => {
    return buildEndpoint(filters.drug_name.trim(), 1, 1000, filters.medicineType);
  }, [filters.drug_name, filters.medicineType, buildEndpoint]);

 // Success Message Component - FIXED: Made responsive
const SuccessMessage = ({ message, onClose }) => (
  <div className="bg-green-100 border border-green-400 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-xl mb-4 mx-2 sm:mx-4 flex justify-between items-center shadow-sm">
    <span className="text-xs sm:text-sm md:text-base font-medium truncate max-w-[200px] sm:max-w-full">{message}</span>
    <button 
      onClick={onClose} 
      className="font-bold text-xl sm:text-2xl text-green-900 hover:text-green-700 ml-2 flex-shrink-0"
      aria-label="Close"
    >
      ×
    </button>
  </div>
);

  return (
    <div className="relative">
   <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
  <ExportReports
    endpoint={exportEndpoint}
    data={revenueData}
    reportType="Products Revenue & Profit Margin"
    headers={columns.map(col => col.accessorKey)}
    loading={loading}
    setLoading={setLoading}
    setError={setError}
  />
</div>

      {successMessage && (
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setSuccessMessage(null)} 
        />
      )}

      <HomeTable
        title={dynamicTitle}
        data={revenueData}
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
        noDataMessage={revenueData.length === 0 && !loading && !error ? "No revenue data found for this branch." : error}
      />
    </div>
  );
}