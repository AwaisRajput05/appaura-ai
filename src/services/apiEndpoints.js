import ActiveSubaccounts from "../components/features/branches/ActiveSubAcc";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const LOYELTY_SERVICE = `${BASE_URL}/loyalty/analytic`;
const OWNBOARD_SERVICE = `${BASE_URL}/onboarding/auth`;
const ADMIN_SERVICE = `${BASE_URL}/admin/api`;
const VENDOR_SERVICE = `${BASE_URL}/vendors`;
const OFFER_SERVICE = `${BASE_URL}/offer`;
const INVENTORY_PRODUCTS = `${BASE_URL}/inventory/api`;
const PROFILE_SERVICE = `${BASE_URL}/onboarding/vendors`;
const PAYMENTS_SERVICE = `${BASE_URL}/payments`;
const ROLES_SERVICE = `${BASE_URL}/employee`;
const FINANCIAL_SERVICE = `${BASE_URL}/financial/api`;
export const INGESTION_SERVICE = `${BASE_URL}/ingestion/api`;
export const REPORT_SERVICE = `${BASE_URL}/reports/export`;
const CHEMIST_SERVICE = `${BASE_URL}/integration/chemist`;
const ORDER_SERVICE = `${BASE_URL}`;
const OWNBOARD = `${BASE_URL}/onboarding`;
const ACCESS = `${BASE_URL}/access`;
const FILE = `${BASE_URL}/file`;
const SUPPLIER = `${BASE_URL}/oms/supplier`;
const COMPANY_SERVICE = `${ADMIN_SERVICE}/company`;
export const apiEndpoints = {
  vendorsPaginated: `${ADMIN_SERVICE}/slice-paging`,
  approveVendor: (vendorId) => `${ADMIN_SERVICE}/approve/${vendorId}`,
  blockVendor: (vendorId, reason) =>
    `${ADMIN_SERVICE}/block/${vendorId}`,
  transactionReport: (vendorId) =>
    `${BASE_URL}/transaction?vendor_id=${vendorId}`,
  refreshtoken: `${OWNBOARD_SERVICE}/refresh-token`,
  subaccounthold: `${CHEMIST_SERVICE}/sub-branch-vendor-analytics`,
  customerReport: `${BASE_URL}/customers`,
  vendorDashboard: () => `${CHEMIST_SERVICE}/vendor-analytics`,
  predictionReport: `${BASE_URL}/prediction`,
  financeDashboard: `${CHEMIST_SERVICE}/finance-dashboard`,
  changeVendorPassword: () => `${OWNBOARD}/vendors/change-password`,
  analyticReport: `${BASE_URL}/analytic-report`,
  segmentationReport: `${LOYELTY_SERVICE}/customer-segmentation-based-on-purchasing-behavior`,
  saveTemplate: `${OFFER_SERVICE}/offer-template/save`,
  getTemplate: (id) => `${OFFER_SERVICE}/offer-template/${id}`,
  deleteTemplate: (id) => `${OFFER_SERVICE}/offer-template/delete/${id}`,
  updateTemplate: (id) => `${OFFER_SERVICE}/offer-template/update/${id}`,
  analyticsReport: `${LOYELTY_SERVICE}/loyalty-program-analysis`,
  churnReport: `${LOYELTY_SERVICE}/churn-prediction`,
  demographicReport: `${LOYELTY_SERVICE}/demographic-based-analysis`,
  loyaltyFraudReport: `${LOYELTY_SERVICE}/fraud-detection`,
  loyaltyPredicitions: `${LOYELTY_SERVICE}/customer-lifetime-value`,
  chatbotResponse: (vendorId) =>
    `${LOYELTY_SERVICE}/nlp-query?vendor_id=${vendorId}&query=`,


  signupemail: `${OWNBOARD_SERVICE}/email/exist?email=<EMAIL>`,


crnValidate: (crn) => `${OWNBOARD_SERVICE}/crn/validate?crn=${encodeURIComponent(crn)}`,
  nextProductPredictions: `${LOYELTY_SERVICE}/next-product-purchase-predictions`,
  customerJourney: `${LOYELTY_SERVICE}/customer-journey-mapping`,
  anomalyReport: `${LOYELTY_SERVICE}/anomaly-detect-transaction-pattern`,
  geograpicSales: `${LOYELTY_SERVICE}/geographic-sales-analysis`,
  productRecommendations: `${LOYELTY_SERVICE}/personalized-product-recommendations`,
  customerBehaviour: `${LOYELTY_SERVICE}/impact-of-promotion-on-customer-behavior`,
  salesPerformance: `${LOYELTY_SERVICE}/store-performance-analysis`,
  marketBasket: `${LOYELTY_SERVICE}/market-basket-analysis`,
  transactionTrend: `${LOYELTY_SERVICE}/time-series-analysis-for-transaction-trend`,
  signupResonse: `${OWNBOARD_SERVICE}/signup`,
  loginResonse: `${OWNBOARD_SERVICE}/login`,

  getEmployeePermissions: (employeeId) =>
    `${ROLES_SERVICE}/permissions?employeeId=${employeeId}`,
vendorDashboard: () => `${CHEMIST_SERVICE}/vendor-analytics`,
financeDashboard: () => `${CHEMIST_SERVICE}/finance-dashboard`,
  username: (username) =>
    `${OWNBOARD_SERVICE}/${encodeURIComponent(username)}/exist`,
  generateBranchCode: `${ACCESS}/branches/generate-branch-code`,
  listBranches: `${ACCESS}/roles/list-branches`,
  ActiveSubaccounts: `${ACCESS}/subaccounts/active`,
  forgetPasswordRequest: `${OWNBOARD_SERVICE}/forget-password/request`,
forgetPasswordVerify: `${OWNBOARD_SERVICE}/forget-password/verify`,
forgetPasswordReset: `${OWNBOARD_SERVICE}/forget-password/reset`,
  getBranchPermissions: (branchId) =>
    `${OWNBOARD}/roles/permissions/${branchId}`,
  assignBranchPermissions: `${OWNBOARD}/roles/assign`,
  createSubAccount: (type = 'FINANCE') =>
    `${ACCESS}/subaccounts/create?type=${type}`,
  vendors: `${ADMIN_SERVICE}/vendors`,
  profile: (id) => `${PROFILE_SERVICE}/profile?id=${id}`,
  verify: `${VENDOR_SERVICE}/verify`,
  uploadCsv: `${INGESTION_SERVICE}/upload`,
  getAllCustomers: `${INGESTION_SERVICE}/get-all-customers`,
  trackFilesHistory: (startDate, endDate) =>
    `${INGESTION_SERVICE}/track-files/history?startDate=${startDate}&endDate=${endDate}`,
  vendorOffers: `${OFFER_SERVICE}/offers`,
  updateOffer: (offerId) => `${OFFER_SERVICE}/update/${offerId}`,
  updateOfferStatus: (offerId) => `${OFFER_SERVICE}/update/status/${offerId}`,
  createOffer: `${OFFER_SERVICE}/create`,
  template: `${OFFER_SERVICE}/templates`,
  createOfferFromTemplate: (templateId) =>
    `${OFFER_SERVICE}/offer-template/use/${templateId}`,
  inventory: `${INVENTORY_PRODUCTS}/products`,
  lowStock: `${INVENTORY_PRODUCTS}/low-stock`,
  bestSellingUnderstocked: `${INVENTORY_PRODUCTS}/best-selling-understocked`,
  topSelling: `${INVENTORY_PRODUCTS}/top-selling`,
  priceRecommendations: `${INVENTORY_PRODUCTS}/price-recommendations?daysBack=30`,
  recommendDiscounts: `${INVENTORY_PRODUCTS}/recommend-discounts?daysBack=30`,
  inventoryExportPdf: `${INVENTORY_PRODUCTS}/pdf`,
  inventoryExportCsv: `${INVENTORY_PRODUCTS}/csv`,
  reportsExportPdf: `${REPORT_SERVICE}/pdf`,
  reportsExportCsv: `${REPORT_SERVICE}/csv`,
  payments: `${PAYMENTS_SERVICE}/get-all-payments`,
  adminDashboard: (vendorId) =>
    `${BASE_URL}/admin/api/analytics`,
  vendorApiUsageData: (vendorId) =>
    `${LOYELTY_SERVICE}/vendor-api-usage-data?vendor_id=${vendorId}`,
  adminApiUsageData: `${LOYELTY_SERVICE}/admin-api-usage-data`,
  getAllClaims: `${FINANCIAL_SERVICE}/claims/get-all`,
  updateClaim: (claimId) => `${FINANCIAL_SERVICE}/claims/${claimId}`,
  createClaim: `${FINANCIAL_SERVICE}/claims/`,
  getAllAccounts: `${FINANCIAL_SERVICE}/accounts/get-all`,
  updateAccount: (accountId) => `${FINANCIAL_SERVICE}/accounts/${accountId}`,
  createAccount: `${FINANCIAL_SERVICE}/accounts/`,
  getAllTaxRecords: `${FINANCIAL_SERVICE}/tax-records/get-all`,
  updateTaxRecord: (taxRecordId) =>
    `${FINANCIAL_SERVICE}/tax-records/${taxRecordId}`,
  createTaxRecord: `${FINANCIAL_SERVICE}/tax-records/`,
  getAllStatements: `${FINANCIAL_SERVICE}/statements/get-all`,
  updateStatement: (statementId) =>
    `${FINANCIAL_SERVICE}/statements/${statementId}`,
  createStatement: `${FINANCIAL_SERVICE}/statements/`,
  fetchMedicines: () => `${CHEMIST_SERVICE}/fetch-medicines`,
  // services/endpoint/salespoint/salespointend.js
cnicFront: `${FILE}/kyc/cnic-front`,
  cnicBack: `${FILE}/kyc/cnic-back`,
license: `${FILE}/kyc/license`,
// services/apiEndpoints.js
vendorsSaleTransaction: () => `${CHEMIST_SERVICE}/vendors-sale-transaction`,

vendorViewTransaction: (payment_type) =>
  `${CHEMIST_SERVICE}/vendor-view-transaction?`,
placeOrder: () => `${ORDER_SERVICE}/oms/orders/create`,
drugLowStockAlert: (name = '', threshold = 50, startDate = '', endDate = '', manufacturer = '', page = 1, page_size = 10) => {
  const params = new URLSearchParams();
  if (name) params.append('name', name);
  if (threshold) params.append('threshold', threshold);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (manufacturer) params.append('manufacturer', manufacturer);
  params.append('page', page);
  params.append('page_size', page_size);
  
  return `${CHEMIST_SERVICE}/drug-low-stock-alert?${params.toString()}`;
},
branchOrders: () => `${ORDER_SERVICE}/oms/orders/branch`,
masterOrders: () => `${ORDER_SERVICE}/oms/orders/master`,
markOrderReceived: (orderId) => `${ORDER_SERVICE}/oms/orders/receipts/${orderId}`,
dispatchOrder: (orderId) => `${ORDER_SERVICE}/oms/orders/dispatches/${orderId}`,
completeOrder: (orderId) => `${ORDER_SERVICE}/oms/orders/receipts/${orderId}`,
orderdetails: ( orderId) => 
    `${ORDER_SERVICE}/oms/orders/details/${orderId}`,
orderSlip: (orderId) => `${FILE}/dispatch/slip/${orderId}`,
validateauth: `${OWNBOARD_SERVICE}/validate`,

getVendorLogo: (vendorId) =>
  `${FILE}/logo/${vendorId}`,
drugStock: (query = "") => 
  `${CHEMIST_SERVICE}/search-by-drug-name${query ? `?drug_name=${encodeURIComponent(query)}` : ""}`,
supplierMedicine: (query = "") => 
  `${SUPPLIER}/fetch-supplier-medicine${query ? `?name=${encodeURIComponent(query)}` : ""}`,


supplierdelete: (supplierId) =>
  `${SUPPLIER}/delete-supplier?supplierId=${supplierId}`,

     getVendorById: (vendorId) =>
    `${ADMIN_SERVICE}/vendor/${encodeURIComponent(vendorId)}`,

  // GET a master vendor by ID
  getMasterVendorById: (vendorId) =>
    `${ADMIN_SERVICE}/master_vendor/${encodeURIComponent(vendorId)}`,





  // ================= SUPPLIER APIs =================

// Get all suppliers
supplierList: `${SUPPLIER}/supplier-list`,

// Create supplier
createSupplier: (hasMedicines = true) =>
  `${SUPPLIER}/create-supplier?hasMedicines=${hasMedicines}`,

//create order
supplierOrders: (supplierId) =>
  `${SUPPLIER}/orders?supplierId=${supplierId}`,

// Edit(supplierId + orderId)
supplierOrderEdit: (supplierId, orderId) =>
  `${SUPPLIER}/orders?supplierId=${supplierId}&orderId=${orderId}`,

// Update supplier order status
supplierOrderStatus: (supplierId, orderId) =>
  `${SUPPLIER}/orders-status?supplierId=${supplierId}&orderId=${orderId}`,

// Edit supplier
editSupplier: `${SUPPLIER}/edit-suppliers`,


// Search supplier orders with filters
supplierOrderSearch: (
  supplier_id,
) =>
  `${SUPPLIER}/orders-search?supplierId=${supplier_id}`,


  supplierOrder: `${SUPPLIER}/orders-search`,
  deletesuppmedicine: (supplierId, medicineIds) =>
  `${SUPPLIER}/delete-multi-suppliers-medicines?supplierId=${supplierId}&medicineIds=${medicineIds}`,

deleteOrder: (supplierId, orderId) =>
  `${SUPPLIER}/orders?supplierId=${supplierId}&orderId=${orderId}`,

deleteOrderMedicine: (supplierId, orderId, medicineId) =>
  `${SUPPLIER}/orders-items?supplierId=${supplierId}&orderId=${orderId}&medicineIds=${medicineId}`,




///Admin company api's

// ================= COMPANY ADMIN APIs =================

// 1) SAVE OR UPDATE COMPANY
saveOrUpdateCompany: `${COMPANY_SERVICE}/save`,

// 2) UPDATE COMPANY STATUS (Activate / Deactivate)
updateCompanyStatus: (id, companyStatus, notes) =>
  `${COMPANY_SERVICE}/status/${id}?companyStatus=${companyStatus}&notes=${encodeURIComponent(notes)}`,

// 3) SEND REFERRAL CODE to email to user 
sendReferralCode: (id) =>
  `${COMPANY_SERVICE}/send/referral-code/${id}`,

// 4) GET ALL COMPANIES (PAGINATED)
getAllCompanies: (
  search = "",
  companyStatus = "",
  startDate = "",
  endDate = "",
  page = 1,
  size = 10
) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (companyStatus) params.append("companyStatus", companyStatus);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  params.append("page", page);
  params.append("size", size);

  return `${COMPANY_SERVICE}/all?${params.toString()}`;
},

