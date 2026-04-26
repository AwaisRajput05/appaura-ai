// Updated LoyaltyPredictions.jsx (CLV report)
// Added profile prop and usage (e.g., in API call or conditional logic). Here, assuming we append profile to API query for demonstration.

import React, { useState, useEffect } from 'react';
import apiService from '../../../../services/apiService';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import { apiEndpoints } from '../../../../services/apiEndpoints';
import {
  formatDateTime,
  formatDecimal,
} from '../FraudDetectReoprtComponents/formatDate';
import { useAuth } from '../../../auth/hooks/useAuth';
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

const columns = [
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <HeaderWithSort column={column} title="Customer ID" />
    ),
    cell: ({ row }) => row.original.id || 'N/A',
  },
  {
    accessorKey: 'customer_name', // Changed from "name" to "customer_name"
    header: ({ column }) => <HeaderWithSort column={column} title="Name" />,
    cell: ({ row }) => {
      const name = row.original.customer_name; // Changed from row.original.name
      return name && name !== '0' ? name : 'No Name';
    },
  },
  {
    accessorKey: 'total_spend',
    header: ({ column }) => (
      <HeaderWithSort column={column} title="Total Spend" />
    ),
    cell: ({ row }) => formatDecimal(row.original.total_spend),
  },
  {
    accessorKey: 'actual_clv',
    header: ({ column }) => (
      <HeaderWithSort column={column} title="Actual CLV" />
    ),
    cell: ({ row }) => formatDecimal(row.original.actual_clv),
  },
  {
    accessorKey: 'predicted_clv',
    header: ({ column }) => (
      <HeaderWithSort column={column} title="Predicted CLV" />
    ),
    cell: ({ row }) => formatDecimal(row.original.predicted_clv),
  },
  {
    accessorKey: 'clv_difference',
    header: ({ column }) => (
      <HeaderWithSort column={column} title="CLV Difference" />
    ),
    cell: ({ row }) => formatDecimal(row.original.clv_difference),
  },
  {
    accessorKey: 'clv_ratio',
    header: ({ column }) => (
      <HeaderWithSort column={column} title="CLV Ratio" />
    ),
    cell: ({ row }) => formatDecimal(row.original.clv_ratio),
  },
  {
    accessorKey: 'recency',
    header: ({ column }) => <HeaderWithSort column={column} title="Recency" />,
    cell: ({ row }) => row.original.recency ?? 'N/A',
  },
  {
    accessorKey: 'total_transactions',
    header: ({ column }) => <HeaderWithSort column={column} title="TT" />,
    cell: ({ row }) => {
      const totalTransactions = row.original.total_transactions;
      return totalTransactions != null ? totalTransactions : 'N/A';
    },
  },
  {
    accessorKey: 'avg_trx_value',
    header: ({ column }) => <HeaderWithSort column={column} title="AVT" />,
    cell: ({ row }) => formatDecimal(row.original.avg_trx_value),
  },
  {
    accessorKey: 'purchase_frequency',
    header: ({ column }) => <HeaderWithSort column={column} title="PF" />,
    cell: ({ row }) => {
      const purchaseFreq = row.original.purchase_frequency;
      return purchaseFreq != null ? formatDecimal(purchaseFreq) : 'N/A';
    },
  },
  {
    accessorKey: 'customer_tenure',
    header: ({ column }) => <HeaderWithSort column={column} title="CT" />,
    cell: ({ row }) => row.original.customer_tenure ?? 'N/A',
  },
  {
    accessorKey: 'clv_segment',
    header: ({ column }) => (
      <HeaderWithSort column={column} title="CLV Segment" />
    ),
    cell: ({ row }) => row.original.clv_segment || 'N/A',
  },
  {
    accessorKey: 'next_prediction_date',
    header: ({ column }) => (
      <HeaderWithSort column={column} title="Next Prediction Date" />
    ),
    cell: ({ row }) => formatDateTime(row.original.next_prediction_date),
  },
];

const filterFields = [
  { type: 'text', name: 'id', label: 'Customer ID' },
  { type: 'text', name: 'customer_name', label: 'Name' }, // Changed from "name" to "customer_name"
  {
    type: 'select',
    name: 'clv_segment',
    label: 'CLV Segment',
    options: ['All', 'High Value', 'Medium Value', 'Low Value'],
  },
];

export default function LoyaltyPredictions({ profile }) {
  // Added profile prop
  const { user } = useAuth();
  const [clvData, setClvData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch loyalty predictions data
  const fetchLoyaltyPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data from API with vendorId and profile (appended as query param for example)
      const response = await apiService.get(
        `${apiEndpoints.loyaltyPredicitions}?profile=${profile}`
      );

      // Handle the nested data structure
      const customers = response.data || [];
      console.log('Loyalty Predictions Response:', customers); // Debug log

      if (!response.data) {
        setError('Unable to retrieve segmentation data. Please try again.');
        setClvData([]);
      } else if (!Array.isArray(response.data)) {
        setError('Invalid data format received from server.');
        setClvData([]);
        console.error('Invalid data format:', response.data);
      } else {
        // If data is an array (even if empty), just set it without error
        setError(null);
        setClvData(response.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching loyalty predictions:', err);
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
                'An unknown error occurred while loading vendor data.'
            );
        }
      }
      setLoading(false);
      setClvData([]);
    }
  };

  // Fetch data when component mounts or vendorId/profile changes
  useEffect(() => {
    fetchLoyaltyPredictions();
  }, [user?.userId, profile]); // Added profile dependency

  // Handle retry on error
  const handleRetry = () => {
    fetchLoyaltyPredictions();
  };

  return (
    <div className="flex flex-col">
      <ExportReports
        endpoint={apiEndpoints.loyaltyPredicitions}
        data={clvData}
        reportType="Customer Lifetime Value Report"
        headers={columns.map((col) => col.accessorKey)}
        loading={loading}
        setLoading={setLoading}
        setError={setError}
      />
      <HomeTable
        title="Customer Lifetime Value Report"
        data={clvData}
        columns={columns}
        filterFields={filterFields}
        searchField="customer_name" // Changed from "customerid" to "customer_name"
        loading={loading}
        error={error} // Pass error to HomeTable to handle display
        onRetry={handleRetry}
        noDataMessage={
          clvData.length === 0 && !loading && !error ? NO_RECORD_FOUND : error
        }
      />

      <div className="flex pl-6">
        <h4 className="text-red-600 font-bold">NOTE:</h4>
      </div>

      <div className="pl-20 space-y-1">
        {[
          { code: 'TT', text: 'Total Transactions' },
          { code: 'AVT', text: 'Avg Transaction Value' },
          { code: 'PF', text: 'Purchase Frequency' },
          { code: 'CT', text: 'Customer Tenure' },
        ].map((item) => (
          <div key={item.code} className="flex">
            <span className="inline-block w-10">{item.code}:</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
