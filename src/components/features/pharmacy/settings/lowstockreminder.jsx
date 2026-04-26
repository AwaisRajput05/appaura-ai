// lowstockreminder.jsx - REFACTORED WITH CONSTANTS & RESPONSIVE
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/settings/settingsend";
import { useAuth } from "../../../auth/hooks/useAuth";
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { Calendar, Clock, History, AlertCircle, RefreshCw, Package, X } from 'lucide-react';
import InputText from '../../../../components/ui/forms/InputText';
import Button from '../../../../components/ui/forms/Button';
import Modal from '../../../../components/ui/Modal';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';

// Import constants
import { SETTINGS_MODULE_CONSTANTS } from './settingconstants/settingsModuleConstants';

// Extract frequently used constants
const {
  ENUMS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULT_VALUES,
  getAuthHeaders,
  addBranchHeaders,
  getUserInfo,
  getBranchOptions,
  getErrorMessage,
  validateThreshold,
  validateDayOfMonth,
  clampValue,
  formatDateForDisplay,
  formatFrequency,
  formatDayOfWeek,
  formatDayOfMonthDisplay,
  getFrequencyOptions,
  getDayOfWeekOptions,
  getStatusOptions,
  getCreatedOptions,
  getStatusInfo,
  CustomTableWrapper
} = SETTINGS_MODULE_CONSTANTS;

