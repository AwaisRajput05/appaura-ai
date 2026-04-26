// salesPointConstants.jsx - Complete Sales Point Module Constants
import { getToken } from "../../../../../services/tokenUtils";
import { HEADER_KEYS, getAuthHeaders, addBranchHeaders } from "../../../../../utils/authConstants";

// ============================================
// ENUMS FOR TYPE SAFETY
// ============================================
export const SearchType = {
  MEDICINE: "medicine",
  LOCAL_MEDICINE: "local_medicine",
  GENERAL: "general",
  PHONE: "phone"
} ;

export const TransactionType = {
  FULLY_PAID: "fully-paid",
  PARTIAL_PAID: "partial-paid",
  CREDIT: "credit"
};

export const PaymentMethod = {
  CASH: "cash",
  BANK_CARD: "bank_card",
  BANK_TRANSFER: "bank_transfer",
  MOBILE_WALLET: "mobile_wallet",
  CREDIT: "credit",
  ADVANCE: "advance"
} ;

export const CustomerType = {
  WALK_IN: "Walk-in",
  REGULAR: "Regular",
  CREDIT: "Credit",
  CORPORATE: "Corporate"
} ;

export const AvailabilityStatus = {
  IN_STOCK: "in_stock",
  NOT_IN_STOCK: "not_in_stock"
} ;

export const InvoiceSearchType = {
  ALL: "all",
  RETURNED_INVOICE: "returned_invoice_no",
  INVOICE: "invoice_no"
} ;

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

export const formatLocalDateTime = (dateString, showTime = true) => {
  if (!dateString) return "—";
  
  try {
    let date;
    
    // Handle different date formats and convert UTC to local
    if (typeof dateString === 'string') {
      // Format: "2026-07-12" (date only) - treat as UTC date
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
      else if (dateString.includes('T') && !dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
        date = new Date(dateString + 'Z');
      }
      // Format: "2026-04-14T13:23:28.971000Z" (ISO with Z) - already UTC
      else if (dateString.includes('T') && dateString.endsWith('Z')) {
        date = new Date(dateString);
      }
      // Format: "2026-04-17T05:56:22.664158+00:00" (with +00:00 offset) - already has timezone
      else if (dateString.includes('+') || dateString.includes('-', 10)) {
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
    
    // Month and day names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Get LOCAL time components (automatically converted from UTC)
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const weekday = dayNames[date.getDay()];
    
    if (showTime === false) {
      // Date only: "Apr 14, 2004"
      return `${month} ${day}, ${year}`;
    } else {
      // Full datetime: "Tue, Apr 14, 2026, 06:23 PM" (LOCAL TIME)
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours === 0 ? 12 : hours;
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      
      return `${weekday}, ${month} ${day}, ${year}, ${timeStr}`;
    }
  } catch (error) {
    console.error('Date formatting error:', error, 'for value:', dateString);
    return dateString;
  }
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
// ERROR HANDLING
// ============================================
export const getErrorMessage = (err) => {
  const status = err.response?.status;
  const defaultMessage = err.message || "An error occurred";
  
  switch (status) {
    case 400:
      return err.response?.data?.message || "Invalid request";
    case 401:
      return "Unauthorized. Please log in again.";
    case 403:
      return "Access denied.";
    case 404:
      return err.response?.data?.message || "Resource not found";
    case 409:
      return "Conflict detected. Please check your data.";
    case 422:
      return "Validation failed. Please check your input.";
    case 500:
      return "Server error. Please try again later.";
    case 502:
    case 503:
    case 504:
      return "Service temporarily unavailable. Please try again.";
    default:
      return err.response?.data?.message || defaultMessage;
  }
};

export const getInvoiceError = (err, invoiceNo = "") => {
  if (err.response?.status === 404) {
    return `Invoice ${invoiceNo} not found`;
  }
  return getErrorMessage(err);
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

export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{4})(\d{7})$/, '$1-$2');
  }
  return cleaned;
};

export const validatePhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 11 && /^03\d{9}$/.test(cleaned);
};

// ============================================
// CART & INVOICE UTILITIES
// ============================================
export const calculateCartTotals = (cart, discount = 0, tax = 0) => {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountAmount = subtotal * (discount / 100);
  const netTotal = subtotal - discountAmount;
  const taxAmount = netTotal * (tax / 100);
  const totalWithTax = netTotal + taxAmount;
  
  return {
    subtotal,
    discountAmount,
    netTotal,
    taxAmount,
    totalWithTax
  };
};

// ============================================
// PACKING UTILITIES
// ============================================
export const formatPacking = (packing) => {
  if (!packing) return "—";
  const { total_pack = 0, pack_strip = 0, strip_tablet = 0, total_strip = 0 } = packing;
  
  if (pack_strip && strip_tablet) {
    return `${total_pack} Pack × ${pack_strip} Strip × ${strip_tablet} Tablet = ${total_strip} Strip`;
  }
  return "Single Unit";
};

export const formatGeneralPacking = (packing) => {
  if (!packing) return "—";
  if (typeof packing === 'string') return packing;
  return formatPacking(packing);
};

export const isGeneralPacking = (packing) => {
  if (!packing) return false;
  if (typeof packing === 'string') return true;
  return false;
};

// ============================================
// MAIN EXPORT OBJECT
// ============================================
export const SALES_POINT_CONSTANTS = {
  SearchType,
  TransactionType,
  PaymentMethod,
  CustomerType,
  AvailabilityStatus,
  InvoiceSearchType,
  
  // Headers (imported from utils)
  HEADER_KEYS,
  getAuthHeaders,
  addBranchHeaders,
  
  getUserInfo,
  getCurrentVendorId,
  getOriginalBranchId,
  isUserMaster,
  getBranchOptions,
  formatLocalDateTime,
  getDefaultDates,
  loadSavedFilters,
  saveFilters,
  getErrorMessage,
  getInvoiceError,
  formatCurrency,
  formatPhoneNumber,
  validatePhoneNumber,
  calculateCartTotals,
  formatPacking,
  formatGeneralPacking,
  isGeneralPacking
};

export default SALES_POINT_CONSTANTS;