// allinvoices.jsx - REFACTORED WITH CONSTANTS + DELIVERY INFO & FINANCIAL SUMMARY POPUPS
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from "react-dom";
import { Printer, Eye } from 'lucide-react';

// Custom Components & Services
import { useAuth } from '../../../auth/hooks/useAuth';
import HomeTable from '../../../common/table/table3';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import { getToken } from '../../../../services/tokenUtils';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/endpoint/salespoint/salespointend';
import ExportReports from '../../../common/reports/ExportReports';
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { printReceipt } from "../../../../services/receiptPrinter";
import { registerHotkey, unregisterHotkey } from '../../../../services/keyboardService';

// Constants
import { SALES_POINT_CONSTANTS } from '././salescosntant/salesPointConstants';

// ===================== POPUP COMPONENTS =====================

const PopupModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-[999999] p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

const DeliveryInfoPopup = ({ invoice }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Safely extract values with fallbacks
  const deliveryAddress = invoice?.delivery_address || null;
  const deliveryCharges = typeof invoice?.delivery_charges === 'number' ? invoice.delivery_charges : 0;
  const customerNotes = invoice?.customer_notes || null;
  
  const hasDeliveryInfo = deliveryAddress || deliveryCharges > 0 || customerNotes;
  
  if (!hasDeliveryInfo) {
    return <span className="text-gray-400 text-sm">—</span>;
  }
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1 text-blue-600 hover:text-blue-800 transition"
        title="View Delivery Info"
      >
        <Eye className="w-4 h-4" />
      </button>
      <PopupModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Delivery Information">
        <div className="space-y-3">
          {deliveryAddress && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Delivery Address</label>
              <p className="text-sm text-gray-800 mt-1 break-words">{deliveryAddress}</p>
            </div>
          )}
          {deliveryCharges > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Delivery Charges</label>
              <p className="text-sm font-medium text-gray-800">₨ {deliveryCharges.toFixed(2)}</p>
            </div>
          )}
          {customerNotes && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Customer Notes</label>
              <p className="text-sm text-gray-800 mt-1 italic">"{customerNotes}"</p>
            </div>
          )}
        </div>
      </PopupModal>
    </>
  );
};

