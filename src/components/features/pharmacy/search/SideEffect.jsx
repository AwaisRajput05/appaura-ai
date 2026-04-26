// SideEffect.jsx - REFACTORED WITH SEARCH_MODULE_CONSTANTS
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import HomeTable from "../../../common/table/Table";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/search/searchend";
import ExportReports from "../../../common/reports/ExportReports";
import { NO_RECORD_FOUND } from "../../../constants/Messages";
import { useAuth } from "../../../auth/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { SEARCH_MODULE_CONSTANTS } from "././searchconstants/searchModuleConstants";

export default function SideEffectTable() {
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
  const [searchSideEffect, setSearchSideEffect] = useState("");

  // Branch state
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedChildVendorId, setSelectedChildVendorId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

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

 // Dynamic title (custom for this component) - FIXED: Made responsive
const dynamicTitle = useMemo(() => {
  const branchLabel = selectedBranch;
  const isCurrent = selectedValue === currentVendorId;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-full">
          Find Medicine by Side Effects
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
  const fetchDrugsBySideEffect = async () => {
    SEARCH_MODULE_CONSTANTS.cancelApiRequest(controllerRef);
    controllerRef.current = new AbortController();

    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const effect = searchSideEffect.trim();
      const endpoint = apiEndpoints.searchBySideEffect(effect, pagination.page, pagination.page_size);

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
        signal: controllerRef.current.signal, 
        timeout: SEARCH_MODULE_CONSTANTS.API_TIMEOUT 
      });

      if (!isMountedRef.current) return;

      const rawData = data?.data ?? [];
      const pag = data?.pagination ?? {};

      if (!Array.isArray(rawData)) {
        setDrugs([]);
        setPagination((p) => ({ ...p, total: 0 }));
        return;
      }

      const mapped = rawData.map((d, i) => ({
        id: `${d.medicine_id}-${i}`,
        drug_name: d.name || "N/A",
        side_effects: d.side_effects || "N/A",
        price: Number(d.sale_price) || 0,
        stock: Number(d.stock) || 0,
        manufacturer: d.manufacturer || "—",
        form: d.type || "—",
        batch_code: d.batch_code || "—",
        expiry_date: d.expiry_date || "—",
        added_date: d.added_date ?? '',
        dosage: d.dosage ?? "",
        uses: d.uses ?? "",
        warnings: d.warnings ?? "",
      }));

      setDrugs(mapped);
      setPagination((p) => ({
        ...p,
        total: pag.total_records ?? rawData.length ?? 0,
      }));
    } catch (err) {
      if (!isMountedRef.current) return;
      SEARCH_MODULE_CONSTANTS.handleApiError(err, setError);
      setDrugs([]);
      setPagination((p) => ({ ...p, total: 0 }));
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
      fetchDrugsBySideEffect();
    }, SEARCH_MODULE_CONSTANTS.DEBOUNCE_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchSideEffect, pagination.page, pagination.page_size, selectedBranchId, selectedChildVendorId]);

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
    if (name === "side_effects") {
      setSearchSideEffect(value);
      setPagination(p => ({ ...p, page: 1 }));
    } else if (name === "branch_id") {
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
    }
  }, [fullBranchOptions, currentVendorId, originalBranchId]);

  // Pagination change handler
  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination((p) => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchDrugsBySideEffect();
  };

  // Columns
  const columns = useMemo(() => [
    {
      accessorKey: "drug_name",
      header: ({ column }) => <HeaderWithSort column={column} title="Medicine Name" />,
      cell: ({ row }) => <div className="font-medium">{row.original.drug_name}</div>,
    },
    {
      accessorKey: "side_effects",
      header: ({ column }) => <HeaderWithSort column={column} title="Side Effects" />,
      cell: ({ row }) => (
        <SEARCH_MODULE_CONSTANTS.HoverTooltip 
          text={row.original.side_effects} 
          title={row.original.drug_name + " - Side Effects"} 
        />
      ),
    },
    {
      accessorKey: "manufacturer",
      header: "Manufacturer",
      cell: ({ row }) => <div className="font-medium">{row.original.manufacturer}</div>,
    },
    {
      accessorKey: "form",
      header: "Form",
      cell: ({ row }) => <div className="font-medium">{row.original.form}</div>,
    },
    {
      accessorKey: "batch_code",
      header: "Batch",
      cell: ({ row }) => <div className="font-medium">{row.original.batch_code}</div>,
    },
    {
      accessorKey: "expiry_date",
      header: "Expiry",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.expiry_date ? SEARCH_MODULE_CONSTANTS.formatDateDisplay(row.original.expiry_date) : '—'}
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => <HeaderWithSort column={column} title="Price" />,
      cell: ({ row }) => <div className="font-medium">₨ {row.original.price.toFixed(2)}</div>,
    },
    {
      accessorKey: "stock",
      header: ({ column }) => <HeaderWithSort column={column} title="Stock" />,
      cell: ({ row }) => <div className="text-sm font-medium">{row.original.stock}</div>,
    },
    {
      accessorKey: "added_date",
      header: ({ column }) => <HeaderWithSort column={column} title="Created Date" />,
      cell: ({ row }) => (
        <div>
          {row.original.added_date ? SEARCH_MODULE_CONSTANTS.formatDateDisplay(row.original.added_date) : 'N/A'}
        </div>
      ),
    }
  ], []);

  // Filter fields
  const filterFields = useMemo(() => [
    {
      type: "text",
      name: "side_effects",
      label: "Exclude Side Effects",
      placeholder: "e.g. headache, nausea, dizziness",
      value: searchSideEffect,
      onChange: (e) => handleFilterChange("side_effects", e.target.value),
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
  ], [searchSideEffect, selectedValue, fullBranchOptions, isMaster]);

  // Export endpoint
  const exportEndpoint = useMemo(() => {
    return apiEndpoints.searchBySideEffect(searchSideEffect.trim(), 1, 1000);
  }, [searchSideEffect]);

  return (
    <div className="relative">
  <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
  <ExportReports
    endpoint={exportEndpoint}
    data={drugs}
    reportType="Find Medicine by Side Effects"
    headers={columns.map((col) => col.accessorKey)}
    loading={loading}
    setLoading={setLoading}
    setError={setError}
  />
</div>

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
        addButtonPath="/admin-vendors/pharmacy-management/search/side-effect/new"
        hideDefaultActions={false}
        loading={loading}
        serverSideFiltering={true}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        error={error}
        onRetry={handleRetry}
        noDataMessage={
          drugs.length === 0 && !loading && !error
            ? "Enter a side effect to search medicines"
            : error
        }
      />
    </div>
  );
}