// FindMedicine.jsx - WITH DATE RANGE FILTER
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import { getToken } from '../../../../services/tokenUtils';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/endpoint/inventory/inventoryEnd';
import ExportReports from '../../../common/reports/ExportReports';
import { NO_RECORD_FOUND } from '../../../constants/Messages';
import { useAuth } from '../../../auth/hooks/useAuth';
import { Package } from 'lucide-react';
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { SEARCH_MODULE_CONSTANTS } from "././searchconstants/searchModuleConstants";

// Import packing utilities
import {
  PackingDisplay,
  formatPacking,
  HoverTooltip as PackingHoverTooltip
} from '../../../../components/ui/packingui';

export default function MedicineList() {
  // Refs for cleanup
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const { user } = useAuth();

  // State
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // NEW: Date range state
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: ""
  });

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

  // Get user info using constants
  const { 
    currentVendorId, 
    originalBranchId, 
    isMaster, 
    currentBusinessName 
  } = SEARCH_MODULE_CONSTANTS.getUserInfo(user);
  
  const childVendors = getVendorChildIds() || [];

  // Business name from localStorage
  useEffect(() => {
    const businessName = localStorage.getItem('businessName') || 'Current Branch';
    // This would be set if using initializeBranchState
  }, []);

  // Branch name mapping
  const branchNameMap = useMemo(() => {
    const map = { [originalBranchId]: currentBusinessName };
    childVendors.forEach(item => {
      map[item.branch_id] = item.business_name;
    });
    return map;
  }, [childVendors, originalBranchId, currentBusinessName]);

  // Branch options
  const fullBranchOptions = useMemo(() => 
    SEARCH_MODULE_CONSTANTS.getBranchOptions(user, childVendors), 
    [childVendors, user]
  );

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
      SEARCH_MODULE_CONSTANTS.cancelApiRequest(controllerRef);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

 // Dynamic title - ALWAYS BLUE with "Branch:" prefix for all
