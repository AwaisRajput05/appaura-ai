import React, { useEffect, useState } from 'react';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import { apiEndpoints } from '../../../../services/apiEndpoints';
import { getToken } from '../../../../services/tokenUtils';
import apiService from '../../../../services/apiService';
import { MessageAlert } from '../../../common/message/MessageAlert';
import {
  ERROR_429,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_503,
} from '../../../constants/Messages';

export default function Customers() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const token = getToken();

        const { data } = await apiService.get(apiEndpoints.getAllCustomers, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        // Handle the paginated response data
        if (data.content && Array.isArray(data.content)) {
          if (data.content.length === 0) {
            setError(null); // No error, just no records
            setCustomers([]); // Set to empty array for "No records found"
          } else {
            const formattedData = data.content.map((customer, index) => ({
              sn: index + 1,
              ...customer,
            }));
            setCustomers(formattedData);
            setError(null);
          }
        } else {
          setError('Invalid data format received from server');
          setCustomers([]);
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
        // Handle specific error cases
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
                    'An unknown error occurred while loading vendor data.'
                );
            }
          }
        }
        setCustomers([]); // Clear customers on error
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Define columns (unchanged)
  const columns = [
    {
      accessorKey: 'sn',
      header: 'Serial No.',
      cell: ({ row }) => row.original.sn,
    },
    {
      accessorKey: 'customerExternalId',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Customer ID" />
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <HeaderWithSort column={column} title="Name" />,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <HeaderWithSort column={column} title="Email" />,
      cell: ({ getValue }) => getValue() || '-',
    },
    {
      accessorKey: 'contactNo',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Contact Number" />
      ),
      cell: ({ row }) =>
        `${row.original.contactNoCode} ${row.original.contactNo}`,
    },
    {
      accessorKey: 'active',
      header: ({ column }) => <HeaderWithSort column={column} title="Status" />,
      cell: ({ getValue }) => (getValue() ? 'Active' : 'Inactive'),
    },
    {
      accessorKey: 'currentPoints',
      header: ({ column }) => <HeaderWithSort column={column} title="Points" />,
      cell: ({ getValue }) => getValue() || 0,
    },
    {
      accessorKey: 'lastTrxDate',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Last Transaction" />
      ),
      cell: ({ getValue }) => getValue() || '-',
    },
  ];

  // Generate filter options from actual data (use customers directly, fall back to empty if none)
  const genderOptions = [...new Set(customers.map((c) => c.gender) || [])];
  const frequencyOptions = [
    ...new Set(customers.map((c) => c.frequency) || []),
  ];
  const loyaltyTierOptions = [
    ...new Set(customers.map((c) => c.loyaltyTier) || []),
  ];
  const categoryOptions = [
    ...new Set(customers.map((c) => c.preferredCategory) || []),
  ];

  const filterFields = [
    {
      type: 'text',
      name: 'customerId',
      label: 'Customer ID',
      placeholder: 'Filter by Customer ID...',
    },
    {
      type: 'select',
      name: 'gender',
      label: 'Gender',
      options: ['All', ...genderOptions],
    },
    {
      type: 'select',
      name: 'frequency',
      label: 'Purchase Frequency',
      options: ['All', ...frequencyOptions],
    },
    {
      type: 'range',
      name: 'lastPurchase',
      label: 'Last Purchase (days)',
      min: 0,
      max: 60,
    },
    {
      type: 'range',
      name: 'totalSpend',
      label: 'Total Spend',
      min: 0,
      max: 10000,
      step: 100,
    },
    {
      type: 'select',
      name: 'loyaltyTier',
      label: 'Loyalty Tier',
      options: ['All', ...loyaltyTierOptions],
    },
    {
      type: 'select',
      name: 'preferredCategory',
      label: 'Preferred Category',
      options: ['All', ...categoryOptions],
    },
    {
      type: 'range',
      name: 'rewardRedeemed',
      label: 'Rewards Redeemed',
      min: 0,
      max: 10,
    },
  ];

  // Use customers directly, no fallback data
  const dataToUse = customers;

  return (
    <>
      {error ? (
        <MessageAlert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          action={() => {
            setError(null);
            setCustomers([]);
          }}
          actionLabel="Try Again"
        />
      ) : (
        <HomeTable
          title="Customers"
          data={dataToUse}
          columns={columns}
          searchField="customerId"
          filterFields={filterFields}
          loading={loading}
          noDataMessage={
            customers.length === 0 && !loading ? 'No records found' : undefined
          } // Show "No records found" when no data and not loading
        />
      )}
    </>
  );
}
