// orderModuleConstants.jsx
import { HEADER_KEYS, getAuthHeaders, addBranchHeaders } from "../../../../../utils/authConstants";

// ============================================
// STATUS & PRIORITY CONSTANTS
// ============================================
export const ORDER_STATUS = {
  PENDING: "PENDING",
  DISPATCHED: "DISPATCHED",
  COMPLETED: "COMPLETED",
  DISCREPANCY: "DISCREPANCY"
};

export const ORDER_PRIORITY = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  NORMAL: "Normal",
  LOW: "Low"
};

export const STATUS_OPTIONS = [

  { label: "Pending", value: ORDER_STATUS.PENDING },
  { label: "Completed", value: ORDER_STATUS.COMPLETED },
  { label: "Dispatched", value: ORDER_STATUS.DISPATCHED },
  { label: "Discrepancy", value: ORDER_STATUS.DISCREPANCY },
];

export const PRIORITY_OPTIONS = [
  { label: "Low", value: ORDER_PRIORITY.LOW },
  { label: "Medium", value: ORDER_PRIORITY.MEDIUM },
  { label: "High", value: ORDER_PRIORITY.HIGH },
];

// ============================================
// USER UTILITIES
// ============================================
export const getUserInfo = (user) => ({
  vendorId: user?.vendorId || (user?.role === 'VENDOR' ? user?.userId : null),
  branchId: user?.branchId || localStorage.getItem('branchId') || '',
  isMaster: user?.isMaster || false,
  userId: user?.userId || ''
});

// ============================================
// ORDER-SPECIFIC UTILITIES
// ============================================
export const getOrderHeaders = (token = null, branchId = null, childId = null) => {
  const headers = getAuthHeaders(token);
  return addBranchHeaders(headers, branchId, childId);
};

// ============================================
// UNIFIED DATE FORMATTING WITH UTC TO LOCAL CONVERSION
// ============================================

export const formatDate = (dateString, showTime = false) => {
  if (!dateString) return "N/A";
  
  try {
    let date;
    
    if (typeof dateString === 'string') {
      // Format: "2026-07-12" (date only)
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      }
      // Format: "2026-04-15 05:55:53" (with space) - treat as UTC
      else if (dateString.includes(' ') && !dateString.includes('T')) {
        const utcString = dateString.replace(' ', 'T') + 'Z';
        date = new Date(utcString);
      }
      // Format: "2026-04-14T13:23:28.971000" (ISO without Z) - treat as UTC
      else if (dateString.includes('T') && !dateString.endsWith('Z')) {
        date = new Date(dateString + 'Z');
      }
      // Format: "2026-04-14T13:23:28.971000Z" (ISO with Z) - already UTC
      else if (dateString.includes('T') && dateString.endsWith('Z')) {
        date = new Date(dateString);
      }
      // Fallback
      else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) return dateString;
    
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
// ============================================
// DATE UTILITIES
// ============================================
export const formatLocalDateTime = (dateString) => {
  if (!dateString) return "—";
  const cleaned = dateString.includes('+00:00') 
    ? dateString.replace('+00:00', 'Z') 
    : dateString.endsWith('Z') 
      ? dateString 
      : dateString + 'Z';
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

export const formatShortDate = (dateString) => {
  if (!dateString) return "—";
  const cleaned = dateString.includes('+00:00') 
    ? dateString.replace('+00:00', 'Z') 
    : dateString.endsWith('Z') 
      ? dateString 
      : dateString + 'Z';
  const date = new Date(cleaned);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const getDefaultExpectedDeliveryTime = () => {
  const now = new Date();
  const future = new Date(now);
  future.setDate(now.getDate() + 3);
  future.setHours(12, 0, 0, 0);
  
  const year = future.getFullYear();
  const month = String(future.getMonth() + 1).padStart(2, '0');
  const day = String(future.getDate()).padStart(2, '0');
  const hours = String(future.getHours()).padStart(2, '0');
  const minutes = String(future.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const calculateNeedByDate = (priority) => {
  const hoursMap = { 
    [ORDER_PRIORITY.LOW]: 72, 
    [ORDER_PRIORITY.MEDIUM]: 48, 
    [ORDER_PRIORITY.HIGH]: 24 
  };
  const hours = hoursMap[priority] || 48;
  const futureDate = new Date(Date.now() + hours * 3600 * 1000);
  return futureDate.toISOString().split('T')[0];
};

// ============================================
// ERROR HANDLING
// ============================================
export const getErrorMessage = (err) => {
  const status = err.response?.status;
  
  if (status === 404) return ;
  if (status === 401) return "Unauthorized. Please log in again.";
  if (status === 403) return "Access denied.";
  if (status === 500) return "Server error. Please try again later.";
  
  return err.response?.data?.message || err.message || "An error occurred";
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
// ORDER UTILITIES
// ============================================
export const getBusinessName = (branchId, childVendors = []) => {
  if (!branchId) return "N/A";
  const match = childVendors.find(v => v.branch_id === branchId);
  return match?.business_name || branchId;
};

export const displayOrderId = (id) => (id ? id : "N/A");

export const getStatusColor = (status) => {
  switch (status) {
    case ORDER_STATUS.COMPLETED:
      return "bg-green-100 text-green-800";
    case ORDER_STATUS.PENDING:
      return "bg-yellow-100 text-yellow-800";
    case ORDER_STATUS.DISPATCHED:
      return "bg-blue-100 text-blue-800";
    case ORDER_STATUS.DISCREPANCY:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case ORDER_PRIORITY.HIGH:
      return "bg-red-100 text-red-700";
    case ORDER_PRIORITY.MEDIUM:
      return "bg-yellow-100 text-yellow-700";
    case ORDER_PRIORITY.LOW:
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export const buildOrdersEndpoint = (isMaster, filters = {}, pagination = { page: 1, page_size: 10 }) => {
  const params = new URLSearchParams();
  params.append("page", pagination.page);
  params.append("page_size", pagination.page_size);
  if (filters.status) params.append("status", filters.status);
  if (filters.fromDate) params.append("fromDate", filters.fromDate);
  if (filters.toDate) params.append("toDate", filters.toDate);
  if (filters.orderId) params.append("orderId", filters.orderId);
  
  return {
    endpoint: isMaster ? apiEndpoints.masterOrders() : apiEndpoints.branchOrders(),
    params: params.toString(),
    childId: isMaster && filters.branch && filters.branch !== "" 
      ? (childVendors = [], childVendors.find(v => v.branch_id === filters.branch)?.vendor_id || null)
      : null
  };
};

// ============================================
// MAIN EXPORT OBJECT
// ============================================
export const ORDER_MODULE_CONSTANTS = {
  // Headers (imported from utils)
  HEADER_KEYS,
  STATUS: ORDER_STATUS,
  PRIORITY: ORDER_PRIORITY,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  
  // Utilities
  getUserInfo,
  getAuthHeaders,
  addBranchHeaders,
  getOrderHeaders,
  formatLocalDateTime,
  formatShortDate,
  getDefaultExpectedDeliveryTime,
  calculateNeedByDate,
  getErrorMessage,
  loadSavedFilters,
  formatDate,
  saveFilters,
  getBusinessName,
  displayOrderId,
  getStatusColor,
  getPriorityColor,
  buildOrdersEndpoint
};

export default ORDER_MODULE_CONSTANTS;