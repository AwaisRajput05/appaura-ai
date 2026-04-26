import React, { useState, useEffect } from 'react';
import HomeTable from '../../common/table/Table';
import HeaderWithSort from '../../common/table/components/TableHeaderWithSort';
import { useLocation, useNavigate } from 'react-router-dom';
import { Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import apiService from '../../../services/apiService';
import { apiEndpoints } from '../../../services/apiEndpoints';

export default function OfferTable({
  offers = [],
  onToggleStatus,
  onRedeem,
  onOfferUpdate,
}) {
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(null), 5000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleEditOffer = (offerId) => {
    const offer = offers.find(
      (offer) => offer._id === offerId || offer.id === offerId
    );
    if (!offer) {
      setError('Offer not found');
      return;
    }
    navigate('/offers/form', { state: { offer } });
  };

  const columns = [
    {
      accessorKey: 'title',
      header: ({ column }) => <HeaderWithSort column={column} title="Title" />,
      cell: ({ row }) => (
        <div className="font-medium">{row.original.title || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Description" />
      ),
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.description || 'No description'}
        </div>
      ),
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
      accessorKey: 'validity',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Validity Period" />
      ),
      cell: ({ row }) => {
        try {
          const startDate = row.original.startTime
            ? new Date(row.original.startTime).toLocaleDateString()
            : 'N/A';
          const endDate = row.original.endTime
            ? new Date(row.original.endTime).toLocaleDateString()
            : 'N/A';
          return (
            <div className="text-sm">
              <div>Start: {startDate}</div>
              <div>End: {endDate}</div>
            </div>
          );
        } catch (error) {
          console.error('Error parsing date:', error);
          return <div className="text-sm text-gray-500">Invalid date</div>;
        }
      },
    },
    {
      accessorKey: 'targetAudience',
      header: ({ column }) => <HeaderWithSort column={column} title="Target" />,
      cell: ({ row }) => {
        const targets = row.original.targetAudience || [];
        return (
          <div className="flex gap-1 flex-wrap">
            {targets.length > 0 ? (
              targets.map((target, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded"
                >
                  {target}
                </span>
              ))
            ) : (
              <span className="text-gray-500">No target specified</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'termsAndConditions',
      header: ({ column }) => <HeaderWithSort column={column} title="Terms" />,
      cell: ({ row }) => (
        <div
          className="text-sm text-gray-600 max-w-xs truncate"
          title={row.original.termsAndConditions || 'No terms specified'}
        >
          {row.original.termsAndConditions || 'No terms specified'}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <HeaderWithSort column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status?.toUpperCase() || 'INACTIVE';
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${
              status === 'ACTIVE'
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
        const offer = row.original;
        const isActive = offer.status?.toUpperCase() === 'ACTIVE';

        return (
          <div className="flex gap-4">
            <button
              onClick={() => handleEditOffer(offer._id || offer.id)}
              title="Edit Offer"
              className="text-yellow-600 hover:text-yellow-800"
            >
              <Pencil size={25} />
            </button>
            <button
              onClick={() => onToggleStatus(offer._id || offer.id)}
              disabled={updatingId === (offer._id || offer.id)}
              title={isActive ? 'Deactivate Offer' : 'Activate Offer'}
              className={`${
                isActive
                  ? 'text-green-600 hover:text-green-800'
                  : 'text-gray-400 hover:text-gray-600'
              } ${
                updatingId === (offer._id || offer.id)
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {updatingId === (offer._id || offer.id) ? (
                <span className="inline-block w-6 h-6 border-2 border-current border-r-transparent rounded-full animate-spin" />
              ) : isActive ? (
                <ToggleLeft size={25} />
              ) : (
                <ToggleRight size={25} />
              )}
            </button>
          </div>
        );
      },
    },
  ];

  const safeOffers = Array.isArray(offers) ? offers : [];
  const typeOptions = [
    ...new Set(safeOffers.map((o) => o.type).filter(Boolean)),
  ];
  const audienceOptions = [
    ...new Set(
      safeOffers.flatMap((o) => o.targetAudience || []).filter(Boolean)
    ),
  ];
  const statusOptions = [
    ...new Set(safeOffers.map((o) => o.status?.toUpperCase()).filter(Boolean)),
  ];

  const filterFields = [
    {
      type: 'text',
      name: 'title',
      label: 'Title',
      placeholder: 'Search by title...',
    },
    {
      type: 'text',
      name: 'description',
      label: 'Description',
      placeholder: 'Search by description...',
    },
    {
      type: 'select',
      name: 'type',
      label: 'Type',
      options: ['All', ...typeOptions],
    },
    {
      type: 'select',
      name: 'targetAudience',
      label: 'Target Audience',
      options: ['All', ...audienceOptions],
    },
    {
      type: 'select',
      name: 'status',
      label: 'Status',
      options: ['All', ...statusOptions],
    },
    { type: 'dateRange', name: 'validity', label: 'Validity Period' },
  ];

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 mb-4 rounded-md">
          {error}
        </div>
      )}
      {successMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      <HomeTable
        title="Vendor Offer Dashboard"
        data={offers}
        columns={columns}
        searchField="title"
        filterFields={filterFields}
        addButtonName="NEW OFFER"
        addButtonPath="/offers/form"
        hideDefaultActions
        noDataMessage={
          safeOffers.length === 0 && !error ? 'No record found' : error
        }
      />
    </>
  );
}
