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

export default function ChurnReport() {
  const [churnReport, setChurnReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const columns = [
    {
      accessorKey: 'customer_id',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Customer ID" />
      ),
      cell: ({ row }) => (
        <div className="pl-4">{row.original.customer_id || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'customer_name',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Customer Name" />
      ),
      cell: ({ row }) => (
        <div className="pl-4">
          {row.original.customer_name && row.original.customer_name !== 'NULL'
            ? row.original.customer_name
            : 'No Name'}
        </div>
      ),
    },
    {
      accessorKey: 'likelihood_of_leaving',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Likelihood of Leaving" />
      ),
      cell: ({ row }) => (
        <div className="pl-4">
          {row.original.likelihood_of_leaving || '0.0'}%
        </div>
      ),
    },
    {
      accessorKey: 'days_since_last_purchase',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Days Since Last Purchase" />
      ),
      cell: ({ row }) => (
        <div className="pl-4">
          {row.original.days_since_last_purchase || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'total_purchases',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Purchases" />
      ),
      cell: ({ row }) => (
        <div className="pl-4">{row.original.total_purchases || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'total_spent',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Spent" />
      ),
      cell: ({ row }) => (
        <div className="pl-4">${row.original.total_spent || '0.00'}</div>
      ),
    },
    {
      accessorKey: 'risk_status',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Risk Status" />
      ),
      cell: ({ row }) => (
        <div
          className={`pl-4 font-medium ${
            row.original.high_risk ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {row.original.high_risk ? 'High Risk' : 'Low Risk'}
        </div>
      ),
    },
  ];

  const filterFields = [
    { type: 'text', name: 'customer_id', label: 'Customer ID' },
    { type: 'text', name: 'customer_name', label: 'Customer Name' },
    {
      type: 'select',
      name: 'high_risk',
      label: 'Risk Level',
      options: [
        { value: 'true', label: 'High Risk' },
        { value: 'false', label: 'Low Risk' },
      ],
    },
  ];

  const fetchChurnReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get(apiEndpoints.churnReport, {
        timeout: 20000,
      });
      let data = response?.data || [];

      console.log('Churn Report Response:', data); // Debug log to inspect data

      if (!data) {
        setError('Unable to retrieve churn report data. Please try again.');
        setChurnReport([]);
      } else if (!Array.isArray(data)) {
        setError('Invalid data format received from server.');
        setChurnReport([]);
        console.error('Invalid data format:', data);
      } else {
        // Parse and derive fields
        const parsedData = data.map((item) => ({
          ...item,
          likelihood_of_leaving: parseFloat(item.likelihood_of_leaving) || 0,
          days_since_last_purchase: parseInt(
            item.days_since_last_purchase?.replace(' days', '') || '0',
            10
          ),
          total_purchases: parseInt(item.total_purchases, 10) || 0,
          total_spent: parseFloat(item.total_spent) || 0,
          high_risk: item.description?.startsWith('High risk') || false,
        }));
        setError(null);
        setChurnReport(parsedData);
      }
    } catch (err) {
      console.error('Error fetching Churn Report:', err);
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
      setChurnReport([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChurnReport();
  }, []);

  const handleRetry = () => {
    fetchChurnReport();
  };

  return (
    <div>
      <ExportReports
        endpoint={apiEndpoints.churnReport}
        data={churnReport}
        reportType="Churn Report"
        headers={columns.map((col) => col.accessorKey)}
        loading={loading}
        setLoading={setLoading}
        setError={setError}
      />
      <HomeTable
        title="Churn Report"
        data={churnReport}
        columns={columns}
        filterFields={filterFields}
        searchField="customer_id"
        loading={loading}
        error={error} // Pass error to HomeTable to handle display
        onRetry={handleRetry}
        noDataMessage={
          churnReport.length === 0 && !loading && !error
            ? NO_RECORD_FOUND
            : error
        }
      />
    </div>
  );
}
