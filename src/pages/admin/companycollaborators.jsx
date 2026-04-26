//companycollaborators.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import HomeTable from "../../components/common/table/Table";
import HeaderWithSort from "../../components/common/table/components/TableHeaderWithSort";
import { getToken } from "../../services/tokenUtils";
import apiService from "../../services/apiService";
import { apiEndpoints } from '../../services/apiEndpoints';
import { useAuth } from "../../components/auth/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { 
  Eye, Pencil, Plus, X, Search, Mail, CheckCircle, XCircle, Users
} from 'lucide-react';

// Import UI components
import Button from "../../components/ui/forms/Button";
import InputText from "../../components/ui/forms/InputText";
import InputSelect from "../../components/ui/forms/InputSelect";
import InputTextarea from "../../components/ui/forms/InputTextarea";
import InputPhone from "../../components/ui/forms/InputPhone";
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
    
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    if (showTime) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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

// Partner Status Options
const PARTNER_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

// Partner Type Options
const PARTNER_TYPE_OPTIONS = [
  { value: "COMPANY", label: "Company" },
  { value: "INDIVIDUAL", label: "Individual" },
];

// Commission Types
const COMMISSION_TYPES = [
  { value: "PERCENTAGE", label: "Percentage (%)" },
  { value: "FIXED_AMOUNT", label: "Fixed Amount (PKR)" },
];

// Commission Applies On Options
const COMMISSION_APPLIES_ON = [
  { value: "ALL_USERS", label: "All Users" },
  { value: "PAID_ONLY", label: "Paid Users Only" },
];

// Helper functions
const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

const getUserInfo = (user) => ({
  userId: user?.id,
  userEmail: user?.email,
  userName: user?.name,
  userRole: user?.role,
});

const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};

// Replace these existing functions:
const formatDisplayDate = (dateString) => {
  if (!dateString) return "N/A";
  return formatDate(dateString, false);
};

const formatDisplayDateTime = (dateString) => {
  if (!dateString) return "N/A";
  return formatDate(dateString, true);
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone) => {
  const re = /^[0-9+\-\s()]{10,15}$/;
  return re.test(phone);
};

