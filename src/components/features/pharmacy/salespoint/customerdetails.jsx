// CustomerDetails.jsx — WITH PENDING DUE & CLEAR MULTIPLE DUE SUPPORT
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import HomeTable from "../../../common/table/Table";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from '../../../../services/endpoint/salespoint/salespointend';
import ExportReports from "../../../common/reports/ExportReports";
import { useAuth } from "../../../auth/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { Eye, RefreshCw, Wallet } from 'lucide-react';  // ← changed from Receipt to Wallet

// Import UI components
import Button from "../../../../components/ui/forms/Button";
import Alert from "../../../../components/ui/feedback/Alert";
import Card from "../../../../components/ui/Card";
import InputSelect from "../../../../components/ui/forms/InputSelect";

// Import Constants
import { 
  SALES_POINT_CONSTANTS,
  CustomerType 
} from './salescosntant/salesPointConstants';

// ─── Transaction Details Tooltip ────────────────────────────────────────────
const TransactionHoverTooltip = ({ items = [], invoice_no }) => {
  const actualPreview = items.length > 0 ? `${items.length} items` : "—";
  
  let content;
  if (items.length > 0) {
    content = (
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border-b font-bold text-gray-800">Name</th>
            <th className="px-4 py-2 border-b font-bold text-gray-800">Strength</th>
            <th className="px-4 py-2 border-b font-bold text-gray-800">Quantity</th>
            <th className="px-4 py-2 border-b font-bold text-gray-800">Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map((drug, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b text-gray-900">{drug.name}</td>
              <td className="px-4 py-2 border-b text-gray-900">{drug.strength || "—"}</td>
              <td className="px-4 py-2 border-b text-gray-900">{drug.quantity}</td>
              <td className="px-4 py-2 border-b text-gray-900">₨ {drug.sale_price?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  } else {
    return <span className="text-gray-600">{actualPreview}</span>;
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

  const tooltipTitle = invoice_no ? `Items for Invoice ${invoice_no}` : "Transaction Items";

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={open}
        onMouseLeave={close}
        className="text-blue-600 hover:underline cursor-help text-sm font-medium"
      >
        {actualPreview}
      </span>
      {isOpen && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-none p-4">
          <div
            onMouseEnter={open}
            onMouseLeave={close}
            className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-300 w-full max-w-md max-h-[90vh] sm:max-h-[80vh] overflow-y-auto pointer-events-auto mx-4"
          >
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-center text-gray-800 border-b pb-2 sm:pb-3">
              {tooltipTitle}
            </h3>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 sm:px-4 py-2 border-b font-bold text-gray-800">Name</th>
                      <th className="px-2 sm:px-4 py-2 border-b font-bold text-gray-800">Strength</th>
                      <th className="px-2 sm:px-4 py-2 border-b font-bold text-gray-800">Qty</th>
                      <th className="px-2 sm:px-4 py-2 border-b font-bold text-gray-800">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((drug, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 border-b text-gray-900 whitespace-nowrap">{drug.name}</td>
                        <td className="px-2 sm:px-4 py-2 border-b text-gray-900 whitespace-nowrap">{drug.strength || "—"}</td>
                        <td className="px-2 sm:px-4 py-2 border-b text-gray-900 whitespace-nowrap">{drug.quantity}</td>
                        <td className="px-2 sm:px-4 py-2 border-b text-gray-900 whitespace-nowrap">₨ {drug.sale_price?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CustomerDetails() {
  const { user } = useAuth();
  const location = useLocation();

  // Refs for cleanup
  const fetchTimeoutRef = useRef(null);
  const controllerRef = useRef(null);
  const successTimeoutRef = useRef(null);

  // Summary view state
  const [summaryData, setSummaryData] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchPhone, setSearchPhone] = useState("");

  // Detail view state
  const [detailData, setDetailData] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedBranchValue, setSelectedBranchValue] = useState("");
  const [selectedField, setSelectedField] = useState("");

  // Pagination
  const [paginationSummary, setPaginationSummary] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });
  const [paginationDetail, setPaginationDetail] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

  // Filters
  const [filters, setFilters] = useState({ 
    start_date: "",
    end_date: ""
  });

  // Update modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({ 
    credit: 0, 
    discount: 0, 
    customer_type: "", 
    advance_amount: 0 
  });

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDeleteCustomer, setSelectedDeleteCustomer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Pending Due Modal State ─────────────────────────────────────────────────
  const [showDueModal, setShowDueModal] = useState(false);
  const [dueModalCustomer, setDueModalCustomer] = useState(null);
  const [pendingDues, setPendingDues] = useState([]);
  const [loadingDues, setLoadingDues] = useState(false);
  const [dueError, setDueError] = useState(null);
  // selectedDueInvoices: { [invoice_no]: { invoice_no, remaining_amount, paymentType, notes } }
  const [selectedDueInvoices, setSelectedDueInvoices] = useState({});
  const [globalPaymentType, setGlobalPaymentType] = useState("CASH");
  const [globalNotes, setGlobalNotes] = useState("Full payment");
  const [isClearingDues, setIsClearingDues] = useState(false);
  const [clearDueResult, setClearDueResult] = useState(null); // summary after clearing

  // Get user info from constants
  const { 
    currentVendorId, 
    originalBranchId, 
    isMaster, 
    currentBusinessName 
  } = SALES_POINT_CONSTANTS.getUserInfo(user);

  const childVendors = getVendorChildIds() || [];
  
  const branchOptions = useMemo(() => {
    const options = [{ value: "", label: "All Branches" }];
    options.push({ value: currentVendorId, label: currentBusinessName });
    childVendors.forEach(item => {
      options.push({ 
        value: item.vendor_id, 
        label: item.business_name || `Branch ${item.branch_id}` 
      });
    });
    return options;
  }, [currentVendorId, childVendors, currentBusinessName]);

  useEffect(() => {
    const vendorId = user?.currentBranch?.vendorId || "";
    const initialValue = vendorId || currentVendorId;
    setSelectedBranchValue(initialValue);
  }, [user?.currentBranch, currentVendorId]);

  useEffect(() => {
    if (editingCustomer) {
      setUpdateFormData({
        credit: 0,    
        discount: editingCustomer.discount,
        customer_type: editingCustomer.customer_type || "",
        advance_amount: 0, 
      });
    }
  }, [editingCustomer]);

  useEffect(() => {
    if (location.state?.message) {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      setSuccessMessage(location.state.message);
      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage(null);
        successTimeoutRef.current = null;
      }, 5000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const dynamicTitle = useMemo(() => {
    const branchLabel = selectedBranchValue === currentVendorId 
      ? currentBusinessName 
      : branchOptions.find(opt => opt.value === selectedBranchValue)?.label || "All Branches";
    const isMainBranch = selectedBranchValue === currentVendorId || !selectedBranchValue;

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl font-bold text-gray-800 truncate max-w-[200px] sm:max-w-full">
            Customer Details
          </span>
        </div>
        <span className="hidden sm:inline text-gray-500">—</span>
        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm w-fit ${
          isMainBranch
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-blue-100 text-blue-800 border border-blue-300'
        }`}>
          {branchLabel}
        </span>
      </div>
    );
  }, [selectedBranchValue, currentVendorId, branchOptions, currentBusinessName]);

  // ── Fetch customers summary ───────────────────────────────────────────────
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

      const phone = searchPhone.trim();
      const baseEndpoint = apiEndpoints.searchByCustomerDetail(
        phone,
        paginationSummary.page,
        paginationSummary.page_size
      );
      const endpoint = !phone
        ? `${baseEndpoint}?page=${paginationSummary.page}&page_size=${paginationSummary.page_size}`
        : baseEndpoint;
      const headers = SALES_POINT_CONSTANTS.getAuthHeaders(token);
      
      let branchId = originalBranchId;
      if (selectedBranchValue && selectedBranchValue !== currentVendorId) {
        const child = childVendors.find(v => v.vendor_id === selectedBranchValue);
        if (child) {
          branchId = child.branch_id;
          headers[SALES_POINT_CONSTANTS.HEADER_KEYS.CHILD_ID] = selectedBranchValue;
        }
      }
      headers[SALES_POINT_CONSTANTS.HEADER_KEYS.USER_BRANCH_ID] = branchId;

      const { data } = await apiService.get(endpoint, { 
        headers, 
        signal: controllerRef.current.signal,
        timeout: 15000 
      });

      const rawData = data?.data ?? [];
      const pag = data?.pagination ?? {};

      if (!Array.isArray(rawData)) {
        setSummaryData([]);
        setPaginationSummary(p => ({ ...p, total: 0 }));
        return;
      }

      const mapped = rawData.map((d, i) => ({
        id: `${d.phone}-${i}`,
        customer_id: d.customer_id || "",           // ← needed for pending due
        customer_name: d.customer_name || "N/A",
        phone: d.phone || "N/A",
        credit: Number(d.credit) || 0,
        advance_amount: Number(d.advance_amount) || 0,
        customer_type: d.customer_type || "N/A",
        discount: Number(d.discount) || 0,
        last_purchase: d.last_purchase ? new Date(d.last_purchase).toLocaleDateString() : "N/A",
        created_date: d.created_date ? new Date(d.created_date).toLocaleDateString() : "N/A",
      }));

      setSummaryData(mapped);
      setPaginationSummary(p => ({
        ...p,
        total: pag.total_records ?? rawData.length ?? 0,
      }));
    } catch (err) {
      if (err.name === 'AbortError') return;
      
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        const validationError = err.response.data.detail[0];
        if (validationError && validationError.msg) {
          setError(validationError.msg);
        } else {
          setError("Invalid input. Please check your search criteria.");
        }
      } 
      else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } 
      else if (err.response?.data?.error) {
        setError(err.response.data.error);
      }
      else {
        const isNotFound = err.response?.status === 404;
        setError(isNotFound ? "No customers found" : SALES_POINT_CONSTANTS.getErrorMessage(err));
      }
      
      setSummaryData([]);
      setPaginationSummary(p => ({ ...p, total: 0 }));
    } finally {
      setLoadingSummary(false);
    }
  }, [searchPhone, paginationSummary.page, paginationSummary.page_size, selectedBranchValue, currentVendorId, originalBranchId, childVendors]);

  // ── Fetch customer history (detail view) ────────────────────────────────
  const fetchDetail = useCallback(async () => {
    if (!selectedCustomer) return;

    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();

    try {
      setLoadingDetail(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setLoadingDetail(false);
        return;
      }

      const params = new URLSearchParams();
      if (selectedField && selectedField !== "") {
        params.append("field", selectedField);
      }
      if (filters.start_date) params.append("dateFrom", filters.start_date);
      if (filters.end_date) params.append("dateTo", filters.end_date);
      const endpoint = `${apiEndpoints.getcustomerinfo(selectedCustomer.phone)}&${params.toString()}`;

      const headers = SALES_POINT_CONSTANTS.getAuthHeaders(token);
      let branchId = originalBranchId;
      if (selectedBranch && selectedBranch.vendor_id && selectedBranch.vendor_id !== currentVendorId) {
        headers[SALES_POINT_CONSTANTS.HEADER_KEYS.CHILD_ID] = selectedBranch.vendor_id;
        const child = childVendors.find(v => v.vendor_id === selectedBranch.vendor_id);
        branchId = selectedBranch.branch_id || child?.branch_id || "";
      }
      headers[SALES_POINT_CONSTANTS.HEADER_KEYS.USER_BRANCH_ID] = branchId;

      const { data } = await apiService.get(endpoint, { 
        headers, 
        signal: controllerRef.current.signal,
        timeout: 15000 
      });

      const changes = data?.data || [];
      const pag = data?.pagination || {};

      const mapped = changes.map((item, idx) => {
        const oldVal = Number(item.old_value) || 0;
        const newVal = Number(item.new_value) || 0;
        const amountAdded = newVal - oldVal;
        return {
          id: `${item.changed_at}-${idx}`,
          changed_at: SALES_POINT_CONSTANTS.formatLocalDateTime(item.changed_at),
          field: item.field || "—",
          old_value: oldVal.toFixed(2),
          new_value: newVal.toFixed(2),
          amount_added: amountAdded.toFixed(2),
          branch_id: item.branch_id || "—",
          vendor_id: item.vendor_id || "—",
        };
      });

      setDetailData(mapped);
      setPaginationDetail(p => ({ 
        ...p, 
        total: pag.total_records || mapped.length,
        page: pag.page || 1,
        page_size: pag.page_size || 10,
      }));
    } catch (err) {
      if (err.name === 'AbortError') return;
      
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        const validationError = err.response.data.detail[0];
        if (validationError && validationError.msg) {
          setError(validationError.msg);
        } else {
          setError("Invalid input. Please check your search criteria.");
        }
      } 
      else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } 
      else if (err.response?.data?.error) {
        setError(err.response.data.error);
      }
      else {
        setError(SALES_POINT_CONSTANTS.getErrorMessage(err));
      }
      
      setDetailData([]);
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedCustomer, selectedBranch, filters.start_date, filters.end_date, selectedField, currentVendorId, originalBranchId, childVendors]);

  // ── Fetch pending dues for a customer ────────────────────────────────────
  const fetchPendingDue = useCallback(async (customer) => {
    try {
      setLoadingDues(true);
      setDueError(null);
      setPendingDues([]);
      setSelectedDueInvoices({});
      setClearDueResult(null);

      const token = getToken();
      const headers = SALES_POINT_CONSTANTS.getAuthHeaders(token);

      let branchId = originalBranchId;
      if (selectedBranchValue && selectedBranchValue !== currentVendorId) {
        const child = childVendors.find(v => v.vendor_id === selectedBranchValue);
        if (child) {
          branchId = child.branch_id;
          headers[SALES_POINT_CONSTANTS.HEADER_KEYS.CHILD_ID] = selectedBranchValue;
        }
      }
      headers[SALES_POINT_CONSTANTS.HEADER_KEYS.USER_BRANCH_ID] = branchId;

      const endpoint = apiEndpoints.getCustomerPendingDue(customer.customer_id);
      const { data } = await apiService.get(endpoint, { headers, timeout: 15000 });

      const rawDues = data?.data ?? [];
      
      // Normalize backend response to match expected structure in modal
      const normalizedDues = rawDues.map(inv => {
        const totalAmount = Number(inv.total) || 0;
        const remainingDue = Number(inv.remaining_due) || 0;
        const paidAmount = totalAmount - remainingDue;
        
        return {
          invoice_no: inv.invoice_no,
          remaining_amount: remainingDue,   // used for clearing and selection
          date: inv.date_time,               // original date_time from backend
          total_amount: totalAmount,
          paid_amount: paidAmount,
          status: remainingDue === 0 ? "Paid" : "Pending",
          items: inv.items || [],
          transaction_type: inv.transaction_type,
          payment_type: inv.payment_type
        };
      });
      
      setPendingDues(normalizedDues);
    } catch (err) {
      if (err.response?.data?.message) {
        setDueError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setDueError(err.response.data.error);
      } else if (err.response?.status === 404) {
        setDueError("No pending dues found for this customer.");
      } else {
        setDueError(SALES_POINT_CONSTANTS.getErrorMessage(err));
      }
    } finally {
      setLoadingDues(false);
    }
  }, [selectedBranchValue, currentVendorId, originalBranchId, childVendors]);

  // ── Open Due Modal ───────────────────────────────────────────────────────
  const handleDueClick = useCallback((row) => {
    const customer = row.original;
    if (!customer.customer_id) {
      setError("Customer ID not available for this record.");
      return;
    }
    setDueModalCustomer(customer);
    setShowDueModal(true);
    setGlobalPaymentType("CASH");
    setGlobalNotes("Full payment");
    setClearDueResult(null);
    fetchPendingDue(customer);
  }, [fetchPendingDue]);

  // ── Toggle invoice selection ─────────────────────────────────────────────
  const handleToggleDueInvoice = useCallback((invoice) => {
    const key = invoice.invoice_no;
    setSelectedDueInvoices(prev => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: {
          invoice_no: invoice.invoice_no,
          remaining_amount: invoice.remaining_amount,
        },
      };
    });
  }, []);

  // ── Select / Deselect all ────────────────────────────────────────────────
  const handleSelectAllDues = useCallback(() => {
    if (!pendingDues.length) return;
    const allSelected = pendingDues.every(inv => selectedDueInvoices[inv.invoice_no]);
    if (allSelected) {
      setSelectedDueInvoices({});
    } else {
      const next = {};
      pendingDues.forEach(inv => {
        next[inv.invoice_no] = {
          invoice_no: inv.invoice_no,
          remaining_amount: inv.remaining_amount,
        };
      });
      setSelectedDueInvoices(next);
    }
  }, [pendingDues, selectedDueInvoices]);

  // ── Clear selected dues ──────────────────────────────────────────────────
  const handleClearDues = useCallback(async () => {
    const selected = Object.values(selectedDueInvoices);
    if (!selected.length) return;

    setIsClearingDues(true);
    setDueError(null);
    setClearDueResult(null);

    try {
      const token = getToken();
      const headers = SALES_POINT_CONSTANTS.getAuthHeaders(token);

      let branchId = originalBranchId;
      if (selectedBranchValue && selectedBranchValue !== currentVendorId) {
        const child = childVendors.find(v => v.vendor_id === selectedBranchValue);
        if (child) {
          branchId = child.branch_id;
          headers[SALES_POINT_CONSTANTS.HEADER_KEYS.CHILD_ID] = selectedBranchValue;
        }
      }
      headers[SALES_POINT_CONSTANTS.HEADER_KEYS.USER_BRANCH_ID] = branchId;

      const body = {
        payments: selected.map(inv => ({
          invoiceNo: inv.invoice_no,
          amountPaid: inv.remaining_amount,   // clear the full remaining amount
          paymentType: globalPaymentType,
          notes: globalNotes || "Full payment",
        })),
      };

      const { data } = await apiService.post(
        apiEndpoints.clearMultipleDue(),
        body,
        { headers, timeout: 15000 }
      );

      setClearDueResult(data);

      // Show detailed success message
      const summary = data?.summary;
      const totalCleared = summary?.total_cleared_amount || 0;
      const successfulCount = summary?.successful || 0;
      const msg = `✅ Successfully cleared ${successfulCount} invoice(s) totaling ₨ ${totalCleared.toFixed(2)}`;
      
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      setSuccessMessage(msg);
      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage(null);
        successTimeoutRef.current = null;
      }, 6000);

      // Close the due modal
      setShowDueModal(false);
      setDueModalCustomer(null);
      setPendingDues([]);
      setSelectedDueInvoices({});
      setClearDueResult(null);
      setDueError(null);

      // Refresh summary table to update credit/advance balances
      fetchSummary();
      
    } catch (err) {
      if (err.response?.data?.message) {
        setDueError(err.response.data.message);
      } else {
        setDueError(SALES_POINT_CONSTANTS.getErrorMessage(err));
      }
    } finally {
      setIsClearingDues(false);
    }
  }, [
    selectedDueInvoices,
    globalPaymentType,
    globalNotes,
    selectedBranchValue,
    currentVendorId,
    originalBranchId,
    childVendors,
    fetchSummary,
  ]);

  // ── Summary effect ───────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedCustomer) return;

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
  }, [selectedCustomer, searchPhone, paginationSummary.page, paginationSummary.page_size, selectedBranchValue]);

  // ── Detail view effect ───────────────────────────────────────────────────
  useEffect(() => {
    if (selectedCustomer) {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      fetchDetail();
    }
  }, [selectedCustomer, filters.start_date, filters.end_date, selectedField]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      if (controllerRef.current) controllerRef.current.abort();
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  // ── Handle filter changes ────────────────────────────────────────────────
  const handleFilterChange = useCallback((name, value) => {
    if (name === "branch") {
      setSelectedBranchValue(value || "");
      setPaginationSummary(p => ({ ...p, page: 1 }));
      return;
    }
    
    if (name === "phone") {
      setSearchPhone(value);
      setPaginationSummary(p => ({ ...p, page: 1 }));
      return;
    }

    if (name === "field") {
      setSelectedField(value);
      if (selectedCustomer) setPaginationDetail(p => ({ ...p, page: 1 }));
      return;
    }
    
    setFilters(p => ({ ...p, [name]: value }));
    
    if (selectedCustomer) {
      setPaginationDetail(p => ({ ...p, page: 1 }));
    }
  }, [selectedCustomer]);

  // ── Handle view click ────────────────────────────────────────────────────
  const handleViewClick = useCallback((row) => {
    const original = row.original;
    
    let branchInfo = null;
    if (selectedBranchValue === currentVendorId || !selectedBranchValue) {
      branchInfo = {
        is_master: true,
        vendor_id: currentVendorId,
        branch_id: originalBranchId,
        business_name: currentBusinessName
      };
    } else {
      const childBranch = childVendors.find(v => v.vendor_id === selectedBranchValue);
      if (childBranch) {
        branchInfo = {
          is_master: false,
          vendor_id: childBranch.vendor_id,
          branch_id: childBranch.branch_id,
          business_name: childBranch.business_name || `Branch ${childBranch.branch_id}`
        };
      } else {
        branchInfo = {
          is_master: true,
          vendor_id: currentVendorId,
          branch_id: originalBranchId,
          business_name: currentBusinessName
        };
      }
    }
    
    setSelectedCustomer(original);
    setSelectedBranch(branchInfo);
    setPaginationDetail({ page: 1, page_size: 10, total: 0 });
    setSelectedField("");
  }, [selectedBranchValue, currentVendorId, originalBranchId, childVendors, currentBusinessName]);

  // ── Handle back ──────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    setSelectedCustomer(null);
    setSelectedBranch(null);
    setDetailData([]);
    setPaginationDetail({ page: 1, page_size: 10, total: 0 });
  }, []);

  // ── Pagination ───────────────────────────────────────────────────────────
  const handlePaginationSummary = useCallback((page, pageSize) => {
    setPaginationSummary(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handlePaginationDetail = useCallback((page, pageSize) => {
    setPaginationDetail(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  // ── Retry / Refresh ──────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setError(null);
    if (selectedCustomer) fetchDetail();
    else fetchSummary();
  }, [selectedCustomer, fetchDetail, fetchSummary]);

  const handlePageRefresh = useCallback(() => {
    if (selectedCustomer) fetchDetail();
    else fetchSummary();
  }, [selectedCustomer, fetchDetail, fetchSummary]);

  // ── Update modal ─────────────────────────────────────────────────────────
  const openUpdateModal = useCallback((customer) => {
    setEditingCustomer(customer);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback((customer) => {
    setSelectedDeleteCustomer(customer);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const token = getToken();
      const headers = SALES_POINT_CONSTANTS.getAuthHeaders(token);

      const branchId = selectedBranchValue === currentVendorId ? originalBranchId : 
                      childVendors.find(v => v.vendor_id === selectedBranchValue)?.branch_id || originalBranchId;
      headers[SALES_POINT_CONSTANTS.HEADER_KEYS.USER_BRANCH_ID] = branchId;

      if (selectedBranchValue && selectedBranchValue !== currentVendorId) {
        headers[SALES_POINT_CONSTANTS.HEADER_KEYS.CHILD_ID] = selectedBranchValue;
      }

      const response = await apiService.delete(
        apiEndpoints.deleteCustomerDetail(selectedDeleteCustomer.phone), 
        { headers }
      );
      
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      setSuccessMessage(response.data.message);
      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage(null);
        successTimeoutRef.current = null;
      }, 5000);
      
      if (!selectedCustomer) {
        fetchSummary();
      }
    } catch (err) {
      setError(SALES_POINT_CONSTANTS.getErrorMessage(err));
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setSelectedDeleteCustomer(null);
    }
  }, [
    selectedBranchValue, 
    selectedDeleteCustomer, 
    selectedCustomer, 
    currentVendorId, 
    originalBranchId, 
    childVendors, 
    fetchSummary
  ]);

  // ── Calculate final credit/advance values ─────────────────────────────
  const calculateFinalValues = useCallback(() => {
    const currentCredit = editingCustomer?.credit || 0;
    const currentAdvance = editingCustomer?.advance_amount || 0;
    
    const additionalCredit = parseFloat(updateFormData.credit) || 0;
    const additionalAdvance = parseFloat(updateFormData.advance_amount) || 0;
    
    const totalCredit = currentCredit + additionalCredit;
    const totalAdvance = currentAdvance + additionalAdvance;
    
    let finalCredit, finalAdvance;
    if (totalAdvance >= totalCredit) {
      finalCredit = 0;
      finalAdvance = totalAdvance - totalCredit;
    } else {
      finalCredit = totalCredit - totalAdvance;
      finalAdvance = 0;
    }
    
    return { finalCredit, finalAdvance };
  }, [updateFormData, editingCustomer]);

  const handleSubmitUpdate = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = getToken();
      const { finalCredit, finalAdvance } = calculateFinalValues();
      
      const body = {
        phone: editingCustomer.phone,
        credit: finalCredit,
        customer_type: updateFormData.customer_type || "null",
        discount: updateFormData.discount,
        advance_amount: finalAdvance,
      };
      
      const headers = SALES_POINT_CONSTANTS.getAuthHeaders(token);
      await apiService.put(apiEndpoints.updateCustomerDetails, body, { headers });
      
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      setSuccessMessage("Customer details updated successfully");
      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage(null);
        successTimeoutRef.current = null;
      }, 5000);
      
      setShowModal(false);
      setEditingCustomer(null);
      if (!selectedCustomer) fetchSummary();
    } catch (err) {
      setError(SALES_POINT_CONSTANTS.getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [editingCustomer, updateFormData, selectedCustomer, fetchSummary, calculateFinalValues]);

  // ── Filter fields ────────────────────────────────────────────────────────
  const summaryFilterFields = useMemo(() => [
    {
      type: "text",
      name: "phone",
      label: "Phone",
      placeholder: "e.g. 03454128218",
      value: searchPhone,
      onChange: (e) => handleFilterChange("phone", e.target.value),
      className: "w-full sm:w-auto",
    },
    ...(isMaster && branchOptions.length > 0 ? [{
      type: "select",
      name: "branch",
      label: "Branch",
      placeholder: "Select Branch",
      value: selectedBranchValue,
      onChange: (e) => handleFilterChange("branch", e.target.value),
      options: branchOptions,
      className: "w-full sm:w-auto",
      component: InputSelect,
    }] : []),
  ], [searchPhone, selectedBranchValue, handleFilterChange, isMaster, branchOptions]);

  const detailFilterFields = useMemo(() => [
    {
      type: "select",
      name: "field",
      label: "Field",
      value: selectedField,
      onChange: (e) => handleFilterChange("field", e.target.value),
      options: [
        { value: "advance_amount", label: "Advance Amount" },
        { value: "credit", label: "Credit" },
      ],
      className: "w-full sm:w-40",
    },
    {
      type: "date",
      name: "start_date",
      label: "From Date",
      value: filters.start_date || "",
      onChange: (e) => handleFilterChange("start_date", e.target.value),
      className: "w-full sm:w-auto",
    },
    {
      type: "date",
      name: "end_date",
      label: "To Date",
      value: filters.end_date || "",
      onChange: (e) => handleFilterChange("end_date", e.target.value),
      className: "w-full sm:w-auto",
    },
  ], [selectedField, filters.start_date, filters.end_date, handleFilterChange]);

  // ── Summary columns ──────────────────────────────────────────────────────
  const summaryColumns = useMemo(() => [
    {
      accessorKey: "customer_name",
      header: ({ column }) => <HeaderWithSort column={column} title="Customer Name" />,
      cell: ({ row }) => <div className="font-medium text-gray-900 text-xs sm:text-sm">{row.original.customer_name}</div>,
    },
    {
      accessorKey: "created_date",
      header: "Created Date",
      cell: ({ row }) => <div className="text-xs sm:text-sm">{SALES_POINT_CONSTANTS.formatLocalDateTime(row.original.created_date, false)}</div>,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => <HeaderWithSort column={column} title="Phone" />,
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.phone}</div>,
    },
    {
      accessorKey: "last_purchase",
      header: "Last Purchase",
      cell: ({ row }) => <div className="text-xs sm:text-sm">{SALES_POINT_CONSTANTS.formatLocalDateTime(row.original.last_purchase, false)}</div>,
    },
    {
      accessorKey: "discount",
      header: ({ column }) => <HeaderWithSort column={column} title="Discount (%)" />,
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.discount}%</div>,
    },
    {
      accessorKey: "customer_type",
      header: "Customer Type",
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.customer_type}</div>,
    },
    {
      accessorKey: "credit",
      header: ({ column }) => <HeaderWithSort column={column} title="Credit" />,
      cell: ({ row }) => {
        const creditValue = Number(row.original.credit);
        const formattedValue = isNaN(creditValue) ? "0.00" : creditValue.toFixed(2);
        return <div className="text-xs sm:text-sm">{formattedValue}</div>;
      },
    },
    {
      accessorKey: "advance_amount",
      header: ({ column }) => <HeaderWithSort column={column} title="Advance" />,
      cell: ({ row }) => {
        const amount = Number(row.original.advance_amount);
        return (
          <div className="text-xs sm:text-sm">
            ₨ {!isNaN(amount) ? amount.toFixed(2) : "0.00"}
          </div>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Edit */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openUpdateModal(row.original);
            }}
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 p-1.5 sm:p-2"
            title="Edit Customer"
          >
            <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Delete */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete(row.original);
            }}
            className="text-red-600 hover:text-red-800 transition-colors duration-200 p-1.5 sm:p-2"
            title="Delete Customer"
          >
            <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Pending Due - using Wallet icon instead of any dollar/receipt icon */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDueClick(row);
            }}
            className="text-amber-600 hover:text-amber-800 transition-colors duration-200 p-1.5 sm:p-2"
            title="View Pending Dues"
          >
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "View",
      header: () => <div className="text-center">View Details</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleViewClick(row);
            }}
            title="View Credit Transactions"
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
            <span className="hidden sm:inline">View</span>
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ], [handleViewClick, openUpdateModal, handleDelete, handleDueClick]);

  // ── Detail columns ───────────────────────────────────────────────────────
  const detailColumns = useMemo(() => [
    { 
      accessorKey: "Changed At", 
      header: () => "Date & Time", 
      cell: ({ row }) => (
        <div className="font-medium capitalize text-xs sm:text-sm">{row.original.changed_at}</div>
      )
    },
    { 
      accessorKey: "Field", 
      header: () => "Field", 
      cell: ({ row }) => {
        const formatFieldName = (field) => {
          if (!field || field === "—") return field;
          const fieldMap = {
            'advance_amount': 'Advance Amount',
            'credit': 'Credit',
            'discount': 'Discount',
            'customer_type': 'Customer Type'
          };
          return fieldMap[field] || field.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        };
        return (
          <span className="font-medium text-xs sm:text-sm">
            {formatFieldName(row.original.field)}
          </span>
        );
      }
    },
    { 
      accessorKey: "Old Value", 
      header: () => "Old Value", 
      cell: ({ row }) => (
        <div className="text-xs sm:text-sm text-gray-600">₨ {row.original.old_value}</div>
      )
    },
    { 
      accessorKey: "New Value", 
      header: () => "New Value", 
      cell: ({ row }) => (
        <div className="text-xs sm:text-sm text-gray-900 font-medium">₨ {row.original.new_value}</div>
      )
    },
    { 
      accessorKey: "Amount Added", 
      header: () => "Amount Added", 
      cell: ({ row }) => {
        const amount = parseFloat(row.original.amount_added);
        const isPositive = amount >= 0;
        return (
          <div className={`text-xs sm:text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}₨ {Math.abs(amount).toFixed(2)}
          </div>
        );
      }
    },
  ], []);

  // ── Export endpoint ──────────────────────────────────────────────────────
  const exportEndpoint = useMemo(() => {
    if (!selectedCustomer) return null;
    
    const params = new URLSearchParams();
    if (selectedField && selectedField !== "") {
      params.append("field", selectedField);
    }
    if (filters.start_date) params.append("dateFrom", filters.start_date);
    if (filters.end_date) params.append("dateTo", filters.end_date);
    
    return `${apiEndpoints.getcustomerinfo(selectedCustomer.phone)}?${params.toString()}`;
  }, [selectedCustomer, selectedField, filters.start_date, filters.end_date]);

  const { finalCredit, finalAdvance } = calculateFinalValues();

  // ── Derived due modal values ─────────────────────────────────────────────
  const selectedDueCount = Object.keys(selectedDueInvoices).length;
  const selectedDueTotal = Object.values(selectedDueInvoices)
    .reduce((sum, inv) => sum + (Number(inv.remaining_amount) || 0), 0);
  const allDuesSelected = pendingDues.length > 0 &&
    pendingDues.every(inv => selectedDueInvoices[inv.invoice_no]);

  // ── Advance locked when credit > 0 ──────────────────────────────────────
  const isAdvanceLocked = !!(editingCustomer?.credit > 0);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* Export Button - Only in Detail View */}
      {selectedCustomer && exportEndpoint && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
          <ExportReports 
            endpoint={exportEndpoint} 
            data={detailData} 
            reportType="Customer History" 
            loading={loadingDetail} 
            setLoading={setLoadingDetail} 
            setError={setError} 
          />
        </div>
      )}

      {/* Success / Error Messages */}
      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          className="mb-4 mx-2 sm:mx-4"
        />
      )}

      {error && (
        <Alert
          variant="error"
          message={error}
          action={error.includes("Phone number") ? null : handleRetry}
          actionLabel="Retry"
          onClose={() => setError(null)}
          className="mb-4 mx-2 sm:mx-4"
        />
      )}

      {/* ── DETAIL VIEW ─────────────────────────────────────────────────── */}
      {selectedCustomer ? (
        <>
          <div className="mb-6 flex flex-row items-center justify-between px-2 sm:px-4">
            <Button
              variant="secondary"
              onClick={handleBack}
              className="inline-flex items-center gap-2 w-full sm:w-auto"
              title="Back to Customer List"
            >
              <span>←</span>
              <span className="hidden sm:inline">Back to Customer List</span>
            </Button>
          </div>

          <Card className="mb-6 mx-2 sm:mx-4" bodyClassName="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">Customer History</h2>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    <span className="font-medium">Customer:</span>{' '}
                    <span className="font-semibold text-green-700">
                      {selectedCustomer.customer_name} ({selectedCustomer.phone})
                    </span>
                    {selectedBranch && (
                      <span className="ml-2 sm:ml-4 block sm:inline">
                        <span className="font-medium">Branch:</span>{' '}
                        <span className="font-semibold text-blue-700">
                          {selectedBranch.business_name}
                        </span>
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-row gap-2 sm:gap-4 justify-end">
                <div className="text-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 rounded-lg flex-1 sm:flex-none">
                  <p className="text-xs text-blue-700 whitespace-nowrap">Total Credit</p>
                  <p className="text-base sm:text-xl font-bold text-blue-800">
                    ₨ {selectedCustomer.credit?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="text-center px-3 sm:px-4 py-1.5 sm:py-2 bg-green-50 rounded-lg flex-1 sm:flex-none">
                  <p className="text-xs text-green-700 whitespace-nowrap">Records</p>
                  <p className="text-base sm:text-xl font-bold text-green-800">
                    {paginationDetail.total}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <HomeTable
            data={detailData}
            columns={detailColumns}
            loading={loadingDetail}
            pagination={paginationDetail}
            onPaginationChange={handlePaginationDetail}
            serverSideFiltering={true}
            filterFields={detailFilterFields}
            onFilterChange={handleFilterChange}
            error={error}
            onRetry={handleRetry}
            hideDefaultActions
            noDataMessage="No history records found for this customer"
          />
        </>
      ) : (
        /* ── SUMMARY VIEW ───────────────────────────────────────────────── */
        <>
          <Card className="mb-6 mx-2 sm:mx-4" bodyClassName="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
              {dynamicTitle}
              <Button
                variant="primary"
                onClick={handlePageRefresh}
                loading={loadingSummary}
                loadingText="Refreshing..."
                className="hidden sm:flex items-center justify-center gap-2 text-sm px-4 py-2"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Refresh</span>
              </Button>
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
            noDataMessage="Enter a phone number to search customers"
          />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          PENDING DUE MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {showDueModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[95vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <div>
                <h3 className="font-bold text-lg sm:text-xl text-gray-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-600" />
                  Pending Dues
                </h3>
                {dueModalCustomer && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    {dueModalCustomer.customer_name} — {dueModalCustomer.phone}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowDueModal(false);
                  setDueModalCustomer(null);
                  setPendingDues([]);
                  setSelectedDueInvoices({});
                  setClearDueResult(null);
                  setDueError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">

              {/* Due Error */}
              {dueError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414z" clipRule="evenodd" />
                  </svg>
                  {dueError}
                </div>
              )}

              {/* Loading State */}
              {loadingDues ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <p className="text-sm text-gray-500">Fetching pending dues…</p>
                </div>
              ) : pendingDues.length === 0 && !dueError ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                  <Wallet className="w-12 h-12 opacity-30" />
                  <p className="text-sm">No pending dues found for this customer.</p>
                </div>
              ) : pendingDues.length > 0 ? (
                <>
                  {/* Payment Settings */}
                  <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">Payment Type</label>
                      <select
                        value={globalPaymentType}
                        onChange={(e) => setGlobalPaymentType(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      >
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CHEQUE">Cheque</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">Notes</label>
                      <input
                        type="text"
                        value={globalNotes}
                        onChange={(e) => setGlobalNotes(e.target.value)}
                        placeholder="e.g. Full payment"
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Invoice Table */}
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-amber-50 border-b border-amber-200">
                          <th className="px-3 py-3 font-semibold text-gray-700">
                            <input
                              type="checkbox"
                              checked={allDuesSelected}
                              onChange={handleSelectAllDues}
                              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                          </th>
                          <th className="px-3 py-3 font-semibold text-gray-700">Invoice No</th>
                          <th className="px-3 py-3 font-semibold text-gray-700">Date</th>
                          <th className="px-3 py-3 font-semibold text-gray-700">Total Amount</th>
                          <th className="px-3 py-3 font-semibold text-gray-700">Paid</th>
                          <th className="px-3 py-3 font-semibold text-gray-700 text-red-700">Remaining Due</th>
                          <th className="px-3 py-3 font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pendingDues.map((inv) => {
                          const isSelected = !!selectedDueInvoices[inv.invoice_no];
                          const remaining = Number(inv.remaining_amount) || 0;
                          const total = Number(inv.total_amount) || 0;
                          const paid = Number(inv.paid_amount) || 0;

                          return (
                            <tr
                              key={inv.invoice_no}
                              className={`transition-colors cursor-pointer ${
                                isSelected ? "bg-amber-50" : "hover:bg-gray-50"
                              }`}
                              onClick={() => handleToggleDueInvoice(inv)}
                            >
                              <td className="px-3 py-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleDueInvoice(inv)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                />
                              </td>
                              <td className="px-3 py-3 font-medium text-gray-900">
                                {inv.invoice_no || "—"}
                              </td>
                              <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                                {inv.date
                                  ? new Date(inv.date).toLocaleDateString()
                                  : "—"}
                              </td>
                              <td className="px-3 py-3 text-gray-700">
                                ₨ {total.toFixed(2)}
                              </td>
                              <td className="px-3 py-3 text-gray-700">
                                ₨ {paid.toFixed(2)}
                              </td>
                              <td className="px-3 py-3 font-bold text-red-600">
                                ₨ {remaining.toFixed(2)}
                              </td>
                              <td className="px-3 py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  Pending
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            {pendingDues.length > 0 && (
              <div className="border-t p-4 sm:p-6 bg-gray-50 rounded-b-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Selection summary */}
                  <div className="text-xs sm:text-sm text-gray-600">
                    {selectedDueCount > 0 ? (
                      <span>
                        <span className="font-semibold text-amber-700">{selectedDueCount}</span> invoice(s) selected —{" "}
                        <span className="font-semibold text-gray-900">₨ {selectedDueTotal.toFixed(2)}</span> will be cleared
                      </span>
                    ) : (
                      <span className="text-gray-400">Select invoices to clear</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDueModal(false);
                        setDueModalCustomer(null);
                        setPendingDues([]);
                        setSelectedDueInvoices({});
                        setClearDueResult(null);
                        setDueError(null);
                      }}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition text-sm"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleClearDues}
                      disabled={selectedDueCount === 0 || isClearingDues}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isClearingDues ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          Clearing…
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4" />
                          Clear {selectedDueCount > 0 ? `(${selectedDueCount})` : "Selected"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          UPDATE CUSTOMER MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-8 border border-gray-200 max-w-3xl w-full max-h-[95vh] sm:max-h-[85vh] overflow-y-auto">
            <h3 className="font-bold text-xl sm:text-2xl mb-4 sm:mb-8 text-center text-gray-900">
              Update Customer Details
            </h3>
            <form onSubmit={handleSubmitUpdate}>
              {/* Row 1 - Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={updateFormData.customer_name || editingCustomer?.customer_name || ""}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, customer_name: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                    placeholder="Enter customer name"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={updateFormData.phone || editingCustomer?.phone || ""}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, phone: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                    placeholder="e.g., 03454128218"
                    disabled
                  />
                </div>
              </div>

              {/* Row 2 - Type & Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">Customer Type</label>
                  <InputSelect
                    name="customer_type"
                    value={updateFormData.customer_type || editingCustomer?.customer_type || ""}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, customer_type: e.target.value })}
                    className="w-full"
                    inputClassName="text-sm sm:text-base py-2 sm:py-3"
                  >
                    <option value="">Select Type</option>
                    <option value={CustomerType.WALK_IN}>Walk-in</option>
                    <option value={CustomerType.REGULAR}>Regular</option>
                    <option value={CustomerType.CREDIT}>Credit</option>
                    <option value={CustomerType.CORPORATE}>Corporate</option>
                  </InputSelect>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">Discount (%)</label>
                  <input
                    type="number"
                    value={updateFormData.discount}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, discount: parseFloat(e.target.value) || 0 })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0-100"
                  />
                </div>
              </div>

              {/* Row 3 - Current Balances */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">Current Credit Balance</label>
                  <p className="text-base sm:text-lg font-bold text-red-600 bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200">
                    ₨ {editingCustomer?.credit?.toFixed(2) || "0.00"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">Current Advance Balance</label>
                  <p className="text-base sm:text-lg font-bold text-green-600 bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                    ₨ {editingCustomer?.advance_amount?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>

              {/* Row 4 - New Advance + View Dues shortcut */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* New Advance Amount — locked when credit > 0 */}
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">New Advance Amount</label>
                  <input
                    type="text"
                    value={
                      updateFormData.advance_amount === 0 && updateFormData.advance_amount !== undefined
                        ? ""
                        : updateFormData.advance_amount
                    }
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                      setUpdateFormData({ ...updateFormData, advance_amount: value || 0 });
                    }}
                    disabled={isAdvanceLocked}
                    className={`block w-full border rounded-md shadow-sm p-2 sm:p-3 text-sm sm:text-base transition duration-150 ${
                      isAdvanceLocked
                        ? "border-red-300 bg-red-50 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    step="0.01"
                    min="0"
                    placeholder={isAdvanceLocked ? "Clear dues first" : "Enter new advance amount"}
                  />

                  {isAdvanceLocked ? (
                    /* ── Warning: credit > 0, advance locked ── */
                    <div className="flex items-start gap-2 mt-1 p-2.5 bg-red-50 border border-red-200 rounded-md">
                      <svg
                        className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-xs text-red-700 font-medium leading-relaxed">
                        Please clear the pending due of{" "}
                        <span className="font-bold">₨ {editingCustomer.credit.toFixed(2)}</span> first before
                        adding an advance.{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setShowModal(false);
                            handleDueClick({ original: editingCustomer });
                          }}
                          className="underline text-red-700 hover:text-red-900 font-semibold whitespace-nowrap"
                        >
                          Click here to clear dues →
                        </button>
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      This amount will be added to the current advance balance.
                    </p>
                  )}
                </div>

                {/* View Pending Dues shortcut */}
                <div className="flex flex-col justify-end space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 opacity-0 select-none">
                    &nbsp;
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      handleDueClick({ original: editingCustomer });
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-amber-300 bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 hover:border-amber-500 transition text-xs sm:text-sm font-semibold w-full"
                  >
                    <Wallet className="w-4 h-4 flex-shrink-0" />
                    View Pending Dues
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    View &amp; clear outstanding invoices
                  </p>
                </div>
              </div>

              {/* Final Values Preview */}
              <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-blue-50 rounded-xl border border-blue-200">
                <div className="space-y-4">
                  <p className="text-sm sm:text-base font-semibold text-gray-700">
                    Credit &amp; Advance Adjustment
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Final Discount</p>
                      <p className="text-base sm:text-xl font-bold text-purple-700">
                        {updateFormData.discount}%
                      </p>
                    </div>
                    <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Final Credit</p>
                      <p className="text-base sm:text-xl font-bold text-blue-700">₨ {finalCredit.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Final Advance</p>
                      <p className="text-base sm:text-xl font-bold text-blue-700">₨ {finalAdvance.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
                  }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2 text-sm sm:text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span>Updating...</span>
                    </>
                  ) : (
                    "Update Customer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {showDeleteModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 border border-gray-200 max-w-md w-full">
            <h3 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-center text-gray-900">
              Confirm Removal
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 leading-relaxed text-center">
              You are about to delete customer with phone{" "}
              <strong className="text-red-600">{selectedDeleteCustomer?.phone}</strong>. This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300 transition text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isDeleting && (
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                )}
                Confirm Removal
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}