// supplierModuleConstants.jsx
import { HEADER_KEYS, getAuthHeaders, addBranchHeaders } from "../../../../../utils/authConstants";

// ============================================
// SUPPLIER STATUS CONSTANTS
// ============================================
export const SUPPLIER_ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
};

export const STATUS_COLORS = {
  [SUPPLIER_ORDER_STATUS.PENDING]: "bg-yellow-100 text-yellow-800",
  [SUPPLIER_ORDER_STATUS.CONFIRMED]: "bg-blue-100 text-blue-800",
  [SUPPLIER_ORDER_STATUS.COMPLETED]: "bg-green-100 text-green-800",
  [SUPPLIER_ORDER_STATUS.CANCELLED]: "bg-red-100 text-red-800",
  default: "bg-gray-100 text-gray-800"
};

export const getStatusColor = (status) => {
  return STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS.default;
};

// ============================================
// UI TEXT CONSTANTS
// ============================================
export const UI_TEXTS = {
  // Page Titles
  SUPPLIER_DETAILS: "Supplier Details",
  SUPPLIER_ORDERS: "Suppliers Orders",
  ALL_SUPPLIER_ORDERS: "All Supplier Orders",

  DELETE_ORDER: "Delete Order",
  DELETE_MEDICINE: "Delete Medicine",
  DELETE_ORDER_TITLE: "Delete Order",
  DELETE_MEDICINE_TITLE: "Delete Medicine Item",
  DELETE: "Delete",
  CONFIRM_DELETE: "Delete Order",
  CONFIRM_DELETE_ORDER: "Are you sure you want to delete order",
  DELETE_WARNING: "This action cannot be undone. All order data will be permanently removed.",
  ORDER_DELETED: "Order deleted successfully",

  // Button Labels
  ADD_SUPPLIER: "Add Supplier",
  ADD_ORDER: "Add Order",
  VIEW: "View",
  VIEW_ORDERS: "View Orders",
  EDIT: "Edit",

  COMPLETE: "Complete",
  CANCEL: "Cancel",
  REFRESH: "Refresh",
  RETRY: "Retry",
  BACK_TO_SUPPLIERS: "Back to Suppliers",
  BACK_TO_ORDERS: "Back to Orders List",
  
  // Modal Titles
  CREATE_SUPPLIER: "Create New Supplier",
  EDIT_SUPPLIER: "Edit Supplier",
  CREATE_ORDER: "Create New Order",
  EDIT_ORDER: "Update Order",
  CONFIRM_COMPLETION: "Confirm Order Completion",
  
  // Status Labels
  COMPLETED: "✓ Completed",
  CANCELLED: "✗ Cancelled",
  
  // Table Headers
  SUPPLIER_NAME: "Supplier Name",
  COMPANY_NAME: "Company Name",
  CONTACT_PERSON: "Supplier Name",
  PHONE: "Phone",
  EMAIL: "Email",
  ADDRESS: "Address",
  ORDER_ID: "Order ID",
  SUPPLIER_REF: "Supplier Ref",
  ITEMS: "Items",
  STATUS: "Status",
  EXPECTED_DELIVERY: "Expected Delivery",
  NEXT_VISIT: "Next Visit",
  CREATED: "Created",
  CREATED_DATE: "Created Date",
  LAST_UPDATED: "Last Updated",
  ACTIONS: "Actions",
  VIEW_ITEMS: "View Items",
  LINKED_MEDICINES: "Linked Medicines",
  
  // Form Labels
  NOTES: "Notes",
  LINK_MEDICINES: "Link Medicines",
  ADD_MEDICINES: "Add New Medicines",
  SELECT_MEDICINES: "Search and Select Medicines",
  MEDICINE_NAME: "Medicine Name",
  MEDICINE_ID: "Medicine ID",
  BATCH_CODE: "Batch Code",
  QUANTITY: "Quantity",
  UNIT_PRICE: "Unit Price",
  TOTAL_PRICE: "Total Price",
  PACK_SIZE: "Pack Size",
  MIN_ORDER_QTY: "Min Order Qty",
  REQUIRED_FIELD: "Required",
  
  // Placeholders
  SEARCH_SUPPLIERS: "Search by name, company, phone...",
  SEARCH_MEDICINES: "Search medicines by name (min 3 characters)...",
  SEARCH_ORDERS: "Search by order ID, supplier ref, status...",
  ENTER_NOTES: "Enter order notes",
  ENTER_COMPLETION_NOTES: "Add any completion notes...",
  ENTER_TRACKING: "Enter tracking information",
  
  // Messages
  NO_SUPPLIERS: "No suppliers found",
  NO_ORDERS: "No orders found for this supplier",
  NO_ITEMS: "No items found for this order",
  NO_MEDICINES: "No medicines found",
  NO_MEDICINES_LINKED: "No medicines linked to this supplier",
  NO_ITEMS_TOOLTIP: "—",
  
  // Success Messages
  SUPPLIER_CREATED: "Supplier created successfully",
  SUPPLIER_UPDATED: "Supplier updated successfully",
  ORDER_CREATED: "Order created successfully",
  ORDER_UPDATED: "Order updated successfully",
  ORDER_COMPLETED: "Order marked as completed",
  MEDICINE_REMOVED: "Successfully removed medicine from supplier",
  
  // Error Messages
  VENDOR_ID_NOT_FOUND: "Vendor ID not found.",
  ADD_MEDICINE_REQUIRED: "Please add at least one medicine to the order",
  FETCH_FAILED: "Failed to fetch data",
  CREATE_FAILED: "Failed to create",
  UPDATE_FAILED: "Failed to update",
  DELETE_FAILED: "Failed to delete",
  MEDICINE_REMOVE_FAILED: "Failed to remove medicine",
  
  // Loading States
  LOADING: "Loading...",
  SEARCHING: "Searching...",
  REFRESHING: "Refreshing...",
  CREATING: "Creating...",
  UPDATING: "Updating...",
  COMPLETING: "Completing...",
  SUBMITTING: "Submitting...",
  
  // Tooltips
  VIEW_SUPPLIER_ORDERS: "View Orders",
  VIEW_ORDER_ITEMS: "View Order Items",
  COMPLETE_ORDER: "Complete Order",
  REMOVE_MEDICINE: "Remove Medicine",
  ADD_SELECTED: "Add Selected",
  
  // Branch Related
  ALL_BRANCHES: "All Branches",
  MAIN_BRANCH: "Main Branch",
  BRANCH: "Branch",
  SELECT_BRANCH: "Select Branch",
  
  // Other
  TOTAL_ORDERS: "Total Orders",
  TOTAL_ITEMS: "Total Items",
  TOTAL_MEDICINES: "Total Medicines",
  ORDER_DETAILS: "Order Details",
  SUPPLIER_DETAILS_LABEL: "Supplier Details",
  ORDER_ITEMS: "Order Items",
  MEDICINES_SUPPLIED: "Medicines supplied by this supplier",
};

