// utils/authConstants.jsx
import { getToken } from "../services/tokenUtils";

// ============================================
// CENTRALIZED HEADER CONSTANTS
// ============================================
export const HEADER_KEYS = {
  AUTHORIZATION: 'Authorization',
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
  USER_BRANCH_ID: 'X-User-Branch-Id',
  CHILD_ID: 'X-Child-Id',
  VENDOR_ID: 'X-Vendor-ID'
};

// ============================================
// AUTH HEADER UTILITIES
// ============================================
export const getAuthHeaders = (token = null, vendorId = null) => {
  if (!token) token = getToken();
  
  const headers = {
    [HEADER_KEYS.AUTHORIZATION]: `Bearer ${token}`,
    [HEADER_KEYS.CONTENT_TYPE]: 'application/json',
    [HEADER_KEYS.ACCEPT]: 'application/json'
  };
  
  if (vendorId) {
    headers[HEADER_KEYS.VENDOR_ID] = vendorId;
  }
  
  return headers;
};

export const addBranchHeaders = (headers, selectedBranchId, selectedChildVendorId, currentVendorId) => {
  if (selectedBranchId) {
    headers[HEADER_KEYS.USER_BRANCH_ID] = selectedBranchId;
  }
  
  if (selectedChildVendorId && selectedChildVendorId !== currentVendorId) {
    headers[HEADER_KEYS.CHILD_ID] = selectedChildVendorId;
  }
  
  return headers;
};

// ============================================
// API UTILITIES
// ============================================
export const createAbortController = () => new AbortController();
export const isAbortError = (err) => err.name === 'AbortError';