// 5) CURRENT MONTH REPORT
currentMonthReport: (
  id = "",
  search = "",
  sortBy = "DESC",
  detail = false,
  page = 1,
  size = 10
) => {
  const params = new URLSearchParams();

  if (id) params.append("id", id);
  if (search) params.append("search", search);

  params.append("sortBy", sortBy);
  params.append("detail", detail);
  params.append("page", page);
  params.append("size", size);

  return `${COMPANY_SERVICE}/current-month?${params.toString()}`;
},

// 6) VENDOR TRACKING DATA
vendorTrackingData: (
  crn,
  year = "",
  month = "",
  status = "",
  page = 1,
  size = 10
) => {
  const params = new URLSearchParams();
  params.append("crn", crn);
  if (year) params.append("year", year);
  if (month) params.append("month", month);
  if (status) params.append("status", status);
  params.append("page", page);
  params.append("size", size);

  return `${COMPANY_SERVICE}/vendor-tracking-data?${params.toString()}`;
},

// 7) MONTHLY REPORT HISTORY
monthlyReportHistory: (
  search = "",
  fromDate = "",
  toDate = "",
  sort = "DESC",
  detail = false,
  companyStatus = "",
  paymentStatus = "",
  page = 1,
  size = 10
) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (fromDate) params.append("fromDate", fromDate);
  if (toDate) params.append("toDate", toDate);
  params.append("sort", sort);
  params.append("detail", detail);
  if (companyStatus) params.append("companyStatus", companyStatus);
  if (paymentStatus) params.append("paymentStatus", paymentStatus);
  params.append("page", page);
  params.append("size", size);

  return `${COMPANY_SERVICE}/monthly-report?${params.toString()}`;
},

// 8) MARK REPORT AS PAID (Multipart Form Data)
markReportAsPaid: (id) =>
  `${COMPANY_SERVICE}/pay/${id}`,
// Get Monthly Slip (Transaction)
togetslip: (id, yearMonth) =>
  `${FILE}/transaction/get/monthly-slip/${encodeURIComponent(id)}/${encodeURIComponent(yearMonth)}`,


vendordetails: (vendorId) => `${OWNBOARD}/vendors/${vendorId}`,
monthlyReportDetail: (id) => `${COMPANY_SERVICE}/view/monthly-report/detail/${id}`,




};
