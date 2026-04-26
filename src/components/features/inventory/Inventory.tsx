import React, { useState, useEffect } from 'react';
// @ts-ignore
import { apiEndpoints } from '../../../services/apiEndpoints';
import apiService from '../../../services/apiService';
import HomeTable from '../../common/table/Table';
// @ts-ignore - Table component is in JSX
import HeaderWithSort from '../../common/table/components/TableHeaderWithSort';
import { useAuth } from '../../auth/hooks/useAuth';
import { MessageAlert } from '../../common/message/MessageAlert';
import {
  ERROR_429,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_503,
} from '../../constants/Messages';

interface FilterField {
  type: string;
  name: string;
  label: string;
  placeholder?: string;
  options?: string[];
}

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

interface Alert {
  id: number;
  message: string;
}

interface DiscountRecommendation {
  productId: number;
  productName: string;
  recommendedDiscount: string;
  reason: string;
}

interface InventoryData {
  products: Product[];
  alerts: Alert[];
  discountRecommendations: DiscountRecommendation[];
}

interface ApiProduct {
  productExternalId: string;
  productCode: string;
  name: string;
  description: string | null;
  price: number;
  created: string;
  updated: string;
  stock: number;
}

function Inventory() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockData, setLowStockData] = useState<Product[]>([]);
  const [lowStockLoading, setLowStockLoading] = useState(true);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.get(apiEndpoints.inventory, {
          headers: { Accept: 'application/json' },
        });

        const apiProducts: ApiProduct[] = response.data || [];

        const transformedData: InventoryData = {
          products: apiProducts.map((p) => ({
            id: parseInt(p.productExternalId),
            name: p.name,
            currentPrice: p.price || 0,
            suggestedPrice: p.price * 1.1,
            stock: p.stock,
            demand: p.stock < 10 ? 'Low' : p.stock < 50 ? 'Medium' : 'High',
            competitorAverage: p.price || 0,
            marketTrend:
              p.stock < 20
                ? 'Increasing'
                : p.stock > 100
                ? 'Decreasing'
                : 'Stable',
          })),
          alerts: [
            {
              id: 1,
              message: `Low stock on ${
                apiProducts.find((p) => p.stock < 10)?.name
              }: only ${apiProducts.find((p) => p.stock < 10)?.stock} left.`,
            },
          ],
          discountRecommendations: apiProducts
            .filter((p) => p.stock > 100)
            .map((p) => ({
              productId: parseInt(p.productExternalId),
              productName: p.name,
              recommendedDiscount: '10%',
              reason: 'High stock levels; consider discount to increase sales',
            })),
        };

        setError(null);
        setData(transformedData.products);

        const lowStockProducts = apiProducts.filter((p) => p.stock < 10);
        const transformedLowStockData: InventoryData = {
          products: lowStockProducts.map((p) => ({
            id: parseInt(p.productExternalId),
            name: p.name,
            currentPrice: p.price || 0,
            suggestedPrice: p.price * 1.1,
            stock: p.stock,
            demand: 'Low',
            competitorAverage: p.price || 0,
            marketTrend: 'Alert',
          })),
          alerts: [],
          discountRecommendations: [],
        };

        setLowStockData(transformedLowStockData.products);
      } catch (err: any) {
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
        setLowStockLoading(false);
      }
    };

    fetchData();
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
    {
      accessorKey: 'stock',
      header: ({ column }) => <HeaderWithSort column={column} title="Stock" />,
      cell: ({ row }) => (
        <div
          className={`text-sm font-medium ${
            row.original.stock < 10 ? 'text-red-600' : 'text-gray-600'
          }`}
        >
          {row.original.stock || '0'}
        </div>
      ),
    },
    {
      accessorKey: 'demand',
      header: ({ column }) => <HeaderWithSort column={column} title="Demand" />,
      cell: ({ row }) => {
        const demand = row.original.demand?.toUpperCase() || 'LOW';
        const colorMap: Record<string, string> = {
          HIGH: 'bg-green-100 text-green-700',
          MEDIUM: 'bg-yellow-100 text-yellow-700',
          LOW: 'bg-red-100 text-red-700',
        };
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${colorMap[demand]}`}
          >
            {demand}
          </span>
        );
      },
    },
    {
      accessorKey: 'marketTrend',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Market Trend" />
      ),
      cell: ({ row }) => {
        const trend = row.original.marketTrend?.toUpperCase() || 'STABLE';
        const colorMap: Record<string, string> = {
          INCREASING: 'text-green-600',
          DECREASING: 'text-red-600',
          STABLE: 'text-blue-600',
        };
        return (
          <div className={`text-sm font-medium ${colorMap[trend]}`}>
            {trend}
          </div>
        );
      },
    },
  ];

  const filterFields: FilterField[] = [
    {
      type: 'text',
      name: 'name',
      label: 'Product Name',
      placeholder: 'Search by product name...',
    },
    {
      type: 'select',
      name: 'demand',
      label: 'Demand',
      options: ['All', 'HIGH', 'MEDIUM', 'LOW'],
    },
    {
      type: 'select',
      name: 'marketTrend',
      label: 'Market Trend',
      options: ['All', 'INCREASING', 'STABLE', 'DECREASING'],
    },
  ];

  return (
    <>
      {error ? (
        <MessageAlert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          action={() => window.location.reload()}
          actionLabel="Try Again"
        />
      ) : (
        <div>
          <HomeTable
            title="Inventory Management"
            subtitle="Track and manage your product inventory"
            data={data}
            columns={columns}
            searchField="name"
            // @ts-ignore
            filterFields={filterFields}
            loading={loading}
            hideDefaultActions
          />
        </div>
      )}
    </>
  );
}

export default Inventory;
