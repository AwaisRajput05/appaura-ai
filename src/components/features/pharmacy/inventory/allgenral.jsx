// AllGeneral.jsx — CLEANED WITH INVENTORY CONSTANTS - FULLY RESPONSIVE WITH DELETE
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from "react-dom";
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import { getToken } from '../../../../services/tokenUtils';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/endpoint/inventory/inventoryEnd';
import ExportReports from '../../../common/reports/ExportReports';
import { NO_RECORD_FOUND } from '../../../constants/Messages';
import { useAuth } from '../../../auth/hooks/useAuth';
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { INVENTORY_MODULE_CONSTANTS } from './inventoryconstants/inventoryModuleConstants';

// UI Components
import { Package, Edit2, Trash2, Loader2, X, AlertCircle } from 'lucide-react';
import Button from '../../../../components/ui/forms/Button';
import InputText from '../../../../components/ui/forms/InputText';
import Modal from '../../../../components/ui/Modal';
import Alert from '../../../../components/ui/feedback/Alert';
import Card from '../../../../components/ui/Card';

// HoverTooltip component - FIXED: Responsive
const HoverTooltipPacking = ({ children, preview, title = "Details" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hover, setHover] = useState(false);
  
  useEffect(() => {
    let openTimer, closeTimer;
    if (hover) {
      closeTimer = clearTimeout(closeTimer);
      openTimer = setTimeout(() => setIsOpen(true), 150);
    } else {
      openTimer = clearTimeout(openTimer);
      closeTimer = setTimeout(() => setIsOpen(false), 300);
    }
    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    };
  }, [hover]);
  
  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="text-blue-600 hover:underline cursor-help text-xs sm:text-sm"
      >
        {preview}
      </span>
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-none p-4">
            <Card 
              className="max-w-2xl max-h-[80vh] overflow-y-auto pointer-events-auto"
              title={title}
              titleClassName="text-center border-b pb-3"
            >
              <div className="p-4">
                {children}
              </div>
            </Card>
          </div>,
          document.body
        )}
    </div>
  );
};

