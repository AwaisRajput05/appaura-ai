import React, { useState, useEffect } from 'react';
import { apiEndpoints } from '../../../services/apiEndpoints';
import apiService from '../../../services/apiService';
import HomeTable from '../../common/table/Table';
import HeaderWithSort from '../../common/table/components/TableHeaderWithSort';
import { MessageAlert } from '../../common/message/MessageAlert';
import {
  ERROR_429,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_503,
} from '../../constants/Messages';

interface PriceRecommendation {
  id: number;
  name: string;
  currentPrice: number;
  recommendedPrice: number;
  priceChange: number;
  confidenceScore: number;
  marketTrend: string;
  reason: string;
}

export default function PriceRecommendation() {
  const [data, setData] = useState<PriceRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPriceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get(apiEndpoints.priceRecommendations, {
        headers: {
          Accept: 'application/json',
        },
      });

      // Handle response data more gracefully
      let rawData = response.data || [];
      if (!Array.isArray(rawData)) {
        rawData = []; // Force to empty array if not an array
      }

      // Map the response data to the PriceRecommendation interface
      const transformedData = rawData.map((item) => ({
        id: parseInt(item.customer_id) || 0,
        name: item.customer_name || 'N/A',
        currentPrice: item.average_order_value || 0, // Assuming average_order_value could represent current price
        recommendedPrice: 0, // TODO: Replace placeholder with actual API field or calculation (e.g., item.recommended_price || calculateRecommended(item))
        priceChange: 0, // TODO: Replace placeholder (e.g., calculateChange(currentPrice, recommendedPrice))
        confidenceScore: 0, // TODO: Replace placeholder (e.g., item.confidence_score || 0)
        marketTrend: item.market_trend || 'Stable',
        reason: item.summary || 'Based on market analysis',
      }));

      setData(transformedData);
      console.log('Processed Price Recommendations Data:', transformedData);
    } catch (err: any) {
      console.error('Error fetching price recommendations:', err);
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
                'An unknown error occurred while loading price recommendation data.'
            );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceData();
  }, []);

  const columns = [
    {
      accessorKey: 'name',
      header: ({ column }) => <HeaderWithSort column={column} title="Name" />,
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
      accessorKey: 'recommendedPrice',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Recommended Price" />
      ),
      cell: ({ row }) => (
        <div className="text-sm font-semibold text-green-600">
          ${row.original.recommendedPrice.toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: 'priceChange',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Price Change" />
      ),
      cell: ({ row }) => {
        const change = row.original.priceChange;
        const color =
          change > 0
            ? 'text-green-600'
            : change < 0
            ? 'text-red-600'
            : 'text-gray-600';
        return (
          <div className={`text-sm font-medium ${color}`}>
            {change > 0 ? '+' : ''}
            {change.toFixed(2)}%
          </div>
        );
      },
    },
    {
      accessorKey: 'confidenceScore',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Confidence" />
      ),
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {row.original.confidenceScore.toFixed(1)}%
        </div>
      ),
    },
    {
      accessorKey: 'marketTrend',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Market Trend" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">{row.original.marketTrend}</div>
      ),
    },
    {
      accessorKey: 'reason',
      header: ({ column }) => <HeaderWithSort column={column} title="Reason" />,
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.original.reason}</div>
      ),
    },
  ];

  const filterFields = [
    {
      type: 'text',
      name: 'name',
      label: 'Name',
      placeholder: 'Search by name...',
    },
    {
      type: 'select',
      name: 'priceChange',
      label: 'Price Change',
      options: ['All', 'Increase', 'Decrease', 'No Change'],
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
            fetchPriceData();
          }}
          actionLabel="Try Again"
        />
      ) : (
        <div className="rounded-lg">
          <HomeTable
            title="Price Recommendations"
            subtitle="AI-powered price optimization suggestions"
            data={data}
            columns={columns}
            searchField="name"
            filterFields={filterFields}
            loading={loading}
            hideDefaultActions
            noDataMessage={
              data.length === 0 && !loading ? 'No records found' : undefined
            } // New prop: Pass message only when empty and not loading
          />
        </div>
      )}
    </>
  );
}
