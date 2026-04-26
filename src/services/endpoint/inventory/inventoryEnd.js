   const BASE_URL = import.meta.env.VITE_BASE_URL;
const CHEMIST_SERVICE = `${BASE_URL}/integration/chemist`;
const TRANSFER_OMS_SERVICE = `${BASE_URL}/oms`;
export const apiEndpoints = {

      inventoryValue: () => `${CHEMIST_SERVICE}/drug-inventory-value`,
turnover: (page = 1, page_size = 10, drug_name = '') => `${CHEMIST_SERVICE}/drug-inventory-turnover?page=${page}&page_size=${page_size}${drug_name ? `&drug_name=${encodeURIComponent(drug_name)}` : ''}`,
  drugSupplyHistory: (page = 1, page_size = 10, drug_name = '', supplier_id = '') =>
    `${CHEMIST_SERVICE}/drug-supply-history?page=${page}&page_size=${page_size}` +
    `${drug_name ? `&drug_name=${encodeURIComponent(drug_name)}` : ''}` +
    `${supplier_id ? `&supplier_id=${encodeURIComponent(supplier_id)}` : ''}`,
  drugUpcomingSupplies: (page = 1, page_size = 10, drug_name = '') =>
    `${CHEMIST_SERVICE}/drug-upcoming-supplies?page=${page}&page_size=${page_size}` +
    `${drug_name ? `&drug_name=${encodeURIComponent(drug_name)}` : ''}`,

    drugRestock: () => `${CHEMIST_SERVICE}/drug-restock`,


    drugTotalSupplied: (page = 1, page_size = 10, group_by = 'drug') => `${CHEMIST_SERVICE}/drug-total-supplied?page=${page}&page_size=${page_size}&group_by=${group_by}`,
 drugLowStockAlert: (
  vendorIds = '',
  safetyBufferPct = 0.25,
  lookBackDays = 7,
  medicineType = '',
  page = 1,
  pageSize = 10
) => {
  const params = new URLSearchParams();

  if (vendorIds) params.append('vendorIds', vendorIds);
  if (safetyBufferPct) params.append('safetyBufferPct', safetyBufferPct);
  if (lookBackDays) params.append('lookBackDays', lookBackDays);
  if (medicineType) params.append('medicineType', medicineType);

  params.append('page', page);
  params.append('pageSize', pageSize);

  return `${CHEMIST_SERVICE}/low-stock-alert?${params.toString()}`;
},
  totalSupply: (vendorId) =>
    `${CHEMIST_SERVICE}/drug-total-supplied?vendor_id=${vendorId}`,
    addMedicine: () => `${CHEMIST_SERVICE}/add-medicine`,
    searchMedicine: (query) => `${CHEMIST_SERVICE}/search-medicine?drug_name=${encodeURIComponent(query)}`,
  addStock: () => `${CHEMIST_SERVICE}/add-stock`,
editMedicine: () => `${CHEMIST_SERVICE}/edit-medicine`,
drugStock: (query = "", fromDate = "", toDate = "",sortBy = "") => {
  const params = new URLSearchParams();

  if (query) params.append("drug_name", query);
  if (fromDate) params.append("fromDate", fromDate);
  if (toDate) params.append("toDate", toDate);
  if (sortBy) params.append("sortBy", sortBy);


  return `${CHEMIST_SERVICE}/search-by-drug-name${
    params.toString() ? `?${params.toString()}` : ""
  }`;
},


deleteItem: (id = "", batchCode = "", type = "") => {
  const params = new URLSearchParams();

  if (id) params.append("id", id);
  if (batchCode) params.append("batchCode", batchCode);
  if (type) params.append("type", type);

  return `${CHEMIST_SERVICE}/delete-item${
    params.toString() ? `?${params.toString()}` : ""
  }`;
},


allBranchMedicine: (drug_name = '', detail = false) =>
  `${CHEMIST_SERVICE}/all-branch-medicine` +
  `${drug_name || detail ? '?' : ''}` +
  `${drug_name ? `drug_name=${encodeURIComponent(drug_name)}` : ''}` +
  `${drug_name && detail ? '&' : ''}` +
  `${detail ? `detail=${detail}` : ''}`,




  editVendorCategoryName: () =>
    `${CHEMIST_SERVICE}/edit-vendor-category-name`,

  addVendorCategories: () =>
    `${CHEMIST_SERVICE}/add-vendor-categories`,

  vendorCategories: () =>
    `${CHEMIST_SERVICE}/vendor-categories`,

  removeVendorCategories: () =>
  `${CHEMIST_SERVICE}/delete-vendor-categories`,



    addGeneralProduct: () =>
    `${CHEMIST_SERVICE}/add-general-product`,

  searchGeneralProduct: (product_name = '', category = '') =>
    `${CHEMIST_SERVICE}/search-general-product` +
    `${product_name || category ? '?' : ''}` +
    `${product_name ? `product_name=${encodeURIComponent(product_name)}` : ''}` +
    `${product_name && category ? '&' : ''}` +
    `${category ? `category=${encodeURIComponent(category)}` : ''}`,


    editGeneralProduct: () =>
    `${CHEMIST_SERVICE}/edit-general-item`,




      // =======================
  // STOCK TRANSFER (OMS)
  // =======================

   createStockTransferRequest: () =>
    `${TRANSFER_OMS_SERVICE}/stock-transfers/transfer-bundle-request`,

    releaseStockTransferRequest: () =>
    `${TRANSFER_OMS_SERVICE}/stock-transfers/transfer-bundle-release `,

  cancelStockTransferRequest: () =>
    `${TRANSFER_OMS_SERVICE}/stock-transfers/transfer-bundle-cancel`,
 cancelStockAcknowledge: () =>
    `${TRANSFER_OMS_SERVICE}/stock-transfers/transfer-bundle-cancel-acknowledge `,

    rollbackStockTransferRequest: () =>
    `${TRANSFER_OMS_SERVICE}/stock-transfers/transfer-bundle-rollback-request `,
rollbackAcknowledge: () =>
    `${TRANSFER_OMS_SERVICE}/stock-transfers/transfer-bundle-rollback-acknowledge`,

 receiveStockTransferRequest: () =>
    `${TRANSFER_OMS_SERVICE}/stock-transfers/transfer-bundle-respond`,

  transferHistory: (
  ) =>
    `${TRANSFER_OMS_SERVICE}/stock-transfers/transfer-history?`,

   auditTransfer: (transferId) =>
  `${TRANSFER_OMS_SERVICE}/stock-transfers/transfer-audit?transferId=${encodeURIComponent(transferId)}`,



   // =======================
// LOCAL MEDICINE
// =======================

editLocalMedicine: (medicineId) =>
  `${CHEMIST_SERVICE}/local-medicine/edit-local-medicine?medicineId=${encodeURIComponent(medicineId)}`,

addStockLocalMedicine: () =>
  `${CHEMIST_SERVICE}/local-medicine/add-stock-local-medicine`,

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

deleteLocalMedicine: (medicineId) =>
  `${CHEMIST_SERVICE}/local-medicine/delete-local-medicine?medicineId=${encodeURIComponent(medicineId)}`,


transferinventory: () =>
  `${TRANSFER_OMS_SERVICE}/stock-transfers/search-by-transfer-inventory?drugName=${encodeURIComponent('')}&page=1&page_size=10`,
}