// medicineinfo.jsx - REFACTORED WITH SEARCH_MODULE_CONSTANTS
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import HomeTable from "../../../common/table/Table";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/search/searchend";
import { NO_RECORD_FOUND } from "../../../constants/Messages";
import { useAuth } from "../../../auth/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { SEARCH_MODULE_CONSTANTS } from "././searchconstants/searchModuleConstants";

export default function MedicineInfo() {
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
  const [searchMedicineName, setSearchMedicineName] = useState("");

  // Branch state
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedChildVendorId, setSelectedChildVendorId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [currentBusinessName, setCurrentBusinessName] = useState('Current Branch');

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
    isMaster 
  } = SEARCH_MODULE_CONSTANTS.getUserInfo(user);
  
  const childVendors = getVendorChildIds() || [];
  
  // Branch options
  const branchOptions = useMemo(() => 
    childVendors.map(item => ({
      value: item.vendor_id,
      label: item.business_name || item.branch_id || `Branch ${item.vendor_id.substring(0, 8)}`,
      branch_id: item.branch_id,
    })), 
    [childVendors]
  );

  // Initialize business name
  useEffect(() => {
    setCurrentBusinessName(localStorage.getItem('businessName') || 'Current Branch');
  }, []);

  // Initialize branch from auth context
  useEffect(() => {
    const branchIdFromCurrent = user?.currentBranch?.id || originalBranchId;
    const vendorId = user?.currentBranch?.vendorId || currentVendorId;
    const initialValue = vendorId;

    const initialLabel = vendorId === currentVendorId 
      ? currentBusinessName 
      : branchOptions.find(opt => opt.value === vendorId)?.label || 'Selected Branch';

    const initialBranchId = vendorId === currentVendorId 
      ? originalBranchId 
      : branchOptions.find(opt => opt.value === vendorId)?.branch_id || '';

    setSelectedBranch(initialLabel);
    setSelectedValue(initialValue);
    setSelectedChildVendorId(vendorId !== currentVendorId ? vendorId : "");
    setSelectedBranchId(initialBranchId);
  }, [user?.currentBranch, currentVendorId, branchOptions, currentBusinessName, originalBranchId]);

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
          Find Medicine by Name
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
}, [selectedBranch, selectedValue, currentVendorId, currentBusinessName]);

  // Fetch data function
  const fetchDrugsByName = async () => {
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

      const medicineName = searchMedicineName.trim();
      const endpoint = apiEndpoints.fetchgeneralMedicine(medicineName, pagination.page, pagination.page_size);

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
        setPagination(p => ({ ...p, total: 0 }));
        return;
      }

      const mapped = rawData.map((drug, i) => ({
        id: drug.medicine_id,
        drug_name: drug.name || "N/A",
        manufacturer: drug.manufacturer || "N/A",
        strength: drug.strength || "N/A",
        form: drug.type || "N/A",
        uses: drug.uses || "",
        price: Number(drug.sale_price) || 0,
        stock: Number(drug.stock) || 0,
        dosage: drug.dosage ?? "",
        warnings: drug.warnings ?? "",
        side_effects: drug.side_effects ?? "",
        official_website: drug.official_website || "N/A",
        purpose: drug.purpose || "",
        storage_instructions: drug.storage_instructions || "",
        ingredients: drug.ingredients || "",
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
      fetchDrugsByName();
    }, SEARCH_MODULE_CONSTANTS.DEBOUNCE_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchMedicineName, pagination.page, pagination.page_size, selectedBranchId, selectedChildVendorId]);

  // Success message from location state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Custom filter handler for this component
  const handleFilterChange = useCallback((name, value) => {
    if (name === "medicine_name") {
      setSearchMedicineName(value);
      setPagination(p => ({ ...p, page: 1 }));
    } else if (name === "branch_id") {
      const selectedOption = branchOptions.find(opt => opt.value === value);
      const isMainBranch = !value || value === currentVendorId;
      const childId = isMainBranch ? "" : value;
      const branchLabel = value ? selectedOption?.label || 'Selected Branch' : currentBusinessName;
      const branchId = value ? selectedOption?.branch_id || '' : originalBranchId;

      setSelectedChildVendorId(childId);
      setSelectedValue(value || currentVendorId);
      setSelectedBranch(branchLabel);
      setSelectedBranchId(branchId);
      setPagination(p => ({ ...p, page: 1 }));
    }
  }, [branchOptions, currentVendorId, currentBusinessName, originalBranchId]);

  // Pagination change handler
  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchDrugsByName();
  };

  // Columns
  const columns = useMemo(() => [
    {
      accessorKey: "drug_name",
      header: ({ column }) => <HeaderWithSort column={column} title="Medicine Name" />,
      cell: ({ row }) => <div className="font-medium">{row.original.drug_name}</div>,
    },
    {
      accessorKey: "form",
      header: ({ column }) => <HeaderWithSort column={column} title="Form" />,
      cell: ({ row }) => <div className="font-medium">{row.original.form}</div>,
    },
    {
      accessorKey: "uses",
      header: ({ column }) => <HeaderWithSort column={column} title="Uses" />,
      cell: ({ row }) => (
        <SEARCH_MODULE_CONSTANTS.HoverTooltip 
          text={row.original.uses} 
          title="Uses" 
        />
      ),
    },
    {
      accessorKey: "ingredients",
      header: "Ingredients",
      cell: ({ row }) => (
        <SEARCH_MODULE_CONSTANTS.HoverTooltip 
          text={row.original.ingredients} 
          title="Ingredients" 
        />
      ),
    },
    {
      accessorKey: "dosage",
      header: "Dosage",
      cell: ({ row }) => (
        <SEARCH_MODULE_CONSTANTS.HoverTooltip 
          text={row.original.dosage} 
          title="Dosage" 
        />
      ),
    },
    {
      accessorKey: "side_effects",
      header: "Side Effects",
      cell: ({ row }) => (
        <SEARCH_MODULE_CONSTANTS.HoverTooltip 
          text={row.original.side_effects} 
          title="Side Effects" 
        />
      ),
    },
    {
      accessorKey: "warnings",
      header: "Warnings",
      cell: ({ row }) => (
        <SEARCH_MODULE_CONSTANTS.HoverTooltip 
          text={row.original.warnings} 
          title="Warnings" 
        />
      ),
    },
    {
      accessorKey: "purpose",
      header: "Purpose",
      cell: ({ row }) => (
        <SEARCH_MODULE_CONSTANTS.HoverTooltip 
          text={row.original.purpose} 
          title="Purpose" 
        />
      ),
    },
    {
      accessorKey: "storage_instructions",
      header: "Storage Instructions",
      cell: ({ row }) => (
        <SEARCH_MODULE_CONSTANTS.HoverTooltip 
          text={row.original.storage_instructions} 
          title="Storage Instructions" 
        />
      ),
    },
  ], []);

  // Filter fields
  const filterFields = useMemo(() => [
    {
      type: "text",
      name: "medicine_name",
      label: "Medicine Name",
      placeholder: "e.g. panadol, aspirin...",
      value: searchMedicineName,
      onChange: (e) => handleFilterChange("medicine_name", e.target.value),
    },
    // Note: Branch filter commented out in original, kept same
  ], [searchMedicineName, selectedValue, branchOptions, currentVendorId, isMaster]);

  // Export endpoint
  const exportEndpoint = useMemo(() => {
    return apiEndpoints.searchgeneralMedicine(searchMedicineName.trim(), 1, 1000);
  }, [searchMedicineName]);

  return (
    <div className="relative">


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
        addButtonPath="/admin-vendors/pharmacy-management/search/patient-indication/new"
        hideDefaultActions={false}
        loading={loading}
        serverSideFiltering={true}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        error={error}
        onRetry={handleRetry}
        noDataMessage={
          drugs.length === 0 && !loading && !error
            ? "Enter a medicine name to search medicines"
            : error
        }
      />
    </div>
  );
}