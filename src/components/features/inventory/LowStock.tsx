import React, { useState, useEffect } from 'react';
// @ts-ignore
import { apiEndpoints } from '../../../services/apiEndpoints';
import apiService from '../../../services/apiService';
import HomeTable from '../../common/table/Table';
// @ts-ignore - Table component is in JSX
import HeaderWithSort from '../../common/table/components/TableHeaderWithSort';
import { MessageAlert } from '../../common/message/MessageAlert';
import {
  ERROR_429,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_503,
} from '../../constants/Messages';

interface Product {
  id: number;
  name: string;
  currentPrice: number;
  suggestedPrice: number;
  stock: number;
  demand: string;
  competitorAverage: number;
  marketTrend: string;
}

interface InventoryData {
  products: Product[];
}

function LowStock() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLowStockData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get(apiEndpoints.lowStock, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response?.data) {
        // Treat as empty data, not error
        setData([]);
        setError(null);
        return;
      }

      // Handle different response structures
      let productsData = [];

      // If response is an array directly
      if (Array.isArray(response.data)) {
        productsData = response.data;
      }
      // If response has content array (paginated)
      else if (response.data.content && Array.isArray(response.data.content)) {
        productsData = response.data.content;
      }
      // If response has products array
      else if (
        response.data.products &&
        Array.isArray(response.data.products)
      ) {
        productsData = response.data.products;
      }
      // If response is empty object or null
      else if (!response.data || Object.keys(response.data).length === 0) {
        productsData = [];
      } else {
        // Fallback - try to extract array from response
        productsData = Object.values(response.data).flat();
      }

      // Transform low stock data
      const transformedProducts = productsData.map((p: any) => ({
        id: parseInt(p.productExternalId || p.id || Math.random()),
        name: p.name || p.productName || 'Unknown Product',
        currentPrice: parseFloat(p.price) || 0,
        suggestedPrice: (parseFloat(p.price) || 0) * 1.1,
        stock: parseInt(p.stock) || parseInt(p.quantity) || 0,
        demand: 'Low',
        competitorAverage: parseFloat(p.price) || 0,
        marketTrend: 'Alert',
      }));

      // Set data (empty or with records)
      setData(transformedProducts);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching low stock data:', err);
      setData([]); // Always set empty data on error

      // Handle different error scenarios
      if (err.response?.status === 404) {
        // 404 - treat as no records found, not a show-stopping error
        setData([]);
        setError(null); // Don't show error banner for 404
      } else if (!err.response) {
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
            // For other 4xx/5xx errors, show specific message if available
            if (err.response.data?.message) {
              setError(err.response.data.message);
            } else {
              setError(
                `Error ${err.response.status}: ${
                  err.response.statusText || 'Unknown error'
                }`
              );
            }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStockData();
  }, []);

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
      accessorKey: 'currentPrice',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Current Price" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          ${row.original.currentPrice?.toFixed(2) || '0.00'}
        </div>
      ),
    },
    {
      accessorKey: 'stock',
      header: ({ column }) => <HeaderWithSort column={column} title="Stock" />,
      cell: ({ row }) => (
        <div className="text-sm font-medium text-red-600">
          {row.original.stock || '0'}
        </div>
      ),
    },
    {
      accessorKey: 'suggestedPrice',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Suggested Price" />
      ),
      cell: ({ row }) => (
        <div className="text-sm font-semibold text-green-600">
          ${row.original.suggestedPrice?.toFixed(2) || '0.00'}
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
      options: ['All', 'Critical', 'Low'],
    },
  ];

  // UPDATED: Handle retry function
  const handleRetry = () => {
    fetchLowStockData();
  };

  // UPDATED: Simplified render logic
  return (
    <>
      {/* Show error message only for real errors (not 404 or empty data) */}
      {error && error !== 'No records found' ? (
        <MessageAlert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          action={() => {
            setError(null);
            fetchLowStockData();
          }}
          actionLabel="Try Again"
        />
      ) : (
        // Always show the table structure
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow">
            <HomeTable
              title="Low Stock Alert"
              subtitle="Products requiring immediate attention"
              data={data}
              columns={columns}
              searchField="name"
              filterFields={filterFields}
              loading={loading}
              noDataMessage={
                data.length === 0 && !loading ? 'No records found' : undefined
              }
              hideDefaultActions
            />
          </div>
        </div>
      )}
    </>
  );
}

export default LowStock;
