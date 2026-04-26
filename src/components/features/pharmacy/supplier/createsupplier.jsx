// createsupplier.jsx — WITH COMPLETE SUPPLIER MANAGEMENT - FULLY RESPONSIVE
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
import { 
  Eye, Pencil, Plus, X, Search, Trash2
} from 'lucide-react';

// Import UI components
import Button from "../../../../components/ui/forms/Button";
import InputText from "../../../../components/ui/forms/InputText";
import InputSelect from "../../../../components/ui/forms/InputSelect";
import InputTextarea from "../../../../components/ui/forms/InputTextarea";
import InputPhone from "../../../../components/ui/forms/InputPhone";
import ButtonTooltip from "../../../../components/ui/forms/ButtonTooltip";
import Alert from "../../../../components/ui/feedback/Alert";
import Card from "../../../../components/ui/Card";
import Modal from '../../../../components/ui/Modal';

// Import constants
import SUPPLIER_MODULE_CONSTANTS from "./supplierconstants/supplierModuleConstants";

const { 
  UI, 
  DEFAULTS, 
  TOOLTIP_TITLES,
  getAuthHeaders,
  getUserInfo,
  getErrorMessage,
  getBranchOptions,
  getBranchInfo,
  mapMedicineToSupplierMedicine,
  getSupplierFilterFields,
  formatDisplayDate,
  formatDisplayDateTime,
  validateEmail,    
  validatePhone     
} = SUPPLIER_MODULE_CONSTANTS;



