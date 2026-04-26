// companycurrent.jsx — Current Month Report with Vendor Tracking (Single File)
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import HomeTable from "../../components/common/table/Table";
import HeaderWithSort from "../../components/common/table/components/TableHeaderWithSort";
import { getToken } from "../../services/tokenUtils";
import apiService from "../../services/apiService";
import { apiEndpoints } from '../../services/apiEndpoints';
import { useAuth } from "../../components/auth/hooks/useAuth";
import {
  Eye, CreditCard, Upload, FileText, Download, Users, ArrowLeft, Info
} from 'lucide-react';
import Table from "../../components/common/table/admintable";
// Import UI components
import Button from "../../components/ui/forms/Button";
import InputText from "../../components/ui/forms/InputText";
import InputSelect from "../../components/ui/forms/InputSelect";
import InputTextarea from "../../components/ui/forms/InputTextarea";
import ButtonTooltip from "../../components/ui/forms/ButtonTooltip";
import Alert from "../../components/ui/feedback/Alert";
import Card from "../../components/ui/Card";
import Modal from '../../components/ui/Modal';

// Add this helper function
const formatDate = (dateString, showTime = false) => {
  if (!dateString) return "N/A";
  
  try {
    let date;
    
    if (typeof dateString === 'string') {
      // Format: "2026-07-12" (date only)
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      }
      // Format: "2026-04-15T05:55:53.000Z" (ISO)
      else if (dateString.includes('T')) {
        date = new Date(dateString);
      }
      // Format: "2026-04-15 05:55:53" (with space)
      else if (dateString.includes(' ') && !dateString.includes('T')) {
        const utcString = dateString.replace(' ', 'T') + 'Z';
        date = new Date(utcString);
      }
      // Fallback
      else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) return dateString;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    if (showTime) {
      const weekday = dayNames[date.getDay()];
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours === 0 ? 12 : hours;
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      return `${weekday}, ${month} ${day}, ${year}, ${timeStr}`;
    } else {
      return `${month} ${day}, ${year}`;
    }
  } catch (error) {
    console.error('Date formatting error:', error, 'for value:', dateString);
    return dateString;
  }
};

// Helper functions
const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

const getFormDataHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
});

const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.error) return error.response.data.error;
  if (error.message) return error.message;
  return "An unexpected error occurred";
};

// Replace these existing functions:
const formatDisplayDateTime = (dateString) => {
  if (!dateString) return "N/A";
  return formatDate(dateString, true);
};

const formatDisplayDate = (dateString) => {
  if (!dateString) return "N/A";
  return formatDate(dateString, false);
};
// Convert month number to month name
const getMonthName = (monthNumber) => {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return monthNames[monthNumber - 1] || "Invalid Month";
};

