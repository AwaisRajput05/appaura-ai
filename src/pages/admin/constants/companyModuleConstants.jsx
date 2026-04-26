// companyModuleConstants.jsx - Unified constants for Company/Partner modules

// ============================================
// DATE FORMATTING - UTC TO LOCAL CONVERTER
// ============================================

export const formatDate = (dateString, showTime = false) => {
  if (!dateString) return "N/A";
  
  try {
    let date;
    
    if (typeof dateString === 'string') {
      // Format: "2026-07-12" (date only)
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      }
      // Format: "2026-04-15T05:55:53.000Z" (ISO)
      else if (dateString.includes('T')) {
        date = new Date(dateString);
      }
      // Format: "2026-04-15 05:55:53" (with space)
      else if (dateString.includes(' ') && !dateString.includes('T')) {
        const utcString = dateString.replace(' ', 'T') + 'Z';
        date = new Date(utcString);
      }
      // Fallback
      else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) return dateString;
    
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

// For backward compatibility with existing code
export const formatDisplayDate = (dateString) => formatDate(dateString, false);
export const formatDisplayDateTime = (dateString) => formatDate(dateString, true);

// ============================================
// MONTH NAME HELPER
// ============================================
export const getMonthName = (monthNumber) => {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return monthNames[monthNumber - 1] || "Invalid Month";
};

// ============================================
// AUTH HEADERS
// ============================================
export const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

export const getFormDataHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
});

// ============================================
// ERROR HANDLING
// ============================================
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.error) return error.response.data.error;
  if (error.message) return error.message;
  return "An unexpected error occurred";
};

// ============================================
// CURRENCY FORMATTING
// ============================================
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', { 
    style: 'currency', 
    currency: 'PKR' 
  }).format(amount || 0);
};

// ============================================
// MAIN EXPORT
// ============================================
export const COMPANY_MODULE_CONSTANTS = {
  formatDate,
  formatDisplayDate,
  formatDisplayDateTime,
  getMonthName,
  getAuthHeaders,
  getFormDataHeaders,
  getErrorMessage,
  formatCurrency,
};

export default COMPANY_MODULE_CONSTANTS;