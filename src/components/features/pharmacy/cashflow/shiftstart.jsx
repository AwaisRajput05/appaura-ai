// shiftstart.jsx – Cash Book Day & Shift Management
// FIXED: Staff name numeric validation, shift close auto-fill, currency symbol, 2nd shift opening balances
// ADDED: Resume Day flow when day is closed
// ADDED: Resume Logs table showing who resumed, why, and when
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { cashBookEndpoints } from '../../../../services/endpoint/cashflow/cashEnd';
import { useAuth } from "../../../auth/hooks/useAuth";
import { Play, Square, RefreshCw, UserPlus, Eye, RotateCcw } from 'lucide-react';

import Button from "../../../../components/ui/forms/Button";
import InputText from "../../../../components/ui/forms/InputText";
import InputTextarea from "../../../../components/ui/forms/InputTextarea";
import Card from "../../../../components/ui/Card";
import Modal from '../../../../components/ui/Modal';
import Alert from "../../../../components/ui/feedback/Alert";
import HomeTable from "../../../common/table/Table";
import { CASHFLOW_MODULE_CONSTANTS } from "./cashflowconstant/cashflowconstant";

// Destructure constants for cleaner usage
const { SHIFT_CONSTANTS } = CASHFLOW_MODULE_CONSTANTS;

