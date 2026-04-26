// PrescriptionRequire.jsx - REFACTORED WITH SEARCH_MODULE_CONSTANTS
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

export default function PrescriptionRequireTable() {
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
  const [prescriptionRequired, setPrescriptionRequired] = useState(""); // "", "true", "false"

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
          Find Medicine by Prescription
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
      if (!token) return;

      const value = prescriptionRequired === "true" ? true : prescriptionRequired === "false" ? false : undefined;
      const endpoint = apiEndpoints.searchByPrescription(value, pagination.page, pagination.page_size);

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

      const mapped = rawData.map((d, i) => ({
        id: `${d.medicine_id}-${i}`,
        drug_name: d.name || "N/A",
        prescription_required: d.prescriptions_required === true ? "Yes" : "No",
        manufacturer: d.manufacturer || "—",
        form: d.type || "—",
        strength: d.strength || "—",
        batch_code: d.batch_code || "—",
        expiry_date: d.expiry_date || "—",
        added_date: d.added_date ?? '',
        price: Number(d.sale_price) || 0,
        stock: Number(d.stock) || 0,
        dosage: d.dosage ?? "",
        uses: d.uses ?? "",
        warnings: d.warnings ?? "",
        side_effects: d.side_effects ?? "",
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
      fetchData();
    }, SEARCH_MODULE_CONSTANTS.DEBOUNCE_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [prescriptionRequired, pagination.page, pagination.page_size, selectedBranchId, selectedChildVendorId]);

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
    if (name === "prescription_required") {
      setPrescriptionRequired(value);
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
    fetchData();
  };

  // Columns
  const columns = useMemo(() => [
    {
      accessorKey: "drug_name",
      header: ({ column }) => <HeaderWithSort column={column} title="Medicine Name" />,
      cell: ({ row }) => <div className="font-medium">{row.original.drug_name}</div>,
    },
    {
      accessorKey: "prescription_required",
      header: "Prescription",
      cell: ({ row }) => (
        <span
          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold
            ${row.original.prescription_required === "Yes"
              ? "bg-purple-100 text-purple-800"
              : "bg-gray-100 text-gray-700"
            }`}
        >
          {row.original.prescription_required}
        </span>
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
      cell: ({ row }) => <div className="text-sm capitalize">{row.original.form}</div>,
    },
    {
      accessorKey: "strength",
      header: "Strength",
      cell: ({ row }) => <div className="font-medium">{row.original.strength}</div>,
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
      cell: ({ row }) => <div className="text-sm">₨ {row.original.price.toFixed(2)}</div>,
    },
    {
      accessorKey: "stock",
      header: ({ column }) => <HeaderWithSort column={column} title="Stock" />,
      cell: ({ row }) => <div className="text-sm">{row.original.stock}</div>,
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
      type: "select",
      name: "prescription_required",
      label: "Prescription Required",
      value: prescriptionRequired,
      onChange: (e) => handleFilterChange("prescription_required", e.target.value),
      options: [
      
        { value: "true", label: "Yes (Rx Required)" },
        { value: "false", label: "No (OTC)" },
      ],
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
  ], [prescriptionRequired, selectedValue, fullBranchOptions, isMaster]);

  // Export endpoint
  const exportEndpoint = useMemo(() => {
    const value = prescriptionRequired === "true" ? true : prescriptionRequired === "false" ? false : "";
    return apiEndpoints.searchByPrescription(value, 1, 1000);
  }, [prescriptionRequired]);

  return (
    <div className="relative">
    <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
  <ExportReports
    endpoint={exportEndpoint}
    data={drugs}
    reportType="Find Medicine by Prescription"
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
        addButtonPath="/admin-vendors/pharmacy-management/search/prescription/new"
        hideDefaultActions={false}
        loading={loading}
        serverSideFiltering={true}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        error={error}
        onRetry={handleRetry}
        noDataMessage={drugs.length === 0 && !loading && !error ? "Select prescription type to load medicines" : error}
      />
    </div>
  );
}