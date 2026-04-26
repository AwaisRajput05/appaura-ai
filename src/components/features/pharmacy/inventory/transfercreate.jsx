// transfercreate.jsx - FINAL VERSION WITH CHECKBOXES AT END
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import { getToken } from '../../../../services/tokenUtils';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/endpoint/inventory/inventoryEnd';
import { NO_RECORD_FOUND } from '../../../constants/Messages';
import { useAuth } from '../../../auth/hooks/useAuth';
import { Package, RefreshCw, Eye } from 'lucide-react';
import { getVendorChildIds } from '../../../../services/vendorUtils';
import INVENTORY_MODULE_CONSTANTS from './inventoryconstants/inventoryModuleConstants';
import Button from '../../../../components/ui/forms/Button';
import InputSelect from '../../../../components/ui/forms/InputSelect'; 

export default function TransferRequest() {
  // Refs for cleanup
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const isInitialMount = useRef(true);
  
  const { user } = useAuth();

  // State
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Branch state
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedBranchesPayload, setSelectedBranchesPayload] = useState([]);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

  // Selection state
  const [selectedRows, setSelectedRows] = useState({});
  const [selectAll, setSelectAll] = useState(false);

  // Transfer Request Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [transferQuantities, setTransferQuantities] = useState({});
  const [transferNotes, setTransferNotes] = useState("");
  const [sourceBranchId, setSourceBranchId] = useState("");
  const [targetBranchId, setTargetBranchId] = useState("");
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [transferError, setTransferError] = useState(null);
  const [transferSuccess, setTransferSuccess] = useState(null);
  const [branchSelectionError, setBranchSelectionError] = useState(null);

  // Get user info using constants
  const { 
    currentVendorId, 
    originalBranchId, 
    isMaster, 
    currentBusinessName 
  } = INVENTORY_MODULE_CONSTANTS.getUserInfo(user);
  
  const childVendors = getVendorChildIds() || [];

  // Get current user info from localStorage
  const currentUserVendorId = localStorage.getItem('vendorId') || currentVendorId;
  const currentUserBusinessName = localStorage.getItem('businessName') || currentBusinessName;

  // Initialize branch payload
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
      INVENTORY_MODULE_CONSTANTS.cancelApiRequest(controllerRef);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ========== MEMOIZED VALUES FIRST ==========
  const baseEndpoint = useMemo(() => apiEndpoints.transferinventory('', 1, 10).split('?')[0], []);

  // Branch name mapping
  const branchNameMap = useMemo(() => {
    const map = { [originalBranchId]: currentBusinessName };
    childVendors.forEach(item => {
      map[item.branch_id] = item.business_name;
    });
    return map;
  }, [childVendors, originalBranchId, currentBusinessName]);

  // Branch options for main dropdown
  const fullBranchOptions = useMemo(() => 
    INVENTORY_MODULE_CONSTANTS.getBranchOptionsWithAll(user, childVendors), 
    [childVendors, user]
  );

  // All branch options for source/target dropdowns
  const allBranchOptions = useMemo(() => {
    const options = [];
    
    if (currentUserVendorId && currentUserBusinessName) {
      options.push({
        value: currentUserVendorId,
        label: `${currentUserBusinessName} (Main Branch)`,
        branch_id: originalBranchId,
        vendor_id: currentUserVendorId,
        isMain: true
      });
    }
    
    childVendors.forEach(item => {
      options.push({
        value: item.vendor_id,
        label: item.business_name,
        branch_id: item.branch_id,
        vendor_id: item.vendor_id,
        isMain: false
      });
    });
    
    return options;
  }, [childVendors, currentUserVendorId, currentUserBusinessName, originalBranchId]);

  // Source branch options
  const sourceBranchOptions = useMemo(() => {
    return allBranchOptions;
  }, [allBranchOptions]);

  // Target branch options
  const targetBranchOptions = useMemo(() => {
    return allBranchOptions.filter(option => 
      option.value !== sourceBranchId
    );
  }, [allBranchOptions, sourceBranchId]);

  // Export parameters
  const exportParams = useMemo(() => ({
    drugName: searchTerm.trim() || undefined,
    page: 1,
    page_size: 1000
  }), [searchTerm]);

  const exportBody = selectedBranchesPayload;

  // ========== STABLE FUNCTION REFERENCES ==========
  // Use useRef to store stable function references that don't change
  const fetchDrugsRef = useRef(async () => {
    const fetchId = ++fetchIdRef.current;
    
    INVENTORY_MODULE_CONSTANTS.cancelApiRequest(controllerRef);
    controllerRef.current = new AbortController();

    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      };

      const params = {
        drugName: searchTerm.trim() || undefined,
        page: pagination.page,
        page_size: pagination.page_size
      };

      const { data } = await apiService.post(baseEndpoint, selectedBranchesPayload, {
        headers,
        params,
        signal: controllerRef.current.signal,
        timeout: INVENTORY_MODULE_CONSTANTS.API_TIMEOUT
      });

      if (!isMountedRef.current || fetchId !== fetchIdRef.current) return;

      if (data.status === "success" && Array.isArray(data.data)) {
        const flattened = [];

        data.data.forEach(medicine => {
          const {
            medicine_id,
            name,
            type = "tablet",
            availabilities = [],
            availability = "not_in_stock",
            strength,
            manufacturer,
            batch_code,
            expiry_date,
            sale_price,
            stock,
            packing,
            uses,
            purpose,
            dosage,
            warnings,
            side_effects,
            branch_id,
            vendor_id,
            unit_type = ""
          } = medicine;

          const isOutOfStock = availabilities.length === 0 && availability === "not_in_stock";

          if (isOutOfStock) {
            flattened.push({
              id: `${medicine_id}-nostock`,
              medicine_id,
              drug_name: name || "Unknown",
              manufacturer: "—",
              form: type.toLowerCase(),
              strength: "—",
              batch_code: "—",
              sale_price: 0,
              stock: 0,
              expiry_date: "—",
              packing_display: "—",
              prescriptions_required: "—",
              age_restrictions: "—",
              uses: uses || "",
              purpose: purpose || "",
              dosage: dosage || "",
              warnings: warnings || "",
              side_effects: side_effects || "",
              availability: "not_in_stock",
              raw_batch_code: null,
              raw_manufacturer: null,
              raw_expiry_date: null,
              branch_id: branch_id || null,
              branch_name: branchNameMap[branch_id] || branch_id || "N/A",
              vendor_id: vendor_id || null,
              type: type,
              packing: packing || {},
              unit_type: unit_type
            });
          } else if (availabilities.length > 0) {
            availabilities.forEach((avail, index) => {
              const strength = avail.strength || "—";
              const manufacturer = avail.manufacturer || "—";
              const batch_code = avail.batch_code || "—";
              const expiry_date = avail.expiry_date?.split(" ")[0] || "—";

              flattened.push({
                id: `${medicine_id}-${batch_code}-${index}`,
                medicine_id,
                drug_name: name || "Unknown",
                manufacturer,
                form: type.toLowerCase(),
                strength,
                batch_code,
                sale_price: Number(avail.sale_price) || 0,
                stock: Number(avail.stock) || 0,
                expiry_date,
                packing_display: INVENTORY_MODULE_CONSTANTS.formatPacking(avail.packing),
                prescriptions_required: "—",
                age_restrictions: "—",
                uses: uses || "",
                purpose: purpose || "",
                dosage: dosage || "",
                warnings: warnings || "",
                side_effects: side_effects || "",
                availability: "in_stock",
                raw_batch_code: batch_code,
                raw_manufacturer: manufacturer,
                raw_expiry_date: avail.expiry_date,
                branch_id: branch_id || null,
                branch_name: branchNameMap[branch_id] || branch_id || "N/A",
                vendor_id: vendor_id || null,
                type: type,
                packing: avail.packing || {},
                unit_type: unit_type
              });
            });
          } else {
            const flatStrength = strength || "—";
            const flatManufacturer = manufacturer || "—";
            const flatBatchCode = batch_code || "—";
            const flatExpiryDate = expiry_date?.split(" ")[0] || "—";
            const flatSalePrice = Number(sale_price) || 0;
            const flatStock = Number(stock) || 0;
            const flatPackingDisplay = INVENTORY_MODULE_CONSTANTS.formatPacking(packing);

            flattened.push({
              id: `${medicine_id}-${flatBatchCode}-0`,
              medicine_id,
              drug_name: name || "Unknown",
              manufacturer: flatManufacturer,
              form: type.toLowerCase(),
              strength: flatStrength,
              batch_code: flatBatchCode,
              sale_price: flatSalePrice,
              stock: flatStock,
              expiry_date: flatExpiryDate,
              packing_display: flatPackingDisplay,
              prescriptions_required: "—",
              age_restrictions: "—",
              uses: uses || "",
              purpose: purpose || "",
              dosage: dosage || "",
              warnings: warnings || "",
              side_effects: side_effects || "",
              availability: availability,
              raw_batch_code: flatBatchCode,
              raw_manufacturer: flatManufacturer,
              raw_expiry_date: expiry_date,
              branch_id: branch_id || null,
              branch_name: branchNameMap[branch_id] || branch_id || "N/A",
              vendor_id: vendor_id || null,
              type: type,
              packing: packing || {},
              unit_type: unit_type
            });
          }
        });

        setDrugs(flattened);
        setSelectedRows({});
        setSelectAll(false);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total_records || 0
        }));
      } else {
        setDrugs([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      }
    } catch (err) {
      if (!isMountedRef.current || fetchId !== fetchIdRef.current) return;
      INVENTORY_MODULE_CONSTANTS.handleApiError(err, setError);
      setDrugs([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      if (isMountedRef.current && fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  });

  // Update the ref function when dependencies change
  useEffect(() => {
    fetchDrugsRef.current = async () => {
      const fetchId = ++fetchIdRef.current;
      
      INVENTORY_MODULE_CONSTANTS.cancelApiRequest(controllerRef);
      controllerRef.current = new AbortController();

      try {
        if (!isMountedRef.current) return;
        setLoading(true);
        setError(null);

        const token = getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        };

        const params = {
          drugName: searchTerm.trim() || undefined,
          page: pagination.page,
          page_size: pagination.page_size
        };

        const { data } = await apiService.post(baseEndpoint, selectedBranchesPayload, {
          headers,
          params,
          signal: controllerRef.current.signal,
          timeout: INVENTORY_MODULE_CONSTANTS.API_TIMEOUT
        });

        if (!isMountedRef.current || fetchId !== fetchIdRef.current) return;

        if (data.status === "success" && Array.isArray(data.data)) {
          const flattened = [];

          data.data.forEach(medicine => {
            const {
              medicine_id,
              name,
              type = "tablet",
              availabilities = [],
              availability = "not_in_stock",
              strength,
              manufacturer,
              batch_code,
              expiry_date,
              sale_price,
              stock,
              packing,
              uses,
              purpose,
              dosage,
              warnings,
              side_effects,
              branch_id,
              vendor_id,
              unit_type = ""
            } = medicine;

            const isOutOfStock = availabilities.length === 0 && availability === "not_in_stock";

            if (isOutOfStock) {
              flattened.push({
                id: `${medicine_id}-nostock`,
                medicine_id,
                drug_name: name || "Unknown",
                manufacturer: "—",
                form: type.toLowerCase(),
                strength: "—",
                batch_code: "—",
                sale_price: 0,
                stock: 0,
                expiry_date: "—",
                packing_display: "—",
                prescriptions_required: "—",
                age_restrictions: "—",
                uses: uses || "",
                purpose: purpose || "",
                dosage: dosage || "",
                warnings: warnings || "",
                side_effects: side_effects || "",
                availability: "not_in_stock",
                raw_batch_code: null,
                raw_manufacturer: null,
                raw_expiry_date: null,
                branch_id: branch_id || null,
                branch_name: branchNameMap[branch_id] || branch_id || "N/A",
                vendor_id: vendor_id || null,
                type: type,
                packing: packing || {},
                unit_type: unit_type
              });
            } else if (availabilities.length > 0) {
              availabilities.forEach((avail, index) => {
                const strength = avail.strength || "—";
                const manufacturer = avail.manufacturer || "—";
                const batch_code = avail.batch_code || "—";
                const expiry_date = avail.expiry_date?.split(" ")[0] || "—";

                flattened.push({
                  id: `${medicine_id}-${batch_code}-${index}`,
                  medicine_id,
                  drug_name: name || "Unknown",
                  manufacturer,
                  form: type.toLowerCase(),
                  strength,
                  batch_code,
                  sale_price: Number(avail.sale_price) || 0,
                  stock: Number(avail.stock) || 0,
                  expiry_date,
                  packing_display: INVENTORY_MODULE_CONSTANTS.formatPacking(avail.packing),
                  prescriptions_required: "—",
                  age_restrictions: "—",
                  uses: uses || "",
                  purpose: purpose || "",
                  dosage: dosage || "",
                  warnings: warnings || "",
                  side_effects: side_effects || "",
                  availability: "in_stock",
                  raw_batch_code: batch_code,
                  raw_manufacturer: manufacturer,
                  raw_expiry_date: avail.expiry_date,
                  branch_id: branch_id || null,
                  branch_name: branchNameMap[branch_id] || branch_id || "N/A",
                  vendor_id: vendor_id || null,
                  type: type,
                  packing: avail.packing || {},
                  unit_type: unit_type
                });
              });
            } else {
              const flatStrength = strength || "—";
              const flatManufacturer = manufacturer || "—";
              const flatBatchCode = batch_code || "—";
              const flatExpiryDate = expiry_date?.split(" ")[0] || "—";
              const flatSalePrice = Number(sale_price) || 0;
              const flatStock = Number(stock) || 0;
              const flatPackingDisplay = INVENTORY_MODULE_CONSTANTS.formatPacking(packing);

              flattened.push({
                id: `${medicine_id}-${flatBatchCode}-0`,
                medicine_id,
                drug_name: name || "Unknown",
                manufacturer: flatManufacturer,
                form: type.toLowerCase(),
                strength: flatStrength,
                batch_code: flatBatchCode,
                sale_price: flatSalePrice,
                stock: flatStock,
                expiry_date: flatExpiryDate,
                packing_display: flatPackingDisplay,
                prescriptions_required: "—",
                age_restrictions: "—",
                uses: uses || "",
                purpose: purpose || "",
                dosage: dosage || "",
                warnings: warnings || "",
                side_effects: side_effects || "",
                availability: availability,
                raw_batch_code: flatBatchCode,
                raw_manufacturer: flatManufacturer,
                raw_expiry_date: expiry_date,
                branch_id: branch_id || null,
                branch_name: branchNameMap[branch_id] || branch_id || "N/A",
                vendor_id: vendor_id || null,
                type: type,
                packing: packing || {},
                unit_type: unit_type
              });
            }
          });

          setDrugs(flattened);
          setSelectedRows({});
          setSelectAll(false);
          setPagination(prev => ({
            ...prev,
            total: data.pagination?.total_records || 0
          }));
        } else {
          setDrugs([]);
          setPagination(prev => ({ ...prev, total: 0 }));
        }
      } catch (err) {
        if (!isMountedRef.current || fetchId !== fetchIdRef.current) return;
        INVENTORY_MODULE_CONSTANTS.handleApiError(err, setError);
        setDrugs([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      } finally {
        if (isMountedRef.current && fetchId === fetchIdRef.current) {
          setLoading(false);
        }
      }
    };
  }, [searchTerm, pagination.page, pagination.page_size, selectedBranchesPayload, baseEndpoint, branchNameMap]);

  // Stable wrapper function that calls the ref
  const fetchDrugs = useCallback(() => {
    fetchDrugsRef.current();
  }, []);

  // ========== OTHER FUNCTION DEFINITIONS ==========
  const handleFilterChange = useCallback((name, value) => {
    if (name === "search") {
      setSearchTerm(value);
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
    }
  }, [fullBranchOptions, currentVendorId, originalBranchId, childVendors]);

  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination(prev => {
      const newPage = prev.page_size !== pageSize ? 1 : page;
      return { ...prev, page: newPage, page_size: pageSize };
    });
  }, []);

  const handleRowSelect = useCallback((rowId) => {
    setSelectedRows(prev => {
      const newSelected = { ...prev, [rowId]: !prev[rowId] };
      const visibleRows = drugs.map(d => d.id);
      const allSelected = visibleRows.every(id => newSelected[id]);
      setSelectAll(allSelected);
      return newSelected;
    });
  }, [drugs]);

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedRows({});
      setSelectAll(false);
    } else {
      const newSelected = {};
      drugs.forEach(drug => {
        if (drug.availability !== "not_in_stock" && drug.stock > 0) {
          newSelected[drug.id] = true;
        }
      });
      setSelectedRows(newSelected);
      setSelectAll(true);
    }
  }, [selectAll, drugs]);

  const handleReviewSelected = useCallback(() => {
    const selected = drugs.filter(drug => selectedRows[drug.id]);
    
    if (selected.length === 0) {
      alert("Please select at least one medicine");
      return;
    }

    const quantities = {};
    selected.forEach(medicine => {
      quantities[medicine.id] = 1;
    });

    setSelectedMedicines(selected);
    setTransferQuantities(quantities);
    setSourceBranchId(selected[0].vendor_id || currentUserVendorId);
    setTargetBranchId("");
    setTransferNotes("");
    setTransferError(null);
    setTransferSuccess(null);
    setBranchSelectionError(null);
    setShowTransferModal(true);
  }, [drugs, selectedRows, currentUserVendorId]);

  const handleQuantityChange = useCallback((medicineId, value) => {
    setTransferQuantities(prev => ({
      ...prev,
      [medicineId]: parseInt(value) || 0
    }));
  }, []);

  const handleSourceBranchChange = useCallback((newValue) => {
    setSourceBranchId(newValue);
    if (targetBranchId === newValue) {
      setTargetBranchId("");
    }
  }, [targetBranchId]);

  const closeTransferModal = useCallback(() => {
    setShowTransferModal(false);
    setSelectedMedicines([]);
    setTransferQuantities({});
    setTransferNotes("");
    setSourceBranchId("");
    setTargetBranchId("");
    setTransferError(null);
    setTransferSuccess(null);
    setBranchSelectionError(null);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchDrugs();
  }, [fetchDrugs]);

  const handlePageRefresh = useCallback(() => {
    fetchDrugs();
    setSelectedRows({});
    setSelectAll(false);
  }, [fetchDrugs]);

  const getBranchNameById = useCallback((vendorId) => {
    if (!vendorId) return "";
    if (vendorId === currentUserVendorId) {
      return currentUserBusinessName;
    }
    const childBranch = childVendors.find(item => item.vendor_id === vendorId);
    return childBranch?.business_name || vendorId;
  }, [currentUserVendorId, currentUserBusinessName, childVendors]);

  const handleTransferSubmit = useCallback(async () => {
    if (selectedMedicines.length === 0) return;
    
    for (const medicine of selectedMedicines) {
      const quantity = transferQuantities[medicine.id] || 0;
      if (quantity <= 0) {
        setTransferError(`Quantity for ${medicine.drug_name} must be greater than 0`);
        return;
      }
      if (quantity > medicine.stock) {
        setTransferError(`Quantity for ${medicine.drug_name} exceeds available stock (${medicine.stock})`);
        return;
      }
    }

    if (!sourceBranchId) {
      setTransferError("Please select a source branch");
      return;
    }

    if (!targetBranchId) {
      setTransferError("Please select a target branch");
      return;
    }

    if (sourceBranchId === targetBranchId) {
      setTransferError("Source and target branches cannot be the same");
      return;
    }

    setIsSubmittingTransfer(true);
    setTransferError(null);
    setTransferSuccess(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const sourceOption = sourceBranchOptions.find(opt => opt.value === sourceBranchId);
      const targetOption = targetBranchOptions.find(opt => opt.value === targetBranchId);
      
      if (!sourceOption || !targetOption) {
        throw new Error("Invalid branch selection");
      }

      const sourceVendorName = sourceOption.label.replace(' (Main Branch)', '');
      const targetVendorName = targetOption.label.replace(' (Main Branch)', '');

      const items = selectedMedicines.map(medicine => ({
        medicine_id: medicine.medicine_id.toString(),
        name: medicine.drug_name,
        batch_code: medicine.raw_batch_code || medicine.batch_code,
        quantity: parseInt(transferQuantities[medicine.id] || 1)
      }));

      const requestBody = {
        source_vendor_id: sourceBranchId,
        target_vendor_id: targetBranchId,
        requested_by_id: currentUserVendorId,
        requested_by_name: currentUserBusinessName,
        target_vendor_name: targetVendorName,
        source_vendor_name: sourceVendorName,
        notes: transferNotes.trim() || `Transfer request for ${selectedMedicines.length} medicine(s)`,
        items: items
      };

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      };

      const response = await apiService.post(
        apiEndpoints.createStockTransferRequest(),
        requestBody,
        { headers }
      );

      if (response.data.status === "success") {
        setTransferSuccess({
          message: response.data.message || "Transfer request submitted successfully!",
          details: `Transfer ID: ${response.data.data.transfer_id}`,
          transferId: response.data.data.transfer_id,
          status: response.data.data.status
        });
        
        setSelectedRows({});
        setSelectAll(false);
        
        setTimeout(() => {
          fetchDrugs();
        }, 1000);
      } else {
        setTransferError(response.data.message || "Failed to create transfer request");
      }
    } catch (err) {
      console.error("Transfer request error:", err);
      setTransferError(
        err.response?.data?.message || 
        err.message || 
        "Failed to create transfer request. Please try again."
      );
    } finally {
      setIsSubmittingTransfer(false);
    }
  }, [selectedMedicines, transferQuantities, sourceBranchId, targetBranchId, sourceBranchOptions, targetBranchOptions, currentUserVendorId, currentUserBusinessName, transferNotes, fetchDrugs]);

  // ========== DEPENDENT MEMOIZED VALUES ==========
  const filterFields = useMemo(() => [
    {
      type: "text",
      name: "search",
      label: "Medicine Name",
      placeholder: "Type drug name...",
      value: searchTerm,
      onChange: (e) => handleFilterChange("search", e.target.value),
    },
    ...(isMaster && fullBranchOptions.length > 1 ? [{
      type: "select",
      name: "branch_id",
      label: "Branch",
      placeholder: "Select Branch",
      value: selectedValue,
      onChange: (e) => handleFilterChange("branch_id", e.target.value),
      options: fullBranchOptions,
    }] : []),
  ], [searchTerm, selectedValue, fullBranchOptions, isMaster, handleFilterChange]);

  // FIXED: Responsive dynamic title
  const dynamicTitle = useMemo(() => {
    const branchLabel = selectedBranch;
    const isCurrent = selectedValue === 'current';
    const isAll = selectedValue === 'all';

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Package className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 flex-shrink-0" />
          <span className="text-xl sm:text-2xl font-bold text-gray-800 truncate max-w-[180px] sm:max-w-full">
            Transfer Inventory
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
          {isCurrent ? currentBusinessName : isAll ? 'All Branches' : `Branch: ${branchLabel}`}
        </span>
      </div>
    );
  }, [selectedBranch, selectedValue, currentBusinessName]);

  const columns = useMemo(() => {
    const cols = [];
    
    if (selectedValue === 'all') {
      cols.push({
        accessorKey: "branch_name",
        header: "Branch",
        cell: ({ row }) => <div className="font-medium">{row.original.branch_name}</div>
      });
    }
    
    cols.push({
      accessorKey: "drug_name",
      header: ({ column }) => <HeaderWithSort column={column} title="Medicine Name" />,
      cell: ({ row }) => {
        const original = row.original;
        const isOutOfStock = original.availability === "not_in_stock";

        return (
          <div className="font-semibold flex items-center gap-2 flex-wrap">
            {original.drug_name}
            {isOutOfStock && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-600 text-white shadow-sm">
                Not in your stock
              </span>
            )}
          </div>
        );
      }
    });
    
    cols.push({
      accessorKey: "form",
      header: "Form",
      cell: ({ row }) => <div className="font-medium">{row.original.form}</div>
    });
    
    cols.push({
      accessorKey: "strength",
      header: "Strength",
      cell: ({ row }) => <div className="font-medium">{row.original.strength}</div>
    });
    
    cols.push({
      accessorKey: "batch_code",
      header: "Batch",
      cell: ({ row }) => <code className="font-medium">{row.original.batch_code}</code>
    });
    
    cols.push({
  accessorKey: "expiry_date",
  header: "Expiry Date",
  cell: ({ row }) => <div className="font-medium">{INVENTORY_MODULE_CONSTANTS.formatDate(row.original.expiry_date, false)}</div>
},);
    
    cols.push({
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.stock}
        </div>
      )
    });
    
    // Action column with checkbox at the end
    cols.push({
      id: "Actions",
      header: () => (
        <div className="flex items-center justify-end gap-2">
          <span className="font-semibold">Action</span>
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={selectAll}
            onChange={handleSelectAll}
            title="Select all items"
          />
        </div>
      ),
      cell: ({ row }) => {
        const medicine = row.original;
        const isOutOfStock = medicine.availability === "not_in_stock" || medicine.stock === 0;
        
        return (
          <div className="flex items-center justify-end">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={!!selectedRows[medicine.id]}
              onChange={() => handleRowSelect(medicine.id)}
              disabled={isOutOfStock}
              title={isOutOfStock ? "Out of stock - cannot select" : "Select for transfer"}
            />
          </div>
        );
      },
      size: 80
    });
    
    return cols;
  }, [selectedValue, isMaster, selectedRows, selectAll, handleRowSelect, handleSelectAll]);

  // ========== EFFECTS ==========
  useEffect(() => {
    if (sourceBranchId && targetBranchId && sourceBranchId === targetBranchId) {
      setBranchSelectionError("Source and target branches cannot be the same");
    } else {
      setBranchSelectionError(null);
    }
  }, [sourceBranchId, targetBranchId]);

  // Initial fetch
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchDrugs();
    }
  }, [fetchDrugs]);

  // Debounced effect - ONLY runs when dependencies change, NOT on every render
  useEffect(() => {
    // Skip if it's the initial mount (already fetched)
    if (isInitialMount.current) return;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Cancel any in-flight request
    INVENTORY_MODULE_CONSTANTS.cancelApiRequest(controllerRef);

    // Set new timer
    timerRef.current = setTimeout(() => {
      fetchDrugs();
    }, INVENTORY_MODULE_CONSTANTS.DEBOUNCE_DELAY);

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [
    searchTerm, 
    pagination.page, 
    pagination.page_size, 
    selectedBranchesPayload
    // REMOVED fetchDrugs from dependencies - now it's STABLE
  ]);

  // Count selected items
  const selectedCount = Object.values(selectedRows).filter(Boolean).length;

  return (
    <>
      <div className="relative">
        {/* FIXED: Responsive button group */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20 flex flex-col sm:flex-row gap-2">
          {isMaster && selectedCount > 0 && (
            <Button
              variant="primary"
              onClick={handleReviewSelected}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-green-600 hover:bg-green-700 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 relative group"
              title={`Review ${selectedCount} selected item${selectedCount > 1 ? 's' : ''}`}
              aria-label={`Review ${selectedCount} selected items`}
            >
              <Eye className="w-3 h-3 sm:w-5 sm:h-5" />
              <span className="sm:hidden font-bold text-xs bg-white text-green-700 rounded-full px-1.5 py-0.5 ml-1">
                {selectedCount}
              </span>
              <span className="hidden sm:inline">Review Selected ({selectedCount})</span>
              
              {/* Mobile tooltip that appears on long press/hover */}
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap sm:hidden">
                Review {selectedCount} item{selectedCount > 1 ? 's' : ''}
              </span>
            </Button>
          )}
        </div>

        <HomeTable
          title={dynamicTitle}
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
          noDataMessage={drugs.length === 0 && !loading && !error ? NO_RECORD_FOUND : error}
          hideDefaultActions={true}
          showColumnVisibility={true}
        />
      </div>

      {/* Transfer Modal - FIXED: Responsive with InputSelect */}
      {showTransferModal && selectedMedicines.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-500 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs sm:text-sm">↔️</span>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                      Transfer {selectedMedicines.length} Medicine{selectedMedicines.length > 1 ? 's' : ''}
                    </h2>
                    <p className="text-xs text-gray-500">Request transfer between branches</p>
                  </div>
                </div>
                <button
                  onClick={closeTransferModal}
                  className="text-gray-400 hover:text-gray-600 text-sm p-1"
                >
                  ✕
                </button>
              </div>

              {transferSuccess ? (
                <div className="text-center py-4 sm:py-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">Transfer Request Submitted!</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">{transferSuccess.message}</p>
                  {transferSuccess.transferId && (
                    <div className="mb-4 p-2 sm:p-3 bg-gray-50 rounded border mx-2">
                      <p className="text-xs text-gray-500 mb-1">Reference</p>
                      <code className="text-xs text-blue-600 bg-gray-100 px-2 py-1 rounded break-all">
                        {transferSuccess.transferId}
                      </code>
                      <p className="text-xs text-gray-500 mt-1">
                        Status: <span className="text-orange-600 font-medium">{transferSuccess.status}</span>
                      </p>
                    </div>
                  )}
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="primary"
                      onClick={closeTransferModal}
                      size="sm"
                      className="px-4 text-xs sm:text-sm"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Selected Medicines List */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 sm:p-4 mb-4">
                    <h3 className="font-medium text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm">Selected Medicines</h3>
                    <div className="space-y-2 sm:space-y-3 max-h-40 sm:max-h-60 overflow-y-auto">
                      {selectedMedicines.map((medicine) => (
                        <div key={medicine.id} className="bg-white rounded-lg p-2 sm:p-3 border border-blue-100">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-start">
                            <div className="col-span-1 sm:col-span-5">
                              <p className="font-semibold text-gray-800 text-xs sm:text-sm">{medicine.drug_name}</p>
                              <p className="text-xs text-gray-500">{medicine.strength} • {medicine.form}</p>
                            </div>
                            <div className="col-span-1 sm:col-span-3">
                              <p className="text-xs text-gray-500">Batch</p>
                              <p className="text-xs sm:text-sm font-medium break-all">{medicine.batch_code}</p>
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                              <p className="text-xs text-gray-500">Available</p>
                              <p className={`text-xs sm:text-sm font-medium ${medicine.stock <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                                {medicine.stock}
                              </p>
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                              <p className="text-xs text-gray-500">Qty</p>
                              <input
                                type="number"
                                min="1"
                                max={medicine.stock}
                                value={transferQuantities[medicine.id] || 1}
                                onChange={(e) => handleQuantityChange(medicine.id, e.target.value)}
                                className="w-16 sm:w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transfer Form */}
                  <div className="space-y-3 sm:space-y-4">
                    {/* Source Branch - Using InputSelect */}
                    <InputSelect
                      label="Source Branch"
                      name="sourceBranch"
                      value={sourceBranchId}
                      onChange={handleSourceBranchChange}
                      required
                      disabled
                      inputClassName="bg-gray-100"
                    >
                      <option value="">Select source branch</option>
                      {sourceBranchOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </InputSelect>

                    {/* Destination Branch - Using InputSelect */}
                    <InputSelect
                      label="Destination Branch"
                      name="targetBranch"
                      value={targetBranchId}
                      onChange={(e) => setTargetBranchId(e.target.value)}
                      required
                      disabled={!sourceBranchId}
                    >
                      <option value="">Select destination branch</option>
                      {targetBranchOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </InputSelect>

                    {branchSelectionError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                        <p className="text-xs text-red-600">{branchSelectionError}</p>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={transferNotes}
                        onChange={(e) => setTransferNotes(e.target.value)}
                        placeholder="Add notes for this transfer..."
                        className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        rows="2"
                      />
                    </div>

                    {transferError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                        <p className="text-xs text-red-600">{transferError}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        variant="secondary"
                        onClick={closeTransferModal}
                        disabled={isSubmittingTransfer}
                        size="sm"
                        className="w-full sm:flex-1 text-xs sm:text-sm py-2"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleTransferSubmit}
                        loading={isSubmittingTransfer}
                        disabled={
                          isSubmittingTransfer || 
                          !sourceBranchId || 
                          !targetBranchId ||
                          sourceBranchId === targetBranchId ||
                          !!branchSelectionError
                        }
                        size="sm"
                        className="w-full sm:flex-1 text-xs sm:text-sm py-2"
                      >
                        {isSubmittingTransfer ? 'Submitting...' : 'Submit Request'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}