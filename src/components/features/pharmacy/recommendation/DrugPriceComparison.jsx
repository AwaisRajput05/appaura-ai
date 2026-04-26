// DrugPriceComparison.jsx — FINAL PERFECTION: EXACT SAME AS ALL OTHER PAGES
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../../auth/hooks/useAuth";
import HomeTable from "../../../common/table/Table";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { useLocation } from "react-router-dom";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/recommendation/recommendationEnd";
import ExportReports from "../../../common/reports/ExportReports";
import {
  ERROR_429,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_503,
} from "../../../constants/Messages";
import { getVendorChildIds } from "../../../../services/vendorUtils";

// GLOBAL LIFESAVER — SAME AS EVERY OTHER FILE
let controller = null;
let timer = null;

// EXACT SAME HOVER TOOLTIP — CENTERED, BEAUTIFUL, NO FLICKER
const HoverTooltip = ({ text, title = "Details" }) => {
  if (!text || text.trim() === "") return <span className="text-gray-400">—</span>;

  const [isOpen, setIsOpen] = useState(false);
  const words = text.trim().split(/\s+/);
  const preview = words.slice(0, 2).join(" ") + (words.length > 2 ? "..." : "");

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-blue-600 hover:underline cursor-help text-sm"
      >
        {preview}
      </span>

      {isOpen && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-none">
          <div className="bg-white rounded-xl shadow-2xl p-6 border border-gray-300 max-w-2xl max-h-[80vh] overflow-y-auto pointer-events-auto">
            <h3 className="font-bold text-lg mb-4 text-center text-gray-800 border-b pb-3">
              {title}
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
              {text}
            </p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default function DrugPriceComparison() {
  const { user, selectBranch } = useAuth();
  const location = useLocation();

  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [filters, setFilters] = useState({ indication: "fever" });
  const [pagination, setPagination] = useState({ page: 1, page_size: 10, total: 0 });

  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedChildVendorId, setSelectedChildVendorId] = useState("");

  const currentVendorId = user?.vendorId || user?.userId || '';
  const originalBranchId = user?.branchId || localStorage.getItem('branchId') || '';
  const isMaster = user?.isMaster || false;

  const childVendors = getVendorChildIds() || [];
  const branchOptions = childVendors.map(item => ({
    value: item.vendor_id,
    label: item.branch_id,
  }));

  // Initialize branch — same as every other file
  useEffect(() => {
    const branchIdFromCurrent = user?.currentBranch?.id || '';
    const vendorId = user?.currentBranch?.vendorId || '';
    const initialValue = vendorId || currentVendorId;

    setSelectedBranch(branchIdFromCurrent || 'Current Branch');
    setSelectedValue(initialValue);
    setSelectedChildVendorId(vendorId && vendorId !== currentVendorId ? vendorId : "");
  }, [user?.currentBranch, currentVendorId]);

  const dynamicTitle = useMemo(() => {
    const branchLabel = selectedBranch || 'Current Branch';
    const isCurrent = !selectedBranch || selectedBranch === 'Current Branch';

    return (
      <div className="flex items-center gap-3">
        <span className="text-xl font-semibold text-gray-800">
          Medicine Price Comparison
        </span>
        <span className="text-gray-500">—</span>
        <span
          className={`
            inline-flex items-center px-3 py-1 rounded-full text-sm font-bold shadow-sm
            ${isCurrent
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-blue-100 text-blue-800 border border-green-300'
            }
          `}
        >
          {isCurrent ? 'Current Branch' : `Branch: ${branchLabel}`}
        </span>
      </div>
    );
  }, [selectedBranch]);

  const fetchDrugs = async () => {
    if (controller) controller.abort();
    controller = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const endpoint = apiEndpoints.DrugPriceComparison(
        filters.indication?.trim() || "fever",
        pagination.page,
        pagination.page_size
      );

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      };

      const isCurrentAccount = !selectedBranch || selectedBranch === 'Current Branch';
      if (isCurrentAccount) {
        headers['X-User-Branch-Id'] = originalBranchId;
      } else {
        headers['X-User-Branch-Id'] = selectedBranch;
      }

      if (selectedChildVendorId && selectedChildVendorId !== currentVendorId) {
        headers['X-Child-Id'] = selectedChildVendorId;
      }

      const { data } = await apiService.get(endpoint, {
        headers,
        signal: controller.signal,
        timeout: 30000
      });

      const list = data?.data ?? [];
      const meta = data?.pagination ?? {};

      if (!Array.isArray(list)) {
        setDrugs([]);
        setPagination(p => ({ ...p, total: 0 }));
        return;
      }

      const mapped = list.map((item) => ({
        id: item.medicine_id,
        drug_name: item.name || 'Unknown',
        manufacturer: item.manufacturer || 'N/A',
        strength: item.strength || '',
        form: item.type || 'Tablet',
        price: Number(item.sale_price || item.price) || 0,
        stock: Number(item.stock) || 0,
        indication: item.purpose || item.indication || '',
        uses: item.uses || '',
        warnings: item.warnings || '',
        side_effects: item.side_effects || '',
        dosage: item.dosage || '',
      }));

      setDrugs(mapped);
      setPagination(p => ({
        ...p,
        total: meta.total_records ?? list.length ?? 0,
      }));
    } catch (err) {
      if (err.name === 'AbortError') return;
      const msg =
        err.response?.status === 401 ? ERROR_401 :
        err.response?.status === 403 ? ERROR_403 :
        err.response?.status === 429 ? ERROR_429 :
        err.response?.status === 500 ? ERROR_500 :
        err.response?.status === 503 ? ERROR_503 :
        err.response?.data?.message || "Failed to load price comparison";

      setError(msg);
      setDrugs([]);
      setPagination(p => ({ ...p, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  // EXACT SAME EFFECT AS EVERY OTHER FILE — DEBOUNCED + ABORTED = PERFECTION
  useEffect(() => {
    if (timer) clearTimeout(timer);
    if (controller) controller.abort();

    timer = setTimeout(() => {
      fetchDrugs();
    }, 300);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    filters.indication,
    pagination.page,
    pagination.page_size,
    selectedBranch,
    selectedChildVendorId
  ]);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(null), 5000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFilterChange = useCallback((name, value) => {
  if (name === "branch_id") {
    const isCurrentAccount = !value || value === currentVendorId;
    const childId = isCurrentAccount ? "" : value;
    const branchLabel = value
      ? branchOptions.find(opt => opt.value === value)?.label || 'Selected Branch'
      : 'Current Branch';

    setSelectedChildVendorId(childId);
    setSelectedValue(value || currentVendorId);
    setSelectedBranch(branchLabel);

    // REMOVED: selectBranch calls — keep branch selection local only
    setPagination(p => ({ ...p, page: 1 }));
  } else {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(p => ({ ...p, page: 1 }));
  }
}, [branchOptions, currentVendorId]); // also remove selectBranch from deps

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchDrugs();
  };

  const columns = useMemo(() => [
    {
      accessorKey: "drug_name",
      header: ({ column }) => <HeaderWithSort column={column} title="Medicine Name" />,
      cell: ({ row }) => <div className="font-medium">{row.original.drug_name}</div>,
    },
    {
      accessorKey: "manufacturer",
      header: ({ column }) => <HeaderWithSort column={column} title="Manufacturer" />,
      cell: ({ row }) => <div className="font-medium">{row.original.manufacturer}</div>,
    },
    {
      accessorKey: "strength",
      header: ({ column }) => <HeaderWithSort column={column} title="Strength" />,
      cell: ({ row }) => <div className="font-medium">{row.original.strength}</div>,
    },
    {
      accessorKey: "form",
      header: ({ column }) => <HeaderWithSort column={column} title="Form" />,
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.form}
        </span>
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => <HeaderWithSort column={column} title="Price (PKR)" />,
      cell: ({ row }) => (
        <div className="font-medium">₨ {row.original.price.toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "stock",
      header: ({ column }) => <HeaderWithSort column={column} title="Stock" />,
      cell: ({ row }) => {
        const stock = row.original.stock;
        const isLow = stock < 50;
        return <div className={`font-medium ${isLow ? 'text-red-600' : 'text-gray-700'}`}>{stock}</div>;
      },
    },
    {
      accessorKey: "uses",
      header: "Uses",
      cell: ({ row }) => <HoverTooltip text={row.original.uses} title="Uses" />,
    },
    {
      accessorKey: "warnings",
      header: "Warnings",
      cell: ({ row }) => <HoverTooltip text={row.original.warnings} title="Warnings" />,
    },
    {
      accessorKey: "side_effects",
      header: "Side Effects",
      cell: ({ row }) => <HoverTooltip text={row.original.side_effects} title="Side Effects" />,
    },
  ], []);

  const filterFields = useMemo(() => [
    {
      type: "text",
      name: "indication",
      label: "Indication",
      placeholder: "e.g. fever, pain, headache...",
      value: filters.indication || '',
      onChange: (e) => handleFilterChange("indication", e.target.value),
    },
    ...(isMaster && branchOptions.length > 0 ? [{
      type: "select",
      name: "branch_id",
      label: "Branch",
      value: selectedValue,
      onChange: (e) => handleFilterChange("branch_id", e.target.value),
      options: branchOptions,
    }] : []),
  ], [filters.indication, selectedValue, branchOptions, isMaster]);

  const exportEndpoint = useMemo(() => {
    return apiEndpoints.DrugPriceComparison(filters.indication?.trim() || "fever", 1, 1000);
  }, [filters.indication]);

  return (
    <div className="relative">
      <div className="absolute top-4 right-6 z-20 flex gap-2">
        {exportEndpoint && (
          <ExportReports
            endpoint={exportEndpoint}
            data={drugs}
            reportType={`Price Comparison - ${filters.indication || "All"}`}
            headers={columns.map(col => col.accessorKey)}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
          />
        )}
      </div>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-green-700 hover:text-green-900 font-bold text-xl">×</button>
        </div>
      )}

      <HomeTable
        title={dynamicTitle}
        data={drugs}
        columns={columns}
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
        pagination={{
          page: pagination.page,
          page_size: pagination.page_size,
          total: pagination.total || 0,
        }}  
        onPaginationChange={handlePaginationChange}
        addButtonName="COMPARE ANOTHER"
        addButtonPath="/admin-vendors/pharmacy-management/recommendation"
        hideDefaultActions
        loading={loading}
        serverSideFiltering={true}
        error={error}
        onRetry={handleRetry}
        noDataMessage={drugs.length === 0 && !loading && !error ? "No drugs found for this indication." : error}
      />
    </div>
  );
}