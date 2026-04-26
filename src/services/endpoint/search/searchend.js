const BASE_URL = import.meta.env.VITE_BASE_URL;
const CHEMIST_SERVICE = `${BASE_URL}/integration/chemist`;
export const apiEndpoints = {


    searchByAge: (age, page = 1, page_size = 10) =>
    `${CHEMIST_SERVICE}/search-by-age?age=${age}&page=${page}&page_size=${page_size}`,
  searchByDateRange: (
  start_date = '',
  end_date = '',
  type = '',
  medicine_name = '',
  page = 1,
  page_size = 10,
  vendor_id = ''
) =>
  `${CHEMIST_SERVICE}/search-by-date-range?` +
  `start_date=${encodeURIComponent(start_date)}` +
  `&end_date=${encodeURIComponent(end_date)}` +
  `&type=${encodeURIComponent(type)}` +
  `&medicine_name=${encodeURIComponent(medicine_name)}` +
  `&page=${page}` +
  `&page_size=${page_size}` +
  `${vendor_id ? "&vendor_id=" + vendor_id : ""}`,
  expiredordiscontinued: (page = 1, page_size = 10) =>
    `${CHEMIST_SERVICE}/expired-or-discontinued-drug?page=${page}&page_size=${page_size}`,
  searchByDrugName: (drug_name, page = 1, page_size = 10) =>
    `${CHEMIST_SERVICE}/search-by-drug-name?drug_name=${encodeURIComponent(
      drug_name
    )}&fuzzy=false&page=${page}&page_size=${page_size}`,
  searchByForm: (form, page = 1, page_size = 10) =>
    `${CHEMIST_SERVICE}/search-by-form?form=${encodeURIComponent(
      form
    )}&page=${page}&page_size=${page_size}`,
  searchByManufacturer: (manufacturer, page = 1, page_size = 10) =>
    `${CHEMIST_SERVICE}/search-by-manufacturer?manufacturer=${encodeURIComponent(
      manufacturer
    )}&page=${page}&page_size=${page_size}`,
  searchByIndication: (indication, page = 1, page_size = 10) =>
    `${CHEMIST_SERVICE}/search-by-indication?indication=${encodeURIComponent(
      indication
    )}&page=${page}&page_size=${page_size}`,
 searchByPrescription: (prescriptionRequired, page = 1, page_size = 10) => {
  const baseUrl = `${CHEMIST_SERVICE}/search-by-prescription`;
  const params = new URLSearchParams();
  
  params.append('page', page);
  params.append('page_size', page_size);

  // ONLY add prescription param if it's true or false
  if (prescriptionRequired === true) {
    params.append('prescription', 'true');
  } else if (prescriptionRequired === false) {
    params.append('prescription', 'false');
  }
  // If undefined → skip completely → nothing added

  return `${baseUrl}?${params.toString()}`;
},
  searchBySideEffect: (sideEffect, page = 1, page_size = 10) =>
    `${CHEMIST_SERVICE}/search-by-side-effect?side_effect=${encodeURIComponent(
      sideEffect
    )}&page=${page}&page_size=${page_size}`,
  advancedSearch: (params = {}, page = 1, page_size = 20) =>
    `${CHEMIST_SERVICE}/advanced-search?${new URLSearchParams({
      ...params,
      page: page.toString(),
      page_size: page_size.toString(),
    }).toString()}`,

    searchByIngredient: (ingredient, page = 1, page_size = 10) =>
  `${CHEMIST_SERVICE}/search-by-ingredient?ingredient=${encodeURIComponent(
    ingredient
  )}&page=${page}&page_size=${page_size}`,


  filterExpiredDrug: (page = 1, page_size = 10, search = "") =>
    `${CHEMIST_SERVICE}/filter-expired-drug?page=${page}&page_size=${page_size}${
      search ? `&drug_name=${encodeURIComponent(search.trim())}` : ""
    }`,

    searchgeneralMedicine: (drug_name, page = 1, page_size = 10) =>
  `${CHEMIST_SERVICE}/search-medicine?drug_name=${encodeURIComponent(
    drug_name
  )}&page=${page}&page_size=${page_size}`,


   fetchgeneralMedicine: (drug_name, page = 1, page_size = 10) =>
  `${CHEMIST_SERVICE}/fetch-general-medicines?drug_name=${encodeURIComponent(
    drug_name
  )}&page=${page}&page_size=${page_size}`,
};