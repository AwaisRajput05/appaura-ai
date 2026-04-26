// DrugStock.jsx — REFACTORED WITH INVENTORY CONSTANTS
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import HomeTable from "../../../common/table/Table";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/inventory/inventoryEnd";
import ExportReports from "../../../common/reports/ExportReports";
import { NO_RECORD_FOUND } from "../../../constants/Messages";
import { useAuth } from "../../../auth/hooks/useAuth";
import { Edit2, Package, Loader2, X, AlertCircle, Trash2 } from "lucide-react";

// Import your reusable components
import Button from '../../../../components/ui/forms/Button';
import InputText from '../../../../components/ui/forms/InputText';
import Modal from '../../../../components/ui/Modal';
import Alert from '../../../../components/ui/feedback/Alert';
import Card from '../../../../components/ui/Card';

// Import packing utilities
import { 
  PackingDisplay,
  unitTypeLabels,
  formatPacking 
} from '../../../../components/ui/packingui';

// Import Inventory Constants
import { INVENTORY_MODULE_CONSTANTS } from './inventoryconstants/inventoryModuleConstants';

export default function LocalStock() {
  const { user } = useAuth();
  const location = useLocation();

  // Refs for cleanup
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);

  // State variables
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Filter states - UPDATED with name, start_date, end_date
  const [searchName, setSearchName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDrug, setDeletingDrug] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // USE CONSTANTS FOR USER INFO
  const { 
    vendorId: currentVendorId, 
    branchId, 
    businessName: currentBusinessName 
  } = INVENTORY_MODULE_CONSTANTS.getUserInfo(user);

  const selectedBranchesPayload = useMemo(() => [{
    vendorId: currentVendorId,
    branchId: branchId
  }], [currentVendorId, branchId]);

  // USE CONSTANTS FOR DATE FORMATTING
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return INVENTORY_MODULE_CONSTANTS.formatDateForDisplay(dateStr);
    } catch {
      return dateStr.split(" ")[0];
    }
  };

  // Today's date for expiry filter
  const today = INVENTORY_MODULE_CONSTANTS.getTodayDate();

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

  const fetchDrugs = async () => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = INVENTORY_MODULE_CONSTANTS.createAbortController();

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // USE CONSTANTS FOR AUTH HEADERS
      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, currentVendorId);

      // Build the complete endpoint with query parameters
      const endpoint = apiEndpoints.searchLocalMedicines(
        searchName.trim() || '',
        startDate || '',
        endDate || '',
        pagination.page,
        pagination.page_size
      );

      // Body is exactly the array of branch objects (no wrapper)
      const { data } = await apiService.get(endpoint, selectedBranchesPayload, {
        headers,
        signal: controllerRef.current.signal,
        timeout: 15000
      });

      if (!isMountedRef.current) return;

      if (data.status === "success" && Array.isArray(data.data)) {
        const mapped = data.data.map((item) => ({
          id: `${item.medicine_id}_${item.batch_code || "nobatch"}`,
          medicine_id: item.medicine_id,
          drug_name: item.name || "Unknown",
          form: (item.type || "tablet").toLowerCase(),
          strength: item.strength || "-",
          manufacturer: item.manufacturer || "-",
          batch_code: item.batch_code || "-",
          retail_price: Number(item.retail_price) || 0,
          sale_price: Number(item.sale_price) || 0,
          stock: Number(item.stock) || 0,
          expiry_date: formatDate(item.expiry_date),
          purpose: item.purpose || "",
          prescriptions_required: item.prescriptions_required || false,
          age_restrictions: item.age_restrictions || "no",
          // Raw fields + availability for tag logic
          raw_batch_code: item.batch_code,
          raw_manufacturer: item.manufacturer,
          raw_expiry_date: item.expiry_date,
          availability: item.availability || "in_stock",
          packing: item.packing || { total_pack: 0, pack_strip: 0, strip_tablet: 0, total_strip: 0 },
          packing_display: INVENTORY_MODULE_CONSTANTS.formatPacking(item.packing),
          location: item.location || "",
          type: item.type || "N/A",
          unit_type: item.unit_type || "",
          // Additional fields from new API response
          gtin: item.gtin || null,
          serial_number: item.serial_number || null,
          manufacturer_date: item.manufacturer_date || null,
          added_date: item.added_date || null
        }));

        setDrugs(mapped);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total_records ?? 0
        }));
      } else {
        setDrugs([]);
        setPagination((prev) => ({ ...prev, total: 0 }));
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      // USE CONSTANTS FOR ERROR HANDLING
      INVENTORY_MODULE_CONSTANTS.handleApiError(err, setError, setLoading);
      setDrugs([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Debounced fetch effect
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (controllerRef.current) controllerRef.current.abort();

    timerRef.current = setTimeout(() => {
      fetchDrugs();
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchName, startDate, endDate, pagination.page, pagination.page_size, selectedBranchesPayload]);

  // Handle success message from navigation
  useEffect(() => {
    if (location.state?.message) {
      INVENTORY_MODULE_CONSTANTS.showSuccess(setSuccessMessage, location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // UPDATED filter change handler
  const handleFilterChange = useCallback((name, value) => {
    if (name === "name") {
      setSearchName(value);
      setPagination((p) => ({ ...p, page: 1 }));
    } else if (name === "start_date") {
      setStartDate(value);
      setPagination((p) => ({ ...p, page: 1 }));
    } else if (name === "end_date") {
      setEndDate(value);
      setPagination((p) => ({ ...p, page: 1 }));
    }
  }, []);

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(prev => {
      const newPage = prev.page_size !== pageSize ? 1 : page;
      return { ...prev, page: newPage, page_size: pageSize };
    });
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchDrugs();
  };

  const openEditModal = (drug) => {
    const packing = drug.packing || { total_pack: 0, pack_strip: 0, strip_tablet: 0, total_strip: 0 };
    setEditingDrug({
      ...drug,
      currentTotalPack: packing.total_pack,
      currentPackStrip: packing.pack_strip,
      currentStripTablet: packing.strip_tablet,
      currentTotalStrip: packing.total_strip,
      totalPack: packing.total_pack,
      packStrip: packing.pack_strip,
      stripTablet: packing.strip_tablet,
      totalStrip: packing.total_strip,
      currentStock: drug.stock,
      additionalStock: 0,
    });
    setModalError("");
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setModalError("");
    setEditingDrug(null);
  };

  const openDeleteModal = (drug) => {
    setDeletingDrug(drug);
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteError("");
    setDeletingDrug(null);
    setDeleting(false);
  };

  // Calculate stock when additional stock changes
  useEffect(() => {
    if (!editingDrug) return;
    
    setEditingDrug(prev => ({ 
      ...prev, 
      stock: prev.currentStock + (prev.additionalStock || 0) 
    }));
  }, [editingDrug?.additionalStock]);

  const updateEditingDrug = (field, value) => {
    setEditingDrug(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingDrug) return;

    setSaving(true);
    setModalError("");

    try {
      const token = getToken();
      
      // FIXED: Date formatting - handle various input formats properly
      let formattedExpiryDate = editingDrug.expiry_date;
      
      // If it's already in DD/MM/YYYY format from display
      if (formattedExpiryDate.includes('/')) {
        const parts = formattedExpiryDate.split('/');
        // Ensure it's parsed as DD/MM/YYYY and convert to YYYY-MM-DD
        formattedExpiryDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } 
      // If it's already in YYYY-MM-DD format from date input
      else if (formattedExpiryDate.includes('-')) {
        // Keep as is if it's already YYYY-MM-DD
        // But ensure it's not MM-DD-YYYY or other format
        const parts = formattedExpiryDate.split('-');
        if (parts[0].length === 4) {
          // Already YYYY-MM-DD, keep as is
          formattedExpiryDate = formattedExpiryDate;
        } else {
          // Assume MM-DD-YYYY or DD-MM-YYYY? Let's check first part length
          if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
            // It's MM-DD-YYYY or DD-MM-YYYY, convert to YYYY-MM-DD
            formattedExpiryDate = `${parts[2]}-${parts[0]}-${parts[1]}`;
          }
        }
      }
      // If it's a Date object or other format, try to parse
      else if (editingDrug.raw_expiry_date) {
        // Use the raw expiry date from original data if available
        const rawDate = new Date(editingDrug.raw_expiry_date);
        if (!isNaN(rawDate.getTime())) {
          formattedExpiryDate = rawDate.toISOString().split('T')[0];
        }
      }

      // UPDATED payload with new fields
      const payload = {
        name: editingDrug.drug_name,
        batch_code: editingDrug.batch_code?.trim(),
        retail_price: parseFloat(editingDrug.retail_price) || 0,
        sale_price: parseFloat(editingDrug.sale_price) || 0,
        strength: editingDrug.strength?.trim() || "N/A",
        age_restrictions: editingDrug.age_restrictions || "no",
        location: editingDrug.location.trim(),
        prescriptions_required: !!editingDrug.prescriptions_required,
        stock: parseInt(editingDrug.stock),
        manufacturer: editingDrug.manufacturer?.trim() || "Unknown",
        expiry_date: formattedExpiryDate,
        gtin: editingDrug.gtin || "",
        serial_number: editingDrug.serial_number || "",
        manufacturer_date: editingDrug.manufacturer_date || null,
        type: editingDrug.type || editingDrug.form || "tablet",
        unit_type: editingDrug.unit_type || "",
        packing: {
          total_pack: parseInt(editingDrug.packing?.total_pack) || 0,
          pack_strip: parseInt(editingDrug.packing?.pack_strip) || 0,
          strip_tablet: parseInt(editingDrug.packing?.strip_tablet) || 0,
          total_strip: parseInt(editingDrug.packing?.total_strip) || 0
        },
      };

      // FIXED: Use the correct edit endpoint with just medicineId
      const url = apiEndpoints.editLocalMedicine(editingDrug.medicine_id);

      // USE CONSTANTS FOR AUTH HEADERS
      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, currentVendorId);
      headers["X-User-Branch-Id"] = branchId;

      // FIXED: Use PATCH method instead of PUT
      await apiService.patch(url, payload, { headers });

      // USE CONSTANTS FOR SUCCESS MESSAGE
      INVENTORY_MODULE_CONSTANTS.showSuccess(setSuccessMessage, "Medicine updated successfully!");
      closeEditModal();
      fetchDrugs();
    } catch (err) {
      // USE CONSTANTS FOR ERROR HANDLING
      setModalError(err.message || "Failed to update medicine");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDrug) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const token = getToken();
      
      // Use the delete-item endpoint with id, batchCode, and type=local
      const deleteUrl = apiEndpoints.deleteItem(
        deletingDrug.medicine_id.toString(),
        deletingDrug.batch_code,
        "local" // Always send type as "local"
      );

      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, currentVendorId);
      headers["X-User-Branch-Id"] = branchId;

      await apiService.delete(deleteUrl, { headers });

      INVENTORY_MODULE_CONSTANTS.showSuccess(setSuccessMessage, "Medicine deleted successfully!");
      closeDeleteModal();
      fetchDrugs();
    } catch (err) {
      setDeleteError(INVENTORY_MODULE_CONSTANTS.getErrorMessage(err) || "Failed to delete medicine");
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: "drug_name",
      header: ({ column }) => <HeaderWithSort column={column} title="Medicine Name" />,
      cell: ({ row }) => {
        const drug = row.original;
        const showTag = drug.availability === "not_in_stock" ||
                        !drug.raw_batch_code ||
                        !drug.raw_manufacturer ||
                        !drug.raw_expiry_date;

        return (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold">{drug.drug_name}</div>
            {showTag && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-600 text-white shadow-sm">
                Not in your stock
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "strength",
      header: "Strength",
      cell: ({ row }) => <span className="text-sm capitalize">{row.original.strength}</span>,
    },
    {
      accessorKey: "form",
      header: "Form",
      cell: ({ row }) => <span className="text-sm capitalize">{row.original.form}</span>,
    },
    {
      accessorKey: "manufacturer",
      header: "Manufacturer",
      cell: ({ row }) => <span className="text-sm capitalize">{row.original.manufacturer}</span>,
    },
    {
      accessorKey: "batch_code",
      header: "Batch",
      cell: ({ row }) => <span className="text-sm capitalize">{row.original.batch_code}</span>,
    },
    {
      accessorKey: "retail_price",
      header: "Retail",
      cell: ({ row }) => <span className="text-sm capitalize">₨ {row.original.retail_price.toFixed(2)}</span>,
    },
    {
      accessorKey: "sale_price",
      header: "Sale",
      cell: ({ row }) => <span className="text-sm capitalize font-bold text-green-600">₨ {row.original.sale_price.toFixed(2)}</span>,
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => (
        <span className={`font-bold ${row.original.stock <= 10 ? "text-red-600" : "text-green-600"}`}>
          {row.original.stock}
        </span>
      ),
    },
    {
      accessorKey: "expiry_date",
      header: "Expiry",
      cell: ({ row }) => <span className="text-sm capitalize">{row.original.expiry_date}</span>,
    },
    {
      accessorKey: "packing",
      header: "Packing",
      cell: ({ row }) => (
        <PackingDisplay 
          packing={row.original.packing} 
          unitType={row.original.unit_type}
        />
      ),
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (<span className="text-sm capitalize">{row.original.location}</span>),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1"> {/* Minimal gap between buttons */}
          <Button
            onClick={() => openEditModal(row.original)}
            variant="icon"
            size="sm"
            title="Edit Medicine"
            aria-label="Edit Medicine"
            className="p-0.5" // Minimal padding
          >
            <Edit2 className="w-4 h-4 text-blue-700" />
          </Button>
          <Button
            onClick={() => openDeleteModal(row.original)}
            variant="icon"
            size="sm"
            title="Delete Medicine"
            aria-label="Delete Medicine"
            className="p-0.5" // Minimal padding
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ], []);

  // UPDATED filter fields with name, start_date, end_date in one line
  const filterFields = useMemo(() => [
     {
      type: "dateRange",
      label: "Date Range",
      fromName: "start_date",
      toName: "end_date",
      value: { start_date: startDate, end_date: endDate },
      onChange: (e) => handleFilterChange(e.target.name, e.target.value),
      className: "date-input-black",
    },
    {
      type: "text",
      name: "name",
      label: "Medicine Name",
      placeholder: "Type medicine name...",
      value: searchName,
      onChange: (e) => handleFilterChange("name", e.target.value),
    },
  
  ], [searchName, startDate, endDate, handleFilterChange]);

  // UPDATED export params
  const exportParams = useMemo(() => ({
    name: searchName.trim() || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    page: 1,
    page_size: 1000
  }), [searchName, startDate, endDate]);

  const exportBody = selectedBranchesPayload;

  // Export endpoint with full URL
  const exportEndpoint = useMemo(() => {
    return apiEndpoints.searchLocalMedicines(
      searchName.trim() || '',
      startDate || '',
      endDate || '',
      1,
      1000
    );
  }, [searchName, startDate, endDate]);

  return (
    <>
      <div className="relative">
        <div className="absolute top-4 right-6 z-20">
        </div>

        {/* Using your Alert component */}
        {successMessage && (
          <Alert
            variant="success"
            message={successMessage}
            show={true}
            icon={true}
            onClose={() => setSuccessMessage(null)}
            className="mb-6"
          />
        )}

        <HomeTable
          title={
            <div className="flex items-center gap-3">
              <Package className="w-7 h-7 text-blue-600" />
              <span className="text-2xl font-bold text-gray-800">Local Stock</span>
            </div>
          }
          data={drugs}
          columns={columns}
          filterFields={filterFields}
          onFilterChange={handleFilterChange}
          loading={loading}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          serverSideFiltering={true}
          error={error}
          onRetry={handleRetry}
          noDataMessage={drugs.length === 0 && !loading && !error}
          hideDefaultActions={true}
        />
      </div>

      {/* EDIT MODAL - Using your Modal component */}
      <Modal
        isOpen={editModalOpen}
        onClose={closeEditModal}
        title="Edit Medicine"
        size="lg"
        className="max-h-[80vh] overflow-y-auto"
      >
        {modalError && (
          <Alert
            variant="error"
            message={modalError}
            show={true}
            icon={true}
            className="mb-6"
          />
        )}

        {editingDrug && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputText 
              label="Medicine ID" 
              value={editingDrug.medicine_id} 
              disabled 
              className="locked-input font-mono"
            />
            <InputText 
              label="Medicine Name" 
              value={editingDrug.drug_name} 
              disabled 
              className="locked-input font-bold"
            />
            <InputText 
              label="Form" 
              value={editingDrug.form} 
              disabled 
              className="locked-input"
            />
            <InputText 
              label="Strength" 
              value={editingDrug.strength} 
              disabled 
              className="locked-input"
            />
            <InputText
              label="Manufacturer"
              value={editingDrug.manufacturer || ""}
              disabled
              className="locked-input"
            />
            <InputText
              label="Batch Code"
              value={editingDrug.batch_code}
              disabled
              className="locked-input"
            />
            <InputText
              label="Retail Price"
              type="number"
              value={editingDrug.retail_price}
              disabled
              className="locked-input"
            />
            <InputText
              label="Sale Price"
              type="number"
              value={editingDrug.sale_price}
              disabled
              className="locked-input"
            />
            <InputText
              label="Location"
              value={editingDrug.location}
              onChange={(e) => updateEditingDrug('location', e.target.value)}
              className="locked-input"
            />
            <InputText
              label="Expiry Date"
              type="date"
              value={editingDrug.raw_expiry_date ? editingDrug.raw_expiry_date.split("T")[0] : ""}
              disabled
              className="locked-input"
            />
            <InputText
              label="GTIN"
              value={editingDrug.gtin || ""}
              disabled
              className="locked-input"
            />
            <InputText
              label="Serial Number"
              value={editingDrug.serial_number || ""}
              disabled
              className="locked-input"
            />
            <InputText
              label="Manufacturer Date"
              value={editingDrug.manufacturer_date ? formatDate(editingDrug.manufacturer_date) : "N/A"}
              disabled
              className="locked-input"
            />

            {/* Packing Section */}
            <div className="md:col-span-2">
              <h4 className="font-semibold text-base mb-2">Packing Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputText
                  label="Unit Type"
                  value={editingDrug.unit_type}
                  disabled
                  className="locked-input"
                />

                {Object.entries(unitTypeLabels[editingDrug.unit_type] || {}).map(([key, label]) => (
                  <InputText
                    key={key}
                    label={label}
                    type="number"
                    value={editingDrug.packing[key] || 0}
                    disabled
                    className="locked-input"
                  />
                ))}
              </div>
            </div>

            <InputText
              label="Current Stock"
              type="number"
              value={editingDrug.currentStock}
              disabled
              className="locked-input"
            />
            <InputText
              label="Additional Stock"
              type="number"
              min="0"
              value={editingDrug.additionalStock || 0}
              onChange={(e) => updateEditingDrug('additionalStock', parseInt(e.target.value) || 0)}
              required
              placeholder="e.g. 100"
            />
            <InputText
              label="New Stock"
              type="number"
              value={editingDrug.stock}
              disabled
              className="bg-gray-100 cursor-not-allowed"
              required
            />
          </div>
        )}

        <div className="flex justify-end gap-4 mt-8">
          <Button
            onClick={closeEditModal}
            variant="secondary"
            className="px-8 py-3"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            disabled={saving}
            loading={saving}
            loadingText="Saving..."
            variant="primary"
            className="px-10 py-3"
          >
            Update Medicine
          </Button>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        title="Delete Medicine"
        size="md"
      >
        {deleteError && (
          <Alert
            variant="error"
            message={deleteError}
            show={true}
            icon={true}
            className="mb-6"
          />
        )}

        <div className="p-4">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Confirm Deletion</h3>
          </div>
          
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <span className="font-semibold">{deletingDrug?.drug_name}</span> 
            {deletingDrug?.batch_code && ` (Batch: ${deletingDrug.batch_code})`}? 
            This action cannot be undone.
          </p>

          <div className="flex justify-end gap-4">
            <Button
              onClick={closeDeleteModal}
              variant="secondary"
              className="px-6 py-2"
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
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Medicine
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}