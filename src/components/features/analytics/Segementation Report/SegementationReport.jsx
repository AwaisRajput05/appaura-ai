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

export default function SegmentationReports() {
  const [SegementationReport, setSegementationReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const columns = [
    {
      accessorKey: 'segment',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Customer Type" />
      ),
      cell: ({ row }) => {
        const segment = row.original.segment;
        return segment || 'N/A';
      },
    },
    {
      accessorKey: 'cluster',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Cluster" />
      ),
      cell: ({ row }) => row.original.cluster || 'N/A',
    },
    {
      accessorKey: 'recency',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Days Since Last Purchase" />
      ),
      cell: ({ row }) => row.original.recency || 0,
    },
    {
      accessorKey: 'frequency',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Purchase Frequency" />
      ),
      cell: ({ row }) => row.original.frequency || 0,
    },
    {
      accessorKey: 'monetary',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Spend" />
      ),
      cell: ({ row }) => `$${row.original.monetary?.toFixed(2) || '0.00'}`,
    },
    // {
    //   accessorKey: "description",
    //   header: ({ column }) => (
    //     <HeaderWithSort column={column} title="Description" />
    //   ),
    //   cell: ({ row }) => {
    //     const summary = row.original.description || "";
    //     const truncated = summary.length > 40 ? summary.slice(0, 40) + "..." : summary;

    //     return (
    //       <div
    //         title={summary}
    //         className=" whitespace-nowrap overflow-hidden break-words cursor-pointer"
    //       >
    //         {truncated}
    //       </div>
    //     );
    //   },
    // },
  ];
  const filterFields = [
    { type: 'text', name: 'segment', label: 'Customer Type' },
    { type: 'text', name: 'cluster', label: 'Cluster' },
  ];

  const fetchSegmentationReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get(apiEndpoints.segmentationReport);

      // Try accessing data directly from response
      const data = response?.data;

      if (!data) {
        setError('Unable to retrieve segmentation data. Please try again.');
        setSegementationReport([]);
      } else if (!Array.isArray(data)) {
        setError('Invalid data format received from server.');
        setSegementationReport([]);
        console.error('Invalid data format:', data);
      } else {
        // If data is an array (even if empty), just set it without error
        setError(null);
        setSegementationReport(data);
      }
    } catch (err) {
      console.error('Error fetching Segmentation Report:', err);
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
      setSegementationReport([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegmentationReport();
  }, []);

  const handleRetry = () => {
    fetchSegmentationReport();
  };

  return (
    <div>
      <ExportReports
        endpoint={apiEndpoints.segmentationReport}
        data={SegementationReport}
        reportType="Segmentation Report"
        headers={columns.map((col) => col.accessorKey)}
        loading={loading}
        setLoading={setLoading}
        setError={setError}
      />
      <HomeTable
        title="Segmentation Report"
        data={SegementationReport}
        columns={columns}
        filterFields={filterFields}
        searchField="segment"
        loading={loading}
        error={error} // Pass error to HomeTable to handle display
        onRetry={handleRetry}
        noDataMessage={
          SegementationReport.length === 0 && !loading && !error
            ? NO_RECORD_FOUND
            : error
        }
      />
    </div>
  );
}
