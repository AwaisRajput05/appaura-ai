import React, { useState, useEffect } from 'react';
// @ts-ignore
import { apiEndpoints } from '../../../services/apiEndpoints';
import apiService from '../../../services/apiService';
import HomeTable from '../../common/table/Table';
import { MessageAlert } from '../../common/message/MessageAlert';
// @ts-ignore - Table component is in JSX
import HeaderWithSort from '../../common/table/components/TableHeaderWithSort';
import {
  ERROR_429,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_503,
} from '../../constants/Messages';

interface Product {
  productId: string;
  name: string;
  totalSold: number;
  stock: number;
  totalSales: number;
}

export default function BestSelling() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBestSellingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get(
        apiEndpoints.bestSellingUnderstocked,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response?.data) {
        throw new Error('No data received from server');
      }

      if (response.data.length === 0) {
        throw new Error('No best selling products available at this time');
      }

      setData(response.data);
    } catch (err: any) {
      console.error('Error fetching best selling data:', err);
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
    fetchBestSellingData();
  }, []);

  const handleRetry = () => {
    fetchBestSellingData();
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
        <div
          className={`text-sm font-medium ${
            row.original.stock < 10 ? 'text-red-600' : 'text-gray-600'
          }`}
        >
          {row.original.stock}
        </div>
      ),
    },
    {
      accessorKey: 'totalSales',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Sales" />
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
      name: 'stock',
      label: 'Stock Level',
      options: ['All', 'Critical', 'Low', 'Medium'],
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
            fetchBestSellingData();
          }}
          actionLabel="Try Again"
        />
      ) : data.length === 0 && !loading ? (
        <MessageAlert
          variant="info"
          message="No best selling products data available at this time."
          onClose={() => setError(null)}
          action={() => {
            setError(null);
            fetchBestSellingData();
          }}
          actionLabel="Refresh"
        />
      ) : (
        <div className="">
          <HomeTable
            title="Best Selling Products"
            subtitle="High-demand products with low stock levels"
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