// HoverTooltip for long text fields - FIXED: Responsive
const HoverTooltip = ({ preview, full, title, className = "" }) => {
  const actualPreview = preview || (full ? full.substring(0, DEFAULTS.PREVIEW_LENGTH) + (full.length > DEFAULTS.PREVIEW_LENGTH ? '...' : '') : DEFAULTS.DASH);
  
  let content;
  if (full && full !== DEFAULTS.DASH && full !== actualPreview) {
    content = (
      <div className="p-3 sm:p-4">
        <p className="text-gray-900 whitespace-pre-wrap break-words text-sm sm:text-base">{full}</p>
      </div>
    );
  } else {
    return <span className={`text-gray-600 text-xs sm:text-sm ${className}`}>{actualPreview}</span>;
  }

  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef(null);

  const open = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const close = () => {
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={open}
        onMouseLeave={close}
        className={`text-blue-600 hover:underline cursor-help text-xs sm:text-sm ${className}`}
      >
        {actualPreview}
      </span>

      {isOpen && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-none p-4">
          <div
            onMouseEnter={open}
            onMouseLeave={close}
            className="bg-white rounded-xl shadow-2xl p-4 border border-gray-300 max-w-md max-h-[80vh] overflow-y-auto pointer-events-auto"
          >
            <h3 className="font-bold text-sm sm:text-md mb-2 text-center text-gray-800 border-b pb-2">
              {title}
            </h3>
            {content}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Medicine Search Component (for adding medicines) - FIXED: Responsive
const MedicineSearch = ({ onSelect, selectedMedicines = [], onRemove }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState({});
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuth();

  const searchMedicines = useCallback(async (query) => {
    if (!query.trim() || query.length < DEFAULTS.MIN_SEARCH_CHARS) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      
      const vendorId = user?.vendorId || user?.currentBranch?.vendorId || localStorage.getItem('vendorId');
      const branchId = user?.branchId || user?.currentBranch?.id || localStorage.getItem('branchId') || "main";
      
      const headers = getAuthHeaders(token);
      
      const payload = [{
        vendorId: vendorId,
        branchId: branchId
      }];

      const { data } = await apiService.get(
        apiEndpoints.supplierMedicine(query),
        payload,
        { headers }
      );

      const medicines = data?.data || [];
      setSearchResults(medicines);
    } catch (err) {
      console.error("Error searching medicines:", err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowResults(false);
        setSelectedVariants({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim().length >= DEFAULTS.MIN_SEARCH_CHARS) {
      searchTimeoutRef.current = setTimeout(() => {
        searchMedicines(searchTerm);
      }, DEFAULTS.SEARCH_DEBOUNCE);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, searchMedicines]);

  // Generate a unique key for each strength variant
  const getVariantKey = (medicine, strength, type) => {
    return `${medicine.medicine_id}-${strength}-${type}`.replace(/[^a-zA-Z0-9]/g, '-');
  };

  // Check if a specific variant is already selected in the form
  const isVariantSelected = (medicine, strength, type) => {
    return selectedMedicines.some(m => 
      m.medicine_id === medicine.medicine_id && 
      m.strength === strength && 
      m.type === type
    );
  };

  // Handle checkbox change for variant selection
  const handleVariantCheckbox = (medicine, strength, type, checked) => {
    setSelectedVariants(prev => {
      const key = getVariantKey(medicine, strength, type);
      if (checked) {
        return { ...prev, [key]: { medicine, strength, type } };
      } else {
        const newSelected = { ...prev };
        delete newSelected[key];
        return newSelected;
      }
    });
  };

  // Handle "Select All" for a medicine
  const handleSelectAllVariants = (medicine) => {
    setSelectedVariants(prev => {
      const newSelected = { ...prev };
      
      medicine.types.forEach(type => {
        medicine.strengths.forEach(strength => {
          const key = getVariantKey(medicine, strength, type);
          if (!isVariantSelected(medicine, strength, type)) {
            newSelected[key] = { medicine, strength, type };
          }
        });
      });
      
      return newSelected;
    });
  };

  // Handle "Add Selected" button click
  const handleAddSelected = () => {
    const variantsToAdd = Object.values(selectedVariants).map(({ medicine, strength, type }) => ({
      medicine_id: medicine.medicine_id,
      name: medicine.name,
      strength: strength,
      type: type,
      notes: `${type} - ${strength}`,
      active: true
    }));

    if (variantsToAdd.length > 0) {
      // Add the selected medicines to parent form
      onSelect(variantsToAdd);
      
      // Clear all selections and close dropdown
      setSelectedVariants({});
      setSearchTerm("");
      setSearchResults([]);
      setShowResults(false);
      
      // Remove focus from input
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const handleFocus = () => {
    if (searchTerm.length >= DEFAULTS.MIN_SEARCH_CHARS || searchResults.length > 0) {
      setShowResults(true);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length >= DEFAULTS.MIN_SEARCH_CHARS) {
      setShowResults(true);
    } else {
      setShowResults(false);
      setSearchResults([]);
      setSelectedVariants({});
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowResults(false);
      setSelectedVariants({});
      setSearchTerm("");
      setSearchResults([]);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  // Count total selectable variants for a medicine (excluding already selected ones)
  const getSelectableVariantCount = (medicine) => {
    let count = 0;
    medicine.types.forEach(type => {
      medicine.strengths.forEach(strength => {
        if (!isVariantSelected(medicine, strength, type)) {
          count++;
        }
      });
    });
    return count;
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <InputText
          ref={inputRef}
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={`${UI.SEARCH_MEDICINES} (min ${DEFAULTS.MIN_SEARCH_CHARS} chars)`}
          prefix={<Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />}
          className="w-full"
          inputClassName="pl-8 sm:pl-10 text-sm sm:text-base"
        />
        {loading && (
          <div className="absolute right-3 top-2.5 sm:top-3.5">
            <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {showResults && searchTerm.length >= DEFAULTS.MIN_SEARCH_CHARS && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 text-sm sm:text-base">{UI.SEARCHING}</div>
          ) : searchResults.length > 0 ? (
            <>
              {/* Sticky header with Add Selected button */}
              {Object.keys(selectedVariants).length > 0 && (
                <div className="sticky top-0 bg-blue-50 p-2 sm:p-3 border-b border-blue-200 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium text-blue-700">
                    {Object.keys(selectedVariants).length} variant(s) selected
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={handleAddSelected}
                    className="w-full sm:w-auto text-xs sm:text-sm px-3 py-1.5"
                  >
                    {UI.ADD_SELECTED} ({Object.keys(selectedVariants).length})
                  </Button>
                </div>
              )}

              {/* Medicine results */}
              <div className="divide-y divide-gray-200">
                {searchResults.map((medicine, index) => {
                  const selectableCount = getSelectableVariantCount(medicine);
                  
                  return (
                    <div key={medicine.medicine_id || index} className="p-3 sm:p-4 hover:bg-gray-50">
                      {/* Main medicine row */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-900 text-sm sm:text-base">{medicine.name}</span>
                            <span className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
                              {medicine.types.length} type(s) × {medicine.strengths.length} strength(s)
                            </span>
                          </div>
                        </div>
                        
                        {/* Select All button */}
                        {selectableCount > 0 && (
                          <ButtonTooltip tooltipText={`Select all ${selectableCount} available variants`} position="top">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSelectAllVariants(medicine)}
                              className="w-full sm:w-auto text-xs px-3 py-1.5"
                            >
                              Select All ({selectableCount})
                            </Button>
                          </ButtonTooltip>
                        )}
                      </div>

                      {/* Variants grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {medicine.types.map(type => 
                          medicine.strengths.map(strength => {
                            const variantKey = getVariantKey(medicine, strength, type);
                            const isSelected = isVariantSelected(medicine, strength, type);
                            const isChecked = !!selectedVariants[variantKey];
                            
                            return (
                              <label
                                key={`${type}-${strength}`}
                                className={`
                                  flex items-center p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors
                                  ${isSelected 
                                    ? 'bg-green-50 border-green-300 cursor-not-allowed opacity-60' 
                                    : isChecked
                                      ? 'bg-blue-50 border-blue-300'
                                      : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                  }
                                `}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => handleVariantCheckbox(medicine, strength, type, e.target.checked)}
                                  disabled={isSelected}
                                  className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                                />
                                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                                  <div className="text-xs sm:text-sm font-medium text-gray-700 truncate">{type}</div>
                                  <div className="text-[10px] sm:text-xs text-gray-500 truncate">{strength}</div>
                                </div>
                                {isSelected && (
                                  <span className="text-[10px] sm:text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full ml-1 whitespace-nowrap">
                                    Added
                                  </span>
                                )}
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm sm:text-base">{UI.NO_MEDICINES}</div>
          )}
        </div>
      )}
    </div>
  );
};

// Medicine List Component - FIXED: Responsive with correct removal
const MedicineList = ({ medicines = [], onRemove }) => {
  if (medicines.length === 0) {
    return <p className="text-gray-500 text-center py-4 text-sm sm:text-base">{UI.NO_MEDICINES_LINKED}</p>;
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">{UI.MEDICINE_NAME}</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Strength</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">{UI.ACTIONS}</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {medicines.map((medicine, index) => {
            // Create a unique key for React (includes index)
            const reactKey = `${medicine.medicine_id}-${medicine.strength}-${medicine.type}-${index}`;
            // Create a stable key for removal (without index)
            const removalKey = `${medicine.medicine_id}-${medicine.strength}-${medicine.type}`;
            
            return (
              <tr key={reactKey} className="hover:bg-gray-50">
                <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                  {medicine.name}
                 </td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-[10px] sm:text-xs text-gray-500">
                  {medicine.type || 'N/A'}
                 </td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-[10px] sm:text-xs text-gray-500">
                  {medicine.strength || 'N/A'}
                 </td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-xs font-bold ${
                    medicine.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {medicine.active ? 'Active' : 'Inactive'}
                  </span>
                 </td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right">
                  <ButtonTooltip tooltipText={UI.REMOVE_MEDICINE} position="top">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onRemove(removalKey)} 
                      className="!p-1 sm:!p-2 !min-w-0"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </ButtonTooltip>
                 </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default function SupplierDetails() {
  const { user } = useAuth();
  const location = useLocation();

  const fetchTimeoutRef = useRef(null);
  const controllerRef = useRef(null);
  const successTimeoutRef = useRef(null);
  const modalSuccessTimeoutRef = useRef(null);
  const modalErrorTimeoutRef = useRef(null);
  const deleteSuccessTimeoutRef = useRef(null);
  const deleteErrorTimeoutRef = useRef(null);

  const [summaryData, setSummaryData] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [detailData, setDetailData] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedBranchValue, setSelectedBranchValue] = useState("");

  const [deleteSuccess, setDeleteSuccess] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deletingMedicineId, setDeletingMedicineId] = useState(null);
  const [deletingSupplierId, setDeletingSupplierId] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(null);
  const [modalError, setModalError] = useState(null);

  // Delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    contact_email: "",
    phone: ""
  });

  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    contact_email: "",
    address: "",
    phone: "",
    notes: "",
    medicines: []
  });

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

  useEffect(() => {
    if (modalSuccess) {
      if (modalSuccessTimeoutRef.current) {
        clearTimeout(modalSuccessTimeoutRef.current);
      }
      modalSuccessTimeoutRef.current = setTimeout(() => {
        setModalSuccess(null);
        modalSuccessTimeoutRef.current = null;
      }, DEFAULTS.SUCCESS_TIMEOUT);
    }

    if (modalError) {
      if (modalErrorTimeoutRef.current) {
        clearTimeout(modalErrorTimeoutRef.current);
      }
      modalErrorTimeoutRef.current = setTimeout(() => {
        setModalError(null);
        modalErrorTimeoutRef.current = null;
      }, DEFAULTS.SUCCESS_TIMEOUT);
    }

    return () => {
      if (modalSuccessTimeoutRef.current) {
        clearTimeout(modalSuccessTimeoutRef.current);
      }
      if (modalErrorTimeoutRef.current) {
        clearTimeout(modalErrorTimeoutRef.current);
      }
    };
  }, [modalSuccess, modalError]);

  useEffect(() => {
    if (deleteSuccess) {
      if (deleteSuccessTimeoutRef.current) {
        clearTimeout(deleteSuccessTimeoutRef.current);
      }
      deleteSuccessTimeoutRef.current = setTimeout(() => {
        setDeleteSuccess(null);
        deleteSuccessTimeoutRef.current = null;
      }, DEFAULTS.SUCCESS_TIMEOUT);
    }

    if (deleteError) {
      if (deleteErrorTimeoutRef.current) {
        clearTimeout(deleteErrorTimeoutRef.current);
      }
      deleteErrorTimeoutRef.current = setTimeout(() => {
        setDeleteError(null);
        deleteErrorTimeoutRef.current = null;
      }, DEFAULTS.SUCCESS_TIMEOUT);
    }

    return () => {
      if (deleteSuccessTimeoutRef.current) {
        clearTimeout(deleteSuccessTimeoutRef.current);
      }
      if (deleteErrorTimeoutRef.current) {
        clearTimeout(deleteErrorTimeoutRef.current);
      }
    };
  }, [deleteSuccess, deleteError]);

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      company_name: "",
      contact_email: "",
      address: "",
      phone: "",
      notes: "",
      medicines: []
    });
    setFormErrors({
      contact_email: "",
      phone: ""
    });
  }, []);

  const clearModalMessages = useCallback(() => {
    setModalSuccess(null);
    setModalError(null);
  }, []);

  const clearDeleteMessages = useCallback(() => {
    setDeleteSuccess(null);
    setDeleteError(null);
  }, []);

  // Validate form fields
  const validateForm = useCallback(() => {
    const errors = {
      contact_email: "",
      phone: ""
    };
    let isValid = true;

    // Validate email
    if (formData.contact_email && !validateEmail(formData.contact_email)) {
      errors.contact_email = "Please enter a valid email address";
      isValid = false;
    }

    // Validate phone
    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  }, [formData.contact_email, formData.phone]);

  const fetchSummary = useCallback(async () => {
    if (selectedSupplier) return;

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

      const endpoint = apiEndpoints.supplierList;
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
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
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

   const mapped = rawData.map((supplier, i) => ({
  id: supplier.supplier_id || `${supplier.name}-${i}`,
  supplier_id: supplier.supplier_id,
  name: supplier.name || DEFAULTS.NOT_AVAILABLE,
  company_name: supplier.company_name || DEFAULTS.NOT_AVAILABLE,
  phone: supplier.phone || DEFAULTS.NOT_AVAILABLE,
  address: supplier.address || DEFAULTS.NOT_AVAILABLE,
  contact_email: supplier.contact_email || DEFAULTS.NOT_AVAILABLE,
  notes: supplier.notes || DEFAULTS.DASH,
  // Use the constant formatter
  created_date: supplier.created_date ? SUPPLIER_MODULE_CONSTANTS.formatDate(supplier.created_date, false) : DEFAULTS.NOT_AVAILABLE,
  last_updated: supplier.last_updated ? SUPPLIER_MODULE_CONSTANTS.formatDate(supplier.last_updated, true) : DEFAULTS.NOT_AVAILABLE,
  vendor_id: supplier.vendor_id,
  medicines: supplier.medicines || [],
}));
      setSummaryData(mapped);
      setPaginationSummary(p => ({
        ...p,
        total: pag.total_records ?? rawData.length ?? 0,
      }));
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(getErrorMessage(err) || UI.FETCH_FAILED);
      setSummaryData([]);
      setPaginationSummary(p => ({ ...p, total: 0 }));
    } finally {
      setLoadingSummary(false);
    }
  }, [searchTerm, paginationSummary.page, paginationSummary.page_size, selectedBranchValue, selectedSupplier, userInfo.currentVendorId, userInfo.originalBranchId, childVendors]);

  // Delete Supplier Function
  const handleDeleteSupplier = useCallback(async () => {
    if (!supplierToDelete) return;

    setDeletingSupplierId(supplierToDelete.supplier_id);
    clearDeleteMessages();

    try {
      const token = getToken();
      const headers = getAuthHeaders(token);

      const deleteUrl = apiEndpoints.supplierdelete(supplierToDelete.supplier_id);

      const { data } = await apiService.delete(deleteUrl, { headers });

      // Use the message from backend response
      if (data && data.message) {
        setDeleteSuccess(data.message);
      } else {
        setDeleteSuccess(UI.SUPPLIER_DELETED || "Supplier deleted successfully");
      }

      // Close confirmation modal
      setShowDeleteConfirm(false);
      setSupplierToDelete(null);

      // Refresh the supplier list
      await fetchSummary();

    } catch (err) {
      console.error("Error deleting supplier:", err);
      setDeleteError(getErrorMessage(err) || UI.SUPPLIER_DELETE_FAILED || "Failed to delete supplier");
    } finally {
      setDeletingSupplierId(null);
    }
  }, [supplierToDelete, fetchSummary, clearDeleteMessages]);

  const fetchDetail = useCallback(async () => {
    if (!selectedSupplier) return;

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
      params.append("page", paginationDetail.page);
      params.append("page_size", paginationDetail.page_size);

      const { data } = await apiService.get(`${endpoint}?${params.toString()}`, { 
        headers, 
        signal: controllerRef.current.signal,
        timeout: DEFAULTS.API_TIMEOUT 
      });

      const medicines = data?.data ?? [];
      
      // Map only the fields returned from API - Convert UTC to local time
 const mapped = medicines.map((medicine) => ({
  id: medicine.medicine_id,
  medicine_id: medicine.medicine_id,
  name: medicine.name || DEFAULTS.NOT_AVAILABLE,
  type: medicine.type || 'N/A',
  strength: medicine.strength || 'N/A',
  notes: medicine.notes || DEFAULTS.DASH,
  active: medicine.active || false,
  // Use the constant formatter
  last_updated: medicine.last_updated ? SUPPLIER_MODULE_CONSTANTS.formatDate(medicine.last_updated, true) : DEFAULTS.NOT_AVAILABLE,
  last_updated_raw: medicine.last_updated,
  status_display: medicine.active ? 'Active' : 'Inactive'
}));

      setDetailData(mapped);
      setPaginationDetail(p => ({ 
        ...p, 
        total: data?.pagination?.total_records || mapped.length 
      }));
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(getErrorMessage(err));
      setDetailData([]);
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedSupplier, selectedBranch, paginationDetail.page, paginationDetail.page_size, userInfo.currentVendorId, userInfo.originalBranchId, childVendors]);

  const handleDeleteMedicine = useCallback(async (medicine) => {
    if (!selectedSupplier || !medicine) return;
    
    setDeletingMedicineId(medicine.medicine_id);
    clearDeleteMessages();

    try {
      const token = getToken();
      const headers = getAuthHeaders(token);

      const deleteUrl = apiEndpoints.deletesuppmedicine(
        selectedSupplier.supplier_id,
        medicine.medicine_id
      );

      const { data } = await apiService.delete(deleteUrl, { headers });

      if (data && data.message) {
        setDeleteSuccess(data.message);
      } else {
        setDeleteSuccess(UI.MEDICINE_REMOVED);
      }

      await fetchDetail();

    } catch (err) {
      console.error("Error deleting medicine:", err);
      setDeleteError(getErrorMessage(err) || UI.MEDICINE_REMOVE_FAILED);
    } finally {
      setDeletingMedicineId(null);
    }
  }, [selectedSupplier, fetchDetail, clearDeleteMessages]);

  // Create Supplier
  const handleCreateSupplier = useCallback(async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    clearModalMessages();

    try {
      const token = getToken();
      const headers = getAuthHeaders(token);

      const payload = [{
        name: formData.name,
        company_name: formData.company_name,
        contact_email: formData.contact_email,
        address: formData.address,
        phone: formData.phone,
        notes: formData.notes,
        vendor_id: userInfo.currentVendorId,
        medicines: formData.medicines.map(m => ({
          medicine_id: m.medicine_id,
          name: m.name,
          type: m.type,
          strength: m.strength,
          notes: m.notes || "",
          active: true
        }))
      }];

      await apiService.post(
        apiEndpoints.createSupplier(true),
        payload,
        { headers }
      );

      setModalSuccess(UI.SUPPLIER_CREATED);
      setTimeout(() => {
        setShowCreateModal(false);
        resetForm();
        fetchSummary();
      }, DEFAULTS.MODAL_CLOSE_DELAY);
    } catch (err) {
      if (err.response?.data?.data && Array.isArray(err.response.data.data)) {
        const failedSupplier = err.response.data.data[0];
        if (failedSupplier && failedSupplier.message) {
          setModalError(failedSupplier.message);
        } else {
          setModalError(getErrorMessage(err));
        }
      } else {
        setModalError(getErrorMessage(err) || UI.CREATE_FAILED);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, userInfo.currentVendorId, resetForm, fetchSummary, clearModalMessages, validateForm]);

  const handleEditSupplierClick = useCallback((supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || "",
      company_name: supplier.company_name || "",
      contact_email: supplier.contact_email || "",
      address: supplier.address || "",
      phone: supplier.phone || "",
      notes: supplier.notes || "",
      medicines: [] // Start with empty medicines array for edit mode
    });
    setFormErrors({
      contact_email: "",
      phone: ""
    });
    setShowEditModal(true);
    clearModalMessages();
  }, [clearModalMessages]);

  // Edit Supplier
  const handleEditSupplier = useCallback(async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    clearModalMessages();

    try {
      const token = getToken();
      const headers = getAuthHeaders(token);

      const payload = [{
        name: formData.name,
        company_name: formData.company_name,
        contact_email: formData.contact_email,
        address: formData.address,
        phone: formData.phone,
        notes: formData.notes,
        vendor_id: userInfo.currentVendorId,
        supplier_id: editingSupplier.supplier_id,
        medicines: formData.medicines.map(m => ({
          medicine_id: m.medicine_id,
          name: m.name,
          type: m.type,
          strength: m.strength,
          notes: m.notes || "",
          active: true
        }))
      }];

      await apiService.put(
        apiEndpoints.editSupplier,
        payload,
        { headers }
      );

      setModalSuccess(UI.SUPPLIER_UPDATED);
      setTimeout(() => {
        setShowEditModal(false);
        setEditingSupplier(null);
        resetForm();
        fetchSummary();
        if (selectedSupplier && selectedSupplier.supplier_id === editingSupplier.supplier_id) {
          fetchDetail();
        }
      }, DEFAULTS.MODAL_CLOSE_DELAY);
    } catch (err) {
      if (err.response?.data?.data && Array.isArray(err.response.data.data)) {
        const failedSupplier = err.response.data.data[0];
        if (failedSupplier && failedSupplier.message) {
          setModalError(failedSupplier.message);
        } else {
          setModalError(getErrorMessage(err));
        }
      } else {
        setModalError(getErrorMessage(err) || UI.UPDATE_FAILED);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingSupplier, userInfo.currentVendorId, resetForm, fetchSummary, fetchDetail, selectedSupplier, clearModalMessages, validateForm]);

  // Handle medicine select
  const handleMedicineSelect = useCallback((medicines) => {
    const medicinesArray = Array.isArray(medicines) ? medicines : [medicines];
    
    setFormData(prev => ({
      ...prev,
      medicines: [...prev.medicines, ...medicinesArray]
    }));
  }, []);

  const handleMedicineRemove = useCallback((medicineKey) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.filter(m => {
        const currentKey = `${m.medicine_id}-${m.strength}-${m.type}`;
        return currentKey !== medicineKey;
      })
    }));
  }, []);

  const handleEmailChange = useCallback((e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, contact_email: value }));
    
    // Real-time validation
    if (value && !validateEmail(value)) {
      setFormErrors(prev => ({ ...prev, contact_email: "Please enter a valid email address" }));
    } else {
      setFormErrors(prev => ({ ...prev, contact_email: "" }));
    }
  }, []);

  const handlePhoneChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, phone: value }));
    
    // Real-time validation
    if (value && !validatePhone(value)) {
      setFormErrors(prev => ({ ...prev, phone: "Please enter a valid phone number" }));
    } else {
      setFormErrors(prev => ({ ...prev, phone: "" }));
    }
  }, []);

  // Dynamic title - FIXED: Responsive
  const dynamicTitle = useMemo(() => {
    const branchLabel = selectedBranchValue === userInfo.currentVendorId 
      ? userInfo.currentBusinessName 
      : branchOptions.find(opt => opt.value === selectedBranchValue)?.label || UI.ALL_BRANCHES;
    const isMainBranch = selectedBranchValue === userInfo.currentVendorId || !selectedBranchValue;

    return (
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 pr-16 sm:pr-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-xl sm:text-2xl font-bold text-gray-800">{UI.SUPPLIER_DETAILS}</span>
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
    if (selectedSupplier) return;

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
  }, [selectedSupplier, searchTerm, paginationSummary.page, paginationSummary.page_size, selectedBranchValue, fetchSummary]);

  useEffect(() => {
    if (selectedSupplier) {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      fetchDetail();
    }
  }, [selectedSupplier, paginationDetail.page, paginationDetail.page_size, fetchDetail]);

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
      if (modalSuccessTimeoutRef.current) {
        clearTimeout(modalSuccessTimeoutRef.current);
      }
      if (modalErrorTimeoutRef.current) {
        clearTimeout(modalErrorTimeoutRef.current);
      }
      if (deleteSuccessTimeoutRef.current) {
        clearTimeout(deleteSuccessTimeoutRef.current);
      }
      if (deleteErrorTimeoutRef.current) {
        clearTimeout(deleteErrorTimeoutRef.current);
      }
    };
  }, []);

  const handleFilterChange = useCallback((name, value) => {
    if (name === "branch") {
      setSelectedBranchValue(value || "");
      setPaginationSummary(p => ({ ...p, page: DEFAULTS.PAGE }));
      return;
    }
    
    if (name === "search") {
      setSearchTerm(value);
      setPaginationSummary(p => ({ ...p, page: DEFAULTS.PAGE }));
      return;
    }
  }, []);

  const handleViewClick = useCallback((row) => {
    const original = row.original;
    
    const branchInfo = getBranchInfo(selectedBranchValue, userInfo, childVendors);
    
    setSelectedSupplier(original);
    setSelectedBranch(branchInfo);
    setPaginationDetail({ page: DEFAULTS.PAGE, page_size: DEFAULTS.PAGE_SIZE, total: 0 });
  }, [selectedBranchValue, userInfo, childVendors]);

  const handleBack = useCallback(() => {
    setSelectedSupplier(null);
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
    if (selectedSupplier) fetchDetail();
    else fetchSummary();
  }, [selectedSupplier, fetchDetail, fetchSummary]);

  const handlePageRefresh = useCallback(() => {
    if (selectedSupplier) {
      fetchDetail();
    } else {
      fetchSummary();
    }
  }, [selectedSupplier, fetchDetail, fetchSummary]);

  // Filter fields - FIXED: Responsive
  const summaryFilterFields = useMemo(() => 
    getSupplierFilterFields(searchTerm, selectedBranchValue, handleFilterChange, userInfo.isMaster, branchOptions).map(field => ({
      ...field,
      className: "w-full sm:w-auto"
    })),
    [searchTerm, selectedBranchValue, handleFilterChange, userInfo.isMaster, branchOptions]
  );

  // Summary columns - FIXED: Actions column at the end with View and Delete buttons
  const summaryColumns = useMemo(() => [
    {
      accessorKey: "name",
      header: ({ column }) => <HeaderWithSort column={column} title={UI.CONTACT_PERSON} />,
      cell: ({ row }) => <div className="font-medium text-gray-900 text-xs sm:text-sm">{row.original.name}</div>,
    },
    {
      accessorKey: "company_name",
      header: ({ column }) => <HeaderWithSort column={column} title={UI.COMPANY_NAME} />,
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.company_name}</div>,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => <HeaderWithSort column={column} title={UI.PHONE} />,
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.phone}</div>,
    },
    {
      accessorKey: "contact_email",
      header: UI.EMAIL,
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.contact_email}</div>,
    },
    {
      accessorKey: "address",
      header: UI.ADDRESS,
      cell: ({ row }) => {
        const address = row.original.address;
        return (
          <HoverTooltip 
            preview={address?.substring(0, 15) + '...'} 
            full={address} 
            title={TOOLTIP_TITLES.SUPPLIER_ADDRESS}
            className="text-xs sm:text-sm"
          />
        );
      }
    },
    {
      accessorKey: "notes",
      header: UI.NOTES,
      cell: ({ row }) => {
        const notes = row.original.notes;
        return (
          <HoverTooltip 
            preview={notes?.substring(0, 15) + '...'} 
            full={notes} 
            title={TOOLTIP_TITLES.SUPPLIER_NOTES}
            className="text-xs sm:text-sm"
          />
        );
      }
    },
    {
      accessorKey: "created_date",
      header: UI.CREATED_DATE,
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.created_date}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-center text-xs sm:text-sm">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-center gap-2">
          {/* View Button */}
          <ButtonTooltip tooltipText={UI.VIEW_SUPPLIER_ORDERS} position="top">
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleViewClick(row);
              }}
              className="!p-1 sm:!p-2 !min-w-0"
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </ButtonTooltip>
          
          {/* Delete Button */}
          <ButtonTooltip tooltipText="Delete Supplier" position="top">
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSupplierToDelete(row.original);
                setShowDeleteConfirm(true);
              }}
              disabled={deletingSupplierId === row.original.supplier_id}
              loading={deletingSupplierId === row.original.supplier_id}
              loadingText=""
              className="!p-1 sm:!p-2 !min-w-0"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </ButtonTooltip>
        </div>
      ),
      enableSorting: false,
    }
  ], [handleViewClick, deletingSupplierId]);

  // Detail columns - FIXED: Responsive with proper status display for export
  const detailColumns = useMemo(() => [
    { 
      accessorKey: "name", 
      header: ({ column }) => <HeaderWithSort column={column} title={UI.MEDICINE_NAME} />, 
      cell: ({ row }) => <div className="font-bold text-blue-700 text-xs sm:text-sm">{row.original.name}</div> 
    },
    { 
      accessorKey: "type", 
      header: "Type", 
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.type}</div>
    },
    { 
      accessorKey: "strength", 
      header: "Strength", 
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.strength}</div>
    },
    { 
      accessorKey: "notes", 
      header: UI.NOTES, 
      cell: ({ row }) => <div className="text-xs sm:text-sm max-w-[80px] sm:max-w-xs truncate">{row.original.notes}</div> 
    },
    { 
      accessorKey: "active", 
      header: UI.STATUS, 
      cell: ({ row }) => {
        const statusText = row.original.active ? 'Active' : 'Inactive';
        const statusClass = row.original.active 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800';
        return (
          <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${statusClass}`}>
            {statusText}
          </span>
        );
      },
      exportFormatter: (value, row) => {
        return row.original.active ? 'Active' : 'Inactive';
      }
    },
    { 
      accessorKey: "last_updated", 
      header: "Last Updated", 
      cell: ({ row }) => {
        return <div className="text-xs sm:text-sm">
          {row.original.last_updated}
          <span className="hidden sm:inline text-gray-400 text-[10px] ml-1">
            ({Intl.DateTimeFormat().resolvedOptions().timeZone})
          </span>
        </div>;
      }
    },
    {
      id: "actions",
      header: () => <div className="text-center text-xs sm:text-sm">{UI.ACTIONS}</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <ButtonTooltip tooltipText={UI.REMOVE_MEDICINE} position="top">
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteMedicine(row.original)}
              disabled={deletingMedicineId === row.original.medicine_id}
              loading={deletingMedicineId === row.original.medicine_id}
              loadingText=""
              className="!p-1 sm:!p-2 !min-w-0"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </ButtonTooltip>
        </div>
      ),
      enableSorting: false,
      export: false
    }
  ], [handleDeleteMedicine, deletingMedicineId]);

  // Prepare data for export with proper formatting
  const exportData = useMemo(() => {
    return detailData.map(item => ({
      name: item.name,
      type: item.type,
      strength: item.strength,
      notes: item.notes,
      Status: item.active ? 'Active' : 'Inactive',
      last_updated: item.last_updated,
      active: item.active ? 'Active' : 'Inactive'
    }));
  }, [detailData]);

  const exportEndpoint = useMemo(() => {
    if (!selectedSupplier) return null;
    
    const params = new URLSearchParams();
    params.append("supplierId", selectedSupplier.supplier_id);
    params.append("itemsOnly", "True");
    
    return `${apiEndpoints.supplierList}?${params.toString()}`;
  }, [selectedSupplier]);

  return (
    <div className="relative">
      {/* Export Button - FIXED: Responsive positioning */}
      {selectedSupplier && exportEndpoint && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
          <ExportReports 
            endpoint={exportEndpoint} 
            data={exportData} 
            reportType="Supplier Medicines" 
            loading={loadingDetail} 
            setLoading={setLoadingDetail} 
            setError={setError} 
          />
        </div>
      )}

      {/* Alerts - FIXED: Responsive margins */}
      {successMessage && !selectedSupplier && (
        <Alert
          variant="success"
          message={successMessage}
          className="mb-4 mx-2 sm:mx-4"
        />
      )}

      {error && !selectedSupplier && (
        <Alert
          variant="error"
          message={error}
          action={handleRetry}
          actionLabel={UI.RETRY}
          onClose={() => setError(null)}
          className="mb-4 mx-2 sm:mx-4"
        />
      )}

      {!selectedSupplier && deleteSuccess && (
        <Alert
          variant="success"
          message={deleteSuccess}
          onClose={() => setDeleteSuccess(null)}
          className="mb-4 mx-2 sm:mx-4"
        />
      )}

      {!selectedSupplier && deleteError && (
        <Alert
          variant="error"
          message={deleteError}
          onClose={() => setDeleteError(null)}
          className="mb-4 mx-2 sm:mx-4"
        />
      )}

      {selectedSupplier && (
        <>
          {/* DETAIL VIEW */}
          <div className="mb-6 px-2 sm:px-4">
            <Button
              variant="secondary"
              onClick={handleBack}
              className="inline-flex items-center gap-2 w-full sm:w-auto"
            >
              <span>←</span>
              <span className="hidden sm:inline">{UI.BACK_TO_SUPPLIERS}</span>
            </Button>
          </div>

          <Card className="mb-6 mx-2 sm:mx-4" bodyClassName="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">{UI.MEDICINES_SUPPLIED}</h2>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {UI.SUPPLIER_NAME}: <span className="font-semibold text-green-700">
                      {selectedSupplier.name} {selectedSupplier.company_name && `(${selectedSupplier.company_name})`}
                    </span>
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                    {UI.PHONE}: {selectedSupplier.phone} | {UI.EMAIL}: {selectedSupplier.contact_email}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <ButtonTooltip tooltipText={UI.EDIT_SUPPLIER} position="top">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditSupplierClick(selectedSupplier)}
                    className="inline-flex items-center gap-1 w-full sm:w-auto text-xs sm:text-sm px-3 py-2"
                  >
                    <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="sm:inline">{UI.EDIT_SUPPLIER}</span>
                  </Button>
                </ButtonTooltip>
                <div className="text-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 rounded-lg w-full sm:w-auto">
                  <p className="text-xs text-blue-700 whitespace-nowrap">{UI.TOTAL_MEDICINES}</p>
                  <p className="text-base sm:text-xl font-bold text-blue-800">{paginationDetail.total}</p>
                </div>
              </div>
            </div>
          </Card>

          {deleteSuccess && (
            <Alert
              variant="success"
              message={deleteSuccess}
              onClose={() => setDeleteSuccess(null)}
              className="mb-4 mx-2 sm:mx-4"
            />
          )}

          {deleteError && (
            <Alert
              variant="error"
              message={deleteError}
              onClose={() => setDeleteError(null)}
              className="mb-4 mx-2 sm:mx-4"
            />
          )}

          <HomeTable
            data={detailData}
            columns={detailColumns}
            loading={loadingDetail}
            pagination={paginationDetail}
            onPaginationChange={handlePaginationDetail}
            serverSideFiltering={true}
            error={error}
            onRetry={handleRetry}
            hideDefaultActions
            noDataMessage={UI.NO_MEDICINES_LINKED}
          />
        </>
      )}

      {!selectedSupplier && (
        <>
          {/* SUMMARY VIEW */}
          <Card className="mb-6 mx-2 sm:mx-4" bodyClassName="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
              {dynamicTitle}
              <div className="flex flex-row flex-wrap gap-2 sm:gap-3 justify-end w-full sm:w-auto">
                <Button
                  variant="primary"
                  onClick={() => {
                    resetForm();
                    clearModalMessages();
                    setShowCreateModal(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base px-4 py-2"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{UI.ADD_SUPPLIER}</span>
                </Button>
                <Button
                  variant="secondary"
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
            noDataMessage={UI.NO_SUPPLIERS}
          />
        </>
      )}

    {/* CREATE SUPPLIER MODAL - FIXED: Responsive */}
{/* CREATE SUPPLIER MODAL - FIXED: Responsive */}
<Modal
  isOpen={showCreateModal}
  onClose={() => {
    setShowCreateModal(false);
    resetForm();
    clearModalMessages();
  }}
  title={UI.CREATE_SUPPLIER}
  size="lg"
  className="max-h-[90vh] overflow-y-auto"
>
  <div className="p-4 sm:p-6">
    {modalSuccess && (
      <div className="mb-4 sm:mb-6">
        <Alert variant="success" message={modalSuccess} />
      </div>
    )}
    
    {modalError && (
      <div className="mb-4 sm:mb-6">
        <Alert variant="error" message={modalError} />
      </div>
    )}
    
    <form onSubmit={handleCreateSupplier}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <InputText
          label={UI.CONTACT_PERSON}
          name="name"
          value={formData.name}
          onChange={(e) => {
            // Only allow alphabets, spaces, and hyphens
            const value = e.target.value;
            if (/^[a-zA-Z\s\-]*$/.test(value)) {
              setFormData({ ...formData, name: value });
            }
          }}
          onKeyDown={(e) => {
            // Prevent numbers
            if (e.key >= '0' && e.key <= '9') {
              e.preventDefault();
            }
          }}
          required={true}
          placeholder="Enter contact person name (alphabets only)"
          error={formData.name && /[0-9]/.test(formData.name) ? { message: "Name should only contain alphabets" } : null}
          className="w-full"
          inputClassName="text-sm sm:text-base py-2"
        />

        <InputText
          label={UI.COMPANY_NAME}
          name="company_name"
          value={formData.company_name}
          onChange={(e) => {
            // Only allow alphabets, spaces, hyphens, and ampersand
            const value = e.target.value;
            if (/^[a-zA-Z\s\-\&]*$/.test(value)) {
              setFormData({ ...formData, company_name: value });
            }
          }}
          onKeyDown={(e) => {
            // Prevent numbers
            if (e.key >= '0' && e.key <= '9') {
              e.preventDefault();
            }
          }}
          required={true}
          placeholder="Enter company name (alphabets only)"
          error={formData.company_name && /[0-9]/.test(formData.company_name) ? { message: "Company name should only contain alphabets" } : null}
          className="w-full"
          inputClassName="text-sm sm:text-base py-2"
        />

        <InputText
          label={UI.EMAIL}
          name="contact_email"
          type="email"
          value={formData.contact_email}
          onChange={handleEmailChange}
          error={formErrors.contact_email ? { message: formErrors.contact_email } : null}
          required={true}
          placeholder="contact@company.com"
          className="w-full"
          inputClassName="text-sm sm:text-base py-2"
        />

        <InputPhone
          label={UI.PHONE}
          name="phone"
          value={formData.phone}
          onChange={handlePhoneChange}
          error={formErrors.phone ? { message: formErrors.phone } : null}
          required={true}
          placeholder="+1 234 567 8900"
          className="w-full"
          inputClassName="text-sm sm:text-base py-2"
        />

        <InputTextarea
          label={UI.ADDRESS}
          name="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={2}
          required={true}
          placeholder="Street address, city, state, ZIP code"
          className="col-span-1 sm:col-span-2"
          inputClassName="text-sm sm:text-base"
        />

        <InputTextarea
          label={UI.NOTES}
          name="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          placeholder="Additional notes or special instructions"
          className="col-span-1 sm:col-span-2"
          inputClassName="text-sm sm:text-base"
        />
      </div>

      <div className="mb-6">
        <h4 className="font-bold text-base sm:text-lg text-gray-800 mb-3 sm:mb-4">{UI.LINK_MEDICINES}</h4>
        <MedicineSearch
          onSelect={handleMedicineSelect}
          selectedMedicines={formData.medicines}
          onRemove={handleMedicineRemove}
        />
      </div>

      {formData.medicines.length > 0 && (
        <div className="mb-6">
          <h4 className="font-bold text-base sm:text-lg text-gray-800 mb-3 sm:mb-4">{UI.SELECTED_MEDICINES}</h4>
          <MedicineList
            medicines={formData.medicines}
            onRemove={handleMedicineRemove}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setShowCreateModal(false);
            resetForm();
            clearModalMessages();
          }}
          className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8"
        >
          {UI.CANCEL}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          loading={isSubmitting}
          loadingText={UI.CREATING}
          className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8"
        >
          {UI.ADD_SUPPLIER}
        </Button>
      </div>
    </form>
  </div>
</Modal>

   {/* EDIT SUPPLIER MODAL - FIXED: Responsive */}
<Modal
  isOpen={showEditModal}
  onClose={() => {
    setShowEditModal(false);
    setEditingSupplier(null);
    resetForm();
    clearModalMessages();
  }}
  title={UI.EDIT_SUPPLIER}
  size="lg"
  className="max-h-[90vh] overflow-y-auto"
>
  <div className="p-4 sm:p-6">
    {modalSuccess && (
      <div className="mb-4 sm:mb-6">
        <Alert variant="success" message={modalSuccess} />
      </div>
    )}
    
    {modalError && (
      <div className="mb-4 sm:mb-6">
        <Alert variant="error" message={modalError} />
      </div>
    )}
    
    <form onSubmit={handleEditSupplier}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <InputText
          label={UI.CONTACT_PERSON}
          name="name"
          value={formData.name}
          onChange={(e) => {
            // Only allow alphabets, spaces, and hyphens
            const value = e.target.value;
            if (/^[a-zA-Z\s\-]*$/.test(value)) {
              setFormData({ ...formData, name: value });
            }
          }}
          onKeyDown={(e) => {
            // Prevent numbers
            if (e.key >= '0' && e.key <= '9') {
              e.preventDefault();
            }
          }}
          required={true}
          placeholder="Enter contact person name (alphabets only)"
          error={formData.name && /[0-9]/.test(formData.name) ? { message: "Name should only contain alphabets" } : null}
          className="w-full"
          inputClassName="text-sm sm:text-base py-2"
        />

        <InputText
          label={UI.COMPANY_NAME}
          name="company_name"
          value={formData.company_name}
          onChange={(e) => {
            // Only allow alphabets, spaces, hyphens, and ampersand
            const value = e.target.value;
            if (/^[a-zA-Z\s\-\&]*$/.test(value)) {
              setFormData({ ...formData, company_name: value });
            }
          }}
          onKeyDown={(e) => {
            // Prevent numbers
            if (e.key >= '0' && e.key <= '9') {
              e.preventDefault();
            }
          }}
          required={true}
          placeholder="Enter company name (alphabets only)"
          error={formData.company_name && /[0-9]/.test(formData.company_name) ? { message: "Company name should only contain alphabets" } : null}
          className="w-full"
          inputClassName="text-sm sm:text-base py-2"
        />

        <InputText
          label={UI.EMAIL}
          name="contact_email"
          type="email"
          value={formData.contact_email}
          onChange={handleEmailChange}
          error={formErrors.contact_email ? { message: formErrors.contact_email } : null}
          required={true}
          placeholder="contact@company.com"
          className="w-full"
          inputClassName="text-sm sm:text-base py-2"
        />

        <InputPhone
          label={UI.PHONE}
          name="phone"
          value={formData.phone}
          onChange={handlePhoneChange}
          error={formErrors.phone ? { message: formErrors.phone } : null}
          required={true}
          placeholder="+1 234 567 8900"
          className="w-full"
          inputClassName="text-sm sm:text-base py-2"
        />

        <InputTextarea
          label={UI.ADDRESS}
          name="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={2}
          required={true}
          placeholder="Street address, city, state, ZIP code"
          className="col-span-1 sm:col-span-2"
          inputClassName="text-sm sm:text-base"
        />

        <InputTextarea
          label={UI.NOTES}
          name="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          placeholder="Additional notes or special instructions"
          className="col-span-1 sm:col-span-2"
          inputClassName="text-sm sm:text-base"
        />
      </div>

      <div className="mb-6">
        <h4 className="font-bold text-base sm:text-lg text-gray-800 mb-3 sm:mb-4">{UI.ADD_MEDICINES}</h4>
        
        <div className="mb-6">
          <MedicineSearch
            onSelect={handleMedicineSelect}
            selectedMedicines={formData.medicines}
            onRemove={handleMedicineRemove}
          />
        </div>
      </div>

      {formData.medicines.length > 0 && (
        <div className="mb-6">
          <h4 className="font-bold text-base sm:text-lg text-gray-800 mb-3 sm:mb-4">{UI.SELECTED_MEDICINES}</h4>
          <MedicineList
            medicines={formData.medicines}
            onRemove={handleMedicineRemove}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setShowEditModal(false);
            setEditingSupplier(null);
            resetForm();
            clearModalMessages();
          }}
          className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8"
        >
          {UI.CANCEL}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          loading={isSubmitting}
          loadingText={UI.UPDATING}
          className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8"
        >
          {UI.EDIT_SUPPLIER}
        </Button>
      </div>
    </form>
  </div>
</Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSupplierToDelete(null);
        }}
        title="Delete Supplier"
        size="sm"
      >
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <p className="text-gray-700 text-sm sm:text-base">
              Are you sure you want to delete supplier <span className="font-bold text-red-600">"{supplierToDelete?.name}"</span>?
            </p>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">
              This action cannot be undone. All medicines linked to this supplier will be unlinked.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowDeleteConfirm(false);
                setSupplierToDelete(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteSupplier}
              disabled={deletingSupplierId !== null}
              loading={deletingSupplierId !== null}
              loadingText="Deleting..."
              className="w-full sm:w-auto"
            >
              Delete Supplier
            </Button>
          </div>
        </div>
      </Modal>
    </div> 
  );
}