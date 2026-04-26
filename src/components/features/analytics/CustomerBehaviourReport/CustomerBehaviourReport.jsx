import React, { useEffect, useState } from 'react';
import HomeTable from '../../../common/table/Table';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/apiEndpoints';
import ExportReports from '../../../common/reports/ExportReports';
import { MessageAlert } from '../../../common/message/MessageAlert';
import {
  ERROR_429,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_503,
} from '../../../constants/Messages';

export default function CustomerBehaviours() {
  const [customerBehaviour, setCustomerBehaviour] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDecimal = (val, digits = 4) =>
    Number.isFinite(val) ? val.toFixed(digits) : 'N/A';

  const columns = [
    {
      accessorKey: 'avg_sales_with_promo',
      header: 'Avg_sales_with_promo',
      cell: ({ getValue }) => formatDecimal(getValue()),
    },
    {
      accessorKey: 'avg_sales_without_promo',
      header: 'Avg_sales_without_promo',
      cell: ({ getValue }) => formatDecimal(getValue()),
    },
    {
      accessorKey: 'impact_percentage',
      header: 'Impact_percentage',
      cell: ({ getValue }) => formatDecimal(getValue()),
    },
    {
      accessorKey: 'date_range',
      header: 'Date_range',
    },
  ];

  const filterFields = [
    { type: 'text', name: 'customerId', label: 'Customer ID' },
    { type: 'text', name: 'product_name', label: 'Product Name' },
  ];

  const fetchCustomerBehaviourReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get(apiEndpoints.customerBehaviour);
      const rawData = response?.data;

      console.log('Raw API Response:', rawData); // Debug log

      if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
        setCustomerBehaviour([]);
        return;
      }

      if (!Array.isArray(rawData)) {
        console.error('Invalid data format:', rawData);
        setError('Invalid data format received from server.');
        setCustomerBehaviour([]);
        return;
      }

      // ✅ Normalize keys to match API response
      const formattedData = rawData.map((item) => ({
        ...item,
        avg_sales_with_promo: item['avg_sales_with_promo'],
        avg_sales_without_promo: item['avg_sales_without_promo'],
        impact_percentage: item['impact_percentage'],
        date_range: item['date_range'],
      }));

      setCustomerBehaviour(formattedData);
      setError(null);
      console.log('Transformed Data:', formattedData);
    } catch (err) {
      console.error('Error fetching Customer Behaviour Report:', err);
      switch (err.response?.status) {
        case 429:
          setError(ERROR_429);
          break;
        case 503:
          setError(ERROR_503);
          break;
        case 401:
          setError(ERROR_401);
          break;
        case 403:
          setError(ERROR_403);
          break;
        case 500:
          setError(ERROR_500);
          break;
        default:
          setError(err.message || 'Failed to fetch Customer Behaviour Report');
      }
      setCustomerBehaviour([]); // Clear on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerBehaviourReport();
  }, []);

  const handleRetry = () => {
    fetchCustomerBehaviourReport();
  };

  return (
    <>
      {error ? (
        <MessageAlert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          action={() => {
            setError(null);
            fetchCustomerBehaviourReport();
          }}
          actionLabel="Try Again"
        />
      ) : (
        <div className="relative">
          <ExportReports
            endpoint={apiEndpoints.customerBehaviour}
            data={customerBehaviour}
            reportType="Customer Behaviour Report"
            headers={columns.map((col) => col.header)}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
          />
          <HomeTable
            title="Customer Behaviour Report"
            data={customerBehaviour}
            columns={columns}
            filterFields={filterFields}
            searchField="customerId"
            loading={loading}
            error={error}
            onRetry={handleRetry}
          />
          {!loading && customerBehaviour.length === 0 && (
            <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-90 z-10">
              <div className="text-center p-4 bg-gray-100 rounded-lg shadow-md">
                <span className="text-gray-700 text-xl font-semibold">
                  No record found
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
