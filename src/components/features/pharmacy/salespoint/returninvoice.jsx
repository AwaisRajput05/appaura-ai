// returninvoice.jsx - FINAL FIXED VERSION WITH PROPER ENDPOINT
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Printer } from 'lucide-react';

// Custom Components & Services
import { useAuth } from "../../../auth/hooks/useAuth";
import HomeTable from "../../../common/table/table3";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/salespoint/salespointend";
import ExportReports from "../../../common/reports/ExportReports";
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { printReceipt } from "../../../../services/receiptPrinter";

// Constants
import { 
  SALES_POINT_CONSTANTS,
  InvoiceSearchType
} from '././salescosntant/salesPointConstants';

// Types
const RETURN_FILTERS = {
  SEARCH_TYPE: "search_type",
  INVOICE_NO: "invoice_no",
  RETURNED_INVOICE_NO: "returned_invoice_no",
  RETURN_DATE_FROM: "return_date_from",
  RETURN_DATE_TO: "return_date_to",
  BRANCH_ID: "branch_id"
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

// Main Component
export default function ReturnMedicineList() {
  // Refs for cleanup
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  // Hooks
  const { user } = useAuth();
  
  // State
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search_type: InvoiceSearchType.ALL,
    invoice_no: "",
    returned_invoice_no: "",
    return_date_from: "",
    return_date_to: "",
  });
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedChildVendorId, setSelectedChildVendorId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // Constants from User
  const { 
    currentVendorId, 
    originalBranchId, 
    isMaster, 
    currentBusinessName 
  } = SALES_POINT_CONSTANTS.getUserInfo(user);
  
  const childVendors = getVendorChildIds() || [];
  
  // Branch Options
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
const dynamicTitle = useMemo(() => {
  const branchLabel = selectedBranch || currentBusinessName;
  const isCurrent = selectedValue === 'current';
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-full">
          Return Invoices
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
    </div>
  );
}, [selectedBranch, selectedValue, currentBusinessName]);

  // Format DateTime using Constants
  const formatDateTimeLocal = useCallback((utcString) => {
    return SALES_POINT_CONSTANTS.formatLocalDateTime(utcString);
  }, []);

  // Fetch Returns - FIXED PROPERLY
  const fetchReturns = useCallback(async () => {
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

      // Get vendor ID to use for filtering
      const vendorIdToUse = selectedChildVendorId || currentVendorId;
      
      // Build ALL query parameters in one object
      const queryParams = {
        page: pagination.page,
        page_size: pagination.page_size,
        branch_id: vendorIdToUse, // Add branch/vendor ID
      };
      
      // Add search filters based on search type
      if (filters.search_type !== InvoiceSearchType.ALL) {
        if (filters.search_type === InvoiceSearchType.RETURNED_INVOICE && filters.returned_invoice_no.trim()) {
          queryParams.returned_invoice_no = filters.returned_invoice_no.trim();
        }
        if (filters.search_type === InvoiceSearchType.INVOICE && filters.invoice_no.trim()) {
          queryParams.invoice_no = filters.invoice_no.trim();
        }
      }
      
      // Add date filters
      if (filters.return_date_from) {
        queryParams.return_date_from = filters.return_date_from;
      }
      if (filters.return_date_to) {
        queryParams.return_date_to = filters.return_date_to;
      }

      // Call the endpoint with ALL parameters
      const endpoint = apiEndpoints.returnSearch(
        vendorIdToUse,
        pagination.page,
        pagination.page_size,
        filters.returned_invoice_no.trim(),
        filters.invoice_no.trim(),
        filters.return_date_from,
        filters.return_date_to
      );

      console.log('API CALL:', endpoint); // Debug log

      // Use Constants for Headers
      const headers = SALES_POINT_CONSTANTS.getAuthHeaders(token);
      SALES_POINT_CONSTANTS.addBranchHeaders(
        headers, 
        selectedBranchId, 
        selectedChildVendorId, 
        currentVendorId
      );

      const response = await apiService.get(endpoint, {
        headers,
        signal: controllerRef.current.signal,
        timeout: 30000,
      });

      if (!isMountedRef.current) return;

      const rawData = response?.data?.data || [];
      const pag = response?.data?.pagination || {};

      const mapped = rawData.map(item => {
        const drugs = item.drug_details || [];
        const totalQty = drugs.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
        
        const drugList = drugs
          .map(d => {
            const name = d.name || "Unknown Drug";
            const strength = d.strength && d.strength !== "null" ? ` ${d.strength}` : "";
            const batch = d.batch_code ? ` (Batch: ${d.batch_code})` : "";
            return `${name}${strength} × ${d.quantity}${batch}`;
          })
          .join(" | ") || "No drugs";

        return {
          id: item.invoice_no || item.returned_invoice_no,
          returned_invoice_no: item.returned_invoice_no || "N/A",
          invoice_no: item.invoice_no || "N/A",
          drug_details_raw: drugs,
          drug_details_display: drugList,
          quantity: totalQty,
          total: Number(item.total) || 0,
          return_date: formatDateTimeLocal(item.return_date_time),
          raw_return_date_time: item.return_date_time,
          customer_name: item.customer_name && item.customer_name !== "Anonymous" ? item.customer_name : "Walk-in",
          cashier_name: item.cashier_name || "Unknown",
        };
      });

      setResults(mapped);
      setPagination(prev => ({
        ...prev,
        total: pag.total_records || pag.total_items || mapped.length || 0,
      }));
    } catch (err) {
      if (!isMountedRef.current) return;
      if (err.name === 'AbortError') return;
      
      setError(SALES_POINT_CONSTANTS.getErrorMessage(err));
      setResults([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
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

  // Debounced Effect for Fetching
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (controllerRef.current) controllerRef.current.abort();

    timerRef.current = setTimeout(() => {
      fetchReturns();
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchReturns]);

  // Filter Change Handler
  const handleFilterChange = useCallback((name, value) => {
    if (name === RETURN_FILTERS.BRANCH_ID) {
      const selectedOption = fullBranchOptions.find(opt => opt.value === value);
      if (!selectedOption) return;
      
      setSelectedValue(value);
      setSelectedBranch(selectedOption.label);
      setPagination(prev => ({ ...prev, page: 1 }));
      
      const isMainBranch = value === 'current';
      setSelectedChildVendorId(isMainBranch ? "" : value);
      setSelectedBranchId(selectedOption.branch_id);
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [fullBranchOptions]);

  // Pagination Handler
  const handlePaginationChange = useCallback((page, size) => {
    setPagination(prev => ({ ...prev, page, page_size: size }));
  }, []);

  // Print Receipt Handler
  const handlePrintReturnReceipt = useCallback((row) => {
    const item = row.original;
    const receiptData = {
      invoice_no: item.invoice_no,
      returned_invoice_no: item.returned_invoice_no,
      raw_return_date_time: item.raw_return_date_time,
      cashier_name: item.cashier_name,
      total: item.total,
      drug_details: item.drug_details_raw.map(d => ({
        name: d.name || "Unknown",
        strength: d.strength || "",
        quantity: Number(d.quantity || 0),
        retail_price: Number(d.retail_price || d.price || 0),
      })),
    };
    printReceipt(receiptData, "return");
  }, []);

  // Retry Handler
  const handleRetry = useCallback(() => {
    setError(null);
    fetchReturns();
  }, [fetchReturns]);

  // Columns Definition
  const columns = useMemo(() => [
    { 
      accessorKey: "returned_invoice_no", 
      header: ({ column }) => <HeaderWithSort column={column} title="Original Invoice" />, 
      cell: ({ row }) => <div className="font-medium">{row.original.returned_invoice_no}</div> 
    },
    { 
      accessorKey: "invoice_no", 
      header: ({ column }) => <HeaderWithSort column={column} title="Return Invoice" />, 
      cell: ({ row }) => <div className="font-medium">{row.original.invoice_no}</div> 
    },
    { 
      accessorKey: "return_date",
      header: ({ column }) => <HeaderWithSort column={column} title="Return Date & Time" />, 
      cell: ({ row }) => <div className="font-medium">{row.original.return_date}</div> 
    },
    { 
      accessorKey: "drug_details_display",
      header: ({ column }) => <HeaderWithSort column={column} title="Returned Items" />, 
      cell: ({ row }) => (
        <HoverTooltip 
          items={row.original.drug_details_raw} 
          title="Returned Items" 
          invoice_no={row.original.invoice_no} 
        />
      ),
      enableSorting: false,
    },
    { 
      accessorKey: "quantity", 
      header: ({ column }) => <HeaderWithSort column={column} title="Qty" />, 
      cell: ({ row }) => <div className="font-medium">{row.original.quantity}</div> 
    },
    { 
      accessorKey: "total", 
      header: ({ column }) => <HeaderWithSort column={column} title="Amount" />, 
      cell: ({ row }) => <div className="font-medium">₨ {row.original.total.toFixed(2)}</div> 
    },
    { 
      accessorKey: "customer_name", 
      header: ({ column }) => <HeaderWithSort column={column} title="Customer" />, 
      cell: ({ row }) => <div className="font-medium">{row.original.customer_name}</div> 
    },
  {
  accessorKey: "action",
  header: "Action",
  enableSorting: false,
  cell: ({ row }) => (
    <button
      onClick={() => handlePrintReturnReceipt(row)}
      title="Print Slip"
      aria-label="Print Slip"
      className="p-1.5 sm:p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition shadow-sm hover:shadow-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
    >
      <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
    </button>
  ),
},
  ], [handlePrintReturnReceipt]);

  // Prepare data for export
  const exportData = useMemo(() => {
    return results.map(item => ({
      returned_invoice_no: item.returned_invoice_no,
      invoice_no: item.invoice_no,
      return_date: item.return_date,
      drug_details_display: item.drug_details_display || "—",
      quantity: item.quantity,
      total: `₨ ${item.total.toFixed(2)}`,
      customer_name: item.customer_name,
      cashier_name: item.cashier_name,
    }));
  }, [results]);

 // Titles match exactly what's in:  header: ({ column }) => <HeaderWithSort column={column} title="..." />
const exportHeaders = useMemo(() => [
  { title: 'Original Invoice',     key: 'returned_invoice_no'    },
  { title: 'Return Invoice',       key: 'invoice_no'             },
  { title: 'Return Date & Time',   key: 'return_date'            },
  { title: 'Returned Items',       key: 'drug_details_display'   },
  { title: 'Qty',                  key: 'quantity'               },
  { title: 'Amount',               key: 'total'                  },
  { title: 'Customer',             key: 'customer_name'          },
  { title: 'Cashier',              key: 'cashier_name'           },
], []);

  // Filter Fields
 const filterFields = useMemo(() => {
  const baseFields = [
    {
      type: "dateRange",
      label: "Return Date Range",
      fromName: RETURN_FILTERS.RETURN_DATE_FROM,
      toName: RETURN_FILTERS.RETURN_DATE_TO,
      value: { 
        [RETURN_FILTERS.RETURN_DATE_FROM]: filters.return_date_from, 
        [RETURN_FILTERS.RETURN_DATE_TO]: filters.return_date_to 
      },
      onChange: e => handleFilterChange(e.target.name, e.target.value),
      className: "w-full sm:w-auto", // Add this
    },
    {
      type: "select",
      name: RETURN_FILTERS.SEARCH_TYPE,
      label: "Search By",
      value: filters.search_type,
      onChange: e => handleFilterChange(RETURN_FILTERS.SEARCH_TYPE, e.target.value),
      options: [
        { value: InvoiceSearchType.ALL, label: "All Returns" },
        { value: InvoiceSearchType.RETURNED_INVOICE, label: "Original Invoice No" },
        { value: InvoiceSearchType.INVOICE, label: "Return Invoice No" },
      ],
      className: "w-full sm:w-auto", // Add this
    },
    {
      type: "number",
      name: RETURN_FILTERS.RETURNED_INVOICE_NO,
      label: "Original Invoice No",
      placeholder: "e.g. 78689",
      value: filters.returned_invoice_no,
      onChange: e => handleFilterChange(RETURN_FILTERS.RETURNED_INVOICE_NO, e.target.value),
      disabled: filters.search_type !== InvoiceSearchType.RETURNED_INVOICE,
      className: "w-full sm:w-auto", // Add this
    },
    {
      type: "number",
      name: RETURN_FILTERS.INVOICE_NO,
      label: "Return Invoice No",
      placeholder: "e.g. 897898",
      value: filters.invoice_no,
      onChange: e => handleFilterChange(RETURN_FILTERS.INVOICE_NO, e.target.value),
      disabled: filters.search_type !== InvoiceSearchType.INVOICE,
      className: "w-full sm:w-auto", // Add this
    },
  ];

  // Add branch filter for master users
  if (isMaster && fullBranchOptions.length > 0) {
    baseFields.push({
      type: "select",
      name: RETURN_FILTERS.BRANCH_ID,
      label: "Branch",
      value: selectedValue,
      onChange: e => handleFilterChange(RETURN_FILTERS.BRANCH_ID, e.target.value),
      options: fullBranchOptions,
      className: "w-full sm:w-auto", // Add this
    });
  }

  return baseFields;
}, [filters, selectedValue, fullBranchOptions, isMaster, handleFilterChange]);

  return (
    <div className="relative">
      {/* Export Button */}
    <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
  <ExportReports
    data={exportData}
    reportType="Medicine Return Report"
    headers={exportHeaders}
    setError={setError}
  />
</div>

      {/* Main Table */}
      <HomeTable
        title={dynamicTitle}
        data={results}
        columns={columns}
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
        loading={loading}
        serverSideFiltering={true}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        hideDefaultActions
        noDataMessage="No returned medicines found"
        error={error}
        onRetry={handleRetry}
      />
    </div>
  );
}