// ============================================
// DEFAULT VALUES
// ============================================
export const DEFAULTS = {
  NOT_AVAILABLE: "N/A",
  DASH: "—",
  EMPTY: "",
  ZERO: 0,
  DEFAULT_QUANTITY: 1,
  PAGE_SIZE: 10,
  PAGE: 1,
  SUCCESS_TIMEOUT: 5000,
  SEARCH_DEBOUNCE: 500,
  MIN_SEARCH_CHARS: 3,
  PREVIEW_LENGTH: 30,
  API_TIMEOUT: 15000,
  MODAL_CLOSE_DELAY: 1500,
};

// ============================================
// USER UTILITIES
// ============================================
export const getUserInfo = (user) => ({
  currentVendorId: user?.vendorId || user?.currentBranch?.vendorId || "",
  originalBranchId: user?.branchId || user?.currentBranch?.id || "",
  isMaster: user?.role === 'master' || user?.isMaster || false,
  currentBusinessName: user?.businessName || user?.currentBranch?.name || UI_TEXTS.MAIN_BRANCH,
});

// ============================================
// API HEADERS UTILITIES
// ============================================
export const getSupplierHeaders = (token = null) => {
  return getAuthHeaders(token);
};

export const addSupplierBranchHeaders = (headers, branchId, childVendorId, currentVendorId) => {
  if (branchId) {
    headers['X-User-Branch-ID'] = branchId;
  }
  if (childVendorId && childVendorId !== currentVendorId) {
    headers['X-Child-ID'] = childVendorId;
  }
  return headers;
};

// ============================================
// ERROR HANDLING
// ============================================
export const getErrorMessage = (err) => {
  const status = err.response?.status;
  
  if (status === 404) return "Resource not found";
  if (status === 401) return "Unauthorized. Please log in again.";
  if (status === 403) return "Access denied.";
  if (status === 500) return "Server error. Please try again later.";
  
  if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
    const validationError = err.response.data.detail[0];
    if (validationError && validationError.msg) return validationError.msg;
  }
  
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.data?.error) return err.response.data.error;
  if (err.message) return err.message;
  
  return "An error occurred";
};

