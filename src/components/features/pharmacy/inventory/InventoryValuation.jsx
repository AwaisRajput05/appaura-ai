// InventoryValuation.jsx — FIXED VERSION (Handles master/non-master users)
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getToken } from '../../../../services/tokenUtils';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/endpoint/inventory/inventoryEnd';
import { NO_RECORD_FOUND } from '../../../constants/Messages';
import HomeTable from '../../../common/table/Table';
import ExportReports from '../../../common/reports/ExportReports';
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { useAuth } from '../../../auth/hooks/useAuth';
import { INVENTORY_MODULE_CONSTANTS } from './inventoryconstants/inventoryModuleConstants';

// UI Components
import { Package } from 'lucide-react';

export default function InventoryValuation() {
  const { user } = useAuth();
  const location = useLocation();
  const controllerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const [valuation, setValuation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState('current');
  const [selectedBranchesPayload, setSelectedBranchesPayload] = useState([]);

  // USE CONSTANTS
  const { vendorId, branchId: originalBranchId, isMaster, businessName: currentBusinessName } = INVENTORY_MODULE_CONSTANTS.getUserInfo(user);
  const childVendors = useMemo(() => getVendorChildIds() || [], []);

  const fullBranchOptions = useMemo(() => 
    INVENTORY_MODULE_CONSTANTS.getBranchOptionsWithAll(user, childVendors), 
    [childVendors, user]
  );

  // Initialize branch
  useEffect(() => {
    setSelectedBranch(currentBusinessName);
    setSelectedValue('current');
    setSelectedBranchesPayload([{
      vendor_id: vendorId,
      branch_id: originalBranchId
    }]);
  }, [vendorId, originalBranchId, currentBusinessName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  const dynamicTitle = useMemo(() => {
  const isCurrent = selectedValue === 'current';
  const isAll = selectedValue === 'all';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <Package className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 flex-shrink-0" />
        <span className="text-xl sm:text-2xl font-bold text-gray-800 truncate max-w-[180px] sm:max-w-full">
          Inventory Valuation
        </span>
      </div>
      <span className="hidden sm:inline text-gray-500">—</span>
      <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm w-fit ${
        isCurrent 
          ? 'bg-green-100 text-green-800 border border-green-300' 
          : isAll 
            ? 'bg-purple-100 text-purple-800 border border-purple-300' 
            : 'bg-blue-100 text-blue-800 border border-blue-300'
      }`}>
        {isCurrent ? currentBusinessName : isAll ? 'All Branches' : `Branch: ${selectedBranch}`}
      </span>
    </div>
  );
}, [selectedBranch, selectedValue, currentBusinessName]);

  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 1000,
    total: 0,
  });

  const baseEndpoint = useMemo(() => apiEndpoints.inventoryValue(), []);

  const fetchValuation = async () => {
    if (!vendorId) {
      setError('Vendor ID is missing. Please log in again.');
      setLoading(false);
      return;
    }

    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, vendorId);
      INVENTORY_MODULE_CONSTANTS.addBranchHeaders(headers, originalBranchId, '', vendorId);

      // Determine if we should send body or not
      // Non-master users cannot send body in POST request
      let requestBody = null;
      
      if (isMaster && selectedBranchesPayload.length > 0) {
        // Master user can send body for multiple branches
        requestBody = selectedBranchesPayload;
      } else {
        // Non-master users should NOT send body
        // The server will use headers to determine the branch
        requestBody = null;
      }

      const { data } = await apiService.post(baseEndpoint, requestBody, {
        headers,
        signal: controllerRef.current.signal,
        timeout: 15000
      });

      if (!isMountedRef.current) return;

      let processedData = [];
      const rawData = data?.data;

      if (Array.isArray(rawData)) {
        processedData = rawData;
      } else if (typeof rawData?.total_inventory_value === 'number') {
        processedData = [{
          total_inventory_value: rawData.total_inventory_value,
          branch_id: originalBranchId,
          vendor_id: vendorId
        }];
      } else {
        throw new Error('No inventory value found');
      }

      const nameMap = { [vendorId]: currentBusinessName };
      childVendors.forEach(item => {
        nameMap[item.vendor_id] = item.business_name;
      });

      const formattedData = processedData.map(item => ({
        ...item,
        business_name: nameMap[item.vendor_id] || item.branch_id || "N/A",
        inventory_value: item.total_inventory_value,
        total_inventory_value: item.total_inventory_value 
      }));

      setValuation(formattedData);
      setPagination(prev => ({
        ...prev,
        total: formattedData.length
      }));
    } catch (err) {
      if (!isMountedRef.current) return;
      if (INVENTORY_MODULE_CONSTANTS.isAbortError(err)) return;
      
      // Handle the specific error for non-master users
      if (err.response?.data?.message?.includes("Non-master vendors can't allow to provide body")) {
        // Retry without body for non-master users
        if (!isMaster) {
          console.log('Retrying without body for non-master user');
          // Clear the body and retry
          setSelectedBranchesPayload([]);
          setTimeout(() => fetchValuation(), 100);
          return;
        }
      }
      
      setError(INVENTORY_MODULE_CONSTANTS.getErrorMessage(err));
      setValuation([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchValuation();
  }, [selectedBranchesPayload]);

  useEffect(() => {
    if (location.state?.message) {
      INVENTORY_MODULE_CONSTANTS.showSuccess(setSuccessMessage, location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFilterChange = useCallback((name, value) => {
    if (name === "branch_id") {
      const selectedOption = fullBranchOptions.find(opt => opt.value === value);
      if (!selectedOption) return;

      setSelectedValue(value);
      setSelectedBranch(selectedOption.label);
      setPagination(prev => ({ ...prev, page: 1 }));

      let payloadArray = [];

      if (value === 'current') {
        payloadArray = [{
          vendor_id: vendorId,
          branch_id: originalBranchId
        }];
      } else if (value === 'all' && isMaster) {
        // Only allow "all" for master users
        payloadArray.push({
          vendor_id: vendorId,
          branch_id: originalBranchId
        });
        childVendors.forEach(item => {
          payloadArray.push({
            vendor_id: item.vendor_id,
            branch_id: item.branch_id
          });
        });
      } else if (value !== 'all' && isMaster) {
        // Only allow specific branch selection for master users
        payloadArray = [{
          vendor_id: value,
          branch_id: selectedOption.branch_id
        }];
      } else {
        // Non-master users can only view current branch
        setSelectedValue('current');
        setSelectedBranch(currentBusinessName);
        payloadArray = [];
        return;
      }

      setSelectedBranchesPayload(payloadArray);
    }
  }, [fullBranchOptions, vendorId, originalBranchId, childVendors, isMaster, currentBusinessName]);

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(prev => {
      const newPage = prev.page_size !== pageSize ? 1 : page;
      return { ...prev, page: newPage, page_size: pageSize };
    });
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchValuation();
  };

  const columns = useMemo(() => {
    const cols = [];
    if (selectedValue === 'all') {
      cols.push({ 
        accessorKey: "business_name", 
        header: "Branch", 
        cell: ({ row }) => <span className="font-medium">{row.original.business_name}</span> 
      });
    }
    cols.push({ 
      accessorKey: "inventory_value", 
      header: "Inventory Value", 
      cell: ({ row }) => <span className="font-bold text-green-700">{INVENTORY_MODULE_CONSTANTS.formatCurrency(row.original.inventory_value)}</span> 
    });
    return cols;
  }, [selectedValue]);
const filterFields = useMemo(() => [
  ...(isMaster && fullBranchOptions.length > 1 ? [{
    type: "select",
    name: "branch_id",
    label: "Branch",
    placeholder: "Select Branch",
    value: selectedValue,
    onChange: (e) => handleFilterChange("branch_id", e.target.value),
    options: fullBranchOptions,
    className: "w-full sm:w-auto", // Add this line
  }] : []),
], [selectedValue, fullBranchOptions, isMaster, handleFilterChange]);

  const exportParams = useMemo(() => ({}), []);
  const exportBody = isMaster ? selectedBranchesPayload : null; // Only send body for master users

  let totalValue = 0;
  let formattedTotal = '';
  if (selectedValue === 'all' && valuation.length > 1) {
    totalValue = valuation.reduce((sum, item) => sum + item.total_inventory_value, 0);
    formattedTotal = INVENTORY_MODULE_CONSTANTS.formatCurrency(totalValue);
  }

  return (
    <div className="relative">
     {successMessage && (
  <div className="bg-green-100 border border-green-400 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 mx-2 sm:mx-0 text-sm sm:text-base">
    <span className="block sm:inline">{successMessage}</span>
  </div>
)}
    <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
  <ExportReports 
    endpoint={baseEndpoint}
    data={valuation} 
    reportType="Inventory Valuation" 
    headers={columns.map(c => c.accessorKey)} 
    loading={loading} 
    setLoading={setLoading}
    setError={setError}
    body={exportBody}
    params={exportParams}
  />
</div>

      <HomeTable
        title={dynamicTitle}
        data={valuation}
        columns={columns}
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
        loading={loading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        serverSideFiltering={true}
        error={error}
        onRetry={handleRetry}
        noDataMessage={valuation.length === 0 && !loading && !error ? NO_RECORD_FOUND : error}
        hideDefaultActions={true}
      />

      {selectedValue === 'all' && formattedTotal && (
  <div className="mt-6 sm:mt-8 bg-white p-4 sm:p-6 rounded-xl shadow-md mx-2 sm:mx-0">
    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-800">Total Across All Branches</h3>
    <div className="text-2xl sm:text-3xl font-bold text-green-700">{formattedTotal}</div>
  </div>
)}
    </div>
  );
}