// settingsModuleConstants.jsx
import { getToken } from "../../../../../services/tokenUtils";
import { HEADER_KEYS, getAuthHeaders, addBranchHeaders } from "../../../../../utils/authConstants";

// ============================================
// ENUMS (for type safety and readability)
// ============================================
export const SETTINGS_ENUMS = {
  // Schedule categories
  SCHEDULE_CATEGORY: {
    LOW_STOCK_MEDICINE: 'LOW_STOCK_MEDICINE',
    NEAR_EXPIRY_MEDICINE: 'NEAR_EXPIRY_MEDICINE'
  },
  
  // Frequency types
  FREQUENCY: {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY'
  },
  
  // Days of week
  DAYS_OF_WEEK: {
    MONDAY: 'MONDAY',
    TUESDAY: 'TUESDAY',
    WEDNESDAY: 'WEDNESDAY',
    THURSDAY: 'THURSDAY',
    FRIDAY: 'FRIDAY',
    SATURDAY: 'SATURDAY',
    SUNDAY: 'SUNDAY'
  },
  
  // Schedule status
  SCHEDULE_STATUS: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE'
  },
  
  // Filter periods
  FILTER_PERIOD: {
    TODAY: 'today',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year'
  },
  
  // Validation limits
  LIMITS: {
    THRESHOLD_MIN: 1,
    THRESHOLD_MAX: 100,
    NEAR_EXPIRY_MIN: 1,
    NEAR_EXPIRY_MAX: 12,
    DAY_OF_MONTH_MIN: 1,
    DAY_OF_MONTH_MAX: 28
  },
  
  // Pagination defaults
  PAGINATION_DEFAULTS: {
    PAGE: 1,
    PAGE_SIZE: 10
  }
};

// ============================================
// ERROR MESSAGES
// ============================================
export const ERROR_MESSAGES = {
  // General errors
  UNAUTHORIZED: "Unauthorized – Please log in again.",
  FORBIDDEN: "Access denied.",
  SERVER_ERROR: "Server error. Please try again later.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  
  // Validation errors
  INVALID_THRESHOLD: `Threshold must be between ${SETTINGS_ENUMS.LIMITS.THRESHOLD_MIN} and ${SETTINGS_ENUMS.LIMITS.THRESHOLD_MAX} units.`,
  INVALID_EXPIRY_MONTHS: `Near expiry months must be between ${SETTINGS_ENUMS.LIMITS.NEAR_EXPIRY_MIN} and ${SETTINGS_ENUMS.LIMITS.NEAR_EXPIRY_MAX}.`,
  INVALID_DAY_OF_MONTH: `Day of month must be between ${SETTINGS_ENUMS.LIMITS.DAY_OF_MONTH_MIN} and ${SETTINGS_ENUMS.LIMITS.DAY_OF_MONTH_MAX}.`,
  REQUIRED_FIELD: "This field is required.",
  
  // Schedule errors
  SCHEDULE_LOAD_FAILED: "Failed to load schedule data.",
  SCHEDULE_SAVE_FAILED: "Failed to save schedule configuration.",
  SCHEDULE_ACTIVATE_FAILED: "Failed to activate schedule.",
  SCHEDULE_DEACTIVATE_FAILED: "Failed to deactivate schedule.",
  HISTORY_LOAD_FAILED: "Failed to load history data.",
  
  // Default
  DEFAULT: "An error occurred. Please try again."
};

// ============================================
// SUCCESS MESSAGES
// ============================================
export const SUCCESS_MESSAGES = {
  SCHEDULE_SAVED: "Schedule configuration saved successfully!",
  SCHEDULE_ACTIVATED: "Schedule activated successfully!",
  SCHEDULE_DEACTIVATED: "Schedule deactivated successfully!"
};

// ============================================
// USER & BRANCH UTILITIES
// ============================================
export const getUserInfo = (user) => ({
  currentVendorId: user?.vendorId || user?.userId || '',
  originalBranchId: user?.currentBranch?.id || user?.branchId || localStorage.getItem('branchId') || 'main',
  isMaster: user?.isMaster || false,
  currentBusinessName: localStorage.getItem('businessName') || 'Current Branch'
});

