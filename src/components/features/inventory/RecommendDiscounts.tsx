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

interface DiscountRecommendation {
  id: number;
  name: string;
  currentPrice: number;
  suggestedDiscount: number;
  salesVelocity: string;
  potentialRevenue: number;
  reason: string;
  inventory: number;
}

export default function RecommendDiscounts() {
  const [data, setData] = useState<DiscountRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiscountData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get(apiEndpoints.recommendDiscounts, {
        headers: {
          Accept: 'application/json',
        },
      });

      // Handle response data more gracefully
      let rawData = response?.data?.data || [];
      if (!Array.isArray(rawData)) {
        rawData = []; // Force to empty array if not an array
      }

      // Map the response data to the DiscountRecommendation interface
      const transformedData = rawData.map((item) => ({
        id: parseInt(item.vendor_id) || 0,
        name: item.product_name || 'N/A',
        currentPrice: item.current_price || 0,
        suggestedDiscount: item.suggested_discount || 0,
        salesVelocity: item.sales_velocity || 'Normal',
        potentialRevenue: item.potential_revenue || 0,
        reason: item.reason || 'Based on sales analysis',
        inventory: item.current_inventory || 0,
      }));

      setData(transformedData);
      console.log('Processed Discount Recommendations Data:', transformedData);
    } catch (err: any) {
      console.error('Error fetching discount recommendations:', err);
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
                'An unknown error occurred while loading discount recommendation data.'
            );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscountData();
  }, []);

  const columns = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Product Name" />
      ),
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: 'currentPrice',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Current Price" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">${row.original.currentPrice.toFixed(2)}</div>
      ),
    },
    {
      accessorKey: 'suggestedDiscount',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Suggested Discount" />
      ),
      cell: ({ row }) => (
        <div className="text-sm font-semibold text-blue-600">
          {row.original.suggestedDiscount}%
        </div>
      ),
    },
    {
      accessorKey: 'salesVelocity',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Sales Velocity" />
      ),
      cell: ({ row }) => {
        const velocity = row.original.salesVelocity;
        const color =
          velocity === 'High'
            ? 'text-green-600'
            : velocity === 'Low'
            ? 'text-red-600'
            : 'text-yellow-600';
        return <div className={`text-sm font-medium ${color}`}>{velocity}</div>;
      },
    },
    {
      accessorKey: 'potentialRevenue',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Potential Revenue" />
      ),
      cell: ({ row }) => (
        <div className="text-sm font-medium text-green-600">
          ${row.original.potentialRevenue.toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: 'inventory',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Current Stock" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">{row.original.inventory}</div>
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
      name: 'salesVelocity',
      label: 'Sales Velocity',
      options: ['All', 'High', 'Normal', 'Low'],
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
            fetchDiscountData();
          }}
          actionLabel="Try Again"
        />
      ) : (
        <div className="">
          <div className="rounded-lg">
            <HomeTable
              title="Discount Recommendations"
              subtitle="AI-powered discount optimization suggestions"
              data={data}
              columns={columns}
              searchField="name"
              // @ts-ignore - Using JSX component in TSX
              filterFields={filterFields}
              loading={loading}
              hideDefaultActions
              noDataMessage={
                data.length === 0 && !loading ? 'No records found' : undefined
              } // New prop: Pass message only when empty and not loading
            />
          </div>
        </div>
      )}
    </>
  );
}