export default function ShiftStart() {
  const { user } = useAuth();

  const fetchTimeoutRef = useRef(null);
  const successTimeoutRef = useRef(null);

  const [dayData, setDayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [startDayError, setStartDayError] = useState(null);
  const [closeDayError, setCloseDayError] = useState(null);
  const [startShiftError, setStartShiftError] = useState(null);
  const [closeShiftError, setCloseShiftError] = useState(null);
  const [viewShiftError, setViewShiftError] = useState(null);

  const [showStartDayModal, setShowStartDayModal] = useState(false);
  const [showCloseDayModal, setShowCloseDayModal] = useState(false);
  const [dayOpeningBalances, setDayOpeningBalances] = useState(CASHFLOW_MODULE_CONSTANTS.DEFAULT_BALANCES);
  const [dayNotes, setDayNotes] = useState('');

  // ── Resume Day state ──────────────────────────────────────────────────────
  const [showResumeDayModal, setShowResumeDayModal] = useState(false);
  const [resumedBy, setResumedBy] = useState('');
  const [resumeReason, setResumeReason] = useState('');
  const [resumeDayError, setResumeDayError] = useState(null);
  // ─────────────────────────────────────────────────────────────────────────

  const [selectedShift, setSelectedShift] = useState(null);
  const [showShiftDetail, setShowShiftDetail] = useState(false);
  
  const [startedShifts, setStartedShifts] = useState([]);
  const [currentBalances, setCurrentBalances] = useState(CASHFLOW_MODULE_CONSTANTS.DEFAULT_BALANCES);
  
  const [showStartShiftModal, setShowStartShiftModal] = useState(false);
  const [shiftOpeningBalances, setShiftOpeningBalances] = useState(CASHFLOW_MODULE_CONSTANTS.DEFAULT_BALANCES);
  const [shiftNotes, setShiftNotes] = useState('');
  const [staffId, setStaffId] = useState('');
  const [staffName, setStaffName] = useState('');

  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [shiftCloseCounts, setShiftCloseCounts] = useState(CASHFLOW_MODULE_CONSTANTS.DEFAULT_BALANCES);
  const [closeNotes, setCloseNotes] = useState('');

  const [showViewShiftModal, setShowViewShiftModal] = useState(false);
  const [viewShiftData, setViewShiftData] = useState(null);
  const [viewShiftLoading, setViewShiftLoading] = useState(false);

  const vendorId = user?.currentBranch?.vendorId || user?.vendorId || localStorage.getItem('vendorId');
  const branchId = user?.currentBranch?.id || user?.branchId || localStorage.getItem('branchId') || "main";

  useEffect(() => {
    if (successMessage) {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage(null);
      }, CASHFLOW_MODULE_CONSTANTS.SUCCESS_TIMEOUT);
    }
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, [successMessage]);

  const fetchDayStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = CASHFLOW_MODULE_CONSTANTS.getAuthHeaders(token, branchId);
      const businessDate = CASHFLOW_MODULE_CONSTANTS.getCurrentBusinessDate();
      const url = cashBookEndpoints.dayStatus(businessDate);
      const response = await apiService.get(url, { 
        headers, 
        timeout: CASHFLOW_MODULE_CONSTANTS.API_TIMEOUT 
      });

      if (response.data?.status === "success") {
        setDayData(response.data.data);
        
        // FIX #4: Use closing_balances if available (cumulative after shifts), otherwise opening_balances
        const balances = response.data.data.closing_balances || response.data.data.opening_balances;
        if (balances) {
          setCurrentBalances({
            cash: balances.cash?.toString() || '0',
            bank: balances.bank?.toString() || '0',
            mobile: balances.mobile?.toString() || '0',
            other: balances.other?.toString() || '0',
          });
        }
      } else {
        setDayData(null);
      }
    } catch (err) {
      if (err.response?.status === 400) {
        setDayData(null);
        setError(null);
      } else {
        setError(err.message || SHIFT_CONSTANTS.ERRORS.FETCH_DAY_STATUS_FAILED);
        setDayData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchDayStatus();
  }, [fetchDayStatus]);

  const fetchShiftDetails = async (shiftId) => {
    setViewShiftLoading(true);
    setViewShiftError(null);
    
    try {
      const token = getToken();
      if (!token) throw new Error(SHIFT_CONSTANTS.ERRORS.AUTH_REQUIRED);

      const headers = CASHFLOW_MODULE_CONSTANTS.getAuthHeaders(token, branchId);
      const businessDate = CASHFLOW_MODULE_CONSTANTS.getCurrentBusinessDate();
      const url = cashBookEndpoints.dayStatus(businessDate, shiftId);
      const response = await apiService.get(url, { 
        headers, 
        timeout: CASHFLOW_MODULE_CONSTANTS.API_TIMEOUT 
      });

      if (response.data?.status === "success" && response.data?.data?.selected_shift) {
        setViewShiftData(response.data.data.selected_shift);
        setShowViewShiftModal(true);
      } else {
        throw new Error(SHIFT_CONSTANTS.ERRORS.SHIFT_DETAILS_NOT_FOUND);
      }
    } catch (err) {
      setViewShiftError(err.response?.data?.detail || err.message || SHIFT_CONSTANTS.ERRORS.FETCH_SHIFT_DETAILS_FAILED);
    } finally {
      setViewShiftLoading(false);
    }
  };

  const handleStartDay = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setStartDayError(null);

    try {
      const token = getToken();
      if (!token) throw new Error(SHIFT_CONSTANTS.ERRORS.AUTH_REQUIRED);

      const headers = CASHFLOW_MODULE_CONSTANTS.getAuthHeaders(token, branchId);
      const url = cashBookEndpoints.dayAction('start');

      const payload = {
        vendorId,
        branchId,
        businessDate: CASHFLOW_MODULE_CONSTANTS.getCurrentBusinessDate(),
        openingBalances: {
          cash: Number(dayOpeningBalances.cash) || 0,
          bank: Number(dayOpeningBalances.bank) || 0,
          mobile: Number(dayOpeningBalances.mobile) || 0,
          other: Number(dayOpeningBalances.other) || 0,
        },
        notes: dayNotes || "",
      };

      const { data } = await apiService.post(url, payload, { headers });

      setSuccessMessage(data?.message || SHIFT_CONSTANTS.SUCCESS.DAY_STARTED);
      setShowStartDayModal(false);
      setDayOpeningBalances(CASHFLOW_MODULE_CONSTANTS.DEFAULT_BALANCES);
      setDayNotes('');
      fetchDayStatus();
    } catch (err) {
      const errorDetail = err.response?.data?.detail || 
                         err.response?.data?.message || 
                         err.message || 
                         SHIFT_CONSTANTS.ERRORS.START_DAY_FAILED;
      setStartDayError(errorDetail);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseDay = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setCloseDayError(null);

    try {
      const token = getToken();
      if (!token) throw new Error(SHIFT_CONSTANTS.ERRORS.AUTH_REQUIRED);

      const headers = CASHFLOW_MODULE_CONSTANTS.getAuthHeaders(token, branchId);
      const url = cashBookEndpoints.dayAction('close');

      const payload = {
        vendorId,
        branchId,
        businessDate: dayData?.date || CASHFLOW_MODULE_CONSTANTS.getCurrentBusinessDate(),
        notes: dayNotes || "",
      };

      const { data } = await apiService.post(url, payload, { headers });

      setSuccessMessage(data?.message || SHIFT_CONSTANTS.SUCCESS.DAY_CLOSED);
      setShowCloseDayModal(false);
      setDayNotes('');
      fetchDayStatus();
    } catch (err) {
      const errorDetail = err.response?.data?.detail || 
                         err.response?.data?.message || 
                         err.message || 
                         SHIFT_CONSTANTS.ERRORS.CLOSE_DAY_FAILED;
      setCloseDayError(errorDetail);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Resume Day handler ────────────────────────────────────────────────────
  const handleResumeDay = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setResumeDayError(null);

    try {
      const token = getToken();
      if (!token) throw new Error(SHIFT_CONSTANTS.ERRORS.AUTH_REQUIRED);

      const headers = CASHFLOW_MODULE_CONSTANTS.getAuthHeaders(token, branchId);
      const url = cashBookEndpoints.dayresume();

      const payload = {
        businessDate: CASHFLOW_MODULE_CONSTANTS.getCurrentBusinessDate(),
        resumedBy: resumedBy.trim(),
        reason: resumeReason.trim(),
      };

      const { data } = await apiService.patch(url, payload, { headers });

      setSuccessMessage(data?.message || "Day resumed successfully.");
      setShowResumeDayModal(false);
      setResumedBy('');
      setResumeReason('');
      fetchDayStatus();
    } catch (err) {
      const errorDetail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to resume day. Please try again.";
      setResumeDayError(errorDetail);
    } finally {
      setActionLoading(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  // FIX #1: Staff name numeric validation – reject any digit
  const handleStaffNameChange = (e) => {
    const value = e.target.value;
    const filtered = value.replace(/[0-9]/g, '');
    setStaffName(filtered);
  };

  // Resume "Resumed By" name validation – same rule, no digits
  const handleResumedByChange = (e) => {
    const filtered = e.target.value.replace(/[0-9]/g, '');
    setResumedBy(filtered);
  };

  const handleStartShift = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setStartShiftError(null);

    try {
      const token = getToken();
      if (!token) throw new Error(SHIFT_CONSTANTS.ERRORS.AUTH_REQUIRED);

      const headers = CASHFLOW_MODULE_CONSTANTS.getAuthHeaders(token, branchId);
      const url = cashBookEndpoints.shiftAction('start');

      const payload = {
        vendorId,
        branchId,
        staffId: staffId,
        businessDate: dayData?.date || CASHFLOW_MODULE_CONSTANTS.getCurrentBusinessDate(),
        staffName: staffName || user?.name || SHIFT_CONSTANTS.DEFAULTS.DEFAULT_STAFF_NAME,
        openingBalances: {
          cash: Number(shiftOpeningBalances.cash) || 0,
          bank: Number(shiftOpeningBalances.bank) || 0,
          mobile: Number(shiftOpeningBalances.mobile) || 0,
          other: Number(shiftOpeningBalances.other) || 0,
        },
        startedAt: CASHFLOW_MODULE_CONSTANTS.getCurrentLocalDateTime(),
        notes: shiftNotes || "",
      };

      const { data } = await apiService.post(url, payload, { headers });

      if (data?.data) {
        setStartedShifts(prev => [...prev, {
          shift_id: data.data.shift_id,
          staff_id: staffId,
          staff_name: staffName,
          status: 'open',
          opening_balances: { ...payload.openingBalances }
        }]);
      }

      setSuccessMessage(data?.message || SHIFT_CONSTANTS.SUCCESS.SHIFT_STARTED);
      setShowStartShiftModal(false);
      setShiftOpeningBalances(CASHFLOW_MODULE_CONSTANTS.DEFAULT_BALANCES);
      setShiftNotes('');
      setStaffId('');
      setStaffName('');
      fetchDayStatus();
    } catch (err) {
      const errorDetail = err.response?.data?.detail || 
                         err.response?.data?.message || 
                         err.message || 
                         SHIFT_CONSTANTS.ERRORS.START_SHIFT_FAILED;
      setStartShiftError(errorDetail);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (!selectedShift) return;
    
    setActionLoading(true);
    setCloseShiftError(null);

    try {
      const token = getToken();
      if (!token) throw new Error(SHIFT_CONSTANTS.ERRORS.AUTH_REQUIRED);

      const headers = CASHFLOW_MODULE_CONSTANTS.getAuthHeaders(token, branchId);
      const url = cashBookEndpoints.shiftAction('close');

      const payload = {
        vendorId,
        branchId,
        businessDate: dayData?.date || CASHFLOW_MODULE_CONSTANTS.getCurrentBusinessDate(),
        staffId: selectedShift.staff_id,
        physicalCounts: {
          cash: Number(shiftCloseCounts.cash) || 0,
          bank: Number(shiftCloseCounts.bank) || 0,
          mobile: Number(shiftCloseCounts.mobile) || 0,
          other: Number(shiftCloseCounts.other) || 0,
        },
        endedAt: CASHFLOW_MODULE_CONSTANTS.getCurrentLocalDateTime(),
        closeNotes: closeNotes || "",
      };

      const { data } = await apiService.post(url, payload, { headers });

      setSuccessMessage(data?.message || SHIFT_CONSTANTS.SUCCESS.SHIFT_CLOSED);
      setShowCloseShiftModal(false);
      setShiftCloseCounts(CASHFLOW_MODULE_CONSTANTS.DEFAULT_BALANCES);
      setCloseNotes('');
      setShowShiftDetail(false);
      setSelectedShift(null);
      
      setStartedShifts(prev => prev.filter(s => s.shift_id !== selectedShift.shift_id));
      
      fetchDayStatus();
    } catch (err) {
      const errorDetail = err.response?.data?.detail || 
                         err.response?.data?.message || 
                         err.message || 
                         SHIFT_CONSTANTS.ERRORS.CLOSE_SHIFT_FAILED;
      setCloseShiftError(errorDetail);
    } finally {
      setActionLoading(false);
    }
  };

  // FIX #2: Pre-fill physical counts with current system balances
  const handleCloseShiftClick = (shift) => {
    const shiftRecord = startedShifts.find(s => s.shift_id === shift.shift_id);
    
    setSelectedShift({
      ...shift,
      staff_id: shift.staff_id || shiftRecord?.staff_id || ''
    });
    
    setShiftCloseCounts({
      cash: currentBalances.cash,
      bank: currentBalances.bank,
      mobile: currentBalances.mobile,
      other: currentBalances.other,
    });
    
    setCloseNotes('');
    setCloseShiftError(null);
    setShowCloseShiftModal(true);
  };

  const handleViewShiftClick = (shift) => {
    fetchShiftDetails(shift.shift_id);
  };

  const getShiftWithBalances = (shift) => {
    const startedShift = startedShifts.find(s => s.shift_id === shift.shift_id);
    
    if (startedShift?.opening_balances) {
      return {
        ...shift,
        opening_balances: startedShift.opening_balances
      };
    }
    
    return {
      ...shift,
      opening_balances: shift.opening_balances || {
        cash: 0,
        bank: 0,
        mobile: 0,
        other: 0
      }
    };
  };

  const isDayClosed = dayData?.day_status === "closed";
  const isDayOpen = dayData?.day_status === "open";
  const noDayExists = !dayData;
  const hasOpenShifts = dayData?.shifts?.open > 0;

  const handleDayOpeningChange = CASHFLOW_MODULE_CONSTANTS.createIntegerInputHandler(setDayOpeningBalances);
  const handleShiftOpeningChange = CASHFLOW_MODULE_CONSTANTS.createIntegerInputHandler(setShiftOpeningBalances);

  const shiftColumns = useMemo(() => [
    {
      accessorKey: "shift_id",
      header: SHIFT_CONSTANTS.UI.SHIFT_ID,
      cell: ({ row }) => <div className="font-medium text-gray-900 text-xs sm:text-sm">{row.original.shift_id}</div>,
    },
    {
      accessorKey: "staff_id",
      header: SHIFT_CONSTANTS.UI.STAFF_ID,
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.staff_id || SHIFT_CONSTANTS.DEFAULTS.DASH}</div>,
    },
    {
      accessorKey: "staff_name",
      header: SHIFT_CONSTANTS.UI.STAFF_NAME,
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.staff_name}</div>,
    },
    {
      accessorKey: "status",
      header: SHIFT_CONSTANTS.UI.STATUS,
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
          row.original.status === 'open' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.original.status === 'open' ? SHIFT_CONSTANTS.UI.OPEN : SHIFT_CONSTANTS.UI.CLOSED}
        </span>
      ),
    },
    {
      accessorKey: "started_at",
      header: SHIFT_CONSTANTS.UI.STARTED_AT,
      cell: ({ row }) => <div className="text-xs sm:text-sm">{CASHFLOW_MODULE_CONSTANTS.formatDateTime(row.original.started_at)}</div>,
    },
    {
      accessorKey: "ended_at",
      header: SHIFT_CONSTANTS.UI.ENDED_AT,
      cell: ({ row }) => <div className="text-xs sm:text-sm">{CASHFLOW_MODULE_CONSTANTS.formatDateTime(row.original.ended_at)}</div>,
    },
    {
      accessorKey: "Actions",
      header: () => <div className="text-center">{SHIFT_CONSTANTS.UI.ACTIONS}</div>,
      cell: ({ row }) => (
        <div className="flex justify-center gap-2">
          <Button
            variant="info"
            size="sm"
            onClick={() => handleViewShiftClick(row.original)}
            className="px-2 sm:px-3 py-1 inline-flex items-center gap-1 text-xs sm:text-sm"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            {SHIFT_CONSTANTS.UI.VIEW_BALANCE}
          </Button>
          
          {row.original.status === 'open' && (
            <Button
              variant="warning"
              size="sm"
              onClick={() => handleCloseShiftClick(row.original)}
              className="px-2 sm:px-3 py-1 inline-flex items-center gap-1 text-xs sm:text-sm"
            >
              <Square className="w-3 h-3 sm:w-4 sm:h-4" />
              {SHIFT_CONSTANTS.UI.CLOSE}
            </Button>
          )}
        </div>
      ),
      enableSorting: false,
    }
  ], [startedShifts, currentBalances, dayData]);

  // ── Resume datetime formatter – handles +00:00 offset → local display ────
 const formatResumeDateTime = (isoString) => {
  return CASHFLOW_MODULE_CONSTANTS.formatDateTime(isoString, true);
};
  // ─────────────────────────────────────────────────────────────────────────

  // ── Resume Log columns ────────────────────────────────────────────────────
  const resumeLogColumns = useMemo(() => [
    {
      accessorKey: "resumed_by",
      header: "Resumed By",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-purple-700">
              {row.original.resumed_by?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-900">
            {row.original.resumed_by}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "resumed_at",
      header: "Resumed At",
      cell: ({ row }) => (
        <div className="text-xs sm:text-sm text-gray-700">
          {formatResumeDateTime(row.original.resumed_at)}
        </div>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <div className="text-xs sm:text-sm text-gray-600 italic max-w-xs truncate" title={row.original.reason}>
          {row.original.reason || <span className="text-gray-400 not-italic">—</span>}
        </div>
      ),
    },
  ], []);
  // ─────────────────────────────────────────────────────────────────────────

  const dynamicTitle = useMemo(() => {
    let statusText = SHIFT_CONSTANTS.UI.NOT_STARTED;
    let statusColor = SHIFT_CONSTANTS.STATUS_COLORS.NOT_STARTED;
    
    if (isDayClosed) {
      statusText = SHIFT_CONSTANTS.UI.CLOSED;
      statusColor = SHIFT_CONSTANTS.STATUS_COLORS.CLOSED;
    } else if (isDayOpen) {
      statusText = SHIFT_CONSTANTS.UI.OPEN;
      statusColor = SHIFT_CONSTANTS.STATUS_COLORS.OPEN;
    }

    return (
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-xl sm:text-2xl font-bold text-gray-800">{SHIFT_CONSTANTS.UI.DAILY_LEDGER}</span>
        </div>
        <span className="hidden sm:inline text-gray-500">—</span>
        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm w-fit ${statusColor}`}>
          {statusText}
        </span>
      </div>
    );
  }, [isDayClosed, isDayOpen, noDayExists]);

  const formatCurrency = (value) => {
    return `Rs. ${CASHFLOW_MODULE_CONSTANTS.formatNumber(value)}`;
  };

  // ── Resume log data derived from dayData ──────────────────────────────────
  const resumeLogData = useMemo(() => {
    if (!dayData?.resume_log?.length) return [];
    // Show most recent first
    return [...dayData.resume_log].reverse();
  }, [dayData]);
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          className="mb-3 mx-2 sm:mx-4"
        />
      )}
      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          className="mb-3 mx-2 sm:mx-4"
        />
      )}

      <Card className="mb-4 mx-2 sm:mx-4" bodyClassName="p-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 border-b gap-3">
          {dynamicTitle}
          <div className="flex flex-row flex-wrap gap-2 sm:gap-3 justify-end w-full sm:w-auto">

            {/* ── No day yet → Start Day ─────────────────────────────────── */}
            {noDayExists && (
              <Button
                variant="primary"
                onClick={() => {
                  setDayOpeningBalances(CASHFLOW_MODULE_CONSTANTS.DEFAULT_BALANCES);
                  setDayNotes('');
                  setStartDayError(null);
                  setShowStartDayModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base px-3 py-1.5"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{SHIFT_CONSTANTS.UI.START_DAY}</span>
              </Button>
            )}

            {/* ── Day closed → Resume Day ────────────────────────────────── */}
            {isDayClosed && (
              <Button
                variant="primary"
                onClick={() => {
                  setResumedBy('');
                  setResumeReason('');
                  setResumeDayError(null);
                  setShowResumeDayModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base px-3 py-1.5"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Resume Day</span>
              </Button>
            )}

            {/* ── Day open → Start Shift + Close Day ────────────────────── */}
            {isDayOpen && (
              <>
                <Button
                  variant="success"
                  onClick={() => {
                    setShiftOpeningBalances({
                      cash: currentBalances.cash?.toString() || '0',
                      bank: currentBalances.bank?.toString() || '0',
                      mobile: currentBalances.mobile?.toString() || '0',
                      other: currentBalances.other?.toString() || '0',
                    });
                    setShiftNotes('');
                    setStaffId('');
                    setStaffName('');
                    setStartShiftError(null);
                    setShowStartShiftModal(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base px-3 py-1.5"
                  disabled={!isDayOpen || hasOpenShifts}
                >
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{SHIFT_CONSTANTS.UI.START_SHIFT}</span>
                </Button>
                
                <Button
                  variant="warning"
                  onClick={() => {
                    setDayNotes('');
                    setCloseDayError(null);
                    setShowCloseDayModal(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base px-3 py-1.5"
                  disabled={hasOpenShifts}
                >
                  <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{SHIFT_CONSTANTS.UI.CLOSE_DAY}</span>
                </Button>
              </>
            )}
            
            <Button
              variant="secondary"
              onClick={fetchDayStatus}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base px-3 py-1.5"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{SHIFT_CONSTANTS.UI.REFRESH}</span>
            </Button>
          </div>
        </div>

        {dayData && (
          <div className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">{SHIFT_CONSTANTS.UI.DAY_OVERVIEW}</h2>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {SHIFT_CONSTANTS.UI.DATE}: <span className="font-semibold text-green-700">
                    {CASHFLOW_MODULE_CONSTANTS.formatDateTime(dayData.date, false)}
                  </span>
                  {dayData.shifts?.total > 0 && (
                    <span className="ml-2 sm:ml-4">
                      {SHIFT_CONSTANTS.UI.TOTAL_SHIFTS}: <span className="font-semibold text-blue-700">{dayData.shifts.total}</span>
                    </span>
                  )}
                </p>
                {dayData.notes && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {SHIFT_CONSTANTS.UI.NOTES}: <span className="italic">{dayData.notes}</span>
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                <div className="text-center px-3 sm:px-3 py-1 sm:py-1.5 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 whitespace-nowrap">{SHIFT_CONSTANTS.UI.OPEN_SHIFTS}</p>
                  <p className="text-base sm:text-lg font-bold text-blue-800">
                    {dayData.shifts?.open > 0 ? dayData.shifts.open : '0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-lg transition-all duration-200 hover:border-green-200 group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{SHIFT_CONSTANTS.UI.OPENING_CASH}</span>
                  <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <span className="text-green-600 font-bold text-sm">Rs. </span>
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(dayData.opening_balances?.cash)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  {SHIFT_CONSTANTS.DEFAULTS.CASH_IN_HAND}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-lg transition-all duration-200 hover:border-blue-200 group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{SHIFT_CONSTANTS.UI.OPENING_BANK}</span>
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(dayData.opening_balances?.bank)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  {SHIFT_CONSTANTS.DEFAULTS.BANK_BALANCE}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-lg transition-all duration-200 hover:border-purple-200 group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{SHIFT_CONSTANTS.UI.OPENING_MOBILE}</span>
                  <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(dayData.opening_balances?.mobile)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  {SHIFT_CONSTANTS.DEFAULTS.MOBILE_WALLET}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-lg transition-all duration-200 hover:border-orange-200 group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{SHIFT_CONSTANTS.UI.OPENING_OTHER}</span>
                  <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(dayData.opening_balances?.other)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                  {SHIFT_CONSTANTS.DEFAULTS.OTHER_ASSETS}
                </p>
              </div>
            </div>
          </div>
        )}

        {noDayExists && !loading && (
          <div className="p-6 text-center">
            <p className="text-gray-500">{SHIFT_CONSTANTS.UI.NO_ACTIVE_DAY}</p>
          </div>
        )}
      </Card>

      {!showShiftDetail && (
        <div className="mx-2 sm:mx-4">
          <HomeTable
            title={SHIFT_CONSTANTS.UI.TODAYS_SHIFTS}
            data={(dayData?.shifts?.list || []).map(shift => getShiftWithBalances(shift))}
            columns={shiftColumns}
            loading={loading}
            serverSideFiltering={true}
            error={error}
            onRetry={fetchDayStatus}
            hideDefaultActions
            noDataMessage={SHIFT_CONSTANTS.UI.NO_SHIFTS_FOUND}
          />
        </div>
      )}

      {/* ── Resume Log Table ────────────────────────────────────────────────── */}
      {resumeLogData.length > 0 && (
        <div className="mx-2 sm:mx-4 mt-4">
          <HomeTable
            title={
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-purple-600" />
                <span>Resume Log</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 ml-1">
                  {resumeLogData.length}
                </span>
              </div>
            }
            data={resumeLogData}
            columns={resumeLogColumns}
            loading={loading}
            serverSideFiltering={true}
            hideDefaultActions
            noDataMessage="No resume activity recorded."
          />
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────────────── */}

      {/* ── Start Day Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={showStartDayModal}
        onClose={() => {
          setShowStartDayModal(false);
          setStartDayError(null);
        }}
        title={SHIFT_CONSTANTS.UI.START_NEW_DAY}
        size="lg"
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 sm:p-6">
          {startDayError && (
            <Alert
              variant="error"
              message={startDayError}
              onClose={() => setStartDayError(null)}
              className="mb-4"
            />
          )}
          
          <form onSubmit={handleStartDay}>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">{SHIFT_CONSTANTS.UI.OPENING_BALANCES}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputText
                  label={SHIFT_CONSTANTS.UI.CASH}
                  name="cash"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={dayOpeningBalances.cash}
                  onChange={handleDayOpeningChange}
                  required
                />
                <InputText
                  label={SHIFT_CONSTANTS.UI.BANK}
                  name="bank"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={dayOpeningBalances.bank}
                  onChange={handleDayOpeningChange}
                  required
                />
                <InputText
                  label={SHIFT_CONSTANTS.UI.MOBILE}
                  name="mobile"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={dayOpeningBalances.mobile}
                  onChange={handleDayOpeningChange}
                  required
                />
                <InputText
                  label={SHIFT_CONSTANTS.UI.OTHER}
                  name="other"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={dayOpeningBalances.other}
                  onChange={handleDayOpeningChange}
                />
              </div>

              <InputTextarea
                label={SHIFT_CONSTANTS.UI.NOTES}
                name="notes"
                value={dayNotes}
                onChange={(e) => setDayNotes(e.target.value)}
                rows={2}
                placeholder={SHIFT_CONSTANTS.UI.NOTES_PLACEHOLDER}
              />

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowStartDayModal(false);
                    setStartDayError(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  {SHIFT_CONSTANTS.UI.CANCEL}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={actionLoading}
                  loading={actionLoading}
                  loadingText={SHIFT_CONSTANTS.UI.STARTING}
                  className="w-full sm:w-auto"
                >
                  {SHIFT_CONSTANTS.UI.START_DAY}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Resume Day Modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={showResumeDayModal}
        onClose={() => {
          setShowResumeDayModal(false);
          setResumeDayError(null);
        }}
        title="Resume Day"
        size="lg"
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 sm:p-6">
          {resumeDayError && (
            <Alert
              variant="error"
              message={resumeDayError}
              onClose={() => setResumeDayError(null)}
              className="mb-4"
            />
          )}

          <form onSubmit={handleResumeDay}>
            <div className="space-y-4">
              <Alert
                variant="info"
                message="The day was previously closed. Resuming will reopen it for further shifts and transactions."
                className="mb-2"
              />

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Business Date:</span>{" "}
                  {CASHFLOW_MODULE_CONSTANTS.formatDateTime(
                    dayData?.date || CASHFLOW_MODULE_CONSTANTS.getCurrentBusinessDate(),
                    false
                  )}{" "}
                  <span className="text-xs text-blue-500">(auto-detected)</span>
                </p>
              </div>

              <InputText
                label="Resumed By"
                name="resumedBy"
                value={resumedBy}
                onChange={handleResumedByChange}
                placeholder="Enter your name"
                required
              />

              <InputTextarea
                label="Reason"
                name="reason"
                value={resumeReason}
                onChange={(e) => setResumeReason(e.target.value)}
                rows={3}
                placeholder="Why is the day being resumed?"
                required
              />

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowResumeDayModal(false);
                    setResumeDayError(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  {SHIFT_CONSTANTS.UI.CANCEL}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={actionLoading || !resumedBy.trim() || !resumeReason.trim()}
                  loading={actionLoading}
                  loadingText="Resuming..."
                  className="w-full sm:w-auto"
                >
                  Resume Day
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Close Day Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={showCloseDayModal}
        onClose={() => {
          setShowCloseDayModal(false);
          setCloseDayError(null);
        }}
        title={SHIFT_CONSTANTS.UI.CLOSE_CURRENT_DAY}
        size="lg"
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 sm:p-6">
          {closeDayError && (
            <Alert
              variant="error"
              message={closeDayError}
              onClose={() => setCloseDayError(null)}
              className="mb-4"
            />
          )}
          
          <form onSubmit={handleCloseDay}>
            <div className="space-y-4">
              <Alert
                variant="info"
                message="Closing the day will finalise all transactions. Make sure all shifts are closed."
                className="mb-2"
              />

              <InputTextarea
                label={SHIFT_CONSTANTS.UI.NOTES}
                name="notes"
                value={dayNotes}
                onChange={(e) => setDayNotes(e.target.value)}
                rows={3}
                placeholder={SHIFT_CONSTANTS.UI.NOTES_PLACEHOLDER}
              />

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCloseDayModal(false);
                    setCloseDayError(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  {SHIFT_CONSTANTS.UI.CANCEL}
                </Button>
                <Button
                  type="submit"
                  variant="warning"
                  disabled={actionLoading || hasOpenShifts}
                  loading={actionLoading}
                  loadingText={SHIFT_CONSTANTS.UI.CLOSING}
                  className="w-full sm:w-auto"
                >
                  {SHIFT_CONSTANTS.UI.CLOSE_DAY}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Start Shift Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={showStartShiftModal}
        onClose={() => {
          setShowStartShiftModal(false);
          setStartShiftError(null);
        }}
        title={SHIFT_CONSTANTS.UI.START_NEW_SHIFT}
        size="lg"
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 sm:p-6">
          {startShiftError && (
            <Alert
              variant="error"
              message={startShiftError}
              onClose={() => setStartShiftError(null)}
              className="mb-4"
            />
          )}
          
          <form onSubmit={handleStartShift}>
            <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
  <p className="text-sm text-blue-700">
    <span className="font-medium">{SHIFT_CONSTANTS.UI.BUSINESS_DATE}:</span> {CASHFLOW_MODULE_CONSTANTS.formatDateTime(dayData?.date || CASHFLOW_MODULE_CONSTANTS.getCurrentBusinessDate(), false)} ({SHIFT_CONSTANTS.UI.FROM_DAY})
  </p>
  <p className="text-xs text-blue-600 mt-1">
    {SHIFT_CONSTANTS.UI.ENDED_AT}: {CASHFLOW_MODULE_CONSTANTS.formatDateTime(CASHFLOW_MODULE_CONSTANTS.getCurrentLocalDateTime(), true)} ({SHIFT_CONSTANTS.UI.AUTO_DETECTED})
  </p>
</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputText
                  label={SHIFT_CONSTANTS.UI.STAFF_ID}
                  name="staffId"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  required
                />
                <InputText
                  label={SHIFT_CONSTANTS.UI.STAFF_NAME}
                  name="staffName"
                  value={staffName}
                  onChange={handleStaffNameChange}
                  required
                />
              </div>

              <h3 className="font-medium text-gray-700">{SHIFT_CONSTANTS.UI.OPENING_BALANCES}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputText
                  label={SHIFT_CONSTANTS.UI.CASH}
                  name="cash"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={shiftOpeningBalances.cash}
                  onChange={handleShiftOpeningChange}
                  required
                />
                <InputText
                  label={SHIFT_CONSTANTS.UI.BANK}
                  name="bank"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={shiftOpeningBalances.bank}
                  onChange={handleShiftOpeningChange}
                  required
                />
                <InputText
                  label={SHIFT_CONSTANTS.UI.MOBILE}
                  name="mobile"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={shiftOpeningBalances.mobile}
                  onChange={handleShiftOpeningChange}
                  required
                />
                <InputText
                  label={SHIFT_CONSTANTS.UI.OTHER}
                  name="other"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={shiftOpeningBalances.other}
                  onChange={handleShiftOpeningChange}
                />
              </div>

              <InputTextarea
                label={SHIFT_CONSTANTS.UI.NOTES}
                name="notes"
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                rows={2}
                placeholder={SHIFT_CONSTANTS.UI.NOTES_PLACEHOLDER}
              />

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowStartShiftModal(false);
                    setStartShiftError(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  {SHIFT_CONSTANTS.UI.CANCEL}
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  disabled={actionLoading}
                  loading={actionLoading}
                  loadingText={SHIFT_CONSTANTS.UI.STARTING}
                  className="w-full sm:w-auto"
                >
                  {SHIFT_CONSTANTS.UI.START_SHIFT}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Close Shift Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={showCloseShiftModal}
        onClose={() => {
          setShowCloseShiftModal(false);
          setCloseShiftError(null);
        }}
        title={SHIFT_CONSTANTS.UI.CLOSE_SHIFT}
        size="lg"
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 sm:p-6">
          {closeShiftError && (
            <Alert
              variant="error"
              message={closeShiftError}
              onClose={() => setCloseShiftError(null)}
              className="mb-4"
            />
          )}
          
          <form onSubmit={handleCloseShift}>
            <div className="space-y-4">
              <Alert
                variant="info"
                message={`Closing shift for ${selectedShift?.staff_name || selectedShift?.staff_id}`}
                className="mb-2"
              />

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
  <p className="text-sm text-blue-700">
    <span className="font-medium">{SHIFT_CONSTANTS.UI.BUSINESS_DATE}:</span> {CASHFLOW_MODULE_CONSTANTS.formatDateTime(dayData?.date || CASHFLOW_MODULE_CONSTANTS.getCurrentBusinessDate(), false)} ({SHIFT_CONSTANTS.UI.FROM_DAY})
  </p>
  <p className="text-xs text-blue-600 mt-1">
    {SHIFT_CONSTANTS.UI.STARTED_AT}: {CASHFLOW_MODULE_CONSTANTS.formatDateTime(CASHFLOW_MODULE_CONSTANTS.getCurrentLocalDateTime(), true)} ({SHIFT_CONSTANTS.UI.AUTO_DETECTED})
  </p>
</div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Current System Balances
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-2 rounded border border-blue-100">
                    <span className="text-xs text-gray-500 block">{SHIFT_CONSTANTS.UI.CASH}</span>
                    <span className="text-sm font-bold text-blue-700">
                      {formatCurrency(currentBalances.cash)}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-100">
                    <span className="text-xs text-gray-500 block">{SHIFT_CONSTANTS.UI.BANK}</span>
                    <span className="text-sm font-bold text-blue-700">
                      {formatCurrency(currentBalances.bank)}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-100">
                    <span className="text-xs text-gray-500 block">{SHIFT_CONSTANTS.UI.MOBILE}</span>
                    <span className="text-sm font-bold text-blue-700">
                      {formatCurrency(currentBalances.mobile)}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-100">
                    <span className="text-xs text-gray-500 block">{SHIFT_CONSTANTS.UI.OTHER}</span>
                    <span className="text-sm font-bold text-blue-700">
                      {formatCurrency(currentBalances.other)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  ⓘ {SHIFT_CONSTANTS.UI.ENTER_PHYSICAL_COUNTS}
                </p>
              </div>

              <h3 className="font-medium text-gray-700 mt-2">{SHIFT_CONSTANTS.UI.PHYSICAL_CLOSING}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputText
                  label={SHIFT_CONSTANTS.UI.CASH}
                  name="cash"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={shiftCloseCounts.cash}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,8}$/.test(value)) {
                      setShiftCloseCounts(prev => ({ ...prev, cash: value }));
                    }
                  }}
                  required
                />
                <InputText
                  label={SHIFT_CONSTANTS.UI.BANK}
                  name="bank"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={shiftCloseCounts.bank}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,8}$/.test(value)) {
                      setShiftCloseCounts(prev => ({ ...prev, bank: value }));
                    }
                  }}
                  required
                />
                <InputText
                  label={SHIFT_CONSTANTS.UI.MOBILE}
                  name="mobile"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={shiftCloseCounts.mobile}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,8}$/.test(value)) {
                      setShiftCloseCounts(prev => ({ ...prev, mobile: value }));
                    }
                  }}
                  required
                />
                <InputText
                  label={SHIFT_CONSTANTS.UI.OTHER}
                  name="other"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={shiftCloseCounts.other}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,8}$/.test(value)) {
                      setShiftCloseCounts(prev => ({ ...prev, other: value }));
                    }
                  }}
                />
              </div>

              <InputTextarea
                label={SHIFT_CONSTANTS.UI.CLOSE_NOTES}
                name="closeNotes"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                rows={3}
                placeholder={SHIFT_CONSTANTS.UI.CLOSE_NOTES_PLACEHOLDER}
                required
              />

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCloseShiftModal(false);
                    setCloseShiftError(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  {SHIFT_CONSTANTS.UI.CANCEL}
                </Button>
                <Button
                  type="submit"
                  variant="warning"
                  disabled={actionLoading}
                  loading={actionLoading}
                  loadingText={SHIFT_CONSTANTS.UI.CLOSING}
                  className="w-full sm:w-auto"
                >
                  {SHIFT_CONSTANTS.UI.CLOSE}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── View Shift Modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={showViewShiftModal}
        onClose={() => {
          setShowViewShiftModal(false);
          setViewShiftData(null);
          setViewShiftError(null);
        }}
        title={SHIFT_CONSTANTS.UI.SHIFT_BALANCE_DETAILS}
        size="lg"
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 sm:p-6">
          {viewShiftLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {viewShiftError && (
            <Alert
              variant="error"
              message={viewShiftError}
              onClose={() => setViewShiftError(null)}
              className="mb-4"
            />
          )}

          {viewShiftData && !viewShiftLoading && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Shift Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">{SHIFT_CONSTANTS.UI.SHIFT_ID}</p>
                    <p className="text-sm font-medium">{viewShiftData.shift_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{SHIFT_CONSTANTS.UI.STAFF}</p>
                    <p className="text-sm font-medium">{viewShiftData.staff_name} ({viewShiftData.staff_id})</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{SHIFT_CONSTANTS.UI.STATUS}</p>
                    <p className={`text-sm font-medium ${
                      viewShiftData.status === 'open' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {viewShiftData.status === 'open' ? SHIFT_CONSTANTS.UI.OPEN : SHIFT_CONSTANTS.UI.CLOSED}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{SHIFT_CONSTANTS.UI.STARTED_AT}</p>
                    <p className="text-sm">{CASHFLOW_MODULE_CONSTANTS.formatDateTime(viewShiftData.started_at)}</p>
                  </div>
                  {viewShiftData.ended_at && (
                    <div>
                      <p className="text-xs text-gray-500">{SHIFT_CONSTANTS.UI.ENDED_AT}</p>
                      <p className="text-sm">{CASHFLOW_MODULE_CONSTANTS.formatDateTime(viewShiftData.ended_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {SHIFT_CONSTANTS.UI.OPENING_BALANCES}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{SHIFT_CONSTANTS.UI.CASH}</p>
                    <p className="text-lg font-bold text-green-700">
                      {formatCurrency(viewShiftData.opening_balances?.cash)}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{SHIFT_CONSTANTS.UI.BANK}</p>
                    <p className="text-lg font-bold text-green-700">
                      {formatCurrency(viewShiftData.opening_balances?.bank)}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{SHIFT_CONSTANTS.UI.MOBILE}</p>
                    <p className="text-lg font-bold text-green-700">
                      {formatCurrency(viewShiftData.opening_balances?.mobile)}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{SHIFT_CONSTANTS.UI.OTHER}</p>
                    <p className="text-lg font-bold text-green-700">
                      {formatCurrency(viewShiftData.opening_balances?.other)}
                    </p>
                  </div>
                </div>
              </div>

              {viewShiftData.physical_closing && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {SHIFT_CONSTANTS.UI.PHYSICAL_CLOSING}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500">{SHIFT_CONSTANTS.UI.CASH}</p>
                      <p className="text-lg font-bold text-blue-700">
                        {formatCurrency(viewShiftData.physical_closing.cash)}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500">{SHIFT_CONSTANTS.UI.BANK}</p>
                      <p className="text-lg font-bold text-blue-700">
                        {formatCurrency(viewShiftData.physical_closing.bank)}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500">{SHIFT_CONSTANTS.UI.MOBILE}</p>
                      <p className="text-lg font-bold text-blue-700">
                        {formatCurrency(viewShiftData.physical_closing.mobile)}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500">{SHIFT_CONSTANTS.UI.OTHER}</p>
                      <p className="text-lg font-bold text-blue-700">
                        {formatCurrency(viewShiftData.physical_closing.other)}
                      </p>
                    </div>
                  </div>
                  
                  {viewShiftData.close_notes && (
                    <div className="mt-4 pt-3 border-t border-blue-200">
                      <p className="text-xs text-gray-500">{SHIFT_CONSTANTS.UI.CLOSE_NOTES}</p>
                      <p className="text-sm text-gray-700 italic">"{viewShiftData.close_notes}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowViewShiftModal(false);
                setViewShiftData(null);
              }}
            >
              {SHIFT_CONSTANTS.UI.CLOSE}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}