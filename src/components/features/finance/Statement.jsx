import React, { useState, useEffect } from 'react';
import HomeTable from '../../common/table/Table';
import HeaderWithSort from '../../common/table/components/TableHeaderWithSort';
import { Link, useLocation } from 'react-router-dom';
import { Pencil } from 'lucide-react';
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

export default function StatementsTable() {
  const [localStatements, setLocalStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const location = useLocation();

  // Fetch statements from API
  useEffect(() => {
    const fetchStatements = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const response = await apiService.get(apiEndpoints.getAllStatements, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        const data = response.data;
        if (data && Array.isArray(data)) {
          const updatedStatements = data.map((statement) => ({
            ...statement,
            key: statement.id,
          }));
          setLocalStatements(updatedStatements);
          setError(null);
        } else {
          setError('Invalid data format received from server');
          setLocalStatements([]);
        }
      } catch (err) {
        console.error('Error fetching statements data:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          stack: err.stack,
        });
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
                    'An unknown error occurred while loading statement data.'
                );
            }
          }
        }
        setLocalStatements([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStatements();
  }, []);

  // Handle success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(null), 5000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
          {row.original.period || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'profit',
      header: ({ column }) => <HeaderWithSort column={column} title="Profit" />,
      cell: ({ row }) => (
        <div className="text-sm text-green-600 font-medium">
          ${row.original.profit?.toFixed(2) || '0.00'}
        </div>
      ),
    },
    {
      accessorKey: 'loss',
      header: ({ column }) => <HeaderWithSort column={column} title="Loss" />,
      cell: ({ row }) => (
        <div className="text-sm text-red-600 font-medium">
          ${row.original.loss?.toFixed(2) || '0.00'}
        </div>
      ),
    },
    {
      accessorKey: 'net',
      header: ({ column }) => <HeaderWithSort column={column} title="Net" />,
      cell: ({ row }) => (
        <div
          className={`text-sm font-medium px-2 py-1 rounded text-xs ${
            row.original.net >= 0
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          ${row.original.net?.toFixed(2) || '0.00'}
        </div>
      ),
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const statement = row.original;
        return (
          <div className="flex gap-4">
            <Link
              to={`/admin-vendors/finance-management/statement/edit/${statement.id}`}
              state={{ statement: { ...statement } }} // Ensure all fields are passed
              title="Edit Statement"
              className="text-yellow-600 hover:text-yellow-800 p-1 rounded hover:bg-yellow-50 transition-colors"
            >
              <Pencil size={20} />
            </Link>
          </div>
        );
      },
    },
  ];

  const safeStatements = Array.isArray(localStatements) ? localStatements : [];
  const periodOptions = [
    ...new Set(safeStatements.map((s) => s.period).filter(Boolean)),
  ];

  const filterFields = [
    {
      type: 'text',
      name: 'period',
      label: 'Period',
      options: ['All', ...periodOptions],
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
            setLocalStatements([]);
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
                to="/admin-vendors/finance-management/statement/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create New Statement
              </Link>
            </div>
            <div className="bg-white shadow rounded-lg">
              <HomeTable
                title="Statements"
                data={safeStatements}
                columns={columns}
                searchField="period"
                filterFields={filterFields}
                addButtonName="NEW STATEMENT"
                addButtonPath="/admin-vendors/finance-management/statement/new"
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
