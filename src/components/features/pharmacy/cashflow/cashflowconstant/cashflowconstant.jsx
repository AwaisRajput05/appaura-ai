// CASHFLOW_MODULE_CONSTANTS.jsx - COMPREHENSIVE CONSTANTS FOR CASHFLOW MODULE
import React from "react";
import { HEADER_KEYS, getAuthHeaders, addBranchHeaders } from "../../../../../utils/authConstants";

// ============================================
// MODULE SPECIFIC CONSTANTS
// ============================================
export const API_TIMEOUT = 30000;
export const SUCCESS_TIMEOUT = 5000;
export const DEBOUNCE_DELAY = 500;
export const BALANCE_REFRESH_INTERVAL = 30000;

// ============================================
// MESSAGE & UI CONSTANTS - SHIFT MODULE
// ============================================
export const SHIFT_CONSTANTS = {
  // Error Messages
  ERRORS: {
    VENDOR_ID_NOT_FOUND: "Vendor ID not found.",
    FETCH_DAY_STATUS_FAILED: "Failed to load day status",
    FETCH_SHIFT_DETAILS_FAILED: "Failed to load shift details",
    START_DAY_FAILED: "Failed to start day",
    CLOSE_DAY_FAILED: "Failed to close day",
    START_SHIFT_FAILED: "Failed to start shift",
    CLOSE_SHIFT_FAILED: "Failed to close shift",
    SHIFT_DETAILS_NOT_FOUND: "Shift details not found",
    AUTH_REQUIRED: "Authentication required",
  },
  
  // Success Messages
  SUCCESS: {
    DAY_STARTED: "Day started successfully!",
    DAY_CLOSED: "Day closed successfully!",
    SHIFT_STARTED: "Shift started successfully!",
    SHIFT_CLOSED: "Shift closed successfully!",
  },
  
  // UI Text Strings
  UI: {
    DAILY_LEDGER: "Daily Ledger",
    DAY_OVERVIEW: "Day Overview",
    TODAYS_SHIFTS: "Today's Shifts",
    START_NEW_DAY: "Start New Day",
    CLOSE_CURRENT_DAY: "Close Current Day",
    START_NEW_SHIFT: "Start New Shift",
    CLOSE_SHIFT: "Close Shift",
    SHIFT_BALANCE_DETAILS: "Shift Balance Details",
    START_DAY: "Start Day",
    CLOSE_DAY: "Close Day",
    START_SHIFT: "Start Shift",
    CLOSE: "Close",
    VIEW_BALANCE: "View Balance",
    REFRESH: "Refresh",
    CANCEL: "Cancel",
    LOADING: "Loading...",
    STARTING: "Starting...",
    CLOSING: "Closing...",
    DATE: "Date",
    BUSINESS_DATE: "Business Date",
    STARTED_AT: "Started At",
    ENDED_AT: "Ended At",
    ACTIONS: "Actions",
    STAFF_ID: "Staff ID",
    STAFF_NAME: "Staff Name",
    STATUS: "Status",
    SHIFT_ID: "Shift ID",
    OPENING_BALANCES: "Opening Balances",
    PHYSICAL_CLOSING: "Shift Closing",
    CLOSE_NOTES: "Closing Notes",
    NOTES: "Notes",
    OPEN_SHIFTS: "Open Shifts",
    TOTAL_SHIFTS: "Total Shifts",
    CASH: "Cash",
    BANK: "Bank",
    MOBILE: "Mobile Wallet",
    OTHER: "Other",
    OPENING_CASH: "Opening Cash",
    OPENING_BANK: "Opening Bank",
    OPENING_MOBILE: "Opening Mobile",
    OPENING_OTHER: "Opening Other",
    OPEN: "Open",
    CLOSED: "Closed",
    NOT_STARTED: "Not Started",
    ENTER_PHYSICAL_COUNTS: "Enter physical counts below. Differences will be recorded as discrepancies.",
    AUTO_DETECTED: "auto-detected when submitted",
    FROM_DAY: "from day",
    NOTES_PLACEHOLDER: "Enter any notes",
    CLOSE_NOTES_PLACEHOLDER: "Enter closing notes",
    NO_ACTIVE_DAY: "No active day found. Click 'Start Day' to begin.",
    NO_SHIFTS_FOUND: "No shifts found",
  },
  
  DEFAULTS: {
    NOT_AVAILABLE: "N/A",
    DASH: "—",
    ZERO: "0",
    DEFAULT_STAFF_NAME: "Staff",
    CASH_IN_HAND: "Cash in hand",
    BANK_BALANCE: "Bank balance",
    MOBILE_WALLET: "Mobile wallet",
    OTHER_ASSETS: "Other assets",
  },
  
  STATUS_COLORS: {
    OPEN: "bg-green-100 text-green-800 border border-green-300",
    CLOSED: "bg-red-100 text-red-800 border border-red-300",
    NOT_STARTED: "bg-gray-100 text-gray-800 border border-gray-300",
  },
};

