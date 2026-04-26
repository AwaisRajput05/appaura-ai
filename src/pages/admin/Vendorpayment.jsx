// src/pages/admin/SubscriptionPayments.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from "react-dom";
import axios from 'axios';
import { getToken } from '../../services/tokenUtils';
import { useAuth } from '../../components/auth/hooks/useAuth';
import { MessageAlert } from '../../components/common/message/MessageAlert';
import { NO_RECORD_FOUND } from '../../components/constants/Messages';
import { FaEye, FaTimes } from 'react-icons/fa';
import Table from '../../components/common/table/Table';
import HeaderWithSort from '../../components/common/table/components/TableHeaderWithSort';
import { apiEndpoints } from "../../services/endpoint/payments/payend";

const statusColors = {
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
};

 const HoverTooltip = React.memo(({ text, title = "Details", children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const timerRef = React.useRef(null);

  if (!text || text.trim() === "") return <span className="text-gray-400">—</span>;

  const words = text.trim().split(/\s+/);
  const preview = words.slice(0, 2).join(" ") + (words.length > 2 ? "..." : "");

  const open = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const close = () => {
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const content = children || (
    <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
      {text}
    </p>
  );

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={open}
        onMouseLeave={close}
        className="text-blue-600 hover:underline cursor-help text-sm"
      >
        {preview}
      </span>

      {isOpen && createPortal(
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[999999] pointer-events-none">
          <div 
            onMouseEnter={open}
            onMouseLeave={close}
            className="bg-white rounded-xl shadow-2xl p-6 border border-gray-300 max-w-2xl max-h-[80vh] overflow-y-auto pointer-events-auto"
          >
            <h3 className="font-bold text-lg mb-4 text-center text-gray-800 border-b pb-3">
              {title}
            </h3>
            {content}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});

export default function SubscriptionPayments() {
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveReason, setApproveReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

  const [filters, setFilters] = useState({
    search: '',
    status: 'PENDING',
  });

  // Use refs for cleanup
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  const formatDateTimeLocal = (dateString) => {
    if (!dateString) return 'N/A';
    let cleaned = dateString;
    if (cleaned.includes('+00:00')) {
      cleaned = cleaned.replace('+00:00', 'Z');
    } else if (!cleaned.endsWith('Z')) {
      cleaned += 'Z';
    }
    const date = new Date(cleaned);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const fetchRequests = useCallback(async () => {
    // Clean up previous request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    // Create new controller for this request
    controllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) throw new Error('No token found');

      const params = {
        page: pagination.page,
        size: pagination.page_size,
        search: filters.search.trim() || '',
      };

      const res = await axios.get(apiEndpoints.getPaymentRequests(filters.status), {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        signal: controllerRef.current.signal,
        timeout: 30000,
      });

      const responseData = res.data;
      const requestList = responseData.data || [];
      const paginateInfo = responseData.pagination || {};

      if (mountedRef.current) {
        setRequests(requestList);
        setPagination(prev => ({
          ...prev,
          total: paginateInfo.totalRecords || paginateInfo.total_records || 0,
        }));
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      if (err.name === 'AbortError' || err.name === 'CanceledError') return;
      
      console.error('Error fetching payment requests:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please try again.');
      } else if (err.response) {
        if (err.response.status === 404) {
          setError('Payment request not found. Please refresh the page.');
          setRequests([]);
        } else {
          setError(err.response.data?.message || `Failed to load payment requests (${err.response.status})`);
        }
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to load payment requests');
      }
      
      setRequests([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    pagination.page,
    pagination.page_size,
    filters.search,
    filters.status,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      fetchRequests();
    }, 400);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [
    user,
    pagination.page,
    pagination.page_size,
    filters.search,
    filters.status,
    fetchRequests,
  ]);

  const handleFilterChange = useCallback((name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleViewImage = async (request) => {
    setLoadingImage(request.paymentRequestId);
    try {
      const token = getToken();
      const res = await axios.get(apiEndpoints.getTransactionImage(request.vendorId, request.paymentRequestId), {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        responseType: 'blob',
        timeout: 30000,
      });
      const url = URL.createObjectURL(res.data);
      setEnlargedImage(url);
    } catch (err) {
      console.error('Failed to load transaction image', err);
      setError('Failed to load image');
    } finally {
      setLoadingImage(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'businessName',
        header: ({ column }) => <HeaderWithSort column={column} title="Business Name" />,
        cell: ({ row }) => row.original.businessName || 'N/A',
      },
      {
        accessorKey: 'vendorEmail',
        header: ({ column }) => <HeaderWithSort column={column} title="Email" />,
        cell: ({ row }) => row.original.vendorEmail || 'N/A',
      },
      {
        accessorKey: 'plan',
        header: ({ column }) => <HeaderWithSort column={column} title="Plan" />,
        cell: ({ row }) => row.original.plan || 'N/A',
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => <HeaderWithSort column={column} title="Amount" />,
        cell: ({ row }) => `₨${row.original.amount || 'N/A'}`,
      },
      {
        accessorKey: 'paymentMethod',
        header: ({ column }) => <HeaderWithSort column={column} title="Payment Method" />,
        cell: ({ row }) => {
          const method = row.original.paymentMethod;
          const methodColors = {
            BANK: 'bg-blue-100 text-blue-700',
            CARD: 'bg-purple-100 text-purple-700',
            CASH: 'bg-green-100 text-green-700',
          };
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${methodColors[method] || 'bg-gray-100 text-gray-700'}`}>
              {method || 'N/A'}
            </span>
          );
        },
      },
      {
        accessorKey: 'description',
        header: ({ column }) => <HeaderWithSort column={column} title="Description" />,
        cell: ({ row }) => <HoverTooltip text={row.original.description} title="Description" />,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <HeaderWithSort column={column} title="Status" />,
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                statusColors[status] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {status || 'N/A'}
            </span>
          );
        },
      },
      {
        accessorKey: 'requestedDate',
        header: ({ column }) => <HeaderWithSort column={column} title="Requested Date" />,
        cell: ({ row }) => formatDateTimeLocal(row.original.requestedDate),
      },
      {
        accessorKey: 'adminRemarks',
        header: ({ column }) => <HeaderWithSort column={column} title="Admin Remarks" />,
        cell: ({ row }) => row.original.adminRemarks || <span className="text-gray-400">—</span>,
      },
      {
        accessorKey: 'verifiedDate',
        header: ({ column }) => <HeaderWithSort column={column} title="Verified Date" />,
        cell: ({ row }) => row.original.verifiedDate ? formatDateTimeLocal(row.original.verifiedDate) : <span className="text-gray-400">—</span>,
      },
      {
        accessorKey: 'viewImage',
        header: 'Transaction Image',
        enableSorting: false,
        cell: ({ row }) => {
          const isLoadingThis = loadingImage === row.original.paymentRequestId;
          return (
            <button
              onClick={() => !isLoadingThis && handleViewImage(row.original)}
              disabled={isLoadingThis}
              className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
              title="View transaction image"
            >
              {isLoadingThis ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <FaEye className="text-lg" />
              )}
            </button>
          );
        },
      },
      {
  accessorKey: 'actions',
  header: 'Actions',
  enableSorting: false,
  cell: ({ row }) => {
    const request = row.original;
    const isPending = request.status === 'PENDING';
    
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (!isPending) return;
            setSelectedRequest(request);
            setShowApproveModal(true);
          }}
          disabled={!isPending}
          className={`px-3 py-1.5 rounded text-xs font-medium ${
            isPending 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={!isPending ? `Cannot approve - status is ${request.status}` : 'Approve'}
        >
          Approve
        </button>
        <button
          onClick={() => {
            if (!isPending) return;
            setSelectedRequest(request);
            setShowRejectModal(true);
          }}
          disabled={!isPending}
          className={`px-3 py-1.5 rounded text-xs font-medium ${
            isPending 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={!isPending ? `Cannot reject - status is ${request.status}` : 'Reject'}
        >
          Reject
        </button>
      </div>
    );
  },
}
    ],
    [loadingImage]
  );

  const handlePaginationChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, page, page_size: pageSize }));
  };

  const filterFields = useMemo(() => [
    {
      type: "select",
      name: "status",
      label: "Status",
      value: filters.status,
      onChange: (e) => handleFilterChange("status", e.target.value),
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'REJECTED', label: 'Rejected' },
      ],
    },
    {
      type: "text",
      name: "search",
      label: "Search",
      placeholder: "Search by business name or email...",
      value: filters.search,
      onChange: (e) => handleFilterChange("search", e.target.value),
    },
  ], [filters, handleFilterChange]);

  const handleApprove = async () => {
    if (!approveReason.trim()) return setError('Remarks are required');
    setIsApproving(true);
    setError(null);
    
    try {
      const token = getToken();
      const body = {
        vendorId: selectedRequest.vendorId,
        status: 'APPROVED',
        adminRemarks: approveReason,
      };
      
      await axios.post(apiEndpoints.planPaymentAction(), body, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });
      
      setSuccess('Payment approved successfully');
      setShowApproveModal(false);
      setApproveReason('');
      
      setTimeout(() => {
        fetchRequests();
      }, 500);
      
    } catch (err) {
      console.error('Approve error:', err);
      
      if (err.response) {
        if (err.response.status === 404) {
          setError('Payment request not found. It may have been modified by another admin.');
        } else {
          setError(err.response.data?.message || `Failed to approve payment (${err.response.status})`);
        }
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Payment may have been approved - please refresh the page.');
      } else {
        setError('Failed to approve payment');
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return setError('Remarks are required');
    setIsRejecting(true);
    setError(null);
    
    try {
      const token = getToken();
      const body = {
        vendorId: selectedRequest.vendorId,
        status: 'REJECTED',
        adminRemarks: rejectReason,
      };
      
      await axios.post(apiEndpoints.planPaymentAction(), body, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });
      
      setSuccess('Payment rejected successfully');
      setShowRejectModal(false);
      setRejectReason('');
      
      setTimeout(() => {
        fetchRequests();
      }, 500);
      
    } catch (err) {
      console.error('Reject error:', err);
      
      if (err.response) {
        if (err.response.status === 404) {
          setError('Payment request not found. It may have been modified by another admin.');
        } else {
          setError(err.response.data?.message || `Failed to reject payment (${err.response.status})`);
        }
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Payment may have been rejected - please refresh the page.');
      } else {
        setError('Failed to reject payment');
      }
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCloseEnlargedImage = () => {
    if (enlargedImage) {
      URL.revokeObjectURL(enlargedImage);
    }
    setEnlargedImage(null);
  };

  return (
    <>
      {success && <MessageAlert variant="success" message={success} onClose={() => setSuccess(null)} />}
      {error && (
        <MessageAlert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          action={() => {
            setError(null);
            fetchRequests();
          }}
          actionLabel="Try Again"
        />
      )}

      <Table
        title="Payment Requests"
        data={requests}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
        serverSideFiltering={true}
        hideDefaultActions={true}
        noDataMessage={NO_RECORD_FOUND}
      />

      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={handleCloseEnlargedImage}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <img src={enlargedImage} alt="Transaction Image" className="max-w-full max-h-screen" />
          </div>
          <button 
            onClick={handleCloseEnlargedImage}
            className="absolute top-4 right-4 text-white text-3xl bg-black/50 rounded-full p-2 hover:bg-black/70"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Approve Payment</h2>
            <p className="mb-2 text-gray-600">Business: <span className="font-semibold">{selectedRequest?.businessName}</span></p>
            <p className="mb-4 text-gray-600">Email: <span className="font-semibold">{selectedRequest?.vendorEmail}</span></p>
            <textarea
              value={approveReason}
              onChange={(e) => setApproveReason(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4 min-h-[100px]"
              placeholder="Remarks for approval..."
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setShowApproveModal(false); setApproveReason(''); }} 
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isApproving || !approveReason.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isApproving ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Reject Payment</h2>
            <p className="mb-2 text-gray-600">Business: <span className="font-semibold">{selectedRequest?.businessName}</span></p>
            <p className="mb-4 text-gray-600">Email: <span className="font-semibold">{selectedRequest?.vendorEmail}</span></p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4 min-h-[100px]"
              placeholder="Remarks for rejection..."
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }} 
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isRejecting || !rejectReason.trim()}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isRejecting ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}