// BranchStock.jsx - FINAL VERSION with medicineType filter & proper date display
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import HomeTable from '../../../common/table/Table';
import { getToken } from '../../../../services/tokenUtils';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/endpoint/inventory/inventoryEnd';
import ExportReports from '../../../common/reports/ExportReports';
import { useAuth } from '../../../auth/hooks/useAuth';
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { 
  Package, RefreshCw, Eye, ChevronRight, ArrowLeft, Loader2, X, ExternalLink, Calendar 
} from 'lucide-react';

// UI Components
import Button from '../../../../components/ui/forms/Button';
import Alert from '../../../../components/ui/feedback/Alert';
import Card from '../../../../components/ui/Card';
import Modal from '../../../../components/ui/Modal';

// Packing Utilities
import { PackingDisplay } from '../../../../components/ui/packingui';

// Inventory Constants
import { INVENTORY_MODULE_CONSTANTS } from './inventoryconstants/inventoryModuleConstants';

// ==================== MESSAGE & UI CONSTANTS ====================
const BRANCH_STOCK_MESSAGES = {
  SUCCESS: {
    LOADED: 'Data loaded successfully',
    EXPORTED: 'Report exported successfully',
  },
  ERRORS: {
    LOAD_FAILED: 'Failed to load data',
    BRANCH_NOT_FOUND: 'Branch not found',
    INVALID_DATE_FORMAT: 'Invalid date format',
    END_DATE_BEFORE_START: 'End date cannot be before start date',
    START_DATE_AFTER_END: 'Start date cannot be after end date',
    MEDICINE_DETAILS_FAILED: 'Failed to load batch details',
    SEARCH_FAILED: 'Search failed',
    EXPORT_FAILED: 'Export failed',
  },
  UI: {
    PAGE_TITLE: 'All Inventory Stock',
    SUMMARY_TITLE: 'All Inventory Stock',
    BATCH_DETAILS_TITLE: 'Medicine Batch Details',
    SEARCH_RESULTS_TITLE: 'Search Results',
    BACK_TO_SUMMARY: 'Back to Summary',
    VIEW_DETAILS: 'View Details',
    VIEW: 'View',
    CLOSE: 'Close',
    CLOSE_CLEAR_SEARCH: 'Close & Clear Search',
    REFRESH: 'Refresh',
    RETRY: 'Retry',
    REFRESHING: 'Refreshing...',
    LOADING: 'Loading...',
    SEARCHING: 'Searching...',
    SUBMITTING: 'Submitting...',
    IN_STOCK: 'In Stock',
    OUT_OF_STOCK: 'Out of Stock',
    MAIN_BRANCH: 'Main',
    ALL_BRANCHES: 'All Branches',
    SELECTED_BRANCH: 'Selected Branch',
    NO_STOCK_ITEMS: 'No stock items found',
    NO_MEDICINES_IN_BRANCH: 'No medicines found in this branch',
    NO_BATCH_DETAILS: 'No batch details found',
    NO_SEARCH_RESULTS: 'No batch details found',
    TRY_DIFFERENT_SEARCH: 'Try a different search term',
    TOTAL_MEDICINES: 'Total Medicines',
    TOTAL_STOCK: 'Total Stock',
    BATCH_ITEMS: 'Batch Items',
    BRANCH: 'Branch',
    MEDICINE: 'Medicine',
    MEDICINE_NAME: 'Medicine Name',
    STOCK: 'Stock',
    SEARCH_MEDICINE_PLACEHOLDER: 'Enter medicine name (results show in popup)...',
    SELECT_BRANCH_PLACEHOLDER: 'Select Branch',
    CLICK_MEDICINE_TIP: 'Click on any medicine name to view its batch details',
    PLEASE_WAIT: 'Please wait for the current medicine to load',
    VIEWING: 'Viewing',
    WAIT: 'Wait',
    BATCHES_FOUND: 'batch(es) found',
    SEARCH_RESULTS_FOR: 'Search Results for',
    DATE_RANGE_DISPLAY: 'from {start} to {end}',
    DATE_RANGE_WITH_DATES: 'from {start} to {end}',
    STOCK_RANGE: 'Stock Range',
    MEDICINE_TYPE: 'Medicine Type',
    MEDICINE_TYPE_PLACEHOLDER: 'Select Medicine Type',
    RESET_DATES: 'Reset to Default Dates',
  },
  DEFAULTS: {
    NOT_AVAILABLE: 'N/A',
    NOT_SPECIFIED: 'Not specified',
    BRANCH_PREFIX: 'Branch ',
    DEFAULT_BRANCH: 'Branch N/A',
  },
};

