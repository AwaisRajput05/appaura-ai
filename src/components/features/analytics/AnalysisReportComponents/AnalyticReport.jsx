import React, { useEffect, useState } from 'react';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import ExportReports from '../../../common/reports/ExportReports';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/apiEndpoints';
import { MessageAlert } from '../../../common/message/MessageAlert';
import {
  ERROR_429,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_503,
  NO_RECORD_FOUND,
} from '../../../constants/Messages';

export default function AnalyticReport() {
  const [analyticReport, setAnalyticReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const columns = [
    {
      accessorKey: 'id',
      header: ({ column }) => <HeaderWithSort column={column} title="ID" />,
      cell: ({ row }) => row.original.id ?? 'N/A',
    },
    {
      accessorKey: 'customer_id',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Customer ID" />
      ),
      cell: ({ row }) => row.original.customer_id ?? 'N/A',
    },
    {
      accessorKey: 'customer_name',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Customer Name" />
      ),
      cell: ({ row }) => {
        const name = row.original.customer_name;
        return name && name !== '0' && name !== 'null' ? name : 'No Name';
      },
    },
    {
      accessorKey: 'total_spending',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Spending" />
      ),
      cell: ({ row }) => row.original.total_spending ?? 'N/A',
    },
    {
      accessorKey: 'total_points_earned',
      header: ({ column }) => <HeaderWithSort column={column} title="TPE" />,
      cell: ({ row }) => row.original.total_points_earned ?? 'N/A',
    },
    {
      accessorKey: 'total_points_used',
      header: ({ column }) => <HeaderWithSort column={column} title="TPU" />,
      cell: ({ row }) => row.original.total_points_used ?? 'N/A',
    },
    {
      accessorKey: 'current_points_balance',
      header: ({ column }) => <HeaderWithSort column={column} title="CPB" />,
      cell: ({ row }) => row.original.current_points_balance ?? 'N/A',
    },
    {
      accessorKey: 'points_usage_type',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Points Usage Type" />
      ),
      cell: ({ row }) => row.original.points_usage_type ?? 'N/A',
    },
    {
      accessorKey: 'likely_to_redeem_soon',
      header: ({ column }) => <HeaderWithSort column={column} title="LRS" />,
      cell: ({ row }) => row.original.likely_to_redeem_soon ?? 'N/A',
    },
    {
      accessorKey: 'redeemer_probability',
      header: ({ column }) => <HeaderWithSort column={column} title="RP" />,
      cell: ({ row }) => row.original.redeemer_probability ?? 'N/A',
    },
    {
      accessorKey: 'vendor_id',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Vendor ID" />
      ),
      cell: ({ row }) => row.original.vendor_id ?? 'N/A',
    },
  ];

  const filterFields = [
    { type: 'text', name: 'customer_id', label: 'Customer ID' },
    { type: 'text', name: 'customer_name', label: 'Customer Name' },
    {
      type: 'select',
      name: 'points_usage_type',
      label: 'Points Usage Type',
      options: ['All', 'Redeemer', 'Non-Redeemer'],
    },
  ];

  const fetchAnalyticReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get(apiEndpoints.analyticsReport, {
        timeout: 20000,
      });
      const data = response?.data || [];
      console.log('API Response:', data); // Debug log to check keys
      setAnalyticReport(data);
    } catch (err) {
      console.error('Error fetching Analytic Report:', err);
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
      setAnalyticReport([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticReport();
  }, []);

  const handleRetry = () => {
    fetchAnalyticReport();
  };

  return (
    <div className="flex flex-col">
      <ExportReports
        data={analyticReport}
        reportType="Analysis Report"
        headers={columns.map((col) => col.accessorKey)}
        setError={setError}
      />
      <HomeTable
        title="Analysis Report"
        data={analyticReport}
        columns={columns}
        filterFields={filterFields}
        searchField="customer_id"
        loading={loading}
        error={error} // Pass error to HomeTable to handle display
        onRetry={handleRetry}
        noDataMessage={
          analyticReport.length === 0 && !loading && !error
            ? NO_RECORD_FOUND
            : error
        }
      />
      <div className="flex pl-6">
        <h4 className="text-red-600 font-bold">NOTE:</h4>
      </div>
      <div className="pl-20 space-y-1">
        {[
          { code: 'TPE', text: 'Total Points Earned' },
          { code: 'TPU', text: 'Total Points Used' },
          { code: 'CPB', text: 'Current Points Balance' },
          { code: 'LRS', text: 'Likely to Redeem Soon' },
          { code: 'RP', text: 'Redeemer Probability' },
        ].map((item) => (
          <div key={item.code} className="flex">
            <span className="inline-block w-12">{item.code}:</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
