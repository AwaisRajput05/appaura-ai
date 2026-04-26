//ActiveSubAcc.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HomeTable from '../../common/table/Table';
import HeaderWithSort from '../../common/table/components/TableHeaderWithSort';
import { MessageAlert } from '../../common/message/MessageAlert';
import axios from 'axios';
import { getToken } from '../../../services/tokenUtils';
import { apiEndpoints } from '../../../services/apiEndpoints';

export default function ActiveSubaccounts() {
  const [loading, setLoading] = useState(true);
  const [subaccounts, setSubaccounts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubaccounts = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = getToken();
        if (!token) {
          setError('Authentication token not found. Please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get(apiEndpoints.ActiveSubaccounts, {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          timeout: 10000,
        });

        let data = response.data;
        if (typeof data === 'string') {
          data = data.trim();
          try {
            data = JSON.parse(data);
          } catch (parseErr) {
            console.error('JSON parse error:', parseErr);
            setError('Invalid JSON from server. Check console for raw data.');
            setLoading(false);
            return;
          }
        }

        const apiData = Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : []);

        if (apiData.length === 0) {
          setSubaccounts([]);
          setLoading(false);
          return;
        }

        const mappedSubaccounts = apiData.map((item, index) => {
          return {
            id: item?.id || `temp-${index}`,
            subAccountCode: item?.subAccountCode || 'N/A',
            accountType: item?.accountType || 'N/A',
            createdAt: item?.createdAt || 'N/A',
            expiresAt: item?.expiresAt || 'N/A',
            used: item?.used === true ? 'Yes' : (item?.used === false ? 'No' : 'N/A'),
            expired: item?.expired === true ? 'Yes' : (item?.expired === false ? 'No' : 'N/A'),
            masterVendorId: item?.masterVendorId || 'N/A',
            childVendorId: item?.childVendorId || 'N/A',
          };
        });

        setSubaccounts(mappedSubaccounts);
      } catch (err) {
        let data = err.response?.data;
        if (data) {
          if (typeof data === 'string') {
            try {
              data = JSON.parse(data.trim());
            } catch (parseErr) {
              console.error('JSON parse error in catch:', parseErr);
            }
          }

          const apiData = Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : []);

          if (apiData.length > 0) {
            const mappedSubaccounts = apiData.map((item, index) => {
              return {
                id: item?.id || `temp-${index}`,
                subAccountCode: item?.subAccountCode || 'N/A',
                accountType: item?.accountType || 'N/A',
                createdAt: item?.createdAt || 'N/A',
                expiresAt: item?.expiresAt || 'N/A',
                used: item?.used === true ? 'Yes' : (item?.used === false ? 'No' : 'N/A'),
                expired: item?.expired === true ? 'Yes' : (item?.expired === false ? 'No' : 'N/A'),
                masterVendorId: item?.masterVendorId || 'N/A',
                childVendorId: item?.childVendorId || 'N/A',
              };
            });
            setSubaccounts(mappedSubaccounts);
            setLoading(false);
            return;
          }
        }

        console.error('Error fetching subaccounts:', err);
        if (err.response) {
          console.error('Response data:', err.response.data);
        }
        let errorMessage = 'Failed to load active subaccounts. Please check console for details.';
        if (err.code === 'ECONNABORTED') errorMessage = 'Request timed out. Please try again.';
        if (err.response?.status === 401) errorMessage = 'Unauthorized. Please log in.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchSubaccounts();
  }, []);

  const subaccountsColumns = [
    {
      accessorKey: 'subAccountCode',
      header: ({ column }) => <HeaderWithSort column={column} title="Subaccount Code" />,
      cell: (info) => <span className="font-mono text-sm">{info.getValue() || 'N/A'}</span>,
    },
    {
      accessorKey: 'accountType',
      header: ({ column }) => <HeaderWithSort column={column} title="Account Type" />,
      cell: (info) => info.getValue() || 'N/A',
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <HeaderWithSort column={column} title="Created At" />,
      cell: (info) => {
        const value = info.getValue();
        if (value === 'N/A') return 'N/A';
        const date = new Date(value);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      },
    },
    {
      accessorKey: 'expiresAt',
      header: ({ column }) => <HeaderWithSort column={column} title="Expires At" />,
      cell: (info) => {
        const value = info.getValue();
        if (value === 'N/A') return 'N/A';
        const date = new Date(value);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      },
    },
    {
      accessorKey: 'used',
      header: ({ column }) => <HeaderWithSort column={column} title="Used" />,
      cell: (info) => {
        const value = info.getValue();
        return (
          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
            value === 'Yes' ? 'bg-green-100 text-green-800' : value === 'No' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {value}
          </span>
        );
      },
    },
    {
      accessorKey: 'expired',
      header: ({ column }) => <HeaderWithSort column={column} title="Expired" />,
      cell: (info) => {
        const value = info.getValue();
        return (
          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
            value === 'Yes' ? 'bg-red-100 text-red-800' : value === 'No' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {value}
          </span>
        );
      },
    },
  ];

  const filterFields = [
    { type: 'text', name: 'subAccountCode', label: 'Subaccount Code' },
    { type: 'text', name: 'accountType', label: 'Account Type' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {error && (
          <MessageAlert
            variant="error"
            message={error}
            onClose={() => setError(null)}
            action={() => window.location.reload()}
            actionLabel="Retry"
          />
        )}
        <div className="overflow-x-auto">
          <HomeTable
            title="Active Subaccounts"
            data={subaccounts}
            columns={subaccountsColumns}
            searchField="subAccountCode"
            filterFields={filterFields}
            loading={loading}
          />
        </div>
        {subaccounts.length === 0 && !loading && !error && (
          <div className="mt-8 text-center text-gray-500">
            No subaccounts found. (Check console for API response)
          </div>
        )}
      </div>
    </div>
  );
}