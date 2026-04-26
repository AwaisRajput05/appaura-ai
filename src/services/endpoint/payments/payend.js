const BASE_URL = import.meta.env.VITE_BASE_URL;
const PAYMENT_SERVICE = `${BASE_URL}`;

export const apiEndpoints = {
  // Your existing endpoint
  paymentrequest: () => `${PAYMENT_SERVICE}/access/subscription/plan-payment-request`,
  payhistory: (query = "") =>
    `${PAYMENT_SERVICE}/access/subscription/get/payment-requests`,
  // New endpoints following the same pattern
  getPaymentRequests: (status) => `${PAYMENT_SERVICE}/admin/api/get/payment-requests?status=${status}`,
  
  getTransactionImage: (vendorId, paymentRequestId) => 
    `${PAYMENT_SERVICE}/file/transaction/image?vendorId=${vendorId}&paymentRequestId=${paymentRequestId}`,
    
  planPaymentAction: () => `${PAYMENT_SERVICE}/admin/api/plan-payment/action`,
}