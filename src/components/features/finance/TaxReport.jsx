import React, { useState, useEffect } from 'react';
import HomeTable from '../../common/table/Table';
import HeaderWithSort from '../../common/table/components/TableHeaderWithSort';
import { Link, useLocation } from 'react-router-dom';
import { Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
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
import { apiEndpoints } from '../../../services/apiEndpoints';

export default function TaxRecordsTable({ onToggleStatus: externalToggle }) {
  const [localTaxRecords, setLocalTaxRecords] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const location = useLocation();

  // Fetch tax records from API
  useEffect(() => {
    const fetchTaxRecords = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const response = await apiService.get(apiEndpoints.getAllTaxRecords, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        const data = response.data;
        if (data && Array.isArray(data)) {
          const updatedTaxRecords = data.map((record) => ({
            ...record,
            status: record.compliant ? 'FILED' : 'PENDING',
            localStatus: record.compliant ? 'FILED' : 'PENDING',
            key: record.id,
          }));
          setLocalTaxRecords(updatedTaxRecords);
          setError(null);
        } else {
          setError('Invalid data format received from server');
          setLocalTaxRecords([]);
        }
      } catch (err) {
        console.error('Error fetching tax records data:', err);
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
                    'An unknown error occurred while loading tax records data.'
                );
            }
          }
        }
        setLocalTaxRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTaxRecords();
  }, []);

  // Handle success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(null), 5000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle status toggle with API call
  const handleToggleStatus = async (recordId) => {
    try {
      setUpdatingId(recordId);
      setError(null);

      const currentRecord = localTaxRecords.find(
        (record) => record.id === recordId
      );
      if (!currentRecord) {
        console.error('Tax record not found:', recordId);
        return;
      }

      const currentStatus = currentRecord.status;
      const newStatus = currentStatus === 'FILED' ? 'PENDING' : 'FILED';
      const newCompliant = newStatus === 'FILED';

      // Optimistic update
      const updatedTaxRecords = localTaxRecords.map((record) =>
        record.id === recordId
          ? {
              ...record,
              status: newStatus,
              localStatus: newStatus,
              compliant: newCompliant,
            }
          : record
      );
      setLocalTaxRecords(updatedTaxRecords);

      const token = getToken();
      const response = await apiService.put(
        apiEndpoints.updateTaxRecord(recordId),
        {
          compliant: newCompliant,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.data) throw new Error('Failed to update status');

      // Update local state with the response data if needed
      const updatedRecord = response.data;
      setLocalTaxRecords((prevRecords) =>
        prevRecords.map((record) =>
          record.id === recordId
            ? {
                ...record,
                ...updatedRecord,
                status: updatedRecord.compliant ? 'FILED' : 'PENDING',
              }
            : record
        )
      );

      if (externalToggle) {
        await externalToggle(recordId);
      }
      setSuccessMessage('Tax record status updated successfully');
    } catch (error) {
      console.error('Error updating tax record status:', error);
      setError(
        error.response?.data?.message ||
          error.message ||
          'Failed to update tax record status'
      );
      setLocalTaxRecords((prevRecords) =>
        prevRecords.map((record) =>
          record.id === recordId
            ? {
                ...record,
                status: record.localStatus,
                compliant: record.localStatus === 'FILED',
              }
            : record
        )
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const columns = [
    {
      accessorKey: 'id',
      header: ({ column }) => <HeaderWithSort column={column} title="ID" />,
      cell: ({ row }) => <div className="font-medium">{row.original.id}</div>,
    },
    {
      accessorKey: 'period',
      header: ({ column }) => <HeaderWithSort column={column} title="Period" />,
      cell: ({ row }) => (
        <div className="text-sm">{row.original.period || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => <HeaderWithSort column={column} title="Amount" />,
      cell: ({ row }) => (
        <div className="text-sm">
          ${row.original.amount?.toFixed(2) || '0.00'}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <HeaderWithSort column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status || 'PENDING';
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${
              status === 'FILED'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const record = row.original;
        const isFiled = record.status === 'FILED';

        return (
          <div className="flex gap-4">
            <Link
              to={`/admin-vendors/finance-management/taxrecord/edit/${record.id}`}
              state={{ record }}
              title="Edit Tax Record"
              className="text-yellow-600 hover:text-yellow-800 p-1 rounded hover:bg-yellow-50 transition-colors"
            >
              <Pencil size={20} />
            </Link>
            <button
              onClick={() => handleToggleStatus(record.id)}
              disabled={updatingId === record.id}
              title={isFiled ? 'Mark as Pending' : 'Mark as Filed'}
              className={`p-1 rounded transition-colors ${
                isFiled
                  ? 'text-green-600 hover:text-green-800 hover:bg-green-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              } ${
                updatingId === record.id ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {updatingId === record.id ? (
                <span className="inline-block w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
              ) : isFiled ? (
                <ToggleLeft size={20} />
              ) : (
                <ToggleRight size={20} />
              )}
            </button>
          </div>
        );
      },
    },
  ];

  const safeTaxRecords = Array.isArray(localTaxRecords) ? localTaxRecords : [];

  const periodOptions = [
    ...new Set(safeTaxRecords.map((r) => r.period).filter(Boolean)),
  ];
  const statusOptions = [
    ...new Set(safeTaxRecords.map((r) => r.status).filter(Boolean)),
  ];

  const filterFields = [
    {
      type: 'text',
      name: 'period',
      label: 'Period',
      options: ['All', ...periodOptions],
    },
    {
      type: 'text',
      name: 'status',
      label: 'Status',
      options: ['All', ...statusOptions],
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
            setLocalTaxRecords([]);
          }}
          actionLabel="Try Again"
        />
      ) : (
        <>
          {successMessage && (
            <div
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <span className="block sm:inline">{successMessage}</span>
            </div>
          )}
          <div className="px-4 py-5">
            <div className="flex justify-between items-center bg-white p-2 rounded-md mb-6">
              <Link
                to="/admin-vendors/finance-management/taxrecord/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create New Tax Record
              </Link>
            </div>
            <div className="bg-white shadow rounded-lg">
              <HomeTable
                title="Tax Records"
                data={localTaxRecords}
                columns={columns}
                searchField="period"
                filterFields={filterFields}
                addButtonName="NEW TAX RECORD"
                addButtonPath="/admin-vendors/finance-management/taxrecord/new"
                hideDefaultActions
                loading={loading}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
