// supplierorder.jsx - COMPLETE REWRITE WITH ORDER MANAGEMENT - FULLY RESPONSIVE
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import HomeTable from "../../../common/table/Table";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from '../../../../services/apiEndpoints';
import ExportReports from "../../../common/reports/ExportReports";
import { useAuth } from "../../../auth/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { Eye, Pencil, Plus, Check, X, Search, Trash2 } from 'lucide-react';

// Import UI components
import Button from "../../../../components/ui/forms/Button";
import InputText from "../../../../components/ui/forms/InputText";
import InputSelect from "../../../../components/ui/forms/InputSelect";
import InputTextarea from "../../../../components/ui/forms/InputTextarea";
import InputPhone from "../../../../components/ui/forms/InputPhone";
import DatePicker from "../../../../components/ui/forms/DatePicker";
import ButtonTooltip from "../../../../components/ui/forms/ButtonTooltip";
import Alert from "../../../../components/ui/feedback/Alert";
import Card from "../../../../components/ui/Card";
import Modal from "../../../../components/ui/Modal";

// Import constants
import SUPPLIER_MODULE_CONSTANTS from "./supplierconstants/supplierModuleConstants";

const { 
  UI, 
  DEFAULTS, 
  TOOLTIP_TITLES,
  ORDER_STATUS,
  getStatusColor,
  getAuthHeaders,
  getUserInfo,
  getErrorMessage,
  getBranchOptions,
  getBranchInfo,
  mapMedicineToOrderItem,
  calculateTotalValue,
  isOrderEditable,
  getOrderActionLabel,
  formatDateForInput,
  formatDate,
  formatDisplayDate,
  formatDisplayDateTime
} = SUPPLIER_MODULE_CONSTANTS;

// ==================== HELPER COMPONENTS ====================

