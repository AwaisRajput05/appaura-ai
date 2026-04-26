import axios from 'axios';

const apiService = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  timeout: 10000,
});

// Request interceptor
apiService.interceptors.request.use(
  (config) => {
    // Get subscription status from localStorage
    const subscriptionStatus = localStorage.getItem('subscriptionStatus');
    
    // If subscription is EXPIRED, block keymap and vendor-analytics APIs
    if (subscriptionStatus === 'EXPIRED') {
      const url = config.url || '';
      
      // List of APIs to block when subscription is expired
      const blockedAPIs = [
        '/keymap',
        '/vendor-analytics'
        // Add any other APIs that should be blocked here
      ];
      
      // Check if current request URL contains any blocked API endpoint
      const shouldBlock = blockedAPIs.some(apiEndpoint => 
        url.includes(apiEndpoint)
      );
      
      if (shouldBlock) {
        console.warn('🚫 Blocking API call: subscription expired', url);
        
        // Return a rejected promise to cancel the request
        // You can return mock data if needed instead
        return Promise.reject({
          config,
          message: 'Subscription expired - API call blocked',
          isBlocked: true
        });
      }
    }
    
    // Normal request processing
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['ngrok-skip-browser-warning'] = 'true';
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — FIXED: Don't redirect on keymap 401
apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if this error is from our blocked API (subscription expired)
    if (error.isBlocked) {
      // This is our blocked request, don't process further
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      // IGNORE 401 from keymap endpoints — don't logout!
      if (error.config?.url?.includes('/keymap')) {
        console.warn('Keymap 401 ignored — not logging out');
        return Promise.reject(error); // just reject quietly
      }

      // Only logout for real auth failures (not keymap)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('expiresAt');
      localStorage.removeItem('companyName');
      // Add any other items you clear

      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default apiService;

export const get = (url, config = {}) => apiService.get(url, config);
export const post = (url, data = {}, config = {}) => apiService.post(url, data, config);
export const put = (url, data = {}, config = {}) => apiService.put(url, data, config);
export const del = (url, config = {}) => apiService.delete(url, config);
export const patch = (url, data = {}, config = {}) => apiService.patch(url, data, config);