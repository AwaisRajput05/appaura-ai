import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import HomeTable from "../../../common/table/Table";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/apiEndpoints";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { getVendorChildIds } from "../../../../services/vendorUtils";
import { useAuth } from "../../../auth/hooks/useAuth";
import ExportReports from "../../../common/reports/ExportReports";
import { ShoppingCart, Package, RefreshCw, Eye, Calendar } from "lucide-react";
import { SALES_MODULE_CONSTANTS } from "././salesconstants/salesModuleConstants";

// UI Components
import Button from "../../../../components/ui/forms/Button";
import Card from "../../../../components/ui/Card";
import Alert from "../../../../components/ui/feedback/Alert";
import InputText from "../../../../components/ui/forms/InputText";
import InputSelect from "../../../../components/ui/forms/InputSelect";
import DatePicker from "../../../../components/ui/forms/DatePicker";

// Payment type formatting
const formatPaymentType = (paymentType) => {
  if (!paymentType || paymentType === "N/A") return "N/A";
  return paymentType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// HoverTooltip — FIXED: removed stray fragment
const HoverTooltip = ({ preview, full, title, items = [], invoice_no }) => {
  const actualPreview = preview || (items.length > 0 ? `${items.length} items` : "—");
  
  let content;
  if (items.length > 0) {
    content = (
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border-b font-bold text-gray-800">Name</th>
            <th className="px-4 py-2 border-b font-bold text-gray-800">Strength</th>
            <th className="px-4 py-2 border-b font-bold text-gray-800">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {items.map((drug, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b text-gray-900">{drug.name}</td>
              <td className="px-4 py-2 border-b text-gray-900">{drug.strength || "—"}</td>
              <td className="px-4 py-2 border-b text-gray-900">{drug.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  } else if (full && full !== "—" && full !== actualPreview) {
    content = <p className="text-gray-900 text-center font-medium">{full}</p>;
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

  const tooltipTitle = invoice_no ? `${title} for Invoice ${invoice_no}` : title;

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
        <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-none">
          <div
            onMouseEnter={open}
            onMouseLeave={close}
            className="bg-white rounded-xl shadow-2xl p-6 border border-gray-300 max-w-md max-h-[80vh] overflow-y-auto pointer-events-auto"
          >
            <h3 className="font-bold text-lg mb-4 text-center text-gray-800 border-b pb-3">
              {tooltipTitle}
            </h3>
            {content}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const formatLocalDateTime = SALES_MODULE_CONSTANTS.formatLocalDateTime;

const formatDateDisplay = (dateString) => {
  if (!dateString || dateString === "") return "Not set";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export default function ViewSales() {
  const summaryControllerRef = useRef(null);
  const detailControllerRef = useRef(null);
  const fetchTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const { user } = useAuth();

  const [summaryData, setSummaryData] = useState([]);
  const [detailData, setDetailData] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);
  const [dateError, setDateError] = useState("");

  const { startOfMonth, today } = SALES_MODULE_CONSTANTS.getDefaultDates();

  const [filters, setFilters] = useState({ 
    from_date: startOfMonth, 
    to_date: today, 
    item: "",
    payment_type: "",
    order_type: ""
  });
  const [paginationSummary, setPaginationSummary] = useState({ page: 1, page_size: 10, total: 0 });
  const [paginationDetail, setPaginationDetail] = useState({ page: 1, page_size: 10, total: 0 });

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedBranchValue, setSelectedBranchValue] = useState("all");
  const [selectedTotalSales, setSelectedTotalSales] = useState(0);
  const [selectedTotalTransactions, setSelectedTotalTransactions] = useState(0);

  const { 
    currentVendorId, 
    originalBranchId, 
    isMaster, 
    currentBusinessName 
  } = SALES_MODULE_CONSTANTS.getUserInfo(user);

  const childVendors = useMemo(() => getVendorChildIds() || [], []);
  const childIds = useMemo(() => childVendors.map(v => v.vendor_id).filter(Boolean), [childVendors]);

  const branchOptions = useMemo(() => {
    const options = [{ value: "all", label: "All Branches" }];
    if (isMaster) {
      options.push({ value: currentVendorId, label: currentBusinessName });
    }
    childVendors.forEach(item => {
      options.push({ value: item.vendor_id, label: item.business_name || `Branch ${item.branch_id}` });
    });
    return options;
  }, [isMaster, currentVendorId, childVendors, currentBusinessName]);

  // Helper function to get valid dates (defaults if empty)
  const getValidDates = useCallback((fromDate, toDate) => {
    const defaultDates = SALES_MODULE_CONSTANTS.getDefaultDates();
    return {
      from_date: fromDate && fromDate !== "" ? fromDate : defaultDates.startOfMonth,
      to_date: toDate && toDate !== "" ? toDate : defaultDates.today
    };
  }, []);

  // Reset all filters to default
  const handleResetAllFilters = useCallback(() => {
    const defaultDates = SALES_MODULE_CONSTANTS.getDefaultDates();
    setFilters({ 
      from_date: defaultDates.startOfMonth, 
      to_date: defaultDates.today, 
      item: "",
      payment_type: "",
      order_type: ""
    });
    setSelectedBranchValue("all");
    setPaginationSummary(prev => ({ ...prev, page: 1 }));
    setPaginationDetail(prev => ({ ...prev, page: 1 }));
    setDateError("");
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (summaryControllerRef.current) summaryControllerRef.current.abort();
      if (detailControllerRef.current) detailControllerRef.current.abort();
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, []);

  // Fetch summary (branch list)
  const fetchSummary = useCallback(async (overrideFilters = null, overrideBranchValue = null) => {
    if (selectedVendor) return;

    if (summaryControllerRef.current) summaryControllerRef.current.abort();
    summaryControllerRef.current = new AbortController();

    const vendorId = currentVendorId;
    if (!vendorId) {
      setError("Vendor ID not found");
      setSummaryData([]);
      if (isMountedRef.current) setLoadingSummary(false);
      return;
    }

    const currentFilters = overrideFilters || filters;
    const currentBranchValue = overrideBranchValue || selectedBranchValue;

    // Get valid dates (use defaults if empty)
    const { from_date: validFromDate, to_date: validToDate } = getValidDates(
      currentFilters.from_date, 
      currentFilters.to_date
    );

    // Validate date range
    if (validFromDate && validToDate && new Date(validFromDate) > new Date(validToDate)) {
      setDateError("From date cannot be after to date.");
      if (isMountedRef.current) setLoadingSummary(false);
      return;
    }

    let vendorIds;
    if (currentBranchValue === "all") {
      vendorIds = [currentVendorId, ...childIds].filter(Boolean);
    } else {
      vendorIds = [currentBranchValue];
    }

    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);

    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        if (!isMountedRef.current) return;
        setLoadingSummary(true);
        setError(null);
        setDateError("");

        const endpoint = apiEndpoints.vendorsSaleTransaction();
        const token = getToken();
        
        const payload = {
          vendor_ids: vendorIds,
          page: paginationSummary.page,
          page_size: paginationSummary.page_size,
          from_date: validFromDate,
          to_date: validToDate,
        };

        if (currentFilters.item?.trim()) payload.item = currentFilters.item.trim();
        if (currentFilters.payment_type) payload.payment_type = currentFilters.payment_type;

        const headers = SALES_MODULE_CONSTANTS.getAuthHeaders(token);
        headers["X-Vendor-ID"] = vendorId;

        if (currentBranchValue !== "all") {
          let branchId;
          if (currentBranchValue === currentVendorId) {
            branchId = originalBranchId;
          } else {
            branchId = childVendors.find(v => v.vendor_id === currentBranchValue)?.branch_id || '';
          }
          if (branchId) headers[SALES_MODULE_CONSTANTS.HEADER_KEYS.USER_BRANCH_ID] = branchId;
          if (currentBranchValue !== currentVendorId) headers[SALES_MODULE_CONSTANTS.HEADER_KEYS.CHILD_ID] = currentBranchValue;
        }

        const { data } = await apiService.post(endpoint, payload, { 
          headers,
          signal: summaryControllerRef.current.signal 
        });

        if (!isMountedRef.current) return;

        const mapped = (data.data || []).map(item => ({
          id: item.vendor_id,
          business_name: item.business_name || "N/A",
          branch_id: item.branch_id || "N/A",
          businessName: item.business_name || "N/A",
          transaction_count: item.transaction_count || 0,
          payment_type: item.payment_type || "N/A",
          total_amount: Number(item.total_amount) || 0,
          last_transaction: Number(item.total) || 0,
          date_time: formatLocalDateTime(item.date_time),
          raw_date_time: item.date_time,
          is_master: item.vendor_id === currentVendorId,
        })).sort((a, b) => (a.is_master && !b.is_master) ? -1 : 1);

        setSummaryData(mapped);
        setPaginationSummary(p => ({ ...p, total: data.count || 0 }));
      } catch (err) {
        if (!isMountedRef.current) return;
        if (err.name === 'AbortError') return;
        setError(SALES_MODULE_CONSTANTS.getErrorMessage(err));
        setSummaryData([]);
        setPaginationSummary(p => ({ ...p, total: 0 }));
      } finally {
        if (isMountedRef.current) setLoadingSummary(false);
      }
    }, 500);
  }, [
    selectedVendor, currentVendorId, childIds, paginationSummary.page, paginationSummary.page_size,
    originalBranchId, childVendors, filters, selectedBranchValue, getValidDates
  ]);

  // Fetch detail (transactions) - includes order_type filter
  const fetchDetail = useCallback(async () => {
    if (!selectedVendor || !selectedBranch) return;

    if (detailControllerRef.current) detailControllerRef.current.abort();
    detailControllerRef.current = new AbortController();

    try {
      if (!isMountedRef.current) return;
      setLoadingDetail(true); 
      setError(null); 
      setDateError("");

      // Get valid dates (use defaults if empty)
      const { from_date: validFromDate, to_date: validToDate } = getValidDates(
        filters.from_date, 
        filters.to_date
      );

      if (validFromDate && validToDate && new Date(validFromDate) > new Date(validToDate)) {
        setDateError("From date cannot be after to date.");
        if (isMountedRef.current) setLoadingDetail(false);
        return;
      }

      const token = getToken();
      const params = new URLSearchParams();
      params.append("page", paginationDetail.page);
      params.append("page_size", paginationDetail.page_size);
      params.append("from_date", validFromDate);
      params.append("to_date", validToDate);
      
      if (filters.item?.trim()) params.append("item", filters.item.trim());
      if (filters.payment_type) params.append("payment_type", filters.payment_type);
      
      // Add order_type filter if selected
      if (filters.order_type && filters.order_type !== "") {
        params.append("order_type", filters.order_type);
      }

      const base = apiEndpoints.vendorViewTransaction(selectedVendor, filters.payment_type || "");
      const separator = base.includes('?') ? '&' : '?';
      const endpoint = `${base}${separator}${params.toString()}`;

      const headers = SALES_MODULE_CONSTANTS.getAuthHeaders(token);
      headers["X-Vendor-ID"] = selectedBranch.is_master ? selectedVendor : currentVendorId;

      let branchId = selectedBranch.branch_id || (selectedBranch.is_master ? originalBranchId : '');
      if (branchId) headers[SALES_MODULE_CONSTANTS.HEADER_KEYS.USER_BRANCH_ID] = branchId;
      if (!selectedBranch.is_master) headers[SALES_MODULE_CONSTANTS.HEADER_KEYS.CHILD_ID] = selectedVendor;

      const { data } = await apiService.get(endpoint, { 
        headers,
        signal: detailControllerRef.current.signal 
      });

      if (!isMountedRef.current) return;

      const mapped = (data.data || []).map(item => {
        const drugs = (item.drug_details || []).map(d => ({
          name: d.name || "Unknown",
          strength: d.strength || "",
          quantity: d.quantity || 0,
          payment_type: d.payment_type || "N/A",
          retail_price: Number(d.retail_price || d.price || 0),
        }));

        return {
          id: item._id,
          invoice_no: item.invoice_no || "N/A",
          cashier_name: item.cashier_name || "Cashier",
          total: Number(item.total) || 0,
          raw_date_time: item.date_time,
          display_date_time: formatLocalDateTime(item.date_time),
          drug_details: drugs,
          payment_type: item.payment_type || "N/A",
          order_type: item.order_type || "physical",
        };
      });

      setDetailData(mapped);
      setPaginationDetail(p => ({ ...p, total: data.pagination?.total_records || mapped.length }));
    } catch (err) {
      if (!isMountedRef.current) return;
      if (err.name === 'AbortError') return;
      setError(SALES_MODULE_CONSTANTS.getErrorMessage(err));
      setDetailData([]);
    } finally {
      if (isMountedRef.current) setLoadingDetail(false);
    }
  }, [
    selectedVendor, selectedBranch, filters.from_date, filters.to_date, 
    filters.item, filters.payment_type, filters.order_type,
    paginationDetail.page, paginationDetail.page_size, currentVendorId, originalBranchId,
    getValidDates
  ]);

  // Effects
  useEffect(() => {
    if (!selectedVendor) {
      // Ensure dates are valid before fetching
      const hasValidDates = filters.from_date && filters.to_date;
      if (!hasValidDates) {
        const defaultDates = SALES_MODULE_CONSTANTS.getDefaultDates();
        if (!filters.from_date) {
          setFilters(prev => ({ ...prev, from_date: defaultDates.startOfMonth }));
        }
        if (!filters.to_date) {
          setFilters(prev => ({ ...prev, to_date: defaultDates.today }));
        }
        return;
      }
      fetchSummary();
    }
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      if (summaryControllerRef.current) summaryControllerRef.current.abort();
    };
  }, [
    selectedVendor, paginationSummary.page, paginationSummary.page_size,
    filters.from_date, filters.to_date, filters.item, filters.payment_type,
    selectedBranchValue, fetchSummary
  ]);

  useEffect(() => {
    if (selectedVendor && selectedBranch) {
      // Ensure dates are valid before fetching
      const hasValidDates = filters.from_date && filters.to_date;
      if (!hasValidDates) {
        const defaultDates = SALES_MODULE_CONSTANTS.getDefaultDates();
        if (!filters.from_date) {
          setFilters(prev => ({ ...prev, from_date: defaultDates.startOfMonth }));
        }
        if (!filters.to_date) {
          setFilters(prev => ({ ...prev, to_date: defaultDates.today }));
        }
        return;
      }
      fetchDetail();
    }
  }, [selectedVendor, selectedBranch, fetchDetail]);

  useEffect(() => {
    if (selectedVendor && selectedBranch) {
      // Ensure dates are valid before fetching
      const hasValidDates = filters.from_date && filters.to_date;
      if (!hasValidDates) {
        const defaultDates = SALES_MODULE_CONSTANTS.getDefaultDates();
        if (!filters.from_date) {
          setFilters(prev => ({ ...prev, from_date: defaultDates.startOfMonth }));
        }
        if (!filters.to_date) {
          setFilters(prev => ({ ...prev, to_date: defaultDates.today }));
        }
        return;
      }
      fetchDetail();
    }
  }, [
    filters.from_date, filters.to_date, filters.item, filters.payment_type, filters.order_type,
    paginationDetail.page, paginationDetail.page_size, fetchDetail
  ]);

  const handleFilterChange = useCallback((name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    
    if (name === "branch") {
      setSelectedBranchValue(value || "all");
      setPaginationSummary(p => ({ ...p, page: 1 }));
      return;
    }
    
    // Clear date error when user changes dates
    if (name === "from_date" || name === "to_date") {
      setDateError("");
    }
    
    if (selectedVendor) {
      setPaginationDetail(p => ({ ...p, page: 1 }));
    } else {
      setPaginationSummary(p => ({ ...p, page: 1 }));
    }
  }, [selectedVendor]);

  const handleViewClick = (row) => {
    const original = row.original;
    const branchId = original.branch_id;
    const isMasterRow = original.is_master;
    const businessName = original.business_name;

    if (isMasterRow) {
      setSelectedVendor(currentVendorId);
      setSelectedBranch({ is_master: true, business_name: businessName || currentBusinessName });
    } else {
      const branch = childVendors.find(v => v.branch_id === branchId);
      if (branch) {
        setSelectedVendor(branch.vendor_id);
        setSelectedBranch({ ...branch, business_name: businessName });
      } else if (childVendors.length === 0) {
        setSelectedVendor(currentVendorId);
        setSelectedBranch({
          is_master: false,
          business_name: businessName || currentBusinessName,
          branch_id: branchId
        });
      } else {
        setError("Branch not found");
        return;
      }
    }
    setSelectedTotalSales(original.total_amount);
    setSelectedTotalTransactions(original.transaction_count);
    setPaginationDetail({ page: 1, page_size: 10, total: 0 });
  };

  const handleBack = () => {
    setSelectedVendor(null);
    setSelectedBranch(null);
    setDetailData([]);
    handleResetAllFilters(); // Use the reset function instead of manually setting
    setPaginationDetail({ page: 1, page_size: 10, total: 0 });
  };

  const handlePaginationSummary = (page, pageSize) => setPaginationSummary(p => ({ ...p, page, page_size: pageSize }));
  const handlePaginationDetail = (page, pageSize) => setPaginationDetail(p => ({ ...p, page, page_size: pageSize }));
  const handleRetry = () => { 
    setError(null); 
    setDateError(""); 
    if (selectedVendor) {
      fetchDetail();
    } else {
      fetchSummary();
    }
  };
  
  const handlePageRefresh = () => { 
    if (selectedVendor) {
      fetchDetail();
    } else {
      fetchSummary();
    }
  };

  // Modified filter fields with clear/reset support
  const summaryFilterFields = useMemo(() => [
    {
      type: "dateRange",
      label: "Date Range",
      fromName: "from_date",
      toName: "to_date",
      value: filters,
      onChange: (e) => {
        // If clearing the date field (empty value), reset to defaults
        if (!e.target.value && (e.target.name === "from_date" || e.target.name === "to_date")) {
          const defaultDates = SALES_MODULE_CONSTANTS.getDefaultDates();
          handleFilterChange(e.target.name, e.target.name === "from_date" ? defaultDates.startOfMonth : defaultDates.today);
        } else {
          handleFilterChange(e.target.name, e.target.value);
        }
      },
      className: "date-input-black",
    },
    ...(isMaster || childVendors.length > 0 ? [{
      type: "select",
      name: "branch",
      label: "Branch",
      placeholder: "Select Branch",
      value: selectedBranchValue,
      onChange: (e) => handleFilterChange("branch", e.target.value),
      options: branchOptions,
    }] : []),
    {
      type: "button",
      label: "Reset Filters",
      onClick: handleResetAllFilters,
      variant: "secondary",
      className: "ml-2"
    }
  ], [filters, selectedBranchValue, handleFilterChange, handleResetAllFilters, isMaster, childVendors, branchOptions]);

  const detailFilterFields = useMemo(() => [
    {
      type: "dateRange",
      label: "Date Range",
      fromName: "from_date",
      toName: "to_date",
      value: filters,
      onChange: (e) => {
        // If clearing the date field (empty value), reset to defaults
        if (!e.target.value && (e.target.name === "from_date" || e.target.name === "to_date")) {
          const defaultDates = SALES_MODULE_CONSTANTS.getDefaultDates();
          handleFilterChange(e.target.name, e.target.name === "from_date" ? defaultDates.startOfMonth : defaultDates.today);
        } else {
          handleFilterChange(e.target.name, e.target.value);
        }
      },
      className: "date-input-black",
    },
    {
      type: "select",
      name: "payment_type",
      label: "Payment Type",
      placeholder: "All Payment Types",
      value: filters.payment_type || "",
      onChange: (e) => handleFilterChange("payment_type", e.target.value),
      options: [
        { value: "cash", label: "Cash" },
        { value: "bank_card", label: "Bank Card" },
        { value: "bank_transfer", label: "Bank Transfer" },
        { value: "mobile_wallet", label: "Mobile Wallet" },
        { value: "advance", label: "Advance Payment" },
        { value: "credit", label: "Credit" }
      ]
    },
    {
      type: "select",
      name: "order_type",
      label: "Order Type",
      placeholder: "All Orders",
      value: filters.order_type || "",
      onChange: (e) => handleFilterChange("order_type", e.target.value),
      options: [
        { value: "physical", label: "Physical" },
        { value: "delivery", label: "Delivery" }
      ]
    },
    {
      type: "text",
      label: "Search Medicine",
      name: "item",
      placeholder: "Enter drug name...",
      value: filters.item || "",
      onChange: (e) => handleFilterChange("item", e.target.value),
    },
    {
      type: "button",
      label: "Reset Filters",
      onClick: handleResetAllFilters,
      variant: "secondary",
      className: "ml-2"
    }
  ], [filters, handleFilterChange, handleResetAllFilters]);

  const summaryColumns = useMemo(() => [
    { 
      accessorKey: "business_name", 
      header: () => "Branch Name", 
      cell: ({ row }) => (
        <div className="font-semibold text-blue-700">
          {row.original.business_name}
          {row.original.is_master && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold">Main</span>}
        </div>
      )
    },
    { 
      accessorKey: "transaction_count", 
      header: () => "Transactions", 
      cell: ({ row }) => <div className="text-center font-bold text-indigo-600">{row.original.transaction_count}</div>
    },
    { 
      accessorKey: "total_amount", 
      header: () => "Total Sales", 
      cell: ({ row }) => <div className="font-bold text-green-600">₨ {row.original.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
    },
    { 
      accessorKey: "last_transaction", 
      header: () => "Last Sale", 
      cell: ({ row }) => <div className="font-medium text-orange-600">₨ {row.original.last_transaction.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
    },
    { 
      accessorKey: "last_payment", 
      header: () => "Last Payment Type", 
      cell: ({ row }) => <div className="font-medium">{formatPaymentType(row.original.payment_type)}</div>
    },
    { 
      accessorKey: "date_time", 
      header: () => "Last Transaction", 
      cell: ({ row }) => <div className="text-sm text-gray-600 font-mono">{row.original.date_time}</div>
    },
    { 
      accessorKey: "actions", 
      header: () => <div className="text-center">Action</div>, 
      enableSorting: false, 
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button variant="primary" size="sm" onClick={() => handleViewClick(row)} title="View Details">
            <Eye className="w-5 h-5" />
            View
          </Button>
        </div>
      )
    },
  ], []);

  const detailColumns = useMemo(() => [
    { 
      accessorKey: "Invoice", 
      header: () => "Invoice", 
      cell: ({ row }) => {
        const orderType = row.original.order_type || "physical";
        const orderTypeLabel = orderType === "delivery" ? "Delivery" : "Physical";
        const orderTypeColor = orderType === "delivery" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800";
        return (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-blue-700">{row.original.invoice_no}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${orderTypeColor}`}>
              {orderTypeLabel}
            </span>
          </div>
        );
      } 
    },
    { 
      accessorKey: "Date & Time", 
      header: () => "Date & Time", 
      cell: ({ row }) => <div className="text-sm font-medium text-gray-800 font-mono">{row.original.display_date_time}</div>
    },
    { 
      accessorKey: "Items Sold", 
      header: () => "Items Sold", 
      cell: ({ row }) => <HoverTooltip items={row.original.drug_details} title="Sold Items" invoice_no={row.original.invoice_no} /> 
    },
    { 
      accessorKey: "Total", 
      header: () => "Total", 
      cell: ({ row }) => <div className="font-bold text-green-600">₨ {row.original.total.toFixed(2)}</div> 
    },
    { 
      accessorKey: "Cashier", 
      header: () => "Cashier", 
      cell: ({ row }) => <span className="font-medium">{row.original.cashier_name}</span> 
    },
    { 
      accessorKey: "Payment Type", 
      header: () => "Payment Type", 
      cell: ({ row }) => <span className="font-medium">{formatPaymentType(row.original.payment_type)}</span> 
    },
  ], []);

  const exportEndpoint = useMemo(() => {
    if (!selectedVendor) return null;
    const params = new URLSearchParams({ page: 1, page_size: 5000 });
    
    // Use valid dates for export
    const { from_date: validFromDate, to_date: validToDate } = getValidDates(
      filters.from_date, 
      filters.to_date
    );
    
    params.append("from_date", validFromDate);
    params.append("to_date", validToDate);
    
    if (filters.item?.trim()) params.append("item", filters.item.trim());
    if (filters.payment_type) params.append("payment_type", filters.payment_type);
    if (filters.order_type && filters.order_type !== "") params.append("order_type", filters.order_type);
    
    const base = apiEndpoints.vendorViewTransaction(selectedVendor, filters.payment_type || "");
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}${params}`;
  }, [selectedVendor, filters.from_date, filters.to_date, filters.item, filters.payment_type, filters.order_type, getValidDates]);

  return (
    <div className="relative">
     {selectedVendor && exportEndpoint && (
  <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
    <ExportReports
      data={detailData.map(item => ({
        invoice_no:        item.invoice_no,
        display_date_time: item.display_date_time,
        items_sold:        item.drug_details?.map(d =>
          `${d.name}${d.strength ? ` ${d.strength}` : ''} x${d.quantity}`
        ).join(', ') || '-',
        total:             `Rs. ${item.total.toFixed(2)}`,
        cashier_name:      item.cashier_name,
        payment_type:      formatPaymentType(item.payment_type),
      }))}
      headers={[
        { title: 'Invoice',       key: 'invoice_no'        },
        { title: 'Date & Time',   key: 'display_date_time' },
        { title: 'Items Sold',    key: 'items_sold'        },
        { title: 'Total',         key: 'total'             },
        { title: 'Cashier',       key: 'cashier_name'      },
        { title: 'Payment Type',  key: 'payment_type'      },
        
      ]}
      reportType="Sales Transactions"
      setError={setError}
    />
  </div>
)}

      {error && (
        <Alert variant="error" message={error} action={handleRetry} actionLabel="Retry" onClose={() => setError(null)} className="mb-4" />
      )}
      {dateError && <Alert variant="error" message={dateError} className="mb-4" />}

      {selectedVendor ? (
        <>
          <div className="mb-6 flex flex-row items-center justify-between">
            <Button variant="secondary" onClick={handleBack} className="inline-flex items-center gap-2" title="Back to Summary">
              <span>←</span>
              <span className="hidden sm:inline">Back to Summary</span>
            </Button>
          </div>

          <Card className="mb-6" bodyClassName="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                <Package className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">Transaction Details</h2>
                  {selectedBranch && (
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      <span className="font-medium">Branch:</span>{' '}
                      <span className="font-semibold text-green-700">
                        {selectedBranch.business_name || (selectedBranch.is_master ? currentBusinessName : `Branch ${selectedBranch.branch_id || 'N/A'}`)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-row gap-2 sm:gap-4 justify-end">
                <div className="text-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 rounded-lg flex-1 sm:flex-none">
                  <p className="text-xs text-blue-700 whitespace-nowrap">Transactions</p>
                  <p className="text-base sm:text-xl font-bold text-blue-800">{selectedTotalTransactions}</p>
                </div>
                <div className="text-center px-3 sm:px-4 py-1.5 sm:py-2 bg-green-50 rounded-lg flex-1 sm:flex-none">
                  <p className="text-xs text-green-700 whitespace-nowrap">Total Sales</p>
                  <p className="text-base sm:text-xl font-bold text-green-800">₨ {selectedTotalSales.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>

          <HomeTable
            title="Transaction Details"
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
          />
        </>
      ) : (
        <>
          <Card className="mb-6" bodyClassName="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">Branch Sales</h2>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2">
                <Button variant="primary" onClick={handlePageRefresh} loading={loadingSummary} loadingText="Refreshing..." className="hidden sm:flex items-center justify-center gap-2 text-sm px-4 py-2" title="Refresh">
                  <RefreshCw className="w-5 h-5" />
                  <span>Refresh</span>
                </Button>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md w-full sm:w-auto">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                  <span className="font-medium hidden sm:inline">Showing data from:</span>
                  <span className="text-blue-700 font-semibold whitespace-nowrap">{formatDateDisplay(filters.from_date)}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-blue-700 font-semibold whitespace-nowrap">{formatDateDisplay(filters.to_date)}</span>
                </div>
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
            noDataMessage="No sales data found"
          />
        </>
      )}
    </div>
  );
}