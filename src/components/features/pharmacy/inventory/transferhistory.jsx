// transferhistory.jsx - FIXED VERSION - Grouped medicines under same transfer with tooltip
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import { getToken } from '../../../../services/tokenUtils';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/endpoint/inventory/inventoryEnd';
import ExportReports from '../../../common/reports/ExportReports';
import { NO_RECORD_FOUND } from '../../../constants/Messages';
import { useAuth } from '../../../auth/hooks/useAuth';
import { 
  Package, History, X, Clock, CheckCircle, AlertCircle, RefreshCw,
  Truck, Ban, RotateCcw, CheckSquare, Send, ArrowLeftRight, Archive,
  ChevronRight, Loader2, Shield, PackageX, Info, Calendar
} from 'lucide-react';
import { getVendorChildIds } from '../../../../services/vendorUtils';
import INVENTORY_MODULE_CONSTANTS from './inventoryconstants/inventoryModuleConstants';
import Button from '../../../../components/ui/forms/Button';
import ButtonTooltip from '../../../../components/ui/forms/ButtonTooltip'; 
import Badge from '../../../../components/ui/dataDisplay/Badge';
import Modal from '../../../../components/ui/Modal';
import Alert from '../../../../components/ui/feedback/Alert';
import InputTextarea from '../../../../components/ui/forms/InputTextarea';
import InputText from '../../../../components/ui/forms/InputText';
import Card from '../../../../components/ui/Card';

// ==================== MESSAGE & UI CONSTANTS ====================
const TRANSFER_HISTORY_CONSTANTS = {
  ERRORS: {
    VENDOR_ID_NOT_FOUND: "Vendor ID not found.",
    FETCH_TRANSFERS_FAILED: "Failed to fetch transfers",
    AUDIT_LOGS_FAILED: "Failed to load audit logs",
    RELEASE_FAILED: "Failed to release transfer",
    CANCEL_FAILED: "Failed to cancel transfer",
    RECEIVE_FAILED: "Failed to receive transfer",
    CANCEL_ACKNOWLEDGE_FAILED: "Failed to acknowledge cancellation",
    NOTES_REQUIRED: "Notes are required",
    QUANTITY_REQUIRED: "Quantity is required",
    INVALID_QUANTITY: "Quantity cannot exceed requested amount",
  },
  
  SUCCESS: {
    RELEASE_SUCCESS: "Transfer released successfully",
    CANCEL_SUCCESS: "Transfer cancelled successfully",
    RECEIVE_SUCCESS: "Transfer received successfully",
    CANCEL_ACKNOWLEDGE_SUCCESS: "Cancellation acknowledged successfully",
  },
  
  UI: {
    TRANSFER_HISTORY: "Transfer History",
    ALL_BRANCHES: "All Branches",
    CURRENT_BRANCH: "Current Branch",
    TRANSFER_DETAILS: "Transfer Details",
    AUDIT_LOG: "Audit Log",
    AUDIT_LOG_TITLE: "Transfer Audit Trail",
    AUDIT_ENTRIES: "Audit Entries",
    RELEASE_TRANSFER: "Release Transfer (Source Action)",
    CANCEL_TRANSFER: "Cancel Transfer (Master Only)",
    RECEIVE_TRANSFER: "Receive Transfer (Target Action)",
    CANCEL_ACKNOWLEDGE: "Acknowledge Cancellation (Source Action)",
    AUDIT: "Audit",
    RELEASE: "Release",
    CANCEL: "Cancel",
    RECEIVE: "Receive",
    ACK_CANCEL: "Ack. Cancel",
    REFRESH: "Refresh",
    RETRY: "Retry",
    SUBMIT: "Submit",
    LOADING: "Loading...",
    REFRESHING: "Refreshing...",
    LOADING_AUDIT: "Loading audit...",
    RELEASING: "Releasing...",
    CANCELLING: "Cancelling...",
    RECEIVING: "Receiving...",
    ACKNOWLEDGING: "Acknowledging...",
    PENDING: "pending",
    SOURCE_RELEASED: "source_released",
    TRANSFERRED: "transferred",
    CANCELLED: "cancelled",
    CANCELLED_ROLLBACK: "cancelled_rollback",
    CANCEL_REQUESTED: "cancel_requested",
    TRANSFER_ID: "Transfer ID",
    STATUS: "Status",
    SOURCE_VENDOR: "Source Branch",
    TARGET_VENDOR: "Target Branch",
    MEDICINE: "Medicine",
    BATCH: "Batch",
    QUANTITY: "Qty",
    AVAILABLE: "Available",
    EXPIRY: "Expiry",
    ACTIONS: "Actions",
    ACTION: "Action",
    PERFORMED_BY: "Performed By",
    PERFORMED_AT: "Performed At",
    NOTES_LABEL: "Notes",
    SEARCH_PLACEHOLDER: "Search by medicine name or transfer ID...",
    NOTES_PLACEHOLDER: "Enter notes (optional)...",
    CANCEL_REASON_PLACEHOLDER: "Enter cancellation reason...",
    ACKNOWLEDGE_NOTES_PLACEHOLDER: "Enter acknowledge notes...",
    QUANTITY_PLACEHOLDER: "Enter quantity",
    CREATED: "created",
    SOURCE_RELEASED_ACTION: "source_released",
    ACCEPTED: "accepted",
    CANCELLED_ACTION: "cancelled",
    DASH: "—",
    NO_NOTES: "No notes",
    VIEW_AUDIT_LOG: "View audit log for this transfer",
    CLICK_TRANSFER_TIP: "Click on Transfer ID to view audit details",
    VIEWING: "Viewing",
    WAIT: "Wait",
    PLEASE_WAIT: "Please wait for the current audit log to load",
    DEFAULT_SORT_ORDER: "desc",
    DEFAULT_SORT_BY: "requested_at",
    DEFAULT_STATUS: "",
    NO_AUDIT_LOGS: "No audit logs found",
    AUDIT_HISTORY_TITLE: "Audit History",
    SOURCE_ACTION: "Source Action",
    TARGET_ACTION: "Target Action",
    MASTER_ACTION: "Master Action",
    MASTER_ONLY: "Master Only",
    AUDIT_TIMELINE: "Audit Timeline",
    TOOLTIP_RELEASE: "Release stock to target branch",
    TOOLTIP_CANCEL: "Cancel transfer (Master only)",
    TOOLTIP_RECEIVE: "Receive full quantity",
    TOOLTIP_ACK_CANCEL: "Acknowledge cancellation (Source)",
    MULTIPLE_MEDICINES: "This transfer contains multiple medicines. Hover to see all.",
    VIEW_ALL_MEDICINES: "View all medicines in this transfer",
  },
};

// ==================== TIMEZONE HELPER FUNCTIONS ====================
// Get user's local timezone
const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

// ==================== TIMEZONE HELPER FUNCTIONS ====================
// Convert UTC string to local datetime
const formatDateTime = (dateString) => {
  if (!dateString) return TRANSFER_HISTORY_CONSTANTS.UI.DASH;
  try {
    // Parse the UTC string correctly by appending 'Z' to indicate UTC
    let utcDate;
    
    // If the string doesn't have timezone info, treat it as UTC
    if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      utcDate = new Date(dateString + 'Z');
    } else {
      utcDate = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) return dateString;
    
    // Convert to local timezone
    return utcDate.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } catch {
    return dateString;
  }
};

// Convert UTC string to local date only
const formatDate = (dateString) => {
  if (!dateString) return TRANSFER_HISTORY_CONSTANTS.UI.DASH;
  try {
    // Parse the UTC string correctly by appending 'Z' to indicate UTC
    let utcDate;
    
    // If the string doesn't have timezone info, treat it as UTC
    if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      utcDate = new Date(dateString + 'Z');
    } else {
      utcDate = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) return dateString;
    
    // Convert to local timezone
    return utcDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } catch {
    return dateString;
  }
};

