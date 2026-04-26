// SEARCH_MODULE_CONSTANTS.jsx - COMPREHENSIVE CONSTANTS FOR SEARCH MODULE
import React from "react";
import { getToken } from "../../../../../services/tokenUtils";
import { createPortal } from "react-dom";
import { HEADER_KEYS, getAuthHeaders, addBranchHeaders } from "../../../../../utils/authConstants";

// ============================================
// SEARCH MODULE SPECIFIC CONSTANTS
// ============================================
export const DEBOUNCE_DELAY = 300;
export const API_TIMEOUT = 15000;

// ============================================
// USER & BRANCH UTILITIES
// ============================================
export const getUserInfo = (user) => ({
  currentVendorId: user?.vendorId || user?.userId || '',
  originalBranchId: user?.currentBranch?.id || user?.branchId || localStorage.getItem('branchId') || '',
  isMaster: user?.isMaster || false,
  currentBusinessName: localStorage.getItem('businessName') || 'Current Branch'
});

export const getBranchOptions = (user, childVendors = []) => {
  const { originalBranchId, currentBusinessName } = getUserInfo(user);
  
  return [
    { value: 'current', label: currentBusinessName, branch_id: originalBranchId },
    ...childVendors.map(item => ({
      value: item.vendor_id,
      label: item.business_name || item.branch_id || `Branch ${item.vendor_id.substring(0, 8)}`,
      branch_id: item.branch_id,
    })),
    { value: 'all', label: 'All Branches' }
  ];
};

export const initializeBranchState = (user, setStateFunctions) => {
  const { currentVendorId, originalBranchId, currentBusinessName } = getUserInfo(user);
  
  setStateFunctions.setSelectedBranch(currentBusinessName);
  setStateFunctions.setSelectedValue('current');
  setStateFunctions.setSelectedChildVendorId('');
  setStateFunctions.setSelectedBranchId(originalBranchId);
};

// ============================================
// API CONTROLLER MANAGEMENT (REPLACES GLOBAL VARS)
// ============================================
export const createApiController = () => {
  const controller = new AbortController();
  return controller;
};

export const cancelApiRequest = (controllerRef) => {
  if (controllerRef.current) {
    controllerRef.current.abort();
  }
};

// ============================================
// HOOKS & STATE MANAGEMENT
// ============================================
export const useBranchInitialization = (user, dependencies = []) => {
  const { originalBranchId, currentBusinessName } = getUserInfo(user);
  
  React.useEffect(() => {
    const businessName = localStorage.getItem('businessName') || 'Current Branch';
    // These would be set by the parent component
  }, [originalBranchId, ...dependencies]);
};

// ============================================
// FILTER & SEARCH UTILITIES
// ============================================
export const createDebouncedEffect = (callback, dependencies, delay = DEBOUNCE_DELAY) => {
  const timerRef = React.useRef(null);
  const controllerRef = React.useRef(null);
  
  React.useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (controllerRef.current) controllerRef.current.abort();
    
    timerRef.current = setTimeout(() => {
      callback(controllerRef);
    }, delay);
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, dependencies);
};

export const handleFilterChange = (name, value, setters, fullBranchOptions, currentVendorId, originalBranchId) => {
  if (name === "branch_id") {
    const selectedOption = fullBranchOptions.find(opt => opt.value === value);
    if (!selectedOption) return;

    setters.setSelectedValue(value);
    setters.setSelectedBranch(selectedOption.label);
    setters.setPagination(p => ({ ...p, page: 1 }));

    if (value === 'current') {
      setters.setSelectedChildVendorId('');
      setters.setSelectedBranchId(originalBranchId);
    } else if (value === 'all') {
      setters.setSelectedChildVendorId('');
      setters.setSelectedBranchId('');
    } else {
      setters.setSelectedChildVendorId(value);
      setters.setSelectedBranchId(selectedOption.branch_id);
    }
  } else {
    setters.setSearchParams(prev => ({ ...prev, [name]: value }));
    setters.setPagination(p => ({ ...p, page: 1 }));
  }
};

