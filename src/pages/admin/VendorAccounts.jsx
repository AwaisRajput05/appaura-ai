// src/pages/admin/VendorAccounts.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from "react-dom";
import axios from 'axios';
import { apiEndpoints } from '../../services/apiEndpoints';
import { getToken } from '../../services/tokenUtils';
import { useAuth } from '../../components/auth/hooks/useAuth';
import { MessageAlert } from '../../components/common/message/MessageAlert';
import { NO_RECORD_FOUND } from '../../components/constants/Messages';
import { FaEye, FaHandshake, FaTimes, FaImage, FaSpinner, FaFileImage, FaSearchPlus, FaSearchMinus, FaRedo } from 'react-icons/fa';
import HomeTable from '../../components/common/table/Table';
import Table from '../../components/common/table/admintable';
import HeaderWithSort from '../../components/common/table/components/TableHeaderWithSort';

const statusColors = {
  APPROVED: 'bg-green-100 text-green-700',
  BLOCKED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  EMAIL_VERIFIED: 'bg-green-100 text-green-700',
};

const HoverTooltip = ({ text, title = "Details" }) => {
  if (!text || text.trim() === "") return <span className="text-gray-400">—</span>;

  const [isOpen, setIsOpen] = useState(false);

  const words = text.trim().split(/\s+/);
  const preview = words.slice(0, 2).join(" ") + (words.length > 2 ? "..." : "");

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-blue-600 hover:underline cursor-help text-sm"
      >
        {preview}
      </span>

      {isOpen && createPortal(
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[999999] pointer-events-none">
          <div className="bg-white rounded-xl shadow-2xl p-6 border border-gray-300 max-w-2xl max-h-[80vh] overflow-y-auto pointer-events-auto">
            <h3 className="font-bold text-lg mb-4 text-center text-gray-800 border-b pb-3">
              {title}
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
              {text}
            </p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Zoomable Image Component
const ZoomableImage = ({ src, alt, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const imageRef = useRef(null);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="relative max-w-6xl max-h-screen w-full h-full flex flex-col">
        {/* Zoom Controls */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
            title="Zoom Out"
            disabled={scale <= 0.5}
          >
            <FaSearchMinus className="text-xl" />
          </button>
          <span className="text-white px-2 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
            title="Zoom In"
            disabled={scale >= 3}
          >
            <FaSearchPlus className="text-xl" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
            title="Rotate"
          >
            <FaRedo className="text-xl" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
            title="Reset"
          >
            <span className="text-sm">Reset</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors duration-200"
          title="Close"
        >
          <FaTimes className="text-2xl" />
        </button>

        {/* Image Container with Scroll */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-8">
          <div className="relative inline-block">
            <img
              ref={imageRef}
              src={src}
              alt={alt}
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-in-out',
                maxWidth: 'none',
              }}
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

let controller = null;
let timer = null;

export default function VendorAccounts() {
  const { user } = useAuth();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [approveReason, setApproveReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showRelationsModal, setShowRelationsModal] = useState(false);
  const [selectedRelations, setSelectedRelations] = useState([]);
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [enlargedImageAlt, setEnlargedImageAlt] = useState('');
  const [cnicLoading, setCnicLoading] = useState({
    front: false,
    back: false
  });
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [cnicImages, setCnicImages] = useState({
    front: null,
    back: null
  });
  const [licenseImage, setLicenseImage] = useState(null);

  // Refs to keep track of previous object URLs so we revoke them
  // only when they are replaced or on unmount. This prevents
  // accidentally revoking CNIC URLs when license image is reloaded.
  const prevCnicFrontRef = useRef(null);
  const prevCnicBackRef = useRef(null);
  const prevLicenseRef = useRef(null);

  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

  const [filters, setFilters] = useState({
    search: '',
  });

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

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const fetchVendors = async () => {
    if (controller) controller.abort();
    controller = new AbortController();

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

      const res = await axios.get(apiEndpoints.vendorsPaginated, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        signal: controller.signal,
      });

      const responseData = res.data;
      const vendorList = responseData.data || [];
      const paginateInfo = responseData.pagination || {};

      setVendors(vendorList);
      setPagination(prev => ({
        ...prev,
        total: paginateInfo.totalRecords || paginateInfo.total_records || 0,
      }));
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') return;
      console.error('Error fetching vendors:', err);
      setError(err.response?.data?.message || 'Failed to load vendors');
      setVendors([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      fetchVendors();
    }, 400);

    return () => clearTimeout(timer);
  }, [
    user,
    pagination.page,
    pagination.page_size,
    filters.search,
  ]);

  const handleFilterChange = useCallback((name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const fetchCnicImages = async (vendorId) => {
    setCnicLoading({ front: true, back: true });
    
    try {
      const token = getToken();
      const [front, back] = await Promise.all([
        axios.get(`${apiEndpoints.cnicFront}/${vendorId}`, {
          headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
          responseType: 'blob',
        }),
        axios.get(`${apiEndpoints.cnicBack}/${vendorId}`, {
          headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
          responseType: 'blob',
        }),
      ]);
      
      const frontUrl = URL.createObjectURL(front.data);
      const backUrl = URL.createObjectURL(back.data);
      
      setCnicImages({ front: frontUrl, back: backUrl });
      return { cnicFront: frontUrl, cnicBack: backUrl };
    } catch (err) {
      console.error('Failed to load CNIC images', err);
      setCnicImages({ front: null, back: null });
      return { cnicFront: null, cnicBack: null };
    } finally {
      setCnicLoading({ front: false, back: false });
    }
  };

  const fetchLicenseImage = async (vendorId) => {
    setLicenseLoading(true);
    
    try {
      const token = getToken();
      const response = await axios.get(`${apiEndpoints.license}/${vendorId}`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
        responseType: 'blob',
      });
      
      const licenseUrl = URL.createObjectURL(response.data);
      setLicenseImage(licenseUrl);
      return licenseUrl;
    } catch (err) {
      console.error('Failed to load license image', err);
      setLicenseImage(null);
      return null;
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleViewDetails = async (vendor) => {
    // Set the vendor to show in modal
    setSelectedVendor(vendor);
    
    // Start loading details
    setIsLoadingDetails(true);
    
    try {
      const token = getToken();
      
      // Fetch detailed vendor info
      const vendorRes = await axios.get(apiEndpoints.getVendorById(vendor.id), {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      const fullVendor = vendorRes.data.data;
      setSelectedVendor(prev => ({ ...prev, ...fullVendor }));
      
      // NOW OPEN THE MODAL - after vendor details are loaded
      setShowDetailsModal(true);
      
      // Start loading CNIC and License images in background after modal opens
      fetchCnicImages(vendor.id);
      fetchLicenseImage(vendor.id);
      
    } catch (err) {
      console.error('Error fetching vendor details:', err);
      setError(err.response?.data?.message || 'Failed to load vendor details');
      // Still open modal with basic data if detailed fetch fails
      setShowDetailsModal(true);
      fetchCnicImages(vendor.id);
      fetchLicenseImage(vendor.id);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleViewRelations = async (vendor) => {
    setSelectedMaster(vendor);
    setIsLoadingRelations(true);
    setSelectedRelations([]);
    try {
      const token = getToken();
      const res = await axios.get(apiEndpoints.getMasterVendorById(vendor.id), {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });
      setSelectedRelations(res.data.data || []);
    } catch (err) {
      console.error('Error fetching relations:', err);
    } finally {
      setIsLoadingRelations(false);
      setShowRelationsModal(true);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'businessName',
        header: ({ column }) => <HeaderWithSort column={column} title="Company Name" />,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.businessName || 'N/A'}</div>
            <div className="text-xs text-gray-500">{row.original.emailAddress || 'N/A'}</div>
          </div>
        ),
      },
      {
        accessorKey: 'city',
        header: ({ column }) => <HeaderWithSort column={column} title="City" />,
        cell: ({ row }) => row.original.city || 'N/A',
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <HeaderWithSort column={column} title="Status" />,
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                statusColors[status?.toUpperCase()] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {status || 'N/A'}
            </span>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <HeaderWithSort column={column} title="Created At" />,
        cell: ({ row }) => formatDateTimeLocal(row.original.createdAt),
      },
      {
        accessorKey: 'detail',
        header: 'Detail',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            onClick={() => handleViewDetails(row.original)}
            disabled={isLoadingDetails}
            className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
            title="View Details"
          >
            {isLoadingDetails && row.original.id === selectedVendor?.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : (
              <FaEye className="text-lg" />
            )}
          </button>
        ),
      },
      {
        accessorKey: 'relations',
        header: 'Relations',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            onClick={() => handleViewRelations(row.original)}
            disabled={isLoadingRelations}
            className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
            title="View Relations"
          >
            {isLoadingRelations && row.original.id === selectedMaster?.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : (
              <FaHandshake className="text-lg" />
            )}
          </button>
        ),
      },
      {
        accessorKey: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const vendor = row.original;
          return (
            <div className="flex items-center gap-2">
              {vendor.status !== 'APPROVED' && (
                <button
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setShowApproveModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium"
                >
                  Approve
                </button>
              )}
              {vendor.status !== 'BLOCKED' && (
                <button
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setShowBlockModal(true);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-medium"
                >
                  Block
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [isLoadingDetails, selectedVendor, isLoadingRelations, selectedMaster]
  );

  const handlePaginationChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, page, page_size: pageSize }));
  };

  const filterFields = useMemo(() => [
    {
      type: "text",
      name: "search",
      label: "Search",
      placeholder: "Search vendors...",
      value: filters.search,
      onChange: (e) => handleFilterChange("search", e.target.value),
    },
  ], [filters, handleFilterChange]);

  const handleApprove = async () => {
    if (!approveReason.trim()) return setError('Reason is required');
    setIsApproving(true);
    try {
      const token = getToken();
      await axios.patch(
        `${apiEndpoints.approveVendor(selectedVendor.id)}?status=APPROVED&reason=${encodeURIComponent(approveReason)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVendors(prev => prev.map(v => v.id === selectedVendor.id ? { ...v, status: 'APPROVED' } : v));
      setSuccess('Vendor approved successfully');
      setShowApproveModal(false);
      setApproveReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve vendor');
    } finally {
      setIsApproving(false);
    }
  };

  const handleBlock = async () => {
    if (!blockReason.trim()) return setError('Reason is required');
    setIsBlocking(true);
    try {
      const token = getToken();
      await axios.patch(
        `${apiEndpoints.blockVendor(selectedVendor.id)}?reason=${encodeURIComponent(blockReason)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVendors(prev => prev.map(v => v.id === selectedVendor.id ? { ...v, status: 'BLOCKED' } : v));
      setSuccess('Vendor blocked successfully');
      setShowBlockModal(false);
      setBlockReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to block vendor');
    } finally {
      setIsBlocking(false);
    }
  };

  const businessInfo = [
    { label: 'Business Name', value: selectedVendor?.businessName || 'N/A' },
    { label: 'Type', value: selectedVendor?.businessType || 'N/A' },
    { label: 'Description', value: selectedVendor?.businessDescription || 'N/A' },
    { label: 'Address', value: selectedVendor?.businessAddress || 'N/A' },
    { label: 'City', value: selectedVendor?.city || 'N/A' },
    { label: 'State', value: selectedVendor?.state || 'N/A' },
    { label: 'Zip', value: selectedVendor?.zip || 'N/A' },
    { label: 'Country', value: selectedVendor?.country || 'N/A' },
    { label: 'Organization Type', value: selectedVendor?.organizationType || 'N/A' },
  ];

  const licenseInfo = [
    { label: 'License Number', value: selectedVendor?.licenseNumber || 'N/A' },
    { label: 'License Expiry Date', value: formatDateOnly(selectedVendor?.licenseExpiryDate) },
  ];

  const contactInfo = [
    { label: 'Name', value: `${selectedVendor?.firstName || ''} ${selectedVendor?.lastName || ''}` },
    { label: 'Email', value: selectedVendor?.emailAddress || 'N/A' },
    { label: 'Phone', value: selectedVendor?.phoneNumber || 'N/A' },
  ];

  const additionalInfo = [
    { label: 'Role', value: selectedVendor?.role || 'N/A' },
    { label: 'Status', value: selectedVendor?.status || 'N/A' },
    { label: 'Is Master', value: selectedVendor?.isMaster ? 'Yes' : 'No' },
    { label: 'Branch ID', value: selectedVendor?.branchId || 'N/A' },
    { label: 'Branch Code', value: selectedVendor?.branchCode || 'N/A' },
    { label: 'Subscription Status', value: selectedVendor?.subscriptionStatus || 'N/A' },
    { label: 'Created At', value: formatDateTimeLocal(selectedVendor?.createdAt) },
    { label: 'Updated At', value: formatDateTimeLocal(selectedVendor?.updatedAt) },
  ];

  // Revoke previous CNIC object URLs when they change, and revoke on unmount
  useEffect(() => {
    if (prevCnicFrontRef.current && prevCnicFrontRef.current !== cnicImages.front) {
      try { URL.revokeObjectURL(prevCnicFrontRef.current); } catch (e) {}
    }
    if (prevCnicBackRef.current && prevCnicBackRef.current !== cnicImages.back) {
      try { URL.revokeObjectURL(prevCnicBackRef.current); } catch (e) {}
    }
    prevCnicFrontRef.current = cnicImages.front;
    prevCnicBackRef.current = cnicImages.back;

    return () => {
      if (prevCnicFrontRef.current) {
        try { URL.revokeObjectURL(prevCnicFrontRef.current); } catch (e) {}
      }
      if (prevCnicBackRef.current) {
        try { URL.revokeObjectURL(prevCnicBackRef.current); } catch (e) {}
      }
    };
  }, [cnicImages.front, cnicImages.back]);

  // Revoke previous license object URL when it changes, and revoke on unmount
  useEffect(() => {
    if (prevLicenseRef.current && prevLicenseRef.current !== licenseImage) {
      try { URL.revokeObjectURL(prevLicenseRef.current); } catch (e) {}
    }
    prevLicenseRef.current = licenseImage;
    return () => {
      if (prevLicenseRef.current) {
        try { URL.revokeObjectURL(prevLicenseRef.current); } catch (e) {}
      }
    };
  }, [licenseImage]);

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedVendor(null);
    // Clean up image URLs
    if (cnicImages.front) URL.revokeObjectURL(cnicImages.front);
    if (cnicImages.back) URL.revokeObjectURL(cnicImages.back);
    if (licenseImage) URL.revokeObjectURL(licenseImage);
    setCnicImages({ front: null, back: null });
    setLicenseImage(null);
    setCnicLoading({ front: false, back: false });
    setLicenseLoading(false);
  };

  const handleEnlargeImage = (imageUrl, altText) => {
    if (imageUrl) {
      // Stop event propagation to prevent any conflicts
      setEnlargedImage(imageUrl);
      setEnlargedImageAlt(altText || 'Enlarged Document');
    }
  };

  // Table columns for details sections
  const detailTableColumns = useMemo(() => [
    {
      accessorKey: 'field',
      header: 'Field',
      cell: ({ row }) => <span className="font-bold">{row.original.field}</span>
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => row.original.value
    }
  ], []);

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
            fetchVendors();
          }}
          actionLabel="Try Again"
        />
      )}

      <HomeTable
        title="Vendor Accounts"
        data={vendors}
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

 {showDetailsModal && selectedVendor && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={handleCloseDetailsModal}>
    <div className="max-w-5xl w-full bg-white shadow-2xl rounded-xl p-6 max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
      {/* Cross button at top right */}
      <button
        onClick={handleCloseDetailsModal}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 hover:bg-gray-100 transition-colors"
      >
        <FaTimes className="text-xl" />
      </button>

      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">Vendor Details - {selectedVendor.businessName}</h2>
      </div>

      <div className="space-y-6">
        {/* Business Information Table */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Business Information</h3>
          <Table
            title="Business Information"
            data={businessInfo.map((item, index) => ({
              id: index,
              field: item.label,
              value: item.value
            }))}
            columns={detailTableColumns}
            hideDefaultActions={true}
            showColumnVisibility={false}
            loading={false}
          />
        </div>

        {/* License Information Table */}
        <div>
          <h3 className="font-semibold text-lg mb-2">License Information</h3>
          <Table
            title="License Information"
            data={licenseInfo.map((item, index) => ({
              id: index,
              field: item.label,
              value: item.value
            }))}
            columns={detailTableColumns}
            hideDefaultActions={true}
            showColumnVisibility={false}
            loading={false}
          />
        </div>

        {/* Contact Information Table */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Contact Information</h3>
          <Table
            title="Contact Information"
            data={contactInfo.map((item, index) => ({
              id: index,
              field: item.label,
              value: item.value
            }))}
            columns={detailTableColumns}
            hideDefaultActions={true}
            showColumnVisibility={false}
            loading={false}
          />
        </div>

        {/* Additional Information Table */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Additional Information</h3>
          <Table
            title="Additional Information"
            data={additionalInfo.map((item, index) => ({
              id: index,
              field: item.label,
              value: item.value
            }))}
            columns={detailTableColumns}
            hideDefaultActions={true}
            showColumnVisibility={false}
            loading={false}
          />
        </div>

        {/* Application Roles */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Application Roles</h3>
          <div className="flex flex-wrap gap-2">
            {selectedVendor.applicationRoles?.map((role, index) => (
              <span key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                {role}
              </span>
            )) || 'N/A'}
          </div>
        </div>

        {/* Documents Section */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Documents</h3>
          
          {/* License Image */}
          <div className="mb-6">
            <strong className="block mb-2 text-md">Pharmacy License</strong>
            {licenseLoading ? (
              <div className="w-full h-28 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center">
                <FaSpinner className="animate-spin text-gray-400 text-2xl mb-2" />
                <p className="text-sm text-gray-500">Loading license image...</p>
              </div>
            ) : licenseImage ? (
              <div className="relative">
                <img 
                  src={licenseImage} 
                  alt="Pharmacy License" 
                  className="w-full h-40 object-contain rounded-lg cursor-pointer border border-gray-200 hover:opacity-80 transition-opacity" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEnlargeImage(licenseImage, 'Pharmacy License');
                  }}
                />
                <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                  Click to enlarge
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl w-full h-28 flex flex-col items-center justify-center">
                <FaFileImage className="text-gray-400 text-2xl mb-2" />
                <p className="text-sm text-gray-500">License image not available</p>
              </div>
            )}
          </div>

          {/* CNIC Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CNIC Front */}
            <div>
              <strong className="block mb-2">CNIC Front</strong>
              {cnicLoading.front ? (
                <div className="w-full h-28 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center">
                  <FaSpinner className="animate-spin text-gray-400 text-2xl mb-2" />
                  <p className="text-sm text-gray-500">Loading image...</p>
                </div>
              ) : cnicImages.front ? (
                <div className="relative">
                  <img 
                    src={cnicImages.front} 
                    alt="CNIC Front" 
                    className="w-full h-28 object-contain rounded-lg cursor-pointer border border-gray-200 hover:opacity-80 transition-opacity" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnlargeImage(cnicImages.front, 'CNIC Front');
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                    Click to enlarge
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl w-full h-28 flex flex-col items-center justify-center">
                  <FaImage className="text-gray-400 text-2xl mb-2" />
                  <p className="text-sm text-gray-500">Image not available</p>
                </div>
              )}
            </div>
            
            {/* CNIC Back */}
            <div>
              <strong className="block mb-2">CNIC Back</strong>
              {cnicLoading.back ? (
                <div className="w-full h-28 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center">
                  <FaSpinner className="animate-spin text-gray-400 text-2xl mb-2" />
                  <p className="text-sm text-gray-500">Loading image...</p>
                </div>
              ) : cnicImages.back ? (
                <div className="relative">
                  <img 
                    src={cnicImages.back} 
                    alt="CNIC Back" 
                    className="w-full h-28 object-contain rounded-lg cursor-pointer border border-gray-200 hover:opacity-80 transition-opacity" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnlargeImage(cnicImages.back, 'CNIC Back');
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                    Click to enlarge
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl w-full h-28 flex flex-col items-center justify-center">
                  <FaImage className="text-gray-400 text-2xl mb-2" />
                  <p className="text-sm text-gray-500">Image not available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={handleCloseDetailsModal}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
      {enlargedImage && (
        <ZoomableImage
          src={enlargedImage}
          alt={enlargedImageAlt}
          onClose={() => setEnlargedImage(null)}
        />
      )}

      {showRelationsModal && selectedMaster && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-white shadow-2xl rounded-xl p-8 max-h-screen overflow-y-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Related Branches for {selectedMaster.businessName}</h2>
              <p className="text-gray-600">Total Branches: {selectedRelations.length}</p>
            </div>

            {selectedRelations.length > 0 ? (
              <Table
                title="Related Branches"
                data={selectedRelations}
                columns={[
                  {
                    accessorKey: 'emailAddress',
                    header: 'Username',
                  },
                  {
                    accessorKey: 'branchId',
                    header: 'Branch ID',
                  },
                  {
                    accessorKey: 'branchCode',
                    header: 'Branch Code',
                  },
                  {
                    accessorKey: 'city',
                    header: 'City',
                  },
                  {
                    accessorKey: 'status',
                    header: 'Status',
                  },
                  {
                    accessorKey: 'createdAt',
                    header: 'Created At',
                    cell: ({ row }) => formatDateTimeLocal(row.original.createdAt),
                  },
                ]}
                hideDefaultActions={true}
                showColumnVisibility={false}
                loading={false}
              />
            ) : (
              <p className="text-center text-gray-500">No branches found.</p>
            )}

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setShowRelationsModal(false);
                  setSelectedRelations([]);
                  setSelectedMaster(null);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Approve Vendor</h2>
            <p className="mb-4 text-gray-600">Approve: {selectedVendor?.businessName}</p>
            <textarea
              value={approveReason}
              onChange={(e) => setApproveReason(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4 min-h-[100px]"
              placeholder="Reason for approval..."
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowApproveModal(false); setApproveReason(''); }} className="px-4 py-2 border rounded hover:bg-gray-50">
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

      {showBlockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Block Vendor</h2>
            <p className="mb-4 text-gray-600">Block: {selectedVendor?.businessName}</p>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4 min-h-[100px]"
              placeholder="Reason for blocking..."
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowBlockModal(false); setBlockReason(''); }} className="px-4 py-2 border rounded hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleBlock}
                disabled={isBlocking || !blockReason.trim()}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isBlocking ? 'Blocking...' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}