// ============================================
// MESSAGE & UI CONSTANTS - MOVEMENT MODULE
// ============================================
export const MOVEMENT_CONSTANTS = {
  ERRORS: {
    FETCH_BALANCE_FAILED: "Failed to load current balances",
    INVALID_AMOUNT: "Please enter a valid amount greater than 0",
    AUTH_REQUIRED: "Authentication required",
    TRANSACTION_FAILED: "Failed to record transaction",
    NO_OPEN_SHIFT: "No open shifts available. Please start a shift first.",
    INVALID_OUT_AMOUNT: "Invalid amount for OUT transaction",
  },
  
  SUCCESS: {
    TRANSACTION_RECORDED: "Transaction recorded successfully!",
  },
  
  UI: {
    PAGE_TITLE: "Transaction Flow",
    RESET: "Reset",
    REFRESH_BALANCE: "Refresh Balance",
    CURRENT_BALANCES: "Current Balances",
    AS_OF: "as of",
    UPDATING: "Updating...",
    CASH: "Cash",
    BANK: "Bank",
    MOBILE: "Mobile",
    OTHER: "Other",
    OPEN_SHIFTS: "Open Shifts",
    CLOSED_SHIFTS: "Closed Shifts",
    ACTIVE_SHIFT: "Active Shift",
    STARTED_AT: "Started at",
    TRANSACTION_DIRECTION: "Transaction Direction",
    AMOUNT: "Amount (PKR)",
    AVAILABLE: "Available",
    LEDGER: "Ledger",
    CATEGORY: "Category",
    REFERENCE_ID: "Reference ID (Optional)",
    REFERENCE_TYPE: "Reference Type",
    STAFF_ID: "Staff ID",
    STAFF_NAME: "Staff Name",
    EMPLOYEE_ID: "Employee ID",
    DESCRIPTION: "Description",
    RECEIVE_MONEY: "Receive Money",
    PAY_MONEY: "Pay Money",
    RECORDING: "Recording...",
    TRANSACTION_STATUS: "Transaction Status",
    DIRECTION: "Direction",
    MOVEMENT_TYPE: "Movement Type",
    TIMESTAMP: "Timestamp",
    ADD_ANOTHER: "Add Another Transaction",
    MAX_DIGITS_HINT: "Maximum 8 digits (e.g., 12345678.99)",
  },
  
  PLACEHOLDERS: {
    REFERENCE_ID: "e.g., INV-001, TXN-123",
    STAFF_ID: "Enter Staff ID",
    STAFF_NAME: "Staff Name",
    EMPLOYEE_ID: "Enter Employee ID",
    RECEIVE_DESC: "Received payment from customer",
    PAY_DESC: "Paid for supplies",
  },
  
  DEFAULTS: {
    NOT_AVAILABLE: "N/A",
    RECEIVED: "Received",
    PAID: "Paid",
  },
};

