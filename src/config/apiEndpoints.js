const BASE_URL = "https://api.mockfly.dev/mocks/4a08706a-a3ea-4db8-986c-d5ec8c101c8e";

// const BASE_URLs = "https://api.mockfly.dev/mocks/616fad79-a985-4a07-a916-3d1496e9792c";
const FRAUD_BASE = "https://api.mockfly.dev/mocks/897e33fb-fb39-4c89-a14b-341a4b1378a9";
const RECOMMENDER_BASE = "https://api.mockfly.dev/mocks/290f7e1e-677d-4191-ae2d-5b268ac14a97";
const DISCOUNT_BASE = "https://api.mockfly.dev/mocks/897e33fb-fb39-4c89-a14b-341a4b1378a9"

export const apiEndpoints = {
  transactionReport: `${BASE_URL}/transaction`,
  customerReport: `${BASE_URL}/customer`,
  predictionReport: `${BASE_URL}/prediction`,
  analyticReport: `${BASE_URL}/analytic-report`,
  fraudReport: `${FRAUD_BASE}/fraud`,
  recommended: `${RECOMMENDER_BASE}/recommended`,
  recommendedResponse: `${RECOMMENDER_BASE}/recommended-response`,
  discount: `${DISCOUNT_BASE}/discounts`,
  discountResponse: `${DISCOUNT_BASE}/discounts-response`,
  chatbotResponse: `${BASE_URL}/loyalty/analytic/nlp-query?query=`,
};