// HoverTooltip for long text fields
const HoverTooltip = ({ preview, full, title, className = "" }) => {
  const actualPreview = preview || (full ? full.substring(0, 30) + (full.length > 30 ? '...' : '') : '-');

  let content;
  if (full && full !== '-' && full !== actualPreview) {
    content = (
      <div className="p-3 sm:p-4">
        <p className="text-gray-900 whitespace-pre-wrap break-words text-sm sm:text-base">{full}</p>
      </div>
    );
  } else {
    return <span className={`text-gray-600 text-xs sm:text-sm ${className}`}>{actualPreview}</span>;
  }

  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef(null);

  const open = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const close = () => {
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={open}
        onMouseLeave={close}
        className={`text-blue-600 hover:underline cursor-help text-xs sm:text-sm ${className}`}
      >
        {actualPreview}
      </span>

      {isOpen && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-none p-4">
          <div
            onMouseEnter={open}
            onMouseLeave={close}
            className="bg-white rounded-xl shadow-2xl p-4 border border-gray-300 max-w-md max-h-[80vh] overflow-y-auto pointer-events-auto"
          >
            <h3 className="font-bold text-sm sm:text-md mb-2 text-center text-gray-800 border-b pb-2">
              {title}
            </h3>
            {content}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Vendor status options
const VENDOR_STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "EMAIL_VERIFIED", label: "Email Verified" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "EXPIRED", label: "Expired" },
  { value: "PAID_ACTIVE", label: "Paid Active" },
  { value: "FREE_ACTIVE", label: "Free Active" },
];

// Payment status options
const PAYMENT_STATUS_OPTIONS = [
  { value: "PAID", label: "Paid" },
  { value: "UNPAID", label: "Unpaid" },
];

// Sort options
const sortOptions = [
  { value: "DESC", label: "Newest First" },
  { value: "ASC", label: "Oldest First" },
];

// Detail View Modal - UPDATED title and label
const DetailViewModal = ({ isOpen, onClose, data, loading }) => {
  if (!isOpen) return null;

  const formatCurrency = (amount) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(amount || 0);

  const StatCard = ({ label, value, color }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-700',
      yellow: 'bg-yellow-50 text-yellow-700',
      green: 'bg-green-50 text-green-700',
      indigo: 'bg-indigo-50 text-indigo-700',
      red: 'bg-red-50 text-red-700',
      gray: 'bg-gray-50 text-gray-700',
      purple: 'bg-purple-50 text-purple-700',
      pink: 'bg-pink-50 text-pink-700',
      orange: 'bg-orange-50 text-orange-700',
      teal: 'bg-teal-50 text-teal-700',
      cyan: 'bg-cyan-50 text-cyan-700',
      emerald: 'bg-emerald-50 text-emerald-700',
    };

    return (
      <div className={`${colorClasses[color]} p-3 rounded-lg`}>
        <p className="text-xs">{label}</p>
        <p className="text-lg font-bold">{value || 0}</p>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Partner Details Report" size="lg" className="max-h-[90vh] overflow-y-auto">
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
        ) : data ? (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Changed from "Company" to "Partner Name" */}
              <div><p className="text-xs text-gray-500">Partner Name</p><p className="text-sm font-medium">{data.name}</p></div>
              <div><p className="text-xs text-gray-500">CRN</p><p className="text-sm font-medium">{data.crn}</p></div>
<div><p className="text-xs text-gray-500">Period</p><p className="text-sm font-medium">{getMonthName(data.month)} {data.year}</p></div>              <div><p className="text-xs text-gray-500">Payment</p><p className={`text-sm font-medium ${data.paymentStatus === 'PAID' ? 'text-green-600' : 'text-red-600'}`}>{data.paymentStatus}</p></div>
            </div>

            <div>
              <h4 className="font-bold text-sm text-gray-700 mb-3">User Statistics</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total Users" value={data.totalUsers} color="blue" />
                <StatCard label="Pending" value={data.totalPending} color="yellow" />
                <StatCard label="Email Verified" value={data.totalEmailVerified} color="green" />
                <StatCard label="Approved" value={data.totalApproved} color="indigo" />
                <StatCard label="Rejected" value={data.totalRejected} color="red" />
                <StatCard label="Blocked" value={data.totalBlocked} color="gray" />
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm text-gray-700 mb-3">Plan Statistics</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard label="Free Plan" value={data.totalFreePlanActive} color="purple" />
                <StatCard label="Paid Plan" value={data.totalPaidPlanActive} color="pink" />
                <StatCard label="Expired" value={data.totalSubscriptionExpired} color="orange" />
                <StatCard label="Free Activated" value={data.totalFreePlanActivatedInMonth} color="teal" />
                <StatCard label="Paid Activated" value={data.totalPaidPlanActivatedInMonth} color="cyan" />
                <StatCard label="Eligible Users" value={data.totalEligibleUser} color="emerald" />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-700">Payable Amount</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(data.payableAmount)}</p>
              </div>
            </div>

            {data.paymentDate && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Payment Date</p>
                <p className="text-sm">{formatDisplayDateTime(data.paymentDate)}</p>
              </div>
            )}

            {data.notes && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm">{data.notes}</p>
              </div>
            )}

            <div className="text-xs text-gray-400 text-right">
              Generated: {formatDisplayDateTime(data.generatedAt)}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No detailed data available</div>
        )}

        <div className="flex justify-end pt-6 border-t mt-6">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

