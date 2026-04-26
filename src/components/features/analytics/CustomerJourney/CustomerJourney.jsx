import React, { useEffect, useState } from 'react';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/apiEndpoints';
import { formatDecimal } from '../FraudDetectReoprtComponents/formatDate';
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

export default function CustomerJourney() {
  const [CustomersJourney, setCustomerJourney] = useState([]);
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
        <div className="pl-4">{row.original.customer_name || 'No Name'}</div>
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
        <div className="pl-4">
          {formatDecimal(row.original.total_spent) || '$0.00'}
        </div>
      ),
    },
    {
      accessorKey: 'average_days_between_purchases',
      header: ({ column }) => <HeaderWithSort column={column} title="ADBP" />,
      cell: ({ row }) => (
        <div className="pl-4">
          {row.original.average_days_between_purchases || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'last_purchase_date',
      header: ({ column }) => <HeaderWithSort column={column} title="LPD" />,
      cell: ({ row }) => (
        <div className="pl-4">
          {row.original.last_purchase_date?.split('-').reverse().join('-') ||
            'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'next_purchase_date',
      header: ({ column }) => <HeaderWithSort column={column} title="NPD" />,
      cell: ({ row }) => (
        <div className="pl-4">
          {row.original.next_purchase_date?.split('-').reverse().join('-') ||
            'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'days_until_next_purchase',
      header: ({ column }) => <HeaderWithSort column={column} title="DUNP" />,
      cell: ({ row }) => (
        <div className="pl-4">
          {row.original.days_until_next_purchase || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'favorite_store',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Favorite Store" />
      ),
      cell: ({ row }) => (
        <div className="pl-4">{row.original.favorite_store || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'purchase_history',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Purchase History" />
      ),
      cell: ({ row }) => {
        const history = row.original.purchase_history;
        if (!history || history.length === 0) {
          return <span className="text-gray-400 italic">No History</span>;
        }
        return (
          <div className="space-y-1">
            {history.map((p, idx) => (
              <div
                key={idx}
                className="border border-gray-300 rounded px-2 py-1 bg-gray-50 w-50"
              >
                <div>Product ID: {p.product_id || p.productId || 'N/A'}</div>
                <div>
                  Amount Spent:{' '}
                  {formatDecimal(p.amount_spent || p.amountSpent) || '$0.00'}
                </div>
                <div>
                  Purchase Hour: {p.purchase_hour || p.purchaseHour || 'N/A'}
                </div>
                <div>
                  Purchase Date:{' '}
                  {(p.purchase_date || p.purchaseDate)
                    ?.split('-')
                    .reverse()
                    .join('-') || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'summary',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Summary" />
      ),
      cell: ({ row }) => {
        const summary = row.original.summary || '';
        const truncated =
          summary.length > 40 ? summary.slice(0, 40) + '...' : summary;
        return (
          <div
            title={summary}
            className="whitespace-nowrap overflow-hidden break-words cursor-pointer"
          >
            {truncated}
          </div>
        );
      },
    },
  ];

  const filterFields = [
    { type: 'text', name: 'customer_id', label: 'Customer ID' },
    { type: 'text', name: 'customer_name', label: 'Customer Name' },
  ];

  const fetchCustomerJourneyReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get(apiEndpoints.customerJourney, {
        timeout: 30000,
      });
      const data = response?.data;

      console.log('Full API Response:', response);
      console.log('API Response Data:', data);

      let predictions = null;
      if (Array.isArray(data)) {
        if (data.length > 0) {
          if (Array.isArray(data[0].predictions)) {
            predictions = data[0].predictions;
          } else if (Array.isArray(data[0].prediction)) {
            predictions = data[0].prediction;
          }
        }
      } else if (data && data.predictions && Array.isArray(data.predictions)) {
        predictions = data.predictions;
      } else if (data && data.prediction && Array.isArray(data.prediction)) {
        predictions = data.prediction;
      } else if (Array.isArray(data)) {
        predictions = data;
      }

      console.log('Extracted predictions:', predictions);

      let customersData = [];
      if (predictions && Array.isArray(predictions)) {
        customersData = predictions.map((item) => ({
          customer_id: item.customer_id || item.customerId || 'N/A',
          customer_name: item.customer_name || item.customerName || 'No Name',
          total_purchases: item.total_purchases || item.totalPurchases || 'N/A',
          total_spent: item.total_spent || item.totalSpent || 0,
          average_days_between_purchases:
            item.average_days_between_purchases ||
            item.averageDaysBetweenPurchases ||
            'N/A',
          last_purchase_date:
            item.last_purchase_date || item.lastPurchaseDate || null,
          next_purchase_date:
            item.next_purchase_date || item.nextPurchaseDate || null,
          days_until_next_purchase:
            item.days_until_next_purchase ||
            item.daysUntilNextPurchase ||
            'N/A',
          favorite_store: item.favorite_store || item.favoriteStore || 'N/A',
          purchase_history: item.purchase_history || item.purchaseHistory || [],
          summary: item.summary || '',
        }));
      }

      console.log('Processed Customers Data:', customersData);

      if (customersData.length === 0) {
        setError('No customer journey data available. Please try again.');
        setCustomerJourney([]);
      } else if (!Array.isArray(customersData)) {
        setError('Invalid data format received from server.');
        setCustomerJourney([]);
        console.error('Invalid data format:', customersData);
      } else {
        setError(null);
        setCustomerJourney(customersData);
      }
    } catch (err) {
      console.error('Error fetching Customer Journey Report:', err);
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
      setCustomerJourney([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerJourneyReport();
  }, []);

  const handleRetry = () => {
    fetchCustomerJourneyReport();
  };

  return (
    <div className="flex flex-col">
      <ExportReports
        endpoint={apiEndpoints.customerJourney}
        data={CustomersJourney}
        reportType="Customer Journey Report"
        headers={columns.map((col) => col.accessorKey)}
        loading={loading}
        setLoading={setLoading}
        setError={setError}
      />
      <HomeTable
        title="Customer Journey Report"
        data={CustomersJourney}
        columns={columns}
        filterFields={filterFields}
        searchField="customer_id"
        loading={loading}
        error={error} // Pass error to HomeTable to handle display
        onRetry={handleRetry}
        noDataMessage={
          CustomersJourney.length === 0 && !loading && !error
            ? NO_RECORD_FOUND
            : error
        }
      />
      <div className="flex flex-col">
        <div className="flex pl-6">
          <h4 className="text-red-600 font-bold">NOTE:</h4>
        </div>
        <div className="flex">
          <span className="w-20" />
          <h4>
            ADBP: <span>Average Days Between Purchases</span>
          </h4>
        </div>
        <div className="flex">
          <span className="w-20" />
          <h4>
            LPD: <span>Last Purchase Date</span>
          </h4>
        </div>
        <div className="flex">
          <span className="w-20" />
          <h4>
            NPD: <span>Next Purchase Date</span>
          </h4>
        </div>
        <div className="flex">
          <span className="w-20" />
          <h4>
            DUNP: <span>Days Until Next Purchase</span>
          </h4>
        </div>
      </div>
    </div>
  );
}
