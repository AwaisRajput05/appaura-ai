import {
  ERROR_429,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_503,
} from '../../constants/Messages';
import React, { useState, useEffect } from 'react';
// @ts-ignore
import { apiEndpoints } from '../../../services/apiEndpoints';
import apiService from '../../../services/apiService';
import HomeTable from '../../common/table/Table';
import { MessageAlert } from '../../common/message/MessageAlert';
// @ts-ignore - Table component is in JSX
import HeaderWithSort from '../../common/table/components/TableHeaderWithSort';

interface Product {
  productId: string;
  name: string;
  totalSold: number;
  stock: number;
  totalSales: number;
}

export default function TopSelling() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopSellingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get(apiEndpoints.topSelling, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response?.data) {
        throw new Error('No data received from server');
      }

      setData(response.data);
    } catch (err: any) {
      console.error('Error fetching top selling data:', err);
      setData([]);

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
    fetchTopSellingData();
  }, []);

  const handleRetry = () => {
    fetchTopSellingData();
  };

  const columns = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Product Name" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'totalSold',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Units Sold" />
      ),
      cell: ({ row }) => (
        <div className="text-sm font-semibold text-blue-600">
          {row.original.totalSold.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'stock',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Current Stock" />
      ),
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-600">
          {row.original.stock.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'totalSales',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Revenue" />
      ),
      cell: ({ row }) => (
        <div className="text-sm font-semibold text-green-600">
          $
          {row.original.totalSales.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      ),
    },
  ];

  const filterFields = [
    {
      type: 'text',
      name: 'name',
      label: 'Product Name',
      placeholder: 'Search by product name...',
    },
    {
      type: 'select',
      name: 'totalSold',
      label: 'Sales Volume',
      options: ['All', 'High', 'Medium', 'Low'],
    },
  ];

  return (
    <>
      {error ? (
        <MessageAlert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          action={() => {
            setError(null);
            setData([]);
            fetchTopSellingData();
          }}
          actionLabel="Try Again"
        />
      ) : (
        <div className="">
          <HomeTable
            title="Top Selling Products"
            subtitle="Products with the highest sales volume and revenue"
            data={data}
            columns={columns}
            searchField="name"
            // @ts-ignore - Using JSX component in TSX
            filterFields={filterFields}
            loading={loading}
            hideDefaultActions
          />
        </div>
      )}
    </>
  );
}
