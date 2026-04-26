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

export default function GeographicReport() {
  const [GeographicReports, setGeographicReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDecimal = (val, digits = 2) =>
    Number.isFinite(val) ? val.toFixed(digits) : 'N/A';
  const columns = [
    {
      accessorKey: 'store_id',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Store ID" />
      ),
    },
    {
      accessorKey: 'total_sales',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Sales" />
      ),
      cell: ({ row }) => formatDecimal(row.original.total_sales),
    },
    {
      accessorKey: 'total_transactions',
      header: ({ column }) => (
        <HeaderWithSort
          column={column}
          title="Total Transactions"
          className="text-center"
        />
      ),
      cell: ({ row }) => (
        <span className="block pl-10">{row.original.total_transactions}</span>
      ),
    },
    {
      accessorKey: 'total_customers',
      header: ({ column }) => (
        <HeaderWithSort
          column={column}
          title="Total Customers"
          className="text-center"
        />
      ),
      cell: ({ row }) => (
        <span className="block pl-10">{row.original.total_customers}</span>
      ),
    },
    {
      accessorKey: 'avg_transaction_value',
      header: ({ column }) => (
        <HeaderWithSort
          column={column}
          title="Average Transaction Value"
          className="text-center"
        />
      ),
      cell: ({ row }) => (
        <span className="block pl-10">
          {formatDecimal(row.original.avg_transaction_value)}
        </span>
      ),
    },
    {
      accessorKey: 'total_items_sold',
      header: ({ column }) => (
        <HeaderWithSort
          column={column}
          title="Total Items Sold"
          className="text-center"
        />
      ),
      cell: ({ row }) => (
        <span className="block pl-10">{row.original.total_items_sold}</span>
      ),
    },
    {
      accessorKey: 'top_performer',
      header: ({ column }) => (
        <HeaderWithSort
          column={column}
          title="Top Performer"
          className="text-center"
        />
      ),
      cell: ({ row }) => (
        <span className="block pl-10">{row.original.top_performer}</span>
      ),
    },
    {
      accessorKey: 'future_top_probability',
      header: ({ column }) => (
        <HeaderWithSort
          column={column}
          title="Future Top Probability"
          className="text-center"
        />
      ),
      cell: ({ row }) => (
        <span className="block pl-10">
          {`${formatDecimal(row.original.future_top_probability)}%`}
        </span>
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
      type: 'text',
      name: 'top_performer',
      label: 'Top Performer',
    },
  ];

  const fetchNextGeographicReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get(apiEndpoints.geograpicSales);
      let data = response?.data;
      setGeographicReports(data);
      console.log(response);
    } catch (err) {
      console.error('Error fetching Next Product Purchase Report:', err);
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
    fetchNextGeographicReport();
  }, []);

  const handleRetry = () => {
    fetchNextGeographicReport();
  };

  return (
    <div>
      <ExportReports
        endpoint={apiEndpoints.geograpicSales}
        data={GeographicReports}
        reportType="Geographic Sales Report"
        headers={columns.map((col) => col.accessorKey)}
        loading={loading}
        setLoading={setLoading}
        setError={setError}
      />
      <HomeTable
        title="Geographic Sales Report"
        data={GeographicReports}
        columns={columns}
        filterFields={filterFields}
        searchField="store_id"
        loading={loading}
        error={error} // Pass error to HomeTable to handle display
        onRetry={handleRetry}
        noDataMessage={
          GeographicReports.length === 0 && !loading && !error
            ? NO_RECORD_FOUND
            : error
        }
      />
    </div>
  );
}