// ============================================
// MESSAGE & UI CONSTANTS - REPORT MODULE
// ============================================
export const REPORT_CONSTANTS = {
 
  
  UI: {
    SHIFT_HISTORY: "Shift History",
    CASH_FLOW_REPORT: "Cash Flow Report",
    SHIFT_ID: "Shift ID",
    STAFF_ID: "Staff ID",
    STAFF_NAME: "Staff Name",
    SHIFT_PERIOD: "Shift Period",
    STATUS: "Status",
    MEDICINE_SALES: "Medicine Sales",
    CLOSE_NOTES: "Close Notes",
    TIME: "Time",
    DIRECTION: "Direction",
    DIRECTION_SHORT: "Dir",
    LEDGER: "Ledger",
    AMOUNT: "Amount",
    CATEGORY: "Category",
    DESCRIPTION: "Description",
    REFERENCE_ID: "Reference ID",
    REFERENCE: "Reference",
    PHYSICAL_CLOSING: "Shift Closing",
    TRANSACTIONS: "Transactions",
    REPORT_DATE: "Report Date",
    FROM_DATE: "From Date",
    TO_DATE: "To Date",
    BRANCH: "Branch",
    PERIOD: "Period",
    TOTAL_DAYS: "Total Days",
    SHIFTS_IN_PAGE: "Shifts in Page",
    APPLIED_FILTERS: "Applied Filters",
    STAFF: "Staff",
    NO_STAFF_FILTER: "No staff filter",
    SHIFT: "Shift",
    DAY_OVERVIEW: "Day Overview",
    OPENING_BALANCES: "Opening Balances",
    PHYSICAL_CLOSING_LAST: "Shift Closing (Last Shift)",
    DAY_STATUS: "Day Status",
    SUMMARY: "Summary",
    OPEN: "Open",
    CLOSED: "Closed",
    CASH: "Cash",
    BANK: "Bank",
    MOBILE: "Mobile",
    OTHER: "Other",
    TOTAL_SHIFTS: "Total Shifts",
    OPEN_SHIFTS: "Open Shifts",
    CLOSED_SHIFTS: "Closed Shifts",
    SHIFTS: "Shifts",
    TO: "to",
    DAY_CLOSED: "Day is closed",
    DAY_ACTIVE: "Day is active",
    LAST_SHIFT: "Last shift",
    NO_CLOSED_SHIFTS: "No closed shifts found",
    NO_SHIFTS_FOUND: "No shifts found for selected filters",
    NO_TRANSACTIONS: "No transactions for this shift",
  },
  
  PLACEHOLDERS: {
    SHIFT_ID: "Enter shift ID",
    SELECT_CATEGORY: "Select category",
    SELECT_BRANCH: "Select Branch",
  },
  
  DEFAULTS: {
    DASH: "—",
  },
  
  STATUS_COLORS: {
    OPEN: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-800",
    IN: "bg-green-100 text-green-800",
    OUT: "bg-red-100 text-red-800",
    CURRENT_BRANCH: "bg-green-100 text-green-800 border border-green-300",
    OTHER_BRANCH: "bg-blue-100 text-blue-800 border border-blue-300",
  },
  
  CATEGORY_OPTIONS: [
   
    { value: "sales", label: "Sales" },
    { value: "purchase", label: "Purchase" },
    { value: "expense", label: "Expense" },
    { value: "payment", label: "Payment" },
    { value: "receipt", label: "Receipt" },
  ],
};

// ============================================
// OPTIONS FOR FILTERS
// ============================================
export const LEDGER_OPTIONS = [
  { value: '', label: 'All Ledgers' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'mobile', label: 'Mobile Wallet' },
  { value: 'other', label: 'Other' }
];

// UPDATED: Category options with direction filtering for movement records
export const CATEGORY_OPTIONS = [
  // IN Categories (for Receive Money / direction: 'in')
  { value: 'sale', label: 'Sale', direction: 'in' },
  { value: 'transfer_in', label: 'Transfer In', direction: 'in' },
  { value: 'other', label: 'Other Income', direction: 'in' },
  { value: 'purchase', label: 'Purchase', direction: 'out' },
  { value: 'transfer_out', label: 'Transfer Out', direction: 'out' },
  { value: 'expense', label: 'Expense', direction: 'out' },
  { value: 'adjustment', label: 'Adjustment (Out)', direction: 'out' },
  { value: 'salary', label: 'Salary Payment', direction: 'out' },
  { value: 'bill', label: 'Bill Payment', direction: 'out' },
  { value: 'supplier_expense', label: 'Supplier Expense', direction: 'out' }
];

export const DIRECTIONS = [
  { value: 'in', label: 'Receive Money' },
  { value: 'out', label: 'Pay Money' }
];

export const LEDGER_KEYS = [
  { value: 'bank', label: 'Bank' },
  { value: 'cash', label: 'Cash' },
  { value: 'mobile', label: 'Mobile Wallet' },
  { value: 'other', label: 'Other' }
].sort((a, b) => a.label.localeCompare(b.label));

export const REFERENCE_TYPES = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'mobile_wallet', label: 'Mobile Wallet' },
  { value: 'other', label: 'Other' },
].sort((a, b) => a.label.localeCompare(b.label));

// ============================================
// DATE UTILITIES
// ============================================
export const getCurrentBusinessDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentLocalDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// ============================================
// UNIFIED DATE FORMATTING WITH UTC TO LOCAL CONVERSION
// ============================================