// NEW: Filter function to only allow letters and spaces
const filterPartnerName = (value) => {
  // Remove any character that is NOT a letter (A-Z, a-z) or space
  return value.replace(/[^A-Za-z\s]/g, '');
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

// User Statistics Popup Modal
const UserStatsModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${data?.companyName || 'Partner'} - User Statistics`}
      size="lg"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="p-4 sm:p-6">
        <div className="space-y-6">
          {/* Partner Info Header */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Partner Name</p>
                <p className="text-sm font-medium">{data?.companyName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">CRN</p>
                <p className="text-sm font-medium">{data?.crn}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Period</p>
                <p className="text-sm font-medium">{data?.month}/{data?.year}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Status</p>
                <p className={`text-sm font-medium ${
                  data?.paymentStatus === 'PAID' ? 'text-green-600' : 
                  data?.paymentStatus === 'UNPAID' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {data?.paymentStatus || 'UNPAID'}
                </p>
              </div>
            </div>
          </div>

          {/* User Statistics Grid */}
          <div>
            <h4 className="font-bold text-sm text-gray-700 mb-3">User Statistics</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-600">Total Users</p>
                <p className="text-lg font-bold text-blue-700">{data?.totalUsers || 0}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-yellow-600">Pending</p>
                <p className="text-lg font-bold text-yellow-700">{data?.totalPending || 0}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-600">Email Verified</p>
                <p className="text-lg font-bold text-green-700">{data?.totalEmailVerified || 0}</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg">
                <p className="text-xs text-indigo-600">Approved</p>
                <p className="text-lg font-bold text-indigo-700">{data?.totalApproved || 0}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-xs text-red-600">Rejected</p>
                <p className="text-lg font-bold text-red-700">{data?.totalRejected || 0}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Blocked</p>
                <p className="text-lg font-bold text-gray-700">{data?.totalBlocked || 0}</p>
              </div>
            </div>
          </div>

          {/* Plan Statistics Grid */}
          <div>
            <h4 className="font-bold text-sm text-gray-700 mb-3">Plan Statistics</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-xs text-purple-600">Free Plan</p>
                <p className="text-lg font-bold text-purple-700">{data?.totalFreePlanActive || 0}</p>
              </div>
              <div className="bg-pink-50 p-3 rounded-lg">
                <p className="text-xs text-pink-600">Paid Plan</p>
                <p className="text-lg font-bold text-pink-700">{data?.totalPaidPlanActive || 0}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-xs text-orange-600">Expired</p>
                <p className="text-lg font-bold text-orange-700">{data?.totalSubscriptionExpired || 0}</p>
              </div>
              <div className="bg-teal-50 p-3 rounded-lg">
                <p className="text-xs text-teal-600">Free Activated</p>
                <p className="text-lg font-bold text-teal-700">{data?.totalFreePlanActivatedInMonth || 0}</p>
              </div>
              <div className="bg-cyan-50 p-3 rounded-lg">
                <p className="text-xs text-cyan-600">Paid Activated</p>
                <p className="text-lg font-bold text-cyan-700">{data?.totalPaidPlanActivatedInMonth || 0}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg">
                <p className="text-xs text-emerald-600">Eligible Users</p>
                <p className="text-lg font-bold text-emerald-700">{data?.totalEligibleUser || 0}</p>
              </div>
            </div>
          </div>

          {/* Payable Amount */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-700">Payable Amount</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(data?.payableAmount)}</p>
            </div>
          </div>

          {/* Notes */}
          {data?.notes && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm">{data.notes}</p>
            </div>
          )}

          {/* Generated At */}
          <div className="text-xs text-gray-400 text-right">
            Generated: {formatDisplayDateTime(data?.generatedAt)}
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="w-full sm:w-auto text-sm sm:text-base py-2 px-6"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Status Update Modal - UPDATED with better status messages
const StatusUpdateModal = ({ isOpen, onClose, company, onUpdate }) => {
  const [status, setStatus] = useState(company?.status || 'ACTIVE');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (company) {
      setStatus(company.status || 'ACTIVE');
      setNotes('');
      setError(null);
    }
  }, [company]);

  const handleSubmit = async () => {
    if (!notes.trim()) {
      setError('Notes are required for status update');
      return;
    }

    // Check if status hasn't changed - show user-friendly message
    if (status === company.status) {
      // Show a more user-friendly message based on the status
      const statusMessage = status === 'ACTIVE' 
        ? 'Partner is already activated' 
        : 'Partner is already inactive';
      setError(statusMessage);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onUpdate(company.id, status, notes);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Status - ${company?.companyName}`}
      size="md"
    >
      <div className="p-4 sm:p-6">
        {error && (
          <div className="mb-4">
            <Alert variant="error" message={error} onClose={() => setError(null)} />
          </div>
        )}

        <div className="space-y-4">
          <InputSelect
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={PARTNER_STATUS_OPTIONS}
            required
          />

          <InputTextarea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter reason for status change..."
            rows={3}
            required
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText="Updating..."
            className="w-full sm:w-auto"
          >
            Update Status
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default function CompanyDetails() {
  const { user } = useAuth();
  const location = useLocation();

  const fetchTimeoutRef = useRef(null);
  const controllerRef = useRef(null);
  const successTimeoutRef = useRef(null);
  const actionSuccessTimeoutRef = useRef(null);
  const modalSuccessTimeoutRef = useRef(null);
  const modalErrorTimeoutRef = useRef(null);

  const [summaryData, setSummaryData] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyStatus, setCompanyStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // User stats modal state
  const [selectedStats, setSelectedStats] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(null);
  const [modalError, setModalError] = useState(null);

  // Form validation errors - expanded for all required fields
  const [formErrors, setFormErrors] = useState({
    companyName: "",
    email: "",
    phone: "",
    address: "",
    commissionValue: ""
  });

  const [formData, setFormData] = useState({
    id: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    partnerType: "COMPANY",
    commissionType: "PERCENTAGE",
    commissionValue: "0",          // Default value set to "0"
    commissionAppliesOn: "ALL_USERS",
    notes: ""
  });

  const [paginationSummary, setPaginationSummary] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

  const userInfo = useMemo(() => getUserInfo(user), [user]);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      
      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage(null);
        successTimeoutRef.current = null;
      }, 15000);
    }

    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, [successMessage]);

  // Auto-dismiss action success messages after 5 seconds
  useEffect(() => {
    if (actionSuccessMessage) {
      if (actionSuccessTimeoutRef.current) {
        clearTimeout(actionSuccessTimeoutRef.current);
      }
      
      actionSuccessTimeoutRef.current = setTimeout(() => {
        setActionSuccessMessage(null);
        actionSuccessTimeoutRef.current = null;
      }, 15000);
    }

    return () => {
      if (actionSuccessTimeoutRef.current) {
        clearTimeout(actionSuccessTimeoutRef.current);
      }
    };
  }, [actionSuccessMessage]);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (modalSuccess) {
      if (modalSuccessTimeoutRef.current) {
        clearTimeout(modalSuccessTimeoutRef.current);
      }
      modalSuccessTimeoutRef.current = setTimeout(() => {
        setModalSuccess(null);
        modalSuccessTimeoutRef.current = null;
      }, 15000);
    }

    if (modalError) {
      if (modalErrorTimeoutRef.current) {
        clearTimeout(modalErrorTimeoutRef.current);
      }
      modalErrorTimeoutRef.current = setTimeout(() => {
        setModalError(null);
        modalErrorTimeoutRef.current = null;
      }, 15000);
    }

    return () => {
      if (modalSuccessTimeoutRef.current) {
        clearTimeout(modalSuccessTimeoutRef.current);
      }
      if (modalErrorTimeoutRef.current) {
        clearTimeout(modalErrorTimeoutRef.current);
      }
    };
  }, [modalSuccess, modalError]);

  const resetForm = useCallback(() => {
    setFormData({
      id: "",
      companyName: "",
      email: "",
      phone: "",
      address: "",
      partnerType: "COMPANY",
      commissionType: "PERCENTAGE",
      commissionValue: "0",               // Default value
      commissionAppliesOn: "ALL_USERS",
      notes: ""
    });
    setFormErrors({
      companyName: "",
      email: "",
      phone: "",
      address: "",
      commissionValue: ""
    });
  }, []);

  const clearModalMessages = useCallback(() => {
    setModalSuccess(null);
    setModalError(null);
  }, []);

  // Enhanced validateForm to check all required fields including partner name
  const validateForm = useCallback(() => {
    const errors = {
      companyName: "",
      email: "",
      phone: "",
      address: "",
      commissionValue: ""
    };
    let isValid = true;

    // Partner Name validation (only letters and spaces)
    if (!formData.companyName?.trim()) {
      errors.companyName = "Partner name is required";
      isValid = false;
    }

    // Email validation
    if (!formData.email?.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Phone validation
    if (!formData.phone?.trim()) {
      errors.phone = "Phone number is required";
      isValid = false;
    } else if (!validatePhone(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
      isValid = false;
    }

    // Address validation
    if (!formData.address?.trim()) {
      errors.address = "Address is required";
      isValid = false;
    }

    // Commission value validation
    if (!formData.commissionValue) {
      errors.commissionValue = "Commission value is required";
      isValid = false;
    } else {
      const val = parseFloat(formData.commissionValue);
      if (isNaN(val) || val <= 0) {
        errors.commissionValue = "Commission value must be a positive number";
        isValid = false;
      } else if (!Number.isInteger(val)) {
        errors.commissionValue = "Commission value must be an integer";
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  }, [formData]);

  const fetchSummary = useCallback(async () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();

    try {
      setLoadingSummary(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setLoadingSummary(false);
        return;
      }

      const endpoint = apiEndpoints.getAllCompanies(
        searchTerm,
        companyStatus,
        startDate,
        endDate,
        paginationSummary.page,
        paginationSummary.page_size
      );
      
      const headers = getAuthHeaders(token);

      const { data } = await apiService.get(endpoint, { 
        headers, 
        signal: controllerRef.current.signal,
        timeout: 30000 
      });

      const rawData = data?.data ?? [];
      const pag = data?.pagination ?? {};

      if (!Array.isArray(rawData)) {
        setSummaryData([]);
        setPaginationSummary(p => ({ ...p, total: 0 }));
        return;
      }

      // Include notes in mapping
      const mapped = rawData.map((company) => ({
        id: company.id,
        companyName: company.name || 'N/A',
        email: company.email || 'N/A',
        phone: company.phone || 'N/A',
        address: company.address || 'N/A',
        referralCode: company.referralCode || 'N/A',
        partnerType: company.partnerType || 'COMPANY',
        commissionType: company.commissionType || 'PERCENTAGE',
        commissionValue: company.commissionValue || 0,
        status: company.status || 'INACTIVE',
        createdAt: company.createdAt ? formatDisplayDate(company.createdAt) : 'N/A',
        notes: company.notes || '-',                  // Notes field added
      }));

      setSummaryData(mapped);
      setPaginationSummary(p => ({
        ...p,
        total: pag.totalRecords ?? rawData.length ?? 0,
      }));
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(getErrorMessage(err) || 'Failed to fetch partners');
      setSummaryData([]);
      setPaginationSummary(p => ({ ...p, total: 0 }));
    } finally {
      setLoadingSummary(false);
    }
  }, [searchTerm, companyStatus, startDate, endDate, paginationSummary.page, paginationSummary.page_size]);

  // Handle Users icon click - show stats modal
  const handleShowStats = useCallback((row) => {
    setSelectedStats(row.original);
    setShowStatsModal(true);
  }, []);

  // Create Partner
  const handleCreateCompany = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    clearModalMessages();

    try {
      const token = getToken();
      const headers = getAuthHeaders(token);

      const payload = {
        name: formData.companyName.trim(), // trim the name before sending
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        partnerType: formData.partnerType,
        commissionType: formData.commissionType,
        commissionValue: parseInt(formData.commissionValue, 10), // ensure integer
        commissionAppliesOn: formData.commissionAppliesOn
        // Notes not included as per API
      };

      await apiService.post(
        apiEndpoints.saveOrUpdateCompany,
        payload,
        { headers }
      );

      setModalSuccess('Partner created successfully');
      setTimeout(() => {
        setShowCreateModal(false);
        resetForm();
        fetchSummary();
      }, 1500);
    } catch (err) {
      setModalSuccess(null);
      setModalError(getErrorMessage(err) || 'Failed to create partner');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, resetForm, fetchSummary, clearModalMessages, validateForm]);

  // Edit Partner
  const handleEditCompanyClick = useCallback((company) => {
    setEditingCompany(company);
    setFormData({
      id: company.id || "",
      companyName: company.companyName || "",
      email: company.email || "",
      phone: company.phone || "",
      address: company.address || "",
      partnerType: company.partnerType || "COMPANY",
      commissionType: company.commissionType || "PERCENTAGE",
      commissionValue: company.commissionValue?.toString() || "0",   // default to "0" if missing
      commissionAppliesOn: "ALL_USERS",
      notes: company.notes || ""
    });
    setFormErrors({
      companyName: "",
      email: "",
      phone: "",
      address: "",
      commissionValue: ""
    });
    setShowEditModal(true);
    clearModalMessages();
  }, [clearModalMessages]);

  const handleEditCompany = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    clearModalMessages();

    try {
      const token = getToken();
      const headers = getAuthHeaders(token);

      const payload = {
        id: formData.id,
        name: formData.companyName.trim(), // trim the name before sending
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        partnerType: formData.partnerType,
        commissionType: formData.commissionType,
        commissionValue: parseInt(formData.commissionValue, 10),
        commissionAppliesOn: formData.commissionAppliesOn
      };

      await apiService.post(
        apiEndpoints.saveOrUpdateCompany,
        payload,
        { headers }
      );

      setModalSuccess('Partner updated successfully');
      setTimeout(() => {
        setShowEditModal(false);
        setEditingCompany(null);
        resetForm();
        fetchSummary();
      }, 1500);
    } catch (err) {
      setModalSuccess(null);
      setModalError(getErrorMessage(err) || 'Failed to update partner');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, resetForm, fetchSummary, clearModalMessages, validateForm]);

  // Update Partner Status
  const handleUpdateStatus = useCallback(async (id, companyStatus, notes) => {
    try {
      const token = getToken();
      const headers = getAuthHeaders(token);

      const endpoint = apiEndpoints.updateCompanyStatus(id, companyStatus, notes);

      await apiService.patch(endpoint, null, { headers });

      setActionSuccessMessage(`Partner status updated to ${companyStatus}`);
      fetchSummary();
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }, [fetchSummary]);

  // Send Referral Code
  const handleSendReferralCode = useCallback(async (id) => {
    try {
      const token = getToken();
      const headers = getAuthHeaders(token);

      const endpoint = apiEndpoints.sendReferralCode(id);

      await apiService.post(endpoint, null, { headers });

      setActionSuccessMessage('Referral code sent successfully');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  // Handlers for email and phone changes with live validation
  const handleEmailChange = useCallback((e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, email: value }));
    
    if (!value) {
      setFormErrors(prev => ({ ...prev, email: "Email is required" }));
    } else if (!validateEmail(value)) {
      setFormErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
    } else {
      setFormErrors(prev => ({ ...prev, email: "" }));
    }
  }, []);

  const handlePhoneChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, phone: value }));
    
    if (!value) {
      setFormErrors(prev => ({ ...prev, phone: "Phone number is required" }));
    } else if (!validatePhone(value)) {
      setFormErrors(prev => ({ ...prev, phone: "Please enter a valid phone number" }));
    } else {
      setFormErrors(prev => ({ ...prev, phone: "" }));
    }
  }, []);

  // Commission value handler with integer validation
  const handleCommissionValueChange = useCallback((e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, commissionValue: value }));

    if (!value) {
      setFormErrors(prev => ({ ...prev, commissionValue: "Commission value is required" }));
    } else {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        setFormErrors(prev => ({ ...prev, commissionValue: "Commission value must be a positive number" }));
      } else if (!Number.isInteger(num)) {
        setFormErrors(prev => ({ ...prev, commissionValue: "Commission value must be an integer" }));
      } else {
        setFormErrors(prev => ({ ...prev, commissionValue: "" }));
      }
    }
  }, []);

  // NEW: Live filter for partner name - BLOCKS numbers and special characters as you type
  const handlePartnerNameChange = useCallback((e) => {
    const rawValue = e.target.value;
    const filteredValue = filterPartnerName(rawValue);
    
    setFormData(prev => ({ ...prev, companyName: filteredValue }));
    
    if (!filteredValue.trim()) {
      setFormErrors(prev => ({ ...prev, companyName: "Partner name is required" }));
    } else {
      setFormErrors(prev => ({ ...prev, companyName: "" }));
    }
  }, []);

  // Fetch summary on filter/pagination change
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      fetchSummary();
    }, 500);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [searchTerm, companyStatus, startDate, endDate, paginationSummary.page, paginationSummary.page_size, fetchSummary]);

  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      if (actionSuccessTimeoutRef.current) {
        clearTimeout(actionSuccessTimeoutRef.current);
      }
      if (modalSuccessTimeoutRef.current) {
        clearTimeout(modalSuccessTimeoutRef.current);
      }
      if (modalErrorTimeoutRef.current) {
        clearTimeout(modalErrorTimeoutRef.current);
      }
    };
  }, []);

  const handleFilterChange = useCallback((name, value) => {
    if (name === "search") {
      setSearchTerm(value);
    } else if (name === "companyStatus") {
      setCompanyStatus(value);
    } else if (name === "startDate") {
      setStartDate(value);
    } else if (name === "endDate") {
      setEndDate(value);
    }
    setPaginationSummary(p => ({ ...p, page: 1 }));
  }, []);

  const handlePaginationSummary = useCallback((page, pageSize) => {
    setPaginationSummary(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchSummary();
  }, [fetchSummary]);

  const handlePageRefresh = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Filter fields for summary view - UPDATED to use dateRange type like DateRange.jsx
const summaryFilterFields = useMemo(() => [
  {
    type: "search",
    name: "search",
    label: "Search",
    placeholder: "Search partners...",
    value: searchTerm,
    onChange: (e) => handleFilterChange("search", e.target.value),
    className: "w-full sm:w-64"
  },
   {
    type: "dateRange",                    // Changed from separate date fields to dateRange
    label: "Date Range",
    fromName: "startDate",                 // Match your state variable names
    toName: "endDate",
    value: { startDate: startDate, endDate: endDate },
    onChange: (e) => handleFilterChange(e.target.name, e.target.value),
    className: "date-input-black w-full sm:w-64"
  },
  {
    type: "select",
    name: "companyStatus",
    label: "Status",
    value: companyStatus,
    onChange: (e) => handleFilterChange("companyStatus", e.target.value),
    options: [
      ...PARTNER_STATUS_OPTIONS
    ],
    className: "w-full sm:w-40"
  },
 
], [searchTerm, companyStatus, startDate, endDate, handleFilterChange]);

  // Summary columns - Added Notes column and ensured Actions header
  const summaryColumns = useMemo(() => [
    {
      accessorKey: "companyName",
      header: ({ column }) => <HeaderWithSort column={column} title="Partner Name" />,
      cell: ({ row }) => <div className="font-medium text-gray-900 text-xs sm:text-sm">{row.original.companyName}</div>,
    },
    {
      accessorKey: "partnerType",
      header: "Partner Type",
      cell: ({ row }) => {
        const type = row.original.partnerType;
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
            type === 'COMPANY' 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {type}
          </span>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.email}</div>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.phone}</div>,
    },
    {
      accessorKey: "referralCode",
      header: "Referral Code",
      cell: ({ row }) => <div className="text-xs sm:text-sm font-mono">{row.original.referralCode}</div>,
    },
    {
      accessorKey: "commissionType",
      header: "Commission Type",
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.commissionType}</div>,
    },
{
  accessorKey: "commissionValue",
  header: "Commission",
  cell: ({ row }) => {
    const value = row.original.commissionValue;
    const type = row.original.commissionType;
    return (
      <div className="text-xs sm:text-sm">
        {value}{type === 'PERCENTAGE' ? '%' : ' PKR'}
      </div>
    );
  }
},
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const notes = row.original.notes;
        return (
          <HoverTooltip 
            preview={notes && notes.length > 20 ? notes.substring(0, 20) + '...' : notes} 
            full={notes} 
            title="Notes"
            className="text-xs sm:text-sm"
          />
        );
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
            status === 'ACTIVE' 
              ? 'bg-green-100 text-green-800' 
              : status === 'INACTIVE'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
          }`}>
            {status}
          </span>
        );
      }
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.createdAt}</div>,
    },
    {
      accessorKey: "Actions",
      header: () => <div className="text-center">Actions</div>,  // Explicit "Actions"
      cell: ({ row }) => {
        const company = row.original;
        return (
          <div className="flex justify-center gap-2">
            <ButtonTooltip tooltipText="Edit Partner" position="top">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleEditCompanyClick(company)}
                className="!p-1.5 !min-w-0"
              >
                <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </ButtonTooltip>
            
            <ButtonTooltip tooltipText="Update Status" position="top">
              <Button
                variant="warning"
                size="sm"
                onClick={() => {
                  setEditingCompany(company);
                  setShowStatusModal(true);
                }}
                className="!p-1.5 !min-w-0"
              >
                {company.status === 'ACTIVE' ? 
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4" /> : 
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                }
              </Button>
            </ButtonTooltip>
            
            <ButtonTooltip tooltipText="Send Referral Code" position="top">
              <Button
                variant="info"
                size="sm"
                onClick={() => handleSendReferralCode(company.id)}
                className="!p-1.5 !min-w-0"
              >
                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </ButtonTooltip>
          </div>
        );
      },
      enableSorting: false,
    }
  ], [handleEditCompanyClick, handleSendReferralCode]);

  const dynamicTitle = useMemo(() => (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
      <span className="text-xl sm:text-2xl font-bold text-gray-800">Partner Management</span>
    </div>
  ), []);

  return (
    <div className="relative">
      {/* Alerts */}
      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          className="mb-4 mx-2 sm:mx-4"
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {actionSuccessMessage && (
        <Alert
          variant="success"
          message={actionSuccessMessage}
          className="mb-4 mx-2 sm:mx-4"
          onClose={() => setActionSuccessMessage(null)}
        />
      )}

      {error && (
        <Alert
          variant="error"
          message={error}
          action={handleRetry}
          actionLabel="Retry"
          onClose={() => setError(null)}
          className="mb-4 mx-2 sm:mx-4"
        />
      )}

      {/* SUMMARY VIEW - Partners List */}
      <Card className="mb-6 mx-2 sm:mx-4" bodyClassName="p-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
          {dynamicTitle}
          <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                clearModalMessages();
                setShowCreateModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 flex-1 sm:flex-initial text-sm sm:text-base px-4 py-2"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Add Partner</span>
            </Button>
            <Button
              variant="secondary"
              onClick={handlePageRefresh}
              loading={loadingSummary}
              loadingText="Refreshing..."
              className="inline-flex items-center justify-center gap-2 flex-1 sm:flex-initial text-sm sm:text-base px-4 py-2"
            >
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">↻</span>
            </Button>
          </div>
        </div>
      </Card>

      <HomeTable
        data={summaryData}
        columns={summaryColumns}
        loading={loadingSummary}
        pagination={paginationSummary}
        onPaginationChange={handlePaginationSummary}
        filterFields={summaryFilterFields}
        onFilterChange={handleFilterChange}
        serverSideFiltering={true}
        error={error}
        onRetry={handleRetry}
        hideDefaultActions
        noDataMessage="No partners found"
      />

      {/* User Statistics Modal */}
      <UserStatsModal
        isOpen={showStatsModal}
        onClose={() => {
          setShowStatsModal(false);
          setSelectedStats(null);
        }}
        data={selectedStats}
      />

      {/* Status Update Modal */}
      <StatusUpdateModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setEditingCompany(null);
        }}
        company={editingCompany}
        onUpdate={handleUpdateStatus}
      />

      {/* CREATE PARTNER MODAL - UPDATED: Removed close icons from alerts */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
          clearModalMessages();
        }}
        title="Create Partner"
        size="lg"
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 sm:p-6">
          {modalSuccess && (
            <div className="mb-4 sm:mb-6">
              <Alert 
                variant="success" 
                message={modalSuccess} 
                // Removed onClose prop to hide the close icon
              />
            </div>
          )}
          
          {modalError && (
            <div className="mb-4 sm:mb-6">
              <Alert 
                variant="error" 
                message={modalError} 
                // Removed onClose prop to hide the close icon
              />
            </div>
          )}
          
          <form onSubmit={handleCreateCompany}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <InputText
                label="Partner Name"
                name="companyName"
                value={formData.companyName}
                onChange={handlePartnerNameChange}
                error={formErrors.companyName ? { message: formErrors.companyName } : null}
                required={true}
                maxLength={30}
                className="w-full"
                inputClassName="text-sm sm:text-base py-2"
                placeholder="e.g. Ali"
              />

              <InputSelect
                label="Partner Type"
                name="partnerType"
                value={formData.partnerType}
                onChange={(e) => setFormData({ ...formData, partnerType: e.target.value })}
                options={PARTNER_TYPE_OPTIONS}
                required={true}
                className="w-full"
              />

              <InputText
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleEmailChange}
                error={formErrors.email ? { message: formErrors.email } : null}
                required={true}
                maxLength={50}
                className="w-full"
                placeholder="abc@gmail.com"
                inputClassName="text-sm sm:text-base py-2"
              />

              <InputPhone
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                error={formErrors.phone ? { message: formErrors.phone } : null}
                required={true}
                maxLength={20}
                className="w-full"
                placeholder="03337878788"
                inputClassName="text-sm sm:text-base py-2"
              />

              <InputText
                label="Address"
                name="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                error={formErrors.address ? { message: formErrors.address } : null}
                required={true}
                placeholder="e.g. 123 Main Street"
                maxLength={50}
                className="w-full"
                inputClassName="text-sm sm:text-base py-2"
              />

              <InputSelect
                label="Commission Type"
                name="commissionType"
                value={formData.commissionType}
                onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}
                options={COMMISSION_TYPES}
                required={true}
                className="w-full"
              />

              <InputText
                label="Commission Value"
                name="commissionValue"
                type="number"
                step="1"
                min="1"
                value={formData.commissionValue}
                onChange={handleCommissionValueChange}
                error={formErrors.commissionValue ? { message: formErrors.commissionValue } : null}
                required={true}
                className="w-full"
                inputClassName="text-sm sm:text-base py-2"
              />

              {/* Commission Applies On - now in same row as Commission Value (col-span-1) */}
              <InputSelect
                label="Commission Applies On"
                name="commissionAppliesOn"
                value={formData.commissionAppliesOn}
                onChange={(e) => setFormData({ ...formData, commissionAppliesOn: e.target.value })}
                options={COMMISSION_APPLIES_ON}
                required={true}
                className="w-full"
              />

              <InputTextarea
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                maxLength={200}
                rows={2}
                className="col-span-1 sm:col-span-2"
                inputClassName="text-sm sm:text-base"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                  clearModalMessages();
                }}
                className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                loading={isSubmitting}
                loadingText="Creating..."
                className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8"
              >
                Add Partner
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* EDIT PARTNER MODAL - UPDATED: Removed close icons from alerts */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCompany(null);
          resetForm();
          clearModalMessages();
        }}
        title="Edit Partner"
        size="lg"
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 sm:p-6">
          {modalSuccess && (
            <div className="mb-4 sm:mb-6">
              <Alert 
                variant="success" 
                message={modalSuccess} 
                // Removed onClose prop to hide the close icon
              />
            </div>
          )}
          
          {modalError && (
            <div className="mb-4 sm:mb-6">
              <Alert 
                variant="error" 
                message={modalError} 
                // Removed onClose prop to hide the close icon
              />
            </div>
          )}
          
          <form onSubmit={handleEditCompany}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <InputText
                label="Partner Name"
                name="companyName"
                value={formData.companyName}
                onChange={handlePartnerNameChange}
                error={formErrors.companyName ? { message: formErrors.companyName } : null}
                required={true}
                maxLength={30}
                className="w-full"
                inputClassName="text-sm sm:text-base py-2"
                placeholder="Only letters and spaces allowed"
              />

              <InputSelect
                label="Partner Type"
                name="partnerType"
                value={formData.partnerType}
                onChange={(e) => setFormData({ ...formData, partnerType: e.target.value })}
                options={PARTNER_TYPE_OPTIONS}
                required={true}
                className="w-full"
              />

              <InputText
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleEmailChange}
                error={formErrors.email ? { message: formErrors.email } : null}
                required={true}
                maxLength={50}
                className="w-full"
                inputClassName="text-sm sm:text-base py-2"
              />

              <InputPhone
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                error={formErrors.phone ? { message: formErrors.phone } : null}
                required={true}
                maxLength={20}
                className="w-full"
                inputClassName="text-sm sm:text-base py-2"
              />

              <InputText
                label="Address"
                name="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                error={formErrors.address ? { message: formErrors.address } : null}
                required={true}
                maxLength={50}
                className="w-full"
                inputClassName="text-sm sm:text-base py-2"
              />

              <InputSelect
                label="Commission Type"
                name="commissionType"
                value={formData.commissionType}
                onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}
                options={COMMISSION_TYPES}
                required={true}
                className="w-full"
              />

              <InputText
                label="Commission Value"
                name="commissionValue"
                type="number"
                step="1"
                min="1"
                value={formData.commissionValue}
                onChange={handleCommissionValueChange}
                error={formErrors.commissionValue ? { message: formErrors.commissionValue } : null}
                required={true}
                className="w-full"
                inputClassName="text-sm sm:text-base py-2"
              />

              {/* Commission Applies On - same row */}
              <InputSelect
                label="Commission Applies On"
                name="commissionAppliesOn"
                value={formData.commissionAppliesOn}
                onChange={(e) => setFormData({ ...formData, commissionAppliesOn: e.target.value })}
                options={COMMISSION_APPLIES_ON}
                required={true}
                className="w-full"
              />

              <InputTextarea
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                maxLength={200}
                rows={2}
                className="col-span-1 sm:col-span-2"
                inputClassName="text-sm sm:text-base"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCompany(null);
                  resetForm();
                  clearModalMessages();
                }}
                className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                loading={isSubmitting}
                loadingText="Updating..."
                className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8"
              >
                Update Partner
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}