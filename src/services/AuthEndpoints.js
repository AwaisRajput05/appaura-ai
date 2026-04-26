import axios from 'axios';
import { apiEndpoints } from './apiEndpoints';

// Simple axios instance; we will pass headers per call
const api = axios.create({
  baseURL: apiEndpoints.signupResonse,
  timeout: 60000,
});

// ✅ AUTH ROUTES
export const signup = (vendor, { isFormData } = {}) =>
  api.post(`${apiEndpoints.signupResonse}`, vendor, {
    headers: isFormData
      ? { 'ngrok-skip-browser-warning': 'true' }
      : {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
    transformRequest: [(data) => data],
  });

export const checkUsernameExists = async (username) => {
  if (!username || username.trim().length < 3) {
    // console.log('Skipping check: username too short');
    return false;
  }

  // console.log('Checking username:', username);

  try {
    const response = await axios.get(apiEndpoints.username(username), {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      timeout: 10000,
    });

    // console.log('API Response:', {
    //   status: response.status,
    //   data: response.data,
    // });

    if (typeof response.data === 'boolean') {
      return response.data;
    }

    if (typeof response.data.exists === 'boolean') {
      return response.data.exists;
    }

    return true;
  } catch (err) {
    // console.error('Error checking username existence:', {
    //   message: err.message,
    //   code: err.code,
    //   status: err.response?.status,
    //   data: err.response?.data,
    // });

    if (err.response?.status === 500) {
      return false;
    }

    return false;
  }
};

// Rest of the file remains unchanged...
export const login = (credentials) =>
  api.post(`${apiEndpoints.loginResonse}`, credentials, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
  });

export const signupViaFetch = async (vendor) => {
  const isFormData =
    typeof FormData !== 'undefined' && vendor instanceof FormData;
  const res = await fetch(`${apiEndpoints.signupResonse}`, {
    method: 'POST',
    headers: isFormData
      ? { 'ngrok-skip-browser-warning': 'true' }
      : {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
    body: isFormData ? vendor : JSON.stringify(vendor),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text || 'Request failed' };
    }
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.response = { status: res.status, data };
    throw err;
  }
  return res.json();
};

export const getProfile = () => api.get(`${apiEndpoints.profile}`);
export const updateProfile = (vendor) =>
  api.put(`${apiEndpoints.profile}`, vendor);
export const submitVerification = (verification) =>
  api.post(`${apiEndpoints.verify}`, verification);
export const getAllVendors = (
  search,
  sortBy = 'companyName',
  sortDir = 'asc'
) =>
  api.get(`${apiEndpoints.vendors}`, { params: { search, sortBy, sortDir } });
export const updateVendorStatus = (vendorId, status) =>
  api.put(`${apiEndpoints.vendors}/${vendorId}/status`, null, {
    params: { status },
  });