export const getCurrentVendorId = (user) => user?.vendorId || user?.userId || '';
export const getOriginalBranchId = (user) => user?.currentBranch?.id || user?.branchId || localStorage.getItem('branchId') || 'main';
export const isUserMaster = (user) => user?.isMaster || false;

export const getBranchOptions = (user, childVendors = []) => {
  const { originalBranchId, currentBusinessName } = getUserInfo(user);
  
  const options = [
    { 
      value: 'current', 
      label: currentBusinessName, 
      branch_id: originalBranchId,
      business_name: currentBusinessName,
      type: 'current'
    }
  ];
  
  if (Array.isArray(childVendors)) {
    childVendors.forEach(item => {
      options.push({
        value: item.vendor_id,
        label: item.business_name || item.branch_id || `Branch ${item.vendor_id.substring(0, 8)}`,
        branch_id: item.branch_id,
        business_name: item.business_name || item.label || 'Branch',
        type: 'child'
      });
    });
  }
  
  return options;
};

// ============================================
// VALIDATION UTILITIES
// ============================================
export const validateThreshold = (threshold) => {
  return threshold !== null && 
         !isNaN(threshold) && 
         threshold >= SETTINGS_ENUMS.LIMITS.THRESHOLD_MIN && 
         threshold <= SETTINGS_ENUMS.LIMITS.THRESHOLD_MAX;
};

export const validateNearExpiryMonths = (months) => {
  return months !== null && 
         !isNaN(months) && 
         months >= SETTINGS_ENUMS.LIMITS.NEAR_EXPIRY_MIN && 
         months <= SETTINGS_ENUMS.LIMITS.NEAR_EXPIRY_MAX;
};

export const validateDayOfMonth = (day) => {
  if (!day) return false;
  const dayNum = parseInt(day, 10);
  return !isNaN(dayNum) && 
         dayNum >= SETTINGS_ENUMS.LIMITS.DAY_OF_MONTH_MIN && 
         dayNum <= SETTINGS_ENUMS.LIMITS.DAY_OF_MONTH_MAX;
};

export const clampValue = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

// ============================================
// FORMATTING UTILITIES
// ============================================
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return 'Never';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return 'Invalid date';
  }
};

export const formatFrequency = (frequency) => {
  const frequencyMap = {
    [SETTINGS_ENUMS.FREQUENCY.DAILY]: 'Daily',
    [SETTINGS_ENUMS.FREQUENCY.WEEKLY]: 'Weekly',
    [SETTINGS_ENUMS.FREQUENCY.MONTHLY]: 'Monthly'
  };
  return frequencyMap[frequency] || frequency;
};

export const formatDayOfWeek = (day) => {
  if (!day) return 'N/A';
  return day.charAt(0) + day.slice(1).toLowerCase();
};

export const getOrdinalSuffix = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

export const formatDayOfMonthDisplay = (value) => {
  if (!value) return 'Not set';
  try {
    const num = typeof value === 'number' ? value : parseInt(value, 10);
    return isNaN(num) ? value : `${num}${getOrdinalSuffix(num)}`;
  } catch (e) {
    return value;
  }
};

// ============================================
// FILTER OPTIONS
// ============================================
export const getFrequencyOptions = () => [
  { value: SETTINGS_ENUMS.FREQUENCY.DAILY, label: 'Daily' },
  { value: SETTINGS_ENUMS.FREQUENCY.WEEKLY, label: 'Weekly' },
  { value: SETTINGS_ENUMS.FREQUENCY.MONTHLY, label: 'Monthly' }
];

export const getDayOfWeekOptions = () => [
  { value: SETTINGS_ENUMS.DAYS_OF_WEEK.MONDAY, label: 'Monday' },
  { value: SETTINGS_ENUMS.DAYS_OF_WEEK.TUESDAY, label: 'Tuesday' },
  { value: SETTINGS_ENUMS.DAYS_OF_WEEK.WEDNESDAY, label: 'Wednesday' },
  { value: SETTINGS_ENUMS.DAYS_OF_WEEK.THURSDAY, label: 'Thursday' },
  { value: SETTINGS_ENUMS.DAYS_OF_WEEK.FRIDAY, label: 'Friday' },
  { value: SETTINGS_ENUMS.DAYS_OF_WEEK.SATURDAY, label: 'Saturday' },
  { value: SETTINGS_ENUMS.DAYS_OF_WEEK.SUNDAY, label: 'Sunday' }
];

