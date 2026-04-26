import React, { useEffect, useState } from 'react';
import HomeTable from '../../common/table/Table';
import HeaderWithSort from '../../common/table/components/TableHeaderWithSort';
import { apiEndpoints } from '../../../services/apiEndpoints';
import { getToken } from '../../../services/tokenUtils';
import apiService from '../../../services/apiService';
import { MessageAlert } from '../../common/message/MessageAlert';
import {
  ERROR_429,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_503,
} from '../../constants/Messages';

export default function ReportCost() {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState([]);
  const [detailsData, setDetailsData] = useState([]);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchReportCostData = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const vendorId = '066e9d05-da01-4019-a877-d9663130770c'; // Extracted for clarity; consider making this dynamic if needed

        const response = await apiService.get(
          apiEndpoints.vendorApiUsageData(vendorId),
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          }
        );

        console.log('Full API Response:', response); // Debug: Log entire response
        console.log('Response Data:', response.data); // Debug: Log data object

        // Handle the response data (adjusted to match the actual structure)
        const data = response.data; // The response is directly the object
        if (data && typeof data === 'object') {
          const summaryApi = data.summary || {}; // Access 'summary' object
          const summary = {
            numberOfRequests: summaryApi.number_of_requests || 0,
            lastServiceName: summaryApi.last_service || '',
            lastServiceTime: summaryApi.last_service_timestamp || '',
            totalCost: summaryApi.cumulative_cost || 0,
          };
          const detailsApi = data.details || []; // Access 'details' array
          const mappedDetails = detailsApi.map((detail) => ({
            serviceName: detail.service || '',
            serviceCost: detail.service_cost || 0,
            numberOfUsage: detail.number_of_times_used || 0,
            lastUsedTime: detail.last_used || '',
          }));
          setSummaryData([summary]);
          setDetailsData(mappedDetails);
          setError(null);
        } else {
          setError('Invalid data format received from server');
          setSummaryData([]);
          setDetailsData([]);
        }
      } catch (err) {
        console.error('Error fetching report cost data:', err);
        if (err.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
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
                    'An unknown error occurred while loading report cost data.'
                );
            }
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

  // Fallback data if API fails
  const fallbackSummaryData = [
    {
      // numberOfRequests: 264,
      // lastServiceName: "customer_segmentation",
      // lastServiceTime: "2025-09-12T07:32:30.538042",
      // totalCost: 7.487546,
    },
  ];
  const fallbackDetailsData = [
    // { serviceName: "Anomaly Report", serviceCost: 0.730498, numberOfUsage: 9, lastUsedTime: "2025-09-12T07:20:26.847611" },
    // { serviceName: "Churn Report", serviceCost: 0.73, numberOfUsage: 11, lastUsedTime: "2025-09-12T06:05:49.802614" },
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
        const date = new Date(info.getValue());
        return date.toLocaleString();
      },
    },
    {
      accessorKey: 'totalCost',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Cost" />
      ),
      cell: (info) => `$${parseFloat(info.getValue()).toFixed(6)}`,
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
      cell: (info) => `$${parseFloat(info.getValue()).toFixed(6)}`,
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
        const date = new Date(info.getValue());
        return date.toLocaleString();
      },
    },
  ];

  const dataToUseSummary =
    summaryData.length > 0 ? summaryData : fallbackSummaryData;
  const dataToUseDetails =
    detailsData.length > 0 ? detailsData : fallbackDetailsData;

  const filterFields = [
    { type: 'text', name: 'numberOfRequests', label: 'Numer Of Requests' },
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
