// recommendationModuleConstants.jsx
import { getToken } from "../../../../../services/tokenUtils";
import { HEADER_KEYS, getAuthHeaders, addBranchHeaders } from "../../../../../utils/authConstants";

// ============================================
// ENUMS (for type safety and readability)
// ============================================
export const RECOMMENDATION_ENUMS = {
  // Safety status
  SAFETY_STATUS: {
    SAFE: 'safe',
    RISK: 'risk',
    PENDING: 'pending'
  },
  
  // Branch selection
  BRANCH_TYPE: {
    CURRENT: 'current',
    ALL: 'all',
    SPECIFIC: 'specific'
  },
  
  // API status codes
  STATUS_CODES: {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TOO_MANY_REQUESTS: 429,
    SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },
  
  // Age limits
  AGE_LIMITS: {
    MIN: 1,
    MAX: 120,
    DEFAULT: 30
  },
  
  // Default indications
  DEFAULT_INDICATIONS: [
    'fever', 'pain', 'headache', 'cough', 'cold',
    'allergy', 'infection', 'hypertension', 'diabetes'
  ]
};

// ============================================
// ERROR MESSAGES (specific to recommendation)
// ============================================
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized – Please log in again.",
  FORBIDDEN: "Access denied.",
  TOO_MANY_REQUESTS: "Too many requests. Please try again later.",
  SERVER_ERROR: "Server error. Please try again later.",
  SERVICE_UNAVAILABLE: "Service unavailable.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  SAFETY_CHECK_FAILED: "Safety check failed. Please verify the medicine name and age.",
  NO_ALTERNATIVES: "No alternative medicines found in stock.",
  INVALID_AGE: "Please enter a valid age (1-120 years).",
  INVALID_DRUG_NAME: "Please enter a valid medicine name.",
  DEFAULT: "An error occurred. Please try again."
};

// ============================================
// USER & BRANCH UTILITIES
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

export const getBranchOptions = (user, childVendors = []) => {
  const { originalBranchId, currentBusinessName } = getUserInfo(user);
  
  const options = [
    { 
      value: 'current', 
      label: currentBusinessName, 
      branch_id: originalBranchId,
      type: RECOMMENDATION_ENUMS.BRANCH_TYPE.CURRENT
    }
  ];
  
  if (Array.isArray(childVendors)) {
    childVendors.forEach(item => {
      options.push({
        value: item.vendor_id,
        label: item.business_name || item.branch_id || `Branch ${item.vendor_id.substring(0, 8)}`,
        branch_id: item.branch_id,
        type: RECOMMENDATION_ENUMS.BRANCH_TYPE.SPECIFIC
      });
    });
  }
  
  return options;
};

// ============================================
// VALIDATION UTILITIES
// ============================================
export const validateAge = (age) => {
  const ageNum = Number(age);
  return !isNaN(ageNum) && 
         ageNum >= RECOMMENDATION_ENUMS.AGE_LIMITS.MIN && 
         ageNum <= RECOMMENDATION_ENUMS.AGE_LIMITS.MAX;
};

export const validateDrugName = (name) => {
  return name && 
         typeof name === 'string' && 
         name.trim().length > 0 && 
         name.trim().length <= 100;
};

// ============================================
// ERROR HANDLING UTILITIES
// ============================================
export const getErrorMessage = (error) => {
  if (!error) return ERROR_MESSAGES.DEFAULT;
  
  const status = error.response?.status;
  
  switch (status) {
    case RECOMMENDATION_ENUMS.STATUS_CODES.UNAUTHORIZED:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case RECOMMENDATION_ENUMS.STATUS_CODES.FORBIDDEN:
      return ERROR_MESSAGES.FORBIDDEN;
    case RECOMMENDATION_ENUMS.STATUS_CODES.TOO_MANY_REQUESTS:
      return ERROR_MESSAGES.TOO_MANY_REQUESTS;
    case RECOMMENDATION_ENUMS.STATUS_CODES.SERVER_ERROR:
      return ERROR_MESSAGES.SERVER_ERROR;
    case RECOMMENDATION_ENUMS.STATUS_CODES.SERVICE_UNAVAILABLE:
      return ERROR_MESSAGES.SERVICE_UNAVAILABLE;
    default:
      return error.response?.data?.message || 
             error.message || 
             ERROR_MESSAGES.DEFAULT;
  }
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

export const truncateText = (text, maxLength = 50) => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// ============================================
// DEFAULT VALUES
// ============================================
export const DEFAULT_VALUES = {
  DRUG_SAFETY_RESULT: {
    isSafe: null,
    recommendation: 'Enter medicine details to check safety.',
    warnings: []
  },
  FILTERS: {
    indication: 'fever',
    exclude_drug: '',
    age: '',
    drugName: '',
    hasPrescription: false
  },
  PAGINATION: {
    page: 1,
    page_size: 10,
    total: 0
  }
};

// ============================================
// MAIN EXPORT OBJECT
// ============================================
export const RECOMMENDATION_MODULE_CONSTANTS = {
  ENUMS: RECOMMENDATION_ENUMS,
  // Headers (imported from utils)
  HEADER_KEYS,
  ERROR_MESSAGES,
  
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
  validateAge,
  validateDrugName,
  
  // Error Handling
  getErrorMessage,
  
  // Formatting Functions
  formatCurrency,
  truncateText,
  
  // Default Values
  DEFAULT_VALUES
};

export default RECOMMENDATION_MODULE_CONSTANTS;