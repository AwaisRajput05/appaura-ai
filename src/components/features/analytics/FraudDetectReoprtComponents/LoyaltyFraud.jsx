import React, { useState, useEffect } from 'react';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import apiService from '../../../../services/apiService';
// import { formatDecimal } from "./formatDate";

import { apiEndpoints } from '../../../../services/apiEndpoints';
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

export default function LoyaltyFraud() {
  const { user } = useAuth();
  const [LoyaltyFraudData, setLoyaltyFraudData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const columns = [
    {
      accessorKey: 'transaction_id',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Transaction ID" />
      ),
      cell: ({ row }) => row.original.transaction_id || 'N/A',
    },
    {
      accessorKey: 'customer_id',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Customer ID" />
      ),
      cell: ({ row }) => row.original.customer_id || 'N/A',
    },
    {
      accessorKey: 'customer_name',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Customer Name" />
      ),
      cell: ({ row }) => row.original.customer_name || 'No Name',
    },
    {
      accessorKey: 'product_id',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Product ID" />
      ),
      cell: ({ row }) => row.original.product_id || 'N/A',
    },
    {
      accessorKey: 'product_name',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Product Name" />
      ),
      cell: ({ row }) => row.original.product_name || 'N/A',
    },
    {
      accessorKey: 'full_price',
      header: ({ column }) => (
        <div className="pl-2">
          <HeaderWithSort column={column} title="FP" />
        </div>
      ),
      cell: ({ row }) => row.original.full_price || 'N/A',
    },
    {
      accessorKey: 'qty',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Quantity" />
      ),
      cell: ({ row }) => row.original.qty || 0,
    },
    {
      accessorKey: 'discount_detail',
      header: ({ column }) => (
        <div className="pl-4">
          <HeaderWithSort column={column} title="DD" />
        </div>
      ),
      cell: ({ row }) => row.original.discount_detail || 'N/A',
    },
    {
      accessorKey: 'line_total',
      header: ({ column }) => (
        <div className="pl-4">
          <HeaderWithSort column={column} title="LT" />
        </div>
      ),
      cell: ({ row }) => row.original.line_total || 'N/A',
    },
    {
      accessorKey: 'full_amount',
      header: ({ column }) => (
        <div className="pl-4">
          <HeaderWithSort column={column} title="FA" />
        </div>
      ),
      cell: ({ row }) => row.original.full_amount || 'N/A',
    },
    {
      accessorKey: 'discount_trx',
      header: ({ column }) => (
        <div className="pl-4">
          <HeaderWithSort column={column} title="DT" />
        </div>
      ),
      cell: ({ row }) => row.original.discount_trx || 'N/A',
    },
    {
      accessorKey: 'total',
      header: ({ column }) => <HeaderWithSort column={column} title="Total" />,
      cell: ({ row }) => row.original.total || 'N/A',
    },
    {
      accessorKey: 'store_id',
      header: ({ column }) => (
        <div className="pl-3">
          <HeaderWithSort column={column} title="SI" />
        </div>
      ),
      cell: ({ row }) => row.original.store_id || 'N/A',
    },
    {
      accessorKey: 'total_points',
      header: ({ column }) => (
        <div className="pl-3">
          <HeaderWithSort column={column} title="TP" />
        </div>
      ),
      cell: ({ row }) => row.original.total_points || 0,
    },
    {
      accessorKey: 'current_points',
      header: ({ column }) => (
        <div className="pl-4">
          <HeaderWithSort column={column} title="CP" />
        </div>
      ),
      cell: ({ row }) => row.original.current_points || 0,
    },
    {
      accessorKey: 'total_trx',
      header: ({ column }) => (
        <div className="pl-2">
          <HeaderWithSort column={column} title="TT" />
        </div>
      ),
      cell: ({ row }) => row.original.total_trx || 0,
    },
    {
      accessorKey: 'Anomaly_Cause',
      header: ({ column }) => (
        <div className="pl-8">
          <HeaderWithSort column={column} title="AC" />
        </div>
      ),
      cell: ({ row }) => row.original.Anomaly_Cause || 'N/A',
    },
    {
      accessorKey: 'Reason_Why_Anomaly',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Reason Why Anomaly" />
      ),
      cell: ({ row }) => {
        const reason = row.original.Reason_Why_Anomaly || '';
        const truncated =
          reason.length > 40 ? reason.slice(0, 40) + '...' : reason;
        return (
          <div
            title={reason}
            className="whitespace-nowrap overflow-hidden break-words cursor-pointer"
          >
            {truncated || 'N/A'}
          </div>
        );
      },
    },
  ];

  const filterFields = [
    {
      type: 'text',
      name: 'transaction_id',
      label: 'Transaction ID',
    },
    {
      type: 'text',
      name: 'customer_id',
      label: 'Customer ID',
    },
  ];

  const fetchLoyaltyFraud = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user?.userId) {
        throw new Error(
          "User ID not found. Please ensure you're properly logged in."
        );
      }

      const response = await apiService.get(apiEndpoints.loyaltyFraudReport);
      let data = response?.data;

      if (!data) {
        setError('Unable to retrieve loyalty fraud data. Please try again.');
        setLoyaltyFraudData([]);
      } else if (!Array.isArray(data)) {
        setError('Invalid data format received from server.');
        setLoyaltyFraudData([]);
      } else {
        setError(null);
        setLoyaltyFraudData(data);
      }
    } catch (err) {
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
      setLoyaltyFraudData([]);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchLoyaltyFraud();
  }, [fetchLoyaltyFraud]);

  const handleRetry = () => {
    fetchLoyaltyFraud();
  };

  return (
    <div className="flex flex-col">
      <ExportReports
        endpoint={apiEndpoints.loyaltyFraudReport}
        data={LoyaltyFraudData}
        reportType="Loyalty Fraud Report"
        headers={columns.map((col) => col.accessorKey)}
        loading={loading}
        setLoading={setLoading}
        setError={setError}
      />
      <HomeTable
        title="Loyalty Fraud Report"
        data={LoyaltyFraudData}
        columns={columns}
        filterFields={filterFields}
        searchField="customer_id"
        loading={loading}
        error={error} // Pass error to HomeTable to handle display
        onRetry={handleRetry}
        noDataMessage={
          LoyaltyFraudData.length === 0 && !loading && !error
            ? NO_RECORD_FOUND
            : error
        }
      />
      <div className="flex pl-6">
        <h4 className="text-red-600 font-bold">NOTE:</h4>
      </div>
      <div className="pl-20 space-y-1">
        {[
          { code: 'FP', text: 'Full Price' },
          { code: 'DD', text: 'Discount Detail' },
          { code: 'LT', text: 'Line Total' },
          { code: 'FA', text: 'Full Amount' },
          { code: 'DT', text: 'Discount Trx' },
          { code: 'SI', text: 'Store ID' },
          { code: 'TP', text: 'Total Points' },
          { code: 'CP', text: 'Current Points' },
          { code: 'TT', text: 'Total Trx' },
          { code: 'AC', text: 'Anomaly Cause' },
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
