const BASE_URL = import.meta.env.VITE_BASE_URL;
const CHEMIST_SERVICE = `${BASE_URL}/integration/chemist`;
export const apiEndpoints = {

  
  salesTrend: (
    category = '',
    time_period = '',
    page = 1,
    page_size = 10,
    search_term = ''
  ) =>
    `${CHEMIST_SERVICE}/sales-trends?category=${category}&time_period=${time_period}&page=${page}&page_size=${page_size}&search_term=${encodeURIComponent(
      search_term
    )}`,
  salesForecast: (forecast_days = 10, page = 1, page_size = 10) =>
    `${CHEMIST_SERVICE}/sales-forecast?forecast_days=${forecast_days}&page=${page}&page_size=${page_size}`,
  revenueAnalytics: (drug_name = '', page = 1, page_size = 10) =>
    `${CHEMIST_SERVICE}/revenue?drug_name=${drug_name}&page=${page}&page_size=${page_size}`,
  topSellingDrugs: (page = 1, page_size = 10, drug_name = '') =>
    `${CHEMIST_SERVICE}/top-selling-drug?page=${page}&page_size=${page_size}&drug_name=${encodeURIComponent(
      drug_name
    )}`,
  drugInventoryProfitMargin: (drug_name = '', page = 1, page_size = 10) =>
    `${CHEMIST_SERVICE}/drug-inventory-profit-margin?drug_name=${encodeURIComponent(
      drug_name
    )}&page=${page}&page_size=${page_size}`,
  analyticsByCategory: (category, page = 1, page_size = 10, search_term = '') =>
    `${CHEMIST_SERVICE}/analytics-by-category?category=${category}&page=${page}&page_size=${page_size}&search_term=${encodeURIComponent(
      search_term
    )}`,
  transactionComparison: (
    vendor_ids = '',
    period_type = '',
    base_date = '',
    compare_date = ''
  ) =>
    `${CHEMIST_SERVICE}/transaction-comparison?vendor_ids=${vendor_ids}&period_type=${period_type}&base_date=${base_date}&compare_date=${compare_date}`,
    

};