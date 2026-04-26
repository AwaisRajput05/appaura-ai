
// Token management utilities
export const getToken = () => {
  return localStorage.getItem('accessToken');
};

export const setToken = (accessToken, refreshToken, expiresIn, role) => {
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('role', role);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (expiresIn) {
      const expiresAt = Date.now() + expiresIn * 1000;
      localStorage.setItem('expiresAt', expiresAt.toString());
    }
  }
};

export const removeToken = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('role');
  localStorage.removeItem('userId');
  localStorage.removeItem('vendorId');
  localStorage.removeItem('companyName');
  localStorage.removeItem('expiresAt');
};

export const hasVendorAccess = () => {
  return localStorage.getItem('vendorId') !== null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};
