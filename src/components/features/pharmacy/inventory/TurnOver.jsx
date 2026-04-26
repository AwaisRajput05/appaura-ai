// TurnOver.jsx — REFACTORED WITH INVENTORY CONSTANTS
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import HomeTable from "../../../common/table/Table";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/inventory/inventoryEnd";
import ExportReports from "../../../common/reports/ExportReports";
import { NO_RECORD_FOUND } from "../../../constants/Messages";
import { useAuth } from "../../../auth/hooks/useAuth";
import { getVendorChildIds } from '../../../../services/vendorUtils';

// Import Inventory Constants
import { INVENTORY_MODULE_CONSTANTS } from './inventoryconstants/inventoryModuleConstants';

// Import UI Components
import Alert from '../../../../components/ui/feedback/Alert';

export default function Turnover() {
  const { user } = useAuth();
  const location = useLocation();

  // Refs for cleanup
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);

  // State variables
  const [turnovers, setTurnovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [selectedBranch, setSelectedBranch] = useState("");           // UI label
  const [selectedValue, setSelectedValue] = useState("");             // vendor_id
  const [selectedChildVendorId, setSelectedChildVendorId] = useState(""); // X-Child-Id
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

  const [filters, setFilters] = useState({
    drug_name: "",
  });

  // USE CONSTANTS FOR USER INFO
  const { 
    vendorId: currentVendorId, 
    branchId: originalBranchId, 
    isMaster, 
    businessName: currentBusinessName 
  } = INVENTORY_MODULE_CONSTANTS.getUserInfo(user);

  const childVendors = useMemo(() => getVendorChildIds() || [], []);

  // USE CONSTANTS FOR BRANCH OPTIONS
  const fullBranchOptions = useMemo(() => 
    INVENTORY_MODULE_CONSTANTS.getBranchOptions(user, childVendors), 
    [user, childVendors]
  );

  // Initialize branch state — same as every other page
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

  const dynamicTitle = useMemo(() => {
  const branchLabel = selectedBranch || currentBusinessName;
  const isCurrent = selectedValue === 'current';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[180px] sm:max-w-full">
          Inventory Turnover
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

  const fetchData = async () => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = INVENTORY_MODULE_CONSTANTS.createAbortController();

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) return;

      const endpoint = apiEndpoints.turnover(
        pagination.page,
        pagination.page_size,
        filters.drug_name.trim()
      );

      // USE CONSTANTS FOR AUTH HEADERS
      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, currentVendorId);
      
      // Add branch headers using constants
      INVENTORY_MODULE_CONSTANTS.addBranchHeaders(
        headers, 
        selectedBranchId, 
        selectedChildVendorId, 
        currentVendorId
      );

      const { data } = await apiService.get(endpoint, { 
        headers, 
        signal: controllerRef.current.signal, 
        timeout: 15000 
      });

      if (!isMountedRef.current) return;

      const rawData = data?.data ?? [];
      const pag = data?.pagination ?? {};

      const mapped = rawData.map((item, index) => ({
        id: `${item.name}-${index}`,
        medicine_name: item.name || "N/A",
        turnover_ratio: Number(item.turnover_ratio) || 0,
      }));

      setTurnovers(mapped);
      setPagination(p => ({
        ...p,
        total: pag.total_records ?? pag.total_items ?? mapped.length ?? 0,
      }));
    } catch (err) {
      if (!isMountedRef.current) return;
      
      // USE CONSTANTS FOR ERROR HANDLING
      INVENTORY_MODULE_CONSTANTS.handleApiError(err, setError, setLoading);
      setTurnovers([]);
      setPagination(p => ({ ...p, total: 0 }));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Debounced fetch effect
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (controllerRef.current) controllerRef.current.abort();

    timerRef.current = setTimeout(() => {
      fetchData();
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [filters.drug_name, pagination.page, pagination.page_size, selectedBranchId, selectedChildVendorId]);

  // Handle success message from navigation
  useEffect(() => {
    if (location.state?.message) {
      INVENTORY_MODULE_CONSTANTS.showSuccess(setSuccessMessage, location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
    fetchData();
  };

  const columns = useMemo(() => [
    {
      accessorKey: "medicine_name",
      header: ({ column }) => <HeaderWithSort column={column} title="Medicine Name" />,
      cell: ({ row }) => <div className="font-medium">{row.original.medicine_name}</div>,
    },
    {
      accessorKey: "turnover_ratio",
      header: ({ column }) => <HeaderWithSort column={column} title="Turnover Ratio" />,
      cell: ({ row }) => (
        <div className="text-sm font-medium"> 
          {row.original.turnover_ratio.toFixed(4)}
        </div>
      ),
    },
  ], []);

  const filterFields = useMemo(() => [
    {
      type: "text",
      name: "drug_name",
      label: "Medicine Name",
      placeholder: "e.g. Panadol, Brufen",
      value: filters.drug_name,
      onChange: (e) => handleFilterChange("drug_name", e.target.value),
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
  ], [filters.drug_name, selectedValue, fullBranchOptions, isMaster, handleFilterChange]);

  const exportEndpoint = useMemo(() => {
    return apiEndpoints.turnover(1, 1000, filters.drug_name.trim());
  }, [filters.drug_name]);

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
  <ExportReports
    endpoint={exportEndpoint}
    data={turnovers}
    reportType="Inventory Turnover"
    headers={columns.map(col => col.accessorKey)}
    loading={loading}
    setLoading={setLoading}
    setError={setError}
  />
</div>

   {successMessage && (
  <Alert
    variant="success"
    message={successMessage}
    show={true}
    icon={true}
    onClose={() => setSuccessMessage(null)}
    className="mb-4 mx-2 sm:mx-4"
  />
)}

    {error && (
  <Alert
    variant="error"
    message={error}
    show={true}
    icon={true}
    onClose={() => setError(null)}
    action={handleRetry}
    actionLabel="Retry"
    className="mb-4 mx-2 sm:mx-4"
  />
)}

      <HomeTable
        title={dynamicTitle}
        data={turnovers}
        columns={columns}
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        addButtonName="NEW TURNOVER"
        addButtonPath="/admin-vendors/pharmacy-management/inventory/turnover/new"
        hideDefaultActions
        loading={loading}
        serverSideFiltering={true}
        error={error}
        onRetry={handleRetry}
        noDataMessage={
          turnovers.length === 0 && !loading && !error
            ? NO_RECORD_FOUND
            : error
        }
      />
    </div>
  );
}