export const formatDateTime = (dateString, showTime = true) => {
  if (!dateString) return SHIFT_CONSTANTS.DEFAULTS.DASH;
  
  try {
    let date;
    
    if (typeof dateString === 'string') {
      // Format: "2026-07-12" (date only)
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      }
      // Format: "27-12-2025" (DD-MM-YYYY)
      else if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [day, month, year] = dateString.split('-').map(Number);
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
      // Format with timezone offset like "2026-04-17T05:56:22.664158+00:00"
      else if (dateString.includes('+') || (dateString.includes('-', 10) && !dateString.match(/^\d{4}-\d{2}-\d{2}/))) {
        date = new Date(dateString);
      }
      // Fallback
      else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
    }
    
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

export const formatDateOnly = (dateString) => {
  if (!dateString) return SHIFT_CONSTANTS.DEFAULTS.DASH;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${month} ${day}, ${year}`;
  } catch {
    return dateString;
  }
};

export const formatTimeOnly = (dateString) => {
  if (!dateString) return SHIFT_CONSTANTS.DEFAULTS.DASH;
  try {
    const formatted = formatDateTime(dateString, true);
    const timeMatch = formatted.match(/, (\d{2}:\d{2} [AP]M)$/);
    return timeMatch ? timeMatch[1] : formatted;
  } catch {
    return dateString;
  }
};

/**
 * Format shift period string that contains two dates
 * Example: "2026-03-10 08:45:50 → 2026-03-10 09:22:57"
 */
export const formatShiftPeriod = (shiftPeriod) => {
  if (!shiftPeriod) return SHIFT_CONSTANTS.DEFAULTS.DASH;
  
  try {
    const parts = shiftPeriod.split('→');
    if (parts.length === 2) {
      const startStr = parts[0].trim();
      const endStr = parts[1].trim();
      
      const startDate = new Date(startStr);
      const formattedStart = !isNaN(startDate.getTime()) 
        ? formatTimeOnly(startStr)
        : startStr;
      
      if (endStr === '—') {
        return `${formattedStart} → —`;
      }
      
      const endDate = new Date(endStr);
      const formattedEnd = !isNaN(endDate.getTime())
        ? formatTimeOnly(endStr)
        : endStr;
      
      return `${formattedStart} → ${formattedEnd}`;
    }
    
    return shiftPeriod;
  } catch {
    return shiftPeriod;
  }
};

// ============================================
// FORMATTING UTILITIES
// ============================================
export const formatCurrency = (amount) => {
  return `₨ ${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const formatNumber = (amount) => {
  return Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// ============================================
// VALIDATION UTILITIES
// ============================================
export const createIntegerInputHandler = (setter) => (e) => {
  const value = e.target.value;
  if (/^\d{0,8}$/.test(value)) {
    setter(prev => ({ ...prev, [e.target.name]: value }));
  }
};

export const validateAmount = (amount, direction, ledgerKey, currentBalances) => {
  if (!amount || Number(amount) <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  if (direction === 'out') {
    const currentBalance = currentBalances[ledgerKey] || 0;
    const amountNum = Number(amount);
    
    if (amountNum > currentBalance) {
      return { 
        isValid: false, 
        error: `Amount exceeds current ${ledgerKey} balance of PKR ${currentBalance.toFixed(2)}` 
      };
    }
  }
  
  return { isValid: true, error: null };
};

// Helper function to get category options filtered by direction
export const getCategoryOptionsByDirection = (direction) => {
  return CATEGORY_OPTIONS.filter(opt => opt.direction === direction);
};

// ============================================
// CLEANUP UTILITIES
// ============================================
export const clearTimeouts = (...timeoutRefs) => {
  timeoutRefs.forEach(ref => {
    if (ref.current) clearTimeout(ref.current);
  });
};

export const abortControllers = (...controllerRefs) => {
  controllerRefs.forEach(ref => {
    if (ref.current) ref.current.abort();
  });
};

// ============================================
// DEFAULT VALUES
// ============================================
export const DEFAULT_BALANCES = {
  cash: '',
  bank: '',
  mobile: '',
  other: '',
};

// ============================================
// MAIN EXPORT OBJECT
// ============================================
export const CASHFLOW_MODULE_CONSTANTS = {
  HEADER_KEYS,
  getAuthHeaders,
  addBranchHeaders,
  
  API_TIMEOUT,
  SUCCESS_TIMEOUT,
  DEBOUNCE_DELAY,
  BALANCE_REFRESH_INTERVAL,
  
  SHIFT_CONSTANTS,
  MOVEMENT_CONSTANTS,
  REPORT_CONSTANTS,
  
  LEDGER_OPTIONS,
  CATEGORY_OPTIONS,
  getCategoryOptionsByDirection,
  DIRECTIONS,
  LEDGER_KEYS,
  REFERENCE_TYPES,
  
  getCurrentBusinessDate,
  getCurrentLocalDateTime,
  formatDateTime,
  formatDateOnly,
  formatTimeOnly,
  formatShiftPeriod,
  
  formatCurrency,
  formatNumber,
  
  createIntegerInputHandler,
  validateAmount,
  
  clearTimeouts,
  abortControllers,
  
  DEFAULT_BALANCES,
};

export default CASHFLOW_MODULE_CONSTANTS;