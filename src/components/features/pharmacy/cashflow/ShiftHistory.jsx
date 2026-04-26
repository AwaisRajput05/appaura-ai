// ShiftHistory.jsx — Shift History Table
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import HomeTable from "../../../common/table/table3";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { cashBookEndpoints } from '../../../../services/endpoint/cashflow/cashEnd';
import ExportReports from "../../../common/reports/ExportReports";
import { useAuth } from "../../../auth/hooks/useAuth";
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { Info } from 'lucide-react';

import Card from "../../../../components/ui/Card";
import Alert from "../../../../components/ui/feedback/Alert";
import Tooltip from "../../../../components/ui/feedback/Tooltip";
import { CASHFLOW_MODULE_CONSTANTS } from "./cashflowconstant/cashflowconstant";

const { REPORT_CONSTANTS } = CASHFLOW_MODULE_CONSTANTS;

const BalanceTooltip = ({ shift }) => {
  return (
    <Tooltip
      content={
        <div className="p-2 space-y-2 min-w-[250px]">
          <p className="font-semibold border-b pb-1">Opening Balances</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Cash:</span>
              <span className="font-medium ml-4">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(shift.opening_balances?.cash || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bank:</span>
              <span className="font-medium ml-4">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(shift.opening_balances?.bank || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mobile:</span>
              <span className="font-medium ml-4">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(shift.opening_balances?.mobile || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Other:</span>
              <span className="font-medium ml-4">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(shift.opening_balances?.other || 0)}</span>
            </div>
          </div>
          
          <p className="font-semibold border-b pb-1 mt-3">Shift Closing</p>
          {shift.physical_closing ? (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Cash:</span>
                <span className="font-medium ml-4">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(shift.physical_closing.cash || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bank:</span>
                <span className="font-medium ml-4">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(shift.physical_closing.bank || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mobile:</span>
                <span className="font-medium ml-4">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(shift.physical_closing.mobile || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Other:</span>
                <span className="font-medium ml-4">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(shift.physical_closing.other || 0)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Shift still open</p>
          )}
        </div>
      }
    >
      <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
        <Info className="h-4 w-4 text-blue-500" />
      </button>
    </Tooltip>
  );
};

export default function ShiftHistory() {
  const { user } = useAuth();

  const controllerRef = useRef(null);
  const shiftsTimerRef = useRef(null);
  const successTimeoutRef = useRef(null);

  const today = CASHFLOW_MODULE_CONSTANTS.getCurrentBusinessDate();
  
  const [shiftsData, setShiftsData] = useState([]);
  const [shiftsMeta, setShiftsMeta] = useState({
    from_date: '',
    to_date: '',
    branch_id: '',
    vendor_id: '',
    total_days_in_period: 0,
    shift_count_this_page: 0,
    filters: {}
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [filters, setFilters] = useState({
    fromDate: today,
    toDate: today,
    ledgerKey: '',
    category: '',
    staffId: '',
  });

  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedChildVendorId, setSelectedChildVendorId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

  const vendorId = user?.currentBranch?.vendorId || user?.vendorId || localStorage.getItem('vendorId');
  const branchId = user?.currentBranch?.id || user?.branchId || localStorage.getItem('branchId') || "main";
  const childVendors = getVendorChildIds() || [];
  const isMaster = user?.isMaster || false;
  const currentBusinessName = user?.currentBranch?.businessName || user?.businessName || 'Current Branch';

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

  useEffect(() => {
    return () => {
      CASHFLOW_MODULE_CONSTANTS.abortControllers(controllerRef);
      if (shiftsTimerRef.current) clearTimeout(shiftsTimerRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const fetchData = useCallback(async () => {
    CASHFLOW_MODULE_CONSTANTS.abortControllers(controllerRef);
    controllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = CASHFLOW_MODULE_CONSTANTS.getAuthHeaders(token, selectedBranchId || branchId);
      
      const url = cashBookEndpoints.cashFlowShifts(
        filters.staffId || '',
        filters.ledgerKey || '',
        filters.category || '',
        filters.fromDate,
        filters.toDate,
        pagination.page,
        pagination.page_size
      );

      const response = await apiService.get(url, { 
        headers, 
        signal: controllerRef.current.signal,
        timeout: CASHFLOW_MODULE_CONSTANTS.API_TIMEOUT 
      });

      if (response.data?.status === "success") {
        const data = response.data.data || {};
        const paginationData = response.data.pagination || {};
        
        setShiftsData(data.shifts || []);
        setShiftsMeta({
          from_date: data.from_date || '',
          to_date: data.to_date || '',
          branch_id: data.branch_id || '',
          vendor_id: data.vendor_id || '',
          total_days_in_period: data.total_days_in_period || 0,
          shift_count_this_page: data.shift_count_this_page || 0,
          filters: data.filters || {}
        });
        
        setPagination({
          page: paginationData.page || 1,
          page_size: paginationData.page_size || 10,
          total: paginationData.total_records || 0,
        });
      } else {
        setShiftsData([]);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(CASHFLOW_MODULE_CONSTANTS.getErrorMessage(err) || REPORT_CONSTANTS.ERRORS.FETCH_SHIFTS_FAILED);
      setShiftsData([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.page_size, selectedBranchId, branchId]);

  useEffect(() => {
    if (shiftsTimerRef.current) clearTimeout(shiftsTimerRef.current);
    const shouldDebounce = filters.staffId || filters.ledgerKey || filters.category;
    const delay = shouldDebounce ? CASHFLOW_MODULE_CONSTANTS.DEBOUNCE_DELAY : 0;
    
    shiftsTimerRef.current = setTimeout(() => {
      fetchData();
    }, delay);
    
    return () => {
      if (shiftsTimerRef.current) clearTimeout(shiftsTimerRef.current);
    };
  }, [fetchData]);

  const handleFilterChange = useCallback((name, value) => {
    if (name === "branch_id") {
      const branch = childVendors.find(v => v.branch_id === value);
      setSelectedValue(value);
      setSelectedBranch(branch?.business_name || 'Current Branch');
      setSelectedChildVendorId(branch?.vendor_id || '');
      setSelectedBranchId(value);
      setPagination(prev => ({ ...prev, page: 1 }));
    } else if (["fromDate", "toDate", "ledgerKey", "category", "staffId"].includes(name)) {
      setFilters(prev => ({ ...prev, [name]: value }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [childVendors]);

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchData();
  };

  const dynamicTitle = useMemo(() => {
    const branchLabel = selectedBranch || currentBusinessName;
    const isCurrent = selectedValue === vendorId || !selectedValue;

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-lg sm:text-xl font-semibold text-gray-800">
            {REPORT_CONSTANTS.UI.SHIFT_HISTORY}
          </span>
        </div>
        <span className="hidden sm:inline text-gray-500">—</span>
        <span
          className={`
            inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm w-fit
            ${isCurrent
              ? REPORT_CONSTANTS.STATUS_COLORS.CURRENT_BRANCH
              : REPORT_CONSTANTS.STATUS_COLORS.OTHER_BRANCH
            }
          `}
        >
          {branchLabel}
        </span>
      </div>
    );
  }, [selectedBranch, selectedValue, vendorId, currentBusinessName]);

  const { firstShift, lastShift } = useMemo(() => {
    if (!shiftsData || shiftsData.length === 0) {
      return { firstShift: null, lastShift: null };
    }
    const sorted = [...shiftsData].sort((a, b) => {
      const startA = a.shift_period?.split('→')[0]?.trim() || '';
      const startB = b.shift_period?.split('→')[0]?.trim() || '';
      return startA.localeCompare(startB);
    });
    return {
      firstShift: sorted[0],
      lastShift: sorted[sorted.length - 1]
    };
  }, [shiftsData]);

  const columns = useMemo(() => [
    {
      accessorKey: "shift_id",
      header: ({ column }) => <HeaderWithSort column={column} title={REPORT_CONSTANTS.UI.SHIFT_ID} />,
      cell: ({ row }) => <div className="text-xs sm:text-sm font-mono">{row.original.shift_id}</div>,
    },
    {
      accessorKey: "staff_id",
      header: ({ column }) => <HeaderWithSort column={column} title={REPORT_CONSTANTS.UI.STAFF_ID} />,
      cell: ({ row }) => <div className="text-xs sm:text-sm font-mono">{row.original.staff_id}</div>,
    },
    {
      accessorKey: "staff_name",
      header: ({ column }) => <HeaderWithSort column={column} title={REPORT_CONSTANTS.UI.STAFF_NAME} />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs sm:text-sm">{row.original.staff_name}</span>
          <BalanceTooltip shift={row.original} />
        </div>
      ),
    },
    {
      accessorKey: "shift_period",
      header: REPORT_CONSTANTS.UI.SHIFT_PERIOD,
      cell: ({ row }) => <div className="text-xs sm:text-sm">{CASHFLOW_MODULE_CONSTANTS.formatShiftPeriod(row.original.shift_period)}</div>,
    },
    {
      accessorKey: "status",
      header: REPORT_CONSTANTS.UI.STATUS,
      cell: ({ row }) => {
        const isOpen = row.original.status === 'open';
        return (
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
            isOpen ? REPORT_CONSTANTS.STATUS_COLORS.OPEN : REPORT_CONSTANTS.STATUS_COLORS.CLOSED
          }`}>
            {isOpen ? REPORT_CONSTANTS.UI.OPEN : REPORT_CONSTANTS.UI.CLOSED}
          </span>
        );
      },
    },
    {
      accessorKey: "physical_closing",
      header: REPORT_CONSTANTS.UI.PHYSICAL_CLOSING,
      cell: ({ row }) => {
        const closing = row.original.physical_closing;
        if (!closing) {
          return <span className="text-xs text-gray-400 italic">Open shift</span>;
        }
        return (
          <div className="text-xs">
            <div className="flex items-center gap-1">
              <span className="font-medium">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(closing.cash || 0)}</span>
              <span className="text-gray-400 text-[10px]">(Cash)</span>
            </div>
            <div className="text-[10px] text-gray-500">
              B: {CASHFLOW_MODULE_CONSTANTS.formatCurrency(closing.bank || 0)} | 
              M: {CASHFLOW_MODULE_CONSTANTS.formatCurrency(closing.mobile || 0)} | 
              O: {CASHFLOW_MODULE_CONSTANTS.formatCurrency(closing.other || 0)}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "transactions_count",
      header: REPORT_CONSTANTS.UI.TRANSACTIONS,
      cell: ({ row }) => <div className="text-xs sm:text-sm font-medium text-center">{row.original.transactions_count}</div>,
    },
    {
      accessorKey: "total_medicine_sales",
      header: REPORT_CONSTANTS.UI.MEDICINE_SALES,
      cell: ({ row }) => <div className="text-xs sm:text-sm font-medium">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(row.original.total_medicine_sales)}</div>,
    },
  ], []);

  const filterFields = useMemo(() => {
    const fields = [
      {
        type: "dateRange",
        label: "Date Range",
        fromName: "fromDate",
        toName: "toDate",
        value: { 
          start_date: filters.fromDate, 
          end_date: filters.toDate 
        },
        onChange: (e) => handleFilterChange(e.target.name, e.target.value),
        className: "w-full sm:w-auto",
      },
      {
        type: "text",
        name: "staffId",
        label: REPORT_CONSTANTS.UI.STAFF_ID,
        placeholder: REPORT_CONSTANTS.PLACEHOLDERS.STAFF_ID,
        value: filters.staffId,
        onChange: (e) => handleFilterChange("staffId", e.target.value),
        className: "w-full sm:w-auto",
      },
      {
        type: "text",
        name: "ledgerKey",
        label: REPORT_CONSTANTS.UI.LEDGER,
        placeholder: REPORT_CONSTANTS.PLACEHOLDERS.LEDGER_KEY,
        value: filters.ledgerKey,
        onChange: (e) => handleFilterChange("ledgerKey", e.target.value),
        className: "w-full sm:w-auto",
      },
      {
        type: "select",
        name: "category",
        label: REPORT_CONSTANTS.UI.CATEGORY,
        placeholder: REPORT_CONSTANTS.PLACEHOLDERS.SELECT_CATEGORY,
        value: filters.category,
        onChange: (e) => handleFilterChange("category", e.target.value),
        options: REPORT_CONSTANTS.CATEGORY_OPTIONS,
        className: "w-full sm:w-auto",
      },
    ];

    if (isMaster && childVendors.length > 0) {
      fields.push({
        type: "select",
        name: "branch_id",
        label: "Branch",
        placeholder: "Select Branch",
        value: selectedValue,
        onChange: (e) => handleFilterChange("branch_id", e.target.value),
        options: [
          { value: "", label: "Current Branch" },
          ...childVendors.map(v => ({ value: v.branch_id, label: v.business_name }))
        ],
        className: "w-full sm:w-auto",
      });
    }

    return fields;
  }, [filters, selectedValue, childVendors, isMaster, handleFilterChange]);

  const exportEndpoint = useMemo(() => {
    return cashBookEndpoints.cashFlowShifts(
      filters.staffId,
      filters.ledgerKey,
      filters.category,
      filters.fromDate,
      filters.toDate,
      1,
      1000
    );
  }, [filters]);

  return (
    <div className="relative">
  

      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          className="mb-4 mx-2 sm:mx-4"
        />
      )}
      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          className="mb-4 mx-2 sm:mx-4"
        />
      )}

      {shiftsData.length > 0 && firstShift && lastShift && (
        <Card className="mb-6 mx-2 sm:mx-4" bodyClassName="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">Period Overview</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-200 hover:border-green-200 group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{REPORT_CONSTANTS.UI.OPENING_BALANCES}</span>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm flex justify-between">
                  <span className="text-gray-600">{REPORT_CONSTANTS.UI.CASH}:</span>
                  <span className="font-semibold text-gray-900">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(firstShift.opening_balances?.cash || 0)}</span>
                </p>
                <p className="text-sm flex justify-between">
                  <span className="text-gray-600">{REPORT_CONSTANTS.UI.BANK}:</span>
                  <span className="font-semibold text-gray-900">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(firstShift.opening_balances?.bank || 0)}</span>
                </p>
                <p className="text-sm flex justify-between">
                  <span className="text-gray-600">{REPORT_CONSTANTS.UI.MOBILE}:</span>
                  <span className="font-semibold text-gray-900">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(firstShift.opening_balances?.mobile || 0)}</span>
                </p>
                <p className="text-sm flex justify-between">
                  <span className="text-gray-600">{REPORT_CONSTANTS.UI.OTHER}:</span>
                  <span className="font-semibold text-gray-900">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(firstShift.opening_balances?.other || 0)}</span>
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                First Shift: {firstShift.staff_name} ({CASHFLOW_MODULE_CONSTANTS.formatTimeOnly(firstShift.shift_period?.split('→')[0])})
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-200 hover:border-blue-200 group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{REPORT_CONSTANTS.UI.PHYSICAL_CLOSING_LAST}</span>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              {lastShift.physical_closing ? (
                <div className="space-y-1.5">
                  <p className="text-sm flex justify-between">
                    <span className="text-gray-600">{REPORT_CONSTANTS.UI.CASH}:</span>
                    <span className="font-semibold text-gray-900">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(lastShift.physical_closing.cash || 0)}</span>
                  </p>
                  <p className="text-sm flex justify-between">
                    <span className="text-gray-600">{REPORT_CONSTANTS.UI.BANK}:</span>
                    <span className="font-semibold text-gray-900">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(lastShift.physical_closing.bank || 0)}</span>
                  </p>
                  <p className="text-sm flex justify-between">
                    <span className="text-gray-600">{REPORT_CONSTANTS.UI.MOBILE}:</span>
                    <span className="font-semibold text-gray-900">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(lastShift.physical_closing.mobile || 0)}</span>
                  </p>
                  <p className="text-sm flex justify-between">
                    <span className="text-gray-600">{REPORT_CONSTANTS.UI.OTHER}:</span>
                    <span className="font-semibold text-gray-900">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(lastShift.physical_closing.other || 0)}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Shift still open</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Last Shift: {lastShift.staff_name} ({CASHFLOW_MODULE_CONSTANTS.formatTimeOnly(lastShift.shift_period?.split('→')[0])})
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-200 hover:border-orange-200 group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{REPORT_CONSTANTS.UI.SUMMARY}</span>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm flex justify-between">
                  <span className="text-gray-600">{REPORT_CONSTANTS.UI.TOTAL_SHIFTS}:</span>
                  <span className="font-semibold text-gray-900">{shiftsData.length}</span>
                </p>
                <p className="text-sm flex justify-between">
                  <span className="text-gray-600">{REPORT_CONSTANTS.UI.OPEN_SHIFTS}:</span>
                  <span className="font-semibold text-green-600">
                    {shiftsData.filter(s => s.status === 'open').length}
                  </span>
                </p>
                <p className="text-sm flex justify-between">
                  <span className="text-gray-600">{REPORT_CONSTANTS.UI.CLOSED_SHIFTS}:</span>
                  <span className="font-semibold text-gray-600">
                    {shiftsData.filter(s => s.status === 'closed').length}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <HomeTable
        title={dynamicTitle}
        data={shiftsData}
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
        noDataMessage={REPORT_CONSTANTS.UI.NO_SHIFTS_FOUND}
      />

      {shiftsData.map((shift, index) => (
        <Card key={index} className="mb-6 mx-2 sm:mx-4" bodyClassName="p-4">
          <h4 className="font-semibold mb-3">
            {REPORT_CONSTANTS.UI.TRANSACTIONS} - {shift.staff_name} ({REPORT_CONSTANTS.UI.SHIFT}: {shift.shift_id})
          </h4>
          {shift.transactions && shift.transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{REPORT_CONSTANTS.UI.TIME}</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{REPORT_CONSTANTS.UI.DIRECTION}</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{REPORT_CONSTANTS.UI.LEDGER}</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{REPORT_CONSTANTS.UI.AMOUNT}</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{REPORT_CONSTANTS.UI.CATEGORY}</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{REPORT_CONSTANTS.UI.DESCRIPTION}</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{REPORT_CONSTANTS.UI.REFERENCE}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shift.transactions.map((tx, txIndex) => (
                    <tr key={txIndex} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs">{CASHFLOW_MODULE_CONSTANTS.formatTimeOnly(tx.timestamp)}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                          tx.direction === 'in' ? REPORT_CONSTANTS.STATUS_COLORS.IN : REPORT_CONSTANTS.STATUS_COLORS.OUT
                        }`}>
                          {tx.direction?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs capitalize">{tx.ledger_key}</td>
                      <td className="px-3 py-2 text-xs font-medium">{CASHFLOW_MODULE_CONSTANTS.formatCurrency(tx.amount)}</td>
                      <td className="px-3 py-2 text-xs capitalize">{tx.category}</td>
                      <td className="px-3 py-2 text-xs max-w-[150px] truncate">{tx.description || REPORT_CONSTANTS.DEFAULTS.DASH}</td>
                      <td className="px-3 py-2 text-xs">{tx.reference_id || REPORT_CONSTANTS.DEFAULTS.DASH}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{REPORT_CONSTANTS.UI.NO_TRANSACTIONS}</p>
          )}
        </Card>
      ))}
    </div>
  );
}