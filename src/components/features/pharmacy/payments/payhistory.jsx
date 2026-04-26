//payhistory.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import HomeTable from "../../../common/table/Table";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { useLocation } from "react-router-dom";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/payments/payend";
import ExportReports from "../../../common/reports/ExportReports";
import { NO_RECORD_FOUND } from "../../../constants/Messages";
import SUPPLIER_MODULE_CONSTANTS from "../supplier/supplierconstants/supplierModuleConstants";
const { formatDate } = SUPPLIER_MODULE_CONSTANTS;
export default function Payhistory() {
  const location = useLocation();

  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

  // Fetch payment history
  const fetchPaymentHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (status) params.append("status", status);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      params.append("page", pagination.page);
      params.append("size", pagination.page_size);
      
      const queryString = params.toString();
      const endpoint = `${apiEndpoints.payhistory()}${queryString ? `?${queryString}` : ""}`;

      const { data } = await apiService.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const rawData = data?.data || [];
      const meta = data?.pagination || {};

      if (!Array.isArray(rawData)) {
        setPaymentHistory([]);
        setPagination((p) => ({ ...p, total: 0 }));
        return;
      }

      // Map the data for table display
    const mapped = rawData.map((payment, index) => ({
  id: payment.paymentRequestId || `payment-${index}`,
  paymentRequestId: payment.paymentRequestId || "N/A",
  vendorId: payment.vendorId || "N/A",
  branchId: payment.branchId || "N/A",
  businessName: payment.businessName || "N/A",
  vendorEmail: payment.vendorEmail || "N/A",
  paymentMethod: payment.paymentMethod || "N/A",
  amount: Number(payment.amount) || 0,
  description: payment.description || "N/A",
  status: payment.status || "N/A",
  plan: payment.plan || "N/A",
  // FIXED: Use formatDate with showTime=true for datetime
  requestedDate: payment.requestedDate ? formatDate(payment.requestedDate, true) : "N/A",
  adminRemarks: payment.adminRemarks || "N/A",
  // FIXED: Use formatDate with showTime=true for datetime
  verifiedDate: payment.verifiedDate ? formatDate(payment.verifiedDate, true) : "N/A",
}));

      setPaymentHistory(mapped);
      setPagination((prev) => ({
        ...prev,
        total: meta.totalRecords || meta.total_items || mapped.length || 0,
      }));
    } catch (err) {
      console.error("Error fetching payment history:", err);
      
      // Handle different error scenarios
      if (!err.response || err.code === "ERR_NETWORK") {
        setError("Network error. Please check your connection.");
      } else if (err.response?.status === 401) {
        setError("Unauthorized. Please login again.");
      } else if (err.response?.status === 403) {
        setError("You don't have permission to view payment history.");
      } else if (err.response?.status === 404) {
        setError("Payment history endpoint not found.");
      } else {
        setError("Failed to load payment history. Please try again.");
      }
      
      setPaymentHistory([]);
      setPagination((p) => ({ ...p, total: 0 }));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, status, fromDate, toDate, pagination.page, pagination.page_size]);

  useEffect(() => {
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  // Success message from location state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(null), 5000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle filter changes
  const handleFilterChange = useCallback((name, value) => {
    switch (name) {
      case "search":
        setSearchTerm(value);
        break;
      case "status":
        setStatus(value);
        break;
      case "fromDate":
        setFromDate(value);
        break;
      case "toDate":
        setToDate(value);
        break;
      default:
        break;
    }
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  const handleFilterApply = useCallback(() => {
    setPagination((p) => ({ ...p, page: 1 }));
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination((p) => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchPaymentHistory();
  };

  // Table columns
  const columns = useMemo(
    () => [
     
      {
        accessorKey: "plan",
        header: ({ column }) => (
          <HeaderWithSort column={column} title="Plan" />
        ),
        cell: ({ row }) => (
          <div className="text-sm font-medium">{row.original.plan}</div>
        ),
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <HeaderWithSort column={column} title="Amount" />
        ),
        cell: ({ row }) => (
          <div className="text-sm font-semibold">
            ₨ {row.original.amount.toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: "paymentMethod",
        header: ({ column }) => (
          <HeaderWithSort column={column} title="Payment Method" />
        ),
        cell: ({ row }) => (
          <div className="text-sm">{row.original.paymentMethod}</div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <HeaderWithSort column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          const statusColors = {
            APPROVED: "text-green-600 bg-green-100",
            PENDING: "text-yellow-600 bg-yellow-100",
            REJECTED: "text-red-600 bg-red-100",
          };
          const colorClass = statusColors[status] || "text-gray-600 bg-gray-100";
          
          return (
            <div className={`text-sm font-semibold px-2 py-1 rounded-full inline-block ${colorClass}`}>
              {status}
            </div>
          );
        },
      },
      {
        accessorKey: "requestedDate",
        header: ({ column }) => (
          <HeaderWithSort column={column} title="Requested Date" />
        ),
        cell: ({ row }) => (
          <div className="text-sm">{row.original.requestedDate}</div>
        ),
      },
      {
        accessorKey: "verifiedDate",
        header: ({ column }) => (
          <HeaderWithSort column={column} title="Verified Date" />
        ),
        cell: ({ row }) => (
          <div className="text-sm">{row.original.verifiedDate}</div>
        ),
      },
      {
        accessorKey: "adminRemarks",
        header: ({ column }) => (
          <HeaderWithSort column={column} title="Admin Remarks" />
        ),
        cell: ({ row }) => (
          <div className="text-sm">{row.original.adminRemarks}</div>
        ),
      },
    ],
    []
  );

  // Filter fields configuration
  const filterFields = useMemo(
    () => [
        {
  type: "dateRange",
  label: "Date",
  fromName: "fromDate",
  toName: "toDate",
  value: { fromDate: fromDate, toDate: toDate },
  onChange: (e) => handleFilterChange(e.target.name, e.target.value),
  className: "date-input-black",
},
      {
        type: "text",
        name: "search",
        label: "Search",
        placeholder: "Search by business name, email, or request ID...",
        value: searchTerm,
        onChange: (e) => handleFilterChange("search", e.target.value),
      },
      {
        type: "select",
        name: "status",
        label: "Status",
        placeholder: "All Status",
        value: status,
        onChange: (e) => handleFilterChange("status", e.target.value),
        options: [
         
          { value: "APPROVED", label: "Approved" },
          { value: "PENDING", label: "Pending" },
          { value: "REJECTED", label: "Rejected" },
        ],
      },
    
    ],
    [searchTerm, status, fromDate, toDate, handleFilterChange]
  );

  // Export endpoint
  const exportEndpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (status) params.append("status", status);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
    params.append("page", 1);
    params.append("size", 1000);
    
    const queryString = params.toString();
    return `${apiEndpoints.payhistory()}${queryString ? `?${queryString}` : ""}`;
  }, [searchTerm, status, fromDate, toDate]);

  return (
    <div className="relative">
      {/* Export Buttons */}
      <div className="absolute top-4 right-6 z-20 flex gap-2">
        {exportEndpoint && (
          <ExportReports
            endpoint={exportEndpoint}
            data={paymentHistory}
            reportType="Payment History"
            headers={columns.map((col) => col.accessorKey)}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
          />
        )}
      </div>

      <div>
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        <HomeTable
          title="Payment History"
          data={paymentHistory}
          columns={columns}
          filterFields={filterFields}
          onFilterChange={handleFilterChange}
          onFilterApply={handleFilterApply}
          defaultFilters={{ search: searchTerm, status: status, fromDate: fromDate, toDate: toDate }}
          hideDefaultActions={false}
          loading={loading}
          serverSideFiltering={true}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          error={error}
          onRetry={handleRetry}
          noDataMessage={
            paymentHistory.length === 0 && !loading && !error
              ? NO_RECORD_FOUND
              : error
          }
        />
      </div>
    </div>
  );
}