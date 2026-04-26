// checkorder.jsx — CLEANED WITH CONSTANTS - FULLY RESPONSIVE
import React, { useState, useEffect, useCallback, useContext, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { AuthContext } from "../../../auth/hooks/AuthContextDef";
import Table from "../../../common/table/table3";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/apiEndpoints";
import { MessageAlert } from "../../../common/message/MessageAlert";
import { NO_RECORD_FOUND } from "../../../constants/Messages";
import {
  Clock,
  Eye,
  Truck,
  CheckCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Calendar,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  CheckCircle as CheckCircleIcon,
  XCircle,
  Info
} from "lucide-react";
import { getVendorChildIds } from "../../../../services/vendorUtils";

// Import your reusable components
import Button from '../../../../components/ui/forms/Button';
import Modal from '../../../../components/ui/Modal';
import Alert from '../../../../components/ui/feedback/Alert';
import Card from '../../../../components/ui/Card';
import InputText from '../../../../components/ui/forms/InputText';
import InputTextarea from '../../../../components/ui/forms/InputTextarea';
import InputSelect from '../../../../components/ui/forms/InputSelect';
import DatePicker from '../../../../components/ui/forms/DatePicker';
import FileUpload from '../../../../components/ui/forms/FileUpload';
import InputCheckbox from '../../../../components/ui/forms/InputCheckbox';
import Stepper from '../../../../components/ui/Stepper';
import ButtonTooltip from "../../../ui/forms/ButtonTooltip";

// Import your order module constants
import ORDER_MODULE_CONSTANTS from "././orderconstant/orderModuleConstants";

// ==================== MESSAGE & UI CONSTANTS ====================
const CHECK_ORDER_CONSTANTS = {
  // Error Messages
  ERRORS: {
    VENDOR_ID_NOT_FOUND: "Vendor ID not found.",
    FETCH_ORDERS_FAILED: "Failed to fetch orders",
    ORDER_DETAILS_FAILED: "Failed to load details",
    DISPATCH_SLIP_NOT_FOUND: "No dispatch slip found",
    DISPATCH_SLIP_LOAD_FAILED: "Failed to load slip",
    EXPECTED_DELIVERY_REQUIRED: "Expected delivery date and time are required",
    DISPATCH_SLIP_REQUIRED: "Dispatch slip is required",
    DISPATCH_TIMEOUT: "Upload timed out. Try with a smaller file or check your internet.",
    DISPATCH_FAILED: "Dispatch failed. Please try again.",
    COMPLETE_FAILED: "Complete failed",
    DISCREPANCY_NO_ITEMS: "Please select at least one short item.",
    DISCREPANCY_SUBMIT_FAILED: "Failed to submit discrepancy",
  },

  // Success Messages
  SUCCESS: {
    ORDER_DISPATCHED: "Order dispatched successfully!",
    ORDER_COMPLETED: "Order marked as complete successfully!",
    DISCREPANCY_REPORTED: "Discrepancy reported successfully!",
  },

  // UI Text Strings
  UI: {
    // Page Titles
    MASTER_ORDERS: "Orders",
    BRANCH_ORDERS: "Orders",

    // Modal Titles
    ORDER_DETAILS: "Order Details",
    DISPATCH_ORDER: "Dispatch Order",
    COMPLETE_ORDER: "Complete Order",
    REPORT_DISCREPANCY: "Report Discrepancy",
    DISPATCH_SLIP: "Dispatch Slip",

    // Button Labels
    VIEW: "View",
    DISPATCH: "Dispatch",
    COMPLETE: "Complete",
    DISCREPANCY: "Discrepancy",
    REFRESH: "Refresh",
    CANCEL: "Cancel",
    SUBMIT_DISCREPANCY: "Submit Discrepancy",
    DOWNLOAD_SLIP: "Download Slip",
    RETRY: "Retry",

    // Loading States
    LOADING: "Loading...",
    REFRESHING: "Refreshing",
    DISPATCHING: "Dispatching...",
    COMPLETING: "Completing...",
    SUBMITTING: "Submitting...",

    // Status & Labels
    PENDING: "Pending",
    BRANCH_NAME: "Branch Name",
    BRANCH_DETAILS: "Branch Details",
    CREATED_AT: "Created At",
    CREATED: "Created",
    DISPATCHED_AT: "Dispatched At",
    DISPATCHED: "Dispatched",
    RECEIVED_AT: "Received At",
    RECEIVED: "Received",
    PRIORITY: "Priority",
    STATUS: "Status",
    ORDER_DETAILS_LABEL: "Order Details",
    DISPATCH_SLIP_LABEL: "Dispatch Slip",
    ACTIONS: "Actions",

    // Table Headers
    ORDER_ID: "Order ID",
    BRANCH: "Branch",
    DATE_RANGE: "Date Range",
    ENTER_ORDER_ID: "Enter Order ID",

    // Placeholders
    TRACKING_INFO_PLACEHOLDER: "Enter tracking information",
    COMMENTS_PLACEHOLDER: "Enter any comments",
    DISCREPANCY_COMMENTS_PLACEHOLDER: "Enter comments about the discrepancy",

    // Other Text
    ALL_BRANCHES: "All Branches",
    SHORT_MISSING_MEDICINES: "Short / Missing Medicines",
    MISSING_ITEMS: "Missing / Partially Received Items",
    COMMENTS: "Comments",
    INCOMPLETE_DELIVERY: "Incomplete Delivery",
    PREVIEW_NOT_AVAILABLE: "Preview not available for this file type.",

    // Tooltips
    PLEASE_WAIT: "Please wait",
    VIEW_BRANCH_DETAILS: "View branch details",

    // New Date/Time labels
    EXPECTED_DELIVERY_DATE: "Expected Delivery Date",
    EXPECTED_DELIVERY_TIME: "Expected Delivery Time",
  },

  // Default Values
  DEFAULTS: {
    NOT_AVAILABLE: "N/A",
    DASH: "—",
    NO_DATA: "-",
    DEFAULT_BRANCH: "N/A",
    BRANCH_PREFIX: "Branch ",
  },

  // File & Upload
  UPLOAD: {
    DISPATCH_SLIP_ACCEPT: "image/*,application/pdf",
    DISPATCH_SLIP_LABEL: "Upload Dispatch Slip",
    FILE_DOWNLOAD_PREFIX: "dispatch_slip_",
  },
};

// Destructure constants for cleaner usage
const {
  STATUS,
  PRIORITY,
  STATUS_OPTIONS,
  getUserInfo,
  getAuthHeaders,
  addBranchHeaders,
  getOrderHeaders,
  formatLocalDateTime,
  formatShortDate,
  getDefaultExpectedDeliveryTime,
  getErrorMessage,
  getBusinessName,
  displayOrderId,
  getStatusColor,
  getPriorityColor,
  buildOrdersEndpoint
} = ORDER_MODULE_CONSTANTS;

const ROLE = {
  VENDOR: "VENDOR",
};

// ==================== HELPER: Build default date & time ====================
const getDefaultDeliveryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getDefaultDeliveryTime = () => "12:00";

// ==================== TextHoverTooltip ====================
const TextHoverTooltip = ({ preview, full, title }) => {
  if (!full || full === CHECK_ORDER_CONSTANTS.DEFAULTS.DASH || full === preview)
    return <span className="text-gray-600 text-xs sm:text-sm">{preview}</span>;

  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef(null);

  const open = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const close = () => {
    timerRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={open}
        onMouseLeave={close}
        className="text-blue-600 hover:underline cursor-help text-xs sm:text-sm font-medium"
      >
        {preview}
      </span>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-none p-4">
            <div
              onMouseEnter={open}
              onMouseLeave={close}
              className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-300 max-w-xs sm:max-w-md max-h-[80vh] overflow-y-auto pointer-events-auto mx-4"
            >
              <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-center text-gray-800 border-b pb-2 sm:pb-3">
                {title}
              </h3>
              <p className="text-gray-900 text-center font-medium text-sm sm:text-base">{full}</p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
export default function CheckOrder() {
  const { user } = useContext(AuthContext);

  const userInfo = getUserInfo(user);
  const vendorId = userInfo.vendorId;
  const isMaster = userInfo.isMaster;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dispatchPopup, setDispatchPopup] = useState(null);
  const [completePopup, setCompletePopup] = useState(null);
  const [discrepancyPopup, setDiscrepancyPopup] = useState(null);
  const [selectedSlip, setSelectedSlip] = useState(null);

  const [discrepancyLoadingMap, setDiscrepancyLoadingMap] = useState({});
  const [viewLoadingMap, setViewLoadingMap] = useState({});
  const [viewSlipLoadingMap, setViewSlipLoadingMap] = useState({});

  const [isDispatching, setIsDispatching] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDiscrepancyLoading, setIsDiscrepancyLoading] = useState(false);

  const [pagination, setPagination] = useState({ page: 1, page_size: 10, total: 0 });

  const childVendorsInitial = getVendorChildIds() || [];
  const [childVendors] = useState(childVendorsInitial);

  const [filters, setFilters] = useState({
    status: "",
    fromDate: "",
    toDate: "",
    branch: "",
    orderId: "",
  });

  const fullBranchOptions = useMemo(
    () => [
      { value: "", label: CHECK_ORDER_CONSTANTS.UI.ALL_BRANCHES },
      ...childVendors.map((item) => ({
        value: item.branch_id,
        label:
          item.business_name ||
          item.branch_id ||
          `${CHECK_ORDER_CONSTANTS.DEFAULTS.BRANCH_PREFIX}${item.vendor_id.substring(0, 8)}`,
        branch_id: item.branch_id,
      })),
    ],
    [childVendors]
  );

  const getAuthHeadersForOrder = (branchId = null) => {
    const token = getToken();
    const headers = getAuthHeaders(token, vendorId);
    if (isMaster && branchId) {
      const match = childVendors.find((v) => v.branch_id === branchId);
      const childId = match?.vendor_id || null;
      if (childId) headers["X-Child-Id"] = childId;
    }
    return headers;
  };

  const getOrdersEndpoint = () => {
    const params = new URLSearchParams();
    params.append("page", pagination.page);
    params.append("page_size", pagination.page_size);
    if (filters.status) params.append("status", filters.status);
    if (filters.fromDate) params.append("fromDate", filters.fromDate);
    if (filters.toDate) params.append("toDate", filters.toDate);
    if (filters.orderId) params.append("orderId", filters.orderId);
    const query = params.toString() ? `?${params.toString()}` : "";

    if (!isMaster) {
      return { endpoint: `${apiEndpoints.branchOrders()}${query}`, childId: null };
    }
    if (!filters.branch || filters.branch === "") {
      return { endpoint: `${apiEndpoints.masterOrders()}${query}`, childId: null };
    }
    const selected = childVendors.find((v) => v.branch_id === filters.branch);
    const childId = selected?.vendor_id || vendorId;
    return { endpoint: `${apiEndpoints.branchOrders()}${query}`, childId };
  };

  const getBusinessNameForOrder = useCallback(
    (branchId) => getBusinessName(branchId, childVendors),
    [childVendors]
  );

  const fetchOrders = useCallback(async () => {
    if (!vendorId)
      return setError(CHECK_ORDER_CONSTANTS.ERRORS.VENDOR_ID_NOT_FOUND), setLoading(false);

    try {
      setLoading(true);
      setError(null);
      const { endpoint, childId } = getOrdersEndpoint();
      const headers = { Authorization: `Bearer ${getToken()}`, Accept: "application/json" };
      if (childId) headers["X-Child-Id"] = childId;

      const response = await apiService.get(endpoint, { headers });
      const result = response.data;
      const items = result.content || result.data || result || [];
      const total =
        result.totalElements || result.pagination?.total_records || items.length;

      const mapped = items.map((order) => ({
        id: order.id,
        orderId: order.orderId || null,
        branchId: order.branchId,
        createdAt: order.createdAt,
        dispatchTime: order.dispatchTime,
        priority: order.priority,
        receivedTime: order.receivedTime,
        medicines: order.medicines || [],
        status: order.status,
        childBusinessName: getBusinessNameForOrder(order.branchId),
      }));

      setOrders(mapped);
      setPagination((prev) => ({ ...prev, total }));
    } catch (err) {
      setError(getErrorMessage(err) || CHECK_ORDER_CONSTANTS.ERRORS.FETCH_ORDERS_FAILED);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [vendorId, filters, pagination.page, pagination.page_size, childVendors, isMaster, getBusinessNameForOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchOrderDetails = async (orderId, branchId) => {
    if (!orderId) return null;
    try {
      const headers = getAuthHeadersForOrder(branchId);
      headers.Accept = "application/json";
      const endpoint = apiEndpoints.orderdetails(orderId);
      const response = await apiService.get(endpoint, { headers });
      return response.data;
    } catch (err) {
      setError(getErrorMessage(err) || CHECK_ORDER_CONSTANTS.ERRORS.ORDER_DETAILS_FAILED);
      return null;
    }
  };

  const handleViewDetails = async (orderId, branchId, rowId) => {
    setViewLoadingMap((prev) => ({ ...prev, [rowId]: true }));
    const details = await fetchOrderDetails(orderId, branchId);
    setViewLoadingMap((prev) => ({ ...prev, [rowId]: false }));
    if (details) setSelectedOrder(details);
  };

  const handleViewSlip = async (internalId, branchId, displayOrderId) => {
    setViewSlipLoadingMap((prev) => ({ ...prev, [internalId]: true }));
    try {
      const headers = getAuthHeadersForOrder(branchId);
      const endpoint = apiEndpoints.orderSlip(internalId);
      const response = await apiService.get(endpoint, { headers, responseType: "blob" });
      const contentType = response.headers["content-type"] || "application/octet-stream";
      const url = URL.createObjectURL(response.data);
      setSelectedSlip({
        internalId,
        displayOrderId: displayOrderId || internalId,
        url,
        contentType,
      });
    } catch (err) {
      setError(
        err.response?.status === 404
          ? CHECK_ORDER_CONSTANTS.ERRORS.DISPATCH_SLIP_NOT_FOUND
          : CHECK_ORDER_CONSTANTS.ERRORS.DISPATCH_SLIP_LOAD_FAILED
      );
    } finally {
      setViewSlipLoadingMap((prev) => ({ ...prev, [internalId]: false }));
    }
  };

  // ==================== DISPATCH ====================
  const handleDispatch = async () => {
    if (!dispatchPopup) return;

    // Validate both date and time
    if (!dispatchPopup.expectedDeliveryDate || !dispatchPopup.expectedDeliveryTime) {
      return setError(CHECK_ORDER_CONSTANTS.ERRORS.EXPECTED_DELIVERY_REQUIRED);
    }
    if (!dispatchPopup.slipFile) {
      return setError(CHECK_ORDER_CONSTANTS.ERRORS.DISPATCH_SLIP_REQUIRED);
    }

    try {
      setIsDispatching(true);
      setError(null);

      // Combine date + time into a proper ISO string (treated as local time)
      const combined = new Date(
        `${dispatchPopup.expectedDeliveryDate}T${dispatchPopup.expectedDeliveryTime}:00`
      );

      const payload = {
        expectedDeliveryTime: combined.toISOString(),
        trackingInfo: dispatchPopup.trackingInfo || "",
      };

      const formData = new FormData();
      const jsonBlob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      formData.append("data", jsonBlob);
      formData.append("slip", dispatchPopup.slipFile);

      const headers = getAuthHeadersForOrder(dispatchPopup.branchId);
      delete headers["Content-Type"];

      await apiService.post(apiEndpoints.dispatchOrder(dispatchPopup.id), formData, {
        headers,
        timeout: 60000,
      });

      setSuccess(CHECK_ORDER_CONSTANTS.SUCCESS.ORDER_DISPATCHED);
      setDispatchPopup(null);
      fetchOrders();
    } catch (err) {
      console.error("Dispatch error:", err);
      if (err.code === "ECONNABORTED") {
        setError(CHECK_ORDER_CONSTANTS.ERRORS.DISPATCH_TIMEOUT);
      } else {
        setError(getErrorMessage(err) || CHECK_ORDER_CONSTANTS.ERRORS.DISPATCH_FAILED);
      }
    } finally {
      setIsDispatching(false);
    }
  };

  // ==================== COMPLETE ====================
  const handleComplete = async () => {
    if (!completePopup) return;
    try {
      setIsCompleting(true);
      const payload = { complete: true, comments: completePopup.comments || "" };
      const headers = getAuthHeadersForOrder(completePopup.branchId);
      headers["Content-Type"] = "application/json";
      await apiService.post(apiEndpoints.completeOrder(completePopup.id), payload, { headers });
      setSuccess(CHECK_ORDER_CONSTANTS.SUCCESS.ORDER_COMPLETED);
      setCompletePopup(null);
      fetchOrders();
    } catch (err) {
      setError(getErrorMessage(err) || CHECK_ORDER_CONSTANTS.ERRORS.COMPLETE_FAILED);
    } finally {
      setIsCompleting(false);
    }
  };

  // ==================== DISCREPANCY ====================
  const openDiscrepancy = async (row) => {
    if (!row?.original || row.original.status !== STATUS.DISPATCHED) return;
    const orderId = row.original.id;
    setDiscrepancyLoadingMap((prev) => ({ ...prev, [orderId]: true }));
    const details = await fetchOrderDetails(orderId, row.original.branchId);
    setDiscrepancyLoadingMap((prev) => ({ ...prev, [orderId]: false }));
    if (!details) return;

    const medicinesList = details.medicines.map((m) => ({
      medicineId: m.medicineId,
      name: m.name,
      requiredStock: m.requiredStock,
      recievedStock: m.currentStock || 0,
      initialStock: m.currentStock || 0,
      selected: false,
      isShort: (m.currentStock || 0) < m.requiredStock,
    }));

    setDiscrepancyPopup({
      id: details.id,
      orderId: details.orderId,
      branchId: details.branchId,
      comments: "",
      medicines: medicinesList,
    });
  };

  const toggleMedicineSelection = (index) => {
    setDiscrepancyPopup((prev) => {
      if (!prev) return prev;
      const updatedMedicines = [...prev.medicines];
      updatedMedicines[index].selected = !updatedMedicines[index].selected;
      return { ...prev, medicines: updatedMedicines };
    });
  };

  const updateReceivedStock = (index, value) => {
    setDiscrepancyPopup((prev) => {
      if (!prev) return prev;
      const updatedMedicines = [...prev.medicines];
      const newValue = parseInt(value) || 0;
      updatedMedicines[index] = {
        ...updatedMedicines[index],
        recievedStock: newValue,
        selected:
          updatedMedicines[index].selected ||
          newValue < updatedMedicines[index].requiredStock,
      };
      return { ...prev, medicines: updatedMedicines };
    });
  };

  const submitDiscrepancy = async () => {
    if (!discrepancyPopup) return;

    const selectedShortItems = discrepancyPopup.medicines.filter(
      (m) => m.selected && m.recievedStock < m.requiredStock
    );

    if (selectedShortItems.length === 0) {
      setError(CHECK_ORDER_CONSTANTS.ERRORS.DISCREPANCY_NO_ITEMS);
      return;
    }

    try {
      setIsDiscrepancyLoading(true);
      const payload = {
        complete: false,
        comments: discrepancyPopup.comments || "Discrepancy reported",
        missingMedicines: selectedShortItems.map((m) => ({
          medicineId: m.medicineId,
          name: m.name,
          recievedStock: m.recievedStock,
          requiredStock: m.requiredStock,
        })),
      };
      const headers = getAuthHeadersForOrder(discrepancyPopup.branchId);
      headers["Content-Type"] = "application/json";

      await apiService.post(
        apiEndpoints.completeOrder(discrepancyPopup.id),
        payload,
        { headers }
      );
      setSuccess(CHECK_ORDER_CONSTANTS.SUCCESS.DISCREPANCY_REPORTED);
      setTimeout(() => {
        setDiscrepancyPopup(null);
        fetchOrders();
      }, 1000);
    } catch (err) {
      setError(getErrorMessage(err) || CHECK_ORDER_CONSTANTS.ERRORS.DISCREPANCY_SUBMIT_FAILED);
    } finally {
      setIsDiscrepancyLoading(false);
    }
  };

  // ==================== FILTERS & PAGINATION ====================
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePaginationChange = (page, page_size) => {
    setPagination((prev) => ({ ...prev, page, page_size }));
  };

  const handleRefresh = () => fetchOrders();

  // ==================== COLUMNS ====================
  const columns = [
    {
      accessorKey: "orderId",
      header: ({ column }) => (
        <HeaderWithSort column={column} title={CHECK_ORDER_CONSTANTS.UI.ORDER_ID} />
      ),
      cell: ({ row }) => (
        <div className="font-semibold text-indigo-600 text-xs sm:text-sm">
          {displayOrderId(row.original.orderId)}
        </div>
      ),
    },
    ...(isMaster
      ? [
          {
            accessorKey: "branchId",
            header: ({ column }) => (
              <HeaderWithSort column={column} title={CHECK_ORDER_CONSTANTS.UI.BRANCH_NAME} />
            ),
            cell: ({ row }) => {
              const branchId = row.original.branchId || CHECK_ORDER_CONSTANTS.DEFAULTS.DASH;
              const businessName =
                row.original.childBusinessName || CHECK_ORDER_CONSTANTS.DEFAULTS.DEFAULT_BRANCH;
              const words = businessName.trim().split(/\s+/);
              const previewName =
                words.length > 8 ? words.slice(0, 6).join(" ") + "..." : businessName;
              const fullText = `${branchId} — ${businessName}`;
              return (
                <TextHoverTooltip
                  preview={previewName}
                  full={fullText}
                  title={CHECK_ORDER_CONSTANTS.UI.BRANCH_DETAILS}
                />
              );
            },
          },
        ]
      : []),
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <HeaderWithSort column={column} title={CHECK_ORDER_CONSTANTS.UI.CREATED} />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs sm:text-sm">
          <TextHoverTooltip
            preview={formatShortDate(row.original.createdAt)}
            full={formatLocalDateTime(row.original.createdAt)}
            title={CHECK_ORDER_CONSTANTS.UI.CREATED_AT}
          />
        </div>
      ),
    },
    {
      accessorKey: "dispatchTime",
      header: ({ column }) => (
        <HeaderWithSort column={column} title={CHECK_ORDER_CONSTANTS.UI.DISPATCHED} />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs sm:text-sm">
          <TextHoverTooltip
            preview={formatShortDate(row.original.dispatchTime)}
            full={formatLocalDateTime(row.original.dispatchTime)}
            title={CHECK_ORDER_CONSTANTS.UI.DISPATCHED_AT}
          />
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <HeaderWithSort column={column} title={CHECK_ORDER_CONSTANTS.UI.PRIORITY} />
      ),
      cell: ({ row }) => {
        const priority = row.original.priority;
        const formattedPriority = priority.charAt(0) + priority.slice(1).toLowerCase();
        return <div className="capitalize text-xs sm:text-sm">{formattedPriority}</div>;
      },
    },
    {
      accessorKey: "receivedTime",
      header: ({ column }) => (
        <HeaderWithSort column={column} title={CHECK_ORDER_CONSTANTS.UI.RECEIVED} />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs sm:text-sm">
          <TextHoverTooltip
            preview={formatShortDate(row.original.receivedTime)}
            full={formatLocalDateTime(row.original.receivedTime)}
            title={CHECK_ORDER_CONSTANTS.UI.RECEIVED_AT}
          />
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: CHECK_ORDER_CONSTANTS.UI.STATUS,
      cell: ({ row }) => {
        const s = row.original.status;
        const color = getStatusColor(s);
        return (
          <span className={`sm:px-1 py-0.5 sm:py-1 text-[5px] sm:text-xs font-medium rounded-full ${color}`}>
            {s}
          </span>
        );
      },
    },
    {
      accessorKey: "viewDetails",
      header: CHECK_ORDER_CONSTANTS.UI.ORDER_DETAILS_LABEL,
      cell: ({ row }) => {
        const isLoading = viewLoadingMap[row.original.id] || false;
        return (
          <Button
            variant="link"
            size="sm"
            onClick={() =>
              handleViewDetails(row.original.id, row.original.branchId, row.original.id)
            }
            disabled={isLoading}
            loading={isLoading}
            loadingText={CHECK_ORDER_CONSTANTS.UI.LOADING}
            className="text-xs sm:text-sm p-1 sm:p-2"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
            <span className="hidden xs:inline">{CHECK_ORDER_CONSTANTS.UI.VIEW}</span>
          </Button>
        );
      },
    },
    {
      accessorKey: "slip",
      header: CHECK_ORDER_CONSTANTS.UI.DISPATCH_SLIP_LABEL,
      cell: ({ row }) => {
        const status = row.original.status;
        const loading = viewSlipLoadingMap[row.original.id] || false;
        return (
          <div className="flex items-center justify-center h-7">
            {[STATUS.DISPATCHED, STATUS.COMPLETED, STATUS.DISCREPANCY].includes(status) ? (
              <Button
                variant="link"
                size="sm"
                onClick={() =>
                  handleViewSlip(
                    row.original.id,
                    row.original.branchId,
                    row.original.orderId
                  )
                }
                disabled={loading}
                loading={loading}
                loadingText=""
                className="text-xs sm:text-sm p-1 sm:p-2"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                <span className="hidden xs:inline">{CHECK_ORDER_CONSTANTS.UI.VIEW}</span>
              </Button>
            ) : (
              <span className="text-gray-500 text-xs font-medium">
                {CHECK_ORDER_CONSTANTS.UI.PENDING}
              </span>
            )}
          </div>
        );
      },
    },
    // MASTER: DISPATCH BUTTON
    ...(isMaster
      ? [
          {
            accessorKey: "dispatch",
            header: CHECK_ORDER_CONSTANTS.UI.ACTIONS,
            cell: ({ row }) => (
              <ButtonTooltip
                tooltipText={CHECK_ORDER_CONSTANTS.UI.DISPATCH}
                disabled={row.original.status !== STATUS.PENDING}
                loading={false}
              >
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    setDispatchPopup({
                      ...row.original,
                      expectedDeliveryDate: getDefaultDeliveryDate(),
                      expectedDeliveryTime: getDefaultDeliveryTime(),
                      trackingInfo: "",
                      slipFile: null,
                    })
                  }
                  disabled={row.original.status !== STATUS.PENDING}
                  className="p-1.5 sm:p-2"
                >
                  <Truck className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </ButtonTooltip>
            ),
          },
        ]
      : []),
    // BRANCH: COMPLETE & DISCREPANCY BUTTONS
    ...(!isMaster
      ? [
          {
            accessorKey: "complete",
            header: CHECK_ORDER_CONSTANTS.UI.ACTIONS,
            cell: ({ row }) => {
              const isDispatched = row.original.status === STATUS.DISPATCHED;
              const isLoadingDiscrepancy = discrepancyLoadingMap[row.original.id] || false;
              return (
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  <ButtonTooltip
                    tooltipText={CHECK_ORDER_CONSTANTS.UI.COMPLETE}
                    disabled={!isDispatched}
                    loading={false}
                  >
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setCompletePopup(row.original)}
                      disabled={!isDispatched}
                      className="p-1.5 sm:p-2"
                    >
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </ButtonTooltip>

                  <ButtonTooltip
                    tooltipText={
                      isLoadingDiscrepancy
                        ? CHECK_ORDER_CONSTANTS.UI.LOADING
                        : CHECK_ORDER_CONSTANTS.UI.DISCREPANCY
                    }
                    disabled={!isDispatched || isLoadingDiscrepancy}
                    loading={isLoadingDiscrepancy}
                  >
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openDiscrepancy(row)}
                      disabled={!isDispatched || isLoadingDiscrepancy}
                      loading={isLoadingDiscrepancy}
                      loadingText=""
                      className="p-1.5 sm:p-2"
                    >
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </ButtonTooltip>
                </div>
              );
            },
          },
        ]
      : []),
  ];

  // ==================== FILTER FIELDS ====================
  const filterFields = [
    {
      type: "dateRange",
      label: CHECK_ORDER_CONSTANTS.UI.DATE_RANGE,
      fromName: "fromDate",
      toName: "toDate",
      value: { fromDate: filters.fromDate, toDate: filters.toDate },
      onChange: (e) => handleFilterChange(e.target.name, e.target.value),
      className: "date-input-black w-full sm:w-auto",
    },
    {
      type: "select",
      name: "status",
      label: CHECK_ORDER_CONSTANTS.UI.STATUS,
      value: filters.status,
      onChange: (e) => handleFilterChange("status", e.target.value),
      options: STATUS_OPTIONS,
      className: "w-full sm:w-auto",
    },
    {
      type: "text",
      name: "orderId",
      label: CHECK_ORDER_CONSTANTS.UI.ORDER_ID,
      placeholder: CHECK_ORDER_CONSTANTS.UI.ENTER_ORDER_ID,
      value: filters.orderId,
      onChange: (e) => handleFilterChange("orderId", e.target.value),
      className: "w-full sm:w-auto",
    },
    ...(isMaster && fullBranchOptions.length > 1
      ? [
          {
            type: "select",
            name: "branch",
            label: CHECK_ORDER_CONSTANTS.UI.BRANCH,
            value: filters.branch,
            onChange: (e) => handleFilterChange("branch", e.target.value),
            options: fullBranchOptions,
            className: "w-full sm:w-auto",
          },
        ]
      : []),
  ];

  // ==================== RENDER ====================
  return (
    <>
      {/* Alerts */}
      <div className="px-2 sm:px-4">
        <Alert
          variant="success"
          message={success}
          show={!!success}
          onClose={() => setSuccess(null)}
          className="mb-2 sm:mb-4"
        />
        <Alert
          variant="error"
          message={error}
          show={!!error}
          onClose={() => setError(null)}
          action={fetchOrders}
          actionLabel={CHECK_ORDER_CONSTANTS.UI.RETRY}
          className="mb-2 sm:mb-4"
        />
      </div>

      {/* Header Card */}
      <Card className="mb-6" bodyClassName="p-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl font-bold text-gray-800 truncate max-w-[200px] sm:max-w-full">
              {isMaster
                ? CHECK_ORDER_CONSTANTS.UI.MASTER_ORDERS
                : CHECK_ORDER_CONSTANTS.UI.BRANCH_ORDERS}
            </span>
          </div>
          <Button
            variant="primary"
            onClick={handleRefresh}
            disabled={loading}
            loading={loading}
            loadingText={CHECK_ORDER_CONSTANTS.UI.REFRESHING}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            size="md"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">{CHECK_ORDER_CONSTANTS.UI.REFRESH}</span>
          </Button>
        </div>
      </Card>

      {/* Orders Table */}
      <Table
        data={orders}
        columns={columns}
        loading={loading}
        hideDefaultActions
        filterFields={filterFields}
        filters={filters}
        onFilterChange={handleFilterChange}
        serverSideFiltering={true}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        noDataMessage={orders.length === 0 && !loading ? NO_RECORD_FOUND : null}
      />

      {/* ORDER DETAILS MODAL */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        size="xl"
        title={`${CHECK_ORDER_CONSTANTS.UI.ORDER_DETAILS} #${displayOrderId(selectedOrder?.orderId)}`}
        className="max-h-[90vh] overflow-y-auto"
      >
        {selectedOrder && (
          <div className="px-2 sm:px-4">
            {isMaster && (
              <p className="mb-2 text-sm sm:text-base">
                <strong>{CHECK_ORDER_CONSTANTS.UI.BRANCH}:</strong>{" "}
                {getBusinessNameForOrder(selectedOrder.branchId)}
              </p>
            )}

            <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4 text-xs sm:text-sm">
              <p>
                <strong>{CHECK_ORDER_CONSTANTS.UI.CREATED_AT}:</strong>{" "}
                {formatLocalDateTime(selectedOrder.createdAt)}
              </p>
              {selectedOrder.dispatch?.timestamp && (
                <p className="text-blue-700">
                  <strong>{CHECK_ORDER_CONSTANTS.UI.DISPATCHED_AT}:</strong>{" "}
                  {formatLocalDateTime(selectedOrder.dispatch.timestamp)}
                </p>
              )}
              {selectedOrder.receipt?.timestamp && (
                <p className="text-green-700">
                  <strong>{CHECK_ORDER_CONSTANTS.UI.RECEIVED_AT}:</strong>{" "}
                  {formatLocalDateTime(selectedOrder.receipt.timestamp)}
                </p>
              )}
            </div>

            <p className="mb-3 sm:mb-4 text-xs sm:text-sm">
              <strong>{CHECK_ORDER_CONSTANTS.UI.STATUS}:</strong>{" "}
              <span
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}
              >
                {selectedOrder.status}
              </span>
            </p>

            <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
              {selectedOrder.dispatch?.notification && (
                <span className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-green-800 bg-green-100 rounded-full">
                  <Truck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {selectedOrder.dispatch.notification}
                </span>
              )}
              {selectedOrder.receipt && !selectedOrder.receipt.complete && (
                <span className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-orange-800 bg-orange-100 rounded-full">
                  {CHECK_ORDER_CONSTANTS.UI.INCOMPLETE_DELIVERY}
                </span>
              )}
            </div>

            <div className="mt-3 sm:mt-4 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border table-fixed min-w-[600px] sm:min-w-full">
                <thead className="bg-indigo-100">
                  <tr>
                    <th className="p-1.5 sm:p-2 text-left w-2/5">Medicine</th>
                    <th className="p-1.5 sm:p-2 text-left w-1/5">Current</th>
                    <th className="p-1.5 sm:p-2 text-left w-1/5">Required</th>
                    <th className="p-1.5 sm:p-2 text-left w-1/5">By Date</th>
                    <th className="p-1.5 sm:p-2 text-left w-1/5">{CHECK_ORDER_CONSTANTS.UI.PRIORITY}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.medicines?.map((m, i) => {
                    const isShort = m.currentStock < m.requiredStock;
                    const commentText = selectedOrder.receipt?.comments?.toLowerCase() || "";
                    const isMentionedInComment = commentText.includes(m.name.toLowerCase());
                    return (
                      <tr
                        key={i}
                        className={`border-b ${isShort || isMentionedInComment ? "bg-yellow-50" : ""}`}
                      >
                        <td className="p-1.5 sm:p-2 break-words">
                          <div className="flex flex-col xs:flex-row items-start gap-1">
                            <span className="text-xs sm:text-sm">{m.name}</span>
                            <div className="flex flex-wrap gap-1">
                              {isMentionedInComment && (
                                <span className="px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-xs font-bold text-red-700 bg-red-200 rounded whitespace-nowrap">
                                  MISSING
                                </span>
                              )}
                              {isShort && !isMentionedInComment && (
                                <span className="px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-xs font-bold text-orange-700 bg-orange-200 rounded whitespace-nowrap">
                                  SHORT
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-1.5 sm:p-2 text-xs sm:text-sm">{m.currentStock}</td>
                        <td className="p-1.5 sm:p-2 text-xs sm:text-sm">{m.requiredStock}</td>
                        <td className="p-1.5 sm:p-2 text-xs sm:text-sm">
                          {m.requiredByDate
                            ? ORDER_MODULE_CONSTANTS.formatDate(m.requiredByDate, false)
                            : CHECK_ORDER_CONSTANTS.DEFAULTS.NO_DATA}
                        </td>
                        <td className="p-1.5 sm:p-2">
                          <span className={`px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-xs ${getPriorityColor(m.priority)}`}>
                            {m.priority || PRIORITY.NORMAL}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selectedOrder.receipt?.missingMedicines &&
              selectedOrder.receipt.missingMedicines.length > 0 && (
                <div className="mt-4 sm:mt-6 p-2 sm:p-3 bg-red-50 border border-red-200 rounded text-xs sm:text-sm">
                  <strong>{CHECK_ORDER_CONSTANTS.UI.MISSING_ITEMS}:</strong>
                  <ul className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
                    {selectedOrder.receipt.missingMedicines.map((m, i) => (
                      <li key={i} className="flex flex-col xs:flex-row xs:justify-between">
                        <span>
                          {m.name} ({m.medicineId})
                        </span>
                        <span>
                          Received: {m.recievedStock} / Required: {m.requiredStock}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {selectedOrder.receipt?.comments && (
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 rounded border text-xs sm:text-sm">
                <strong>{CHECK_ORDER_CONSTANTS.UI.COMMENTS}:</strong> {selectedOrder.receipt.comments}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ==================== DISPATCH POPUP ==================== */}
      <Modal
        isOpen={!!dispatchPopup}
        onClose={() => setDispatchPopup(null)}
        size="md"
        title={`${CHECK_ORDER_CONSTANTS.UI.DISPATCH_ORDER} #${displayOrderId(dispatchPopup?.orderId)}`}
        className="max-h-[90vh] overflow-y-auto"
      >
        {dispatchPopup && (
          <div className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">

              {/* Date picker — calendar only */}
              <DatePicker
                label={CHECK_ORDER_CONSTANTS.UI.EXPECTED_DELIVERY_DATE}
                value={dispatchPopup.expectedDeliveryDate}
                onChange={(value) =>
                  setDispatchPopup((p) => ({ ...p, expectedDeliveryDate: value }))
                }
                required
                className="w-full"
                inputClassName="text-sm py-2"
              />

              {/* Separate native time input — no T, no ISO weirdness */}
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {CHECK_ORDER_CONSTANTS.UI.EXPECTED_DELIVERY_TIME}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={dispatchPopup.expectedDeliveryTime || ""}
                  onChange={(e) =>
                    setDispatchPopup((p) => ({ ...p, expectedDeliveryTime: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <InputTextarea
                label="Tracking Info (optional)"
                placeholder={CHECK_ORDER_CONSTANTS.UI.TRACKING_INFO_PLACEHOLDER}
                value={dispatchPopup.trackingInfo}
                onChange={(e) =>
                  setDispatchPopup((p) => ({ ...p, trackingInfo: e.target.value }))
                }
                rows={3}
                className="w-full"
                inputClassName="text-sm"
              />

              <div className="mb-4 sm:mb-6">
                <FileUpload
                  label={CHECK_ORDER_CONSTANTS.UPLOAD.DISPATCH_SLIP_LABEL}
                  accept={CHECK_ORDER_CONSTANTS.UPLOAD.DISPATCH_SLIP_ACCEPT}
                  onChange={(file) => {
                    setDispatchPopup((p) => ({ ...p, slipFile: file }));
                    setError(null);
                  }}
                  preview={dispatchPopup.slipFile}
                  icon={<Upload className="w-8 h-8 sm:w-10 sm:h-10" />}
                  className="w-full"
                  showPreviewOnIcon={true}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setDispatchPopup(null)}
                className="w-full sm:w-auto"
                size="md"
              >
                {CHECK_ORDER_CONSTANTS.UI.CANCEL}
              </Button>
              <Button
                variant="primary"
                onClick={handleDispatch}
                disabled={
                  isDispatching ||
                  !dispatchPopup.expectedDeliveryDate ||
                  !dispatchPopup.expectedDeliveryTime ||
                  !dispatchPopup.slipFile
                }
                loading={isDispatching}
                loadingText={CHECK_ORDER_CONSTANTS.UI.DISPATCHING}
                className="w-full sm:w-auto"
                size="md"
              >
                {CHECK_ORDER_CONSTANTS.UI.DISPATCH}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ==================== COMPLETE POPUP ==================== */}
      <Modal
        isOpen={!!completePopup}
        onClose={() => setCompletePopup(null)}
        size="md"
        title={CHECK_ORDER_CONSTANTS.UI.COMPLETE_ORDER}
        className="max-h-[90vh] overflow-y-auto"
      >
        {completePopup && (
          <div className="p-4 sm:p-6">
            <InputTextarea
              label="Comments (optional)"
              placeholder={CHECK_ORDER_CONSTANTS.UI.COMMENTS_PLACEHOLDER}
              value={completePopup.comments}
              onChange={(e) => setCompletePopup((p) => ({ ...p, comments: e.target.value }))}
              rows={3}
              className="w-full mb-4"
              inputClassName="text-sm"
            />
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setCompletePopup(null)}
                className="w-full sm:w-auto"
                size="md"
              >
                {CHECK_ORDER_CONSTANTS.UI.CANCEL}
              </Button>
              <Button
                variant="success"
                onClick={handleComplete}
                disabled={isCompleting}
                loading={isCompleting}
                loadingText={CHECK_ORDER_CONSTANTS.UI.COMPLETING}
                className="w-full sm:w-auto"
                size="md"
              >
                {CHECK_ORDER_CONSTANTS.UI.COMPLETE}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ==================== DISCREPANCY POPUP ==================== */}
      <Modal
        isOpen={!!discrepancyPopup}
        onClose={() => setDiscrepancyPopup(null)}
        size="lg"
        title={CHECK_ORDER_CONSTANTS.UI.REPORT_DISCREPANCY}
        className="max-h-[90vh] overflow-y-auto"
      >
        {discrepancyPopup && (
          <div className="p-4 sm:p-6">
            <InputTextarea
              label="Comments (optional)"
              placeholder={CHECK_ORDER_CONSTANTS.UI.DISCREPANCY_COMMENTS_PLACEHOLDER}
              value={discrepancyPopup.comments}
              onChange={(e) =>
                setDiscrepancyPopup((p) => ({ ...p, comments: e.target.value }))
              }
              rows={3}
              className="w-full mb-6"
              inputClassName="text-sm"
            />

            <div className="mb-4 sm:mb-6">
              <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />{" "}
                {CHECK_ORDER_CONSTANTS.UI.SHORT_MISSING_MEDICINES}
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {discrepancyPopup.medicines.map((med, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <InputCheckbox
                        label=""
                        name={`medicine-${idx}`}
                        checked={med.selected}
                        onChange={() => toggleMedicineSelection(idx)}
                        className="flex-shrink-0"
                        disabled={false}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base break-words">{med.name}</div>
                        <div className="text-xs text-gray-600">ID: {med.medicineId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 justify-end sm:justify-start ml-8 sm:ml-0">
                      <span className="text-xs whitespace-nowrap">
                        Req: <strong>{med.requiredStock}</strong>
                      </span>
                      <span className="text-xs">→</span>
                      <InputText
                        type="number"
                        value={med.recievedStock}
                        onChange={(e) => updateReceivedStock(idx, e.target.value)}
                        className="w-20 sm:w-24"
                        inputClassName="text-sm py-1 px-2"
                        min="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setDiscrepancyPopup(null)}
                className="w-full sm:w-auto"
                size="md"
              >
                {CHECK_ORDER_CONSTANTS.UI.CANCEL}
              </Button>
              <Button
                variant="danger"
                onClick={submitDiscrepancy}
                disabled={
                  isDiscrepancyLoading ||
                  discrepancyPopup.medicines.filter((m) => m.selected).length === 0
                }
                loading={isDiscrepancyLoading}
                loadingText={CHECK_ORDER_CONSTANTS.UI.SUBMITTING}
                className="w-full sm:w-auto"
                size="md"
              >
                {CHECK_ORDER_CONSTANTS.UI.SUBMIT_DISCREPANCY}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ==================== SLIP VIEW MODAL ==================== */}
      <Modal
        isOpen={!!selectedSlip}
        onClose={() => {
          if (selectedSlip?.url) URL.revokeObjectURL(selectedSlip.url);
          setSelectedSlip(null);
        }}
        size="xl"
        title={`${CHECK_ORDER_CONSTANTS.UI.DISPATCH_SLIP} — Order #${displayOrderId(selectedSlip?.displayOrderId)}`}
        className="max-h-[90vh] overflow-y-auto"
      >
        {selectedSlip && (
          <div className="flex flex-col items-center p-4 sm:p-6">
            {selectedSlip.contentType.startsWith("image/") ? (
              <img
                src={selectedSlip.url}
                alt="Dispatch Slip"
                className="max-w-full max-h-[50vh] sm:max-h-[70vh] rounded-lg shadow-lg"
              />
            ) : selectedSlip.contentType === "application/pdf" ? (
              <embed
                src={selectedSlip.url}
                type="application/pdf"
                width="100%"
                height="500px"
                className="rounded-lg"
              />
            ) : (
              <p className="text-gray-600 text-sm">
                {CHECK_ORDER_CONSTANTS.UI.PREVIEW_NOT_AVAILABLE}
              </p>
            )}
            <a
              href={selectedSlip.url}
              download={`${CHECK_ORDER_CONSTANTS.UPLOAD.FILE_DOWNLOAD_PREFIX}${
                selectedSlip.displayOrderId || selectedSlip.internalId
              }`}
              className="mt-6"
            >
              <Button variant="primary" size="md">
                {CHECK_ORDER_CONSTANTS.UI.DOWNLOAD_SLIP}
              </Button>
            </a>
          </div>
        )}
      </Modal>
    </>
  );
}