const FinancialSummaryPopup = ({ invoice }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Safely extract numeric values
  const amountPaid = typeof invoice?.total === 'number' ? invoice.total : 0;
  const invoiceTotal = typeof invoice?.invoice_total === 'number' ? invoice.invoice_total : 0;
  const advanceUsed = typeof invoice?.advance_used === 'number' ? invoice.advance_used : 0;
  const dueAmount = typeof invoice?.due_amount === 'number' ? invoice.due_amount : 0;
  const gstPercent = typeof invoice?.gst_percentage === 'number' ? invoice.gst_percentage : 0;
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1 text-green-600 hover:text-green-800 transition"
        title="View Payment Summary"
      >
        <Eye className="w-4 h-4" />
      </button>
      <PopupModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Payment Summary">
        <div className="space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-sm font-semibold text-gray-600">Amount Paid</span>
            <span className="text-lg font-bold text-green-700">₨ {amountPaid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-sm font-semibold text-gray-600">Invoice Total</span>
            <span className="text-lg font-medium text-gray-800">₨ {invoiceTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-sm font-semibold text-gray-600">Advance Used</span>
            <span className="text-md text-blue-700">₨ {advanceUsed.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-sm font-semibold text-gray-600">Due / Credit</span>
            <span className={`text-md font-medium ${dueAmount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
              ₨ {dueAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600">GST %</span>
            <span className="text-md text-gray-700">{gstPercent}%</span>
          </div>
        </div>
      </PopupModal>
    </>
  );
};

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
// ===================== MAIN COMPONENT =====================
export default function AllInvoices() {
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  const exportRef = useRef(null);
  
  const { user } = useAuth();
  
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    invoice_no: "",
    from_date: "",
    to_date: "",
    amount: "",
    operator: "lte",
    phone_no: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedChildVendorId, setSelectedChildVendorId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const { 
    currentVendorId, 
    originalBranchId, 
    isMaster, 
    currentBusinessName 
  } = SALES_POINT_CONSTANTS.getUserInfo(user);
  
  const childVendors = getVendorChildIds() || [];
  
  const fullBranchOptions = useMemo(() => 
    SALES_POINT_CONSTANTS.getBranchOptions(user, childVendors), 
    [childVendors, user]
  );

  // Initialize branch
  useEffect(() => {
    setSelectedBranch(currentBusinessName);
    setSelectedValue('current');
    setSelectedChildVendorId('');
    setSelectedBranchId(originalBranchId);
  }, [originalBranchId, currentBusinessName]);

  // Register Ctrl+P → trigger PDF export
  useEffect(() => {
    registerHotkey('ctrl+p', () => {
      exportRef.current?.triggerExport('pdf');
    }, { id: 'allinvoices-export-pdf', label: 'Export PDF' });

    return () => {
      unregisterHotkey('allinvoices-export-pdf');
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (controllerRef.current) controllerRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const dynamicTitle = useMemo(() => {
    const branchLabel = selectedBranch || currentBusinessName;
    const isCurrent = selectedValue === 'current';
    
    return (
     <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
  <div className="flex items-center gap-2 sm:gap-3">
    <span className="text-xl sm:text-2xl font-bold text-gray-800 truncate max-w-[200px] sm:max-w-full">
      Paid Invoices
    </span>
  </div>
  <span className="hidden sm:inline text-gray-500">—</span>
  <span className={`
    inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm w-fit
    ${isCurrent
      ? 'bg-green-100 text-green-800 border border-green-300'
      : 'bg-blue-100 text-blue-800 border border-blue-300'
    }
  `}>
    {isCurrent ? currentBusinessName : `Branch: ${branchLabel}`}
  </span>
  
  {/* New badge for delivery charges */}
  <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-300 shadow-sm w-fit">
    ⚠️ Delivery Charges are not included in Invoice total
  </span>
</div>
    );
  }, [selectedBranch, selectedValue, currentBusinessName]);

  const formatDateTimeLocal = useCallback((utcString) => {
    return SALES_POINT_CONSTANTS.formatLocalDateTime(utcString);
  }, []);

  const fetchAllInvoices = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);
      
      const token = getToken();
      if (!token) {
        if (isMountedRef.current) setLoading(false);
        return;
      }

      const vendorIdToUse = selectedChildVendorId || currentVendorId;
      let endpoint = apiEndpoints.AllInvoices(vendorIdToUse, pagination.page, pagination.page_size);
      
      const params = new URLSearchParams();
      if (filters.invoice_no.trim()) params.append('invoice_no', filters.invoice_no.trim());
      if (filters.from_date) params.append('from_date', filters.from_date);
      if (filters.to_date) params.append('to_date', filters.to_date);
      if (filters.phone_no.trim()) params.append('phone_no', filters.phone_no.trim());
      if (filters.amount) {
        params.append('amount', filters.amount);
        params.append('operator', filters.operator);
      }
      if (params.toString()) endpoint += `&${params.toString()}`;

      const headers = SALES_POINT_CONSTANTS.getAuthHeaders(token);
      SALES_POINT_CONSTANTS.addBranchHeaders(headers, selectedBranchId, selectedChildVendorId, currentVendorId);

      const { data } = await apiService.get(endpoint, {
        headers,
        signal: controllerRef.current.signal,
        timeout: 30000
      });

      if (!isMountedRef.current) return;

      const rawData = data?.data || [];
      const meta = data?.pagination || {};

      if (!Array.isArray(rawData)) {
        setInvoices([]);
        setPagination(p => ({ ...p, total: 0 }));
        return;
      }

     const mapped = rawData.map(inv => ({
  id: inv.invoice_no,
  invoice_no: inv.invoice_no || "N/A",
  cashier_name: inv.cashier_name || "Unknown",
  total: typeof inv.amount_paid === 'number' ? inv.amount_paid : Number(inv.amount_paid) || 0,
  invoice_total: typeof inv.total === 'number' ? inv.total : Number(inv.total) || 0,
  advance_used: typeof inv.advance_used === 'number' ? inv.advance_used : Number(inv.advance_used) || 0,
  due_amount: typeof inv.due_amount === 'number' ? inv.due_amount : Number(inv.due_amount) || 0,
  transaction_type: inv.transaction_type || "fully_paid",
  payment_type: inv.payment_type || "cash",
  discount_amount: typeof inv.discount_amount === 'number' ? inv.discount_amount : Number(inv.discount_amount) || 0,
  subtotal: typeof inv.subtotal === 'number' ? inv.subtotal : Number(inv.subtotal) || 0,
  gst_percentage: typeof inv.gst_percentage === 'number' ? inv.gst_percentage : Number(inv.gst_percentage) || 0,
  gst_amount: typeof inv.gst_amount === 'number' ? inv.gst_amount : Number(inv.gst_amount) || 0,
  date_time: formatDateTimeLocal(inv.date_time),
  raw_date_time: inv.date_time,
 is_return: inv.is_return || "none",
  drug_details: inv.drug_details || [],
  customer_name: inv.customer_name && inv.customer_name !== "Anonymous" ? inv.customer_name : "Walk-in",
  phone_no: inv.customer_phone || "—",
  delivery_address: inv.delivery_address || null,
  delivery_charges: typeof inv.delivery_charges === 'number' ? inv.delivery_charges : Number(inv.delivery_charges) || 0,
  customer_notes: inv.customer_notes || null,
  order_type: inv.order_type || "physical",
  // ========== CALCULATE DISCOUNT PERCENTAGE ==========
  discount_percentage: (() => {
    const subtotal = typeof inv.subtotal === 'number' ? inv.subtotal : Number(inv.subtotal) || 0;
    const discountAmount = typeof inv.discount_amount === 'number' ? inv.discount_amount : Number(inv.discount_amount) || 0;
    if (subtotal > 0 && discountAmount > 0) {
      return (discountAmount / subtotal) * 100;
    }
    return 0;
  })(),
  // =================================================
  display_items: (inv.drug_details || [])
    .map(d => `${d.name}${d.strength ? ` ${d.strength}` : ""} × ${d.quantity}`)
    .join(" | ") || "—",
}));

      setInvoices(mapped);
      setPagination(p => ({
        ...p,
        total: meta.total_records || meta.total_items || mapped.length || 0,
      }));
    } catch (err) {
      if (!isMountedRef.current) return;
      if (err.name === 'AbortError') return;
      setError(SALES_POINT_CONSTANTS.getErrorMessage(err));
      setInvoices([]);
      setPagination(p => ({ ...p, total: 0 }));
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [
    filters,
    pagination.page,
    pagination.page_size,
    selectedBranchId,
    selectedChildVendorId,
    currentVendorId,
    formatDateTimeLocal
  ]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (controllerRef.current) controllerRef.current.abort();
    timerRef.current = setTimeout(() => fetchAllInvoices(), 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [fetchAllInvoices]);

  const handleFilterChange = useCallback((name, value) => {
    if (name === "branch_id") {
      const selectedOption = fullBranchOptions.find(opt => opt.value === value);
      if (!selectedOption) return;
      setSelectedValue(value);
      setSelectedBranch(selectedOption.label);
      setPagination(p => ({ ...p, page: 1 }));
      const isMainBranch = value === 'current';
      setSelectedChildVendorId(isMainBranch ? "" : value);
      setSelectedBranchId(selectedOption.branch_id);
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
      setPagination(p => ({ ...p, page: 1 }));
    }
  }, [fullBranchOptions]);

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchAllInvoices();
  };

const handlePrintReceipt = useCallback((row) => {
  const inv = row.original;

  // Calculate amounts correctly
  const subtotal = inv.subtotal || 0;
  const discountAmount = inv.discount_amount || 0;
  const discountPercent = inv.discount_percentage || (subtotal > 0 ? (discountAmount / subtotal) * 100 : 0);
  const netTotal = subtotal - discountAmount;
  const taxPercent = inv.gst_percentage || 0;
  const taxAmount = inv.gst_amount || (netTotal * (taxPercent / 100)) || 0;
  const totalWithTax = netTotal + taxAmount;
  
  // Include delivery charges
  const deliveryCharges = inv.delivery_charges || 0;

  // Process drug details - check if individual items have discounts
  const drugDetails = (inv.drug_details || []).map(d => {
    const itemSalePrice = Number(d.sale_price || 0);
    const itemQty = Number(d.quantity || 0);
    const itemSubtotal = itemSalePrice * itemQty;
    
    // Calculate item-specific discount if line_total is different from subtotal
    const itemLineTotal = Number(d.line_total || itemSubtotal);
    const itemDiscountAmount = itemSubtotal - itemLineTotal;
    const itemDiscountPercent = itemSubtotal > 0 ? (itemDiscountAmount / itemSubtotal) * 100 : 0;
    
    return {
      name: d.name || "Unknown",
      strength: d.strength || "",
      quantity: itemQty,
      sale_price: itemSalePrice,
      retail_price: itemSalePrice,
      line_total: itemLineTotal,
      category: d.category || "medicine",
      discount_percent: itemDiscountPercent,
      discount_amount: itemDiscountAmount,
    };
  });

  const receiptData = {
    invoice_no: inv.invoice_no,
    raw_date_time: inv.raw_date_time,
    cashier_name: inv.cashier_name,
    customer_name: inv.customer_name !== "Walk-in" ? inv.customer_name : null,
    phone: inv.phone_no !== "—" ? inv.phone_no : null,
    subtotal: subtotal,
    discount: discountPercent,  // Pass percentage
    discount_amount: discountAmount,  // Pass amount
    net_total: netTotal,
    tax: taxPercent,
    tax_amount: taxAmount,
    total: totalWithTax,
    amount_paid: inv.total,
    advance_used: inv.advance_used,
    due_amount: inv.due_amount,
    transaction_type: inv.transaction_type,
    payment_type: inv.payment_type,
    delivery_charges: deliveryCharges,
    delivery_address: inv.delivery_address || null,
    customer_notes: inv.customer_notes || null,
    order_type: inv.order_type || "physical",
    drug_details: drugDetails,
  };

  console.log("Receipt data being sent:", receiptData);
  printReceipt(receiptData, inv.is_return === "none" ? "sell" : "return");
}, []);
  // ===================== COLUMNS DEFINITION =====================
  const columns = useMemo(() => [
    {
      accessorKey: 'invoice_no',
      header: ({ column }) => <HeaderWithSort column={column} title="Invoice No" />,
   // Replace the invoice_no column cell with:
cell: ({ row }) => {
  const orderType = row.original.order_type || "physical";
  const orderTypeLabel = orderType === "delivery" ? "Delivery" : "Physical";
  const orderTypeColor = orderType === "delivery" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800";
  
  // Handle return status
  const returnStatus = row.original.is_return;
  const showReturnTag = returnStatus !== "none";
  const returnTagText = returnStatus === "partial" ? "PARTIAL RETURN" : "FULL RETURN";
  const returnTagColor = returnStatus === "partial" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
  
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-medium">
        {row.original.invoice_no}
      </span>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${orderTypeColor}`}>
        {orderTypeLabel}
      </span>
      {showReturnTag && (
        <span className={`text-xs px-2 py-0.5 rounded ${returnTagColor}`}>
          {returnTagText}
        </span>
      )}
    </div>
  );
}
    },
    { 
      accessorKey: 'date_time', 
      header: ({ column }) => <HeaderWithSort column={column} title="Date & Time" />, 
      cell: ({ row }) => <div className="text-sm font-medium text-gray-800">{row.original.date_time}</div> 
    },
    { 
      accessorKey: 'display_items', 
      header: ({ column }) => <HeaderWithSort column={column} title="Items Sold" />, 
      cell: ({ row }) => (
        <HoverTooltip 
          items={row.original.drug_details} 
          title="Sold Items" 
          invoice_no={row.original.invoice_no} 
        />
      ) 
    },
    {
      id: 'Payment',
      header: () => <div className="text-center">Payment</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <FinancialSummaryPopup invoice={row.original} />
        </div>
      ),
      enableSorting: false,
    },
    {
      id: 'Delivery',
      header: () => <div className="text-center">Delivery Info</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <DeliveryInfoPopup invoice={row.original} />
        </div>
      ),
      enableSorting: false,
    },
    { 
      accessorKey: 'cashier_name', 
      header: ({ column }) => <HeaderWithSort column={column} title="Cashier" />, 
      cell: ({ row }) => <div className="text-sm">{row.original.cashier_name}</div> 
    },
    { 
      accessorKey: 'customer_name', 
      header: ({ column }) => <HeaderWithSort column={column} title="Customer" />, 
      cell: ({ row }) => <div className="text-sm italic">{row.original.customer_name}</div> 
    },
    { 
      accessorKey: 'phone_no',
      header: ({ column }) => <HeaderWithSort column={column} title="Phone No" />, 
      cell: ({ row }) => <div className="text-sm">{row.original.phone_no}</div> 
    },
    {
      accessorKey: 'action',
      header: 'Action',
      enableSorting: false,
      cell: ({ row }) => (
        <button
          onClick={() => handlePrintReceipt(row)}
          title="Print Receipt"
          aria-label="Print Receipt"
          className="p-1.5 sm:p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      ),
    },
  ], [handlePrintReceipt]);

  const filterFields = useMemo(() => {
    const baseFields = [
      {
        type: "dateRange",
        label: "Date Range",
        fromName: "from_date",
        toName: "to_date",
        value: { from_date: filters.from_date, to_date: filters.to_date },
        onChange: (e) => handleFilterChange(e.target.name, e.target.value),
        className: "w-full sm:w-auto",
      },
      {
        type: "text",
        name: "phone_no",
        label: "Phone Number",
        placeholder: "Enter phone number",
        value: filters.phone_no,
        onChange: (e) => handleFilterChange("phone_no", e.target.value),
        className: "w-full sm:w-auto",
      },
      {
        type: "number",
        name: "invoice_no",
        label: "Invoice No",
        placeholder: "Enter invoice number",
        value: filters.invoice_no,
        onChange: (e) => handleFilterChange("invoice_no", e.target.value),
        className: "w-full sm:w-auto",
      },
      {
        type: "number",
        name: "amount",
        label: "Amount",
        placeholder: "Enter amount",
        value: filters.amount,
        onChange: (e) => handleFilterChange("amount", e.target.value),
        className: "w-full sm:w-auto",
      },
      {
        type: "select",
        name: "operator",
        label: "Amount Operator",
        value: filters.operator,
        onChange: (e) => handleFilterChange("operator", e.target.value),
        options: [
          { value: "$eq", label: "Equal to" },
          { value: "$gt", label: "Greater than" },
          { value: "$gte", label: "Greater than or equal to" },
          { value: "$lt", label: "Less than" },
          { value: "$lte", label: "Less than or equal to" },
        ],
        className: "w-full sm:w-auto",
      },
    ];

    if (isMaster && fullBranchOptions.length > 0) {
      baseFields.push({
        type: "select",
        name: "branch_id",
        label: "Branch",
        value: selectedValue,
        onChange: (e) => handleFilterChange("branch_id", e.target.value),
        options: fullBranchOptions,
        className: "w-full sm:w-auto",
      });
    }

    return baseFields;
  }, [filters, selectedValue, fullBranchOptions, isMaster, handleFilterChange]);

  // ========== EXPORT DATA WITH SAFE .toFixed() ==========
  const exportData = useMemo(() => {
    return invoices.map(inv => {
      const enhancedDisplayItems = (inv.drug_details || []).map(item => 
        `${item.name || "Unknown"}${item.strength ? ` ${item.strength}` : ""} × ${item.quantity || 0} @ ₨${(item.sale_price ?? 0).toFixed(2)} = ₨${(item.line_total ?? 0).toFixed(2)}`
      ).join(" | ");
      
      return {
        invoice_no: inv.invoice_no || "N/A",
        date_time: inv.date_time || "",
        display_items: enhancedDisplayItems || "—",
        amount_paid: `₨ ${(inv.total ?? 0).toFixed(2)}`,
        invoice_total: `₨ ${(inv.invoice_total ?? 0).toFixed(2)}`,
        advance_used: `₨ ${(inv.advance_used ?? 0).toFixed(2)}`,
        due_amount: `₨ ${(inv.due_amount ?? 0).toFixed(2)}`,
        gst_percentage: `${inv.gst_percentage ?? 0}%`,
        cashier_name: inv.cashier_name || "",
        customer_name: inv.customer_name || "",
        phone_no: inv.phone_no || "",
is_return: inv.is_return === "none" ? "NORMAL" : inv.is_return === "partial" ? "PARTIAL RETURN" : "FULL RETURN",
        order_type: inv.order_type || "physical",
        delivery_address: inv.delivery_address || "—",
        delivery_charges: `₨ ${(inv.delivery_charges ?? 0).toFixed(2)}`,
        customer_notes: inv.customer_notes || "—",
      };
    });
  }, [invoices]);

  const exportHeaders = useMemo(() => [
    'invoice_no',
    'date_time',
    'display_items',
    'amount_paid',
    'invoice_total',
    'advance_used',
    'due_amount',
    'gst_percentage',
    'cashier_name',
    'customer_name',
    'phone_no',
    'is_return',
    'order_type',
    'delivery_address',
    'delivery_charges',
    'customer_notes'
  ], []);

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
        <ExportReports
          ref={exportRef}
          data={exportData}
          reportType="All Invoices & Returns"
          headers={exportHeaders}
          setError={setError}
        />
      </div>

      <HomeTable
        title={dynamicTitle}
        data={invoices}
        columns={columns}
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
        loading={loading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        serverSideFiltering={true}
        error={error}
        onRetry={handleRetry}
        hideDefaultActions
        noDataMessage="No invoices found"
      />
    </div>
  );
}