export const getStatusOptions = () => [
  { value: '', label: 'All Status' },
  { value: SETTINGS_ENUMS.SCHEDULE_STATUS.ACTIVE, label: 'Active' },
  { value: SETTINGS_ENUMS.SCHEDULE_STATUS.INACTIVE, label: 'Inactive' }
];

export const getCreatedOptions = () => [
  { value: '', label: 'All Time' },
  { value: SETTINGS_ENUMS.FILTER_PERIOD.TODAY, label: 'Today' },
  { value: SETTINGS_ENUMS.FILTER_PERIOD.WEEK, label: 'This Week' },
  { value: SETTINGS_ENUMS.FILTER_PERIOD.MONTH, label: 'This Month' },
  { value: SETTINGS_ENUMS.FILTER_PERIOD.YEAR, label: 'This Year' }
];

// ============================================
// ERROR HANDLING UTILITIES
// ============================================
export const extractBackendMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  }
  return ERROR_MESSAGES.DEFAULT;
};

export const getErrorMessage = (error) => {
  if (!error) return ERROR_MESSAGES.DEFAULT;
  
  const status = error.response?.status;
  
  switch (status) {
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return ERROR_MESSAGES.FORBIDDEN;
    case 500:
      return ERROR_MESSAGES.SERVER_ERROR;
    default:
      return extractBackendMessage(error);
  }
};

// ============================================
// STATUS UTILITIES
// ============================================
export const getStatusInfo = (isActive) => {
  return {
    text: isActive ? 'Active' : 'Inactive',
    color: isActive ? 'text-green-600' : 'text-red-600',
    bgColor: isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200',
    badgeColor: isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
    iconColor: isActive ? 'text-green-500' : 'text-red-500'
  };
};

// ============================================
// DEFAULT VALUES
// ============================================
export const DEFAULT_VALUES = {
  SCHEDULE: {
    frequency: SETTINGS_ENUMS.FREQUENCY.DAILY,
    dayOfWeek: SETTINGS_ENUMS.DAYS_OF_WEEK.MONDAY,
    dayOfMonth: '1',
    threshold: 10,
    nearExpiryMonths: 1
  },
  FILTERS: {
    frequency: '',
    status: '',
    created: ''
  },
  PAGINATION: {
    page: SETTINGS_ENUMS.PAGINATION_DEFAULTS.PAGE,
    page_size: SETTINGS_ENUMS.PAGINATION_DEFAULTS.PAGE_SIZE,
    total: 0
  }
};

// ============================================
// UI COMPONENTS
// ============================================
export const CustomTableWrapper = ({ children, loading }) => {
  return (
    <div className="relative min-h-[400px]">
      <div className={`transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        {children}
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <span className="text-gray-600 font-medium">Loading history...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN EXPORT OBJECT
// ============================================
export const SETTINGS_MODULE_CONSTANTS = {
  ENUMS: SETTINGS_ENUMS,
  // Headers (imported from utils)
  HEADER_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  
  // API Functions (imported from utils)
  getAuthHeaders,
  addBranchHeaders,
  
  // User & Branch Functions
  getUserInfo,
  getCurrentVendorId,
  getOriginalBranchId,
  isUserMaster,
  getBranchOptions,
  
  // Validation Functions
  validateThreshold,
  validateNearExpiryMonths,
  validateDayOfMonth,
  clampValue,
  
  // Formatting Functions
  formatDateForDisplay,
  formatFrequency,
  formatDayOfWeek,
  getOrdinalSuffix,
  formatDayOfMonthDisplay,
  
  // Filter Options
  getFrequencyOptions,
  getDayOfWeekOptions,
  getStatusOptions,
  getCreatedOptions,
  
  // Error Handling
  extractBackendMessage,
  getErrorMessage,
  
  // Status Utilities
  getStatusInfo,
  
  // Default Values
  DEFAULT_VALUES,
  
  // UI Components
  CustomTableWrapper
};

export default SETTINGS_MODULE_CONSTANTS;