// TotalSupply.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Table from "../../../common/table/Table";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { useLocation } from "react-router-dom";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/inventory/inventoryEnd";
import ExportReports from "../../../common/reports/ExportReports";
import { NO_RECORD_FOUND } from "../../../constants/Messages";
import { useAuth } from "../../../auth/hooks/useAuth";

// Load branches from localStorage
import { getVendorChildIds } from '../../../../services/vendorUtils';

export default function TotalSupply() {
  const { user, selectBranch } = useAuth();
  const location = useLocation();

  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [selectedBranch, setSelectedBranch] = useState(""); // Label
  const [selectedValue, setSelectedValue] = useState("");   // vendorId
  const isMaster = user?.isMaster || false;

  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

  const [groupBy, setGroupBy] = useState("drug");

  const currentVendorId = user?.currentBranch?.vendorId || user?.vendorId || user?.userId || '';

  // Load branches from localStorage
  const childVendors = getVendorChildIds() || [];
  const branchOptions = childVendors.map(item => ({
    value: item.vendor_id,
    label: item.branch_id,
  }));

  // Show dropdown
  useEffect(() => {
    setShowBranchDropdown(childVendors.length > 0 || !!currentVendorId);
  }, [childVendors.length, currentVendorId]);

  // Sync with auth context
  useEffect(() => {
    const branchId = user?.currentBranch?.id || '';
    const vendorId = user?.currentBranch?.vendorId || '';
    setSelectedBranch(branchId || 'Current Account');
    setSelectedValue(vendorId || currentVendorId);
  }, [user?.currentBranch, currentVendorId]);

  // Dynamic Title
const dynamicTitle = useMemo(() => {
  const branchLabel = selectedBranch || 'Current Account';
  const isCurrent = !selectedBranch || selectedBranch === 'Current Account';

  return (
    <div className="flex items-center gap-3">
      <span className="text-xl font-semibold text-gray-800">
        Total Supply
      </span>
      <span className="text-gray-500">—</span>
      <span
        className={`
          inline-flex items-center px-3 py-1 rounded-full text-sm font-bold shadow-sm
          ${isCurrent
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-blue-100 text-blue-800 border border-blue-300'
          }
        `}
      >
        {isCurrent ? 'Current Account' : `Branch: ${branchLabel}`}
      </span>
    </div>
  );
}, [selectedBranch]);
  // Vendor ID resolver
  const getVendorIdToUse = useCallback(() => {
    return selectedValue || currentVendorId;
  }, [selectedValue, currentVendorId]);

  // Fetch total supplied
  const fetchSupplies = useCallback(async () => {
    const vendorId = getVendorIdToUse();
    if (!vendorId || vendorId === 'undefined' || vendorId.trim() === '') {
      setSupplies([]);
      setPagination(p => ({ ...p, total: 0 }));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      const endpoint = `${apiEndpoints.drugTotalSupplied(
        pagination.page,
        pagination.page_size,
        groupBy
      )}&vendor_id=${vendorId}`;

      const { data } = await apiService.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const rawData = data?.data || [];
      const meta = data?.pagination || {};

      if (!Array.isArray(rawData)) {
        setSupplies([]);
        setPagination(p => ({ ...p, total: 0 }));
        return;
      }

      const mapped = rawData.map((item, index) => {
        const key = groupBy === "drug" ? item.drug_name : item.supplier_name;
        return {
          id: `${key}-${index}`,
          name: key || "N/A",
          supplied_quantity: Number(item.supplied_quantity || item.total_supplied) || 0,
        };
      });

      setSupplies(mapped);
      setPagination(p => ({
        ...p,
        total: meta.total_items || meta.total_records || mapped.length || 0,
      }));
    } catch (err) {
      const isKMError =
        !err.response ||
        err.code === "ERR_NETWORK" ||
        [500, 503].includes(err.response?.status) ||
        err.message?.includes("octet-stream") ||
        err.message?.includes("null:");

      if (isKMError || (err.response?.data?.pagination && Array.isArray(err.response.data?.data))) {
        const rawData = err.response?.data?.data || [];
        const meta = err.response?.data?.pagination || {};

        if (Array.isArray(rawData)) {
          const mapped = rawData.map((item, index) => {
            const key = groupBy === "drug" ? item.drug_name : item.supplier_name;
            return {
              id: `${key}-${index}`,
              name: key || "N/A",
              supplied_quantity: Number(item.supplied_quantity || item.total_supplied) || 0,
            };
          });
          setSupplies(mapped);
          setPagination(p => ({
            ...p,
            total: meta.total_items || meta.total_records || mapped.length || 0,
          }));
        } else {
          setSupplies([]);
          setPagination(p => ({ ...p, total: 0 }));
        }
        setError(null);
      } else {
        setError("Failed to load total supply data.");
        setSupplies([]);
        setPagination(p => ({ ...p, total: 0 }));
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.page_size, groupBy, getVendorIdToUse]);

  // SINGLE useEffect — like MedicineList
  useEffect(() => {
    if (currentVendorId) {
      fetchSupplies();
    }
  }, [fetchSupplies, currentVendorId]);

  // Success message
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(null), 5000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle Filter Change — Reset groupBy on branch change
  const handleFilterChange = useCallback((name, value) => {
    if (name === "branch_id") {
      const vendorId = value || currentVendorId;
      const branchLabel = value
        ? branchOptions.find(opt => opt.value === value)?.label || 'Selected Branch'
        : 'Current Account';

      setSelectedValue(vendorId);
      setSelectedBranch(branchLabel);
      setGroupBy("drug"); // Reset groupBy on branch change

      if (value && value !== currentVendorId) {
        selectBranch({
          branchId: branchLabel,
          branchName: branchLabel,
          vendorId,
          applicationRoles: []
        });
      } else {
        selectBranch(null);
      }
      setPagination(p => ({ ...p, page: 1 }));
    } else if (name === "group_by") {
      setGroupBy(value);
      setPagination(p => ({ ...p, page: 1 }));
    }
  }, [branchOptions, currentVendorId, selectBranch]);

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchSupplies();
  };

  const columns = useMemo(() => [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <HeaderWithSort
          column={column}
          title={groupBy === "drug" ? "Drug Name" : "Supplier Name"}
        />
      ),
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "supplied_quantity",
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Total Supplied" />
      ),
      cell: ({ row }) => (
        <div className="text-sm font-semibold">
          {row.original.supplied_quantity.toLocaleString()}
        </div>
      ),
    },
  ], [groupBy]);

  const filterFields = useMemo(() => [
    {
      type: "select",
      name: "group_by",
      label: "Group By",
      value: groupBy,
      onChange: (e) => handleFilterChange("group_by", e.target.value),
      options: [
        { value: "drug", label: "By Drug" },
        { value: "supplier", label: "By Supplier" },
      ],
    },
    ...(isMaster && showBranchDropdown
      ? [{
          type: "select",
          name: "branch_id",
          label: "Branch",
          placeholder: "Select Branch",
          value: selectedValue,
          onChange: (e) => handleFilterChange("branch_id", e.target.value),
          options: [
            { value: currentVendorId, label: "Current Account" },
            ...branchOptions,
          ],
        }]
      : []),
  ], [groupBy, selectedValue, showBranchDropdown, branchOptions, currentVendorId, handleFilterChange]);

  const exportEndpoint = useMemo(() => {
    const vendorId = getVendorIdToUse();
    if (!vendorId) return null;
    return `${apiEndpoints.drugTotalSupplied(1, 1000, groupBy)}&vendor_id=${vendorId}`;
  }, [groupBy, getVendorIdToUse]);

  return (
    <div className="relative">
      <div className="absolute top-4 right-6 z-20 flex gap-2">
        {exportEndpoint && (
          <ExportReports
            endpoint={exportEndpoint}
            data={supplies}
            reportType={`Total Supplied (${groupBy === "drug" ? "By Drug" : "By Supplier"})`}
            headers={columns.map(col => col.accessorKey)}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
          />
        )}
      </div>

      <div>
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-center justify-between">
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-700 hover:text-green-900 font-bold"
            >
              ×
            </button>
          </div>
        )}

        <Table
          title={dynamicTitle}
          data={supplies}
          columns={columns}
          filterFields={filterFields}
          onFilterChange={handleFilterChange}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          addButtonName="NEW SUPPLY"
          addButtonPath="/admin-vendors/pharmacy-management/inventory/total-supply/new"
          hideDefaultActions
          loading={loading}
          serverSideFiltering={true}
          error={error}
          onRetry={handleRetry}
          noDataMessage={
            supplies.length === 0 && !loading && !error
              ? NO_RECORD_FOUND
              : error
          }
        />
      </div>
    </div>
  );
}