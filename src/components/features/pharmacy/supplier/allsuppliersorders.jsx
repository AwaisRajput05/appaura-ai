// allsuppliersorders.jsx — WITH PROPER DATA HANDLING AND DELETE FUNCTIONALITY - FULLY RESPONSIVE
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import HomeTable from "../../../common/table/Table";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from '../../../../services/apiEndpoints';
import ExportReports from "../../../common/reports/ExportReports";
import { useAuth } from "../../../auth/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { Eye, Search, Trash2, XCircle } from 'lucide-react';

// Import UI components
import Button from "../../../../components/ui/forms/Button";
import InputText from "../../../../components/ui/forms/InputText";
import InputSelect from "../../../../components/ui/forms/InputSelect";
import ButtonTooltip from "../../../../components/ui/forms/ButtonTooltip";
import Alert from "../../../../components/ui/feedback/Alert";
import Card from "../../../../components/ui/Card";
import Loader from "../../../../components/ui/Loader";
import ConfirmDialog from "../../../../components/ui/feedback/ConfirmDialog";

// Import constants
import SUPPLIER_MODULE_CONSTANTS from "./supplierconstants/supplierModuleConstants";

// Destructure constants
const { 
  UI, 
  DEFAULTS, 
  TOOLTIP_TITLES,
  getAuthHeaders,
  getUserInfo,
  getErrorMessage,
  getBranchOptions,
  formatDate,     
  getBranchInfo,
  calculateTotalValue,
  formatDisplayDate,
  formatDisplayDateTime,
  getOrderFilterFields
} = SUPPLIER_MODULE_CONSTANTS;

