// salesModuleConstants.jsx - ENHANCED VERSION
import { getToken } from "../../../../../services/tokenUtils";
import { HEADER_KEYS, getAuthHeaders, addBranchHeaders, createAbortController, isAbortError } from "../../../../../utils/authConstants";

// ============================================
// MEDICINE TYPE OPTIONS
// ============================================
export const MEDICINE_TYPE_OPTIONS = [
  { value: "medicine", label: "Medicine" },
   { value: "local", label: "Local Medicine" },
  { value: "general", label: "General Items" },
 
];

// Add this to salesModuleConstants.jsx after formatDateForDisplay

export const formatDate = (dateString, showTime = false) => {
  if (!dateString) return "—";
  if (dateString === "N/A") return "N/A";
  
  try {
    let date;
    
    // Handle different date formats from backend
    if (typeof dateString === 'string') {
      // Format: "2026-07-12" (date only)
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(dateString + 'T00:00:00');
      }
      // Format: "2026-04-15 05:55:53" (with space)
      else if (dateString.includes(' ')) {
        date = new Date(dateString.replace(' ', 'T'));
      }
      // Format: "2026-04-14T13:23:28.971000" (ISO)
      else if (dateString.includes('T')) {
        date = new Date(dateString);
      }
      // Fallback
      else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    if (showTime) {
      const weekday = dayNames[date.getDay()];
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours === 0 ? 12 : hours;
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      return `${weekday}, ${month} ${day}, ${year}, ${timeStr}`;
    } else {
      return `${month} ${day}, ${year}`;
    }
  } catch (error) {
    console.error('Date formatting error:', error, 'for value:', dateString);
    return dateString;
  }
};


// Add this after formatDate function
export const formatPeriod = (period, timePeriod = "month") => {
  if (!period) return "N/A";
  
  // Handle YYYY-MM format (Monthly) - like "2026-01"
  if (period.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = period.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
  
  // Handle YYYY-MM-DD format (Daily/Weekly)
  if (period.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return formatDate(period, false);
  }
  
  // Handle YYYY format (Yearly)
  if (period.match(/^\d{4}$/)) {
    return period;
  }
  
  return period;
};
// ============================================
// USER INFO UTILITIES
// ============================================
export const getUserInfo = (user) => ({
  currentVendorId: user?.vendorId || user?.userId || '',
  originalBranchId: user?.currentBranch?.id || user?.branchId || localStorage.getItem('branchId') || '',
  isMaster: user?.isMaster || false,
  currentBusinessName: localStorage.getItem('businessName') || 'Current Branch'
});

export const getCurrentVendorId = (user) => user?.vendorId || user?.userId || '';
export const getOriginalBranchId = (user) => user?.currentBranch?.id || user?.branchId || localStorage.getItem('branchId') || '';
export const isUserMaster = (user) => user?.isMaster || false;

// ============================================
// BRANCH OPTIONS UTILITIES
// ============================================
export const getBranchOptions = (user, childVendors = []) => {
  const { originalBranchId, currentBusinessName } = getUserInfo(user);
  
  return [
    { value: 'current', label: currentBusinessName, branch_id: originalBranchId },
    ...childVendors.map(item => ({
      value: item.vendor_id,
      label: item.business_name || item.branch_id || `Branch ${item.vendor_id.substring(0, 8)}`,
      branch_id: item.branch_id,
    })),
  ];
};

// For "All Branches" option
export const getBranchOptionsWithAll = (user, childVendors = []) => {
  const options = getBranchOptions(user, childVendors);
  return [
    ...options,
    { value: 'all', label: 'All Branches' }
  ];
};

// ============================================
// DATE UTILITIES
// ============================================
export const getStartOfWeek = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  date.setDate(date.getDate() + diff);
  return date;
};

export const getStartOfMonth = (d) => {
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

export const getYesterday = (d) => {
  const date = new Date(d);
  date.setDate(date.getDate() - 1);
  return date;
};

export const formatDateToISO = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split('T')[0];
};

export const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const getDefaultDates = () => {
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const today = currentDate;
  
  return {
    startOfMonth: startOfMonth.toISOString().split('T')[0],
    today: today.toISOString().split('T')[0]
  };
};

export const formatLocalDateTime = (dateString) => {
  if (!dateString) return "—";
  const cleaned = dateString.includes('+00:00') ? dateString.replace('+00:00', 'Z') : dateString + 'Z';
  const date = new Date(cleaned);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleString('en-US', {
    weekday: 'short', 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true
  });
};

// ============================================
// ERROR HANDLING
// ============================================
export const getErrorMessage = (err) => {
  if (isAbortError(err)) return "Request cancelled";
  
  const status = err.response?.status;
  
  if (status === 404) return;
  if (status === 401) return "Unauthorized. Please log in again.";
  if (status === 403) return "Access denied.";
  if (status === 500) return "Server error. Please try again later.";
  
  return err.response?.data?.message ;
};

export const handleApiError = (err, setError, setLoading = null) => {
  if (isAbortError(err)) return;
  
  setError(getErrorMessage(err));
  if (setLoading) setLoading(false);
};

// ============================================
// SUCCESS & LOADING UTILITIES
// ============================================
export const showSuccess = (setSuccess, message = "Operation completed successfully!", duration = 5000) => {
  setSuccess(message);
  setTimeout(() => setSuccess(null), duration);
};

export const showError = (setError, message, duration = 5000) => {
  setError(message);
  setTimeout(() => setError(''), duration);
};

export const withLoading = async (setLoading, asyncFn) => {
  setLoading(true);
  try {
    await asyncFn();
  } finally {
    setLoading(false);
  }
};

// ============================================
// FILTER UTILITIES
// ============================================
export const loadSavedFilters = (key) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    localStorage.removeItem(key);
    return null;
  }
};

export const saveFilters = (key, filters) => {
  localStorage.setItem(key, JSON.stringify(filters));
};

// ============================================
// FORMATTING UTILITIES
// ============================================
export const formatCurrency = (amount) => {
  return Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatDateForDisplay = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// ============================================
// MAIN EXPORT OBJECT
// ============================================
export const SALES_MODULE_CONSTANTS = {
  // Medicine Type Options
  MEDICINE_TYPE_OPTIONS,
  
  // Headers (imported from utils)
  HEADER_KEYS,
  
  // API & Fetch (imported from utils)
  createAbortController,
  isAbortError,
  getAuthHeaders,
  addBranchHeaders,
  
  // User Info
  getUserInfo,
  getCurrentVendorId,
  getOriginalBranchId,
  isUserMaster,
  
  // Branch Options
  getBranchOptions,
  getBranchOptionsWithAll,
  formatPeriod,
  // Date Utilities
  getStartOfWeek,
  getStartOfMonth,
  getYesterday,
  formatDateToISO,
  getTodayDate,
  getDefaultDates,
  formatLocalDateTime,
  formatDateForDisplay,
  formatDate,
  // Error Handling
  getErrorMessage,
  handleApiError,
  
  // Success & Loading
  showSuccess,
  showError,
  withLoading,
  
  // Filters
  loadSavedFilters,
  saveFilters,
  
  // Formatting
  formatCurrency,
};

export default SALES_MODULE_CONSTANTS;