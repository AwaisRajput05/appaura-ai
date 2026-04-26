import React, { useState, useEffect } from 'react';
import HomeTable from '../../common/table/Table';
import HeaderWithSort from '../../common/table/components/TableHeaderWithSort';
import apiService from '../../../services/apiService';
import { apiEndpoints } from '../../../services/apiEndpoints';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiCopy, FiPlay } from 'react-icons/fi';
import { MessageAlert } from '../../common/message/MessageAlert';
import {
  ERROR_429,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_503,
} from '../../constants/Messages';

export default function OfferTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get(apiEndpoints.template);
      // If API didn't return proper data structure
      if (!response?.data || !Array.isArray(response.data)) {
        throw new Error('Invalid API response');
      }
      const formattedTemplates = response.data.map((template) => ({
        id: template.id,
        name: template.title,
        type: template.type,
        description: template.description,
        termsAndConditions: template.termsAndConditions,
        targetAudience: template.targetAudience?.join(', ') || 'All Customers',
        lastModified: new Date(
          template.updatedAt || Date.now()
        ).toLocaleDateString(),
        status: template.status || 'Active',
      }));
      // If service is working but no data found → just show empty table (no error)
      setTemplates(formattedTemplates);
      setError(null);
    } catch (err) {
      console.error('Error fetching templates:', err);
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
            setError(ERROR_503); // Show error only when service is unavailable
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
                'An unknown error occurred while loading templates.'
            );
        }
      }
      setTemplates([]); // Clear data only on actual error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await apiService.delete(apiEndpoints.deleteTemplate(id));
        await fetchTemplates();
      } catch (err) {
        console.error('Error deleting template:', err);
        alert('Failed to delete template');
      }
    }
  };

  const handleDuplicateTemplate = async (id) => {
    try {
      const template = templates.find((t) => t.id === id);
      if (template) {
        const duplicateData = {
          ...template,
          name: `${template.name} (Copy)`,
          id: undefined,
        };
        await apiService.post(apiEndpoints.template, duplicateData);
        await fetchTemplates();
        alert('Template duplicated successfully');
      }
    } catch (err) {
      console.error('Error duplicating template:', err);
      alert('Failed to duplicate template');
    }
  };

  const handleUseTemplate = async (id) => {
    try {
      const response = await apiService.post(
        apiEndpoints.createOfferFromTemplate(id),
        {
          vendorId: localStorage.getItem('vendorId'),
          startTime: null,
          endTime: null,
          targetAudience: ['ALL_CUSTOMERS', 'NEW_CUSTOMERS'],
          termsAndConditions:
            'Applicable on orders above $20. Not valid with other offers.',
          description: 'Get 10% off on your total bill.',
          abtestGroup: null,
        }
      );

      if (response.data.status === 'success') {
        alert('Template applied successfully');
        if (response.data.data?.id) {
          navigate(
            `/admin-vendors/offers-management/offers/edit/${response.data.id}`
          );
        }
      } else {
        throw new Error(response.data.message || 'Failed to apply template');
      }
    } catch (err) {
      console.error('Error using template:', err);
      alert(err.message || 'Failed to apply template');
    }
  };

  const columns = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Template Name" />
      ),
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Template Type" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              row.original.type === 'Discount'
                ? 'bg-blue-100 text-blue-800'
                : row.original.type === 'Promotion'
                ? 'bg-green-100 text-green-800'
                : row.original.type === 'Seasonal'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {row.original.type}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Description" />
      ),
      cell: ({ row }) => (
        <div className="text-sm max-w-md truncate">
          {row.original.description}
        </div>
      ),
    },
    {
      accessorKey: 'targetAudience',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Target Audience" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">{row.original.targetAudience}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <HeaderWithSort column={column} title="Status" />,
      cell: ({ row }) => (
        <div
          className={`text-sm font-medium ${
            row.original.status === 'Active'
              ? 'text-green-600'
              : 'text-gray-500'
          }`}
        >
          {row.original.status}
        </div>
      ),
    },
    {
      accessorKey: 'lastModified',
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Last Modified" />
      ),
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">{row.original.lastModified}</div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleUseTemplate(row.original.id)}
            className="text-purple-600 hover:text-purple-800"
            title="Use Template"
          >
            <FiPlay className="h-4 w-4" />
          </button>
          {/* <button
                        onClick={() => handleDuplicateTemplate(row.original.id)}
                        className="text-green-600 hover:text-green-800"
                        title="Duplicate Template"
                    >
                        <FiCopy className="h-4 w-4" />
                    </button> */}
          <button
            onClick={() => handleDeleteTemplate(row.original.id)}
            className="text-red-600 hover:text-red-800"
            title="Delete Template"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const filterFields = [
    {
      type: 'text',
      name: 'name',
      label: 'Template Name',
      placeholder: 'Search templates...',
    },
    {
      type: 'select',
      name: 'type',
      label: 'Template Type',
      options: ['All', 'Discount', 'Promotion', 'Seasonal', 'Special'],
    },
    {
      type: 'select',
      name: 'status',
      label: 'Status',
      options: ['All', 'Active', 'Inactive'],
    },
  ];

  // if (error) {
  //     return (
  //         <div className="">
  //             <div className="rounded-lg bg-red-50 p-4 text-red-800">
  //                 <p>{error}</p>
  //                 <button
  //                     onClick={fetchTemplates}
  //                     className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
  //                 >
  //                     Try Again
  //                 </button>
  //             </div>
  //         </div>
  //     );
  // }

  return (
    <>
      {error ? (
        <MessageAlert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          action={fetchTemplates}
          actionLabel="Try Again"
        />
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4 px-6">
            <button
              onClick={() =>
                navigate('/admin-vendors/offers-management/templates/new')
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-md transition-all duration-200"
            >
              + Create New Template
            </button>
          </div>
          <div className="rounded-lg">
            <HomeTable
              title="Offer Templates"
              subtitle="Manage your offer templates"
              data={templates}
              columns={columns}
              searchField="name"
              filterFields={filterFields}
              loading={loading}
              hideDefaultActions={false}
              primaryAction={{
                label: 'Create New Template',
                onClick: () =>
                  navigate('/admin-vendors/offers-management/templates/new'),
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
