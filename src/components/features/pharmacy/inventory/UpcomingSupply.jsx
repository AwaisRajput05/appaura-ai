// UpcomingSupply.jsx
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

export default function UpcomingSupply({ triggerFetchAll = false }) {
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

  const [filters, setFilters] = useState({
    drug_name: "",
  });

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
        Upcoming Supply
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

  // Fetch upcoming supplies
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
      const endpoint = `${apiEndpoints.drugUpcomingSupplies(
        pagination.page,
        pagination.page_size,
        filters.drug_name
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

      const mapped = rawData.map((item, index) => ({
        id: `${item.drug_name}-${item.supply_date}-${index}`,
        drug_name: item.drug_name || "N/A",
        supplied_quantity: Number(item.supplied_quantity) || 0,
        supply_date: item.supply_date
          ? new Date(item.supply_date).toLocaleDateString()
          : "N/A",
        supplier_name: item.supplier_name || "N/A",
      }));

      setSupplies(mapped);
      setPagination(p => ({
        ...p,
        total: meta.total_records || meta.total_items || mapped.length || 0,
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
          const mapped = rawData.map((item, index) => ({
            id: `${item.drug_name}-${item.supply_date}-${index}`,
            drug_name: item.drug_name || "N/A",
            supplied_quantity: Number(item.supplied_quantity) || 0,
            supply_date: item.supply_date
              ? new Date(item.supply_date).toLocaleDateString()
              : "N/A",
            supplier_name: item.supplier_name || "N/A",
          }));
          setSupplies(mapped);
          setPagination(p => ({
            ...p,
            total: meta.total_records || meta.total_items || mapped.length || 0,
          }));
        } else {
          setSupplies([]);
          setPagination(p => ({ ...p, total: 0 }));
        }
        setError(null);
      } else {
        setError("Failed to load upcoming supplies.");
        setSupplies([]);
        setPagination(p => ({ ...p, total: 0 }));
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.page_size, filters.drug_name, getVendorIdToUse]);

  // SINGLE useEffect — includes triggerFetchAll
  useEffect(() => {
    if (currentVendorId) {
      fetchSupplies();
    }
  }, [fetchSupplies, currentVendorId, triggerFetchAll]);

  // Success message
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(null), 5000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFilterChange = useCallback((name, value) => {
    if (name === "branch_id") {
      const vendorId = value || currentVendorId;
      const branchLabel = value
        ? branchOptions.find(opt => opt.value === value)?.label || 'Selected Branch'
        : 'Current Account';

      setSelectedValue(vendorId);
      setSelectedBranch(branchLabel);

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
    } else {
      setFilters(p => ({ ...p, [name]: value }));
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
      accessorKey: "drug_name",
      header: ({ column }) => <HeaderWithSort column={column} title="Drug Name" />,
      cell: ({ row }) => <div className="font-medium">{row.original.drug_name}</div>,
    },
    {
      accessorKey: "supplied_quantity",
      header: ({ column }) => <HeaderWithSort column={column} title="Quantity" />,
      cell: ({ row }) => <div className="text-sm">{row.original.supplied_quantity}</div>,
    },
    {
      accessorKey: "supply_date",
      header: ({ column }) => <HeaderWithSort column={column} title="Supply Date" />,
      cell: ({ row }) => <div className="text-sm">{row.original.supply_date}</div>,
    },
    {
      accessorKey: "supplier_name",
      header: ({ column }) => <HeaderWithSort column={column} title="Supplier" />,
      cell: ({ row }) => <div className="text-sm">{row.original.supplier_name}</div>,
    },
  ], []);

  const filterFields = useMemo(() => [
    {
      type: "text",
      name: "drug_name",
      label: "Drug Name",
      value: filters.drug_name,
      onChange: (e) => handleFilterChange("drug_name", e.target.value),
    },
    ...(isMaster &&showBranchDropdown
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
  ], [filters.drug_name, selectedValue, showBranchDropdown, branchOptions, currentVendorId, handleFilterChange]);

  const exportEndpoint = useMemo(() => {
    const vendorId = getVendorIdToUse();
    if (!vendorId) return null;
    return `${apiEndpoints.drugUpcomingSupplies(
      1,
      1000,
      filters.drug_name
    )}&vendor_id=${vendorId}`;
  }, [filters.drug_name, getVendorIdToUse]);

  return (
    <div className="relative">
      <div className="absolute top-4 right-6 z-20 flex gap-2">
        {exportEndpoint && (
          <ExportReports
            endpoint={exportEndpoint}
            data={supplies}
            reportType="Upcoming Supply"
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
          addButtonPath="/admin-vendors/pharmacy-management/inventory/upcoming-supply/new"
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