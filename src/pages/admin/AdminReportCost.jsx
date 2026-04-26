import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import HomeTable from '../../components/common/table/Table';
import HeaderWithSort from '../../components/common/table/components/TableHeaderWithSort';
import { getToken } from '../../services/tokenUtils';
import apiService from '../../services/apiService';
import { MessageAlert } from '../../components/common/message/MessageAlert';
import {
  ERROR_429,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_503,
} from '../../components/constants/Messages';
import { apiEndpoints } from '../../services/apiEndpoints';

export default function AdminReportCost() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState([]);
  const [detailsData, setDetailsData] = useState([]);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Reset to summary view when navigating to this route
  useEffect(() => {
    setShowDetails(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchReportCostData = async () => {
      try {
        setLoading(true);
        const token = getToken();
        console.log('Token:', token); // Debug token

        if (!token) {
          setError('No authentication token available. Please log in.');
          setLoading(false);
          return;
        }

        // Use centralized endpoint from apiEndpoints (assuming admin-level data, no vendorId for now)
        const endpoint = apiEndpoints.adminApiUsageData; // Adjust if vendorId is needed
        console.log('Requesting URL:', endpoint); // Debug URL

        const response = await apiService.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        console.log('Full API Response:', response); // Debug: Log entire response
        console.log('Response Data:', response.data); // Debug: Log data object

        // Handle the response data (adjusted to match the actual structure)
        const data = response.data;
        console.log('Full data object:', data); // Debug full data
        if (data && typeof data === 'object') {
          const summaryApiArray = data.summary || [];
          console.log('Summary API Array:', summaryApiArray); // Debug summary array
          const summaryItem =
            Array.isArray(summaryApiArray) && summaryApiArray.length > 0
              ? summaryApiArray[0]
              : {};
          console.log('Summary Item Object:', summaryItem); // Debug summary item object
          console.log('Summary keys:', Object.keys(summaryItem)); // Debug keys in summary item
          const summary = {
            numberOfRequests: summaryItem['number_of_requests'] || 0,
            lastServiceName: summaryItem['last_service'] || '',
            lastServiceTime: summaryItem['last_service_timestamp'] || '',
            totalCost: summaryItem['cumulative_cost'] || 0,
          };
          console.log('Mapped Summary:', summary); // Debug mapped summary
          const detailsApi = data.details || [];
          console.log('Details API Array:', detailsApi); // Debug details array
          const mappedDetails = detailsApi.map((detail) => ({
            serviceName: detail.service || detail.id || '',
            serviceCost: detail.request_cost || detail.total_cost || 0,
            numberOfUsage: detail.request_count || 1, // Default to 1 if no count
            lastUsedTime: detail.timestamp || detail.created_at || '',
          }));
          console.log('Mapped Details:', mappedDetails); // Debug mapped details
          setSummaryData([summary]);
          setDetailsData(mappedDetails);
          setError(null);
        } else {
          setError('Invalid data format received from server');
          setSummaryData([]);
          setDetailsData([]);
        }
      } catch (err) {
        console.error('Error fetching admin report cost data:', err);
        if (!err.response) {
          setError(
            'Unable to connect to the server. Please check your internet connection or try again later.'
          );
        } else if (err.response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response.data?.message) {
          setError(err.response.data.message);
        } else {
          switch (err.response.status) {
            case 429:
              setError(ERROR_429);
              break;
            case 503:
              setError(ERROR_503);
              break;
            case 403:
              setError(ERROR_403);
              break;
            case 500:
              setError(ERROR_500);
              break;
            default:
              setError(
                `An unknown error occurred (Status: ${err.response.status}). Please try again later.`
              );
          }
        }
        setSummaryData([]);
        setDetailsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReportCostData();
  }, []);

  // Fallback data if API fails (adjusted for admin based on Postman)
  const fallbackSummaryData = [
    {
      // numberOfRequests: 49,
      // lastServiceName: "price_recommendation_ml",
      // lastServiceTime: "2025-09-16T07:06:36.265074",
      // totalCost: 1.14,
    },
  ];
  const fallbackDetailsData = [
    {
      // serviceName: "687c0b9581fa91386c",  // Using 'id' as fallback for serviceName
      // serviceCost: 0.9,  // From 'request_cost'
      // numberOfUsage: 1,  // Assuming 1 since no 'request_count' in Postman
      // lastUsedTime: "2025-09-15T13:00:00.000000"  // From 'timestamp'
    },
  ];

  // Summary Table Columns
  const summaryColumns = [
    {
      accessorKey: 'numberOfRequests',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Number Of Requests" />
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'lastServiceName',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Last Service Name" />
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'lastServiceTime',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Last Service Time" />
      ),
      cell: (info) => {
        const dateValue = info.getValue();
        if (!dateValue) return 'Invalid Date';
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
      },
    },
    {
      accessorKey: 'totalCost',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Cost" />
      ),
      cell: (info) => {
        const costValue = parseFloat(info.getValue()) || 0;
        return `$${costValue.toFixed(6)}`;
      },
    },
    {
      accessorKey: 'detailsReport',
      header: 'Details Report',
      cell: () => (
        <button
          onClick={() => setShowDetails(true)}
          className="text-blue-600 hover:underline"
        >
          view
        </button>
      ),
    },
  ];

  // Details Table Columns
  const detailsColumns = [
    {
      accessorKey: 'serviceName',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Service Name" />
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'serviceCost',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Service Cost" />
      ),
      cell: (info) => {
        const costValue = parseFloat(info.getValue()) || 0;
        return `$${costValue.toFixed(6)}`;
      },
    },
    {
      accessorKey: 'numberOfUsage',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Number Of Usage" />
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'lastUsedTime',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Last Used Time" />
      ),
      cell: (info) => {
        const dateValue = info.getValue();
        if (!dateValue) return 'Invalid Date';
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
      },
    },
  ];

  const dataToUseSummary =
    summaryData.length > 0 ? summaryData : fallbackSummaryData;
  const dataToUseDetails =
    detailsData.length > 0 ? detailsData : fallbackDetailsData;
  const filterFields = [
    { type: 'text', name: 'numberOfRequests', label: 'Number Of Requests' },
    { type: 'text', name: 'name', label: 'Last Service Name' },
  ];
  const Fields = [
    { type: 'text', name: 'service', label: 'Service Name' },
    { type: 'text', name: 'name', label: 'Last Service Name' },
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
            setSummaryData([]);
            setDetailsData([]);
          }}
          actionLabel="Try Again"
        />
      ) : showDetails ? (
        <HomeTable
          title="Report Cost Details"
          data={dataToUseDetails}
          columns={detailsColumns}
          searchField="serviceName"
          filterFields={Fields}
          loading={loading}
        />
      ) : (
        <HomeTable
          title="Report Cost Summary"
          data={dataToUseSummary}
          columns={summaryColumns}
          searchField="lastServiceName"
          filterFields={filterFields}
          loading={loading}
        />
      )}
    </>
  );
}
