import React from 'react';

const SubscriptionComponent = () => {
  return (
    <div className="bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Subscription
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your subscription options below.
          </p>
        </div>
        <div className="bg-white shadow-xl rounded-lg p-8">
          <div className="space-y-6">
            {/* Analysis Section */}
            <div>
              <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                Analysis
                {/* <span className="text-xs text-indigo-600 font-normal">Select analysis reports</span> */}
              </label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: 'FRAUD_DETECT', label: 'Fraud Detect', description: 'Detect fraudulent activities' },
                  { value: 'ANALYSIS', label: 'Analysis', description: 'Track customer interactions' },
                  { value: 'ANOMALY', label: 'Anomaly', description: 'Track Anomaly' },
                  { value: 'SEGMENTATION', label: 'Segmentation', description: 'Track segmentation' },
                  { value: 'GEOGRAPHIC_SALES', label: 'Geographic Sales', description: 'Track geographic sales' },
                  { value: 'STORE_PERFORMANCE', label: 'Store Performance', description: 'Track store performance' },
                  { value: 'MARKET_BASKET', label: 'Market Basket', description: 'Track customer market basket' },
                  { value: 'TRANSACTION_TREND', label: 'Transaction Trend', description: 'Track transaction trend' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="relative flex items-start py-2 px-3 rounded-lg border border-gray-200 hover:border-indigo-500 cursor-pointer transition-all duration-200"
                  >
                    <div className="min-w-0 flex-1 text-sm">
                      <input
                        type="checkbox"
                        value={option.value}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-3"
                      />
                      <span className="font-medium text-gray-700">{option.label}</span>
                      <p className="text-xs text-gray-500 mt-1 ml-7">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Analytics Section */}
            <div>
              <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                Analytics
                {/* <span className="text-xs text-indigo-600 font-normal">Select analytics reports</span> */}
              </label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: 'CUSTOMER_LIFE_TIME', label: 'Customer Life Time', description: 'Analyze customer lifetime value' },
                  { value: 'CHURN_REPORT', label: 'Churn Report', description: 'Report on customer churn rates' },
                  { value: 'CUSTOMER_BEHAVIOUR', label: 'Customer Behaviour', description: 'Study customer behavior patterns' },
                  { value: 'CUSTOMER_JOURNEY', label: 'Customer Journey', description: 'Study customer journey patterns' },
                  { value: 'Next_product_purchase', label: 'Next Product Purchase', description: 'purchase products' },
                  { value: 'PRODUCT_RECOMMENDATION', label: 'Product Recommendation', description: 'recommendations' },
                  { value: 'DEMPOGRAPHICS_REPORT', label: 'Demographics Report', description: 'Study Demograpgic Reports ' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="relative flex items-start py-2 px-3 rounded-lg border border-gray-200 hover:border-indigo-500 cursor-pointer transition-all duration-200"
                  >
                    <div className="min-w-0 flex-1 text-sm">
                      <input
                        type="checkbox"
                        value={option.value}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-3"
                      />
                      <span className="font-medium text-gray-700">{option.label}</span>
                      <p className="text-xs text-gray-500 mt-1 ml-7">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionComponent;