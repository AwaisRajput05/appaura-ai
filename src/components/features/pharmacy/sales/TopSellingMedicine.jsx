// TopSellingMedicine.jsx - WITH MEDICINE TYPE FILTER
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

export default function TopSellingMedicine() {
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const { user } = useAuth();
  const location = useLocation();

  const [medicines, setMedicines] = useState([]);
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

  // Helper function to build endpoint with medicineType
  const buildEndpoint = useCallback((page, pageSize, drugName = '', medicineType = '') => {
    let endpoint = apiEndpoints.topSellingDrugs(page, pageSize, drugName);
    const baseEndpoint = endpoint.split('?')[0];
    const params = new URLSearchParams();
    
    params.append('page', page);
    params.append('page_size', pageSize);
    if (drugName && drugName.trim() !== '') {
      params.append('drug_name', drugName);
    }
    if (medicineType && medicineType.trim() !== '') {
      params.append('medicineType', medicineType);
    }
    
    const queryString = params.toString();
    return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
  }, []);

  const dynamicTitle = useMemo(() => {
    const branchLabel = selectedBranch || currentBusinessName;
    const isCurrent = selectedValue === 'current';

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-full">
            Top Selling
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

  const fetchTopSelling = async () => {
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

      const endpoint = buildEndpoint(
        pagination.page,
        pagination.page_size,
        filters.drug_name.trim(),
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
        setMedicines([]);
        setPagination(p => ({ ...p, total: 0 }));
        return;
      }

      const mapped = rawData.map((item, index) => ({
        id: `${item.drug_name}-${index}`,
        drug_name: item.drug_name || "N/A",
        expiry_date: item.batch_code || "N/A",
        sold_items: Number(item.total_sold) || 0,
      }));

      setMedicines(mapped);
      setPagination(p => ({
        ...p,
        total: meta.total_records || mapped.length || 0,
      }));
    } catch (err) {
      if (!isMountedRef.current) return;
      
      if (err.name === 'AbortError') return;
      const isNotFound = err.response?.status === 404;
      setError(isNotFound ? "No top-selling medicines found." : SALES_MODULE_CONSTANTS.getErrorMessage(err));
      setMedicines([]);
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
      fetchTopSelling();
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [
    filters.drug_name,
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
    } else {
      setFilters(p => ({ ...p, [name]: value }));
      setPagination(p => ({ ...p, page: 1 }));
    }
  }, [fullBranchOptions]);

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchTopSelling();
  };

  const columns = useMemo(() => [
    {
      accessorKey: "drug_name",
      header: ({ column }) => <HeaderWithSort column={column} title="Medicine Name" />,
      cell: ({ row }) => <div className="text-sm font-medium">{row.original.drug_name}</div>,
    },
    {
      accessorKey: "expiry_date",
      header: ({ column }) => <HeaderWithSort column={column} title="Batch Code" />,
      cell: ({ row }) => <div className="font-medium">{row.original.expiry_date}</div>,
    },
    {
      accessorKey: "sold_items",
      header: ({ column }) => <HeaderWithSort column={column} title="Sold Items" />,
      cell: ({ row }) => (
        <div className=" font-medium">
          {row.original.sold_items.toLocaleString()}
        </div>
      ),
    },
  ], []);

  const filterFields = useMemo(() => [
    {
      type: "text",
      name: "drug_name",
      label: "Medicine Name",
      placeholder: "Type medicine name...",
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
      value: selectedValue,
      onChange: (e) => handleFilterChange("branch_id", e.target.value),
      options: fullBranchOptions,
    }] : []),
  ], [filters.drug_name, filters.medicineType, selectedValue, fullBranchOptions, isMaster, handleFilterChange, medicineTypeOptions]);

  const exportEndpoint = useMemo(() => {
    return buildEndpoint(1, 1000, filters.drug_name.trim(), filters.medicineType);
  }, [filters.drug_name, filters.medicineType, buildEndpoint]);

  // Success Message Component
  const SuccessMessage = ({ message, onClose }) => (
    <div className="bg-green-100 border border-green-400 text-green-700 px-3 sm:px-6 py-2 sm:py-4 rounded-xl mb-4 sm:mb-6 mx-2 sm:mx-4 flex items-center justify-between shadow-sm">
      <span className="text-xs sm:text-sm md:text-base font-medium truncate max-w-[200px] sm:max-w-full">{message}</span>
      <button
        onClick={onClose}
        className="text-green-800 hover:text-green-900 font-bold text-xl sm:text-2xl leading-none ml-2 flex-shrink-0"
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
          data={medicines}
          reportType="Top Selling Medicines"
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
        data={medicines}
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
        noDataMessage={
          medicines.length === 0 && !loading && !error
            ? "No top-selling medicines found for this branch."
            : error
        }
      />
    </div>
  );
}
