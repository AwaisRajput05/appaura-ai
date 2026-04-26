// inventoryModuleConstants.jsx
import { HEADER_KEYS, getAuthHeaders, addBranchHeaders, createAbortController, isAbortError } from "../../../../../utils/authConstants";

// ============================================
// MEDICINE TYPE OPTIONS
// ============================================
export const MEDICINE_TYPE_OPTIONS = [
  { value: "medicine", label: "Medicine" },
  { value: "general", label: "General" },
  { value: "local", label: "Local" }
];

// ============================================
// INVENTORY-SPECIFIC UTILITIES
// ============================================

// API CONSTANTS
export const API_TIMEOUT = 30000; // 30 seconds
export const DEBOUNCE_DELAY = 500; // 500ms debounce

// USER INFO UTILITIES
export const getUserInfo = (user) => ({
  vendorId: user?.vendorId || user?.userId || localStorage.getItem('vendorId') || '',
  branchId: user?.branchId || localStorage.getItem('branchId') || '',
  isMaster: user?.isMaster || false,
  businessName: localStorage.getItem('businessName') || 'Current Branch',
  
  // Aliases for backward compatibility
  currentVendorId: user?.vendorId || user?.userId || localStorage.getItem('vendorId') || '',
  originalBranchId: user?.branchId || localStorage.getItem('branchId') || '',
  currentBusinessName: localStorage.getItem('businessName') || 'Current Branch'
});

export const getCurrentVendorId = (user) => user?.vendorId || user?.userId || '';
export const getBranchId = (user) => user?.branchId || localStorage.getItem('branchId') || '';
export const isUserMaster = (user) => user?.isMaster || false;

// BRANCH OPTIONS UTILITIES
export const getBranchOptions = (user, childVendors = []) => {
  const { branchId, businessName } = getUserInfo(user);
  
  const options = [
    { value: 'current', label: businessName, branch_id: branchId },
    ...childVendors.map(item => ({
      value: item.vendor_id,
      label: item.business_name || `Branch ${item.branch_id}`,
      branch_id: item.branch_id,
    })),
  ];
  
  return options;
};

// For "All Branches" option
export const getBranchOptionsWithAll = (user, childVendors = []) => {
  const options = getBranchOptions(user, childVendors);
  return [
    ...options,
    { value: 'all', label: 'All Branches' }
  ];
};

// API REQUEST UTILITIES
export const cancelApiRequest = (controllerRef) => {
  if (controllerRef?.current) {
    controllerRef.current.abort();
    controllerRef.current = null;
  }
};

// DATE UTILITIES
export const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const getStartOfMonth = () => {
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  return startOfMonth.toISOString().split('T')[0];
};

export const getDefaultDates = () => ({
  startOfMonth: getStartOfMonth(),
  today: getTodayDate()
});

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

// ERROR HANDLING
export const getErrorMessage = (err) => {
  const status = err.response?.status;
  
  if (status === 404) return "";
  if (status === 401) return "Unauthorized. Please log in again.";
  if (status === 403) return "Access denied.";
  if (status === 500) return "Server error. Please try again later.";
  
  return err.response?.data?.message ;
};

export const handleApiError = (err, setError, setLoading) => {
  if (isAbortError(err)) return;
  
  setError(getErrorMessage(err));
  if (setLoading) setLoading(false);
};

// SUCCESS & LOADING UTILITIES
export const showSuccess = (setSuccess, message = "Operation completed successfully!", duration = 5000) => {
  setSuccess(message);
  setTimeout(() => setSuccess(false), duration);
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

// FILTER UTILITIES
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

// FORMATTING UTILITIES
export const formatCurrency = (amount) => {
  return Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

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
      console.warn('Invalid date:', dateString);
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

export const formatDateForDisplay = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// AUTO-SAVE UTILITIES (For AddMedicine/AddGeneral)
export class IndexedDBAutoSave {
  constructor(dbName = 'AutoSaveDB', storeName = 'drafts') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  async save(key, data) {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const draft = {
          id: key,
          data,
          timestamp: Date.now(),
        };
        
        store.put(draft);
        transaction.oncomplete = () => resolve(true);
      };
      
      request.onerror = () => resolve(false);
    });
  }

  async load(key) {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
          const draft = getRequest.result;
          if (draft && Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
            resolve(draft.data);
          } else {
            resolve(null);
          }
        };
        
        getRequest.onerror = () => resolve(null);
      };
      
      request.onerror = () => resolve(null);
    });
  }

  async clear(key) {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        store.delete(key);
        transaction.oncomplete = () => resolve(true);
      };
      
      request.onerror = () => resolve(false);
    });
  }
}

// PACKING UTILITIES (For General/Medicine)
export const formatPacking = (packing) => {
  if (!packing) return "—";

  let parts = [];

  if (packing.pack_size) parts.push(`${packing.pack_size}`);

  const size = packing.product_size || packing.product_model || null;
  if (size) {
    if (parts.length > 0) {
      parts.push(`x ${size}`);
    } else {
      parts.push(`${size}`);
    }
  }

  return parts.join(' ') || "—";
};

export const humanizeKey = (key) => {
  return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// ============================================
// MAIN EXPORT OBJECT
// ============================================
export const INVENTORY_MODULE_CONSTANTS = {
  // Medicine Type Options
  MEDICINE_TYPE_OPTIONS,
  
  // API Constants
  API_TIMEOUT,
  DEBOUNCE_DELAY,
  
  // Headers (imported from utils)
  HEADER_KEYS,
  
  // API & Fetch (imported from utils)
  createAbortController,
  isAbortError,
  getAuthHeaders,
  addBranchHeaders,
  formatDate,
  
  // API Request Utilities
  cancelApiRequest,
  
  // User Info
  getUserInfo,
  getCurrentVendorId,
  getBranchId,
  isUserMaster,
  
  // Branch Options
  getBranchOptions,
  getBranchOptionsWithAll,
  
  // Dates
  getTodayDate,
  getStartOfMonth,
  getDefaultDates,
  formatLocalDateTime,
  formatDateForDisplay,
  
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
  
  // Auto-save
  IndexedDBAutoSave,
  
  // Packing
  formatPacking,
  humanizeKey,
};

export default INVENTORY_MODULE_CONSTANTS;