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
} from '../../../constants/Messages';

export default function MarketBasket() {
  const [MarketBaskets, setMarketBaskets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const combinedColumns = [
    {
      accessorKey: 'productId',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Product ID" />
      ),
      cell: ({ row }) => <span>{row.original.productId || '-'}</span>,
    },
    {
      accessorKey: 'productName',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Product Name" />
      ),
      cell: ({ row }) => <span>{row.original.productName || '-'}</span>,
    },
    {
      accessorKey: 'timesBought',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Times Bought" />
      ),
      cell: ({ row }) => <span>{row.original.timesBought || '-'}</span>,
    },
    {
      accessorKey: 'lastBoughtOn',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Last Bought On" />
      ),
      cell: ({ row }) =>
        row.original.lastBoughtOn ? (
          <span>
            {new Date(row.original.lastBoughtOn).toLocaleDateString()}
          </span>
        ) : (
          '-'
        ),
    },
  ];

  const fetchMarketBasketsReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get(apiEndpoints.marketBasket);
      const data = response?.data?.[0]?.best_selling_products || [];
      if (!data || data.length === 0) {
        setError('No market basket data found');
      } else {
        setMarketBaskets(data);
      }
      // console.log("✅ Market Basket Data:", data);
    } catch (err) {
      console.error('Error fetching Market Basket Report:', err);
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
    fetchMarketBasketsReport();
  }, []);

  return (
    <>
      {error ? (
        <MessageAlert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          action={() => {
            setError(null);
            fetchMarketBasketsReport([]);
            fetchMarketBasketsReport();
          }}
          actionLabel="Try Again"
        />
      ) : (
        <div>
          <ExportReports
            endpoint={apiEndpoints.marketBasket}
            data={MarketBaskets || []}
            reportType="Market Basket Report"
            headers={combinedColumns.map((col) => col.accessorKey)}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
          />

          <HomeTable
            title="Market Basket Report"
            data={MarketBaskets || []}
            columns={combinedColumns}
            filterFields={[
              {
                type: 'text',
                name: 'productId',
                label: 'Product ID',
              },
              {
                type: 'text',
                name: 'productName',
                label: 'Product Name',
              },
            ]}
            searchField="productName"
            loading={loading}
            error={error}
            onRetry={fetchMarketBasketsReport}
          />
        </div>
      )}
    </>
  );
}
