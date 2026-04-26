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

export default function SalesPerformance() {
  const [SalesPerformances, setSalesPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const columns = [
    {
      accessorKey: 'store_id',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Store ID" />
      ),
      cell: ({ row }) => <div className="pl-4">{row.original.store_id}</div>,
    },
    {
      accessorKey: 'avg_transactions_per_customer',
      header: ({ column }) => (
        <HeaderWithSort
          column={column}
          title="Average Transactions per Customer"
        />
      ),
      cell: ({ row }) => (
        <div className="pl-20">
          {row.original.avg_transactions_per_customer}
        </div>
      ),
    },
    {
      accessorKey: 'total_store_sales',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Store Sales" />
      ),
      cell: ({ row }) => (
        <div className="pl-4">
          ${row.original.total_store_sales?.toFixed(2) || '0.00'}
        </div>
      ),
    },
    {
      accessorKey: 'unique_customers',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Unique Customers" />
      ),
      cell: ({ row }) => (
        <div className="pl-10">{row.original.unique_customers}</div>
      ),
    },
    {
      accessorKey: 'avg_return_likelihood',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Average Return Likelihood" />
      ),
      cell: ({ row }) => (
        <div className="pl-10">
          {(row.original.avg_return_likelihood * 100).toFixed(0)}%
        </div>
      ),
    },
    {
      accessorKey: 'underperforming',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Performance Status" />
      ),
      cell: ({ row }) => (
        <div
          className={`pl-10 font-medium ${
            row.original.underperforming ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {row.original.underperforming ? 'Underperforming' : 'Healthy'}
        </div>
      ),
    },
  ];
  const filterFields = [
    {
      type: 'text',
      name: 'store_id',
      label: 'Store ID',
    },
    {
      type: 'select',
      name: 'underperforming',
      label: 'Performance Status',
      options: [
        { value: 'false', label: 'Healthy' },
        { value: 'true', label: 'Underperforming' },
      ],
    },
  ];

  const fetchSalesPerformanceReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get(apiEndpoints.salesPerformance);
      let data = response?.data;
      if (!data) {
        setError('Unable to retrieve anomaly report data. Please try again.');
        setSalesPerformances([]);
      } else if (!Array.isArray(data)) {
        setError('Invalid data format received from server.');
        setSalesPerformances([]);
        console.error('Invalid data format:', data);
      } else {
        setError(null);
        setSalesPerformances(data);
      }
    } catch (err) {
      console.error('Error fetching Segmentation Report:', err);
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
      setSalesPerformances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesPerformanceReport();
  }, []);

  const handleRetry = () => {
    fetchSalesPerformanceReport();
  };

  return (
    <div>
      <ExportReports
        endpoint={apiEndpoints.salesPerformance}
        data={SalesPerformances}
        reportType="Store Performance"
        headers={columns.map((col) => col.accessorKey)}
        loading={loading}
        setLoading={setLoading}
        setError={setError}
      />
      <HomeTable
        title="Store Performance"
        data={SalesPerformances}
        columns={columns}
        filterFields={filterFields}
        searchField="store_id"
        loading={loading}
        error={error} // Pass error to HomeTable to handle display
        onRetry={handleRetry}
        noDataMessage={
          SalesPerformances.length === 0 && !loading && !error
            ? NO_RECORD_FOUND
            : error
        }
      />
    </div>
  );
}
