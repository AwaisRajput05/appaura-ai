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

export default function ProductRecommendationsReport() {
  const [ProductRecommenReports, setProductRecommenReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const columns = [
    {
      accessorKey: 'customer_id',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Customer ID" />
      ),
    },
    {
      accessorKey: 'customerName',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Customer Name" />
      ),
      cell: ({ row }) => row.original.customerName || 'No Name',
    },
    {
      accessorKey: 'totalLoyaltyPointsUsed',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Loyalty Points Used" />
      ),
    },
    {
      accessorKey: 'averageOrderValue',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Average Order Value" />
      ),
    },
    {
      accessorKey: 'recommendedBeverages',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Recommended Beverages" />
      ),
      cell: ({ row }) =>
        row.original.recommendedBeverages?.length ? (
          <div className="grid grid-cols-1 gap-2">
            {row.original.recommendedBeverages.map((item, i) => (
              <div
                key={i}
                className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm font-medium text-black shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-gray-400 italic">No Recommendations</span>
        ),
    },
    {
      accessorKey: 'topSandwiches',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Top Sandwiches" />
      ),
      cell: ({ row }) =>
        row.original.topSandwiches?.length ? (
          row.original.topSandwiches.map((item, i) => (
            <div
              key={i}
              className="bg-blue-50 border my-1 border-blue-200 rounded-lg px-3 py-2 text-sm font-medium text-black shadow-sm"
            >
              {item}
            </div>
          ))
        ) : (
          <span className="text-gray-400 italic">No Sandwiches</span>
        ),
    },
    {
      accessorKey: 'topBeverages',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Top Beverages" />
      ),
      cell: ({ row }) =>
        row.original.topBeverages?.length ? (
          row.original.topBeverages.map((item, i) => (
            <div
              key={i}
              className="bg-blue-50 border my-1 border-blue-200 rounded-lg px-3 py-2 text-sm font-medium text-black shadow-sm"
            >
              {item}
            </div>
          ))
        ) : (
          <span className="text-gray-400 italic">No Beverages</span>
        ),
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
    {
      accessorKey: 'timestamp',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Timestamp" />
      ),
      cell: ({ row }) => row.original.timestamp?.split('T')[0],
    },
  ];

  const filterFields = [
    { type: 'text', name: 'customer_id', label: 'Customer ID' },
    { type: 'text', name: 'customerName', label: 'Customer Name' },
  ];

  const fetchProductRecommenReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get(
        apiEndpoints.productRecommendations
      );

      // Safely access nested data with optional chaining
      const recommendations = response.data || [];

      // Map snake_case keys from API to camelCase keys used in columns
      const mappedData = recommendations.map((item) => ({
        customer_id: item.customer_id || 'N/A',
        customerName: item.customer_name || 'No Name',
        totalLoyaltyPointsUsed: item.total_loyalty_points_used || 0,
        averageOrderValue: item.average_order_value || 0,
        recommendedBeverages: item.recommended_beverages || [],
        topSandwiches: item.top_sandwiches || [],
        topBeverages: item.top_beverages || [],
        summary: item.summary || '',
        timestamp: item.timestamp || null,
      }));

      setProductRecommenReports(mappedData);
      console.log('Processed Product Recommendations Data:', mappedData);
    } catch (err) {
      console.error('Error fetching Product Recommendations Report:', err);
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
      setProductRecommenReports([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductRecommenReports();
  }, []);

  const handleRetry = () => {
    fetchProductRecommenReports();
  };

  return (
    <div className="flex flex-col">
      <ExportReports
        endpoint={apiEndpoints.productRecommendations}
        data={ProductRecommenReports}
        reportType="Product Recommendation Report"
        headers={columns.map((col) => col.accessorKey)}
        loading={loading}
        setLoading={setLoading}
        setError={setError}
      />
      <HomeTable
        title="Product Recommendation Report"
        data={ProductRecommenReports}
        columns={columns}
        filterFields={filterFields}
        searchField="customer_id"
        loading={loading}
        error={error} // Pass error to HomeTable to handle display
        onRetry={handleRetry}
        noDataMessage={
          ProductRecommenReports.length === 0 && !loading && !error
            ? NO_RECORD_FOUND
            : error
        }
      />

      <div className="flex pl-6">
        <h4 className="text-red-600 font-bold">NOTE:</h4>
      </div>

      <div className="pl-20 space-y-1">
        {[
          { code: 'TLPU', text: 'Total Loyalty Points Used' },
          { code: 'AOV', text: 'Average Order Value (in currency)' },
        ].map((item) => (
          <div key={item.code} className="flex">
            <span className="inline-block w-12">{item.code}:</span>
            <span className="">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