const dynamicTitle = useMemo(() => {
  const branchLabel = selectedBranch;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-full">
          Medicine List
        </span>
      </div>
      <span className="hidden sm:inline text-gray-500">—</span>
      <span
        className={`
          inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm w-fit
          bg-blue-100 text-blue-800 border border-blue-300
        `}
      >
        Branch: {branchLabel}
      </span>
    </div>
  );
}, [selectedBranch]);
  const baseEndpoint = useMemo(() => apiEndpoints.drugStock('', 1, 10).split('?')[0], []);

  // Fetch data function - UPDATED with date params
  const fetchDrugs = async () => {
    SEARCH_MODULE_CONSTANTS.cancelApiRequest(controllerRef);
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

      // UPDATED: Add date parameters
      const params = {
        drug_name: searchTerm.trim() || undefined,
        page: pagination.page,
        page_size: pagination.page_size
      };

      // Add date filters if they exist
      if (filters.start_date) {
        params.fromDate = filters.start_date;
      }
      if (filters.end_date) {
        params.toDate = filters.end_date;
      }

      const { data } = await apiService.post(baseEndpoint, selectedBranchesPayload, {
        headers,
        params,
        signal: controllerRef.current.signal,
        timeout: SEARCH_MODULE_CONSTANTS.API_TIMEOUT
      });

      if (!isMountedRef.current) return;

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
               medicine_name: name || "Unknown",  
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
                 medicine_name: name || "Unknown",  
                drug_name: name || "Unknown",
                manufacturer,
                form: type.toLowerCase(),
                strength,
                batch_code,
                sale_price: Number(avail.sale_price) || 0,
                stock: Number(avail.stock) || 0,
                expiry_date,
                packing_display: formatPacking(avail.packing),
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
            const flatPackingDisplay = formatPacking(packing);

            flattened.push({
              id: `${medicine_id}-${flatBatchCode}-0`,
               medicine_name: name || "Unknown",  
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
              type: type,
              packing: packing || {},
              unit_type: unit_type
            });
          }
        });

        setDrugs(flattened);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total_records || 0
        }));
      } else {
        setDrugs([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      SEARCH_MODULE_CONSTANTS.handleApiError(err, setError);
      setDrugs([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Debounced effect using constants - UPDATED dependencies
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    SEARCH_MODULE_CONSTANTS.cancelApiRequest(controllerRef);

    timerRef.current = setTimeout(() => {
      fetchDrugs();
    }, SEARCH_MODULE_CONSTANTS.DEBOUNCE_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchTerm, pagination.page, pagination.page_size, selectedBranchesPayload, filters.start_date, filters.end_date]);

  // Custom filter handler for this component - UPDATED with date handling
  const handleFilterChange = useCallback((name, value) => {
    if (name === "search") {
      setSearchTerm(value);
      setPagination(prev => ({ ...prev, page: 1 }));
    } 
    // NEW: Handle date range changes
    else if (name === "start_date" || name === "end_date") {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }
    else if (name === "branch_id") {
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

  // Pagination change handler
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

  // Columns
  const columns = useMemo(() => {
    const cols = [];
    
    if (selectedValue === 'all') {
      cols.push({ 
        accessorKey: "branch_name", 
        header: "Branch", 
        cell: ({ row }) => <span className="font-medium">{row.original.branch_name}</span>,
        meta: { priority: 1 }
      });
    }
    
    cols.push({ 
      accessorKey: "medicine_name", 
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
      },
      meta: { priority: 1 }
    });
    
    cols.push({ 
      accessorKey: "manufacturer", 
      header: "Manufacturer", 
      cell: ({ row }) => <span className="font-medium">{row.original.manufacturer}</span>,
      meta: { priority: 2 }
    });
    
    cols.push({ 
      accessorKey: "form", 
      header: "Form", 
      cell: ({ row }) => <span className="font-medium">{row.original.form}</span>,
      meta: { priority: 2 }
    });
    
    cols.push({ 
      accessorKey: "strength", 
      header: "Strength", 
      cell: ({ row }) => <span className="font-medium">{row.original.strength}</span>,
      meta: { priority: 2 }
    });
    
    cols.push({ 
      accessorKey: "batch_code", 
      header: "Batch", 
      cell: ({ row }) => <code className="font-medium">{row.original.batch_code}</code>,
      meta: { priority: 3 }
    });
    
    cols.push({
  accessorKey: "expiry_date", 
  header: "Expiry Date", 
  cell: ({ row }) => <span className="font-medium">{SEARCH_MODULE_CONSTANTS.formatDate(row.original.expiry_date, false)}</span>,
  meta: { priority: 2 }
},);
    
    cols.push({ 
      accessorKey: "sale_price", 
      header: "Price", 
      cell: ({ row }) => <span className="font-medium">₨ {row.original.sale_price.toFixed(2)}</span>,
      meta: { priority: 2 }
    });
    
    cols.push({ 
      accessorKey: "stock", 
      header: "Stock", 
      cell: ({ row }) => <span className={`font-medium ${row.original.stock <= 10 ? 'text-red-600' : 'text-green-600'}`}>{row.original.stock}</span>,
      meta: { priority: 2 }
    });
    
    cols.push({ 
      accessorKey: "packing",
      header: "Packing", 
      cell: ({ row }) => (
        <PackingDisplay 
          packing={row.original.packing} 
          unitType={row.original.unit_type}
        />
      ),
      meta: { priority: 3 }
    });
    
    return cols;
  }, [selectedValue]);

  // Filter fields - UPDATED with date range
  const filterFields = useMemo(() => [
     {
      type: "dateRange",
      label: "Date",
      fromName: "start_date",
      toName: "end_date",
      value: { start_date: filters.start_date, end_date: filters.end_date },
      onChange: (e) => handleFilterChange(e.target.name, e.target.value),
      className: "date-input-black",
    },
    {
      type: "text",
      name: "search",
      label: "Medicine Name",
      placeholder: "Type drug name...",
      value: searchTerm,
      onChange: (e) => handleFilterChange("search", e.target.value),
    },
    // NEW: Date range filter in single line
  
    ...(isMaster && fullBranchOptions.length > 1 ? [{
      type: "select",
      name: "branch_id",
      label: "Branch",
      placeholder: "Select Branch",
      value: selectedValue,
      onChange: (e) => handleFilterChange("branch_id", e.target.value),
      options: fullBranchOptions,
    }] : []),
  ], [searchTerm, selectedValue, fullBranchOptions, isMaster, filters.start_date, filters.end_date]);

  // Export parameters - UPDATED with date filters
  const exportParams = useMemo(() => ({
    drug_name: searchTerm.trim() || undefined,
    page: 1,
    page_size: 1000,
    ...(filters.start_date && { fromDate: filters.start_date }),
    ...(filters.end_date && { toDate: filters.end_date })
  }), [searchTerm, filters.start_date, filters.end_date]);

  const exportBody = selectedBranchesPayload;

  return (
    <div className="relative">
      {/* Fixed positioning for Export button */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-6 z-20">
        <ExportReports 
          endpoint={baseEndpoint}
          data={drugs} 
          reportType="Medicine List" 
          headers={columns.map(c => c.accessorKey)} 
          loading={loading} 
          setLoading={setLoading}
          setError={setError}
          body={exportBody}
          params={exportParams}
        />
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
        columnPriority={2} 
      />
    </div>
  );
}