import React, { useEffect, useState } from 'react';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/apiEndpoints';
import ExportReports from '../../../common/reports/ExportReports';
import { formatDateTime } from '../FraudDetectReoprtComponents/formatDate';
import { MessageAlert } from '../../../common/message/MessageAlert';
import {
  ERROR_429,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_503,
  NO_RECORD_FOUND,
} from '../../../constants/Messages';

export default function TransactionTrend() {
  const [TransactionTrends, setTransactionTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const columns = [
    {
      accessorKey: 'time_of_day',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Time of Day" />
      ),
      cell: ({ row }) => (
        <div className="pl-4">{row.original.time_of_day || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'predicted_average_transactions',
      header: ({ column }) => (
        <HeaderWithSort
          column={column}
          title="Predicted Average Transactions"
        />
      ),
      cell: ({ row }) => (
        <div className="pl-4">
          {row.original.predicted_average_transactions || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'average_customers',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Average Customers" />
      ),
      cell: ({ row }) => (
        <div className="pl-10">{row.original.average_customers || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'total_cost',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Cost" />
      ),
      cell: ({ row }) => (
        <div className="pl-4">{row.original.total_cost || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'why_this_matters',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Why This Matters" />
      ),
      cell: ({ row }) => (
        <div className="pl-4">{row.original.why_this_matters || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'timestamp',
      header: ({ column }) => (
        <div className="pl-4">
          <HeaderWithSort column={column} title="Timestamp" />
        </div>
      ),
      cell: ({ row }) => formatDateTime(row.original.timestamp) || 'N/A',
    },
  ];

  const filterFields = [
    { type: 'text', name: 'time_of_day', label: 'Time of Day' },
    { type: 'text', name: 'total_cost', label: 'Total Cost' },
  ];

  const fetchTransacationTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get(apiEndpoints.transactionTrend);
      const data = response?.data;

      console.log('API Response Data:', data); // Debug log to inspect data

      if (!data || data.length === 0) {
        setError('No transaction trend data available. Please try again.');
        setTransactionTrends([]);
      } else if (!Array.isArray(data)) {
        setError('Invalid data format received from server.');
        setTransactionTrends([]);
        console.error('Invalid data format:', data);
      } else {
        setError(null);
        setTransactionTrends(data);
      }
    } catch (err) {
      console.error('Error fetching Transaction Trend Report:', err);
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
      setTransactionTrends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransacationTrends();
  }, []);

  const handleRetry = () => {
    fetchTransacationTrends();
  };

  return (
    <div>
      <ExportReports
        endpoint={apiEndpoints.transactionTrend}
        data={TransactionTrends}
        reportType="Transaction Trend"
        headers={columns.map((col) => col.accessorKey)}
        loading={loading}
        setLoading={setLoading}
        setError={setError}
      />
      <HomeTable
        title="Transaction Trend"
        data={TransactionTrends}
        columns={columns}
        filterFields={filterFields}
        searchField="time_of_day"
        loading={loading}
        error={error} // Pass error to HomeTable to handle display
        onRetry={handleRetry}
        noDataMessage={
          TransactionTrends.length === 0 && !loading && !error
            ? NO_RECORD_FOUND
            : error
        }
      />
    </div>
  );
}
