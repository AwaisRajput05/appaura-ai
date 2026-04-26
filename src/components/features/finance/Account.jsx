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

export default function AccountsTable({ onToggleStatus: externalToggle }) {
  const [localAccounts, setLocalAccounts] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const location = useLocation();

  // Fetch accounts from API
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const response = await apiService.get(apiEndpoints.getAllAccounts, {
          // Use centralized endpoint
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        const data = response.data;
        if (data && Array.isArray(data)) {
          const updatedAccounts = data.map((account) => ({
            ...account,
            id: account.id,
            status: account.status || 'PENDING',
            localStatus: account.status || 'PENDING',
            key: account.id,
          }));
          setLocalAccounts(updatedAccounts);
          setError(null);
        } else {
          setError('Invalid data format received from server');
          setLocalAccounts([]);
        }
      } catch (err) {
        console.error('Error fetching accounts data:', err);
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
                    'An unknown error occurred while loading account data.'
                );
            }
          }
        }
        setLocalAccounts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
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
  const handleToggleStatus = async (accountId) => {
    try {
      setUpdatingId(accountId);
      setError(null);

      const currentAccount = localAccounts.find(
        (account) => account.id === accountId
      );
      if (!currentAccount) {
        console.error('Account not found:', accountId);
        return;
      }

      const currentStatus = currentAccount.status?.toUpperCase();
      const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';

      // Optimistic update
      const updatedAccounts = localAccounts.map((account) =>
        account.id === accountId
          ? { ...account, status: newStatus, localStatus: newStatus }
          : account
      );
      setLocalAccounts(updatedAccounts);

      const token = getToken();
      const response = await apiService.put(
        apiEndpoints.updateAccount(accountId),
        {
          // Use centralized endpoint
          status: newStatus,
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
        await externalToggle(accountId);
      }
    } catch (error) {
      console.error('Error updating account status:', error);
      setError(error.message);
      setLocalAccounts((prevAccounts) =>
        prevAccounts.map((account) =>
          account.id === accountId
            ? { ...account, status: account.localStatus }
            : account
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
      accessorKey: 'type',
      header: ({ column }) => <HeaderWithSort column={column} title="Type" />,
      cell: ({ row }) => (
        <span className="px-2 py-1 text-xs uppercase font-medium bg-blue-100 text-blue-700 rounded">
          {row.original.type || 'N/A'}
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
      accessorKey: 'party',
      header: ({ column }) => <HeaderWithSort column={column} title="Party" />,
      cell: ({ row }) => (
        <div className="text-sm capitalize">{row.original.party || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Due Date" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.dueDate);
        return (
          <div className="text-sm">
            {date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <HeaderWithSort column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status?.toUpperCase() || 'PENDING';
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${
              status === 'PAID'
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
        const account = row.original;
        const isPaid = account.status?.toUpperCase() === 'PAID';

        return (
          <div className="flex gap-4">
            <Link
              to={`/admin-vendors/finance-management/account/edit/${account.id}`}
              state={{ account }}
              title="Edit Account"
              className="text-yellow-600 hover:text-yellow-800 p-1 rounded hover:bg-yellow-50 transition-colors"
            >
              <Pencil size={20} />
            </Link>
            <button
              onClick={() => handleToggleStatus(account.id)}
              disabled={updatingId === account.id}
              title={isPaid ? 'Mark as Pending' : 'Mark as Paid'}
              className={`p-1 rounded transition-colors ${
                isPaid
                  ? 'text-green-600 hover:text-green-800 hover:bg-green-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              } ${
                updatingId === account.id ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {updatingId === account.id ? (
                <span className="inline-block w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
              ) : isPaid ? (
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

  const safeAccounts = Array.isArray(localAccounts) ? localAccounts : [];
  const typeOptions = [
    ...new Set(safeAccounts.map((a) => a.type).filter(Boolean)),
  ];
  const statusOptions = [
    ...new Set(
      safeAccounts.map((a) => a.status?.toUpperCase()).filter(Boolean)
    ),
  ];

  const filterFields = [
    {
      type: 'text',
      name: 'type',
      label: 'Type',
      options: ['All', ...typeOptions],
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
            setLocalAccounts([]);
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
          <HomeTable
            title="Accounts"
            data={localAccounts}
            columns={columns}
            searchField="type"
            filterFields={filterFields}
            addButtonName="NEW ACCOUNT"
            addButtonPath="/admin-vendors/finance-management/account/new"
            hideDefaultActions
            loading={loading}
          />
        </>
      )}
    </>
  );
}
