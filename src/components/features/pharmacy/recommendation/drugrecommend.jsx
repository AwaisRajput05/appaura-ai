// drugrecommend.jsx - REFACTORED WITH CONSTANTS - FULLY RESPONSIVE
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../../auth/hooks/useAuth";
import HomeTable from "../../../common/table/Table";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { useLocation } from "react-router-dom";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/recommendation/recommendationEnd";
import ExportReports from "../../../common/reports/ExportReports";
import { getVendorChildIds } from "../../../../services/vendorUtils";

// Import constants
import { RECOMMENDATION_MODULE_CONSTANTS } from './recommendationconstants/recommendationModuleConstants';

// Extract frequently used constants
const { 
  ENUMS, 
  ERROR_MESSAGES, 
  DEFAULT_VALUES,
  getAuthHeaders,
  addBranchHeaders,
  getUserInfo,
  getBranchOptions,
  getErrorMessage,
  truncateText 
} = RECOMMENDATION_MODULE_CONSTANTS;

// HoverTooltip Component (shared) - FIXED: Responsive
const HoverTooltip = ({ text, title = "Details" }) => {
  if (!text || text.trim() === "") return <span className="text-gray-400">—</span>;

  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef(null);

  const open = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  }, []);

  const preview = truncateText(text, 30);

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={open}
        onMouseLeave={close}
        className="text-blue-600 hover:underline cursor-help text-xs sm:text-sm"
      >
        {preview}
      </span>

      {isOpen && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-none p-4">
          <div 
            onMouseEnter={open}
            onMouseLeave={close}
            className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-300 max-w-2xl max-h-[80vh] overflow-y-auto pointer-events-auto"
          >
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-center text-gray-800 border-b pb-2 sm:pb-3">
              {title}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
              {text}
            </p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default function DrugRecommend() {
  const { user, selectBranch } = useAuth();
  const location = useLocation();

  // State management
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [filters, setFilters] = useState(DEFAULT_VALUES.FILTERS);
  const [pagination, setPagination] = useState(DEFAULT_VALUES.PAGINATION);

  // Branch state
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedChildVendorId, setSelectedChildVendorId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // Refs for cleanup
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Get user info using constants
  const { 
    currentVendorId, 
    originalBranchId, 
    isMaster, 
    currentBusinessName 
  } = useMemo(() => getUserInfo(user), [user]);

  const childVendors = useMemo(() => getVendorChildIds() || [], []);
  const fullBranchOptions = useMemo(() => 
    getBranchOptions(user, childVendors), 
    [user, childVendors]
  );

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

  // Dynamic title - FIXED: Responsive
  // Dynamic title - FIXED: Better wrapping on tablet
const dynamicTitle = useMemo(() => {
  const branchLabel = selectedBranch || currentBusinessName;
  const isCurrent = selectedValue === 'current';

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 pr-16 sm:pr-0">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <span className="text-lg sm:text-xl font-semibold text-gray-800">
          Medicine Recommendation (Alternatives)
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

  // Fetch drugs function
  const fetchDrugs = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);

      // Get headers using constants
      const headers = getAuthHeaders();
      addBranchHeaders(headers, selectedBranchId, selectedChildVendorId, currentVendorId);

      const endpoint = apiEndpoints.DrugRecommend(
        (filters.indication || ENUMS.DEFAULT_INDICATIONS[0]).trim(),
        (filters.exclude_drug || "").trim(),
        pagination.page,
        pagination.page_size
      );

      const { data } = await apiService.get(endpoint, {
        headers,
        signal: controllerRef.current.signal,
        timeout: 30000
      });

      if (!isMountedRef.current) return;

      const list = data?.data ?? [];
      const meta = data?.pagination ?? {};

      if (!Array.isArray(list)) {
        setDrugs([]);
        setPagination(p => ({ ...p, total: 0 }));
        return;
      }

      const mapped = list.map((item) => ({
        id: item.medicine_id || Date.now(),
        drug_name: item.name || 'Unknown',
        manufacturer: item.manufacturer || 'N/A',
        strength: item.strength || '',
        form: item.type || 'Tablet',
        price: Number(item.retail_price || item.price || 0),
        stock: Number(item.stock || 0),
        side_effects: item.side_effects || '',
        age: item.age_restrictions || 'N/A',
      }));

      setDrugs(mapped);
      setPagination(p => ({ 
        ...p, 
        total: meta.total_records ?? list.length ?? 0 
      }));
    } catch (err) {
      if (!isMountedRef.current) return;
      if (err.name === 'AbortError') return;

      const errorMsg = getErrorMessage(err) || ERROR_MESSAGES.NO_ALTERNATIVES;
      setError(errorMsg);
      setDrugs([]);
      setPagination(p => ({ ...p, total: 0 }));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [filters, pagination, selectedBranchId, selectedChildVendorId, currentVendorId]);

  // Debounced fetch effect
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (controllerRef.current) controllerRef.current.abort();

    timerRef.current = setTimeout(() => {
      fetchDrugs();
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    filters.indication,
    filters.exclude_drug,
    pagination.page,
    pagination.page_size,
    selectedBranchId,
    selectedChildVendorId
  ]);

  // Handle location state for success messages
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(null), 5000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle filter changes
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
      
      if (!isMainBranch && selectBranch) {
        selectBranch({
          branchId: selectedOption.branch_id,
          branchName: selectedOption.label,
          vendorId: value,
          applicationRoles: []
        });
      }
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
      setPagination(p => ({ ...p, page: 1 }));
    }
  }, [fullBranchOptions, selectBranch]);

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchDrugs();
  }, [fetchDrugs]);

  // Table columns - FIXED: Responsive text
  const columns = useMemo(() => [
    { 
      accessorKey: "drug_name", 
      header: ({ column }) => <HeaderWithSort column={column} title="Alternative Medicine" />, 
      cell: ({ row }) => <div className="font-medium text-sm sm:text-base">{row.original.drug_name}</div> 
    },
    { 
      accessorKey: "form", 
      header: ({ column }) => <HeaderWithSort column={column} title="Form" />, 
      cell: ({ row }) => <span className="font-medium text-xs sm:text-sm">{row.original.form}</span> 
    },
    { 
      accessorKey: "price", 
      header: ({ column }) => <HeaderWithSort column={column} title="Retail Price" />, 
      cell: ({ row }) => <div className="font-medium text-xs sm:text-sm">₨ {row.original.price.toFixed(2)}</div> 
    },
    { 
      accessorKey: "stock", 
      header: ({ column }) => <HeaderWithSort column={column} title="Stock" />, 
      cell: ({ row }) => {
        const stock = row.original.stock;
        const isLow = stock < 50;
        return <div className={`font-medium text-xs sm:text-sm ${isLow ? 'text-red-600' : 'text-gray-700'}`}>{stock}</div>;
      }
    },
    { 
      accessorKey: "age", 
      header: ({ column }) => <HeaderWithSort column={column} title="Age Restrictions" />, 
      cell: ({ row }) => <div className="font-medium text-xs sm:text-sm">{row.original.age}</div> 
    },
    { 
      accessorKey: "side_effects", 
      header: "Side Effects", 
      cell: ({ row }) => <HoverTooltip text={row.original.side_effects} title="Side Effects" /> 
    },
  ], []);

  // Filter fields - FIXED: Add className for responsive width
  const filterFields = useMemo(() => {
    const baseFields = [
      {
        type: "select",
        name: "indication",
        label: "Indication",
        value: filters.indication || '',
        onChange: (e) => handleFilterChange("indication", e.target.value),
        options: ENUMS.DEFAULT_INDICATIONS.map(indication => ({
          value: indication,
          label: indication.charAt(0).toUpperCase() + indication.slice(1)
        })),
        className: "w-full sm:w-auto",
      },
      {
        type: "text",
        name: "exclude_drug",
        label: "Exclude Drug (optional)",
        placeholder: "e.g., Panadol, Brufen",
        value: filters.exclude_drug || '',
        onChange: (e) => handleFilterChange("exclude_drug", e.target.value),
        className: "w-full sm:w-auto",
      },
    ];

    if (isMaster && fullBranchOptions.length > 0) {
      baseFields.push({
        type: "select",
        name: "branch_id",
        label: "Branch",
        placeholder: "Select Branch",
        value: selectedValue,
        onChange: (e) => handleFilterChange("branch_id", e.target.value),
        options: fullBranchOptions,
        className: "w-full sm:w-auto",
      });
    }

    return baseFields;
  }, [filters, selectedValue, fullBranchOptions, isMaster, handleFilterChange]);

  // Export endpoint
  const exportEndpoint = useMemo(() => {
    return apiEndpoints.DrugRecommend(
      (filters.indication || ENUMS.DEFAULT_INDICATIONS[0]).trim(),
      (filters.exclude_drug || "").trim(),
      1,
      1000
    );
  }, [filters.indication, filters.exclude_drug]);

  return (
    <div className="relative">
   

      {/* Success Message - FIXED: Responsive */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-xl mb-4 mx-2 sm:mx-0 flex items-center justify-between">
          <span className="text-xs sm:text-sm">{successMessage}</span>
          <button 
            onClick={() => setSuccessMessage(null)} 
            className="text-green-700 hover:text-green-900 font-bold text-lg sm:text-xl ml-2"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      <HomeTable
        title={dynamicTitle}
        data={drugs}
        columns={columns}
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
        pagination={{ 
          page: pagination.page, 
          page_size: pagination.page_size, 
          total: pagination.total || 0 
        }}
        onPaginationChange={handlePaginationChange}
        addButtonName="RECOMMEND ANOTHER"
        addButtonPath="/admin-vendors/pharmacy-management/recommendation"
        hideDefaultActions
        loading={loading}
        serverSideFiltering={true}
        error={error}
        onRetry={handleRetry}
        noDataMessage={drugs.length === 0 && !loading && !error ? ERROR_MESSAGES.NO_ALTERNATIVES : error}
      />
    </div>
  );
}