// Order Items Tooltip Component
const OrderItemsTooltip = ({ items = [], order_id = "" }) => {
  if (!Array.isArray(items) || items.length === 0) return <span className="text-gray-400 text-xs">{DEFAULTS.DASH}</span>;
  
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef(null);

  const previewItems = items.slice(0, 2).map(item => `${item.name} × ${item.quantity}`);
  const preview = previewItems.join(", ") + (items.length > 2 ? "..." : "");

  const open = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const close = () => {
    timerRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  const totalValue = calculateTotalValue(items);

  return (
    <div className="relative inline-block">
      <span onMouseEnter={open} onMouseLeave={close} className="text-blue-600 hover:underline cursor-help text-xs font-medium">
        {preview}
      </span>
      {isOpen && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-none p-4">
          <div onMouseEnter={open} onMouseLeave={close} className="bg-white rounded-xl shadow-2xl p-4 border border-gray-300 max-w-3xl max-h-[80vh] overflow-y-auto pointer-events-auto">
            <h3 className="font-bold text-sm mb-3 text-center text-gray-800 border-b pb-2">
              {TOOLTIP_TITLES.ORDER_ITEMS} {order_id && `- Order #${order_id}`}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold text-gray-500">{UI.MEDICINE_NAME}</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-500">Qty</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-500">{UI.UNIT_PRICE}</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-500">{UI.TOTAL_PRICE}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-2 font-medium text-gray-900">{item.name || DEFAULTS.DASH}</td>
                      <td className="px-3 py-2 text-gray-900 font-bold">{item.quantity || 0}</td>
                      <td className="px-3 py-2 text-gray-900">₨ {Number(item.unit_price).toFixed(2)}</td>
                      <td className="px-3 py-2 text-green-600 font-bold">₨ {(item.quantity * item.unit_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td colSpan="3" className="px-3 py-2 text-right font-bold text-gray-700">Total:</td>
                    <td className="px-3 py-2 font-bold text-purple-600">₨ {totalValue.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Medicine Selector — dropdown rendered via portal so it is never clipped by modal overflow
const MedicineSelector = ({ onSelect, selectedMedicines = [], supplierMedicines = [] }) => {
  const [selectedIds, setSelectedIds] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const ids = {};
    selectedMedicines.forEach(item => { ids[item.medicine_id] = true; });
    setSelectedIds(ids);
  }, [selectedMedicines]);

  // Position the portal dropdown relative to the input
  const updateDropdownPos = useCallback(() => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  const openDropdown = useCallback(() => {
    updateDropdownPos();
    setShowResults(true);
  }, [updateDropdownPos]);

  useEffect(() => {
    if (!showResults) return;
    const handleClickOutside = (e) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setShowResults(false);
      }
    };
    const handleScroll = () => updateDropdownPos();
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showResults, updateDropdownPos]);

  const handleCheckboxChange = (medicine) => {
    setSelectedIds(prev => {
      const next = { ...prev };
      if (next[medicine.medicine_id]) delete next[medicine.medicine_id];
      else next[medicine.medicine_id] = true;
      return next;
    });
  };

  const handleAddSelected = () => {
    const toAdd = filteredMedicines.filter(m => selectedIds[m.medicine_id]);
    if (toAdd.length > 0) {
      onSelect(toAdd.map(medicine => ({
        medicine_id: medicine.medicine_id,
        name: medicine.name,
        type: medicine.type || "N/A",
        strength: medicine.strength || "N/A",
        quantity: DEFAULTS.DEFAULT_QUANTITY,
        unit_price: medicine.default_unit_price || 0,
        notes: ""
      })));
      setSelectedIds({});
      setSearchTerm("");
      setShowResults(false);
      if (inputRef.current) inputRef.current.blur();
    }
  };

  const filteredMedicines = useMemo(() => {
    if (!searchTerm.trim()) return supplierMedicines;
    return supplierMedicines.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [supplierMedicines, searchTerm]);

  if (supplierMedicines.length === 0) {
    return <div className="p-4 text-center text-gray-500 text-sm">No medicines available for this supplier</div>;
  }

  const selectedCount = Object.keys(selectedIds).length;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <InputText
        ref={inputRef}
        placeholder={`Search medicines... (min ${DEFAULTS.MIN_SEARCH_CHARS} chars)`}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          if (e.target.value.length >= DEFAULTS.MIN_SEARCH_CHARS) openDropdown();
          else setShowResults(false);
        }}
        onFocus={() => {
          if (searchTerm.length >= DEFAULTS.MIN_SEARCH_CHARS || supplierMedicines.length > 0) openDropdown();
        }}
        prefix={<Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />}
        className="w-full"
        inputClassName="pl-8 sm:pl-10 text-sm sm:text-base"
      />

      {showResults && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 999999,
          }}
          className="bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto"
        >
          {selectedCount > 0 && (
            <div className="sticky top-0 bg-blue-50 p-2 sm:p-3 border-b border-blue-200 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-blue-700">
                {selectedCount} medicine(s) selected
              </span>
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={handleAddSelected}
                className="w-full sm:w-auto text-xs sm:text-sm px-3 py-1.5"
              >
                Add Selected ({selectedCount})
              </Button>
            </div>
          )}

          <div className="divide-y divide-gray-200">
            {filteredMedicines.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">No medicines found</div>
            ) : (
              filteredMedicines.map((medicine) => (
                <div key={medicine.medicine_id} className="p-3 sm:p-4 hover:bg-gray-50">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!selectedIds[medicine.medicine_id]}
                      onChange={() => handleCheckboxChange(medicine)}
                      className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-2 sm:ml-3 flex-1">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">{medicine.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{medicine.type} | {medicine.strength}</div>
                      {/* <div className="text-xs text-gray-500 mt-0.5">Price: ₨ {medicine.default_unit_price?.toFixed(2) || "0.00"}</div> */}
                    </div>
                  </label>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Selected medicines table — same style as MedicineList in createsupplier.jsx
const SelectedMedicinesList = ({ items = [], onRemove, onFieldChange }) => {
  if (items.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">{UI.MEDICINE_NAME}</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price (₨)</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Total (₨)</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">{UI.ACTIONS}</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.medicine_id} className="hover:bg-gray-50">
              <td className="px-3 sm:px-6 py-2 sm:py-4">
                <div className="text-xs sm:text-sm font-medium text-gray-900">{item.name}</div>
                <div className="text-[10px] sm:text-xs text-gray-500">{item.type} | {item.strength}</div>
              </td>
              <td className="px-3 sm:px-6 py-2 sm:py-4">
                <InputText
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => onFieldChange(item.medicine_id, "quantity", e.target.value)}
                  className="w-24"
                  inputClassName="text-sm py-1.5 px-2 text-center"
                />
              </td>
              <td className="px-3 sm:px-6 py-2 sm:py-4">
                <InputText
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => onFieldChange(item.medicine_id, "unit_price", e.target.value)}
                  className="w-28"
                  inputClassName="text-sm py-1.5 px-2"
                />
              </td>
              <td className="px-3 sm:px-6 py-2 sm:py-4">
                <span className="text-xs sm:text-sm font-semibold text-green-600">
                  ₨ {(item.quantity * item.unit_price).toFixed(2)}
                </span>
              </td>
              <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right">
                <ButtonTooltip tooltipText="Remove medicine" position="top">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onRemove(item.medicine_id)}
                    className="!p-1 sm:!p-2 !min-w-0"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </ButtonTooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Add/Edit Order Modal — UI matches Edit Supplier modal exactly
const OrderModal = ({ isOpen, onClose, onSubmit, initialData = null, supplierMedicines = [], loading, formError = "" }) => {
  const [formData, setFormData] = useState({
    expected_delivery_date: "",
    next_visit_date: "",
    notes: "",
    items: []
  });
  const [internalFormError, setInternalFormError] = useState("");

  const displayError = formError || internalFormError;
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen) {
      setInternalFormError("");
      if (initialData) {
        setFormData({
          expected_delivery_date: formatDateForInput(initialData.expected_delivery_date),
          next_visit_date: formatDateForInput(initialData.next_visit_date),
          notes: initialData.notes || "",
          items: (initialData.items || []).map(item => ({
            medicine_id: item.medicine_id,
            name: item.name,
            type: item.type || "N/A",
            strength: item.strength || "N/A",
            quantity: item.quantity || DEFAULTS.DEFAULT_QUANTITY,
            unit_price: item.unit_price || 0,
            notes: item.notes || ""
          }))
        });
      } else {
        setFormData({ expected_delivery_date: "", next_visit_date: "", notes: "", items: [] });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setInternalFormError("");
  };

  const handleDateChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setInternalFormError("");
  };

  const handleMedicinesSelect = (medicines) => {
    const merged = [...formData.items];
    medicines.forEach(newItem => {
      if (!merged.some(item => item.medicine_id === newItem.medicine_id)) merged.push(newItem);
    });
    setFormData(prev => ({ ...prev, items: merged }));
    setInternalFormError("");
  };

  const handleMedicineRemove = (medicineId) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.medicine_id !== medicineId) }));
    setInternalFormError("");
  };

  const handleItemFieldChange = (medicineId, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.medicine_id === medicineId
          ? { ...item, [field]: field === 'quantity' || field === 'unit_price' ? Number(value) || 0 : value }
          : item
      )
    }));
    setInternalFormError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.expected_delivery_date && formData.expected_delivery_date < today) {
      setInternalFormError("Expected delivery date cannot be in the past");
      return;
    }
    if (formData.next_visit_date && formData.next_visit_date < today) {
      setInternalFormError("Next visit date cannot be in the past");
      return;
    }
    if (formData.items.length === 0) {
      setInternalFormError(UI.ADD_MEDICINE_REQUIRED);
      return;
    }

    onSubmit({
      expected_delivery_date: formData.expected_delivery_date,
      next_visit_date: formData.next_visit_date,
      notes: formData.notes,
      status: initialData?.status || ORDER_STATUS.PENDING,
      items: formData.items.map(item => ({
        medicine_id: item.medicine_id,
        name: item.name,
        type: item.type,
        strength: item.strength,
        quantity: Number(item.quantity) || DEFAULTS.DEFAULT_QUANTITY,
        unit_price: Number(item.unit_price) || 0,
        notes: item.notes || ""
      }))
    });
  };

  if (!isOpen) return null;

  return (
    // NOTE: No overflow-y-auto on Modal — overflow is on the inner div only.
    // This prevents the portal-rendered MedicineSelector dropdown from being clipped.
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? UI.EDIT_ORDER : UI.CREATE_ORDER} size="lg">
      <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto">

        {displayError && (
          <div className="mb-4 sm:mb-6">
            <Alert variant="error" message={displayError} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Dates — 2 column grid, same as supplier form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <DatePicker
              label={UI.EXPECTED_DELIVERY}
              value={formData.expected_delivery_date}
              onChange={(value) => handleDateChange("expected_delivery_date", value)}
              minDate={today}
              required={true}
              className="w-full"
              inputClassName="text-sm sm:text-base py-2"
            />
            <DatePicker
              label={UI.NEXT_VISIT}
              value={formData.next_visit_date}
              onChange={(value) => handleDateChange("next_visit_date", value)}
              minDate={today}
              className="w-full"
              inputClassName="text-sm sm:text-base py-2"
            />
          </div>

          {/* Notes — full width, same as supplier form */}
          <div className="mb-6">
            <InputTextarea
              label={UI.NOTES}
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder={UI.ENTER_NOTES}
              rows={2}
              className="col-span-1 sm:col-span-2"
              inputClassName="text-sm sm:text-base"
            />
          </div>

          {/* Medicine search section — same heading style as supplier form */}
          <div className="mb-6">
            <h4 className="font-bold text-base sm:text-lg text-gray-800 mb-3 sm:mb-4">{UI.ORDER_ITEMS}</h4>
            <MedicineSelector
              onSelect={handleMedicinesSelect}
              selectedMedicines={formData.items}
              supplierMedicines={supplierMedicines}
            />
          </div>

          {/* Selected medicines table — shown below search, same as supplier form */}
          {formData.items.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h4 className="font-bold text-base sm:text-lg text-gray-800">
                  Selected Medicines ({formData.items.length})
                </h4>
                <div>
                  <span className="text-sm text-gray-600">Total: </span>
                  <span className="text-base font-bold text-purple-600">
                    ₨ {calculateTotalValue(formData.items).toFixed(2)}
                  </span>
                </div>
              </div>
              <SelectedMedicinesList
                items={formData.items}
                onRemove={handleMedicineRemove}
                onFieldChange={handleItemFieldChange}
              />
            </div>
          )}

          {/* Actions — same layout as supplier form */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8"
            >
              {UI.CANCEL}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              loading={loading}
              loadingText={initialData ? UI.UPDATING : UI.CREATING}
              className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8"
            >
              {initialData ? UI.EDIT_ORDER : UI.CREATE_ORDER}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

// Confirmation Modal for Status Update
const StatusConfirmModal = ({ isOpen, onClose, onConfirm, order, loading }) => {
  const [notes, setNotes] = useState("");

  useEffect(() => { if (!isOpen) setNotes(""); }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={UI.CONFIRM_COMPLETION} size="md">
      <div className="p-4 sm:p-6">
        <p className="text-gray-700 mb-3 text-sm">
          {UI.CONFIRM_COMPLETION} <span className="font-bold">{order?.order_id}</span>?
        </p>
        <div className="mb-4">
          <InputTextarea
            label={UI.NOTES}
            name="completion_notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={UI.ENTER_COMPLETION_NOTES}
            rows={2}
            className="w-full"
            labelClassName="text-sm font-medium text-gray-700 mb-1"
            inputClassName="text-sm sm:text-base"
          />
        </div>
        <p className="text-xs text-gray-500 mb-4">This action will update the order status and cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} className="text-sm py-2 px-4">{UI.CANCEL}</Button>
          <Button variant="success" onClick={() => onConfirm(notes)} loading={loading} disabled={loading} className="text-sm py-2 px-4">{UI.COMPLETE}</Button>
        </div>
      </div>
    </Modal>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, order, loading }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={UI.CONFIRM_DELETE} size="md">
      <div className="p-4 sm:p-6">
        <p className="text-gray-700 mb-3 text-sm">
          {UI.CONFIRM_DELETE_ORDER} <span className="font-bold">{order?.order_id}</span>?
        </p>
        <p className="text-xs text-gray-500 mb-4">{UI.DELETE_WARNING}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} className="text-sm py-2 px-4">{UI.CANCEL}</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} disabled={loading} className="text-sm py-2 px-4">{UI.DELETE}</Button>
        </div>
      </div>
    </Modal>
  );
};

