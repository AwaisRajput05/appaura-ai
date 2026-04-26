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

export default function DemoGraphicReport() {
  const [DemographicReport, setDemographicReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const columns = [
    {
      accessorKey: 'customer_id',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Customer ID" />
      ),
    },
    {
      accessorKey: 'customer_name',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Customer Name" />
      ),
      cell: ({ row }) => row.original.customer_name || 'No Name',
    },
    {
      accessorKey: 'gender',
      header: ({ column }) => <HeaderWithSort column={column} title="Gender" />,
      cell: ({ row }) => row.original.gender?.trim() || 'Not specified',
    },
    {
      accessorKey: 'nationality',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Nationality" />
      ),
      cell: ({ row }) => row.original.nationality?.trim() || 'Not specified',
    },
    {
      accessorKey: 'total_spending',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Spending" />
      ),
    },
    {
      accessorKey: 'total_discount',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Discount" />
      ),
    },
    {
      accessorKey: 'amount_paid',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Amount Paid" />
      ),
    },
    {
      accessorKey: 'total_transactions',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Transactions" />
      ),
    },
    {
      accessorKey: 'avg_spend_per_transaction',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Avg Spend/Transaction" />
      ),
    },
    {
      accessorKey: 'likely_to_transact',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Likely to Transact Again" />
      ),
    },
    {
      accessorKey: 'transaction_probability',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Transaction Probability" />
      ),
      cell: ({ row }) =>
        `${(row.original.transaction_probability * 100).toFixed(2)}%`,
    },
    {
      accessorKey: 'prediction_timestamp',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Prediction Time" />
      ),
      cell: ({ row }) => row.original.prediction_timestamp?.split('T')[0],
    },
  ];

  const filterFields = [
    { type: 'text', name: 'Customer ID', label: 'Customer ID' },
    { type: 'text', name: 'Customer Name', label: 'Customer Name' },
  ];

  const fetchDemographicReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get(apiEndpoints.demographicReport);
      let data = response?.data || [];
      setDemographicReport(data);
      console.log(data);
    } catch (err) {
      console.error('Error fetching Demographic Report:', err);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemographicReport();
  }, []);

  const handleRetry = () => {
    fetchDemographicReport();
  };

  return (
    <div className="flex flex-col">
      <ExportReports
        endpoint={apiEndpoints.demographicReport}
        data={DemographicReport}
        reportType="Demographic Report"
        headers={columns.map((col) => col.accessorKey)}
        loading={loading}
        setLoading={setLoading}
        setError={setError}
      />
      <HomeTable
        title="Demographic Report"
        data={DemographicReport}
        columns={columns}
        filterFields={filterFields}
        searchField="Customer ID"
        loading={loading}
        error={error} // Pass error to HomeTable to handle display
        onRetry={handleRetry}
        noDataMessage={
          DemographicReport.length === 0 && !loading && !error
            ? NO_RECORD_FOUND
            : error
        }
      />{' '}
      <div className="flex pl-6">
        <h4 className="text-red-600 font-bold">NOTE:</h4>
      </div>
      <div className="pl-20 space-y-1">
        {[
          { code: 'TS', text: 'Total Spending' },
          { code: 'TDS', text: 'Total Discount Received' },
          { code: 'AP', text: 'Amount Paid ' },
          { code: 'TT', text: 'Total Transactions' },
          { code: 'ASPT', text: 'Average Spend Per Transaction' },
          { code: 'LTA', text: 'Likely to Transact Again' },
          { code: 'LP', text: 'Transaction Probability' },
        ].map((item) => (
          <div key={item.code} className="flex">
            <span className="inline-block w-12 ">{item.code}:</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