// ============================================
// COMPONENT UTILITIES
// ============================================
export const HoverTooltip = React.memo(({ text, title = "Details", children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const timerRef = React.useRef(null);

  if (!text || text.trim() === "") return <span className="text-gray-400">—</span>;

  const words = text.trim().split(/\s+/);
  const preview = words.slice(0, 2).join(" ") + (words.length > 2 ? "..." : "");

  const open = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const close = () => {
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const content = children || (
    <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
      {text}
    </p>
  );

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={open}
        onMouseLeave={close}
        className="text-blue-600 hover:underline cursor-help text-sm"
      >
        {preview}
      </span>

      {isOpen && createPortal(
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[999999] pointer-events-none">
          <div 
            onMouseEnter={open}
            onMouseLeave={close}
            className="bg-white rounded-xl shadow-2xl p-6 border border-gray-300 max-w-2xl max-h-[80vh] overflow-y-auto pointer-events-auto"
          >
            <h3 className="font-bold text-lg mb-4 text-center text-gray-800 border-b pb-3">
              {title}
            </h3>
            {content}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});

HoverTooltip.displayName = 'HoverTooltip';

export const createDynamicTitle = (selectedBranch, selectedValue, currentBusinessName, titleText) => {
  const isCurrent = selectedValue === 'current';
  const isAll = selectedValue === 'all';

  return (
    <div className="flex items-center gap-3">
      <span className="text-xl font-semibold text-gray-800">
        {titleText}
      </span>
      <span className="text-gray-500">—</span>
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold shadow-sm ${
        isCurrent 
          ? 'bg-green-100 text-green-800 border border-green-300' 
          : isAll 
            ? 'bg-purple-100 text-purple-800 border border-purple-300' 
            : 'bg-blue-100 text-blue-800 border border-blue-300'
      }`}>
        {isCurrent ? currentBusinessName : isAll ? 'All Branches' : `Branch: ${selectedBranch}`}
      </span>
    </div>
  );
};

// ============================================
// ERROR HANDLING
// ============================================
export const getErrorMessage = (err) => {
  const status = err.response?.status;
  
  if (status === 404) return "No records found.";
  if (status === 401) return "Unauthorized. Please log in again.";
  if (status === 403) return "Access denied.";
  if (status === 500) return "Server error. Please try again later.";
  
  return err.response?.data?.message || "An error occurred. Please try again.";
};

export const handleApiError = (err, setError) => {
  if (err.name === 'AbortError') return;
  const isNotFound = err.response?.status === 404;
  setError(isNotFound ? "No records found for this branch." : getErrorMessage(err));
};

// ============================================
// DATA FORMATTING & VALIDATION
// ============================================
export const formatDateDisplay = (dateString) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString.includes(' ') ? dateString.replace(' ', 'T') : dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return "Invalid Date";
  }
};
// ============================================
// DATE FORMATTING - UNIFIED FORMAT
// ============================================
export const formatDate = (dateString, showTime = false) => {
  if (!dateString) return "—";
  
  try {
    let date;
    
    // Handle different date formats from backend
    if (dateString.includes(' ')) {
      // Format: "2026-04-02 10:30:18"
      date = new Date(dateString.replace(' ', 'T'));
    } else if (dateString.includes('T')) {
      // Format: "2026-04-14T13:23:28.971000"
      date = new Date(dateString);
    } else {
      // Format: "2026-04-21" (date only)
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) return "Invalid Date";
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    if (showTime) {
      // Full datetime: "Tue, Apr 14, 2026, 06:23 PM"
      const weekday = dayNames[date.getDay()];
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours === 0 ? 12 : hours;
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      return `${weekday}, ${month} ${day}, ${year}, ${timeStr}`;
    } else {
      // Date only: "Apr 14, 2004"
      return `${month} ${day}, ${year}`;
    }
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
};

export const formatCurrency = (amount) => {
  return Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const validateDateRange = (startDate, endDate, setDateError) => {
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    setDateError("Incorrect date range: Start date cannot be after end date.");
    return false;
  }
  setDateError("");
  return true;
};

// ============================================
// PACKING UTILITIES (FROM medicinttype.jsx)
// ============================================
export const unitTypeLabels = {
  pack: {
    pack_strip: "Strips in a Pack",
    strip_tablet: "Tablets in a Strip",
  },
  bottle: {
    pack_strip: "Tablets in a Bottle",
  },
  liquid: {
    total_pack: "Number of Bottles",
  },
  injection: {
    pack_strip: "Injections in a Box",
  },
  tube: {
    total_pack: "Number of Tubes or Containers",
  },
  unit: {
    total_pack: "Number of Units",
  },
  pack_piece: {
    total_pack: "Number of Packs",
    pack_strip: "Pieces in a Pack",
  },
  strip: {
    total_pack: "Number of Strips",
    strip_tablet: "Tablets in a Strip",
  },
  loose: {
    total_pack: "Number of Tablets",
  },
};

export const inferUnitType = (type, packing) => {
  const t = (type || '').toLowerCase();

  if (t.includes('tablet') || t.includes('capsule') || t.includes('caplet')) {
    if (packing.strip_tablet > 0) return 'pack';
    if (packing.pack_strip > 0) return 'bottle';
    if (packing.total_pack > 0 && packing.total_strip > 0) return 'strip';
    return 'loose';
  } else if (t.includes('syrup') || t.includes('drops') || t.includes('liquid') || t.includes('suspension')) {
    return 'liquid';
  } else if (t.includes('injection') || t.includes('iv')) {
    return 'injection';
  } else if (t.includes('cream') || t.includes('ointment') || t.includes('gel')) {
    return 'tube';
  } else if (t.includes('inhaler') || t.includes('spray') || t.includes('device')) {
    return 'unit';
  } else if (t.includes('diaper') || t.includes('wipe') || t.includes('bundle')) {
    return 'pack_piece';
  } else if (t.includes('powder')) {
    return 'unit';
  } else {
    return null;
  }
};

export const getPackagingPreview = (packing, type) => {
  if (!packing || Object.values(packing).every(val => val === 0)) return "N/A";

  const unitType = inferUnitType(type, packing);
  const labels = unitTypeLabels[unitType] || {};
  let preview = '';

  if (packing.total_pack > 0) {
    preview += `${packing.total_pack} ${labels.total_pack?.slice(0, 3) || 'Pac'}...`;
  } else if (packing.total_strip > 0) {
    preview += `${packing.total_strip} Tot...`;
  }

  return preview || "Vie...";
};

export const getPackagingTable = (packing, type) => {
  if (!packing || Object.values(packing).every(val => val === 0)) {
    return <p className="text-gray-500">No packaging details available.</p>;
  }

  const unitType = inferUnitType(type, packing);
  const labels = unitTypeLabels[unitType] || {};
  const allowedKeys = Object.keys(labels);
  const entries = Object.entries(packing)
    .filter(([key, val]) => val > 0 && allowedKeys.includes(key));

  if (entries.length === 0) {
    return <p className="text-gray-500">No detailed packaging info.</p>;
  }

  return (
    <table className="w-full text-sm text-left text-gray-700">
      <thead>
        <tr className="bg-gray-100">
          <th className="px-4 py-2 font-bold">Field</th>
          <th className="px-4 py-2 font-bold">Value</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([key, value]) => (
          <tr key={key} className="border-b">
            <td className="px-4 py-2">{labels[key]}</td>
            <td className="px-4 py-2 font-medium">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// ============================================
// MAIN EXPORT OBJECT
// ============================================
export const SEARCH_MODULE_CONSTANTS = {
  // Headers (imported from utils)
  HEADER_KEYS,
  getAuthHeaders,
  addBranchHeaders,
  
  // User & Branch
  getUserInfo,
  getBranchOptions,
  initializeBranchState,
  
  // API Management
  createApiController,
  cancelApiRequest,
  DEBOUNCE_DELAY,
  API_TIMEOUT,
  createDebouncedEffect,
  
  // Filter & State
  handleFilterChange,
  
  // Components
  HoverTooltip,
  createDynamicTitle,
  
  // Error Handling
  getErrorMessage,
  handleApiError,
  
  // Formatting
  formatDateDisplay,
  formatDate,
  formatCurrency,
  validateDateRange,
  
  // Packing
  unitTypeLabels,
  inferUnitType,
  getPackagingPreview,
  getPackagingTable
};

export default SEARCH_MODULE_CONSTANTS;