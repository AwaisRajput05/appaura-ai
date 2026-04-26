const BASE_URL = import.meta.env.VITE_BASE_URL;
const CHEMIST_SERVICE = `${BASE_URL}/integration/chemist`;
export const apiEndpoints = {
searchInvoiceByNumber: (invoice_no, page = 1, page_size = 10) =>
    `${CHEMIST_SERVICE}/transaction-search?invoice_no=${encodeURIComponent(
      invoice_no
    )}&fuzzy=false&page=${page}&page_size=${page_size}`,
    
  processReturn: `${CHEMIST_SERVICE}/process-return`,

  drugSellMedicine: `${CHEMIST_SERVICE}/drug-sell-medicine`,
  AllInvoices: (vendor_id, page = 1, page_size = 10) =>
    `${CHEMIST_SERVICE}/transaction-search?page=${page}&page_size=${page_size}`,
posSearchMedicine: (drug_name, page = 1, page_size = 10) =>
  `${CHEMIST_SERVICE}/pos-search-medicine?drug_name=${encodeURIComponent(
    drug_name
  )}&page=${page}&page_size=${page_size}`,


cleardue:() =>
  `${CHEMIST_SERVICE}/clear-due-amount`,

  // In apiEndpoints.js - UPDATE THIS
returnSearch: (branch_id, page = 1, page_size = 10, returned_invoice_no = "", invoice_no = "", return_date_from = "", return_date_to = "") => {
    let url = `${CHEMIST_SERVICE}/return-search?page=${page}&page_size=${page_size}`;
    
    
    // Add returned_invoice_no if provided
    if (returned_invoice_no && returned_invoice_no.trim()) {
        url += `&returned_invoice_no=${encodeURIComponent(returned_invoice_no.trim())}`;
    }
    
    // Add invoice_no if provided
    if (invoice_no && invoice_no.trim()) {
        url += `&invoice_no=${encodeURIComponent(invoice_no.trim())}`;
    }
    
    // Add date filters if provided
    if (return_date_from) {
        url += `&return_date_from=${encodeURIComponent(return_date_from)}`;
    }
    
    if (return_date_to) {
        url += `&return_date_to=${encodeURIComponent(return_date_to)}`;
    }
    
    return url;
},
  searchByPhone: (phone, page = 1, page_size = 10) =>
  `${CHEMIST_SERVICE}/search-by-phone?phone=${encodeURIComponent(
    phone
  )}&page=${page}&page_size=${page_size}`,


updateCustomerDetails: `${CHEMIST_SERVICE}/update-customer-details`,

// In your endpoints file: salespointend.js or wherever apiEndpoints is defined

searchByCustomerDetail: (phone, page = 1, page_size = 10) => {
  if (!phone || phone.trim() === "") {
    // You can return a dummy or throw, but better to let frontend handle it
    return `${CHEMIST_SERVICE}/search-by-customer-detail`; // base only, no params
  }
  return `${CHEMIST_SERVICE}/search-by-customer-detail?phone=${encodeURIComponent(phone.trim())}&page=${page}&page_size=${page_size}`;
},

getcustomerinfo: (phone) =>
  `${CHEMIST_SERVICE}/get-customer-balance?phone=${encodeURIComponent(
    phone
  )}`,

getCustomerPendingDue: (customerId) =>
  `${CHEMIST_SERVICE}/pending-transactions?customerId=${encodeURIComponent(customerId)}`,

clearMultipleDue: () => `${CHEMIST_SERVICE}/clear-multiple-due`,


  posGeneralProduct: (product_name, page = 1, page_size = 10) =>
  `${CHEMIST_SERVICE}/pos-general-product?product_name=${encodeURIComponent(
    product_name
  )}&page=${page}&page_size=${page_size}`,


  deleteCustomerDetail: (phone) =>
  `${CHEMIST_SERVICE}/delete-the-customer-detail?phone=${encodeURIComponent(
    phone
  )}`,



  searchLocalMedicines: (
  name = '',
  start_date = '',
  end_date = '',
  page = 1,
  page_size = 10
) => {
  const params = new URLSearchParams();

  if (name) params.append('name', name);
  if (start_date) params.append('start_date', start_date);
  if (end_date) params.append('end_date', end_date);

  params.append('page', page);
  params.append('page_size', page_size);

  return `${CHEMIST_SERVICE}/local-medicine/search-local-medicines?${params.toString()}`;
},
};