// TransCompare.jsx - COMPLETELY REFACTORED WITH ENHANCED CONSTANTS & DATE FORMATTING
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import HomeTable from "../../../common/table/Table";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/salesend/salesend";
import ExportReports from "../../../common/reports/ExportReports";
import { useAuth } from "../../../auth/hooks/useAuth";
import { getVendorChildIds } from "../../../../services/vendorUtils";
import { SALES_MODULE_CONSTANTS } from "./salesconstants/salesModuleConstants";
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

// Import UI Components
import Alert from '../../../../components/ui/feedback/Alert';

export default function TransCompare() {
  // Refs for cleanup
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const { user } = useAuth();
  
  // State variables
  const [trends, setTrends] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateError, setDateError] = useState("");
  
  // Filters
  const [filters, setFilters] = useState({
    period_type: "day",
    base_date: "",
    compare_date: "",
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

  // USE CONSTANTS FOR USER INFO
  const { 
    currentVendorId, 
    originalBranchId, 
    isMaster, 
    currentBusinessName 
  } = SALES_MODULE_CONSTANTS.getUserInfo(user);
  
  const childVendors = getVendorChildIds() || [];
  
  // USE CONSTANTS FOR BRANCH OPTIONS
  const fullBranchOptions = useMemo(() => 
    SALES_MODULE_CONSTANTS.getBranchOptions(user, childVendors), 
    [childVendors, user]
  );

  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedBranchesPayload, setSelectedBranchesPayload] = useState([]);

  // Initialize branch
  useEffect(() => {
    setSelectedBranch(currentBusinessName);
    setSelectedValue('current');
    setSelectedBranchesPayload([{
      vendorId: currentVendorId,
      branchId: originalBranchId
    }]);
  }, [currentVendorId, originalBranchId, currentBusinessName]);

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

  // Load saved filters - USING CONSTANTS
  useEffect(() => {
    const saved = SALES_MODULE_CONSTANTS.loadSavedFilters("salesComparisonFilters");
    if (saved) {
      setFilters({
        period_type: ["day", "week", "month"].includes(saved.period_type) ? saved.period_type : "day",
        base_date: saved.base_date || "",
        compare_date: saved.compare_date || "",
      });
    }
  }, []);

  // Save filters - USING CONSTANTS
  useEffect(() => {
    SALES_MODULE_CONSTANTS.saveFilters("salesComparisonFilters", filters);
  }, [filters]);

  // Auto-set default dates using constants
  useEffect(() => {
    if (!filters.base_date || !filters.compare_date) {
      const now = new Date();
      let baseStart, compareStart;
      
      if (filters.period_type === "day") {
        compareStart = SALES_MODULE_CONSTANTS.getYesterday(now);
        baseStart = SALES_MODULE_CONSTANTS.getYesterday(compareStart);
      } else if (filters.period_type === "week") {
        compareStart = SALES_MODULE_CONSTANTS.getStartOfWeek(now);
        compareStart.setDate(compareStart.getDate() - 7);
        compareStart = SALES_MODULE_CONSTANTS.getStartOfWeek(compareStart);
        baseStart = new Date(compareStart);
        baseStart.setDate(baseStart.getDate() - 7);
        baseStart = SALES_MODULE_CONSTANTS.getStartOfWeek(baseStart);
      } else if (filters.period_type === "month") {
        compareStart = SALES_MODULE_CONSTANTS.getStartOfMonth(now);
        compareStart.setMonth(compareStart.getMonth() - 1);
        baseStart = new Date(compareStart);
        baseStart.setMonth(baseStart.getMonth() - 1);
      }
      
      setFilters(prev => ({
        ...prev,
        base_date: SALES_MODULE_CONSTANTS.formatDateToISO(baseStart),
        compare_date: SALES_MODULE_CONSTANTS.formatDateToISO(compareStart),
      }));
    }
  }, [filters.period_type, filters.base_date, filters.compare_date]);

  const periodLabel = useMemo(() => {
    if (filters.period_type === "day") return "Day";
    return filters.period_type.charAt(0).toUpperCase() + filters.period_type.slice(1) + "ly";
  }, [filters.period_type]);

  const dynamicTitle = useMemo(() => {
    const branchLabel = selectedBranch;
    const isCurrent = selectedValue === 'current';

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <span className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-full">
          Transaction Comparison
        </span>
        <span className="text-gray-500">—</span>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold shadow-sm ${
          isCurrent 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : 'bg-blue-100 text-blue-800 border border-blue-300'
        }`}>
          {isCurrent ? currentBusinessName : `Branch: ${branchLabel}`}
        </span>
      </div>
    );
  }, [selectedBranch, selectedValue, currentBusinessName]);

  const baseEndpoint = useMemo(() => apiEndpoints.transactionComparison('', '', '', '').split('?')[0], []);

  const vendorIdsString = useMemo(() => 
    selectedBranchesPayload
      .map(item => item.vendorId || item.vendor_id)
      .filter(Boolean)
      .join(','),
  [selectedBranchesPayload]);

 const fetchData = async () => {
  if (controllerRef.current) controllerRef.current.abort();
  controllerRef.current = SALES_MODULE_CONSTANTS.createAbortController();
  
  try {
    if (!isMountedRef.current) return;
    setLoading(true);
    setError(null);
    setDateError("");
    
    const token = getToken();
    if (!token) return;
    
    // USE CONSTANTS FOR AUTH HEADERS
    const headers = SALES_MODULE_CONSTANTS.getAuthHeaders(token, currentVendorId);
    
    const params = {
      vendor_ids: vendorIdsString,
      period_type: filters.period_type,
      base_date: filters.base_date,
      compare_date: filters.compare_date
    };
    
    const { data } = await apiService.get(baseEndpoint, {
      headers,
      params,
      signal: controllerRef.current.signal,
      timeout: 20000,
    });
    
    // Check if component is still mounted
    if (!isMountedRef.current) return;
    
    if (data.status !== "success") {
      throw new Error(data.message || "Failed to fetch data");
    }
    
    const responseData = data.data ?? {};
    
    // Format dates in the response data if they exist
    if (responseData.base_period) {
      if (responseData.base_period.start_date) {
        responseData.base_period.start_date_formatted = SALES_MODULE_CONSTANTS.formatDate(responseData.base_period.start_date, false);
      }
      if (responseData.base_period.end_date) {
        responseData.base_period.end_date_formatted = SALES_MODULE_CONSTANTS.formatDate(responseData.base_period.end_date, false);
      }
      if (responseData.base_period.date_range) {
        // If date_range is a string, keep it as is
        responseData.base_period.date_range_display = responseData.base_period.date_range;
      } else if (responseData.base_period.start_date && responseData.base_period.end_date) {
        responseData.base_period.date_range_display = `${SALES_MODULE_CONSTANTS.formatDate(responseData.base_period.start_date, false)} - ${SALES_MODULE_CONSTANTS.formatDate(responseData.base_period.end_date, false)}`;
      }
    }
    
    if (responseData.compare_period) {
      if (responseData.compare_period.start_date) {
        responseData.compare_period.start_date_formatted = SALES_MODULE_CONSTANTS.formatDate(responseData.compare_period.start_date, false);
      }
      if (responseData.compare_period.end_date) {
        responseData.compare_period.end_date_formatted = SALES_MODULE_CONSTANTS.formatDate(responseData.compare_period.end_date, false);
      }
      if (responseData.compare_period.date_range) {
        responseData.compare_period.date_range_display = responseData.compare_period.date_range;
      } else if (responseData.compare_period.start_date && responseData.compare_period.end_date) {
        responseData.compare_period.date_range_display = `${SALES_MODULE_CONSTANTS.formatDate(responseData.compare_period.start_date, false)} - ${SALES_MODULE_CONSTANTS.formatDate(responseData.compare_period.end_date, false)}`;
      }
    }
    
    setComparisonData(responseData);
    
    // FIXED: Use item_changes instead of drug_changes
    const rawChanges = responseData.item_changes ?? responseData.drug_changes ?? [];
    
    const mapped = rawChanges.map((item, idx) => ({
      ...item,
      id: `${item.item_name || item.drug_name}-${item.batch_code}-${idx}`,
      // Map item_name to drug_name for the table
      drug_name: item.item_name || item.drug_name,
      action: item.action,
      batch_code: item.batch_code,
      strength: item.strength,
      quantity: item.quantity,
      from_quantity: item.from_quantity,
      to_quantity: item.to_quantity,
      difference: item.difference,
      branches: item.branches,
      branches_base: item.branches_base,
      branches_compare: item.branches_compare,
      invoices: item.invoices,
    }));
    
    setTrends(mapped);
    setPagination(p => ({ ...p, total: mapped.length }));
  } catch (err) {
    if (!isMountedRef.current) return;
    
    // USE CONSTANTS FOR ERROR HANDLING
    SALES_MODULE_CONSTANTS.handleApiError(err, setError, setLoading);
    setTrends([]);
    setPagination(p => ({ ...p, total: 0 }));
  } finally {
    if (isMountedRef.current) {
      setLoading(false);
    }
  }
};
  // Debounced effect with proper cleanup
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (controllerRef.current) controllerRef.current.abort();
    
    timerRef.current = setTimeout(() => {
      fetchData();
    }, 300);
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [
    filters.period_type,
    filters.base_date,
    filters.compare_date,
    pagination.page,
    pagination.page_size,
    selectedBranchesPayload
  ]);

  const handleFilterChange = useCallback((name, value) => {
    if (name === "compare_date") {
      const today = SALES_MODULE_CONSTANTS.getTodayDate();
      if (value > today) {
        value = today;
      }
    } else if (name === "branch_id") {
      const selectedOption = fullBranchOptions.find(opt => opt.value === value);
      if (!selectedOption) return;

      setSelectedValue(value);
      setSelectedBranch(selectedOption.label);
      setPagination(prev => ({ ...prev, page: 1 }));

      let payloadArray = [];

      if (value === 'current') {
        payloadArray = [{
          vendorId: currentVendorId,
          branchId: originalBranchId
        }];
      } else if (value === 'all') {
        payloadArray.push({
          vendorId: currentVendorId,
          branchId: originalBranchId
        });
        childVendors.forEach(item => {
          payloadArray.push({
            vendor_id: item.vendor_id,
            branch_id: item.branch_id
          });
        });
      } else {
        payloadArray = [{
          vendor_id: value,
          branch_id: selectedOption.branch_id
        }];
      }

      setSelectedBranchesPayload(payloadArray);
      return;
    }
    setFilters(p => ({ ...p, [name]: value }));
    setPagination(p => ({ ...p, page: 1 }));
  }, [fullBranchOptions, currentVendorId, originalBranchId, childVendors]);

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchData();
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "action",
        header: ({ column }) => <HeaderWithSort column={column} title="Activity" />,
        cell: ({ row }) => {
          const action = row.original.action;
          const color =
            action === 'added' ? 'text-green-600' :
            action === 'removed' ? 'text-red-600' :
            'text-yellow-600';
          return <div className={`font-medium capitalize ${color}`}>{action.replace('_', ' ')}</div>;
        },
      },
      {
        accessorKey: "drug_name",
        header: ({ column }) => <HeaderWithSort column={column} title="Medicine Name" />,
        cell: ({ row }) => <div className="font-semibold text-blue-700">{row.original.drug_name}</div>,
      },
      {
        accessorKey: "batch_code",
        header: ({ column }) => <HeaderWithSort column={column} title="Batch" />,
        cell: ({ row }) => <div>{row.original.batch_code}</div>,
      },
      {
        accessorKey: "strength",
        header: ({ column }) => <HeaderWithSort column={column} title="Strength" />,
        cell: ({ row }) => <div>{row.original.strength}</div>,
      },
      {
        header: "Quantity",
        cell: ({ row }) => {
          const r = row.original;
          if (r.action === 'quantity_changed') return <div>{r.from_quantity} → {r.to_quantity}</div>;
          return <div>{r.quantity || '-'}</div>;
        },
      },
      {
        header: "Difference",
        cell: ({ row }) => {
          const r = row.original;
          let diff = r.difference ?? r.quantity ?? 0;
          if (r.action === 'added') diff = `+${diff}`;
          if (r.action === 'removed') diff = `-${Math.abs(diff)}`;
          const color = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600';
          return <div className={`font-bold ${color}`}>{diff}</div>;
        },
      },
      {
        header: "Branches",
        cell: ({ row }) => {
          const r = row.original;
          if (r.action === 'quantity_changed') {
            return <div>Base: {r.branches_base?.join(', ') || 'N/A'}<br/>Compare: {r.branches_compare?.join(', ') || 'N/A'}</div>;
          }
          return <div>{r.branches?.join(', ') || 'N/A'}</div>;
        },
      },
    ],
    []
  );

  const filterFields = useMemo(
    () => [
      {
        type: "select",
        name: "period_type",
        label: "Period Type",
        value: filters.period_type,
        onChange: (e) => handleFilterChange("period_type", e.target.value),
        options: [
          { value: "day", label: "Daily" },
          { value: "week", label: "Weekly" },
          { value: "month", label: "Monthly" },
        ],
      },
      {
        type: "date",
        name: "base_date",
        label: "Base Period Start",
        value: filters.base_date,
        onChange: (e) => handleFilterChange("base_date", e.target.value),
      },
      {
        type: "date",
        name: "compare_date",
        label: "Compare Period End",
        value: filters.compare_date,
        max: SALES_MODULE_CONSTANTS.getTodayDate(),
        onChange: (e) => handleFilterChange("compare_date", e.target.value),
      },
    ],
    [filters, handleFilterChange, isMaster, fullBranchOptions, selectedValue]
  );

  const exportParams = useMemo(() => ({
    vendor_ids: vendorIdsString || undefined,
    period_type: filters.period_type,
    base_date: filters.base_date,
    compare_date: filters.compare_date
  }), [filters, vendorIdsString]);

  const displayedData = trends.slice(
    (pagination.page - 1) * pagination.page_size,
    pagination.page * pagination.page_size
  );

  // USE CONSTANTS FOR CURRENCY FORMATTING
  const formatCurrency = SALES_MODULE_CONSTANTS.formatCurrency;

  return (
    <div className="relative">
      <div className="absolute top-4 right-6 z-20">
        <ExportReports
          endpoint={baseEndpoint}
          data={trends}
          reportType={`Sales Comparison - ${periodLabel}`}
          headers={columns.map(c => c.accessorKey)}
          loading={loading}
          setLoading={setLoading}
          setError={setError}
          params={exportParams}
        />
      </div>
      
      {/* Use Alert component for errors */}
      {dateError && (
        <Alert
          variant="error"
          message={dateError}
          show={true}
          icon={true}
          className="mb-4"
          onClose={() => setDateError("")}
        />
      )}

      {error && (
        <Alert
          variant="error"
          message={error}
          show={true}
          icon={true}
          className="mb-4"
          onClose={() => setError(null)}
          action={handleRetry}
          actionLabel="Retry"
        />
      )}
      
      <HomeTable
        title={dynamicTitle}
        data={displayedData}
        columns={columns}
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
        hideDefaultActions
        loading={loading}
        serverSideFiltering={true}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        error={error}
        onRetry={handleRetry}
        noDataMessage="No changes detected between the selected periods."
      />
      
      {/* IMPROVED Summary Cards at the BOTTOM */}
      {comparisonData && (
        <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <ChartBarIcon className="h-8 w-8 text-indigo-600" />
         <div>
  <h2 className="text-2xl font-bold text-gray-800">
    {(() => {
      if (!comparisonData.summary) return "Sales Performance Comparison";
      
      let formattedSummary = comparisonData.summary;
      // Find all dates in YYYY-MM-DD format and replace them
      const dateMatches = formattedSummary.match(/\d{4}-\d{2}-\d{2}/g);
      if (dateMatches) {
        dateMatches.forEach(date => {
          formattedSummary = formattedSummary.replace(
            date, 
            SALES_MODULE_CONSTANTS.formatDate(date, false)
          );
        });
      }
      return formattedSummary;
    })()}
  </h2>
  <p className="text-gray-600 text-sm mt-1">
    Comparison between base period and compare period
  </p>
</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Base Period Card */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-md border border-blue-100 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-800">Base Period</h3>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              
              <div className="space-y-4">
               <div>
  <p className="text-sm text-gray-600 mb-1">Date Range</p>
  <p className="font-medium text-gray-800 bg-blue-50 p-2 rounded-lg">
    {comparisonData.base_period?.date_range 
      ? SALES_MODULE_CONSTANTS.formatDate(comparisonData.base_period.date_range, false)
      : 'N/A'}
  </p>
</div>
                
                <div className="pt-4 border-t border-blue-100">
                  <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-blue-700">
                      {formatCurrency(comparisonData.base_period?.total_amount)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-blue-100">
                  <div>
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-xl font-semibold text-gray-800">
                      {comparisonData.base_period?.transaction_count || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Compare Period Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-xl shadow-md border border-emerald-100 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-800">Compare Period</h3>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              
              <div className="space-y-4">
              <div>
  <p className="text-sm text-gray-600 mb-1">Date Range</p>
  <p className="font-medium text-gray-800 bg-emerald-50 p-2 rounded-lg">
    {comparisonData.compare_period?.date_range 
      ? SALES_MODULE_CONSTANTS.formatDate(comparisonData.compare_period.date_range, false)
      : 'N/A'}
  </p>
</div>
                
                <div className="pt-4 border-t border-emerald-100">
                  <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-emerald-700">
                      {formatCurrency(comparisonData.compare_period?.total_amount)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-emerald-100">
                  <div>
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-xl font-semibold text-gray-800">
                      {comparisonData.compare_period?.transaction_count || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <DocumentTextIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Difference Card */}
            <div className={`bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl shadow-md border hover:shadow-lg transition-shadow duration-300 ${
              (comparisonData.amount_difference || 0) >= 0 
                ? 'border-green-100' 
                : 'border-red-100'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-800">Performance Difference</h3>
                <div className={`p-2 rounded-lg ${
                  (comparisonData.amount_difference || 0) >= 0 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  {(comparisonData.amount_difference || 0) >= 0 ? (
                    <ArrowUpIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <ArrowDownIcon className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Revenue Change</p>
                  <div className={`flex items-center gap-3 p-4 rounded-lg ${
                    (comparisonData.amount_difference || 0) >= 0 
                      ? 'bg-green-50' 
                      : 'bg-red-50'
                  }`}>
                    <div className={`p-2 rounded-lg ${
                      (comparisonData.amount_difference || 0) >= 0 
                        ? 'bg-green-100' 
                        : 'bg-red-100'
                    }`}></div>
                    <div>
                      <p className={`text-2xl font-bold ${
                        (comparisonData.amount_difference || 0) >= 0 
                          ? 'text-green-700' 
                          : 'text-red-700'
                      }`}>
                        {formatCurrency(Math.abs(comparisonData.amount_difference || 0))}
                      </p>
                      <p className={`text-sm font-medium ${
                        (comparisonData.amount_difference || 0) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {(comparisonData.amount_difference || 0) >= 0 ? 'Increase' : 'Decrease'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-2">Transaction Change</p>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      ((comparisonData.compare_period?.transaction_count || 0) - 
                       (comparisonData.base_period?.transaction_count || 0)) >= 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {((comparisonData.compare_period?.transaction_count || 0) - 
                        (comparisonData.base_period?.transaction_count || 0)) >= 0 ? '+' : ''}
                      {((comparisonData.compare_period?.transaction_count || 0) - 
                        (comparisonData.base_period?.transaction_count || 0))}
                    </div>
                    <span className="text-gray-600 text-sm">
                      transactions
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-2">Percentage Change</p>
                  {comparisonData.base_period?.total_amount > 0 ? (
                    <p className={`text-lg font-bold ${
                      (comparisonData.amount_difference || 0) >= 0 
                        ? 'text-green-700' 
                        : 'text-red-700'
                    }`}>
                      {((comparisonData.amount_difference || 0) / 
                        (comparisonData.base_period?.total_amount || 1) * 100).toFixed(1)}%
                    </p>
                  ) : (
                    <p className="text-gray-500 text-sm">N/A (base period has zero revenue)</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Information Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Comparison Type</p>
                <p className="font-medium text-gray-800 capitalize">{periodLabel} Comparison</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Selected Branch</p>
                <p className="font-medium text-gray-800">{selectedBranch || currentBusinessName}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}