// ==================== MAIN COMPONENT ====================

export default function SupplierDetails() {
  const { user } = useAuth();
  const location = useLocation();

  const fetchTimeoutRef = useRef(null);
  const controllerRef = useRef(null);
  const successTimeoutRef = useRef(null);

  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [supplierMedicines, setSupplierMedicines] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [completingOrder, setCompletingOrder] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalFormError, setModalFormError] = useState("");

  const [paginationSuppliers, setPaginationSuppliers] = useState({
    page: DEFAULTS.PAGE,
    page_size: DEFAULTS.PAGE_SIZE,
    total: 0,
  });
  const [paginationOrders, setPaginationOrders] = useState({
    page: DEFAULTS.PAGE,
    page_size: DEFAULTS.PAGE_SIZE,
    total: 0,
  });

  const userInfo = useMemo(() => getUserInfo(user), [user]);
  const childVendors = useMemo(() => getVendorChildIds() || [], []);
  const branchOptions = useMemo(() => getBranchOptions(userInfo.currentVendorId, userInfo.currentBusinessName, childVendors), [userInfo.currentVendorId, userInfo.currentBusinessName, childVendors]);
  const [selectedBranchValue, setSelectedBranchValue] = useState(userInfo.currentVendorId);

  useEffect(() => {
    if (location.state?.message) {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      setSuccessMessage(location.state.message);
      successTimeoutRef.current = setTimeout(() => { setSuccessMessage(null); successTimeoutRef.current = null; }, DEFAULTS.SUCCESS_TIMEOUT);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchSuppliers = useCallback(async () => {
    if (selectedSupplier) return;
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      setLoadingSuppliers(true);
      setError(null);
      const token = getToken();
      if (!token) { setLoadingSuppliers(false); return; }

      const endpoint = apiEndpoints.supplierList;
      const headers = getAuthHeaders(token);
      let branchId = userInfo.originalBranchId;
      if (selectedBranchValue && selectedBranchValue !== userInfo.currentVendorId) {
        const child = childVendors.find(v => v.vendor_id === selectedBranchValue);
        if (child) { branchId = child.branch_id; headers['X-Child-ID'] = selectedBranchValue; }
      }
      headers['X-User-Branch-ID'] = branchId;

      const params = new URLSearchParams();
      params.append("page", paginationSuppliers.page);
      params.append("page_size", paginationSuppliers.page_size);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      const { data } = await apiService.get(`${endpoint}?${params.toString()}`, { headers, signal: controllerRef.current.signal, timeout: DEFAULTS.API_TIMEOUT });
      const rawData = data?.data ?? [];
      const pag = data?.pagination ?? {};
      if (!Array.isArray(rawData)) { setSuppliers([]); setPaginationSuppliers(p => ({ ...p, total: 0 })); return; }

      setSuppliers(rawData.map(supplier => ({
        id: supplier.supplier_id,
        supplier_id: supplier.supplier_id,
        name: supplier.name || DEFAULTS.NOT_AVAILABLE,
        company_name: supplier.company_name || DEFAULTS.NOT_AVAILABLE,
        phone: supplier.phone || DEFAULTS.DASH,
        original: supplier
      })));
      setPaginationSuppliers(p => ({ ...p, total: pag.total_records ?? rawData.length ?? 0 }));
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(getErrorMessage(err));
      setSuppliers([]);
      setPaginationSuppliers(p => ({ ...p, total: 0 }));
    } finally {
      setLoadingSuppliers(false);
    }
  }, [searchTerm, paginationSuppliers.page, paginationSuppliers.page_size, selectedBranchValue, selectedSupplier, userInfo.currentVendorId, userInfo.originalBranchId, childVendors]);

  const fetchSupplierMedicines = useCallback(async () => {
    if (!selectedSupplier) return;
    try {
      setLoadingMedicines(true);
      const token = getToken();
      if (!token) return;
      const endpoint = apiEndpoints.supplierList;
      const headers = getAuthHeaders(token);
      let branchId = userInfo.originalBranchId;
      if (selectedBranch && selectedBranch.vendor_id && selectedBranch.vendor_id !== userInfo.currentVendorId) {
        headers['X-Child-ID'] = selectedBranch.vendor_id;
        const child = childVendors.find(v => v.vendor_id === selectedBranch.vendor_id);
        branchId = selectedBranch.branch_id || child?.branch_id || "";
      }
      headers['X-User-Branch-ID'] = branchId;

      const params = new URLSearchParams();
      params.append("supplierId", selectedSupplier.supplier_id);
      params.append("itemsOnly", "True");

      const { data } = await apiService.get(`${endpoint}?${params.toString()}`, { headers, timeout: DEFAULTS.API_TIMEOUT });
      const medicines = data?.data ?? [];
      setSupplierMedicines(medicines.map(medicine => ({
        medicine_id: medicine.medicine_id,
        name: medicine.name || DEFAULTS.NOT_AVAILABLE,
        type: medicine.type || "N/A",
        strength: medicine.strength || "N/A",
        default_unit_price: Number(medicine.default_unit_price) || 0,
        sku: medicine.sku || DEFAULTS.DASH,
        pack_size: medicine.pack_size || 0,
        min_order_qty: medicine.min_order_qty || 0,
        notes: medicine.notes || DEFAULTS.DASH,
        active: medicine.active || false,
      })));
    } catch (err) {
      console.error("Error fetching supplier medicines:", err);
      setSupplierMedicines([]);
    } finally {
      setLoadingMedicines(false);
    }
  }, [selectedSupplier, selectedBranch, userInfo.currentVendorId, userInfo.originalBranchId, childVendors]);

 const fetchSupplierOrders = useCallback(async () => {
  if (!selectedSupplier) return;
  if (controllerRef.current) controllerRef.current.abort();
  controllerRef.current = new AbortController();

  try {
    setLoadingOrders(true);
    setError(null);
    const token = getToken();
    if (!token) { setLoadingOrders(false); return; }

    const endpoint = apiEndpoints.supplierOrderSearch(selectedSupplier.supplier_id);
    const headers = getAuthHeaders(token);
    let branchId = userInfo.originalBranchId;
    if (selectedBranch && selectedBranch.vendor_id && selectedBranch.vendor_id !== userInfo.currentVendorId) {
      headers['X-Child-ID'] = selectedBranch.vendor_id;
      const child = childVendors.find(v => v.vendor_id === selectedBranch.vendor_id);
      branchId = selectedBranch.branch_id || child?.branch_id || "";
    }
    headers['X-User-Branch-ID'] = branchId;

    const params = new URLSearchParams();
    params.append("page", paginationOrders.page);
    params.append("page_size", paginationOrders.page_size);

    const { data } = await apiService.get(`${endpoint}&${params.toString()}`, { headers, signal: controllerRef.current.signal, timeout: DEFAULTS.API_TIMEOUT });
    const ordersData = data?.data ?? [];
    const pag = data?.pagination ?? {};
    if (!Array.isArray(ordersData)) { setOrders([]); setPaginationOrders(p => ({ ...p, total: 0 })); return; }

    setOrders(ordersData.map(order => ({
      id: order.order_id,
      order_id: order.order_id,
      // Use formatDate with showTime=false for dates (converts UTC to local)
      expected_delivery_date: order.expected_delivery_date ? formatDate(order.expected_delivery_date, false) : DEFAULTS.NOT_AVAILABLE,
      next_visit_date: order.next_visit_date ? formatDate(order.next_visit_date, false) : DEFAULTS.NOT_AVAILABLE,
      status: order.status || DEFAULTS.NOT_AVAILABLE,
      created_date: order.created_date ? formatDate(order.created_date, false) : DEFAULTS.NOT_AVAILABLE,
      notes: order.notes || DEFAULTS.DASH,
      items: order.items || [],
      supplier_name: order.supplier_name,
      supplier_company_name: order.supplier_company_name,
      supplier_id: order.supplier_id,
      last_updated: order.last_updated,
      item_count: order.items?.length || 0
    })));
    setPaginationOrders(p => ({ ...p, total: pag.total_records ?? ordersData.length ?? 0 }));
  } catch (err) {
    if (err.name === 'AbortError') return;
    setError(getErrorMessage(err));
    setOrders([]);
  } finally {
    setLoadingOrders(false);
  }
}, [selectedSupplier, selectedBranch, paginationOrders.page, paginationOrders.page_size, userInfo.currentVendorId, userInfo.originalBranchId, childVendors]);
  const handleCreateOrder = async (orderData) => {
    if (!selectedSupplier) return;
    setModalLoading(true);
    setModalFormError("");
    try {
      const token = getToken();
      if (!token) return;
      const endpoint = apiEndpoints.supplierOrders(selectedSupplier.supplier_id);
      const headers = getAuthHeaders(token);
      let branchId = userInfo.originalBranchId;
      if (selectedBranch && selectedBranch.vendor_id && selectedBranch.vendor_id !== userInfo.currentVendorId) {
        headers['X-Child-ID'] = selectedBranch.vendor_id;
        const child = childVendors.find(v => v.vendor_id === selectedBranch.vendor_id);
        branchId = selectedBranch.branch_id || child?.branch_id || "";
      }
      headers['X-User-Branch-ID'] = branchId;
      await apiService.post(endpoint, [orderData], { headers });
      setIsOrderModalOpen(false);
      setSuccessMessage(UI.ORDER_CREATED);
      fetchSupplierOrders();
    } catch (err) {
      console.error("Order creation error:", err);
      if (err.response?.data?.data && Array.isArray(err.response.data.data)) {
        const failedOrder = err.response.data.data[0];
        if (failedOrder && failedOrder.message) { setModalFormError(failedOrder.message); return; }
      }
      if (err.response?.data?.message) { setModalFormError(err.response.data.message); return; }
      setError(getErrorMessage(err) || UI.CREATE_FAILED);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateOrder = async (orderData) => {
    if (!selectedSupplier || !editingOrder) return;
    setModalLoading(true);
    setModalFormError("");
    try {
      const token = getToken();
      if (!token) return;
      const endpoint = apiEndpoints.supplierOrderEdit(selectedSupplier.supplier_id, editingOrder.order_id);
      const headers = getAuthHeaders(token);
      let branchId = userInfo.originalBranchId;
      if (selectedBranch && selectedBranch.vendor_id && selectedBranch.vendor_id !== userInfo.currentVendorId) {
        headers['X-Child-ID'] = selectedBranch.vendor_id;
        const child = childVendors.find(v => v.vendor_id === selectedBranch.vendor_id);
        branchId = selectedBranch.branch_id || child?.branch_id || "";
      }
      headers['X-User-Branch-ID'] = branchId;
      await apiService.patch(endpoint, orderData, { headers });
      setIsOrderModalOpen(false);
      setEditingOrder(null);
      setSuccessMessage(UI.ORDER_UPDATED);
      fetchSupplierOrders();
    } catch (err) {
      console.error("Order update error:", err);
      if (err.response?.data?.data && Array.isArray(err.response.data.data)) {
        const failedOrder = err.response.data.data[0];
        if (failedOrder && failedOrder.message) { setModalFormError(failedOrder.message); return; }
      }
      if (err.response?.data?.message) { setModalFormError(err.response.data.message); return; }
      setError(getErrorMessage(err) || UI.UPDATE_FAILED);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCompleteOrder = async (notes = "") => {
    if (!selectedSupplier || !completingOrder) return;
    setModalLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) return;
      const endpoint = apiEndpoints.supplierOrderStatus(selectedSupplier.supplier_id, completingOrder.order_id);
      const headers = getAuthHeaders(token);
      let branchId = userInfo.originalBranchId;
      if (selectedBranch && selectedBranch.vendor_id && selectedBranch.vendor_id !== userInfo.currentVendorId) {
        headers['X-Child-ID'] = selectedBranch.vendor_id;
        const child = childVendors.find(v => v.vendor_id === selectedBranch.vendor_id);
        branchId = selectedBranch.branch_id || child?.branch_id || "";
      }
      headers['X-User-Branch-ID'] = branchId;
      await apiService.patch(endpoint, { status: ORDER_STATUS.COMPLETED, notes: notes || UI.ORDER_COMPLETED }, { headers });
      setIsStatusModalOpen(false);
      setCompletingOrder(null);
      setSuccessMessage(UI.ORDER_COMPLETED);
      fetchSupplierOrders();
    } catch (err) {
      setError(getErrorMessage(err) || UI.UPDATE_FAILED);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedSupplier || !deletingOrder) return;
    setModalLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) return;
      const endpoint = apiEndpoints.deleteOrder(selectedSupplier.supplier_id, deletingOrder.order_id);
      const headers = getAuthHeaders(token);
      let branchId = userInfo.originalBranchId;
      if (selectedBranch && selectedBranch.vendor_id && selectedBranch.vendor_id !== userInfo.currentVendorId) {
        headers['X-Child-ID'] = selectedBranch.vendor_id;
        const child = childVendors.find(v => v.vendor_id === selectedBranch.vendor_id);
        branchId = selectedBranch.branch_id || child?.branch_id || "";
      }
      headers['X-User-Branch-ID'] = branchId;
      await apiService.delete(endpoint, { headers });
      setIsDeleteModalOpen(false);
      setDeletingOrder(null);
      setSuccessMessage(UI.ORDER_DELETED);
      fetchSupplierOrders();
    } catch (err) {
      setError(getErrorMessage(err) || UI.DELETE_FAILED);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenOrderModal = useCallback(async (order = null) => {
    setEditingOrder(order);
    setModalFormError("");
    await fetchSupplierMedicines();
    setIsOrderModalOpen(true);
  }, [fetchSupplierMedicines]);

  useEffect(() => {
    if (selectedSupplier) return;
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => { fetchSuppliers(); }, DEFAULTS.SEARCH_DEBOUNCE);
    return () => { if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current); };
  }, [selectedSupplier, searchTerm, paginationSuppliers.page, paginationSuppliers.page_size, selectedBranchValue, fetchSuppliers]);

  useEffect(() => {
    if (selectedSupplier) {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchSupplierOrders();
    }
  }, [selectedSupplier, paginationOrders.page, paginationOrders.page_size, fetchSupplierOrders]);

  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      if (controllerRef.current) controllerRef.current.abort();
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const handleFilterChange = useCallback((name, value) => {
    if (name === "branch") { setSelectedBranchValue(value || ""); setPaginationSuppliers(p => ({ ...p, page: DEFAULTS.PAGE })); return; }
    if (name === "search") { setSearchTerm(value); setPaginationSuppliers(p => ({ ...p, page: DEFAULTS.PAGE })); return; }
  }, []);

  const handleViewSupplier = useCallback((row) => {
    const supplier = row.original;
    const branchInfo = getBranchInfo(selectedBranchValue, userInfo, childVendors);
    setSelectedSupplier(supplier);
    setSelectedBranch(branchInfo);
    setPaginationOrders({ page: DEFAULTS.PAGE, page_size: DEFAULTS.PAGE_SIZE, total: 0 });
  }, [selectedBranchValue, userInfo, childVendors]);

  const handleBack = useCallback(() => {
    setSelectedSupplier(null);
    setSelectedBranch(null);
    setOrders([]);
    setSupplierMedicines([]);
    setPaginationOrders({ page: DEFAULTS.PAGE, page_size: DEFAULTS.PAGE_SIZE, total: 0 });
  }, []);

  const handleEditOrder = useCallback((order) => { handleOpenOrderModal(order); }, [handleOpenOrderModal]);
  const handleCompleteOrderClick = useCallback((order) => { setCompletingOrder(order); setIsStatusModalOpen(true); }, []);
  const handleDeleteOrderClick = useCallback((order) => { setDeletingOrder(order); setIsDeleteModalOpen(true); }, []);
  const handlePaginationSuppliers = useCallback((page, pageSize) => { setPaginationSuppliers(p => ({ ...p, page, page_size: pageSize })); }, []);
  const handlePaginationOrders = useCallback((page, pageSize) => { setPaginationOrders(p => ({ ...p, page, page_size: pageSize })); }, []);
  const handleRetry = useCallback(() => { setError(null); if (selectedSupplier) fetchSupplierOrders(); else fetchSuppliers(); }, [selectedSupplier, fetchSupplierOrders, fetchSuppliers]);

  const supplierFilterFields = useMemo(() => [
    {
      type: "text",
      name: "search",
      label: "Search Suppliers",
      placeholder: UI.SEARCH_SUPPLIERS,
      value: searchTerm,
      onChange: (e) => handleFilterChange("search", e.target.value),
      className: "w-full sm:w-auto",
    },
    ...(userInfo.isMaster && branchOptions.length > 0 ? [{
      type: "select",
      name: "branch",
      label: UI.BRANCH,
      placeholder: UI.SELECT_BRANCH,
      value: selectedBranchValue,
      onChange: (e) => handleFilterChange("branch", e.target.value),
      options: branchOptions,
      className: "w-full sm:w-auto",
    }] : []),
  ], [searchTerm, selectedBranchValue, handleFilterChange, userInfo.isMaster, branchOptions]);

  const supplierColumns = useMemo(() => [
    {
      accessorKey: "name",
      header: ({ column }) => <HeaderWithSort column={column} title={UI.SUPPLIER_NAME} />,
      cell: ({ row }) => <div className="font-medium text-gray-900 text-sm">{row.original.name}</div>,
    },
    {
      accessorKey: "company_name",
      header: ({ column }) => <HeaderWithSort column={column} title={UI.COMPANY_NAME} />,
      cell: ({ row }) => <div className="font-medium text-gray-900 text-sm">{row.original.company_name}</div>,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => <HeaderWithSort column={column} title={UI.PHONE} />,
      cell: ({ row }) => <div className="font-medium text-gray-900 text-sm">{row.original.phone}</div>,
    },
    {
      accessorKey: "View",
      header: () => <div className="text-center text-sm">{UI.ACTIONS}</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <ButtonTooltip tooltipText={UI.VIEW_SUPPLIER_ORDERS} position="top">
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleViewSupplier(row); }}
              className="px-3 py-1 inline-flex items-center gap-1 text-sm"
            >
              <Eye className="w-4 h-4" />
              {UI.VIEW_ORDERS}
            </Button>
          </ButtonTooltip>
        </div>
      ),
      enableSorting: false,
    },
  ], [handleViewSupplier]);

  const orderColumns = useMemo(() => [
    {
      accessorKey: "order_id",
      header: ({ column }) => <HeaderWithSort column={column} title={UI.ORDER_ID} />,
      cell: ({ row }) => <div className="font-medium text-gray-900 text-sm">{row.original.order_id}</div>,
    },
    {
      accessorKey: "items",
      header: ({ column }) => <HeaderWithSort column={column} title={UI.ITEMS} />,
      cell: ({ row }) => <OrderItemsTooltip items={row.original.items} order_id={row.original.order_id} />,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <HeaderWithSort column={column} title={UI.STATUS} />,
      cell: ({ row }) => {
        const status = row.original.status;
        return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(status)}`}>{status}</span>;
      },
    },
    {
    accessorKey: "expected_delivery_date",
    header: UI.EXPECTED_DELIVERY,
    cell: ({ row }) => <div className="text-xs">{row.original.expected_delivery_date}</div>,
  },
  {
    accessorKey: "created_date",
    header: UI.CREATED,
    cell: ({ row }) => <div className="text-xs">{row.original.created_date}</div>,
  },
    {
      accessorKey: "Actions",
      header: () => <div className="text-center text-sm">{UI.ACTIONS}</div>,
      cell: ({ row }) => {
        const status = row.original.status;
        const isEditable = isOrderEditable(status);
        return (
          <div className="flex justify-center gap-1">
            {isEditable && (
              <>
                <ButtonTooltip tooltipText={UI.EDIT_ORDER} position="top">
                  <Button variant="secondary" size="sm" onClick={() => handleEditOrder(row.original)} className="!p-2 !min-w-0">
                    <Pencil className="w-3 h-3" />
                  </Button>
                </ButtonTooltip>
                <ButtonTooltip tooltipText={UI.COMPLETE_ORDER} position="top">
                  <Button variant="success" size="sm" onClick={() => handleCompleteOrderClick(row.original)} className="!p-1 !min-w-0">
                    <Check className="w-3 h-3" />
                  </Button>
                </ButtonTooltip>
                <ButtonTooltip tooltipText={UI.DELETE_ORDER} position="top">
                  <Button variant="danger" size="sm" onClick={() => handleDeleteOrderClick(row.original)} className="!p-1 !min-w-0">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </ButtonTooltip>
              </>
            )}
            {!isEditable && <span className="text-gray-400 text-xs italic px-2">{getOrderActionLabel(status)}</span>}
          </div>
        );
      },
      enableSorting: false,
    },
  ], [handleEditOrder, handleCompleteOrderClick, handleDeleteOrderClick]);

  const suppliersTitle = useMemo(() => {
    const branchLabel = selectedBranchValue === userInfo.currentVendorId
      ? userInfo.currentBusinessName
      : branchOptions.find(opt => opt.value === selectedBranchValue)?.label || UI.ALL_BRANCHES;
    const isMainBranch = selectedBranchValue === userInfo.currentVendorId || !selectedBranchValue;

    return (
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 pr-16 sm:pr-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-xl sm:text-2xl font-bold text-gray-800">{UI.SUPPLIER_ORDERS}</span>
        </div>
        <span className="hidden sm:inline text-gray-500">—</span>
        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm w-fit ${
          isMainBranch ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-blue-100 text-blue-800 border border-blue-300'
        }`}>
          {branchLabel}
        </span>
      </div>
    );
  }, [selectedBranchValue, userInfo.currentVendorId, userInfo.currentBusinessName, branchOptions]);

  return (
    <div className="relative">
      {successMessage && (
        <Alert variant="success" message={successMessage} className="mb-4 mx-2 sm:mx-4" onClose={() => setSuccessMessage(null)} />
      )}
      {error && (
        <Alert variant="error" message={error} action={handleRetry} actionLabel={UI.RETRY} onClose={() => setError(null)} className="mb-4 mx-2 sm:mx-4" />
      )}

      {selectedSupplier ? (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-2 sm:px-4">
            <Button variant="secondary" onClick={handleBack} className="inline-flex items-center gap-2 w-full sm:w-auto text-sm">
              <span>←</span>
              <span className="hidden sm:inline">{UI.BACK_TO_SUPPLIERS}</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => handleOpenOrderModal(null)}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto text-sm px-4 py-2"
              disabled={loadingMedicines}
            >
              <Plus className="w-4 h-4" />
              <span>{loadingMedicines ? "Loading..." : `${UI.ADD_ORDER} `}</span>
            </Button>
          </div>

          <Card className="mb-6 mx-2 sm:mx-4" bodyClassName="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b gap-4">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-800 truncate">{selectedSupplier.name}</h2>
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    <span className="font-semibold">{UI.COMPANY_NAME}:</span> {selectedSupplier.company_name} |
                    <span className="font-semibold ml-2">{UI.PHONE}:</span> {selectedSupplier.phone}
                  </p>
                  {selectedBranch && (
                    <p className="text-xs text-gray-500 mt-1">{UI.BRANCH}: {selectedBranch.business_name}</p>
                  )}
                </div>
              </div>
              <div className="text-center px-4 py-2 bg-blue-50 rounded-lg w-full sm:w-auto">
                <p className="text-xs text-blue-700 whitespace-nowrap">{UI.TOTAL_ORDERS}</p>
                <p className="text-xl font-bold text-blue-800">{paginationOrders.total}</p>
              </div>
            </div>
          </Card>

          <HomeTable
            data={orders}
            columns={orderColumns}
            loading={loadingOrders}
            pagination={paginationOrders}
            onPaginationChange={handlePaginationOrders}
            serverSideFiltering={true}
            error={error}
            onRetry={handleRetry}
            hideDefaultActions
            noDataMessage={UI.NO_ORDERS}
          />
        </>
      ) : (
        <HomeTable
          title={suppliersTitle}
          data={suppliers}
          columns={supplierColumns}
          loading={loadingSuppliers}
          pagination={paginationSuppliers}
          onPaginationChange={handlePaginationSuppliers}
          filterFields={supplierFilterFields}
          onFilterChange={handleFilterChange}
          serverSideFiltering={true}
          error={error}
          onRetry={handleRetry}
          hideDefaultActions
          noDataMessage={UI.NO_SUPPLIERS}
        />
      )}

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setEditingOrder(null);
          setSupplierMedicines([]);
          setModalFormError("");
        }}
        onSubmit={editingOrder ? handleUpdateOrder : handleCreateOrder}
        initialData={editingOrder}
        supplierMedicines={supplierMedicines}
        loading={modalLoading}
        formError={modalFormError}
      />

      <StatusConfirmModal
        isOpen={isStatusModalOpen}
        onClose={() => { setIsStatusModalOpen(false); setCompletingOrder(null); }}
        onConfirm={handleCompleteOrder}
        order={completingOrder}
        loading={modalLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeletingOrder(null); }}
        onConfirm={handleDeleteOrder}
        order={deletingOrder}
        loading={modalLoading}
      />
    </div>
  );
}