// ============================================
// VALIDATION FUNCTIONS
// ============================================
export const validateEmail = (email) => {
  if (!email) return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  if (!phone) return false;
  
  // Clean the value - remove spaces
  const cleanedValue = phone.replace(/\s+/g, '');
  
  // International phone number regex pattern
  // This accepts: +923001234567, 03001234567, 3001234567, etc.
  const phoneRegex = /^(\+[1-9]\d{0,3}|00[1-9]\d{0,3}|0?[1-9]\d{0,4})?[1-9]\d{7,}$/;
  
  if (!phoneRegex.test(cleanedValue)) {
    return false;
  }
  
  // Check digit length
  const digitsOnly = cleanedValue.replace(/\D/g, '');
  
  // Pakistani numbers: 
  // With +92: 12 digits (e.g., +923001234567)
  // With 03: 11 digits (e.g., 03001234567)
  // Without code: 10 digits (e.g., 3001234567)
  if (cleanedValue.startsWith('+92')) {
    return digitsOnly.length === 12;
  } else if (cleanedValue.startsWith('03')) {
    return digitsOnly.length === 11;
  } else if (cleanedValue.startsWith('3')) {
    return digitsOnly.length === 10;
  }
  
  // For other international numbers
  if (cleanedValue.startsWith('+') || cleanedValue.startsWith('00')) {
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  }
  
  return digitsOnly.length >= 8 && digitsOnly.length <= 15;
};

// ============================================
// BRANCH UTILITIES
// ============================================
export const getBranchOptions = (currentVendorId, currentBusinessName, childVendors) => {
  const options = [{ value: DEFAULTS.EMPTY, label: UI_TEXTS.ALL_BRANCHES }];
  options.push({ value: currentVendorId, label: currentBusinessName });
  childVendors.forEach(item => {
    options.push({ 
      value: item.vendor_id, 
      label: item.business_name || `Branch ${item.branch_id}` 
    });
  });
  return options;
};

export const getBranchInfo = (selectedBranchValue, userInfo, childVendors) => {
  if (selectedBranchValue === userInfo.currentVendorId || !selectedBranchValue) {
    return {
      is_master: true,
      vendor_id: userInfo.currentVendorId,
      branch_id: userInfo.originalBranchId,
      business_name: userInfo.currentBusinessName
    };
  } else {
    const childBranch = childVendors.find(v => v.vendor_id === selectedBranchValue);
    if (childBranch) {
      return {
        is_master: false,
        vendor_id: childBranch.vendor_id,
        branch_id: childBranch.branch_id,
        business_name: childBranch.business_name || `Branch ${childBranch.branch_id}`
      };
    }
  }
  return {
    is_master: true,
    vendor_id: userInfo.currentVendorId,
    branch_id: userInfo.originalBranchId,
    business_name: userInfo.currentBusinessName
  };
};

// ============================================
// DATE UTILITIES
// ============================================
export const formatDateForInput = (dateString) => {
  if (!dateString) return DEFAULTS.EMPTY;
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return DEFAULTS.EMPTY;
    return date.toISOString().split('T')[0];
  } catch {
    return DEFAULTS.EMPTY;
  }
};
// ============================================
// UNIFIED DATE FORMATTING WITH TIMEZONE CONVERSION
// ============================================
export const formatDate = (dateString, showTime = false) => {
  if (!dateString) return DEFAULTS.NOT_AVAILABLE;
  if (dateString === "N/A") return "N/A";
  
  try {
    let date;
    
    if (typeof dateString === 'string') {
      // Format: "2026-07-12" (date only) - treat as UTC date
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Parse as UTC to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      }
      // Format: "2026-04-15 05:55:53" (with space) - this is likely UTC
      else if (dateString.includes(' ') && !dateString.includes('T')) {
        // Replace space with T and treat as UTC
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
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return dateString;
    }
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Get local time components (automatically converts from UTC)
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

export const formatDisplayDate = (dateString) => {
  if (!dateString) return DEFAULTS.NOT_AVAILABLE;
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return DEFAULTS.NOT_AVAILABLE;
  }
};

export const formatDisplayDateTime = (dateString) => {
  if (!dateString) return DEFAULTS.NOT_AVAILABLE;
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return DEFAULTS.NOT_AVAILABLE;
  }
};