// Convert UTC string to local time only
const formatTimeOnly = (dateString) => {
  if (!dateString) return '';
  try {
    // Parse the UTC string correctly by appending 'Z' to indicate UTC
    let utcDate;
    
    // If the string doesn't have timezone info, treat it as UTC
    if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      utcDate = new Date(dateString + 'Z');
    } else {
      utcDate = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) return '';
    
    // Convert to local timezone
    return utcDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } catch {
    return '';
  }
};

// For audit log formatting
const formatAuditDate = (dateString) => {
  if (!dateString) return TRANSFER_HISTORY_CONSTANTS.UI.DASH;
  try {
    // Parse the UTC string correctly by appending 'Z' to indicate UTC
    let utcDate;
    
    // If the string doesn't have timezone info, treat it as UTC
    if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      utcDate = new Date(dateString + 'Z');
    } else {
      utcDate = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) return dateString;
    
    // Convert to local timezone
    return utcDate.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } catch {
    return dateString;
  }
};

// Get action color for audit entries
const getAuditActionConfig = (action) => {
  switch (action?.toLowerCase()) {
    case 'created':
      return { icon: <Clock className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Created' };
    case 'source_released':
      return { icon: <Truck className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Released' };
    case 'accepted':
      return { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-100 text-green-800 border-green-200', label: 'Accepted' };
    case 'cancelled':
      return { icon: <Ban className="w-4 h-4" />, color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Cancelled' };
    case 'cancelled_rollback':
      return { icon: <Archive className="w-4 h-4" />, color: 'bg-pink-100 text-pink-800 border-pink-200', label: 'Rollback' };
    case 'cancel_requested':
      return { icon: <AlertCircle className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Cancel Req' };
    case 'cancel_acknowledged':
      return { icon: <CheckSquare className="w-4 h-4" />, color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Ack Cancel' };
    default:
      return { icon: <AlertCircle className="w-4 h-4" />, color: 'bg-gray-100 text-gray-800 border-gray-200', label: action || 'Unknown' };
  }
};

// Get status config
const getStatusConfig = (status) => {
  switch (status?.toLowerCase()) {
    case TRANSFER_HISTORY_CONSTANTS.UI.PENDING:
      return { color: 'yellow', label: 'Pending' };
    case TRANSFER_HISTORY_CONSTANTS.UI.SOURCE_RELEASED:
      return { color: 'indigo', label: 'Source Released' };
    case TRANSFER_HISTORY_CONSTANTS.UI.TRANSFERRED:
      return { color: 'purple', label: 'Transferred' };
    case TRANSFER_HISTORY_CONSTANTS.UI.CANCELLED:
      return { color: 'gray', label: 'Cancelled' };
    case TRANSFER_HISTORY_CONSTANTS.UI.CANCELLED_ROLLBACK:
      return { color: 'pink', label: 'Cancelled Rollback' };
    case TRANSFER_HISTORY_CONSTANTS.UI.CANCEL_REQUESTED:
      return { color: 'yellow', label: 'Cancel Requested' };
    default:
      return { color: 'gray', label: status || 'Unknown' };
  }
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);
  return (
    <Badge variant={config.color} size="sm">
      {config.label}
    </Badge>
  );
};

// ============ NEW SEPARATE COMPONENT: Audit Timeline Column ============
const AuditTimelineCell = ({ auditLog }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef(null);

  if (!auditLog || auditLog.length === 0) {
    return <span className="text-gray-400 text-xs">No audit logs</span>;
  }

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 200);
  };

  // Get the last 2 actions for preview
  const recentActions = auditLog.slice(-2);
  const totalActions = auditLog.length;

  return (
    <div className="relative inline-block w-full">
      {/* Preview - Shows last 2 actions with their times */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="cursor-help space-y-1"
      >
        {recentActions.map((log, index) => {
          const config = getAuditActionConfig(log.action);
          return (
            <div key={index} className="flex items-center gap-1 text-xs">
              <span className={`px-1.5 py-0.5 rounded-full ${config.color} font-medium whitespace-nowrap text-[10px]`}>
                {config.label}
              </span>
             <span className="text-gray-500 text-[10px]">
  {INVENTORY_MODULE_CONSTANTS.formatDate(log.at, true).split(', ').pop()}
</span>
            </div>
          );
        })}
        {totalActions > 2 && (
          <div className="text-[10px] text-blue-600 font-medium">
            +{totalActions - 2} more actions
          </div>
        )}
      </div>

      {/* Tooltip with full audit timeline */}
      {showTooltip && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-none">
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="bg-white rounded-xl shadow-2xl p-5 border border-gray-300 min-w-[400px] max-w-2xl pointer-events-auto"
          >
            <div className="flex items-center gap-2 mb-4 border-b pb-3">
              <History className="w-5 h-5 text-purple-600" />
              <h4 className="font-bold text-gray-800">
                Complete Audit Timeline ({totalActions} {totalActions === 1 ? 'entry' : 'entries'})
              </h4>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {auditLog.map((log, index) => {
                const config = getAuditActionConfig(log.action);
                return (
                  <div key={index} className="flex items-start gap-3 text-sm bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium min-w-[90px] text-center ${config.color} border`}>
                      {config.label}
                    </span>
                    <div className="flex-1">
                      <span className="text-gray-900 font-mono text-sm block">
                        {INVENTORY_MODULE_CONSTANTS.formatDate(log.at, true)} {/* Full datetime in local timezone */}
                      </span>
                      {log.by_name && (
                        <span className="text-xs text-gray-500 mt-1 block">
                          By: {log.by_name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ============ Medicine Cell Component (ONLY FOR MEDICINES, NO AUDIT LOGS) ============
const MedicineCell = ({ transfer, items }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef(null);

  // If no items array, just show the single medicine name
  if (!items || items.length === 0) {
    return <span className="text-sm font-medium text-gray-700">{transfer.medicine_name || TRANSFER_HISTORY_CONSTANTS.UI.DASH}</span>;
  }

  // If only one item, show it normally
  if (items.length === 1) {
    const medicineName = items[0].medicine_name || TRANSFER_HISTORY_CONSTANTS.UI.DASH;
    const preview = medicineName.length > 20 ? `${medicineName.substring(0, 20)}...` : medicineName;
    return (
      <div className="text-sm font-medium text-gray-700">
        {preview}
      </div>
    );
  }

  // Multiple items - show compact pill with count
  const uniqueMedicines = [...new Map(items.map(item => [item.medicine_id, item])).values()];
  const medicineCount = uniqueMedicines.length;
  const totalItems = items.length;

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 200);
  };

  return (
    <div className="relative inline-block w-full">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex items-center gap-1 cursor-help bg-blue-50 hover:bg-blue-100 rounded-md px-2 py-1 transition-colors"
      >
        <Package className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-xs font-medium text-blue-700">
          {medicineCount}
        </span>
        <span className="text-[10px] bg-blue-200 text-blue-800 px-1 rounded-full">
          {totalItems}
        </span>
      </div>

      {showTooltip && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-none">
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="bg-white rounded-xl shadow-2xl p-6 border border-gray-300 max-w-2xl max-h-[80vh] overflow-y-auto pointer-events-auto"
          >
            <h3 className="font-bold text-lg mb-4 text-center text-gray-800 border-b pb-3 flex items-center gap-2">
              Medicines in Transfer: {transfer.transfer_id}
            </h3>
            
            {/* ONLY MEDICINES - NO AUDIT LOGS HERE */}
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.medicine_name}</p>
                      <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                        <span>Batch: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{item.batch_code}</code></span>
                        <span>Qty: <span className="font-medium text-blue-600">{item.requested_quantity}</span></span>
                        <span>Expiry: <span className="font-medium">{INVENTORY_MODULE_CONSTANTS.formatDate(item.source_expiry_at_request, false)}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Text hover tooltip component
const TextHoverTooltip = ({ preview, full, title, items = [], invoice_no }) => {
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

export default function TransferHistory() {
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  const auditLogRef = useRef(null);
  
  const { user } = useAuth();

  const [transfers, setTransfers] = useState([]);
  const [rawTransfers, setRawTransfers] = useState([]); // Store original API response with items
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(TRANSFER_HISTORY_CONSTANTS.UI.DEFAULT_STATUS);
  const [sortBy, setSortBy] = useState(TRANSFER_HISTORY_CONSTANTS.UI.DEFAULT_SORT_BY);
  const [sortOrder, setSortOrder] = useState(TRANSFER_HISTORY_CONSTANTS.UI.DEFAULT_SORT_ORDER);
  
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // State for expanded audit logs
  const [expandedTransfers, setExpandedTransfers] = useState({});
  const [auditLogsMap, setAuditLogsMap] = useState({});
  const [auditLoadingMap, setAuditLoadingMap] = useState({});
  const [currentlyLoadingTransfer, setCurrentlyLoadingTransfer] = useState(null);
  const [selectedTransferForAudit, setSelectedTransferForAudit] = useState(null);
  const [isAuditVisible, setIsAuditVisible] = useState(false);

  const [releaseModal, setReleaseModal] = useState({ open: false, transfer: null, notes: '' });
  const [cancelModal, setCancelModal] = useState({ open: false, transfer: null, notes: '', forceRollback: false });
  const [receiveModal, setReceiveModal] = useState({ open: false, transfer: null, notes: '' });
  const [cancelAcknowledgeModal, setCancelAcknowledgeModal] = useState({ open: false, transfer: null, notes: '' });

  const [actionLoadingMap, setActionLoadingMap] = useState({});

  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0
  });

  const { 
    currentVendorId, 
    originalBranchId, 
    isMaster, 
    currentBusinessName 
  } = INVENTORY_MODULE_CONSTANTS.getUserInfo(user);
  
  const childVendors = getVendorChildIds() || [];

  useEffect(() => {
    setSelectedBranch(currentBusinessName);
    setSelectedValue('current');
    setSelectedBranchId(currentVendorId);
  }, [currentVendorId, currentBusinessName]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      INVENTORY_MODULE_CONSTANTS.cancelApiRequest(controllerRef);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Add refresh function
  const handlePageRefresh = () => {
    fetchTransferHistory();
  };

const dynamicTitle = useMemo(() => {
  const branchLabel = selectedBranch;
  const isCurrent = selectedValue === 'current';
  const isAll = selectedValue === 'all';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <Package className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 flex-shrink-0" />
        <span className="text-xl sm:text-2xl font-bold text-gray-800 truncate max-w-[180px] sm:max-w-full">
          {TRANSFER_HISTORY_CONSTANTS.UI.TRANSFER_HISTORY}
        </span>
      </div>
      <span className="hidden sm:inline text-gray-500">—</span>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm w-fit ${
          isCurrent 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : isAll 
              ? 'bg-purple-100 text-purple-800 border border-purple-300' 
              : 'bg-blue-100 text-blue-800 border border-blue-300'
        }`}>
          {isCurrent ? currentBusinessName : isAll ? TRANSFER_HISTORY_CONSTANTS.UI.ALL_BRANCHES : `Branch: ${branchLabel}`}
        </span>
      
      </div>
    </div>
  );
}, [selectedBranch, selectedValue, currentBusinessName, isMaster]);

  // ============ API CALLS ============
  const fetchTransferHistory = async () => {
    INVENTORY_MODULE_CONSTANTS.cancelApiRequest(controllerRef);
    controllerRef.current = INVENTORY_MODULE_CONSTANTS.createAbortController();

    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, currentVendorId);

      const params = {
        vendor_id: selectedBranchId || currentVendorId,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: pagination.page,
        page_size: pagination.page_size,
        search: searchTerm || undefined
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }

      const endpoint = apiEndpoints.transferHistory(
        selectedBranchId || currentVendorId,
        sortBy,
        sortOrder,
        pagination.page,
        pagination.page_size
      );

      const { data } = await apiService.get(endpoint, {
        headers,
        params,
        signal: controllerRef.current.signal,
        timeout: INVENTORY_MODULE_CONSTANTS.API_TIMEOUT
      });

      if (!isMountedRef.current) return;

      if (data.status === "success" && Array.isArray(data.data)) {
        // Store raw transfers with their items
        setRawTransfers(data.data);
        
        // Transform for table display - keep one row per transfer, not per item
        const displayTransfers = data.data.map(transfer => {
          // Count unique medicines
          const uniqueMedicines = transfer.items ? 
            [...new Map(transfer.items.map(item => [item.medicine_id, item])).values()] : [];
          
          return {
            transfer_id: transfer.transfer_id,
            status: transfer.status,
            source_vendor_name: transfer.source_vendor_name,
            target_vendor_name: transfer.target_vendor_name,
            target_vendor_id: transfer.target_vendor_id,
            source_vendor_id: transfer.source_vendor_id,
            _id: transfer._id,
            // For display purposes, show medicine count instead of single medicine
            medicine_name: uniqueMedicines.length > 1 
              ? `${uniqueMedicines.length} medicines` 
              : (transfer.items?.[0]?.medicine_name || TRANSFER_HISTORY_CONSTANTS.UI.DASH),
            // Store items for the medicine cell component
            items: transfer.items || [],
            // Store audit logs for the timeline column
            audit_log: transfer.audit_log || [],
            // For sorting/filtering, we need representative values
            batch_code: transfer.items?.length === 1 ? transfer.items[0].batch_code : 'Multiple',
            requested_quantity: transfer.items?.reduce((sum, item) => sum + (item.requested_quantity || 0), 0) || 0,
            available_at_request: transfer.items?.[0]?.available_at_request || 0,
            source_expiry_at_request: transfer.items?.[0]?.source_expiry_at_request || null
          };
        });

        setTransfers(displayTransfers);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total_records || 0,
          total_pages: data.pagination?.total_pages || 0
        }));
        setSuccess();
      } else {
        setTransfers([]);
        setRawTransfers([]);
        setPagination(prev => ({ ...prev, total: 0, total_pages: 0 }));
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      INVENTORY_MODULE_CONSTANTS.handleApiError(err, setError);
      setTransfers([]);
      setRawTransfers([]);
      setPagination(prev => ({ ...prev, total: 0, total_pages: 0 }));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const fetchAuditLogs = async (transferId) => {
    if (!transferId) return null;
    
    try {
      const token = getToken();
      if (!token) return null;

      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, currentVendorId);

      const endpoint = apiEndpoints.auditTransfer(transferId);
      
      const { data } = await apiService.get(endpoint, {
        headers,
        timeout: INVENTORY_MODULE_CONSTANTS.API_TIMEOUT
      });

      if (data.status === "success" && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      return null;
    }
  };

  // Handle expand/collapse
  const handleExpandTransfer = useCallback(async (transferId, transfer) => {
    if (!transferId || !transferId.trim() || !isMountedRef.current) return;
    
    if (currentlyLoadingTransfer !== null) return;

    if (selectedTransferForAudit === transferId && isAuditVisible) {
      setSelectedTransferForAudit(null);
      setAuditLogsMap(prev => ({ ...prev, [transferId]: [] }));
      setIsAuditVisible(false);
      setCurrentlyLoadingTransfer(null);
      return;
    }
    
    setSelectedTransferForAudit(transferId);
    setCurrentlyLoadingTransfer(transferId);
    setIsAuditVisible(false);
    setAuditLogsMap(prev => ({ ...prev, [transferId]: [] }));
    
    setError(null);

    try {
      setAuditLoadingMap(prev => ({ ...prev, [transferId]: true }));

      const logs = await fetchAuditLogs(transferId);

      if (!isMountedRef.current) return;

      if (logs) {
        setAuditLogsMap(prev => ({ ...prev, [transferId]: logs }));
        setIsAuditVisible(true);

        setTimeout(() => {
          if (auditLogRef.current && isMountedRef.current) {
            auditLogRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
        }, 100);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(`${TRANSFER_HISTORY_CONSTANTS.ERRORS.AUDIT_LOGS_FAILED}: ${err.message}`);
      setSelectedTransferForAudit(null);
      setAuditLogsMap(prev => ({ ...prev, [transferId]: [] }));
    } finally {
      if (isMountedRef.current) {
        setAuditLoadingMap(prev => ({ ...prev, [transferId]: false }));
        setCurrentlyLoadingTransfer(null);
      }
    }
  }, [selectedTransferForAudit, isAuditVisible, currentlyLoadingTransfer]);

  // ============ HELPER FUNCTION TO CLOSE AUDIT TABLE ============
  const closeAuditTable = useCallback(() => {
    if (selectedTransferForAudit && isAuditVisible) {
      setSelectedTransferForAudit(null);
      setIsAuditVisible(false);
      setAuditLogsMap({});
      setCurrentlyLoadingTransfer(null);
    }
  }, [selectedTransferForAudit, isAuditVisible]);

  // ============ WRAPPER FUNCTIONS FOR ACTIONS ============
  const handleReleaseClick = useCallback((transfer) => {
    closeAuditTable();
    setTimeout(() => {
      setReleaseModal({ open: true, transfer, notes: '' });
    }, 0);
  }, [closeAuditTable]);

  const handleCancelClick = useCallback((transfer) => {
    closeAuditTable();
    setTimeout(() => {
      setCancelModal({ open: true, transfer, notes: '', forceRollback: false });
    }, 0);
  }, [closeAuditTable]);

  const handleReceiveClick = useCallback((transfer) => {
    closeAuditTable();
    setTimeout(() => {
      setReceiveModal({ 
        open: true, 
        transfer, 
        notes: '' 
      });
    }, 0);
  }, [closeAuditTable]);

  const handleCancelAcknowledgeClick = useCallback((transfer) => {
    closeAuditTable();
    setTimeout(() => {
      setCancelAcknowledgeModal({ open: true, transfer, notes: '' });
    }, 0);
  }, [closeAuditTable]);

  // 1. RELEASE TRANSFER - SOURCE ACTION
  const handleRelease = async () => {
    const { transfer, notes } = releaseModal;
    if (!transfer) return;

    const loadingKey = `release-${transfer.transfer_id}`;
    setActionLoadingMap(prev => ({ ...prev, [loadingKey]: true }));
    setError(null);

    try {
      const token = getToken();
      if (!token) throw new Error("No token found");

      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, currentVendorId);

      const body = {
        transfer_id: transfer.transfer_id,
        released_by_id: currentVendorId,
        released_by_name: currentBusinessName,
        release_notes: notes || ""
      };

      const { data } = await apiService.post(
        apiEndpoints.releaseStockTransferRequest(),
        body,
        { headers, timeout: INVENTORY_MODULE_CONSTANTS.API_TIMEOUT }
      );

      if (data.status === "success") {
        setSuccess(TRANSFER_HISTORY_CONSTANTS.SUCCESS.RELEASE_SUCCESS);
        setReleaseModal({ open: false, transfer: null, notes: '' });
        fetchTransferHistory();
      }
    } catch (err) {
      INVENTORY_MODULE_CONSTANTS.handleApiError(err, setError, TRANSFER_HISTORY_CONSTANTS.ERRORS.RELEASE_FAILED);
    } finally {
      setActionLoadingMap(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // 2. CANCEL TRANSFER - MASTER ONLY
  const handleCancel = async () => {
    const { transfer, notes, forceRollback } = cancelModal;
    if (!transfer) return;
    if (!notes) {
      setError(TRANSFER_HISTORY_CONSTANTS.ERRORS.NOTES_REQUIRED);
      return;
    }

    const loadingKey = `cancel-${transfer.transfer_id}`;
    setActionLoadingMap(prev => ({ ...prev, [loadingKey]: true }));
    setError(null);

    try {
      const token = getToken();
      if (!token) throw new Error("No token found");

      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, currentVendorId);

      const body = {
        transfer_id: transfer.transfer_id,
        cancelled_by_id: currentVendorId,
        cancelled_by_name: currentBusinessName,
        cancel_notes: notes,
        force_rollback: forceRollback
      };

      const { data } = await apiService.post(
        apiEndpoints.cancelStockTransferRequest(),
        body,
        { headers, timeout: INVENTORY_MODULE_CONSTANTS.API_TIMEOUT }
      );

      if (data.status === "success") {
        setSuccess(TRANSFER_HISTORY_CONSTANTS.SUCCESS.CANCEL_SUCCESS);
        setCancelModal({ open: false, transfer: null, notes: '', forceRollback: false });
        fetchTransferHistory();
      }
    } catch (err) {
      INVENTORY_MODULE_CONSTANTS.handleApiError(err, setError, TRANSFER_HISTORY_CONSTANTS.ERRORS.CANCEL_FAILED);
    } finally {
      setActionLoadingMap(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // 3. RECEIVE TRANSFER - TARGET ACTION (FULL QUANTITY ONLY)
  const handleReceive = async () => {
    const { transfer, notes } = receiveModal;
    if (!transfer) return;

    const loadingKey = `receive-${transfer.transfer_id}`;
    setActionLoadingMap(prev => ({ ...prev, [loadingKey]: true }));
    setError(null);

    try {
      const token = getToken();
      if (!token) throw new Error("No token found");

      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, currentVendorId);

      const body = {
        transfer_id: transfer.transfer_id,
        action: 'accept',
        accepted_quantity: parseInt(transfer.requested_quantity),
        response_notes: notes || "",
        responded_by_id: currentVendorId,
        responded_by_name: currentBusinessName
      };

      const { data } = await apiService.post(
        apiEndpoints.receiveStockTransferRequest(),
        body,
        { headers, timeout: INVENTORY_MODULE_CONSTANTS.API_TIMEOUT }
      );

      if (data.status === "success") {
        setSuccess(TRANSFER_HISTORY_CONSTANTS.SUCCESS.RECEIVE_SUCCESS);
        setReceiveModal({ open: false, transfer: null, notes: '' });
        fetchTransferHistory();
      }
    } catch (err) {
      INVENTORY_MODULE_CONSTANTS.handleApiError(err, setError, TRANSFER_HISTORY_CONSTANTS.ERRORS.RECEIVE_FAILED);
    } finally {
      setActionLoadingMap(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // 4. CANCEL ACKNOWLEDGE - SOURCE ACTION (NOT MASTER)
  const handleCancelAcknowledge = async () => {
    const { transfer, notes } = cancelAcknowledgeModal;
    if (!transfer) return;

    const loadingKey = `cancel-ack-${transfer.transfer_id}`;
    setActionLoadingMap(prev => ({ ...prev, [loadingKey]: true }));
    setError(null);

    try {
      const token = getToken();
      if (!token) throw new Error("No token found");

      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, currentVendorId);

      const body = {
        transfer_id: transfer.transfer_id,
        acknowledged: true,
        acknowledged_by_id: currentVendorId,
        acknowledged_by_name: currentBusinessName,
        acknowledge_notes: notes || "Cancellation acknowledged"
      };

      const { data } = await apiService.post(
        apiEndpoints.cancelStockAcknowledge(),
        body,
        { headers, timeout: INVENTORY_MODULE_CONSTANTS.API_TIMEOUT }
      );

      if (data.status === "success") {
        setSuccess(TRANSFER_HISTORY_CONSTANTS.SUCCESS.CANCEL_ACKNOWLEDGE_SUCCESS);
        setCancelAcknowledgeModal({ open: false, transfer: null, notes: '' });
        fetchTransferHistory();
      }
    } catch (err) {
      INVENTORY_MODULE_CONSTANTS.handleApiError(err, setError, TRANSFER_HISTORY_CONSTANTS.ERRORS.CANCEL_ACKNOWLEDGE_FAILED);
    } finally {
      setActionLoadingMap(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const isSourceBranch = useCallback((transfer) => {
    return transfer.source_vendor_id === currentVendorId;
  }, [currentVendorId]);

  const isTargetBranch = useCallback((transfer) => {
    return transfer.target_vendor_id === currentVendorId;
  }, [currentVendorId]);

  // Check if user is the source branch for cancel acknowledgement
  const isSourceForCancelAck = useCallback((transfer) => {
    // Only source branch can acknowledge cancellation, and NOT master
    return isSourceBranch(transfer);
  }, [isSourceBranch, isMaster]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    INVENTORY_MODULE_CONSTANTS.cancelApiRequest(controllerRef);

    timerRef.current = setTimeout(() => {
      fetchTransferHistory();
    }, INVENTORY_MODULE_CONSTANTS.DEBOUNCE_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchTerm, statusFilter, sortBy, sortOrder, pagination.page, pagination.page_size, selectedBranchId]);

  const fullBranchOptions = useMemo(() => 
    INVENTORY_MODULE_CONSTANTS.getBranchOptionsWithAll(user, childVendors), 
    [childVendors, user]
  );

  const statusOptions = useMemo(() => [
    
    { value: 'pending', label: 'Pending' },
    { value: 'source_released', label: 'Source Released' },
    { value: 'transferred', label: 'Transferred' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'cancelled_rollback', label: 'Cancelled Rollback' },
    { value: 'cancel_requested', label: 'Cancel Requested' },
  ], []);

  const sortByOptions = useMemo(() => [
    { value: 'requested_at', label: 'Requested At' },
    { value: 'responded_at', label: 'Responded At' },
    { value: 'medicine_name', label: 'Medicine Name' },
    { value: 'transfer_id', label: 'Transfer ID' }
  ], []);

  const sortOrderOptions = useMemo(() => [
    { value: 'desc', label: 'Descending' },
    { value: 'asc', label: 'Ascending' }
  ], []);

  const handleFilterChange = useCallback((name, value) => {
    if (name === "search") {
      setSearchTerm(value);
      setPagination(prev => ({ ...prev, page: 1 }));
    } else if (name === "status") {
      setStatusFilter(value);
      setPagination(prev => ({ ...prev, page: 1 }));
    } else if (name === "sort_by") {
      setSortBy(value);
      setPagination(prev => ({ ...prev, page: 1 }));
    } else if (name === "sort_order") {
      setSortOrder(value);
      setPagination(prev => ({ ...prev, page: 1 }));
    } else if (name === "branch_id") {
      const selectedOption = fullBranchOptions.find(opt => opt.value === value);
      if (!selectedOption) return;

      setSelectedValue(value);
      setSelectedBranch(selectedOption.label);
      setPagination(prev => ({ ...prev, page: 1 }));

      if (value === 'current') {
        setSelectedBranchId(currentVendorId);
      } else if (value === 'all') {
        setSelectedBranchId("");
      } else {
        setSelectedBranchId(selectedOption.value);
      }
    }
  }, [fullBranchOptions, currentVendorId]);

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(prev => {
      const newPage = prev.page_size !== pageSize ? 1 : page;
      return { ...prev, page: newPage, page_size: pageSize };
    });
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchTransferHistory();
  };

  const formatAuditDate = (dateString) => {
    if (!dateString) return TRANSFER_HISTORY_CONSTANTS.UI.DASH;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const userTimezone = getUserTimezone();
      
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: userTimezone
      });
    } catch {
      return dateString;
    }
  };

  // Audit Log Columns for HomeTable
  const auditLogColumns = useMemo(() => [
    {
      accessorKey: "action",
      header: () => TRANSFER_HISTORY_CONSTANTS.UI.ACTION,
      cell: ({ row }) => {
        const config = getAuditActionConfig(row.original.action);
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
            {config.icon}
            {row.original.action}
          </span>
        );
      }
    },
    {
      accessorKey: "by_name",
      header: () => TRANSFER_HISTORY_CONSTANTS.UI.PERFORMED_BY,
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.by_name || TRANSFER_HISTORY_CONSTANTS.UI.DASH}</span>
          {row.original.by_id && (
            <div className="text-xs text-gray-500">ID: {row.original.by_id.substring(0, 8)}...</div>
          )}
        </div>
      )
    },
 {
  accessorKey: "at",
  header: () => TRANSFER_HISTORY_CONSTANTS.UI.PERFORMED_AT,
  cell: ({ row }) => (
    <div className="text-sm text-gray-500">
      {INVENTORY_MODULE_CONSTANTS.formatDate(row.original.at, true)}
    </div>
  )
},
    {
      accessorKey: "notes",
      header: () => TRANSFER_HISTORY_CONSTANTS.UI.NOTES_LABEL,
      cell: ({ row }) => (
        <div className="text-sm text-gray-500 max-w-xs">
          <TextHoverTooltip 
            preview={row.original.notes?.length > 30 ? `${row.original.notes.substring(0, 30)}...` : row.original.notes || TRANSFER_HISTORY_CONSTANTS.UI.NO_NOTES}
            full={row.original.notes || TRANSFER_HISTORY_CONSTANTS.UI.NO_NOTES}
            title="Notes"
          />
        </div>
      )
    }
  ], []);

const ActionButtons = ({ transfer }) => {
  const status = transfer.status?.toLowerCase();
  const isSource = isSourceBranch(transfer);
  const isTarget = isTargetBranch(transfer);
  const isSourceForCancel = isSourceForCancelAck(transfer);
  
  const releaseLoading = actionLoadingMap[`release-${transfer.transfer_id}`];
  const cancelLoading = actionLoadingMap[`cancel-${transfer.transfer_id}`];
  const receiveLoading = actionLoadingMap[`receive-${transfer.transfer_id}`];
  const cancelAckLoading = actionLoadingMap[`cancel-ack-${transfer.transfer_id}`];

  // Check if there are any action buttons to show
  const hasActions = 
    (status === TRANSFER_HISTORY_CONSTANTS.UI.PENDING && isSource) || // Release button
    (isMaster && (status === TRANSFER_HISTORY_CONSTANTS.UI.PENDING || status === TRANSFER_HISTORY_CONSTANTS.UI.SOURCE_RELEASED)) || // Cancel button
    (status === TRANSFER_HISTORY_CONSTANTS.UI.SOURCE_RELEASED && isTarget) || // Receive button
    (status === TRANSFER_HISTORY_CONSTANTS.UI.CANCEL_REQUESTED && isSourceForCancel); // Acknowledge button

  // If no actions available, show a status indicator
  if (!hasActions) {
    const statusConfig = getStatusConfig(status);
    return (
      <div className="flex items-center justify-center">
        <Badge variant={statusConfig.color} size="sm" className="opacity-75">
          {statusConfig.label}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* 1. PENDING STATUS - SOURCE can Release */}
      {status === TRANSFER_HISTORY_CONSTANTS.UI.PENDING && isSource && (
        <ButtonTooltip
          tooltipText={TRANSFER_HISTORY_CONSTANTS.UI.TOOLTIP_RELEASE}
          position="top"
        >
          <Button
            variant="primary"
            size="icon"
            onClick={() => handleReleaseClick(transfer)}
            disabled={releaseLoading}
            loading={releaseLoading}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </ButtonTooltip>
      )}

      {/* 2. CANCEL BUTTON - MASTER ONLY - Available in PENDING and SOURCE_RELEASED status */}
      {isMaster && (status === TRANSFER_HISTORY_CONSTANTS.UI.PENDING || status === TRANSFER_HISTORY_CONSTANTS.UI.SOURCE_RELEASED) && (
        <ButtonTooltip
          tooltipText={TRANSFER_HISTORY_CONSTANTS.UI.TOOLTIP_CANCEL}
          position="top"
        >
          <Button
            variant="danger"
            size="icon"
            onClick={() => handleCancelClick(transfer)}
            disabled={cancelLoading}
            loading={cancelLoading}
          >
            <Ban className="w-3.5 h-3.5" />
          </Button>
        </ButtonTooltip>
      )}

      {/* 3. SOURCE RELEASED STATUS - TARGET can Receive (FULL QUANTITY ONLY) */}
      {status === TRANSFER_HISTORY_CONSTANTS.UI.SOURCE_RELEASED && isTarget && (
        <ButtonTooltip
          tooltipText={TRANSFER_HISTORY_CONSTANTS.UI.TOOLTIP_RECEIVE}
          position="top"
        >
          <Button
            variant="success"
            size="icon"
            onClick={() => handleReceiveClick(transfer)}
            disabled={receiveLoading}
            loading={receiveLoading}
          >
            <CheckCircle className="w-3.5 h-3.5" />
          </Button>
        </ButtonTooltip>
      )}

      {/* 4. CANCEL REQUESTED STATUS - SOURCE Acknowledges (NOT MASTER) */}
      {status === TRANSFER_HISTORY_CONSTANTS.UI.CANCEL_REQUESTED && isSourceForCancel && (
        <ButtonTooltip
          tooltipText={TRANSFER_HISTORY_CONSTANTS.UI.TOOLTIP_ACK_CANCEL}
          position="top"
        >
          <Button
            variant="warning"
            size="icon"
            onClick={() => handleCancelAcknowledgeClick(transfer)}
            disabled={cancelAckLoading}
            loading={cancelAckLoading}
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </Button>
        </ButtonTooltip>
      )}
    </div>
  );
};

  // ============ COLUMNS ============
  const columns = useMemo(() => {
    const cols = [];
    
    // Transfer ID with Arrow Icon
    cols.push({
      accessorKey: "transfer_id",
      header: ({ column }) => <HeaderWithSort column={column} title={TRANSFER_HISTORY_CONSTANTS.UI.TRANSFER_ID} />,
      cell: ({ row }) => {
        const transferId = row.original.transfer_id || TRANSFER_HISTORY_CONSTANTS.UI.DASH;
        const preview = transferId.length > 16 ? `${transferId.substring(0, 16)}...` : transferId;
        const isCurrentlyLoading = currentlyLoadingTransfer === transferId;
        const isExpanded = selectedTransferForAudit === transferId && isAuditVisible;
        const isAnyTransferLoading = currentlyLoadingTransfer !== null;
        
        return (
          <button
            onClick={() => handleExpandTransfer(transferId, row.original)}
            className={`flex items-center gap-2 font-medium text-blue-600 hover:text-blue-800 transition-colors hover:underline ${
              isAnyTransferLoading && !isCurrentlyLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={isAnyTransferLoading && !isCurrentlyLoading 
              ? TRANSFER_HISTORY_CONSTANTS.UI.PLEASE_WAIT 
              : isExpanded 
                ? "Click to close audit details" 
                : "Click to view audit details"}
            disabled={isCurrentlyLoading || isAnyTransferLoading}
          >
            {isCurrentlyLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            ) : isExpanded ? (
              <ChevronRight className="w-4 h-4 transform rotate-90 text-blue-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-blue-600" />
            )}
            <span className={`font-mono text-xs ${isExpanded ? 'text-blue-800 font-bold' : 'text-blue-600'} font-medium`}>
              {preview}
            </span>
            {isExpanded && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {TRANSFER_HISTORY_CONSTANTS.UI.VIEWING}
              </span>
            )}
            {isAnyTransferLoading && !isCurrentlyLoading && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {TRANSFER_HISTORY_CONSTANTS.UI.WAIT}
              </span>
            )}
          </button>
        );
      }
    });
    
    cols.push({
      accessorKey: "status",
      header: ({ column }) => <HeaderWithSort column={column} title={TRANSFER_HISTORY_CONSTANTS.UI.STATUS} />,
      cell: ({ row }) => <StatusBadge status={row.original.status} />
    });
    
    // ============ NEW SEPARATE AUDIT TIMELINE COLUMN ============
    cols.push({
      accessorKey: "audit_log",
      header: ({ column }) => <HeaderWithSort column={column} title={TRANSFER_HISTORY_CONSTANTS.UI.AUDIT_TIMELINE} />,
      cell: ({ row }) => {
        const originalTransfer = rawTransfers.find(t => t.transfer_id === row.original.transfer_id);
        return <AuditTimelineCell auditLog={originalTransfer?.audit_log || []} />;
      }
    });
    
    cols.push({
      accessorKey: "source_vendor_name",
      header: ({ column }) => <HeaderWithSort column={column} title={TRANSFER_HISTORY_CONSTANTS.UI.SOURCE_VENDOR} />,
      cell: ({ row }) => {
        const sourceName = row.original.source_vendor_name || TRANSFER_HISTORY_CONSTANTS.UI.DASH;
        const preview = sourceName.length > 20 ? `${sourceName.substring(0, 20)}...` : sourceName;
        return (
          <div className="text-sm font-medium">
            <TextHoverTooltip preview={preview} full={sourceName} title="Source Branch" />
            {isSourceBranch(row.original) && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">You</span>
            )}
          </div>
        );
      }
    });
    
    cols.push({
      accessorKey: "target_vendor_name",
      header: ({ column }) => <HeaderWithSort column={column} title={TRANSFER_HISTORY_CONSTANTS.UI.TARGET_VENDOR} />,
      cell: ({ row }) => {
        const targetName = row.original.target_vendor_name || TRANSFER_HISTORY_CONSTANTS.UI.DASH;
        const preview = targetName.length > 20 ? `${targetName.substring(0, 20)}...` : targetName;
        return (
          <div className="text-sm font-medium">
            <TextHoverTooltip preview={preview} full={targetName} title="Target Branch" />
            {isTargetBranch(row.original) && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">You</span>
            )}
          </div>
        );
      }
    });
    
    cols.push({
      accessorKey: "medicine_name",
      header: ({ column }) => <HeaderWithSort column={column} title={TRANSFER_HISTORY_CONSTANTS.UI.MEDICINE} />,
      cell: ({ row }) => {
        // Find the original transfer with full items
        const originalTransfer = rawTransfers.find(t => t.transfer_id === row.original.transfer_id);
        
        if (originalTransfer && originalTransfer.items && originalTransfer.items.length > 1) {
          // Use MedicineCell for multiple items - NO AUDIT LOGS HERE
          return <MedicineCell transfer={originalTransfer} items={originalTransfer.items} />;
        } else {
          // Single medicine - show normally
          const medicineName = row.original.medicine_name || TRANSFER_HISTORY_CONSTANTS.UI.DASH;
          const preview = medicineName.length > 25 ? `${medicineName.substring(0, 25)}...` : medicineName;
          return (
            <div className="text-sm font-medium text-gray-700">
              {preview}
            </div>
          );
        }
      }
    });
    
    cols.push({
      accessorKey: "batch_code",
      header: ({ column }) => <HeaderWithSort column={column} title={TRANSFER_HISTORY_CONSTANTS.UI.BATCH} />,
      cell: ({ row }) => {
        const originalTransfer = rawTransfers.find(t => t.transfer_id === row.original.transfer_id);
        
        if (originalTransfer && originalTransfer.items && originalTransfer.items.length > 1) {
          return (
            <div className="text-xs text-gray-500 italic">
              Multiple batches
            </div>
          );
        }
        
        const batchCode = row.original.batch_code || TRANSFER_HISTORY_CONSTANTS.UI.DASH;
        return (
          <div className="text-xs font-mono">
            {batchCode !== TRANSFER_HISTORY_CONSTANTS.UI.DASH && batchCode !== 'Multiple' ? (
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{batchCode}</code>
            ) : (
              <span className="text-gray-400">{TRANSFER_HISTORY_CONSTANTS.UI.DASH}</span>
            )}
          </div>
        );
      }
    });
    
    cols.push({
      accessorKey: "requested_quantity",
      header: ({ column }) => <HeaderWithSort column={column} title={TRANSFER_HISTORY_CONSTANTS.UI.QUANTITY} />,
      cell: ({ row }) => {
        const quantity = row.original.requested_quantity;
        const originalTransfer = rawTransfers.find(t => t.transfer_id === row.original.transfer_id);
        
        if (originalTransfer && originalTransfer.items && originalTransfer.items.length > 1) {
          return (
            <div className="text-sm font-semibold text-center text-blue-600">
              {quantity || 0}
            </div>
          );
        }
        
        return (
          <div className="text-sm font-semibold text-center">
            {quantity !== undefined && quantity !== TRANSFER_HISTORY_CONSTANTS.UI.DASH ? quantity : TRANSFER_HISTORY_CONSTANTS.UI.DASH}
          </div>
        );
      }
    });
    
    cols.push({
      accessorKey: "available_at_request",
      header: ({ column }) => <HeaderWithSort column={column} title={TRANSFER_HISTORY_CONSTANTS.UI.AVAILABLE} />,
      cell: ({ row }) => {
        const available = row.original.available_at_request;
        return (
          <div className="text-xs text-gray-600 text-center">
            {available !== undefined && available !== TRANSFER_HISTORY_CONSTANTS.UI.DASH ? available : TRANSFER_HISTORY_CONSTANTS.UI.DASH}
          </div>
        );
      }
    });
    
    cols.push({
  accessorKey: "source_expiry_at_request",
  header: ({ column }) => <HeaderWithSort column={column} title={TRANSFER_HISTORY_CONSTANTS.UI.EXPIRY} />,
  cell: ({ row }) => {
    const expiry = row.original.source_expiry_at_request;
    const originalTransfer = rawTransfers.find(t => t.transfer_id === row.original.transfer_id);
    
    if (originalTransfer && originalTransfer.items && originalTransfer.items.length > 1) {
      return (
        <div className="text-xs text-gray-500 italic">
          Multiple expiry dates
        </div>
      );
    }
    
    return (
      <div className="text-xs text-gray-600">
        {expiry ? INVENTORY_MODULE_CONSTANTS.formatDate(expiry, false) : TRANSFER_HISTORY_CONSTANTS.UI.DASH}
      </div>
    );
  }
});
    
    cols.push({
      accessorKey: "actions",
      header: TRANSFER_HISTORY_CONSTANTS.UI.ACTIONS,
      cell: ({ row }) => <ActionButtons transfer={row.original} />
    });
    
    return cols;
  }, [selectedTransferForAudit, isAuditVisible, auditLoadingMap, actionLoadingMap, currentlyLoadingTransfer, handleExpandTransfer, 
      handleReleaseClick, handleCancelClick, handleReceiveClick, handleCancelAcknowledgeClick, rawTransfers, isSourceBranch, isTargetBranch, isMaster]);

  const filterFields = useMemo(() => [
    {
      type: "text",
      name: "search",
      label: "Search",
      placeholder: TRANSFER_HISTORY_CONSTANTS.UI.SEARCH_PLACEHOLDER,
      value: searchTerm,
      onChange: (e) => handleFilterChange("search", e.target.value),
    },
    {
      type: "select",
      name: "status",
      label: TRANSFER_HISTORY_CONSTANTS.UI.STATUS,
      placeholder: "All Statuses",
      value: statusFilter,
      onChange: (e) => handleFilterChange("status", e.target.value),
      options: statusOptions,
    },
    {
      type: "select",
      name: "sort_by",
      label: "Sort By",
      placeholder: "Select Sort Field",
      value: sortBy,
      onChange: (e) => handleFilterChange("sort_by", e.target.value),
      options: sortByOptions,
    },
    
  ], [searchTerm, statusFilter, sortBy, sortOrder, selectedValue, fullBranchOptions, statusOptions, sortByOptions, sortOrderOptions, isMaster, handleFilterChange]);

  const exportParams = useMemo(() => {
    const params = {
      vendor_id: selectedBranchId || currentVendorId,
      page: 1,
      page_size: 1000,
      sort_by: sortBy,
      sort_order: sortOrder
    };
    
    if (statusFilter) {
      params.status = statusFilter;
    }
    
    return params;
  }, [selectedBranchId, currentVendorId, sortBy, sortOrder, statusFilter]);

  const exportHeaders = useMemo(() => [
    "transfer_id",
    "status",
    "source_vendor_name",
    "target_vendor_name",
    "medicine_name",
    "batch_code",
    "requested_quantity",
    "available_at_request",
    "source_expiry_at_request"
  ], []);

  // Get selected transfer details
  const selectedTransfer = useMemo(() => {
    return transfers.find(t => t.transfer_id === selectedTransferForAudit);
  }, [transfers, selectedTransferForAudit]);

  return (
    <>
      <Alert
        variant="success"
        message={success}
        show={!!success}
        onClose={() => setSuccess(null)}
      />
      <Alert
        variant="error"
        message={error}
        show={!!error}
        onClose={() => setError(null)}
        action={handleRetry}
        actionLabel={TRANSFER_HISTORY_CONSTANTS.UI.RETRY}
      />

      <div className="relative">
     <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20 flex flex-col sm:flex-row gap-2">
  {/* Refresh Button - Made responsive */}
  <Button
    variant="primary"
    onClick={handlePageRefresh}
    loading={loading}
    loadingText={TRANSFER_HISTORY_CONSTANTS.UI.REFRESHING}
    className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
    title="Refresh transfer history"
  >
    <RefreshCw className="w-3 h-3 sm:w-5 sm:h-5" />
    <span className="sm:hidden">↻</span>
    <span className="hidden sm:inline">{TRANSFER_HISTORY_CONSTANTS.UI.REFRESH}</span>
  </Button>
  
  {/* <ExportReports ... /> */}
</div>

        {/* Main Table */}
        <HomeTable
          title={dynamicTitle}
          data={transfers}
          columns={columns}
          filterFields={filterFields}
          onFilterChange={handleFilterChange}
          loading={loading}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          serverSideFiltering={true}
          error={error}
          onRetry={handleRetry}
          noDataMessage={transfers.length === 0 && !loading && !error ? NO_RECORD_FOUND : error}
          hideDefaultActions={true}
          showColumnVisibility={true}
        />

             {/* Audit Log Details Table - FIXED: Responsive alignment */}
        {selectedTransferForAudit && isAuditVisible && (
          <div ref={auditLogRef} className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
            <Card className="mb-6" bodyClassName="p-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                  <History className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                      {TRANSFER_HISTORY_CONSTANTS.UI.AUDIT_LOG_TITLE}
                    </h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">ID:</span>
                        <span className="font-semibold text-purple-700 truncate max-w-[150px] sm:max-w-full">{selectedTransferForAudit}</span>
                      </div>
                      {selectedTransfer && selectedTransfer.medicine_name !== TRANSFER_HISTORY_CONSTANTS.UI.DASH && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Medicine:</span>
                          <span className="font-semibold text-green-700 truncate max-w-[150px] sm:max-w-full">{selectedTransfer.medicine_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Audit Entries Badge - Aligned right */}
                <div className="flex justify-end sm:justify-start">
                  <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 rounded-lg">
                    <span className="text-xs sm:text-sm text-blue-700 whitespace-nowrap">{TRANSFER_HISTORY_CONSTANTS.UI.AUDIT_ENTRIES}</span>
                    <span className="text-base sm:text-xl font-bold text-blue-800">
                      {auditLogsMap[selectedTransferForAudit]?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Audit Log Table */}
            <HomeTable
              title={`${TRANSFER_HISTORY_CONSTANTS.UI.AUDIT_LOG} Details`}
              data={auditLogsMap[selectedTransferForAudit] || []}
              columns={auditLogColumns}
              loading={auditLoadingMap[selectedTransferForAudit]}
              pagination={{ page: 1, page_size: 10, total: auditLogsMap[selectedTransferForAudit]?.length || 0 }}
              serverSideFiltering={false}
              error={error}
              onRetry={() => handleExpandTransfer(selectedTransferForAudit, selectedTransfer)}
              hideDefaultActions
              showColumnVisibility={false}
              noDataMessage={TRANSFER_HISTORY_CONSTANTS.UI.NO_AUDIT_LOGS}
            />
          </div>
        )}
      </div>

      {/* ============ MODALS ============ */}
      <Modal
        isOpen={releaseModal.open}
        onClose={() => setReleaseModal({ open: false, transfer: null, notes: '' })}
        size="md"
        title={`${TRANSFER_HISTORY_CONSTANTS.UI.RELEASE_TRANSFER} - ${releaseModal.transfer?.transfer_id}`}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-bold">Source Action:</span> You are about to release this transfer to the target branch. 
              The target branch will then be able to receive the stock.
            </p>
          </div>
          <InputTextarea
            label="Release Notes (optional)"
            placeholder={TRANSFER_HISTORY_CONSTANTS.UI.NOTES_PLACEHOLDER}
            value={releaseModal.notes}
            onChange={(e) => setReleaseModal(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full"
          />
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setReleaseModal({ open: false, transfer: null, notes: '' })}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRelease}
              disabled={actionLoadingMap[`release-${releaseModal.transfer?.transfer_id}`]}
              loading={actionLoadingMap[`release-${releaseModal.transfer?.transfer_id}`]}
              loadingText={TRANSFER_HISTORY_CONSTANTS.UI.RELEASING}
            >
              {TRANSFER_HISTORY_CONSTANTS.UI.RELEASE}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, transfer: null, notes: '', forceRollback: false })}
        size="md"
        title={`${TRANSFER_HISTORY_CONSTANTS.UI.CANCEL_TRANSFER} - ${cancelModal.transfer?.transfer_id}`}
      >
        <div className="space-y-4">
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <span className="font-bold flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Master Action Only:
              </span>
              You are about to cancel this transfer. This action can only be performed by Master.
            </p>
          </div>
          <InputTextarea
            label="Cancellation Reason *"
            placeholder={TRANSFER_HISTORY_CONSTANTS.UI.CANCEL_REASON_PLACEHOLDER}
            value={cancelModal.notes}
            onChange={(e) => setCancelModal(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full"
            required
          />
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setCancelModal({ open: false, transfer: null, notes: '', forceRollback: false })}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={actionLoadingMap[`cancel-${cancelModal.transfer?.transfer_id}`] || !cancelModal.notes}
              loading={actionLoadingMap[`cancel-${cancelModal.transfer?.transfer_id}`]}
              loadingText={TRANSFER_HISTORY_CONSTANTS.UI.CANCELLING}
            >
              {TRANSFER_HISTORY_CONSTANTS.UI.CANCEL}
            </Button>
          </div>
        </div>
      </Modal>

      {/* UPDATED Receive Modal - Full Quantity Only */}
      <Modal
        isOpen={receiveModal.open}
        onClose={() => setReceiveModal({ open: false, transfer: null, notes: '' })}
        size="md"
        title={`${TRANSFER_HISTORY_CONSTANTS.UI.RECEIVE_TRANSFER} - ${receiveModal.transfer?.transfer_id}`}
      >
        <div className="space-y-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-800">
              <span className="font-bold">Target Action:</span> You are about to receive the full quantity of{' '}
              <span className="font-bold">{receiveModal.transfer?.requested_quantity || 0}</span> units.
            </p>
          </div>
          <InputTextarea
            label="Response Notes (optional)"
            placeholder={TRANSFER_HISTORY_CONSTANTS.UI.NOTES_PLACEHOLDER}
            value={receiveModal.notes}
            onChange={(e) => setReceiveModal(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full"
          />
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setReceiveModal({ open: false, transfer: null, notes: '' })}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleReceive}
              disabled={actionLoadingMap[`receive-${receiveModal.transfer?.transfer_id}`]}
              loading={actionLoadingMap[`receive-${receiveModal.transfer?.transfer_id}`]}
              loadingText={TRANSFER_HISTORY_CONSTANTS.UI.RECEIVING}
            >
              {TRANSFER_HISTORY_CONSTANTS.UI.RECEIVE}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={cancelAcknowledgeModal.open}
        onClose={() => setCancelAcknowledgeModal({ open: false, transfer: null, notes: '' })}
        size="md"
        title={`${TRANSFER_HISTORY_CONSTANTS.UI.CANCEL_ACKNOWLEDGE} - ${cancelAcknowledgeModal.transfer?.transfer_id}`}
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-bold">Source Action:</span> Master has cancelled this transfer. 
              Please acknowledge to complete the cancellation.
            </p>
          </div>
          <InputTextarea
            label="Acknowledge Notes (optional)"
            placeholder={TRANSFER_HISTORY_CONSTANTS.UI.ACKNOWLEDGE_NOTES_PLACEHOLDER}
            value={cancelAcknowledgeModal.notes}
            onChange={(e) => setCancelAcknowledgeModal(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full"
          />
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setCancelAcknowledgeModal({ open: false, transfer: null, notes: '' })}>
              Cancel
            </Button>
            <Button
              variant="warning"
              onClick={handleCancelAcknowledge}
              disabled={actionLoadingMap[`cancel-ack-${cancelAcknowledgeModal.transfer?.transfer_id}`]}
              loading={actionLoadingMap[`cancel-ack-${cancelAcknowledgeModal.transfer?.transfer_id}`]}
              loadingText={TRANSFER_HISTORY_CONSTANTS.UI.ACKNOWLEDGING}
            >
              {TRANSFER_HISTORY_CONSTANTS.UI.ACK_CANCEL}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}