// Medicine Details Tooltip - FIXED: Responsive
const MedicineHoverTooltip = ({ medicines = [], supplier_name }) => {
  const actualPreview = medicines.length > 0 ? `${medicines.length} items` : DEFAULTS.DASH;
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef(null);
  
  let content;
  if (medicines.length > 0) {
    content = (
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-2 sm:px-4 py-2 border-b font-bold text-gray-800">{UI.MEDICINE_NAME}</th>
            <th className="px-2 sm:px-4 py-2 border-b font-bold text-gray-800">{UI.QUANTITY}</th>
            <th className="px-2 sm:px-4 py-2 border-b font-bold text-gray-800">{UI.UNIT_PRICE}</th>
            <th className="px-2 sm:px-4 py-2 border-b font-bold text-gray-800">{UI.TOTAL_PRICE}</th>
            <th className="px-2 sm:px-4 py-2 border-b font-bold text-gray-800">{UI.NOTES}</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((medicine, index) => {
            const total = (medicine.quantity || 0) * (medicine.unit_price || 0);
            return (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-2 sm:px-4 py-2 border-b text-gray-900 text-xs sm:text-sm">{medicine.name}</td>
                <td className="px-2 sm:px-4 py-2 border-b text-gray-900 text-xs sm:text-sm">{medicine.quantity}</td>
                <td className="px-2 sm:px-4 py-2 border-b text-gray-900 text-xs sm:text-sm">₨ {medicine.unit_price?.toFixed(2)}</td>
                <td className="px-2 sm:px-4 py-2 border-b text-gray-900 text-xs sm:text-sm">₨ {total.toFixed(2)}</td>
                <td className="px-2 sm:px-4 py-2 border-b text-gray-900 text-xs sm:text-sm">{medicine.notes || DEFAULTS.DASH}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-100">
          <tr>
            <td colSpan="3" className="px-2 sm:px-4 py-2 text-right font-bold text-gray-700 text-xs sm:text-sm">{UI.TOTAL_PRICE}:</td>
            <td className="px-2 sm:px-4 py-2 font-bold text-purple-600 text-xs sm:text-sm">₨ {calculateTotalValue(medicines).toFixed(2)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    );
  } else {
    content = <span className="text-gray-600 text-xs sm:text-sm">{actualPreview}</span>;
  }

  const open = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const close = () => {
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const tooltipTitle = supplier_name ? `Items from Order - ${supplier_name}` : TOOLTIP_TITLES.ORDER_ITEMS;

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={open}
        onMouseLeave={close}
        className="text-blue-600 hover:underline cursor-help text-xs sm:text-sm font-medium"
      >
        {actualPreview}
      </span>

      {isOpen && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-none p-4">
          <div
            onMouseEnter={open}
            onMouseLeave={close}
            className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-300 max-w-4xl max-h-[80vh] overflow-y-auto pointer-events-auto"
          >
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-center text-gray-800 border-b pb-2 sm:pb-3">
              {tooltipTitle}
            </h3>
            <div className="overflow-x-auto">
              {content}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default function AllSupplierOrder() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchTimeoutRef = useRef(null);
  const controllerRef = useRef(null);
  const successTimeoutRef = useRef(null);

  const [summaryData, setSummaryData] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    searchText: "",           // Supplier Name search
    status: "",
    createdAfter: "",
    createdBefore: "",
    deliveryAfter: "",        // Expected Date after
    deliveryBefore: "",       // Expected Date before
    nextVisitAfter: "",
    nextVisitBefore: ""
  });

  const [detailData, setDetailData] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedBranchValue, setSelectedBranchValue] = useState("");

  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 'order' or 'medicine'
  const [deleting, setDeleting] = useState(false);

  const [paginationSummary, setPaginationSummary] = useState({
    page: DEFAULTS.PAGE,
    page_size: DEFAULTS.PAGE_SIZE,
    total: 0,
  });
  const [paginationDetail, setPaginationDetail] = useState({
    page: DEFAULTS.PAGE,
    page_size: DEFAULTS.PAGE_SIZE,
    total: 0,
  });

  const userInfo = useMemo(() => getUserInfo(user), [user]);
  const childVendors = useMemo(() => getVendorChildIds() || [], []);
  
  const branchOptions = useMemo(() => 
    getBranchOptions(userInfo.currentVendorId, userInfo.currentBusinessName, childVendors), 
    [userInfo.currentVendorId, userInfo.currentBusinessName, childVendors]
  );

  // Status options
  const statusOptions = useMemo(() => [
    { value: "", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" }
  ], []);

  useEffect(() => {
    const vendorId = user?.currentBranch?.vendorId || "";
    const initialValue = vendorId || userInfo.currentVendorId;
    setSelectedBranchValue(initialValue);
  }, [user?.currentBranch, userInfo.currentVendorId]);

  useEffect(() => {
    if (location.state?.message) {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      
      setSuccessMessage(location.state.message);
      
      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage(null);
        successTimeoutRef.current = null;
      }, DEFAULTS.SUCCESS_TIMEOUT);
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchSummary = useCallback(async () => {
    if (selectedOrder) return;

    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();

    try {
      setLoadingSummary(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setLoadingSummary(false);
        return;
      }

      const endpoint = apiEndpoints.supplierOrder;
      const headers = getAuthHeaders(token);
      
      let branchId = userInfo.originalBranchId;
      if (selectedBranchValue && selectedBranchValue !== userInfo.currentVendorId) {
        const child = childVendors.find(v => v.vendor_id === selectedBranchValue);
        if (child) {
          branchId = child.branch_id;
          headers['X-Child-ID'] = selectedBranchValue;
        }
      }
      headers['X-User-Branch-ID'] = branchId;

      const params = new URLSearchParams();
      params.append("page", paginationSummary.page);
      params.append("page_size", paginationSummary.page_size);
      
      // Add filters
      if (filters.searchText.trim()) {
        params.append("searchText", filters.searchText.trim()); // Supplier Name search
      }
      
      if (filters.status) {
        params.append("status", filters.status);
      }
      
      if (filters.createdAfter) {
        params.append("createdAfter", filters.createdAfter);
      }
      
      if (filters.createdBefore) {
        params.append("createdBefore", filters.createdBefore);
      }
      
      if (filters.deliveryAfter) {
        params.append("deliveryAfter", filters.deliveryAfter);
      }
      
      if (filters.deliveryBefore) {
        params.append("deliveryBefore", filters.deliveryBefore);
      }
      
      if (filters.nextVisitAfter) {
        params.append("nextVisitAfter", filters.nextVisitAfter);
      }
      
      if (filters.nextVisitBefore) {
        params.append("nextVisitBefore", filters.nextVisitBefore);
      }

      const { data } = await apiService.get(`${endpoint}?${params.toString()}`, { 
        headers, 
        signal: controllerRef.current.signal,
        timeout: DEFAULTS.API_TIMEOUT 
      });

      const rawData = data?.data ?? [];
      const pag = data?.pagination ?? {};

      if (!Array.isArray(rawData)) {
        setSummaryData([]);
        setPaginationSummary(p => ({ ...p, total: 0 }));
        return;
      }

     const mapped = rawData.map((order) => ({
  id: order.order_id || `${order.supplier_ref}-${Date.now()}`,
  order_id: order.order_id,
  supplier_id: order.supplier_id,
  supplier_ref: order.supplier_ref || DEFAULTS.NOT_AVAILABLE,
  supplier_company: order.supplier_company_name || DEFAULTS.NOT_AVAILABLE,
  supplier_name: order.supplier_name || DEFAULTS.NOT_AVAILABLE,
  status: order.status || DEFAULTS.NOT_AVAILABLE,
  notes: order.notes || DEFAULTS.DASH,
  // FIXED: Use formatDate with proper parameters
  created_date: order.created_date ? formatDate(order.created_date, true) : DEFAULTS.NOT_AVAILABLE,
  last_updated: order.last_updated ? formatDate(order.last_updated, true) : DEFAULTS.NOT_AVAILABLE,
  expected_delivery_date: order.expected_delivery_date ? formatDate(order.expected_delivery_date, false) : DEFAULTS.NOT_AVAILABLE,
  next_visit_date: order.next_visit_date ? formatDate(order.next_visit_date, false) : DEFAULTS.NOT_AVAILABLE,
}));

      setSummaryData(mapped);
      setPaginationSummary(p => ({
        ...p,
        total: pag.total_records ?? rawData.length ?? 0,
      }));
    } catch (err) {
      if (err.name === 'AbortError') return;
      
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        const validationError = err.response.data.detail[0];
        if (validationError && validationError.msg) {
          setError(validationError.msg);
        } else {
          setError(UI.FETCH_FAILED);
        }
      } else {
        setError(getErrorMessage(err) || UI.FETCH_FAILED);
      }
      
      setSummaryData([]);
      setPaginationSummary(p => ({ ...p, total: 0 }));
    } finally {
      setLoadingSummary(false);
    }
  }, [filters, paginationSummary.page, paginationSummary.page_size, selectedBranchValue, selectedOrder, userInfo.currentVendorId, userInfo.originalBranchId, childVendors]);

  const fetchDetail = useCallback(async () => {
    if (!selectedOrder) return;

    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();

    try {
      setLoadingDetail(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setLoadingDetail(false);
        return;
      }

      const endpoint = apiEndpoints.supplierOrder;
      const headers = getAuthHeaders(token);

      let branchId = userInfo.originalBranchId;
      if (selectedBranch && selectedBranch.vendor_id && selectedBranch.vendor_id !== userInfo.currentVendorId) {
        headers['X-Child-ID'] = selectedBranch.vendor_id;
        const child = childVendors.find(v => v.vendor_id === selectedBranch.vendor_id);
        branchId = selectedBranch.branch_id || child?.branch_id || "";
      }
      headers['X-User-Branch-ID'] = branchId;

      const params = new URLSearchParams();
      params.append("orderId", selectedOrder.order_id);
      params.append("itemsOnly", "True");
      params.append("page", paginationDetail.page);
      params.append("page_size", paginationDetail.page_size);

      const { data } = await apiService.get(`${endpoint}?${params.toString()}`, { 
        headers, 
        signal: controllerRef.current.signal,
        timeout: DEFAULTS.API_TIMEOUT 
      });

      const items = data?.data ?? [];
      
      const mapped = items.map((item, index) => ({
        id: item.medicine_id || `${item.name}-${index}`,
        medicine_id: item.medicine_id,
        name: item.name || DEFAULTS.NOT_AVAILABLE,
        quantity: item.quantity || 0,
        unit_price: Number(item.unit_price) || 0,
        total_price: (item.quantity || 0) * (Number(item.unit_price) || 0),
        notes: item.notes || DEFAULTS.DASH,
      }));

      setDetailData(mapped);
      setPaginationDetail(p => ({ 
        ...p, 
        total: data?.pagination?.total_records || mapped.length 
      }));
    } catch (err) {
      if (err.name === 'AbortError') return;
      
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        const validationError = err.response.data.detail[0];
        if (validationError && validationError.msg) {
          setError(validationError.msg);
        } else {
          setError(UI.FETCH_FAILED);
        }
      } else {
        setError(getErrorMessage(err));
      }
      
      setDetailData([]);
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedOrder, selectedBranch, paginationDetail.page, paginationDetail.page_size, userInfo.currentVendorId, userInfo.originalBranchId, childVendors]);

  // Delete order function
  const deleteOrder = useCallback(async (supplierId, orderId) => {
    if (!supplierId || !orderId) return;

    try {
      setDeleting(true);
      setError(null);

      const token = getToken();
      if (!token) return;

      const endpoint = apiEndpoints.deleteOrder(supplierId, orderId);
      const headers = getAuthHeaders(token);

      // Add branch headers
      let branchId = userInfo.originalBranchId;
      if (selectedBranchValue && selectedBranchValue !== userInfo.currentVendorId) {
        const child = childVendors.find(v => v.vendor_id === selectedBranchValue);
        if (child) {
          branchId = child.branch_id;
          headers['X-Child-ID'] = selectedBranchValue;
        }
      }
      headers['X-User-Branch-ID'] = branchId;

      await apiService.delete(endpoint, { headers });

      setSuccessMessage("Order deleted successfully");
      
      // Refresh the summary data
      fetchSummary();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to delete order");
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setDeleteItem(null);
      setDeleteType(null);
    }
  }, [selectedBranchValue, userInfo.originalBranchId, userInfo.currentVendorId, childVendors, fetchSummary]);

  // Delete medicine function
  const deleteMedicine = useCallback(async (supplierId, orderId, medicineId) => {
    if (!supplierId || !orderId || !medicineId) return;

    try {
      setDeleting(true);
      setError(null);

      const token = getToken();
      if (!token) return;

      const endpoint = apiEndpoints.deleteOrderMedicine(supplierId, orderId, medicineId);
      const headers = getAuthHeaders(token);

      // Add branch headers
      let branchId = userInfo.originalBranchId;
      if (selectedBranch && selectedBranch.vendor_id && selectedBranch.vendor_id !== userInfo.currentVendorId) {
        headers['X-Child-ID'] = selectedBranch.vendor_id;
        const child = childVendors.find(v => v.vendor_id === selectedBranch.vendor_id);
        branchId = selectedBranch.branch_id || child?.branch_id || "";
      }
      headers['X-User-Branch-ID'] = branchId;

      await apiService.delete(endpoint, { headers });

      setSuccessMessage("Medicine deleted successfully");
      
      // Refresh the detail data
      fetchDetail();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to delete medicine");
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setDeleteItem(null);
      setDeleteType(null);
    }
  }, [selectedBranch, userInfo.originalBranchId, userInfo.currentVendorId, childVendors, fetchDetail]);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((type, item) => {
    setDeleteType(type);
    setDeleteItem(item);
    setDeleteConfirmOpen(true);
  }, []);

  // Confirm delete
  const handleConfirmDelete = useCallback(() => {
    if (!deleteItem) return;

    if (deleteType === 'order') {
      deleteOrder(deleteItem.supplier_id, deleteItem.order_id);
    } else if (deleteType === 'medicine') {
      deleteMedicine(deleteItem.supplier_id, selectedOrder?.order_id, deleteItem.medicine_id);
    }
  }, [deleteItem, deleteType, selectedOrder, deleteOrder, deleteMedicine]);

  // Dynamic title - FIXED: Responsive
  const dynamicTitle = useMemo(() => {
    const branchLabel = selectedBranchValue === userInfo.currentVendorId 
      ? userInfo.currentBusinessName 
      : branchOptions.find(opt => opt.value === selectedBranchValue)?.label || UI.ALL_BRANCHES;
    const isMainBranch = selectedBranchValue === userInfo.currentVendorId || !selectedBranchValue;

    return (
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 pr-16 sm:pr-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-xl sm:text-2xl font-bold text-gray-800">{UI.ALL_SUPPLIER_ORDERS}</span>
        </div>
        <span className="hidden sm:inline text-gray-500">—</span>
        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm w-fit ${
          isMainBranch
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-blue-100 text-blue-800 border border-blue-300'
        }`}>
          {branchLabel}
        </span>
      </div>
    );
  }, [selectedBranchValue, userInfo.currentVendorId, userInfo.currentBusinessName, branchOptions]);

  useEffect(() => {
    if (selectedOrder) return;

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      fetchSummary();
    }, DEFAULTS.SEARCH_DEBOUNCE);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [selectedOrder, filters, paginationSummary.page, paginationSummary.page_size, selectedBranchValue, fetchSummary]);

  useEffect(() => {
    if (selectedOrder) {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      fetchDetail();
    }
  }, [selectedOrder, paginationDetail.page, paginationDetail.page_size, fetchDetail]);

  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleFilterChange = useCallback((name, value) => {
    if (name === "branch") {
      setSelectedBranchValue(value || "");
      setPaginationSummary(p => ({ ...p, page: DEFAULTS.PAGE }));
      return;
    }
    
    // Handle all filter fields
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPaginationSummary(p => ({ ...p, page: DEFAULTS.PAGE }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      searchText: "",
      status: "",
      createdAfter: "",
      createdBefore: "",
      deliveryAfter: "",
      deliveryBefore: "",
      nextVisitAfter: "",
      nextVisitBefore: ""
    });
    setPaginationSummary(p => ({ ...p, page: DEFAULTS.PAGE }));
  }, []);

  const handleViewClick = useCallback((row) => {
    const order = row.original;
    
    const branchInfo = getBranchInfo(selectedBranchValue, userInfo, childVendors);
    
    setSelectedOrder(order);
    setSelectedBranch(branchInfo);
    setPaginationDetail({ page: DEFAULTS.PAGE, page_size: DEFAULTS.PAGE_SIZE, total: 0 });
  }, [selectedBranchValue, userInfo, childVendors]);

  const handleBack = useCallback(() => {
    setSelectedOrder(null);
    setSelectedBranch(null);
    setDetailData([]);
    setPaginationDetail({ page: DEFAULTS.PAGE, page_size: DEFAULTS.PAGE_SIZE, total: 0 });
  }, []);

  const handlePaginationSummary = useCallback((page, pageSize) => {
    setPaginationSummary(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handlePaginationDetail = useCallback((page, pageSize) => {
    setPaginationDetail(p => ({ ...p, page, page_size: pageSize }));
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    if (selectedOrder) fetchDetail();
    else fetchSummary();
  }, [selectedOrder, fetchDetail, fetchSummary]);

  const handlePageRefresh = useCallback(() => {
    if (selectedOrder) {
      fetchDetail();
    } else {
      fetchSummary();
    }
  }, [selectedOrder, fetchDetail, fetchSummary]);

 // Filter fields - Added the 5 requested filters with date ranges in single lines
const summaryFilterFields = useMemo(() => {
  const fields = [];
  
  // Supplier Name filter (using searchText)
  fields.push({
    type: "text",
    name: "searchText",
    label: "Supplier Name",
    placeholder: "Search by supplier name...",
    value: filters.searchText,
    onChange: (e) => handleFilterChange("searchText", e.target.value),
    className: "w-full sm:w-auto",
  });
  
  // Status filter
  fields.push({
    type: "select",
    name: "status",
    label: "Status",
    placeholder: "All Status",
    value: filters.status,
    onChange: (e) => handleFilterChange("status", e.target.value),
    options: statusOptions,
    className: "w-full sm:w-auto",
  });
  
  // Created Date range (single line)
  fields.push({
    type: "dateRange",
    label: "Created Date",
    fromName: "createdAfter",
    toName: "createdBefore",
    value: { 
      createdAfter: filters.createdAfter, 
      createdBefore: filters.createdBefore 
    },
    onChange: (e) => handleFilterChange(e.target.name, e.target.value),
    className: "w-full sm:w-auto",
  });
  
  // Expected Delivery Date range (single line)
  fields.push({
    type: "dateRange",
    label: "Expected Date",
    fromName: "deliveryAfter",
    toName: "deliveryBefore",
    value: { 
      deliveryAfter: filters.deliveryAfter, 
      deliveryBefore: filters.deliveryBefore 
    },
    onChange: (e) => handleFilterChange(e.target.name, e.target.value),
    className: "w-full sm:w-auto",
  });
  
  // Next Visit Date range (single line)
  fields.push({
    type: "dateRange",
    label: "Next Visit",
    fromName: "nextVisitAfter",
    toName: "nextVisitBefore",
    value: { 
      nextVisitAfter: filters.nextVisitAfter, 
      nextVisitBefore: filters.nextVisitBefore 
    },
    onChange: (e) => handleFilterChange(e.target.name, e.target.value),
    className: "w-full sm:w-auto",
  });
  
  // Branch field for master users
  if (userInfo.isMaster && branchOptions.length > 0) {
    fields.push({
      type: "select",
      name: "branch",
      label: UI.BRANCH,
      placeholder: UI.SELECT_BRANCH,
      value: selectedBranchValue,
      onChange: (e) => handleFilterChange("branch", e.target.value),
      options: branchOptions,
      className: "w-full sm:w-auto",
    });
  }
  
  // Clear filters button
  fields.push({
    type: "custom",
    name: "clearFilters",
    component: (
      <Button
        key="clear-filters"
        variant="secondary"
        size="sm"
        onClick={handleClearFilters}
        className="w-full sm:w-auto mt-2 sm:mt-0"
      >
        Clear Filters
      </Button>
    )
  });
  
  return fields;
}, [filters, selectedBranchValue, handleFilterChange, handleClearFilters, userInfo.isMaster, branchOptions, statusOptions]);

  // Summary columns - FIXED: Responsive text sizes
  const summaryColumns = useMemo(() => [
    {
      accessorKey: "supplier_name",
      header: ({ column }) => <HeaderWithSort column={column} title={UI.SUPPLIER_NAME} />,
      cell: ({ row }) => <div className="font-medium text-gray-900 text-xs sm:text-sm">{row.original.supplier_name}</div>,
    },
    {
      accessorKey: "supplier_company",
      header: ({ column }) => <HeaderWithSort column={column} title={UI.COMPANY_NAME} />,
      cell: ({ row }) => <div className="font-medium text-gray-900 text-xs sm:text-sm">{row.original.supplier_company}</div>,
    },
    {
      accessorKey: "order_id",
      header: ({ column }) => <HeaderWithSort column={column} title={UI.ORDER_ID} />,
      cell: ({ row }) => <div className="font-medium text-gray-900 text-xs sm:text-sm">{row.original.order_id}</div>,
    },
    {
      accessorKey: "supplier_ref",
      header: ({ column }) => <HeaderWithSort column={column} title={UI.SUPPLIER_REF} />,
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.supplier_ref}</div>,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <HeaderWithSort column={column} title={UI.STATUS} />,
      cell: ({ row }) => {
        const status = row.original.status;
        let bgColor = "bg-gray-100 text-gray-800";
        
        if (status === "pending") bgColor = "bg-yellow-100 text-yellow-800";
        else if (status === "completed") bgColor = "bg-green-100 text-green-800";
        else if (status === "cancelled") bgColor = "bg-red-100 text-red-800";
        else if (status === "processing") bgColor = "bg-blue-100 text-blue-800";
        else if (status === "shipped") bgColor = "bg-purple-100 text-purple-800";
        else if (status === "delivered") bgColor = "bg-green-100 text-green-800";
        
        return (
          <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${bgColor}`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "created_date",
      header: ({ column }) => <HeaderWithSort column={column} title={UI.CREATED_DATE} />,
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.created_date}</div>,
    },
    {
      accessorKey: "expected_delivery_date",
      header: UI.EXPECTED_DELIVERY,
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.expected_delivery_date}</div>,
    },
    {
      accessorKey: "next_visit_date",
      header: UI.NEXT_VISIT,
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.next_visit_date}</div>,
    },
    {
      accessorKey: "notes",
      header: UI.NOTES,
      cell: ({ row }) => <div className="text-xs sm:text-sm max-w-[80px] sm:max-w-xs truncate">{row.original.notes}</div>,
    },
    {
      accessorKey: "View",
      header: () => <div className="text-center text-xs sm:text-sm">{UI.ACTIONS}</div>,
      cell: ({ row }) => (
        <div className="flex justify-center gap-1 sm:gap-2">
          <ButtonTooltip tooltipText={UI.VIEW_ORDER_ITEMS} position="top">
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleViewClick(row);
              }}
              className="p-1 sm:p-2"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </ButtonTooltip>
          
          <ButtonTooltip tooltipText={UI.DELETE_ORDER} position="top">
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteClick('order', row.original);
              }}
              className="p-1 sm:p-2"
              disabled={deleting}
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </ButtonTooltip>
        </div>
      ),
      enableSorting: false,
    },
  ], [handleViewClick, handleDeleteClick, deleting]);

  // Detail columns - FIXED: Responsive
  const detailColumns = useMemo(() => [
    { 
      accessorKey: "name", 
      header: ({ column }) => <HeaderWithSort column={column} title={UI.MEDICINE_NAME} />, 
      cell: ({ row }) => <div className="font-bold text-blue-700 text-xs sm:text-sm">{row.original.name}</div> 
    },
    { 
      accessorKey: "medicine_id", 
      header: UI.MEDICINE_ID, 
      cell: ({ row }) => <div className="text-[10px] sm:text-xs font-mono">{row.original.medicine_id}</div>
    },
    { 
      accessorKey: "quantity", 
      header: ({ column }) => <HeaderWithSort column={column} title={UI.QUANTITY} />, 
      cell: ({ row }) => <div className="font-bold text-xs sm:text-sm">{row.original.quantity}</div> 
    },
    { 
      accessorKey: "unit_price", 
      header: ({ column }) => <HeaderWithSort column={column} title={UI.UNIT_PRICE} />, 
      cell: ({ row }) => <div className="font-bold text-green-600 text-xs sm:text-sm">₨ {row.original.unit_price.toFixed(2)}</div> 
    },
    { 
      accessorKey: "total_price", 
      header: ({ column }) => <HeaderWithSort column={column} title={UI.TOTAL_PRICE} />, 
      cell: ({ row }) => <div className="font-bold text-purple-600 text-xs sm:text-sm">₨ {row.original.total_price.toFixed(2)}</div> 
    },
    { 
      accessorKey: "notes", 
      header: UI.NOTES, 
      cell: ({ row }) => <div className="text-xs sm:text-sm max-w-[80px] sm:max-w-xs truncate">{row.original.notes}</div> 
    },
    {
      accessorKey: "actions",
      header: () => <div className="text-center text-xs sm:text-sm">{UI.ACTIONS}</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <ButtonTooltip tooltipText={UI.DELETE_MEDICINE} position="top">
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteClick('medicine', {
                  ...row.original,
                  supplier_id: selectedOrder?.supplier_id
                });
              }}
              className="p-1 sm:p-2"
              disabled={deleting}
            >
              <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </ButtonTooltip>
        </div>
      ),
      enableSorting: false,
    },
  ], [handleDeleteClick, selectedOrder, deleting]);

  const exportEndpoint = useMemo(() => {
    if (!selectedOrder) return null;
    
    const params = new URLSearchParams();
    params.append("orderId", selectedOrder.order_id);
    params.append("itemsOnly", "True");
    
    return `${apiEndpoints.supplierOrder}?${params.toString()}`;
  }, [selectedOrder]);

  return (
    <div className="relative">

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteItem(null);
          setDeleteType(null);
        }}
        onConfirm={handleConfirmDelete}
        title={deleteType === 'order' ? UI.DELETE_ORDER_TITLE : UI.DELETE_MEDICINE_TITLE}
        message={
          deleteType === 'order'
            ? `Are you sure you want to delete order #${deleteItem?.order_id}? This action cannot be undone.`
            : `Are you sure you want to delete ${deleteItem?.name} from this order? This action cannot be undone.`
        }
        confirmText={UI.DELETE}
        cancelText={UI.CANCEL}
        confirmVariant="danger"
        loading={deleting}
      />

      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          className="mb-4 mx-2 sm:mx-4"
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {error && (
        <Alert
          variant="error"
          message={error}
          action={handleRetry}
          actionLabel={UI.RETRY}
          onClose={() => setError(null)}
          className="mb-4 mx-2 sm:mx-4"
        />
      )}

      {selectedOrder ? (
        <>
          {/* DETAIL VIEW */}
          <div className="mb-6 px-2 sm:px-4">
            <Button
              variant="secondary"
              onClick={handleBack}
              className="inline-flex items-center gap-2 w-full sm:w-auto"
            >
              <span>←</span>
              <span className="hidden sm:inline">{UI.BACK_TO_ORDERS}</span>
            </Button>
          </div>

          <Card className="mb-6 mx-2 sm:mx-4" bodyClassName="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">{UI.ORDER_ITEMS}</h2>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {UI.ORDER_ID}: <span className="font-semibold text-green-700">
                      {selectedOrder.order_id}
                    </span>
                    <span className="ml-2 sm:ml-4">
                      {UI.SUPPLIER_REF}: <span className="font-semibold text-blue-700">
                        {selectedOrder.supplier_ref}
                      </span>
                    </span>
                  </p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
  {UI.STATUS}: <span className="font-semibold">{selectedOrder.status}</span> | 
  {UI.EXPECTED_DELIVERY}: {formatDate(selectedOrder.expected_delivery_date, false)} |
  {UI.NEXT_VISIT}: {formatDate(selectedOrder.next_visit_date, false)}
</p>
                  {selectedOrder.notes && (
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                      {UI.NOTES}: {selectedOrder.notes}
                    </p>
                  )}
                  {selectedBranch && (
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                      {UI.BRANCH}: {selectedBranch.business_name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <div className="text-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 whitespace-nowrap">{UI.TOTAL_ITEMS}</p>
                  <p className="text-base sm:text-xl font-bold text-blue-800">{paginationDetail.total}</p>
                </div>
              </div>
            </div>
          </Card>

          <HomeTable
            title={UI.ORDER_ITEMS}
            data={detailData}
            columns={detailColumns}
            loading={loadingDetail}
            pagination={paginationDetail}
            onPaginationChange={handlePaginationDetail}
            serverSideFiltering={true}
            error={error}
            onRetry={handleRetry}
            hideDefaultActions
            noDataMessage={UI.NO_ITEMS}
          />
        </>
      ) : (
        <>
          {/* SUMMARY VIEW */}
          <Card className="mb-6 mx-2 sm:mx-4" bodyClassName="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
              {dynamicTitle}
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handlePageRefresh}
                  loading={loadingSummary}
                  loadingText={UI.REFRESHING}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base px-4 py-2"
                >
                  <span className="hidden sm:inline">{UI.REFRESH}</span>
                  <span className="sm:hidden">↻</span>
                </Button>
              </div>
            </div>
          </Card>

          <HomeTable
            data={summaryData}
            columns={summaryColumns}
            loading={loadingSummary}
            pagination={paginationSummary}
            onPaginationChange={handlePaginationSummary}
            filterFields={summaryFilterFields}
            onFilterChange={handleFilterChange}
            serverSideFiltering={true}
            error={error}
            onRetry={handleRetry}
            hideDefaultActions
            noDataMessage={UI.NO_ORDERS}
          />
        </>
      )}
    </div>
  );
}