// CheckCircle component for success message
const CheckCircle = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function LowStockSchedule() {
  const { user } = useAuth();
  const location = useLocation();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [schedule, setSchedule] = useState(DEFAULT_VALUES.SCHEDULE);
  const [savedSchedule, setSavedSchedule] = useState(DEFAULT_VALUES.SCHEDULE);
  const [lastRunDate, setLastRunDate] = useState(null);
  const [nextRunDate, setNextRunDate] = useState(null);
  
  // Branch state
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedChildVendorId, setSelectedChildVendorId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedBusinessName, setSelectedBusinessName] = useState("");
  
  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState(DEFAULT_VALUES.FILTERS);
  const [historyPagination, setHistoryPagination] = useState(DEFAULT_VALUES.PAGINATION);
  
  // Refs
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const historyFetchRef = useRef(false);
  const historyPaginationRef = useRef(historyPagination);
  const historyFiltersRef = useRef(historyFilters);
  
  useEffect(() => {
    historyPaginationRef.current = historyPagination;
  }, [historyPagination]);

  useEffect(() => {
    historyFiltersRef.current = historyFilters;
  }, [historyFilters]);
  
  // Constants
  const CATEGORY = ENUMS.SCHEDULE_CATEGORY.LOW_STOCK_MEDICINE;
  const email = localStorage.getItem('emailAddress') || user?.email || '';
  
  // Get user info
  const { 
    currentVendorId, 
    originalBranchId, 
    isMaster, 
    currentBusinessName 
  } = useMemo(() => getUserInfo(user), [user]);
  
  // Child vendors and branch options
  const childVendors = useMemo(() => getVendorChildIds() || [], []);
  const fullBranchOptions = useMemo(() => 
    getBranchOptions(user, childVendors), 
    [user, childVendors]
  );
  
  // Initialize branch
  useEffect(() => {
    setSelectedBranch(currentBusinessName);
    setSelectedValue('current');
    setSelectedChildVendorId('');
    setSelectedBranchId(originalBranchId);
    setSelectedBusinessName(currentBusinessName);
  }, [originalBranchId, currentBusinessName]);
  
  // Handle location state messages
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);
  
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
  
  // Fetch schedule function
  const fetchSchedule = useCallback(async () => {
    const now = Date.now();
    if (fetchInProgressRef.current || (now - lastFetchTimeRef.current < 1000)) {
      return;
    }
    
    try {
      fetchInProgressRef.current = true;
      lastFetchTimeRef.current = now;
      
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      addBranchHeaders(headers, selectedBranchId, selectedChildVendorId, currentVendorId);
      
      const endpoint = `${apiEndpoints.getSchedule()}?category=${CATEGORY}`;
      
      // Abort previous request
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      controllerRef.current = new AbortController();
      
      const response = await apiService.get(endpoint, { 
        headers,
        signal: controllerRef.current.signal 
      });
      
      if (!isMountedRef.current) return;
      
      if (response.data.status === "OK" && response.data.data) {
        const scheduleData = response.data.data;
        
        const newSchedule = {
          frequency: scheduleData.frequency || DEFAULT_VALUES.SCHEDULE.frequency,
          dayOfWeek: scheduleData.dayOfWeek || DEFAULT_VALUES.SCHEDULE.dayOfWeek,
          dayOfMonth: scheduleData.dayOfMonth 
            ? clampValue(
                typeof scheduleData.dayOfMonth === 'string' 
                  ? parseInt(scheduleData.dayOfMonth, 10) 
                  : scheduleData.dayOfMonth,
                ENUMS.LIMITS.DAY_OF_MONTH_MIN,
                ENUMS.LIMITS.DAY_OF_MONTH_MAX
              ).toString()
            : DEFAULT_VALUES.SCHEDULE.dayOfMonth,
          threshold: scheduleData.threshold || DEFAULT_VALUES.SCHEDULE.threshold
        };
        
        setSchedule(newSchedule);
        setSavedSchedule(newSchedule);
        setLastRunDate(scheduleData.lastRunDate || null);
        setNextRunDate(scheduleData.nextRunDate || null);
        setIsActive(scheduleData.status === ENUMS.SCHEDULE_STATUS.ACTIVE);
      } else {
        setSchedule(DEFAULT_VALUES.SCHEDULE);
        setSavedSchedule(DEFAULT_VALUES.SCHEDULE);
        setLastRunDate(null);
        setNextRunDate(null);
        setIsActive(false);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      if (err.name === 'AbortError') return;
      
      setError(getErrorMessage(err));
      setSchedule(DEFAULT_VALUES.SCHEDULE);
      setSavedSchedule(DEFAULT_VALUES.SCHEDULE);
      setLastRunDate(null);
      setNextRunDate(null);
      setIsActive(false);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    }
  }, [selectedBranchId, selectedChildVendorId, currentVendorId, CATEGORY]);
  
  // Debounced schedule fetch
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (controllerRef.current) controllerRef.current.abort();
    
    timerRef.current = setTimeout(() => {
      fetchSchedule();
    }, 300);
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [selectedBranchId, selectedChildVendorId, fetchSchedule]);
  
  // Handle form changes
  const handleScheduleChange = useCallback((field, value) => {
    setSchedule(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleThresholdChange = useCallback((e) => {
    const value = e.target.value;
    handleScheduleChange('threshold', value === '' ? null : Number(value));
  }, [handleScheduleChange]);
  
  const handleThresholdBlur = useCallback(() => {
    const threshold = schedule.threshold;
    if (threshold == null || isNaN(threshold) || threshold < ENUMS.LIMITS.THRESHOLD_MIN) {
      handleScheduleChange('threshold', ENUMS.LIMITS.THRESHOLD_MIN);
    } else if (threshold > ENUMS.LIMITS.THRESHOLD_MAX) {
      handleScheduleChange('threshold', ENUMS.LIMITS.THRESHOLD_MAX);
    }
  }, [schedule.threshold, handleScheduleChange]);
  
  const handleDayOfMonthChange = useCallback((e) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]*$/.test(value)) {
      handleScheduleChange('dayOfMonth', value);
    }
  }, [handleScheduleChange]);
  
  const handleDayOfMonthBlur = useCallback(() => {
    if (!schedule.dayOfMonth) {
      handleScheduleChange('dayOfMonth', DEFAULT_VALUES.SCHEDULE.dayOfMonth);
      return;
    }
    const dayNum = parseInt(schedule.dayOfMonth, 10);
    if (isNaN(dayNum) || dayNum < ENUMS.LIMITS.DAY_OF_MONTH_MIN) {
      handleScheduleChange('dayOfMonth', DEFAULT_VALUES.SCHEDULE.dayOfMonth);
    } else if (dayNum > ENUMS.LIMITS.DAY_OF_MONTH_MAX) {
      handleScheduleChange('dayOfMonth', ENUMS.LIMITS.DAY_OF_MONTH_MAX.toString());
    }
  }, [schedule.dayOfMonth, handleScheduleChange]);
  
  // Handle branch change
  const handleBranchChange = useCallback((e) => {
    const value = e.target.value;
    const selectedOption = fullBranchOptions.find(opt => opt.value === value);
    if (!selectedOption) return;
    
    setSelectedValue(value);
    setSelectedBranch(selectedOption.label);
    setSelectedChildVendorId(value === 'current' ? "" : value);
    setSelectedBranchId(selectedOption.branch_id);
    setSelectedBusinessName(selectedOption.business_name);
  }, [fullBranchOptions]);
  
  // Save schedule
  const handleSave = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      // Validation
      if (!validateThreshold(schedule.threshold)) {
        setError(ERROR_MESSAGES.INVALID_THRESHOLD);
        return;
      }
      
      if (schedule.frequency === ENUMS.FREQUENCY.MONTHLY && !validateDayOfMonth(schedule.dayOfMonth)) {
        setError(ERROR_MESSAGES.INVALID_DAY_OF_MONTH);
        return;
      }
      
      const headers = getAuthHeaders();
      addBranchHeaders(headers, selectedBranchId, selectedChildVendorId, currentVendorId);
      
      const body = {
        email,
        branchId: selectedBranchId,
        frequency: schedule.frequency,
        category: CATEGORY,
        businessName: selectedBusinessName,
        threshold: schedule.threshold,
      };
      
      if (schedule.frequency === ENUMS.FREQUENCY.WEEKLY) {
        body.dayOfWeek = schedule.dayOfWeek;
      } else if (schedule.frequency === ENUMS.FREQUENCY.MONTHLY) {
        body.dayOfMonth = parseInt(schedule.dayOfMonth, 10);
      }
      
      const response = await apiService.post(apiEndpoints.saveSchedule(), body, { headers });
      
      if (response.data?.message) {
        setSuccessMessage(response.data.message);
      } else {
        setSuccessMessage(SUCCESS_MESSAGES.SCHEDULE_SAVED);
      }
      
      fetchSchedule();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [schedule, selectedBranchId, selectedChildVendorId, selectedBusinessName, currentVendorId, email, fetchSchedule]);
  
  // Activate/deactivate schedule
  const handleActivate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      addBranchHeaders(headers, selectedBranchId, selectedChildVendorId, currentVendorId);
      
      const endpoint = `${apiEndpoints.activateSchedule()}?category=${CATEGORY}`;
      const response = await apiService.patch(endpoint, {}, { headers });
      
      if (response.data?.message) {
        setSuccessMessage(response.data.message);
      } else {
        setSuccessMessage(SUCCESS_MESSAGES.SCHEDULE_ACTIVATED);
      }
      
      setIsActive(true);
      fetchSchedule();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, selectedChildVendorId, currentVendorId, fetchSchedule]);
  
  const handleDeactivate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      addBranchHeaders(headers, selectedBranchId, selectedChildVendorId, currentVendorId);
      
      const endpoint = `${apiEndpoints.deactivateSchedule()}?category=${CATEGORY}`;
      const response = await apiService.patch(endpoint, {}, { headers });
      
      if (response.data?.message) {
        setSuccessMessage(response.data.message);
      } else {
        setSuccessMessage(SUCCESS_MESSAGES.SCHEDULE_DEACTIVATED);
      }
      
      setIsActive(false);
      fetchSchedule();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, selectedChildVendorId, currentVendorId, fetchSchedule]);
  
  const fetchHistory = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (historyFetchRef.current) {
      return;
    }
    
    try {
      historyFetchRef.current = true;
      setHistoryLoading(true);
      
      const headers = getAuthHeaders();
      addBranchHeaders(headers, selectedBranchId, selectedChildVendorId, currentVendorId);
      
      // Use refs to get current values
      const currentPagination = historyPaginationRef.current;
      const currentFilters = historyFiltersRef.current;
      
      let queryParams = `category=${CATEGORY}`;
      queryParams += `&page=${currentPagination.page}&page_size=${currentPagination.page_size}`;
      
      if (currentFilters.frequency) {
        queryParams += `&frequency=${currentFilters.frequency}`;
      }
      if (currentFilters.status) {
        queryParams += `&status=${currentFilters.status}`;
      }
      if (currentFilters.created) {
        queryParams += `&created=${currentFilters.created}`;
      }
      
      const endpoint = `${apiEndpoints.historySchedule()}?${queryParams}`;
      const response = await apiService.get(endpoint, { headers });
      
      if (response.data?.status === "success" && response.data.data) {
        setHistoryData(response.data.data);
        setHistoryPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total_records || response.data.data.length || 0,
        }));
      } else if (response.data?.status === "OK" && response.data.data) {
        setHistoryData(response.data.data);
        setHistoryPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total_records || response.data.data.length || 0,
        }));
      } else {
        setHistoryData([]);
        setHistoryPagination(prev => ({ ...prev, total: 0 }));
      }
    } catch (err) {
      console.error("History fetch error:", err);
      setHistoryData([]);
      setHistoryPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setHistoryLoading(false);
      historyFetchRef.current = false;
    }
  }, [selectedBranchId, selectedChildVendorId, currentVendorId, CATEGORY]); 
  
  const handleViewHistory = useCallback(() => {
    setShowHistoryModal(true);
    setHistoryFilters(DEFAULT_VALUES.FILTERS);
    setHistoryPagination(DEFAULT_VALUES.PAGINATION);
  }, []);
  
  useEffect(() => {
    if (showHistoryModal) {
      // Add a small delay to ensure state updates are processed
      const timer = setTimeout(() => {
        fetchHistory();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showHistoryModal, 
      historyPagination.page, 
      historyPagination.page_size, 
      historyFilters.frequency, 
      historyFilters.status, 
      historyFilters.created]);
  
  const handleHistoryFilterChange = useCallback((name, value) => {
    setHistoryFilters(prev => ({ ...prev, [name]: value }));
    setHistoryPagination(prev => ({ ...prev, page: 1 }));
  }, []);
  
  const handleHistoryPaginationChange = useCallback((page, pageSize) => {
    setHistoryPagination(prev => ({ ...prev, page, page_size: pageSize }));
  }, []);
  
  const handleRefresh = useCallback(() => {
    fetchSchedule();
  }, [fetchSchedule]);
  
  // Status info
  const statusInfo = useMemo(() => getStatusInfo(isActive), [isActive]);
  
  // History table columns
  const historyColumns = useMemo(() => [
    {
      accessorKey: "frequency",
      header: ({ column }) => <HeaderWithSort column={column} title="Frequency" />,
      cell: ({ row }) => (
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            row.original.frequency === ENUMS.FREQUENCY.DAILY ? 'bg-green-500' :
            row.original.frequency === ENUMS.FREQUENCY.WEEKLY ? 'bg-blue-500' :
            'bg-purple-500'
          }`} />
          <span className="font-medium text-sm sm:text-base">
            {formatFrequency(row.original.frequency)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "schedule",
      header: "Schedule",
      cell: ({ row }) => {
        const { frequency, dayOfWeek, dayOfMonth } = row.original;
        if (frequency === ENUMS.FREQUENCY.WEEKLY && dayOfWeek) {
          return <span className="text-sm sm:text-base">{formatDayOfWeek(dayOfWeek)}</span>;
        } else if (frequency === ENUMS.FREQUENCY.MONTHLY && dayOfMonth) {
          return <span className="text-sm sm:text-base">Day {formatDayOfMonthDisplay(dayOfMonth)}</span>;
        } else {
          return <span className="text-gray-500 text-sm sm:text-base">Daily</span>;
        }
      },
    },
    {
      accessorKey: "threshold",
      header: ({ column }) => <HeaderWithSort column={column} title="Threshold" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm sm:text-base">{row.original.threshold}</span>
          <span className="text-gray-500 text-xs">units</span>
        </div>
      ),
    },
    {
      accessorKey: "nextRunDate",
      header: ({ column }) => <HeaderWithSort column={column} title="Next Run" />,
      cell: ({ row }) => (
        <div className="text-xs sm:text-sm">
          {formatDateForDisplay(row.original.nextRunDate)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <HeaderWithSort column={column} title="Status" />,
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.original.status === ENUMS.SCHEDULE_STATUS.ACTIVE 
            ? "bg-green-100 text-green-800" 
            : "bg-gray-100 text-gray-800"
        }`}>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <HeaderWithSort column={column} title="Created" />,
      cell: ({ row }) => (
        <div className="text-xs sm:text-sm text-gray-500">
          {formatDateForDisplay(row.original.createdAt)}
        </div>
      ),
    },
  ], []);
  
  // History filter fields
  const historyFilterFields = useMemo(() => [
    {
      type: "select",
      name: "frequency",
      label: "Frequency",
      placeholder: "All Frequencies",
      value: historyFilters.frequency,
      onChange: (e) => handleHistoryFilterChange("frequency", e.target.value),
      options: [
        { value: '', label: 'All Frequencies' },
        ...getFrequencyOptions()
      ],
    },
    {
      type: "select",
      name: "status",
      label: "Status",
      placeholder: "All Status",
      value: historyFilters.status,
      onChange: (e) => handleHistoryFilterChange("status", e.target.value),
      options: getStatusOptions(),
    },
    {
      type: "select",
      name: "created",
      label: "Created",
      placeholder: "All Time",
      value: historyFilters.created,
      onChange: (e) => handleHistoryFilterChange("created", e.target.value),
      options: getCreatedOptions(),
    },
  ], [historyFilters, handleHistoryFilterChange]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 py-4 sm:py-6 px-3 sm:px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header - Responsive */}
        <div className="bg-gradient-to-r from-[#30426B] via-[#3C5690] to-[#5A75C7] rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Package className="w-5 h-5 sm:w-8 sm:h-8" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Low Stock Schedule</h1>
            </div>
            <p className="text-purple-100 text-xs sm:text-sm md:text-base font-medium px-2">Configure automated reports for low stock medicines</p>
          </div>
        </div>
        
        {/* Alerts - Responsive */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-5 py-3 sm:py-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 shadow-sm">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm md:text-base font-medium">{error}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-5 py-3 sm:py-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 shadow-sm">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm md:text-base font-medium">{successMessage}</span>
          </div>
        )}
        
        {/* Loading - Responsive */}
        {loading && (
          <div className="flex justify-center items-center mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm">
              <div className="w-4 h-4 sm:w-6 sm:h-6 animate-spin rounded-full border-b-2 border-purple-600"></div>
              <span className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">Loading schedule data...</span>
            </div>
          </div>
        )}
        
        <div className="space-y-4 sm:space-y-8">
          {/* CURRENT STATUS - Responsive */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Current Status</h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate max-w-[200px] sm:max-w-full">
                  Active for {selectedBusinessName || currentBusinessName}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                  variant="icon"
                  size="sm"
                  className="text-gray-600 hover:text-purple-600 p-1.5 sm:p-2"
                >
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button
                  onClick={handleViewHistory}
                  variant="secondary"
                  size="sm"
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                >
                  <History className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> 
                  <span className="hidden xs:inline">View</span> History
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Status Card - Responsive */}
              <div className={`border rounded-lg sm:rounded-xl p-3 sm:p-5 ${statusInfo.bgColor}`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100">
                      <Package className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm sm:text-base">Low Stock</h4>
                      <p className="text-xs text-gray-600">Schedule Status</p>
                    </div>
                  </div>
                  <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${statusInfo.badgeColor}`}>
                    {statusInfo.text}
                  </span>
                </div>
                
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Frequency:</span>
                    <span className="font-medium">{formatFrequency(savedSchedule.frequency)}</span>
                  </div>
                  
                  {savedSchedule.frequency === ENUMS.FREQUENCY.WEEKLY && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Day of Week:</span>
                      <span className="font-medium">{formatDayOfWeek(savedSchedule.dayOfWeek)}</span>
                    </div>
                  )}
                  
                  {savedSchedule.frequency === ENUMS.FREQUENCY.MONTHLY && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Day of Month:</span>
                      <span className="font-medium">{formatDayOfMonthDisplay(savedSchedule.dayOfMonth)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Threshold:</span>
                    <span className="font-medium">{savedSchedule.threshold} units</span>
                  </div>
                </div>
              </div>
              
              {/* Execution Card - Responsive */}
              <div className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-5">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gray-100">
                    <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm sm:text-base">Execution Timeline</h4>
                    <p className="text-xs text-gray-600">Report generation</p>
                  </div>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs sm:text-sm">
                      <span className="text-gray-600">Last Run:</span>
                      <span className={`font-medium ${lastRunDate ? 'text-gray-800' : 'text-gray-500'}`}>
                        {formatDateForDisplay(lastRunDate)}
                      </span>
                    </div>
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${lastRunDate ? 'bg-green-500' : 'bg-gray-300'}`}
                        style={{ width: lastRunDate ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs sm:text-sm">
                      <span className="text-gray-600">Next Run:</span>
                      <span className={`font-medium ${nextRunDate ? 'text-purple-600' : 'text-gray-500'}`}>
                        {formatDateForDisplay(nextRunDate)}
                      </span>
                    </div>
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${nextRunDate ? 'bg-purple-500' : 'bg-gray-300'}`}
                        style={{ width: nextRunDate ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100">
              {!isActive ? (
                <Button
                  onClick={handleActivate}
                  disabled={loading}
                  loading={loading}
                  loadingText="Activating..."
                  variant="primary"
                  size="lg"
                  className="w-full text-sm sm:text-base py-2 sm:py-3"
                >
                  Activate Schedule
                </Button>
              ) : (
                <Button
                  onClick={handleDeactivate}
                  disabled={loading}
                  loading={loading}
                  loadingText="Deactivating..."
                  variant="danger"
                  size="lg"
                  className="w-full text-sm sm:text-base py-2 sm:py-3"
                >
                  Deactivate Schedule
                </Button>
              )}
            </div>
          </div>
          
          {/* CONFIGURATION FORM - Responsive */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Configure Settings</h3>
                <p className="text-xs sm:text-sm text-gray-600">Set up frequency and parameters</p>
              </div>
              <Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-gray-400" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Frequency */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  value={schedule.frequency}
                  onChange={(e) => handleScheduleChange('frequency', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none appearance-none bg-white"
                >
                  {getFrequencyOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Threshold */}
              <InputText
                label="Low Stock Threshold"
                name="threshold"
                type="number"
                value={schedule.threshold ?? ''}
                onChange={handleThresholdChange}
                onBlur={handleThresholdBlur}
                required={true}
                placeholder={`e.g. ${DEFAULT_VALUES.SCHEDULE.threshold}`}
                maxLength={3}
                className="mb-0"
                labelClassName="text-xs sm:text-sm"
                inputClassName="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3"
                error={schedule.threshold && !validateThreshold(schedule.threshold) ? 
                  { message: ERROR_MESSAGES.INVALID_THRESHOLD } : null}
              />
              
              {/* Conditional Fields for frequency */}
              {schedule.frequency === ENUMS.FREQUENCY.WEEKLY && (
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Day of Week <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={schedule.dayOfWeek}
                    onChange={(e) => handleScheduleChange('dayOfWeek', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none appearance-none bg-white"
                  >
                    {getDayOfWeekOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {schedule.frequency === ENUMS.FREQUENCY.MONTHLY && (
                <div className="md:col-span-2">
                  <InputText
                    label="Day of Month"
                    name="dayOfMonth"
                    type="text"
                    value={schedule.dayOfMonth}
                    onChange={handleDayOfMonthChange}
                    onBlur={handleDayOfMonthBlur}
                    required={schedule.frequency === ENUMS.FREQUENCY.MONTHLY}
                    placeholder="Enter day (1-28)"
                    maxLength={2}
                    className="mb-0"
                    labelClassName="text-xs sm:text-sm"
                    inputClassName="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3"
                    error={schedule.dayOfMonth && !validateDayOfMonth(schedule.dayOfMonth) ? 
                      { message: ERROR_MESSAGES.INVALID_DAY_OF_MONTH } : null}
                  />
                </div>
              )}
            </div>
            
            <div className="mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={loading}
                loading={loading}
                loadingText="Saving..."
                variant="primary"
                size="md"
                className="text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5"
              >
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* History Modal - Responsive */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Low Stock Schedule History"
        size="xl"
      >
        <div className="p-2 sm:p-4">
          {/* Mobile close button */}
          <div className="flex sm:hidden justify-end mb-2">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm sm:text-base">History: Low Stock Medicine</h3>
                <p className="text-xs text-gray-600">Previous configurations</p>
              </div>
            </div>
          </div>
          
          <CustomTableWrapper loading={historyLoading}>
            <div className="w-full px-2 sm:px-4 overflow-auto max-h-[60vh] sm:max-h-[70vh]">
              <HomeTable
                title="Schedule History"
                data={historyData}
                columns={historyColumns}
                filterFields={historyFilterFields}
                onFilterChange={handleHistoryFilterChange}
                loading={false}
                pagination={historyPagination}
                onPaginationChange={handleHistoryPaginationChange}
                serverSideFiltering={true}
                error={error}
                onRetry={fetchHistory}
                noDataMessage={
                  historyData.length === 0 && !historyLoading
                    ? "No history records found"
                    : error
                }
              />
            </div>
          </CustomTableWrapper>
          
          <div className="mt-4 sm:mt-6 flex justify-end">
            <Button
              onClick={() => setShowHistoryModal(false)}
              variant="primary"
              size="md"
              className="text-xs sm:text-sm px-4 sm:px-6 py-2"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}