export default function AllGeneral() {
  const { user } = useAuth();
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [productNameTerm, setProductNameTerm] = useState("");
  const [categoryTerm, setCategoryTerm] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedBranchesPayload, setSelectedBranchesPayload] = useState([]);

  // USE CONSTANTS
  const { vendorId: currentVendorId, branchId: originalBranchId, isMaster, businessName: currentBusinessName } = INVENTORY_MODULE_CONSTANTS.getUserInfo(user);
  const childVendors = useMemo(() => getVendorChildIds() || [], []);

  const fullBranchOptions = useMemo(() => {
    const options = INVENTORY_MODULE_CONSTANTS.getBranchOptionsWithAll(user, childVendors);
    return options;
  }, [childVendors, user]);

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
      if (controllerRef.current) controllerRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Dynamic title - FIXED: Responsive
  const dynamicTitle = useMemo(() => {
    const branchLabel = selectedBranch;
    const isCurrent = selectedBranch === currentBusinessName;
    const isAll = selectedBranch === 'All Branches';

    return (
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 pr-16 sm:pr-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Package className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 flex-shrink-0" />
          <span className="text-xl sm:text-2xl font-bold text-gray-800 truncate max-w-[200px] sm:max-w-full">
            General Stock
          </span>
        </div>
      </div>
    );
  }, [selectedBranch, currentBusinessName]);

  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

  const baseEndpoint = useMemo(() => apiEndpoints.searchGeneralProduct('', '').split('?')[0], []);

  const fetchProducts = async () => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token);
      
      const params = {
        product_name: productNameTerm.trim() || undefined,
        category: categoryTerm.trim() || undefined,
        page: pagination.page,
        page_size: pagination.page_size
      };

      const { data } = await apiService.post(baseEndpoint, selectedBranchesPayload, {
        headers,
        params,
        signal: controllerRef.current.signal,
        timeout: 15000
      });

      if (!isMountedRef.current) return;

      if (data.status === "success" && Array.isArray(data.data)) {
        const branchMap = new Map(childVendors.map(item => [item.vendor_id, item.business_name || item.branch_id]));
      const mapped = data.data.map((item) => ({
  id: `${item.product_id || item.id}_${item.batch_code || "nobatch"}`,
  product_id: item.product_id || item.id,
  vendor_id: item.vendor_id,
  branch_id: item.branch_id,
  product_name: item.product_name || "Unknown",
  generic_name: item.generic_name || "-",
  category: item.category || "-",
  manufacturer: item.manufacturer || "-",
  barcode: item.barcode || "-",
  batch_code: item.batch_code || "-",
  retail_price: Number(item.retail_price) || 0,
  sale_price: Number(item.sale_price) || 0,
  stock: Number(item.stock) || 0,
  expiry_date: INVENTORY_MODULE_CONSTANTS.formatDate(item.expiry_date, false), 
  expiry_date_raw: item.expiry_date ? item.expiry_date.split("T")[0] : "",
  unit_type: item.packing?.unit_type || "-",
  pack_size: item.packing?.pack_size || "",
  total_packs: Number(item.packing?.total_packs) || 0,
  product_size: item.packing?.product_size || "",
  product_model: item.packing?.product_model || "",
  location: item.location || "-",
  manufacture_date: INVENTORY_MODULE_CONSTANTS.formatDate(item.manufacture_date, false),
  manufacture_date_raw: item.manufacture_date ? item.manufacture_date.split("T")[0] : "", 
  added_date: INVENTORY_MODULE_CONSTANTS.formatDate(item.added_date, false), // FIXED
  availability: item.availability || "-",
  business_name: item.vendor_id === currentVendorId ? currentBusinessName : branchMap.get(item.vendor_id) || item.branch_id,
  packing: item.packing || {},
}));

        setProducts(mapped);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total_records ?? 0
        }));
      } else {
        setProducts([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      if (INVENTORY_MODULE_CONSTANTS.isAbortError(err)) return;
      setError(INVENTORY_MODULE_CONSTANTS.getErrorMessage(err));
      setProducts([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Debounced fetch
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (controllerRef.current) controllerRef.current.abort();

    timerRef.current = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [productNameTerm, categoryTerm, pagination.page, pagination.page_size, selectedBranchesPayload]);

  const handleFilterChange = useCallback((name, value) => {
    if (name === "product_name") {
      setProductNameTerm(value);
      setPagination(prev => ({ ...prev, page: 1 }));
    } else if (name === "category") {
      setCategoryTerm(value);
      setPagination(prev => ({ ...prev, page: 1 }));
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
            vendorId: item.vendor_id,
            branchId: item.branch_id
          });
        });
      } else {
        payloadArray = [{
          vendorId: value,
          branchId: selectedOption.branch_id
        }];
      }

      setSelectedBranchesPayload(payloadArray);
    }
  }, [fullBranchOptions, currentVendorId, originalBranchId, childVendors]);

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(prev => {
      const newPage = prev.page_size !== pageSize ? 1 : page;
      return { ...prev, page: newPage, page_size: pageSize };
    });
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchProducts();
  };

  const openEditModal = (product) => {
    setEditingProduct({
      ...product,
      packSize: product.pack_size ? product.pack_size.toString() : '',
      totalPacks: product.total_packs ? product.total_packs.toString() : '',
      productSize: product.product_size || '',
      productModel: product.product_model || '',
      unitType: product.unit_type || '',
      additionalStock: 0,
      newStock: product.stock,
    });
    setModalError("");
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setModalError("");
    setEditingProduct(null);
  };

  const openDeleteModal = (product) => {
    setDeletingProduct(product);
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteError("");
    setDeletingProduct(null);
    setDeleting(false);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();
    
    setSaving(true);
    setModalError("");

    try {
      const token = getToken();
      const updateData = {
        location: editingProduct.location?.trim() || "",
        stock: editingProduct.newStock,
      };

      const payload = {
        vendor_id: editingProduct.vendor_id,
        branch_id: editingProduct.branch_id,
        product_id: editingProduct.product_id,
        update_data: updateData,
      };

      const url = apiEndpoints.editGeneralProduct();
      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token);
      INVENTORY_MODULE_CONSTANTS.addBranchHeaders(headers, originalBranchId, editingProduct.vendor_id, currentVendorId);

      await apiService.patch(url, payload, {
        headers,
        signal: controllerRef.current.signal,
      });

      if (!isMountedRef.current) return;
      
      INVENTORY_MODULE_CONSTANTS.showSuccess(setSuccessMessage, "Product updated successfully!");
      closeEditModal();
      fetchProducts();
    } catch (err) {
      if (!isMountedRef.current) return;
      if (INVENTORY_MODULE_CONSTANTS.isAbortError(err)) return;
      setModalError(INVENTORY_MODULE_CONSTANTS.getErrorMessage(err));
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const token = getToken();
      
      // Use the delete-item endpoint with id, batchCode, and type=general
      const deleteUrl = apiEndpoints.deleteItem(
        deletingProduct.product_id.toString(),
        deletingProduct.batch_code,
        "general" // Always send type as "general"
      );

      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token);
      INVENTORY_MODULE_CONSTANTS.addBranchHeaders(headers, originalBranchId, deletingProduct.vendor_id, currentVendorId);

      await apiService.delete(deleteUrl, { headers });

      INVENTORY_MODULE_CONSTANTS.showSuccess(setSuccessMessage, "Product deleted successfully!");
      closeDeleteModal();
      fetchProducts();
    } catch (err) {
      setDeleteError(INVENTORY_MODULE_CONSTANTS.getErrorMessage(err) || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  const isAllBranches = selectedBranch === 'All Branches';

  // Helper functions for packing
  const isGeneralPacking = (packing) => packing && ('pack_size' in packing || 'total_packs' in packing || 'product_size' in packing || 'unit_type' in packing || 'product_model' in packing);

  const getPackagingPreview = (packing, unitType) => {
    if (!packing || Object.values(packing).every(val => val === 0 || val == null)) return "N/A";

    if (isGeneralPacking(packing)) {
      let preview = INVENTORY_MODULE_CONSTANTS.formatPacking(packing);
      if (preview === "—") return "N/A";
      if (preview.length > 10) {
        return preview.slice(0,7) + '...';
      }
      return preview;
    } else {
      return "Vie...";
    }
  };

  const getPackagingTable = (packing, unitType) => {
    let detailsContent;

    if (!packing || Object.values(packing).every(val => val === 0 || val == null || val === '')) {
      detailsContent = <p className="text-gray-500 text-xs sm:text-sm">No packaging details available.</p>;
    } else {
      const entries = Object.entries(packing)
        .filter(([key, val]) => key !== 'unit_type' && val != null && (typeof val === 'string' ? val.trim() !== '' : val !== 0));

      if (entries.length === 0) {
        detailsContent = <p className="text-gray-500 text-xs sm:text-sm">No detailed packaging info.</p>;
      } else {
        detailsContent = (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left text-gray-700">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 sm:px-4 py-2 font-bold">Field</th>
                  <th className="px-2 sm:px-4 py-2 font-bold">Value</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(([key, value]) => (
                  <tr key={key} className="border-b">
                    <td className="px-2 sm:px-4 py-2">{INVENTORY_MODULE_CONSTANTS.humanizeKey(key)}</td>
                    <td className="px-2 sm:px-4 py-2 font-medium">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    return (
      <>
        <div className="mb-4">
          <h4 className="font-semibold text-sm sm:text-base mb-2">Unit Type</h4>
          <p className="text-xs sm:text-sm text-gray-700">{unitType || "N/A"}</p>
        </div>
        {detailsContent}
      </>
    );
  };

  // Columns - FIXED: Responsive text sizes with delete button
  const columns = useMemo(() => {
    const baseColumns = [
      { 
        accessorKey: "product_name", 
        header: ({ column }) => <HeaderWithSort column={column} title="Product Name" />, 
        cell: ({ row }) => <div className="font-medium text-xs sm:text-sm">{row.original.product_name}</div>
      },
      { accessorKey: "category", header: "Category", cell: ({ row }) => <span className="font-medium text-xs sm:text-sm">{row.original.category}</span> },
      { accessorKey: "manufacturer", header: "Manufacturer", cell: ({ row }) => <span className="font-medium text-xs sm:text-sm">{row.original.manufacturer}</span> },
      { accessorKey: "batch_code", header: "Batch", cell: ({ row }) => <code className="font-medium text-xs sm:text-sm">{row.original.batch_code}</code> },
      { accessorKey: "sale_price", header: "Sale Price", cell: ({ row }) => <span className="font-medium text-xs sm:text-sm">₨ {row.original.sale_price.toFixed(2)}</span> },
      { accessorKey: "stock", header: "Stock", cell: ({ row }) => <span className={`font-medium text-xs sm:text-sm ${row.original.stock <= 10 ? 'text-red-600' : 'text-green-600'}`}>{row.original.stock}</span> },
      {
        accessorKey: "packing",
        header: "Packing",
        cell: ({ row }) => (
          <HoverTooltipPacking 
            preview={getPackagingPreview(row.original.packing, row.original.unit_type)} 
            title="Packaging Details"
          >
            {getPackagingTable(row.original.packing, row.original.unit_type)}
          </HoverTooltipPacking>
        ),
      },
      { accessorKey: "location", header: "Location", cell: ({ row }) => <span className="font-medium text-xs sm:text-sm">{row.original.location}</span> },
      { accessorKey: "manufacture_date", header: "Manufacture Date", cell: ({ row }) => <span className="font-medium text-xs sm:text-sm">{row.original.manufacture_date}</span> },
      { accessorKey: "expiry_date", header: "Expiry Date", cell: ({ row }) => <span className="font-medium text-xs sm:text-sm">{row.original.expiry_date}</span> },
      {
        accessorKey: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1"> {/* Minimal gap between buttons */}
            <Button
              onClick={() => openEditModal(row.original)}
              variant="icon"
              size="sm"
              title="Edit Product"
              aria-label="Edit Product"
              className="p-0.5"
            >
              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-700" />
            </Button>
            <Button
              onClick={() => openDeleteModal(row.original)}
              variant="icon"
              size="sm"
              title="Delete Product"
              aria-label="Delete Product"
              className="p-0.5"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
            </Button>
          </div>
        ),
      },
    ];

    if (isAllBranches) {
      baseColumns.splice(1, 0, {
        accessorKey: "business_name",
        header: "Branch",
        cell: ({ row }) => <span className="font-medium text-xs sm:text-sm">{row.original.business_name}</span>
      });
    }

    return baseColumns;
  }, [isAllBranches]);

  // Filter fields - FIXED: Responsive
  const filterFields = useMemo(() => [
    {
      type: "text",
      name: "product_name",
      label: "Product Name",
      placeholder: "Type product name...",
      value: productNameTerm,
      onChange: (e) => handleFilterChange("product_name", e.target.value),
      className: "w-full sm:w-auto",
    },
    {
      type: "text",
      name: "category",
      label: "Category",
      placeholder: "Type category...",
      value: categoryTerm,
      onChange: (e) => handleFilterChange("category", e.target.value),
      className: "w-full sm:w-auto",
    },
  ], [productNameTerm, categoryTerm, selectedValue, fullBranchOptions, isMaster]);

  const exportParams = useMemo(() => ({
    product_name: productNameTerm.trim() || undefined,
    category: categoryTerm.trim() || undefined,
    page: 1,
    page_size: 1000
  }), [productNameTerm, categoryTerm]);

  const exportBody = selectedBranchesPayload;

  return (
    <div className="relative">
     

      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          show={true}
          icon={true}
          onClose={() => setSuccessMessage(null)}
          className="mb-6 mx-2 sm:mx-4"
        />
      )}

      {error && (
        <Alert
          variant="error"
          message={error}
          show={true}
          icon={true}
          onClose={() => setError(null)}
          action={handleRetry}
          actionLabel="Retry"
          className="mb-6 mx-2 sm:mx-4"
        />
      )}

      <HomeTable
        title={dynamicTitle}
        data={products}
        columns={columns}
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
        loading={loading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        serverSideFiltering={true}
        error={error}
        onRetry={handleRetry}
        noDataMessage={products.length === 0 && !loading && !error ? NO_RECORD_FOUND : error}
        hideDefaultActions={true}
      />

      {/* EDIT MODAL - FIXED: Responsive */}
      <Modal
        isOpen={editModalOpen}
        onClose={closeEditModal}
        title="Edit Product"
        size="xl"
        className="max-h-[70vh] overflow-y-auto"
      >
        <div className="p-4 sm:p-6">
          {modalError && (
            <Alert
              variant="error"
              message={modalError}
              show={true}
              icon={true}
              className="mb-6"
            />
          )}

          {editingProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <InputText 
                label="Product ID" 
                value={editingProduct.product_id} 
                disabled 
                className="locked-input w-full"
                inputClassName="text-xs sm:text-sm font-mono"
              />
              <InputText 
                label="Product Name" 
                value={editingProduct.product_name} 
                disabled 
                className="locked-input w-full"
                inputClassName="text-xs sm:text-sm font-bold"
              />
              <InputText 
                label="Generic Name" 
                value={editingProduct.generic_name} 
                disabled 
                className="locked-input w-full"
                inputClassName="text-xs sm:text-sm"
              />
              <InputText 
                label="Category" 
                value={editingProduct.category} 
                disabled 
                className="locked-input w-full"
                inputClassName="text-xs sm:text-sm"
              />
              <InputText
                label="Manufacturer"
                value={editingProduct.manufacturer || ""}
                disabled
                className="locked-input w-full"
                inputClassName="text-xs sm:text-sm"
              />
              <InputText
                label="Barcode"
                value={editingProduct.barcode || ""}
                disabled
                className="locked-input w-full"
                inputClassName="text-xs sm:text-sm"
              />
              <InputText
                label="Batch Code"
                value={editingProduct.batch_code}
                disabled
                className="locked-input w-full"
                inputClassName="text-xs sm:text-sm"
              />
              <InputText
                label="Retail Price"
                type="number"
                value={editingProduct.retail_price}
                disabled
                className="locked-input w-full"
                inputClassName="text-xs sm:text-sm"
              />
              <InputText
                label="Sale Price"
                type="number"
                value={editingProduct.sale_price}
                disabled
                className="locked-input w-full"
                inputClassName="text-xs sm:text-sm"
              />
              <InputText
                label="Location"
                value={editingProduct.location}
                onChange={(e) => setEditingProduct(prev => ({ ...prev, location: e.target.value }))}
                maxLength={50}
                placeholder="e.g. A1"
                className="w-full"
                inputClassName="text-xs sm:text-sm"
              />
              <InputText 
                label="Manufacture Date" 
                type="date" 
value={editingProduct.manufacture_date_raw || ""}
                disabled 
                className="locked-input w-full"
                inputClassName="text-xs sm:text-sm"
              />
              <InputText 
                label="Expiry Date" 
                type="date" 
  value={editingProduct.expiry_date_raw || ""}              
    disabled 
                className="locked-input w-full"
                inputClassName="text-xs sm:text-sm"
              />
              <InputText 
                label="Created Date" 
                value={editingProduct.added_date} 
                disabled 
                className="locked-input w-full"
                inputClassName="text-xs sm:text-sm"
              />

              {/* Packing Section */}
              <div className="md:col-span-2">
                <h4 className="font-semibold text-sm sm:text-base mb-3">Packing Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputText
                    label="Product Size (e.g., 100g, 10ml)"
                    value={editingProduct.productSize || ""}
                    disabled
                    className="locked-input w-full"
                    inputClassName="text-xs sm:text-sm"
                  />
                  <InputText
                    label="Product Model (e.g., B567)"
                    value={editingProduct.productModel || ""}
                    disabled
                    className="locked-input w-full"
                    inputClassName="text-xs sm:text-sm"
                  />
                  <InputText
                    label="Unit Type"
                    value={editingProduct.unitType || ""}
                    disabled
                    className="locked-input w-full"
                    inputClassName="text-xs sm:text-sm"
                  />
                  {(editingProduct.unitType === 'Full pack item' || editingProduct.unitType === 'Pack item (soap)') && (
                    <InputText
                      label="Pack Size (number of pieces inside a pack)"
                      type="text"
                      value={editingProduct.packSize || ""}
                      disabled
                      className="locked-input w-full"
                      inputClassName="text-xs sm:text-sm"
                    />
                  )}
                </div>
              </div>

              <InputText
                label="Current Stock"
                type="number"
                value={editingProduct.stock}
                disabled
                className="locked-input w-full"
                inputClassName="text-xs sm:text-sm"
              />
              <InputText
                label="Additional Stock"
                type="number"
                min="0"
                value={editingProduct.additionalStock || 0}
                onChange={(e) => {
                  const additional = parseInt(e.target.value) || 0;
                  const newStock = editingProduct.stock + additional;
                  setEditingProduct(prev => ({ 
                    ...prev, 
                    additionalStock: additional,
                    newStock 
                  }));
                }}
                required
                placeholder="e.g. 100"
                className="w-full"
                inputClassName="text-xs sm:text-sm"
              />
              <InputText
                label="New Stock"
                type="number"
                value={editingProduct.newStock || 0}
                disabled
                className="bg-gray-100 cursor-not-allowed w-full"
                inputClassName="text-xs sm:text-sm"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 sm:mt-8">
            <Button
              onClick={closeEditModal}
              variant="secondary"
              className="w-full sm:w-auto text-sm sm:text-base py-2 px-6 sm:px-8"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving}
              loading={saving}
              loadingText="Saving..."
              variant="primary"
              className="w-full sm:w-auto text-sm sm:text-base py-2 px-6 sm:px-10"
            >
              Update Product
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        title="Delete Product"
        size="md"
      >
        <div className="p-4 sm:p-6">
          {deleteError && (
            <Alert
              variant="error"
              message={deleteError}
              show={true}
              icon={true}
              className="mb-6"
            />
          )}

          <div className="flex items-center justify-center mb-4 text-red-600">
            <AlertCircle className="w-12 h-12" />
          </div>
          
          <p className="text-center text-gray-700 mb-4">
            Are you sure you want to delete this product?
          </p>
          
          {deletingProduct && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm mb-1">
                <span className="font-semibold">Product:</span> {deletingProduct.product_name}
              </p>
              <p className="text-sm mb-1">
                <span className="font-semibold">Batch Code:</span> {deletingProduct.batch_code}
              </p>
              <p className="text-sm mb-1">
                <span className="font-semibold">Category:</span> {deletingProduct.category}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Current Stock:</span> {deletingProduct.stock}
              </p>
            </div>
          )}
          
          <p className="text-center text-sm text-red-600 font-medium mb-6">
            This action cannot be undone!
          </p>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <Button
              onClick={closeDeleteModal}
              variant="secondary"
              className="w-full sm:w-auto text-sm sm:text-base py-2 px-6"
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              loading={deleting}
              loadingText="Deleting..."
              variant="danger"
              className="w-full sm:w-auto text-sm sm:text-base py-2 px-6 bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}