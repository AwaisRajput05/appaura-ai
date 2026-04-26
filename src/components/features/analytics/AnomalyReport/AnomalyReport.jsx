import React, { useEffect, useState } from 'react';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/apiEndpoints';
import { formatDateTime } from './formatDate';
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

export default function AnamolyReport() {
  const [AnamolyReports, setAnamolyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const columns = [
    {
      accessorKey: 'customer_id',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Customer Id" />
      ),
      cell: ({ row }) => (
        <span className="block text-left">{row.original.customer_id}</span>
      ),
    },
    {
      accessorKey: 'customer_name',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Customer_Name" />
      ),
      cell: ({ row }) => {
        const name = row.original.customer_name;
        return (
          <span className="text-left w-full">
            {name && name !== '0' ? name : 'No Name'}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <HeaderWithSort column={column} title="Status" />,
    },
    {
      accessorKey: 'churn_risk',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Churn Risk" />
      ),
    },
    {
      accessorKey: 'total_spending',
      header: ({ column }) => <HeaderWithSort column={column} title="TS" />,
    },
    {
      accessorKey: 'transaction_frequency',
      header: ({ column }) => <HeaderWithSort column={column} title="TF" />,
    },
    {
      accessorKey: 'avg_transaction_value',
      header: ({ column }) => <HeaderWithSort column={column} title="ATV" />,
    },
    {
      accessorKey: 'anomaly_score',
      header: ({ column }) => <HeaderWithSort column={column} title="AS" />,
    },
    {
      accessorKey: 'is_anomaly',
      header: ({ column }) => <HeaderWithSort column={column} title="IA" />,
    },
    {
      accessorKey: 'timestamp',
      header: ({ column }) => (
        <div className="pl-12">
          <HeaderWithSort column={column} title="Time" />
        </div>
      ),
      cell: ({ row }) => formatDateTime(row.original.timestamp),
    },
  ];

  const filterFields = [
    { type: 'text', name: 'customer_id', label: 'Customer ID' },
    { type: 'text', name: 'customer_name', label: 'Customer Name' },
  ];

  const fetchAnomlayReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get(apiEndpoints.anomalyReport);
      let data = response?.data;

      if (!data) {
        setError('Unable to retrieve anomaly report data. Please try again.');
        setAnamolyReports([]);
      } else if (!Array.isArray(data)) {
        setError('Invalid data format received from server.');
        setAnamolyReports([]);
        console.error('Invalid data format:', data);
      } else {
        setError(null);
        setAnamolyReports(data);
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
      setAnamolyReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomlayReport();
  }, []);

  const handleRetry = () => {
    fetchAnomlayReport();
  };

  return (
    <div className="flex flex-col space-y-4">
      <ExportReports
        endpoint={apiEndpoints.anomalyReport}
        data={AnamolyReports}
        reportType="Anomaly Report"
        headers={columns.map((col) => col.accessorKey)}
        loading={loading}
        setLoading={setLoading}
        setError={setError}
      />
      <HomeTable
        title="Anomaly Report"
        data={AnamolyReports}
        columns={columns}
        filterFields={filterFields}
        searchField="customer_name"
        loading={loading}
        error={error} // Pass error to HomeTable to handle display
        onRetry={handleRetry}
        noDataMessage={
          AnamolyReports.length === 0 && !loading && !error
            ? NO_RECORD_FOUND
            : error
        }
      />
      <div className="flex pl-6">
        <h4 className="text-red-600 font-bold">NOTE:</h4>
      </div>
      <div className="pl-20 space-y-1">
        {[
          { code: 'TS', text: 'Total Spending' },
          { code: 'TF', text: 'Transaction Frequency' },
          { code: 'ATV', text: 'Average Transaction Value' },
          { code: 'AS', text: 'Anomaly Score' },
          { code: 'IA', text: 'Is Anomaly' },
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
