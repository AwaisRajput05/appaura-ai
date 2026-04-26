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

export default function ClaimsTable({ onToggleStatus: externalToggle }) {
  const [localClaims, setLocalClaims] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const location = useLocation();

  // Fetch claims from API
  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const response = await apiService.get(apiEndpoints.getAllClaims, {
          // Updated to use centralized endpoint
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        const data = response.data;
        if (data && Array.isArray(data)) {
          const updatedClaims = data.map((claim) => ({
            ...claim,
            patientId: claim.patientId,
            claimNumber: claim.claimNumber,
            status: claim.reconciled ? 'RECONCILED' : 'PENDING',
            localStatus: claim.reconciled ? 'RECONCILED' : 'PENDING',
            key: claim.id,
          }));
          setLocalClaims(updatedClaims);
          setError(null);
        } else {
          setError('Invalid data format received from server');
          setLocalClaims([]);
        }
      } catch (err) {
        console.error('Error fetching claims data:', err);
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
                    'An unknown error occurred while loading claims data.'
                );
            }
          }
        }
        setLocalClaims([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
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
  const handleToggleStatus = async (claimId) => {
    try {
      setUpdatingId(claimId);
      setError(null);

      const currentClaim = localClaims.find((claim) => claim.id === claimId);
      if (!currentClaim) {
        console.error('Claim not found:', claimId);
        return;
      }

      const currentStatus = currentClaim.status;
      const newStatus =
        currentStatus === 'RECONCILED' ? 'PENDING' : 'RECONCILED';
      const newReconciled = newStatus === 'RECONCILED';
      const newReconciliationDate = newReconciled
        ? new Date().toISOString().split('T')[0]
        : null;

      // Optimistic update
      const updatedClaims = localClaims.map((claim) =>
        claim.id === claimId
          ? {
              ...claim,
              status: newStatus,
              localStatus: newStatus,
              reconciled: newReconciled,
              reconciliationDate: newReconciliationDate,
            }
          : claim
      );
      setLocalClaims(updatedClaims);

      const token = getToken();
      const response = await apiService.put(
        apiEndpoints.updateClaim(claimId),
        {
          // Updated to use centralized endpoint
          reconciled: newReconciled,
          reconciliationDate: newReconciliationDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.data) throw new Error('Failed to update status');

      if (externalToggle) {
        await externalToggle(claimId);
      }
    } catch (error) {
      console.error('Error updating claim status:', error);
      setError(error.message);
      setLocalClaims((prevClaims) =>
        prevClaims.map((claim) =>
          claim.id === claimId
            ? {
                ...claim,
                status: claim.localStatus,
                reconciled: claim.localStatus === 'RECONCILED',
                reconciliationDate: claim.reconciliationDate,
              }
            : claim
        )
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Rest of the code remains unchanged
  const columns = [
    {
      accessorKey: 'id',
      header: ({ column }) => <HeaderWithSort column={column} title="ID" />,
      cell: ({ row }) => <div className="font-medium">{row.original.id}</div>,
    },
    {
      accessorKey: 'claimNumber',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Claim Number" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">{row.original.claimNumber || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'patientId',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Patient ID" />
      ),
      cell: ({ row }) => (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
          {row.original.patientId || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => <HeaderWithSort column={column} title="Amount" />,
      cell: ({ row }) => (
        <div className="text-sm">${row.original.amount.toFixed(2)}</div>
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
              status === 'RECONCILED'
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
        const claim = row.original;
        const isReconciled = claim.status === 'RECONCILED';

        return (
          <div className="flex gap-4">
            <Link
              to={`/admin-vendors/finance-management/claim/edit/${claim.id}`}
              state={{ claim }}
              title="Edit Claim"
              className="text-yellow-600 hover:text-yellow-800 p-1 rounded hover:bg-yellow-50 transition-colors"
            >
              <Pencil size={20} />
            </Link>
            <button
              onClick={() => handleToggleStatus(claim.id)}
              disabled={updatingId === claim.id}
              title={isReconciled ? 'Mark as Pending' : 'Mark as Reconciled'}
              className={`p-1 rounded transition-colors ${
                isReconciled
                  ? 'text-green-600 hover:text-green-800 hover:bg-green-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              } ${
                updatingId === claim.id ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {updatingId === claim.id ? (
                <span className="inline-block w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
              ) : isReconciled ? (
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

  const safeClaims = Array.isArray(localClaims) ? localClaims : [];

  const patientIdOptions = [
    ...new Set(safeClaims.map((c) => c.patientId).filter(Boolean)),
  ];
  const statusOptions = [
    ...new Set(safeClaims.map((c) => c.status).filter(Boolean)),
  ];

  const filterFields = [
    {
      type: 'text',
      name: 'patientId',
      label: 'Patient ID',
      options: ['All', ...patientIdOptions],
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
            setLocalClaims([]);
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
                to="/admin-vendors/finance-management/claim/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create New Claim
              </Link>
            </div>
            <div className="bg-white shadow rounded-lg">
              <HomeTable
                title="Claims"
                data={localClaims}
                columns={columns}
                searchField="patientId"
                filterFields={filterFields}
                addButtonName="NEW CLAIM"
                addButtonPath="/admin-vendors/finance-management/claim/new"
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