// ============================================
// MEDICINE UTILITIES
// ============================================
export const mapMedicineToOrderItem = (medicine) => ({
  medicine_id: medicine.medicine_id,
  name: medicine.name,
  quantity: DEFAULTS.DEFAULT_QUANTITY,
  unit_price: medicine.default_unit_price || DEFAULTS.ZERO,
  notes: DEFAULTS.EMPTY
});

export const mapMedicineToSupplierMedicine = (medicine) => ({
  medicine_id: medicine.medicine_id,
  name: medicine.name,
  sku: medicine.batch_code || DEFAULTS.EMPTY,
  default_unit_price: medicine.default_unit_price || DEFAULTS.ZERO,
  pack_size: medicine.pack_size || DEFAULTS.ZERO,
  min_order_qty: medicine.min_order_qty || DEFAULTS.ZERO,
  notes: medicine.notes || DEFAULTS.EMPTY,
  active: true
});

// ============================================
// ORDER UTILITIES
// ============================================
export const calculateTotalValue = (items) => {
  return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
};

export const isOrderEditable = (status) => {
  return status !== SUPPLIER_ORDER_STATUS.COMPLETED && status !== SUPPLIER_ORDER_STATUS.CANCELLED;
};

export const getOrderActionLabel = (status) => {
  if (status === SUPPLIER_ORDER_STATUS.COMPLETED) return UI_TEXTS.COMPLETED;
  if (status === SUPPLIER_ORDER_STATUS.CANCELLED) return UI_TEXTS.CANCELLED;
  return DEFAULTS.EMPTY;
};

// ============================================
// FILTER FIELDS CONFIGURATION
// ============================================
export const getSupplierFilterFields = (searchTerm, selectedBranchValue, handleFilterChange, isMaster, branchOptions) => [
  {
    type: "text",
    name: "search",
    label: "Search Suppliers",
    placeholder: UI_TEXTS.SEARCH_SUPPLIERS,
    value: searchTerm,
    onChange: (e) => handleFilterChange("search", e.target.value),
  },
  ...(isMaster && branchOptions.length > 0 ? [{
    type: "select",
    name: "branch",
    label: UI_TEXTS.BRANCH,
    placeholder: UI_TEXTS.SELECT_BRANCH,
    value: selectedBranchValue,
    onChange: (e) => handleFilterChange("branch", e.target.value),
    options: branchOptions,
  }] : []),
];

export const getOrderFilterFields = (searchTerm, selectedBranchValue, handleFilterChange, isMaster, branchOptions) => [
  {
    type: "text",
    name: "search",
    label: "Search Orders",
    placeholder: UI_TEXTS.SEARCH_ORDERS,
    value: searchTerm,
    onChange: (e) => handleFilterChange("search", e.target.value),
  },
  ...(isMaster && branchOptions.length > 0 ? [{
    type: "select",
    name: "branch",
    label: UI_TEXTS.BRANCH,
    placeholder: UI_TEXTS.SELECT_BRANCH,
    value: selectedBranchValue,
    onChange: (e) => handleFilterChange("branch", e.target.value),
    options: branchOptions,
  }] : []),
];

// ============================================
// TOOLTIP TITLES
// ============================================
export const TOOLTIP_TITLES = {
  SUPPLIER_ADDRESS: "Supplier Address",
  SUPPLIER_NOTES: "Supplier Notes",
  ORDER_ITEMS: "Order Items",
  BRANCH_DETAILS: "Branch Details",
  CREATED_AT: "Created At",
  UPDATED_AT: "Updated At",
};

// ============================================
// MAIN EXPORT OBJECT
// ============================================
export const SUPPLIER_MODULE_CONSTANTS = {
  // Headers
  HEADER_KEYS,
  getAuthHeaders: getSupplierHeaders,
  addBranchHeaders: addSupplierBranchHeaders,
  
  // Status
  ORDER_STATUS: SUPPLIER_ORDER_STATUS,
  STATUS_COLORS,
  getStatusColor,
  
  // UI Texts
  UI: UI_TEXTS,
  
  // Defaults
  DEFAULTS,
  // Tooltips
  TOOLTIP_TITLES,
  
  // Validation
  validateEmail,
  validatePhone,
  
  // Utilities
  getUserInfo,
  getErrorMessage,
  getBranchOptions,
  getBranchInfo,
  formatDateForInput,
  formatDate,
  formatDisplayDate,
  formatDisplayDateTime,
  mapMedicineToOrderItem,
  mapMedicineToSupplierMedicine,
  calculateTotalValue,
  isOrderEditable,
  
  getOrderActionLabel,
  getSupplierFilterFields,
  getOrderFilterFields,
};

export default SUPPLIER_MODULE_CONSTANTS;