// ==================== COMPONENT ====================
export default function BranchStock() {
  const { user } = useAuth();
  
  // Controllers and refs
  const summaryControllerRef = useRef(null);
  const detailControllerRef = useRef(null);
  const medicineDetailControllerRef = useRef(null);
  const fetchTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const medicineDetailRef = useRef(null);

  // State variables
  const [summaryData, setSummaryData] = useState([]);
  const [detailData, setDetailData] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingMedicineDetails, setLoadingMedicineDetails] = useState(false);
  const [error, setError] = useState(null);
  const [dateError, setDateError] = useState("");

  // State for selected items
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedBranchValue, setSelectedBranchValue] = useState("all");
  const [selectedTotalStock, setSelectedTotalStock] = useState(0);
  const [selectedTotalItems, setSelectedTotalItems] = useState(0);

  // State for clicked medicine details (modal)
  const [clickedMedicine, setClickedMedicine] = useState(null);
  const [medicineDetailData, setMedicineDetailData] = useState([]);
  const [medicineTotalStock, setMedicineTotalStock] = useState(0);
  const [medicineTotalItems, setMedicineTotalItems] = useState(0);
  const [currentlyLoadingMedicine, setCurrentlyLoadingMedicine] = useState(null);
  const [isMedicineDetailModalOpen, setIsMedicineDetailModalOpen] = useState(false);

  // State for search results modal
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({ 
    drug_name: "",
    startDate: "",
    endDate: "",
    medicineType: "medicine"
  });

  // Track actual dates being used for API calls
  const [activeDateRange, setActiveDateRange] = useState({ startDate: "", endDate: "" });

  // Pagination
  const [paginationSummary, setPaginationSummary] = useState({ page: 1, page_size: 10, total: 0 });
  const [paginationDetail, setPaginationDetail] = useState({ page: 1, page_size: 10, total: 0 });
  const [paginationMedicineDetail, setPaginationMedicineDetail] = useState({ page: 1, page_size: 10, total: 0 });

  // Medicine Type Options - Now imported from constants
  const medicineTypeOptions = INVENTORY_MODULE_CONSTANTS.MEDICINE_TYPE_OPTIONS;
 
  const { 
    vendorId: currentVendorId, 
    branchId: originalBranchId, 
    isMaster, 
    businessName: currentBusinessName 
  } = INVENTORY_MODULE_CONSTANTS.getUserInfo(user);

  const childVendors = useMemo(() => getVendorChildIds() || [], []);
  const childIds = useMemo(() => childVendors.map(v => v.vendor_id).filter(Boolean), [childVendors]);

  // USE CONSTANTS FOR BRANCH OPTIONS
  const branchOptions = useMemo(() => 
    INVENTORY_MODULE_CONSTANTS.getBranchOptionsWithAll(user, childVendors), 
    [user, childVendors]
  );

  // Helper function to get default dates
  const getDefaultDates = useCallback(() => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    return {
      startDate: formatDate(sevenDaysAgo),
      endDate: formatDate(today)
    };
  }, []);

  // Helper function to build API endpoint with parameters
  const buildEndpoint = useCallback((drugName = '', detailMode = 'all', startDate = '', endDate = '', medicineType = '') => {
    let endpoint = apiEndpoints.allBranchMedicine();
    const baseEndpoint = endpoint.split('?')[0];
    const params = new URLSearchParams();
    if (detailMode === 'all' || detailMode === 'false' || detailMode === 'true') {
      params.append('detail', detailMode);
    }
    if (drugName && drugName.trim() !== '') {
      params.append('drug_name', drugName);
    }
    if (startDate) {
      params.append('startDate', startDate);
    }
    if (endDate) {
      params.append('endDate', endDate);
    }
    if (medicineType && medicineType.trim() !== '') {
      params.append('medicineType', medicineType);
    }
    const queryString = params.toString();
    return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
  }, []);

  // Initialize default dates
  useEffect(() => {
    const defaultDates = getDefaultDates();
    if (!filters.startDate && !filters.endDate) {
      setFilters(prev => ({
        ...prev,
        startDate: defaultDates.startDate,
        endDate: defaultDates.endDate,
      }));
      setActiveDateRange(defaultDates);
    }
  }, [getDefaultDates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (summaryControllerRef.current) summaryControllerRef.current.abort();
      if (detailControllerRef.current) detailControllerRef.current.abort();
      if (medicineDetailControllerRef.current) medicineDetailControllerRef.current.abort();
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, []);

  // ========== FETCH FUNCTIONS (defined in order) ==========
  
  // SUMMARY FETCH
  const fetchSummary = useCallback(async () => {
    if (selectedMedicine) return;
    if (summaryControllerRef.current) summaryControllerRef.current.abort();
    summaryControllerRef.current = INVENTORY_MODULE_CONSTANTS.createAbortController();

    const vendorIds = selectedBranchValue === "all" 
      ? [currentVendorId, ...childIds].filter(Boolean)
      : [selectedBranchValue];

    // Get current date values (either from filters or defaults)
    let currentStartDate = filters.startDate;
    let currentEndDate = filters.endDate;
    
    // If dates are empty, use defaults
    if (!currentStartDate || !currentEndDate) {
      const defaultDates = getDefaultDates();
      currentStartDate = defaultDates.startDate;
      currentEndDate = defaultDates.endDate;
    }

    // Update active date range for display
    setActiveDateRange({ startDate: currentStartDate, endDate: currentEndDate });

    // Debounce
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoadingSummary(true);
        setError(null);
        setDateError("");

        const endpoint = buildEndpoint(filters.drug_name, 'all', currentStartDate, currentEndDate, filters.medicineType);
        const token = getToken();
        const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, currentVendorId);

        // Add branch headers if needed
        if (selectedBranchValue !== "all" && selectedBranchValue !== currentVendorId) {
          const child = childVendors.find(v => v.vendor_id === selectedBranchValue);
          if (child) {
            INVENTORY_MODULE_CONSTANTS.addBranchHeaders(
              headers, 
              child.branch_id, 
              selectedBranchValue, 
              currentVendorId
            );
          }
        }

        const payload = vendorIds.map(vid => {
          let branchId = '';
          if (vid === currentVendorId) {
            branchId = originalBranchId;
          } else {
            const child = childVendors.find(v => v.vendor_id === vid);
            branchId = child?.branch_id || '';
          }
          return {
            vendor_id: vid,
            branch_id: branchId
          };
        });

        const { data } = await apiService.post(endpoint, payload, {
          headers,
          signal: summaryControllerRef.current.signal,
          timeout: 15000
        });

        if (!isMountedRef.current) return;

        const rawData = data?.data || [];
        const meta = data?.pagination || {};

        const mapped = rawData.map(item => {
          const isMasterRow = item.vendor_id === currentVendorId;
          const branchName = isMasterRow ? currentBusinessName : 
                          childVendors.find(v => v.branch_id === item.branch_id)?.business_name || 
                          `${BRANCH_STOCK_MESSAGES.DEFAULTS.BRANCH_PREFIX}${item.branch_id}`;
          return {
            id: item.medicine_id,
            medicine_id: item.medicine_id,
            drug_name: item.name || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
            type: item.type || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
            manufacturer: item.manufacturer || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
            stock: Number(item.total_stock) || 0,
            batch_code: item.latest_batch_code || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
            added_date: item.latest_added_date ? INVENTORY_MODULE_CONSTANTS.formatDateForDisplay(item.latest_added_date) : BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
            branch_id: item.branch_id,
            vendor_id: item.vendor_id,
            business_name: branchName,
            is_master: isMasterRow,
          };
        });

        setSummaryData(mapped);
        setPaginationSummary(p => ({ 
          ...p, 
          total: meta.total_records || meta.total_items || mapped.length || 0 
        }));
      } catch (err) {
        if (!isMountedRef.current) return;
        INVENTORY_MODULE_CONSTANTS.handleApiError(err, setError, setLoadingSummary);
        setSummaryData([]);
        setPaginationSummary(p => ({ ...p, total: 0 }));
      } finally {
        if (isMountedRef.current && !selectedMedicine) {
          setLoadingSummary(false);
        }
      }
    }, 300);
  }, [
    selectedMedicine, 
    selectedBranchValue, 
    childIds, 
    currentVendorId, 
    originalBranchId, 
    childVendors, 
    currentBusinessName, 
    buildEndpoint, 
    filters.drug_name,
    filters.startDate,
    filters.endDate,
    filters.medicineType,
    getDefaultDates
  ]);

  // BRANCH SUMMARY FETCH (detail view)
  const fetchBranchSummary = useCallback(async () => {
    if (!selectedMedicine || !selectedBranch) return;
    if (detailControllerRef.current) detailControllerRef.current.abort();
    detailControllerRef.current = INVENTORY_MODULE_CONSTANTS.createAbortController();

    // Get current date values
    let currentStartDate = filters.startDate;
    let currentEndDate = filters.endDate;
    
    if (!currentStartDate || !currentEndDate) {
      const defaultDates = getDefaultDates();
      currentStartDate = defaultDates.startDate;
      currentEndDate = defaultDates.endDate;
    }

    setActiveDateRange({ startDate: currentStartDate, endDate: currentEndDate });

    try {
      setLoadingDetail(true); 
      setError(null); 
      setDateError("");

      const endpoint = buildEndpoint('', 'false', currentStartDate, currentEndDate, filters.medicineType);
      const token = getToken();
      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, currentVendorId);

      INVENTORY_MODULE_CONSTANTS.addBranchHeaders(
        headers,
        selectedMedicine.branch_id,
        selectedMedicine.vendor_id,
        currentVendorId
      );

      const body = [{
        vendor_id: selectedMedicine.vendor_id,
        branch_id: selectedMedicine.branch_id,
      }];

      const { data } = await apiService.post(endpoint, body, {
        headers,
        signal: detailControllerRef.current.signal,
        timeout: 15000
      });

      if (!isMountedRef.current) return;

      const rawDetails = data?.data || [];
      const mappedDetails = rawDetails.map(d => ({
        ...d,
        batch_code: d.latest_batch_code || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        strength: BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_SPECIFIED,
        added_date: d.latest_added_date ? INVENTORY_MODULE_CONSTANTS.formatDateForDisplay(d.latest_added_date) : BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        expiry_date: BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_SPECIFIED,
        availability: BRANCH_STOCK_MESSAGES.UI.IN_STOCK,
        type: d.type || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        stock: Number(d.total_stock) || 0,
        sale_price: 0,
        retail_price: 0,
        manufacturer: d.manufacturer || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        packing: { total_pack: 0, pack_strip: 0, strip_tablet: 0, total_strip: 0 },
        packing_display: INVENTORY_MODULE_CONSTANTS.formatPacking(d.packing),
        medicine_name: d.name || d.drug_name || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        unit_type: ""
      }));

      const totalStock = mappedDetails.reduce((acc, item) => acc + Number(item.stock || 0), 0);
      setSelectedTotalStock(totalStock);
      setSelectedTotalItems(mappedDetails.length);
      setDetailData(mappedDetails);
      setPaginationDetail(p => ({ ...p, total: mappedDetails.length }));
    } catch (err) {
      if (!isMountedRef.current) return;
      INVENTORY_MODULE_CONSTANTS.handleApiError(err, setError, setLoadingDetail);
      setDetailData([]);
      setPaginationDetail(p => ({ ...p, total: 0 }));
    } finally {
      if (isMountedRef.current) {
        setLoadingDetail(false);
      }
    }
  }, [
    selectedMedicine, 
    selectedBranch, 
    filters.startDate,
    filters.endDate,
    filters.medicineType,
    currentVendorId, 
    buildEndpoint,
    getDefaultDates
  ]);

  // SEARCH MEDICINE (shows modal)
  const fetchMedicineDetails = useCallback(async () => {
    if (!selectedMedicine || !selectedBranch || !filters.drug_name) return;
    if (detailControllerRef.current) detailControllerRef.current.abort();
    detailControllerRef.current = INVENTORY_MODULE_CONSTANTS.createAbortController();

    // Get current date values
    let currentStartDate = filters.startDate;
    let currentEndDate = filters.endDate;
    
    if (!currentStartDate || !currentEndDate) {
      const defaultDates = getDefaultDates();
      currentStartDate = defaultDates.startDate;
      currentEndDate = defaultDates.endDate;
    }

    try {
      setSearchLoading(true);
      setError(null); 
      setDateError("");

      const endpoint = buildEndpoint(filters.drug_name, 'true', currentStartDate, currentEndDate, filters.medicineType);
      const token = getToken();
      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, currentVendorId);

      INVENTORY_MODULE_CONSTANTS.addBranchHeaders(
        headers,
        selectedMedicine.branch_id,
        selectedMedicine.vendor_id,
        currentVendorId
      );

      const body = [{
        vendor_id: selectedMedicine.vendor_id,
        branch_id: selectedMedicine.branch_id,
      }];

      const { data } = await apiService.post(endpoint, body, {
        headers,
        signal: detailControllerRef.current.signal,
        timeout: 15000
      });

      if (!isMountedRef.current) return;

      const rawDetails = data?.data || [];
      const mappedDetails = rawDetails.map(d => ({
        ...d,
        batch_code: d.batch_code || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        strength: d.strength || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_SPECIFIED,
        added_date: d.added_date ? INVENTORY_MODULE_CONSTANTS.formatDateForDisplay(d.added_date) : BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        expiry_date: d.expiry_date ? INVENTORY_MODULE_CONSTANTS.formatDateForDisplay(d.expiry_date) : BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        availability: d.availability === 'in_stock' ? BRANCH_STOCK_MESSAGES.UI.IN_STOCK : BRANCH_STOCK_MESSAGES.UI.OUT_OF_STOCK,
        type: d.type || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        stock: Number(d.stock) || 0,
        sale_price: Number(d.sale_price) || 0,
        retail_price: Number(d.retail_price) || 0,
        manufacturer: d.manufacturer || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        packing: d.packing || { total_pack: 0, pack_strip: 0, strip_tablet: 0, total_strip: 0 },
        packing_display: INVENTORY_MODULE_CONSTANTS.formatPacking(d.packing),
        medicine_name: d.medicine_name || d.name || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        unit_type: d.unit_type || ""
      }));

      setSearchResults(mappedDetails);
      setIsSearchModalOpen(true);
    } catch (err) {
      if (!isMountedRef.current) return;
      INVENTORY_MODULE_CONSTANTS.handleApiError(err, setError);
      setSearchResults([]);
    } finally {
      if (isMountedRef.current) {
        setSearchLoading(false);
      }
    }
  }, [
    selectedMedicine, 
    selectedBranch, 
    filters.drug_name, 
    filters.startDate, 
    filters.endDate,
    filters.medicineType,
    currentVendorId, 
    buildEndpoint,
    getDefaultDates
  ]);

  // FETCH SPECIFIC MEDICINE BATCH DETAILS (modal)
  const fetchSpecificMedicineDetails = useCallback(async (medicineName) => {
    if (!selectedMedicine || !selectedBranch || !medicineName || !isMountedRef.current) return;
    if (currentlyLoadingMedicine !== null) return;
    if (medicineDetailControllerRef.current) medicineDetailControllerRef.current.abort();
    medicineDetailControllerRef.current = INVENTORY_MODULE_CONSTANTS.createAbortController();

    // Get current date values
    let currentStartDate = filters.startDate;
    let currentEndDate = filters.endDate;
    
    if (!currentStartDate || !currentEndDate) {
      const defaultDates = getDefaultDates();
      currentStartDate = defaultDates.startDate;
      currentEndDate = defaultDates.endDate;
    }

    try {
      setClickedMedicine(medicineName);
      setCurrentlyLoadingMedicine(medicineName);
      setIsMedicineDetailModalOpen(false);
      setMedicineDetailData([]);
      setError(null);
      setDateError("");

      const endpoint = buildEndpoint(medicineName, 'true', currentStartDate, currentEndDate, filters.medicineType);
      const token = getToken();
      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, currentVendorId);

      INVENTORY_MODULE_CONSTANTS.addBranchHeaders(
        headers,
        selectedMedicine.branch_id,
        selectedMedicine.vendor_id,
        currentVendorId
      );

      const body = [{
        vendor_id: selectedMedicine.vendor_id,
        branch_id: selectedMedicine.branch_id,
      }];

      const { data } = await apiService.post(endpoint, body, {
        headers,
        signal: medicineDetailControllerRef.current.signal,
        timeout: 10000
      });

      if (!isMountedRef.current) return;

      const rawDetails = data?.data || [];
      const mappedDetails = rawDetails.map(d => ({
        ...d,
        batch_code: d.batch_code || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        strength: d.strength || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_SPECIFIED,
        added_date: d.added_date ? INVENTORY_MODULE_CONSTANTS.formatDateForDisplay(d.added_date) : BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        expiry_date: d.expiry_date ? INVENTORY_MODULE_CONSTANTS.formatDateForDisplay(d.expiry_date) : BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        availability: d.availability === 'in_stock' ? BRANCH_STOCK_MESSAGES.UI.IN_STOCK : BRANCH_STOCK_MESSAGES.UI.OUT_OF_STOCK,
        type: d.type || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        stock: Number(d.stock) || 0,
        sale_price: Number(d.sale_price) || 0,
        retail_price: Number(d.retail_price) || 0,
        manufacturer: d.manufacturer || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        packing: d.packing || { total_pack: 0, pack_strip: 0, strip_tablet: 0, total_strip: 0 },
        packing_display: INVENTORY_MODULE_CONSTANTS.formatPacking(d.packing),
        medicine_name: d.medicine_name || d.name || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE,
        unit_type: d.unit_type || ""
      }));

      const totalStock = mappedDetails.reduce((acc, item) => acc + Number(item.stock || 0), 0);
      const totalItems = mappedDetails.length;

      setMedicineDetailData(mappedDetails);
      setMedicineTotalStock(totalStock);
      setMedicineTotalItems(totalItems);
      setPaginationMedicineDetail(p => ({ 
        ...p, 
        total: data?.pagination?.total_records || mappedDetails.length 
      }));
      setIsMedicineDetailModalOpen(true);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(`${BRANCH_STOCK_MESSAGES.ERRORS.MEDICINE_DETAILS_FAILED} ${medicineName}: ${INVENTORY_MODULE_CONSTANTS.getErrorMessage(err)}`);
      setClickedMedicine(null);
      setMedicineDetailData([]);
    } finally {
      if (isMountedRef.current) {
        setCurrentlyLoadingMedicine(null);
        setLoadingMedicineDetails(false);
      }
    }
  }, [
    selectedMedicine, 
    selectedBranch, 
    buildEndpoint, 
    currentlyLoadingMedicine, 
    filters.startDate, 
    filters.endDate,
    filters.medicineType,
    currentVendorId,
    getDefaultDates
  ]);

  // ========== HANDLER FUNCTIONS ==========
  
  // CHOOSE DETAIL FETCH (wrapper function)
  const fetchDetail = useCallback(() => {
    if (filters.drug_name && filters.drug_name.trim() !== '') {
      fetchMedicineDetails();
    } else {
      fetchBranchSummary();
    }
  }, [filters.drug_name, fetchMedicineDetails, fetchBranchSummary]);

  // RESET DATES TO DEFAULT
  const handleResetDates = useCallback(() => {
    const defaultDates = getDefaultDates();
    setFilters(prev => ({
      ...prev,
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate,
    }));
    setActiveDateRange(defaultDates);
    setDateError("");
    
    // Trigger refresh
    if (selectedMedicine) {
      fetchDetail();
    } else {
      fetchSummary();
    }
  }, [getDefaultDates, selectedMedicine, fetchDetail, fetchSummary]);

  // HANDLE MEDICINE CLICK
  const handleMedicineClick = useCallback((medicineName) => {
    if (!medicineName || !medicineName.trim() || !isMountedRef.current) return;
    if (currentlyLoadingMedicine !== null) return;
    if (clickedMedicine === medicineName && isMedicineDetailModalOpen) {
      setClickedMedicine(null);
      setMedicineDetailData([]);
      setIsMedicineDetailModalOpen(false);
      setCurrentlyLoadingMedicine(null);
      return;
    }
    fetchSpecificMedicineDetails(medicineName);
  }, [clickedMedicine, isMedicineDetailModalOpen, currentlyLoadingMedicine, fetchSpecificMedicineDetails]);

  // VIEW FROM SEARCH MODAL
  const handleViewMedicineFromSearch = useCallback((medicineName) => {
    setIsSearchModalOpen(false);
    setSearchResults([]);
    const foundMedicine = detailData.find(item => 
      item.medicine_name === medicineName || item.drug_name === medicineName
    );
    if (foundMedicine) {
      handleMedicineClick(medicineName);
    }
  }, [detailData, handleMedicineClick]);

  // VIEW CLICK
  const handleViewClick = (row) => {
    const original = row.original;
    const branchId = original.branch_id;
    const isMasterRow = original.is_master;
    const businessName = original.business_name;

    if (isMasterRow) {
      setSelectedMedicine({
        drug_name: original.drug_name,
        vendor_id: currentVendorId,
        branch_id: originalBranchId
      });
      setSelectedBranch({ 
        is_master: true, 
        business_name: businessName || currentBusinessName,
        branch_id: originalBranchId
      });
    } else {
      const branch = childVendors.find(v => v.branch_id === branchId);
      if (branch) {
        setSelectedMedicine({
          drug_name: original.drug_name,
          vendor_id: branch.vendor_id,
          branch_id: branchId
        });
        setSelectedBranch({ 
          ...branch, 
          business_name: businessName,
          is_master: false 
        });
      } else {
        setError(BRANCH_STOCK_MESSAGES.ERRORS.BRANCH_NOT_FOUND);
        return;
      }
    }
    setPaginationDetail({ page: 1, page_size: 10, total: 0 });
    setFilters(p => ({ ...p, drug_name: '' }));
    setClickedMedicine(null);
    setMedicineDetailData([]);
    setCurrentlyLoadingMedicine(null);
    setIsMedicineDetailModalOpen(false);
    setSearchResults([]);
    setIsSearchModalOpen(false);
  };

  // BACK
  const handleBack = () => {
    setSelectedMedicine(null);
    setSelectedBranch(null);
    setDetailData([]);
    setSelectedTotalStock(0);
    setSelectedTotalItems(0);
    setPaginationDetail({ page: 1, page_size: 10, total: 0 });
    setFilters(p => ({ ...p, drug_name: '' }));
    setClickedMedicine(null);
    setMedicineDetailData([]);
    setCurrentlyLoadingMedicine(null);
    setIsMedicineDetailModalOpen(false);
    setSearchResults([]);
    setIsSearchModalOpen(false);
  };

  // FILTER CHANGE
  const handleFilterChange = useCallback((name, value) => {
    if (name === "branch") {
      setSelectedBranchValue(value || "all");
      setPaginationSummary(p => ({ ...p, page: 1 }));
      return;
    }
    
    if (name === "startDate" || name === "endDate") {
      if (value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          setDateError(BRANCH_STOCK_MESSAGES.ERRORS.INVALID_DATE_FORMAT);
          return;
        }
        const newFilters = { ...filters, [name]: value };
        if (name === "endDate" && newFilters.startDate && value < newFilters.startDate) {
          return;
        }
        if (name === "startDate" && newFilters.endDate && value > newFilters.endDate) {
          setDateError(BRANCH_STOCK_MESSAGES.ERRORS.START_DATE_AFTER_END);
          return;
        }
        setDateError("");
      }
      setFilters(p => ({ ...p, [name]: value }));
    } else {
      setFilters(p => ({ ...p, [name]: value }));
    }
    
    // Reset pagination
    if (selectedMedicine) {
      setPaginationDetail(p => ({ ...p, page: 1 }));
    } else {
      setPaginationSummary(p => ({ ...p, page: 1 }));
    }
  }, [selectedMedicine, filters]);

  // PAGINATION HANDLERS
  const handlePaginationSummary = (page, pageSize) => {
    setPaginationSummary(p => ({ ...p, page, page_size: pageSize }));
  };
  const handlePaginationDetail = (page, pageSize) => {
    setPaginationDetail(p => ({ ...p, page, page_size: pageSize }));
  };
  const handlePaginationMedicineDetail = (page, pageSize) => {
    setPaginationMedicineDetail(p => ({ ...p, page, page_size: pageSize }));
  };

  // RETRY & REFRESH
  const handleRetry = () => {
    setError(null); 
    setDateError("");
    if (selectedMedicine) fetchDetail();
    else fetchSummary();
  };
  const handlePageRefresh = () => {
    if (selectedMedicine) fetchDetail();
    else fetchSummary();
  };

  // ========== USE EFFECTS ==========
  // Summary: fetch when not in detail and filters change
  useEffect(() => {
    if (!selectedMedicine) {
      fetchSummary();
    }
  }, [
    selectedMedicine,
    filters.startDate,
    filters.endDate,
    filters.drug_name,
    filters.medicineType,
    selectedBranchValue,
    fetchSummary
  ]);

  // Detail: fetch when selectedMedicine/selectedBranch changes
  useEffect(() => {
    if (selectedMedicine && selectedBranch) {
      fetchDetail();
      // Reset related states
      setClickedMedicine(null);
      setMedicineDetailData([]);
      setIsMedicineDetailModalOpen(false);
      setCurrentlyLoadingMedicine(null);
      setSearchResults([]);
      setIsSearchModalOpen(false);
    }
  }, [selectedMedicine, selectedBranch, fetchDetail]);

  // Detail: fetch when filters change and already in detail view
  useEffect(() => {
    if (selectedMedicine && selectedBranch) {
      fetchDetail();
    }
  }, [
    selectedMedicine,
    selectedBranch,
    filters.startDate,
    filters.endDate,
    filters.drug_name,
    filters.medicineType,
    fetchDetail
  ]);

  // ========== FILTER FIELDS ==========
  const summaryFilterFields = useMemo(() => [
    {
      type: "dateRange",
      label: "Date",
      fromName: "startDate",
      toName: "endDate",
      value: { start: filters.startDate, end: filters.endDate },
      onChange: (e) => handleFilterChange(e.target.name, e.target.value),
      className: "date-input-black",
    },
    {
      type: "button",
      label: "",
      buttonText: BRANCH_STOCK_MESSAGES.UI.RESET_DATES,
      onClick: handleResetDates,
      variant: "secondary",
      size: "sm",
    },
    ...(isMaster || childVendors.length > 0 ? [{
      type: "select",
      name: "branch",
      label: "Branch",
      placeholder: BRANCH_STOCK_MESSAGES.UI.SELECT_BRANCH_PLACEHOLDER,
      value: selectedBranchValue,
      onChange: (e) => handleFilterChange("branch", e.target.value),
      options: branchOptions,
    }] : []),
  ], [filters.startDate, filters.endDate, selectedBranchValue, handleFilterChange, handleResetDates, isMaster, childVendors, branchOptions]);

  const detailFilterFields = useMemo(() => [
    {
      type: "dateRange",
      label: "Date",
      fromName: "startDate",
      toName: "endDate",
      value: { start: filters.startDate, end: filters.endDate },
      onChange: (e) => handleFilterChange(e.target.name, e.target.value),
      className: "date-input-black",
    },
    {
      type: "button",
      label: "",
      buttonText: BRANCH_STOCK_MESSAGES.UI.RESET_DATES,
      onClick: handleResetDates,
      variant: "secondary",
      size: "sm",
    },
    {
      type: "select",
      name: "medicineType",
      label: BRANCH_STOCK_MESSAGES.UI.MEDICINE_TYPE,
      placeholder: BRANCH_STOCK_MESSAGES.UI.MEDICINE_TYPE_PLACEHOLDER,
      value: filters.medicineType,
      onChange: (e) => handleFilterChange("medicineType", e.target.value),
      options: medicineTypeOptions,
    },
    {
      type: "text",
      label: "Search Medicine",
      name: "drug_name",
      placeholder: BRANCH_STOCK_MESSAGES.UI.SEARCH_MEDICINE_PLACEHOLDER,
      value: filters.drug_name || "",
      onChange: (e) => handleFilterChange("drug_name", e.target.value),
    },
  ], [filters.drug_name, filters.startDate, filters.endDate, filters.medicineType, handleFilterChange, handleResetDates, medicineTypeOptions]);

  // ========== EXPORT ==========
  const exportEndpoint = useMemo(() => {
    if (!selectedMedicine) return null;  
    const drugName = filters.drug_name || '';
    const detailMode = drugName ? 'true' : 'false';
    // Use active dates for export
    return buildEndpoint(drugName, detailMode, activeDateRange.startDate, activeDateRange.endDate, filters.medicineType);
  }, [selectedMedicine, filters.drug_name, filters.medicineType, buildEndpoint, activeDateRange]);

  const medicineExportEndpoint = useMemo(() => {
    if (!clickedMedicine || !selectedMedicine || !isMedicineDetailModalOpen) return null;
    return buildEndpoint(clickedMedicine, 'true', activeDateRange.startDate, activeDateRange.endDate, filters.medicineType);
  }, [clickedMedicine, selectedMedicine, isMedicineDetailModalOpen, filters.medicineType, buildEndpoint, activeDateRange]);

  const exportBody = useMemo(() => {
    if (!selectedMedicine) return null;
    return [{
      vendor_id: selectedMedicine.vendor_id,
      branch_id: selectedMedicine.branch_id,
    }];
  }, [selectedMedicine]);

  const medicineExportBody = useMemo(() => {
    if (!clickedMedicine || !selectedMedicine || !isMedicineDetailModalOpen) return null;
    return [{
      vendor_id: selectedMedicine.vendor_id,
      branch_id: selectedMedicine.branch_id,
    }];
  }, [clickedMedicine, selectedMedicine, isMedicineDetailModalOpen]);

  // ========== COLUMNS ==========
  const summaryColumns = useMemo(() => [
    { 
      accessorKey: "Business Name", 
      header: () => BRANCH_STOCK_MESSAGES.UI.BRANCH, 
      cell: ({ row }) => (
        <div className="font-semibold text-blue-700">
          {row.original.business_name}
          {row.original.is_master && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold">
            {BRANCH_STOCK_MESSAGES.UI.MAIN_BRANCH}
          </span>}
        </div>
      )
    },
    { 
      accessorKey: "Drug Name", 
      header: () => BRANCH_STOCK_MESSAGES.UI.MEDICINE_NAME,
      cell: ({ row }) => (
        <div className="font-medium text-gray-800">{row.original.drug_name}</div>
      )
    },
    { 
      accessorKey: "Manufacturer", 
      header: () => "Manufacturer", 
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.original.manufacturer}</div>
      )
    },
    { 
      accessorKey: "Type", 
      header: () => "Form", 
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.original.type}</div>
      )
    },
    { 
      accessorKey: "Batch Code", 
      header: () => "Batch", 
      cell: ({ row }) => (
        <div className="font-mono text-sm text-gray-700">{row.original.batch_code}</div>
      )
    },
    { 
      accessorKey: "Total Stock", 
      header: () => BRANCH_STOCK_MESSAGES.UI.TOTAL_STOCK, 
      cell: ({ row }) => (
        <div className="text-center font-bold text-green-600">{row.original.stock.toLocaleString()}</div>
      )
    },
    { 
      accessorKey: "Last Added", 
      header: () => "Last Added", 
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.original.added_date}</div>
      )
    },
    { 
      accessorKey: "Actions", 
      header: () => <div className="text-center">Action</div>, 
      enableSorting: false, 
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleViewClick(row)}
            title={BRANCH_STOCK_MESSAGES.UI.VIEW_DETAILS}
            aria-label={BRANCH_STOCK_MESSAGES.UI.VIEW_DETAILS}
          >
            <Eye className="w-5 h-5" />
            {BRANCH_STOCK_MESSAGES.UI.VIEW}
          </Button>
        </div>
      )
    },
  ], [handleViewClick]);

  const detailColumns = useMemo(() => {
    const baseColumns = [
      { 
        accessorKey: "Medicine Name", 
        header: () => BRANCH_STOCK_MESSAGES.UI.MEDICINE_NAME,
        cell: ({ row }) => {
          const medicineName = row.original.medicine_name || row.original.drug_name;
          const isCurrentlyLoading = currentlyLoadingMedicine === medicineName;
          const isExpanded = clickedMedicine === medicineName && isMedicineDetailModalOpen;
          const isAnyMedicineLoading = currentlyLoadingMedicine !== null;
          return (
            <button
              onClick={() => handleMedicineClick(medicineName)}
              className={`flex items-center gap-2 font-medium text-blue-600 hover:text-blue-800 transition-colors hover:underline ${
                isAnyMedicineLoading && !isCurrentlyLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={isAnyMedicineLoading && !isCurrentlyLoading 
                ? BRANCH_STOCK_MESSAGES.UI.PLEASE_WAIT 
                : isExpanded 
                  ? "Click to close details" 
                  : "Click to view batch details"}
              disabled={isCurrentlyLoading || isAnyMedicineLoading}
            >
              {isCurrentlyLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              ) : isExpanded ? (
                <ChevronRight className="w-4 h-4 transform rotate-90" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className={`font-medium ${isExpanded ? 'text-blue-800 font-bold' : 'text-gray-800'} hover:text-blue-800 transition-colors`}>
                {medicineName}
                {isExpanded && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {BRANCH_STOCK_MESSAGES.UI.VIEWING}
                </span>}
                {isAnyMedicineLoading && !isCurrentlyLoading && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {BRANCH_STOCK_MESSAGES.UI.WAIT}
                </span>}
              </span>
            </button>
          );
        }
      },
      { 
        accessorKey: "Batch Code", 
        header: () => "Batch Code", 
        cell: ({ row }) => <div className="font-bold text-blue-700">{row.original.batch_code}</div> 
      },
      { 
        accessorKey: "Total Stock", 
        header: () => BRANCH_STOCK_MESSAGES.UI.STOCK,
        cell: ({ row }) => (
          <div className="font-bold text-green-600">{row.original.stock.toLocaleString()}</div>
        )
      },
    ];
    return [
      ...baseColumns,
      { 
        accessorKey: "Manufacturer", 
        header: () => "Manufacturer", 
        cell: ({ row }) => (
          <div className="text-sm text-gray-600">{row.original.manufacturer}</div>
        )
      },
      { 
        accessorKey: "Type", 
        header: () => "Form", 
        cell: ({ row }) => (
          <div className="text-sm text-gray-600">{row.original.type}</div>
        )
      },
      { 
        accessorKey: "Last Added", 
        header: () => "Last Added", 
        cell: ({ row }) => (
          <div className="text-sm text-gray-600">{row.original.added_date}</div>
        )
      },
    ];
  }, [handleMedicineClick, clickedMedicine, currentlyLoadingMedicine, isMedicineDetailModalOpen]);

  const medicineDetailColumns = useMemo(() => [
    { 
      accessorKey: "Medicine Name", 
      header: () => BRANCH_STOCK_MESSAGES.UI.MEDICINE_NAME,
      cell: ({ row }) => (
        <div className="font-medium text-gray-800">{row.original.medicine_name || row.original.drug_name}</div>
      )
    },
    { 
      accessorKey: "Batch Code", 
      header: () => "Batch Code", 
      cell: ({ row }) => <div className="font-bold text-blue-700">{row.original.batch_code}</div> 
    },
    { 
      accessorKey: "Total Stock", 
      header: () => BRANCH_STOCK_MESSAGES.UI.STOCK,
      cell: ({ row }) => (
        <div className="font-bold text-green-600">{row.original.stock.toLocaleString()}</div>
      )
    },
    { 
      accessorKey: "Strength", 
      header: () => "Strength", 
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-800">{row.original.strength}</div>
      )
    },
    { 
      accessorKey: "Added Date", 
      header: () => "Created Date", 
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.original.added_date}</div>
      )
    },
    { 
      accessorKey: "Expiry Date", 
      header: () => "Expiry Date", 
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.original.expiry_date}</div>
      )
    },
    { 
      accessorKey: "Availability", 
      header: () => "Availability", 
      cell: ({ row }) => (
        <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
          row.original.availability === BRANCH_STOCK_MESSAGES.UI.IN_STOCK
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {row.original.availability}
        </div>
      )
    },
    { 
      accessorKey: "Type", 
      header: () => "Type", 
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.original.type}</div>
      )
    },
    { 
      accessorKey: "Sale Price", 
      header: () => "Sale Price", 
      cell: ({ row }) => (
        <div className="font-medium text-gray-800">₨{row.original.sale_price?.toFixed(2) || '0.00'}</div>
      )
    },
    { 
      accessorKey: "Retail Price", 
      header: () => "Retail Price", 
      cell: ({ row }) => (
        <div className="font-medium text-gray-800">₨{row.original.retail_price?.toFixed(2) || '0.00'}</div>
      )
    },
    { 
      accessorKey: "Manufacturer", 
      header: () => "Manufacturer", 
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.original.manufacturer}</div>
      )
    },
    { 
      accessorKey: "Packing", 
      header: () => "Packing", 
      cell: ({ row }) => (
        <PackingDisplay 
          packing={row.original.packing} 
          unitType={row.original.unit_type}
        />
      )
    },
  ], []);

  const getDateRangeDisplay = useCallback(() => {
    if (activeDateRange.startDate && activeDateRange.endDate) {
      return BRANCH_STOCK_MESSAGES.UI.DATE_RANGE_WITH_DATES
        .replace('{start}', activeDateRange.startDate)
        .replace('{end}', activeDateRange.endDate);
    }
    return '';
  }, [activeDateRange.startDate, activeDateRange.endDate]);

  // ========== RENDER ==========
  return (
    <div className="relative">
      {selectedMedicine && exportEndpoint && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
        <ExportReports 
  data={detailData.map(item => ({
    'Medicine Name': item.medicine_name || item.drug_name || 'N/A',
    'Batch Code': item.batch_code || 'N/A',
    'Stock': item.stock ? Number(item.stock).toLocaleString() : '0',
    'Manufacturer': item.manufacturer || 'N/A',
    'Type': item.type || 'N/A',
    'Last Added': item.added_date || 'N/A'
  }))}
  reportType="Medicine Batch Details" 
  setError={setError}
  headers={['Medicine Name', 'Batch Code', 'Stock', 'Manufacturer', 'Type', 'Last Added']}
/>
        </div>
      )}

      {error && (
        <Alert
          variant="error"
          message={error}
          action={handleRetry}
          actionLabel={BRANCH_STOCK_MESSAGES.UI.RETRY}
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}
      {dateError && (
        <Alert
          variant="error"
          message={dateError}
          className="mb-4"
        />
      )}

      {selectedMedicine ? (
        <>
          <div className="flex flex-row items-center justify-between gap-2 mb-6">
            <Button
              variant="secondary"
              onClick={handleBack}
              className="inline-flex items-center gap-2"
              title={BRANCH_STOCK_MESSAGES.UI.BACK_TO_SUMMARY}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{BRANCH_STOCK_MESSAGES.UI.BACK_TO_SUMMARY}</span>
            </Button>
          </div>

          <Card className="mb-6" bodyClassName="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Package className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 flex-shrink-0" />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    {BRANCH_STOCK_MESSAGES.UI.SUMMARY_TITLE}
                    {activeDateRange.startDate && activeDateRange.endDate && (
                      <span className="text-sm font-normal text-gray-600 flex items-center gap-1">
                        <Calendar className="w-4 h-4 inline-block" />
                        {getDateRangeDisplay()}
                      </span>
                    )}
                  </h2>
                  {selectedBranch && (
                    <p className="text-xs sm:text-sm text-gray-600">
                      {BRANCH_STOCK_MESSAGES.UI.BRANCH}: <span className="font-semibold text-green-700">
                        {selectedBranch.business_name || (selectedBranch.is_master ? currentBusinessName : `Branch ${selectedBranch.branch_id || BRANCH_STOCK_MESSAGES.DEFAULTS.NOT_AVAILABLE}`)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-row gap-2 sm:gap-4">
                <div className="text-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 rounded-lg flex-1">
                  <p className="text-xs text-blue-700 whitespace-nowrap">{BRANCH_STOCK_MESSAGES.UI.TOTAL_MEDICINES}</p>
                  <p className="text-base sm:text-xl font-bold text-blue-800">{selectedTotalItems}</p>
                </div>
                <div className="text-center px-3 sm:px-4 py-1.5 sm:py-2 bg-green-50 rounded-lg flex-1">
                  <p className="text-xs text-green-700 whitespace-nowrap">{BRANCH_STOCK_MESSAGES.UI.TOTAL_STOCK}</p>
                  <p className="text-base sm:text-xl font-bold text-green-800">{selectedTotalStock.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>

          <HomeTable
            title={BRANCH_STOCK_MESSAGES.UI.CLICK_MEDICINE_TIP}
            data={detailData}
            columns={detailColumns}
            loading={loadingDetail}
            pagination={paginationDetail}
            onPaginationChange={handlePaginationDetail}
            serverSideFiltering={true}
            filterFields={detailFilterFields}
            onFilterChange={handleFilterChange}
            error={error}
            onRetry={handleRetry}
            hideDefaultActions
            noDataMessage={BRANCH_STOCK_MESSAGES.UI.NO_MEDICINES_IN_BRANCH}
            className="mb-8"
          />
        </>
      ) : (
        <>
          <Card className="mb-6" bodyClassName="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 truncate max-w-[180px] sm:max-w-full">
                  {BRANCH_STOCK_MESSAGES.UI.PAGE_TITLE}
                </h2>
                {activeDateRange.startDate && activeDateRange.endDate && (
                  <span className="text-sm font-normal text-gray-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4 inline-block" />
                    {getDateRangeDisplay()}
                  </span>
                )}
              </div>
              <Button
                variant="primary"
                onClick={handlePageRefresh}
                loading={loadingSummary}
                loadingText={BRANCH_STOCK_MESSAGES.UI.REFRESHING}
                className="inline-flex items-center gap-2 w-fit sm:w-auto"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{BRANCH_STOCK_MESSAGES.UI.REFRESH}</span>
              </Button>
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
            noDataMessage={BRANCH_STOCK_MESSAGES.UI.NO_STOCK_ITEMS}
          />
        </>
      )}

      {/* Medicine Batch Details Modal */}
      <Modal
        isOpen={isMedicineDetailModalOpen}
        onClose={() => {
          setIsMedicineDetailModalOpen(false);
          setClickedMedicine(null);
          setMedicineDetailData([]);
        }}
        title={
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            <span className="text-sm sm:text-base truncate max-w-[200px] sm:max-w-full">
              {BRANCH_STOCK_MESSAGES.UI.BATCH_DETAILS_TITLE} - {clickedMedicine}
            </span>
          </div>
        }
        size="full"
        className="modal-responsive"
      >
        <div className="space-y-4 h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="text-center px-2 sm:px-3 py-1 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700 whitespace-nowrap">{BRANCH_STOCK_MESSAGES.UI.BATCH_ITEMS}</p>
                <p className="text-sm sm:text-base font-bold text-blue-800">{medicineTotalItems}</p>
              </div>
              <div className="text-center px-2 sm:px-3 py-1 bg-green-50 rounded-lg">
                <p className="text-xs text-green-700 whitespace-nowrap">{BRANCH_STOCK_MESSAGES.UI.TOTAL_STOCK}</p>
                <p className="text-sm sm:text-base font-bold text-green-800">{medicineTotalStock.toLocaleString()}</p>
              </div>
            </div>
            {medicineExportEndpoint && (
              <div className="self-start sm:self-auto">
               <ExportReports 
  data={medicineDetailData.map(item => ({
    'Medicine Name': String(item.medicine_name || 'N/A'),
    'Batch Code': String(item.batch_code || 'N/A'),
    'Stock': String(item.stock || '0'),
    'Strength': String(item.strength || 'N/A'),
    'Last Added': String(item.added_date || 'N/A'),
    'Expiry Date': String(item.expiry_date || 'N/A'),
    'Availability': String(item.availability || 'N/A'),
    'Type': String(item.type || 'N/A'),
    'Sale Price': String(item.sale_price || '0'),
    'Retail Price': String(item.retail_price || '0'),
    'Manufacturer': String(item.manufacturer || 'N/A')
  }))}
  reportType={`Batch Details - ${clickedMedicine}`}
  setError={setError}
  headers={['Medicine Name', 'Batch Code', 'Stock', 'Strength', 'Last Added', 'Expiry Date', 'Availability', 'Type', 'Sale Price', 'Retail Price', 'Manufacturer']}
/>
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-auto">
              <HomeTable
                title={`${clickedMedicine} - Batch Details`}
                data={medicineDetailData}
                columns={medicineDetailColumns}
                loading={loadingMedicineDetails}
                pagination={paginationMedicineDetail}
                onPaginationChange={handlePaginationMedicineDetail}
                serverSideFiltering={false}
                error={error}
                onRetry={() => fetchSpecificMedicineDetails(clickedMedicine)}
                hideDefaultActions
                showColumnVisibility={false}
                noDataMessage={`${BRANCH_STOCK_MESSAGES.UI.NO_BATCH_DETAILS} ${clickedMedicine}`}
                className="h-full"
                tableClassName="text-xs sm:text-sm"
                wrapperClassName="overflow-x-auto"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Search Results Modal */}
      <Modal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="text-sm sm:text-base truncate max-w-[200px] sm:max-w-full">
              {BRANCH_STOCK_MESSAGES.UI.SEARCH_RESULTS_TITLE} "{filters.drug_name}"
            </span>
          </div>
        }
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Found <span className="font-bold text-blue-700">{searchResults.length}</span> {BRANCH_STOCK_MESSAGES.UI.BATCHES_FOUND} "{filters.drug_name}"
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSearchModalOpen(false)}
              className="flex items-center gap-1 text-xs sm:text-sm"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{BRANCH_STOCK_MESSAGES.UI.CLOSE}</span>
            </Button>
          </div>
          
          {searchLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
              <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-600">{BRANCH_STOCK_MESSAGES.UI.SEARCHING} "{filters.drug_name}"...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Package className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
              <p className="text-xs sm:text-sm text-gray-600">{BRANCH_STOCK_MESSAGES.UI.NO_SEARCH_RESULTS} "{filters.drug_name}"</p>
              <p className="text-xs text-gray-500 mt-1">{BRANCH_STOCK_MESSAGES.UI.TRY_DIFFERENT_SEARCH}</p>
            </div>
          ) : (
            <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strength</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {searchResults.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <div className="font-medium text-blue-700 text-xs sm:text-sm">{item.medicine_name || item.drug_name}</div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <div className="font-bold text-gray-800 text-xs sm:text-sm">{item.batch_code}</div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <div className="font-bold text-green-600 text-xs sm:text-sm">{item.stock.toLocaleString()}</div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{item.strength}</div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{item.expiry_date}</div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleViewMedicineFromSearch(item.medicine_name || item.drug_name)}
                            title={BRANCH_STOCK_MESSAGES.UI.VIEW_DETAILS}
                            className="flex items-center gap-1 text-xs px-2 py-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="hidden sm:inline">{BRANCH_STOCK_MESSAGES.UI.VIEW_DETAILS}</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="flex justify-end pt-3 sm:pt-4 border-t">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsSearchModalOpen(false);
                setFilters(p => ({ ...p, drug_name: '' }));
              }}
              className="text-xs sm:text-sm"
            >
              {BRANCH_STOCK_MESSAGES.UI.CLOSE_CLEAR_SEARCH}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}