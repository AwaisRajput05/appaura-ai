// Rate limiting utilities
let lastRefreshAttempt = 0;
const REFRESH_COOLDOWN = 2000; // 2 seconds between refresh attempts

export const canAttemptRefresh = () => {
  const now = Date.now();
  if (now - lastRefreshAttempt >= REFRESH_COOLDOWN) {
    lastRefreshAttempt = now;
    return true;
  }
  return false;
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
