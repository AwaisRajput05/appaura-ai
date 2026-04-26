const BASE_URL = import.meta.env.VITE_BASE_URL;

export const INGESTION_SERVICE = `${BASE_URL}/ingestion/api`;
export const REPORT_SERVICE = `${BASE_URL}/reports/export`;
const CHEMIST_SERVICE = `${BASE_URL}/integration/chemist`;

export const apiEndpoints = {
  // ---- RECOMMENDATIONS ----
  DrugPriceComparison: (indication, page = 1, page_size = 10) =>
    `${CHEMIST_SERVICE}/drug-price-comparison?indication=${indication}&page=${page}&page_size=${page_size}`,
  AllergyAwareRecommendation: (
    exclude_side_effects,
    page = 1,
    page_size = 10
  ) =>
    `${CHEMIST_SERVICE}/allergy-aware-recommendation?exclude_side_effects=${exclude_side_effects}&page=${page}&page_size=${page_size}`,
  DrugSafetyCheck: (drugName, age, hasPrescription) =>
  `${CHEMIST_SERVICE}/drug-safety-check?drug_name=${encodeURIComponent(
    drugName
  )}&age=${age}&has_prescription=${hasPrescription ? "true" : "false"}`,


    DrugRecommend: (indication, exclude_drug = "", page = 1, page_size = 10) =>
    `${CHEMIST_SERVICE}/drug-recommendation?indication=${indication}&exclude_drug=${encodeURIComponent(exclude_drug)}&page=${page}&page_size=${page_size}`,
  
};