// Vendor Details Modal - Same size as VendorAccounts.jsx
const VendorDetailsModal = ({ isOpen, onClose, vendorId }) => {
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && vendorId) {
      fetchVendorDetails();
    }
  }, [isOpen, vendorId]);

  const fetchVendorDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const headers = getAuthHeaders(token);
      
      const endpoint = apiEndpoints.getVendorById(vendorId);
      const { data } = await apiService.get(endpoint, { headers });
      
      setVendorData(data?.data || data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

// Replace these functions:
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return formatDisplayDate(dateString);
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return formatDisplayDateTime(dateString);
};

  const detailTableColumns = [
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
  ];

  const businessInfo = [
    { field: 'Business Name', value: vendorData?.businessName || 'N/A' },
    { field: 'Business Type', value: vendorData?.businessType || 'N/A' },
    { field: 'Business Description', value: vendorData?.businessDescription || 'N/A' },
    { field: 'Organization Type', value: vendorData?.organizationType || 'N/A' },
    { field: 'CRN', value: vendorData?.crn || 'N/A' },
  ];

  const contactInfo = [
    { field: 'Name', value: `${vendorData?.firstName || ''} ${vendorData?.lastName || ''}`.trim() || 'N/A' },
    { field: 'Email', value: vendorData?.emailAddress || 'N/A' },
    { field: 'Phone', value: vendorData?.phoneNumber || 'N/A' },
    { field: 'Address', value: vendorData?.businessAddress || 'N/A' },
    { field: 'City', value: vendorData?.city || 'N/A' },
    { field: 'State', value: vendorData?.state || 'N/A' },
    { field: 'Zip', value: vendorData?.zip || 'N/A' },
    { field: 'Country', value: vendorData?.country || 'N/A' },
  ];

  const licenseInfo = [
    { field: 'License Number', value: vendorData?.licenseNumber || 'N/A' },
    { field: 'License Expiry', value: vendorData?.licenseExpiryDate ? formatDate(vendorData.licenseExpiryDate) : 'N/A' },
  ];

  const systemInfo = [
    { field: 'Username', value: vendorData?.username || 'N/A' },
    { field: 'Role', value: vendorData?.role || 'N/A' },
    { field: 'Status', value: vendorData?.status || 'N/A' },
    { field: 'Subscription Status', value: vendorData?.subscriptionStatus || 'N/A' },
    { field: 'Branch ID', value: vendorData?.branchId || 'N/A' },
    { field: 'Is Master', value: vendorData?.isMaster ? 'Yes' : 'No' },
    { field: 'Created At', value: vendorData?.createdAt ? formatDateTime(vendorData.createdAt) : 'N/A' },
    { field: 'Updated At', value: vendorData?.updatedAt ? formatDateTime(vendorData.updatedAt) : 'N/A' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-5xl w-full bg-white shadow-2xl rounded-xl p-6 max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
        {/* Close button - Cross icon at top right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl bg-white rounded-full p-1 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold">Vendor Details - {vendorData?.businessName || 'Loading...'}</h2>
        </div>

        {error && <Alert variant="error" message={error} className="mb-4" onClose={() => setError(null)} />}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : vendorData ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Business Information</h3>
              <Table
                data={businessInfo.map((item, index) => ({ id: index, ...item }))}
                columns={detailTableColumns}
                hideDefaultActions={true}
                showColumnVisibility={false}
                loading={false}
              />
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Contact Information</h3>
              <Table
                data={contactInfo.map((item, index) => ({ id: index, ...item }))}
                columns={detailTableColumns}
                hideDefaultActions={true}
                showColumnVisibility={false}
                loading={false}
              />
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">License Information</h3>
              <Table
                data={licenseInfo.map((item, index) => ({ id: index, ...item }))}
                columns={detailTableColumns}
                hideDefaultActions={true}
                showColumnVisibility={false}
                loading={false}
              />
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">System Information</h3>
              <Table
                data={systemInfo.map((item, index) => ({ id: index, ...item }))}
                columns={detailTableColumns}
                hideDefaultActions={true}
                showColumnVisibility={false}
                loading={false}
              />
            </div>

            {vendorData.applicationRoles && vendorData.applicationRoles.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Application Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {vendorData.applicationRoles.map((role, index) => (
                    <span key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No vendor data found</div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
// Helper component for info items
const InfoItem = ({ label, value, isStatus = false, className = "" }) => {
  if (!value && value !== 0) return null;
  
  const getStatusColor = (status) => {
    const statusColors = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'BLOCKED': 'bg-red-100 text-red-800',
      'EXPIRED': 'bg-orange-100 text-orange-800',
      'PAID_ACTIVE': 'bg-purple-100 text-purple-800',
      'FREE_ACTIVE': 'bg-blue-100 text-blue-800',
      'EMAIL_VERIFIED': 'bg-indigo-100 text-indigo-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={className}>
      <p className="text-xs text-gray-500">{label}</p>
      {isStatus ? (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(value)}`}>
          {value || 'N/A'}
        </span>
      ) : (
        <p className="text-sm font-medium break-words">{value || 'N/A'}</p>
      )}
    </div>
  );
};

// Pay Modal Component
const PayModal = ({ isOpen, onClose, report, onPay }) => {
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a monthly slip');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('notes', notes);
    formData.append('monthlySlip', file);

    try {
      await onPay(report.id, formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to mark as paid');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark Report as Paid" size="md">
      <div className="p-4 sm:p-6">
        {error && <Alert variant="error" message={error} className="mb-4" onClose={() => setError(null)} />}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Slip (PDF/Image)</label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Choose File
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
              </label>
              {fileName && <span className="text-sm text-gray-600 truncate">{fileName}</span>}
            </div>
          </div>

          <InputTextarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" rows={3} />

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting} loadingText="Submitting..." className="w-full sm:w-auto">
              Mark as Paid
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default function CompanyCurrent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const fetchTimeoutRef = useRef(null);
  const controllerRef = useRef(null);
  const successTimeoutRef = useRef(null);

  // View state: 'reports' or 'vendors'
  const [view, setView] = useState('reports');
  
  // Reports view state
  const [reportsData, setReportsData] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportsPagination, setReportsPagination] = useState({ page: 1, page_size: 10, total: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("DESC");
  // NEW FILTERS
  const [paymentStatus, setPaymentStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Vendors view state
  const [vendorsData, setVendorsData] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [vendorsPagination, setVendorsPagination] = useState({ page: 1, page_size: 10, total: 0 });
  const [vendorStatus, setVendorStatus] = useState("");
  const [vendorParams, setVendorParams] = useState({ crn: '', year: '', month: '' });

  // Modals state
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [showVendorModal, setShowVendorModal] = useState(false);

  // Messages
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Auto-dismiss success messages
  useEffect(() => {
    if (successMessage) {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 5000);
    }
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, [successMessage]);

  // Fetch current month reports - UPDATED to include new filters
  const fetchReports = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      setLoadingReports(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setLoadingReports(false);
        return;
      }

      // Build base URL from endpoint (assuming it returns a string)
      let endpoint = apiEndpoints.currentMonthReport(
        "", // id - empty for list view
        searchTerm,
        sortBy,
        false, // detail=false
        reportsPagination.page,
        reportsPagination.page_size
      );

      // Append new filters as query parameters if they exist
      const url = new URL(endpoint, window.location.origin);
      if (paymentStatus) url.searchParams.append('paymentStatus', paymentStatus);
      if (startDate) url.searchParams.append('startDate', startDate);
      if (endDate) url.searchParams.append('endDate', endDate);

      const headers = getAuthHeaders(token);

      const { data: response } = await apiService.get(url.toString(), {
        headers,
        signal: controllerRef.current.signal,
        timeout: 30000,
      });

      const rawData = response?.data ?? [];
      const pag = response?.pagination ?? {};

      if (!Array.isArray(rawData)) {
        setReportsData([]);
        setReportsPagination((p) => ({ ...p, total: 0 }));
        return;
      }

      const mapped = rawData.map((item) => ({
        id: item.id,
        companyName: item.name || 'N/A',
        crn: item.crn || 'N/A',
        year: item.year,
        month: item.month,
        totalUsers: item.totalUsers || 0,
        totalEligibleUser: item.totalEligibleUser || 0,
        payableAmount: item.payableAmount || 0,
        paymentStatus: item.paymentStatus || 'UNPAID',
        generatedAt: item.generatedAt ? formatDisplayDateTime(item.generatedAt) : 'N/A',
      }));

      setReportsData(mapped);
      setReportsPagination((p) => ({
        ...p,
        total: pag.totalRecords ?? rawData.length ?? 0,
      }));
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(getErrorMessage(err) || 'Failed to fetch current month reports');
      setReportsData([]);
      setReportsPagination((p) => ({ ...p, total: 0 }));
    } finally {
      setLoadingReports(false);
    }
  }, [searchTerm, sortBy, paymentStatus, startDate, endDate, reportsPagination.page, reportsPagination.page_size]);

  // Fetch vendor tracking data
  const fetchVendors = useCallback(async () => {
    if (!vendorParams.crn) {
      setError('CRN is required');
      setLoadingVendors(false);
      return;
    }

    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      setLoadingVendors(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setLoadingVendors(false);
        return;
      }

      const endpoint = apiEndpoints.vendorTrackingData(
        vendorParams.crn,
        vendorParams.year,
        vendorParams.month,
        vendorStatus,
        vendorsPagination.page,
        vendorsPagination.page_size
      );

      const headers = getAuthHeaders(token);

      const { data: response } = await apiService.get(endpoint, {
        headers,
        signal: controllerRef.current.signal,
        timeout: 30000,
      });

      // Transform the data structure to array of vendor objects
      const vendorData = response?.data || {};
      
      // Create array of vendor objects from all the ID arrays
      const allVendors = [];
      
      // Map status to the arrays
      const statusMap = [
        { status: 'PENDING', items: vendorData.pendingVendorIds || [] },
        { status: 'EMAIL_VERIFIED', items: vendorData.emailVerifiedVendorIds || [] },
        { status: 'APPROVED', items: vendorData.approvedVendorIds || [] },
        { status: 'REJECTED', items: vendorData.rejectedVendorIds || [] },
        { status: 'BLOCKED', items: vendorData.blockedVendorIds || [] },
        { status: 'FREE_ACTIVE', items: vendorData.freePlanActiveVendorIds || [] },
        { status: 'PAID_ACTIVE', items: vendorData.paidPlanActiveVendorIds || [] },
        { status: 'EXPIRED', items: vendorData.expiredVendorIds || [] },
      ];

      statusMap.forEach(({ status, items }) => {
        items.forEach((item) => {
          // item is an object with { businessName, vendorId }
          allVendors.push({
            id: item.vendorId,
            vendorId: item.vendorId,
            businessName: item.businessName,
            status: status,
          });
        });
      });

      const pag = response?.pagination ?? {};

      setVendorsData(allVendors);
      setVendorsPagination((p) => ({
        ...p,
        total: pag.totalRecords ?? allVendors.length ?? 0,
      }));
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(getErrorMessage(err) || 'Failed to fetch vendor data');
      setVendorsData([]);
      setVendorsPagination((p) => ({ ...p, total: 0 }));
    } finally {
      setLoadingVendors(false);
    }
  }, [vendorParams, vendorStatus, vendorsPagination.page, vendorsPagination.page_size]);

  // Handle view details
  const handleViewDetails = useCallback(async (row) => {
    const report = row.original;
    
    try {
      setLoadingDetail(true);
      
      const token = getToken();
      const headers = getAuthHeaders(token);

      const endpoint = apiEndpoints.currentMonthReport(
        report.id,
        "",
        "DESC",
        true,
        1,
        1
      );

      const { data: response } = await apiService.get(endpoint, { headers });
      const detailedReport = response?.data?.[0] || null;
      
      setSelectedDetail(detailedReport);
      setShowDetailModal(true);
    } catch (err) {
      setError('Failed to load detailed report');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // Handle view vendors
  const handleViewVendors = useCallback((row) => {
    const report = row.original;
    setVendorParams({
      crn: report.crn,
      year: report.year,
      month: report.month
    });
    setVendorsPagination(p => ({ ...p, page: 1 }));
    setVendorStatus("");
    setView('vendors');
  }, []);

  // Handle view vendor details
  const handleViewVendorDetails = useCallback((vendorId) => {
    setSelectedVendorId(vendorId);
    setShowVendorModal(true);
  }, []);

  // Handle back to reports
  const handleBackToReports = useCallback(() => {
    setView('reports');
    setVendorsData([]);
    setVendorParams({ crn: '', year: '', month: '' });
  }, []);

  // Handle pay
  const handlePay = useCallback(async (id, formData) => {
    try {
      const token = getToken();
      const headers = getFormDataHeaders(token);

      await apiService.patch(apiEndpoints.markReportAsPaid(id), formData, { headers });

      setSuccessMessage('Report marked as paid successfully');
      if (view === 'reports') {
        fetchReports();
      }
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }, [fetchReports, view]);

  // Handle pay button click
  const handlePayClick = useCallback((row) => {
    setSelectedReport(row.original);
    setShowPayModal(true);
  }, []);

  // Handle view slip
  const handleViewSlip = useCallback(async (row) => {
    const report = row.original;
    try {
      const token = getToken();
      const headers = getAuthHeaders(token);
      const yearMonth = `${report.year}-${String(report.month).padStart(2, '0')}`;
      const url = apiEndpoints.togetslip(report.id, yearMonth);
      const response = await apiService.get(url, { headers, responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const fileUrl = window.URL.createObjectURL(blob);
      window.open(fileUrl, '_blank');
    } catch (err) {
      setError('Failed to load slip');
    }
  }, []);

  // Check if current month
  const isCurrentMonth = useCallback((year, month) => {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth() + 1;
  }, []);

  // Fetch reports on filter/pagination change
  useEffect(() => {
    if (view === 'reports') {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = setTimeout(fetchReports, 500);
    }
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [view, searchTerm, sortBy, paymentStatus, startDate, endDate, reportsPagination.page, reportsPagination.page_size, fetchReports]);

  // Fetch vendors when params change
  useEffect(() => {
    if (view === 'vendors' && vendorParams.crn) {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = setTimeout(fetchVendors, 500);
    }
  }, [view, vendorParams, vendorStatus, vendorsPagination.page, vendorsPagination.page_size, fetchVendors]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  // Reports filter fields - UPDATED with new filters
  const reportsFilterFields = useMemo(() => [
    {
      type: "search",
      name: "search",
      label: "Partner Name / CRN",
      placeholder: "Search by name or CRN...",
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      className: "w-full sm:w-64",
    },
     {
      type: "dateRange",                    // Date range in one line
      label: "Date",
      fromName: "startDate",
      toName: "endDate",
      value: { startDate, endDate },
      onChange: (e) => {
        if (e.target.name === "startDate") setStartDate(e.target.value);
        else if (e.target.name === "endDate") setEndDate(e.target.value);
      },
      className: "date-input-black w-full sm:w-64",
    },
    {
      type: "select",
      name: "paymentStatus",
      label: "Payment",
      value: paymentStatus,
      onChange: (e) => setPaymentStatus(e.target.value),
      options: PAYMENT_STATUS_OPTIONS,
      className: "w-full sm:w-36",
    },
   
    {
      type: "select",
      name: "sortBy",
      label: "Sort",
      value: sortBy,
      onChange: (e) => setSortBy(e.target.value),
      options: sortOptions,
      className: "w-full sm:w-32",
    },
  ], [searchTerm, paymentStatus, startDate, endDate, sortBy]);

  // Vendors filter fields
  const vendorsFilterFields = useMemo(() => [
    {
      type: "select",
      name: "status",
      label: "Vendor Status",
      value: vendorStatus,
      onChange: (e) => setVendorStatus(e.target.value),
      options: VENDOR_STATUS_OPTIONS,
      className: "w-full sm:w-48",
    },
  ], [vendorStatus]);

  // Reports columns - FIXED: Right-aligned headers with consistent width and proper disable
  const reportsColumns = useMemo(() => [
    {
      accessorKey: "companyName",
      header: ({ column }) => <HeaderWithSort column={column} title="Partner Name" />,
      cell: ({ row }) => <div className="font-medium text-gray-900 text-xs sm:text-sm">{row.original.companyName}</div>,
    },
    {
      accessorKey: "crn",
      header: "CRN",
      cell: ({ row }) => <div className="font-mono text-xs sm:text-sm">{row.original.crn}</div>,
    },
    {
      accessorKey: "year",
      header: "Year",
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.year}</div>,
    },
   {
  accessorKey: "month",
  header: "Month",
  cell: ({ row }) => <div className="text-xs sm:text-sm">{getMonthName(row.original.month)}</div>,
},
    {
      accessorKey: "totalUsers",
      header: () => <div className="text-right w-full">Total Users</div>,
      cell: ({ row }) => <div className="text-xs sm:text-sm text-right w-full">{row.original.totalUsers}</div>,
    },
    {
      accessorKey: "totalEligibleUser",
      header: () => <div className="text-right w-full">Eligible</div>,
      cell: ({ row }) => <div className="text-xs sm:text-sm text-right w-full">{row.original.totalEligibleUser}</div>,
    },
    {
      accessorKey: "payableAmount",
      header: () => <div className="text-right w-full">Payable</div>,
      cell: ({ row }) => {
        const amount = row.original.payableAmount;
        return (
          <div className="text-xs sm:text-sm text-right w-full font-medium text-green-600">
            {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => {
        const status = row.original.paymentStatus;
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
            status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "generatedAt",
      header: "Created",
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.generatedAt}</div>,
    },
    {
      accessorKey: "Actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const report = row.original;
        const isCurrent = isCurrentMonth(report.year, report.month);
        const isPaid = report.paymentStatus === 'PAID';
        const isUnpaid = report.paymentStatus === 'UNPAID';
        const hasNoUsers = report.totalUsers === 0;

        return (
          <div className="flex justify-center gap-2">
            {/* Eye icon disabled when there are no users */}
            <ButtonTooltip tooltipText={hasNoUsers ? "No users to view" : "View Details"} position="top">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleViewDetails(row)}
                disabled={hasNoUsers}
                className={`!p-1.5 !min-w-0 ${hasNoUsers ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </ButtonTooltip>

            {/* Users icon - disabled when no users */}
            <ButtonTooltip tooltipText={hasNoUsers ? "No users to view" : "View Vendors"} position="top">
              <Button
                variant="info"
                size="sm"
                onClick={() => handleViewVendors(row)}
                disabled={hasNoUsers}
                className={`!p-1.5 !min-w-0 ${hasNoUsers ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </ButtonTooltip>

            {isUnpaid && (
              <ButtonTooltip tooltipText={isCurrent ? "Cannot pay for this month" : "Mark Paid"} position="top">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handlePayClick(row)}
                  disabled={isCurrent}
                  className={`!p-1.5 !min-w-0 ${isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </ButtonTooltip>
            )}

            {isPaid && (
              <>
                <ButtonTooltip tooltipText="View Slip" position="top">
                  <Button variant="info" size="sm" onClick={() => handleViewSlip(row)} className="!p-1.5 !min-w-0">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </ButtonTooltip>
                <ButtonTooltip tooltipText="Download Slip" position="top">
                  <Button variant="secondary" size="sm" onClick={() => handleViewSlip(row)} className="!p-1.5 !min-w-0">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </ButtonTooltip>
              </>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
  ], [handleViewDetails, handleViewVendors, handlePayClick, handleViewSlip, isCurrentMonth]);

  // Vendors columns
  const vendorsColumns = useMemo(() => [
    {
      accessorKey: "businessName",
      header: "Business Name",
      cell: ({ row }) => <div className="font-medium text-gray-900 text-xs sm:text-sm">{row.original.businessName || 'N/A'}</div>,
    },
    {
      accessorKey: "vendorId",
      header: "Vendor ID",
      cell: ({ row }) => <div className="font-mono text-xs sm:text-sm text-gray-600">{row.original.vendorId}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let color = 'bg-gray-100 text-gray-800';
        if (status === 'APPROVED') color = 'bg-green-100 text-green-800';
        else if (status === 'PENDING') color = 'bg-yellow-100 text-yellow-800';
        else if (status === 'REJECTED') color = 'bg-red-100 text-red-800';
        else if (status === 'BLOCKED') color = 'bg-red-100 text-red-800';
        else if (status === 'PAID_ACTIVE') color = 'bg-purple-100 text-purple-800';
        else if (status === 'FREE_ACTIVE') color = 'bg-blue-100 text-blue-800';
        else if (status === 'EMAIL_VERIFIED') color = 'bg-indigo-100 text-indigo-800';
        else if (status === 'EXPIRED') color = 'bg-orange-100 text-orange-800';
        
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${color}`}>
            {status}
          </span>
        );
      }
    },
    {
      accessorKey: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <ButtonTooltip tooltipText="View Vendor Details" position="top">
            <Button
              variant="info"
              size="sm"
              onClick={() => handleViewVendorDetails(row.original.vendorId)}
              className="!p-1.5 !min-w-0"
            >
              <Info className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </ButtonTooltip>
        </div>
      ),
      enableSorting: false,
    },
  ], [handleViewVendorDetails]);

  return (
    <div className="relative">
      {/* Alerts */}
      {successMessage && (
        <Alert variant="success" message={successMessage} className="mb-4 mx-2 sm:mx-4" onClose={() => setSuccessMessage(null)} />
      )}
      {error && (
        <Alert variant="error" message={error} action={() => view === 'reports' ? fetchReports() : fetchVendors()} actionLabel="Retry" onClose={() => setError(null)} className="mb-4 mx-2 sm:mx-4" />
      )}

      {/* Header with back button for vendors view */}
      {view === 'vendors' && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-2 sm:px-4">
          <Button variant="secondary" onClick={handleBackToReports} className="inline-flex items-center gap-2 w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Reports</span>
          </Button>
        </div>
      )}

      {/* Main Header Card */}
      <Card className="mb-6 mx-2 sm:mx-4" bodyClassName="p-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl font-bold text-gray-800">
              {view === 'reports' ? 'Current Partner Activity' : 'Vendor Tracking'}
            </span>
            {view === 'vendors' && vendorParams.crn && (
              <div className="text-sm text-gray-600 mt-1">
                <span className="font-semibold">CRN:</span> {vendorParams.crn} | 
<span className="font-semibold ml-2">Period:</span> {getMonthName(vendorParams.month)} {vendorParams.year}              </div>
            )}
          </div>
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={view === 'reports' ? fetchReports : fetchVendors}
              loading={view === 'reports' ? loadingReports : loadingVendors}
              loadingText="Refreshing..."
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base px-4 py-2"
            >
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Reports Table */}
      {view === 'reports' && (
        <HomeTable
          data={reportsData}
          columns={reportsColumns}
          loading={loadingReports}
          pagination={reportsPagination}
          onPaginationChange={(page, size) => setReportsPagination(p => ({ ...p, page, page_size: size }))}
          filterFields={reportsFilterFields}
          onFilterChange={(name, value) => {
            if (name === "search") setSearchTerm(value);
            else if (name === "paymentStatus") setPaymentStatus(value);
            else if (name === "startDate") setStartDate(value);
            else if (name === "endDate") setEndDate(value);
            else if (name === "sortBy") setSortBy(value);
            setReportsPagination(p => ({ ...p, page: 1 }));
          }}
          serverSideFiltering={true}
          error={error}
          onRetry={fetchReports}
          hideDefaultActions
          noDataMessage="No current month reports found"
        />
      )}

      {/* Vendors Table */}
      {view === 'vendors' && (
        <HomeTable
          data={vendorsData}
          columns={vendorsColumns}
          loading={loadingVendors}
          pagination={vendorsPagination}
          onPaginationChange={(page, size) => setVendorsPagination(p => ({ ...p, page, page_size: size }))}
          filterFields={vendorsFilterFields}
          onFilterChange={(name, value) => {
            if (name === "status") setVendorStatus(value);
            setVendorsPagination(p => ({ ...p, page: 1 }));
          }}
          serverSideFiltering={true}
          error={error}
          onRetry={fetchVendors}
          hideDefaultActions
          noDataMessage="No vendors found for this period"
        />
      )}

      {/* Detail View Modal */}
      <DetailViewModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDetail(null);
        }}
        data={selectedDetail}
        loading={loadingDetail}
      />

      {/* Pay Modal */}
      <PayModal
        isOpen={showPayModal}
        onClose={() => {
          setShowPayModal(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        onPay={handlePay}
      />

      {/* Vendor Details Modal */}
      <VendorDetailsModal
        isOpen={showVendorModal}
        onClose={() => {
          setShowVendorModal(false);
          setSelectedVendorId(null);
        }}
        vendorId={selectedVendorId}
      />
    </div>
  );
}