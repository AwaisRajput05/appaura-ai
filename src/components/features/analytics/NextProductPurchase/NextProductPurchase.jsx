import React, { useEffect, useState } from 'react';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
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
  NO_RECORD_FOUND,
} from '../../../constants/Messages';

export default function NextProductPurchase() {
  const [NextProductPurchases, setNextProductPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const columns = [
    {
      accessorKey: 'customer_id',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Customer ID" />
      ),
      cell: ({ row }) => <div className="pl-4">{row.original.customer_id}</div>,
    },
    {
      accessorKey: 'customer_name',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Customer Name" />
      ),
      cell: ({ row }) => {
        const name = row.original.customer_name;
        return (
          <div className="pl-4">{name && name !== '0' ? name : 'No Name'}</div>
        );
      },
    },
    {
      accessorKey: 'predicted_product',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Predicted Products" />
      ),
      cell: ({ row }) => {
        const products = row.original.predicted_product;
        if (!products || products.length === 0) {
          return (
            <span className="pl-4 text-gray-400 italic">No Prediction</span>
          );
        }
        return (
          <div className="space-y-2 p-2">
            {products.map((p, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded px-3 py-2 bg-gray-50 shadow-sm"
              >
                <div className="font-medium text-gray-900">
                  {p.product_name}
                </div>
                <div className="text-sm text-gray-600 mt-1 flex justify-between">
                  <span>ID: {p.product_id}</span>
                  <span className="font-medium">${p.price?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        );
      },
    },
  ];

  const filterFields = [
    { type: 'text', name: 'customer_id', label: 'Customer ID' },
    { type: 'text', name: 'customer_name', label: 'Customer Name' },
  ];

  const fetchNextProductPurchase = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get(
        apiEndpoints.nextProductPredictions,
        { timeout: 40000 }
      );
      const data = response?.data;

      console.log('API Response Data:', data); // Debug log

      // Extract the customers array from the nested structure
      const customersData = data[0]?.customers || [];

      if (!customersData || customersData.length === 0) {
        setError('No next product purchase data available. Please try again.');
        setNextProductPurchases([]);
      } else if (!Array.isArray(customersData)) {
        setError('Invalid data format received from server.');
        setNextProductPurchases([]);
        console.error('Invalid data format:', customersData);
      } else {
        setError(null);
        setNextProductPurchases(customersData);
      }
    } catch (err) {
      console.error('Error fetching Next Product Purchase:', err);
      if (!err.response) {
        setError(
          'Unable to connect to the server. Please check your internet connection or try again later.'
        );
      } else {
        switch (err.response.status) {
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
            setError(
              err.response.data?.message ||
                'An unknown error occurred while loading data.'
            );
        }
      }
      setNextProductPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextProductPurchase();
  }, []);

  const handleRetry = () => {
    fetchNextProductPurchase();
  };

  return (
    <div>
      <ExportReports
        endpoint={apiEndpoints.nextProductPredictions}
        data={NextProductPurchases}
        reportType="Next Product Purchase Report"
        headers={columns.map((col) => col.accessorKey)}
        loading={loading}
        setLoading={setLoading}
        setError={setError}
      />
      <HomeTable
        title="Next Product Purchase Report"
        data={NextProductPurchases}
        columns={columns}
        filterFields={filterFields}
        searchField="customer_id"
        loading={loading}
        error={error} // Pass error to HomeTable to handle display
        onRetry={handleRetry}
        noDataMessage={
          NextProductPurchases.length === 0 && !loading && !error
            ? NO_RECORD_FOUND
            : error
        }
      />
    </div>
  );
}
