// Advancesearch.jsx - REFACTORED WITH SEARCH_MODULE_CONSTANTS
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import HomeTable from "../../../common/table/Table";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { useLocation } from "react-router-dom";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/search/searchend";
import ExportReports from "../../../common/reports/ExportReports";
import { NO_RECORD_FOUND } from "../../../constants/Messages";
import { useAuth } from "../../../auth/hooks/useAuth";
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { SEARCH_MODULE_CONSTANTS } from "././searchconstants/searchModuleConstants";

export default function AdvancedSearchTable() {
  // Refs for cleanup
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const { user } = useAuth();
  const location = useLocation();

  // State
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Branch state
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedChildVendorId, setSelectedChildVendorId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // Search params
  const [searchParams, setSearchParams] = useState({
    drug_name: "",
    manufacturer: "",
    form: "",
    indication: "",
    side_effects: "",
    available: "",
    age_restriction: "",
    prescription_required: "",
    expiry_after: "",
    expiry_before: "",
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
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

// Dynamic title (custom for this component) - FIXED: Made responsive
const dynamicTitle = useMemo(() => {
  const branchLabel = selectedBranch;
  const isCurrent = selectedValue === currentVendorId;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-full">
          Advanced Medicine Search
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
  const fetchData = async () => {
    SEARCH_MODULE_CONSTANTS.cancelApiRequest(controllerRef);
    controllerRef.current = new AbortController();

    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);

      const token = getToken();
      const activeParams = Object.fromEntries(
        Object.entries(searchParams).filter(([_, v]) => v !== "")
      );

      const endpoint = apiEndpoints.advancedSearch(activeParams, pagination.page, pagination.page_size);

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
        signal: controllerRef.current.signal 
      });

      if (!isMountedRef.current) return;

      const rawData = data?.data ?? [];
      const pag = data?.pagination ?? {};

const mapped = rawData.map((d, i) => ({
  id: `${d.medicine_id}-${i}`,
  drug_name: d.name || "N/A",
  manufacturer: d.manufacturer || "—",
  strength: d.strength || "—",
  form: d.type || "—",
  price: Number(d.sale_price) || 0,
  stock: Number(d.stock) || 0,
  prescription_required: d.prescriptions_required ? "Yes" : "No",  
  age_restriction: d.age_restrictions || "None",  
  batch_code: d.batch_code || "—",
  expiry_date: SEARCH_MODULE_CONSTANTS.formatDate(d.expiry_date, false), // FIXED: Use formatDate
  uses: d.uses ?? "",
  dosage: d.dosage ?? "",
  side_effects: d.side_effects ?? "",
  warnings: d.warnings ?? "",
}));

      setDrugs(mapped);
      setPagination(p => ({
        ...p,
        total: pag.total_records ?? rawData.length ?? 0,
      }));
    } catch (err) {
      if (!isMountedRef.current) return;
      SEARCH_MODULE_CONSTANTS.handleApiError(err, setError);
      setDrugs([]);
      setPagination(p => ({ ...p, total: 0 }));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Debounced effect using constants
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    SEARCH_MODULE_CONSTANTS.cancelApiRequest(controllerRef);

    timerRef.current = setTimeout(() => {
      fetchData();
    }, SEARCH_MODULE_CONSTANTS.DEBOUNCE_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchParams, pagination.page, pagination.page_size, selectedBranchId, selectedChildVendorId]);

  // Success message from location state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Filter change handler using constants
  const handleFilterChange = useCallback((name, value) => {
    SEARCH_MODULE_CONSTANTS.handleFilterChange(
      name, 
      value, 
      {
        setSelectedValue,
        setSelectedBranch,
        setSelectedChildVendorId,
        setSelectedBranchId,
        setSearchParams,
        setPagination
      },
      fullBranchOptions,
      currentVendorId,
      originalBranchId
    );
  }, [fullBranchOptions, currentVendorId, originalBranchId]);

  // Pagination change handler
  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchData();
  };

  // Columns
  const columns = useMemo(() => [
    { 
      accessorKey: "drug_name", 
      header: ({ column }) => <HeaderWithSort column={column} title="Medicine Name" />, 
      cell: ({ row }) => <div className="font-medium">{row.original.drug_name}</div> 
    },
    { 
      accessorKey: "manufacturer", 
      header: "Manufacturer", 
      cell: ({ row }) => <div className="font-medium">{row.original.manufacturer}</div> 
    },
    { 
      accessorKey: "strength", 
      header: "Strength", 
      cell: ({ row }) => <div className="font-medium">{row.original.strength}</div> 
    },
    { 
      accessorKey: "form", 
      header: "Form", 
      cell: ({ row }) => <div className="font-medium">{row.original.form}</div> 
    },
    { 
      accessorKey: "batch_code", 
      header: "Batch", 
      cell: ({ row }) => <div className="font-medium">{row.original.batch_code}</div> 
    },
    { 
      accessorKey: "expiry_date", 
      header: "Expiry", 
      cell: ({ row }) => <div className="font-medium">{row.original.expiry_date}</div> 
    },
    { 
      accessorKey: "prescription_required", 
      header: "Rx", 
      cell: ({ row }) => (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${row.original.prescription_required === "Yes" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-700"}`}>
          {row.original.prescription_required}
        </span>
      )
    },
    { 
      accessorKey: "age_restriction", 
      header: "Age Restricted", 
      cell: ({ row }) => (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${row.original.age_restriction === "Yes" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
          {row.original.age_restriction}
        </span>
      )
    },
    { 
      accessorKey: "price", 
      header: ({ column }) => <HeaderWithSort column={column} title="Price" />, 
      cell: ({ row }) => <div className="font-medium">₨ {row.original.price.toFixed(2)}</div> 
    },
    { 
      accessorKey: "stock", 
      header: ({ column }) => <HeaderWithSort column={column} title="Stock" />, 
      cell: ({ row }) => <div className="font-medium">{row.original.stock}</div> 
    },
  ], []);

  // Filter fields
  const filterFields = useMemo(() => [
    {
      type: "dateRange", 
      label: "Expiry Date Range", 
      fromName: "expiry_after", 
      toName: "expiry_before",
      value: { expiry_after: searchParams.expiry_after, expiry_before: searchParams.expiry_before },
      onChange: (e) => handleFilterChange(e.target.name, e.target.value),
    },
    { 
      type: "text", 
      name: "drug_name", 
      label: "Medicine Name", 
      placeholder: "e.g. Panadol, Brufen", 
      value: searchParams.drug_name, 
      onChange: (e) => handleFilterChange("drug_name", e.target.value) 
    },
    { 
      type: "text", 
      name: "manufacturer", 
      label: "Manufacturer", 
      placeholder: "e.g. GSK, Pfizer", 
      value: searchParams.manufacturer, 
      onChange: (e) => handleFilterChange("manufacturer", e.target.value) 
    },
    { 
      type: "text", 
      name: "form", 
      label: "Form", 
      placeholder: "tablet, syrup, injection", 
      value: searchParams.form, 
      onChange: (e) => handleFilterChange("form", e.target.value) 
    },
    // { 
    //   type: "text", 
    //   name: "side_effects", 
    //   label: "Side Effects", 
    //   placeholder: "headache, nausea", 
    //   value: searchParams.side_effects, 
    //   onChange: (e) => handleFilterChange("side_effects", e.target.value) 
    // },
    {
      type: "select", 
      name: "prescription_required", 
      label: "Prescription Required", 
      value: searchParams.prescription_required,
      onChange: (e) => handleFilterChange("prescription_required", e.target.value),
      options: [{ value: "true", label: "Yes (Rx Required)" }, { value: "false", label: "No (OTC)" }],
    },
    {
      type: "number", 
      name: "age_restriction", 
      label: "Age Restricted", 
      value: searchParams.age_restriction,
      onChange: (e) => handleFilterChange("age_restriction", e.target.value),
      
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
  ], [searchParams, selectedValue, fullBranchOptions, handleFilterChange, isMaster]);

  // Export endpoint
  const exportEndpoint = useMemo(() => {
    if (!currentVendorId && !selectedChildVendorId) return null;
    const activeParams = Object.fromEntries(Object.entries(searchParams).filter(([_, v]) => v !== ""));
    return apiEndpoints.advancedSearch(activeParams, 1, 1000);
  }, [searchParams, selectedChildVendorId, currentVendorId]);

  return (
    <div className="relative">
   <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
  {exportEndpoint && (
    <ExportReports
      endpoint={exportEndpoint}
      data={drugs}
      reportType="Advanced Drug Search"
      headers={columns.map(col => col.accessorKey)}
      loading={loading}
      setLoading={setLoading}
      setError={setError}
    />
  )}
</div>

      <div>
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 mx-4">
            {successMessage}
          </div>
        )}

        <HomeTable
          title={dynamicTitle}
          data={drugs}
          columns={columns}
          filterFields={filterFields}
          onFilterChange={handleFilterChange}
          defaultFilters={searchParams}
          addButtonPath="/admin-vendors/pharmacy-management/search/advance-search/new"
          hideDefaultActions={false}
          loading={loading}
          serverSideFiltering={true}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          error={error}
          onRetry={handleRetry}
          noDataMessage={drugs.length === 0 && !loading && !error ? NO_RECORD_FOUND : error}
        />
      </div>
    </div>
  );
}