// AddGeneral.jsx — UPDATED WITH FORM AUTO-OPENED + WORKING SALE PRICE ≤ RETAIL PRICE VALIDATION
import React, { useState, useContext, useEffect, useRef, useMemo } from 'react';
import { getToken } from '../../../../services/tokenUtils';
import { AuthContext } from '../../../auth/hooks/AuthContextDef';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/endpoint/inventory/inventoryEnd';
import { INVENTORY_MODULE_CONSTANTS } from './inventoryconstants/inventoryModuleConstants';

// UI Components
import { 
  Package, Loader2, Plus, Edit3, CheckCircle, Trash2, X, Search, History 
} from 'lucide-react';
import Button from '../../../../components/ui/forms/Button';
import InputText from '../../../../components/ui/forms/InputText';
import InputSelect from '../../../../components/ui/forms/InputSelect';
import DatePicker from '../../../../components/ui/forms/DatePicker';
import Alert from '../../../../components/ui/feedback/Alert';
import Card from '../../../../components/ui/Card';

// ==================== CONSTANTS & ENUMS ====================
const FORM_CONSTANTS = {
  // Field Names
  FIELDS: {
    TEMP_ID: 'tempId',
    NAME: 'name',
    GENERIC_NAME: 'genericName',
    CATEGORY: 'category',
    MANUFACTURER: 'manufacturer',
    BARCODE: 'barcode',
    BATCH_CODE: 'batchCode',
    RETAIL_PRICE: 'retailPrice',
    SALE_PRICE: 'salePrice',
    LOCATION: 'location',
    EXPIRY_DATE: 'expiryDate',
    MANUFACTURE_DATE: 'manufactureDate',
    UNIT_TYPE: 'unit_type',
    PACK_SIZE: 'pack_size',
    TOTAL_PACKS: 'total_packs',
    PRODUCT_SIZE: 'product_size',
    PRODUCT_MODEL: 'product_model',
    STOCK: 'stock',
  },
  
  // Placeholders
  PLACEHOLDERS: {
    PRODUCT_NAME: 'e.g. Dove Soap Galaxy 6',
    GENERIC_NAME: 'e.g. soap',
    MANUFACTURER: 'e.g. GSK',
    BARCODE: 'e.g. 1234567890123',
    BATCH_CODE: 'e.g. B001',
    LOCATION: 'e.g. A1',
    PRODUCT_SIZE: 'e.g. 100g',
    PRODUCT_MODEL: 'e.g. B567',
    TOTAL_PACKS: 'e.g. 10',
    PACK_SIZE: 'e.g. 20',
    CATEGORY_SEARCH: 'Type to search categories...',
  },
  
  // Labels
  LABELS: {
    PRODUCT_NAME: 'Product Name',
    GENERIC_NAME: 'Generic Name',
    CATEGORY: 'Category',
    MANUFACTURER: 'Manufacturer',
    BARCODE: 'Barcode',
    BATCH_CODE: 'Batch Code',
    RETAIL_PRICE: 'Retail Price (PKR)',
    SALE_PRICE: 'Sale Price (PKR)',
    LOCATION: 'Location',
    EXPIRY_DATE: 'Expiry Date',
    MANUFACTURE_DATE: 'Manufacture Date',
    PRODUCT_SIZE: 'Product Size (e.g., 100g, 10ml)',
    PRODUCT_MODEL: 'Product Model (e.g., B567)',
    UNIT_TYPE: 'Unit Type',
    TOTAL_PACKS: 'Total Packs',
    PACK_SIZE: 'Pack Size',
    STOCK: 'Total Stock',
  },
  
  // Validation Messages
  MESSAGES: {
    FILL_ALL_FIELDS: 'Please fill all required fields!',
    INVALID_CATEGORY: 'Invalid category! Please select from dropdown or add new.',
    TOTAL_PACKS_INVALID: 'Total Packs must be greater than 0!',
    PACK_SIZE_REQUIRED: 'Pack Size is required for Full pack item!',
    PACK_SIZE_INVALID: 'Pack Size must be a valid number greater than 0!',
    STOCK_INVALID: 'Stock must be greater than 0!',
    CART_LIMIT: 'Cart limit reached (10 max)',
    ADD_SUCCESS: 'All items added successfully!',
    SALE_PRICE_INVALID: 'Sale price (PKR) must be greater than Retail price (PKR)!',
  },
  
  // Limits
  LIMITS: {
    MAX_CART_ITEMS: 10,
    MAX_NAME_LENGTH: 50,
    MAX_BARCODE_LENGTH: 20,
    MAX_BATCH_CODE_LENGTH: 30,
  },
  
  // UI Texts
  UI: {
    PAGE_TITLE: 'Add General Items',
    PAGE_SUBTITLE: 'Fill Details → Add → Submit All • Auto-save enabled',
    NEW_ITEM_TITLE: 'New General Item Details',
    CART_TITLE: 'Cart',
    NO_ITEMS_MESSAGE: 'No items in cart',
    START_MESSAGE: 'Fill in the form to add items',
    ADD_ITEM_BUTTON: 'Add General Item',
    ADD_TO_CART_BUTTON: 'Add to Cart',
    SUBMIT_BUTTON_TEXT: 'Add {count} Item{plural} to Stock',
    AUTO_RESTORED: 'Auto-restored',
    LOADING_TEXT: 'Submitting...',
  },
};

// Unit Type Enum
const UNIT_TYPES = {
  SINGLE: 'Single item',
  FULL_PACK: 'Full pack item',
  PACK_SOAP: 'Pack item (soap)',
};

// Unit Type Options for Select
const UNIT_TYPE_OPTIONS = [
  { value: '', label: 'Select Unit Type' },
  { value: UNIT_TYPES.SINGLE, label: UNIT_TYPES.SINGLE },
  { value: UNIT_TYPES.FULL_PACK, label: UNIT_TYPES.FULL_PACK },
  { value: UNIT_TYPES.PACK_SOAP, label: UNIT_TYPES.PACK_SOAP },
];

// Empty Item Template
const EMPTY_ITEM = {
  [FORM_CONSTANTS.FIELDS.TEMP_ID]: null,
  [FORM_CONSTANTS.FIELDS.NAME]: '',
  [FORM_CONSTANTS.FIELDS.GENERIC_NAME]: '',
  [FORM_CONSTANTS.FIELDS.CATEGORY]: '',
  [FORM_CONSTANTS.FIELDS.MANUFACTURER]: '',
  [FORM_CONSTANTS.FIELDS.BARCODE]: '',
  [FORM_CONSTANTS.FIELDS.BATCH_CODE]: '',
  [FORM_CONSTANTS.FIELDS.RETAIL_PRICE]: '',
  [FORM_CONSTANTS.FIELDS.SALE_PRICE]: '',
  [FORM_CONSTANTS.FIELDS.LOCATION]: '',
  [FORM_CONSTANTS.FIELDS.EXPIRY_DATE]: '',
  [FORM_CONSTANTS.FIELDS.MANUFACTURE_DATE]: '',
  [FORM_CONSTANTS.FIELDS.UNIT_TYPE]: '',
  [FORM_CONSTANTS.FIELDS.PACK_SIZE]: '',
  [FORM_CONSTANTS.FIELDS.TOTAL_PACKS]: '',
  [FORM_CONSTANTS.FIELDS.PRODUCT_SIZE]: '',
  [FORM_CONSTANTS.FIELDS.PRODUCT_MODEL]: '',
};

// ==================== HELPER: PRICE VALIDATION ====================
const validatePrices = (retailPrice, salePrice) => {
  // Parse values
  const retail = parseFloat(retailPrice);
  const sale = parseFloat(salePrice);
  
  // Check if both are valid numbers
  if (isNaN(retail) || isNaN(sale)) {
    return { isValid: true, message: '' }; // Don't block if prices aren't entered yet
  }
  
  // Check if sale price is greater than retail price
if (sale <= retail) {
  return { isValid: false, message: FORM_CONSTANTS.MESSAGES.SALE_PRICE_INVALID };
}
  
  return { isValid: true, message: '' };
};

// ==================== COMPONENT ====================
export default function AddGeneral() {
  const { user } = useContext(AuthContext);
  const controllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const categoryRef = useRef(null);
  const saveTimerRef = useRef(null);
  
  // Initialize currentItem with an empty item object so form opens automatically
  const [currentItem, setCurrentItem] = useState(() => ({
    ...EMPTY_ITEM,
    [FORM_CONSTANTS.FIELDS.TEMP_ID]: Date.now() + Math.random()
  }));
  const [cart, setCart] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showCategoryResults, setShowCategoryResults] = useState(false);
  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [addCategoryLoading, setAddCategoryLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [addCategoryError, setAddCategoryError] = useState('');
  const [formError, setFormError] = useState('');
  const [showRestoredBadge, setShowRestoredBadge] = useState(false);

  // USE CONSTANTS
  const { vendorId, branchId, businessName } = INVENTORY_MODULE_CONSTANTS.getUserInfo(user);
  const today = INVENTORY_MODULE_CONSTANTS.getTodayDate();
  
  // Auto-save instance
  const autoSave = useMemo(() => new INVENTORY_MODULE_CONSTANTS.IndexedDBAutoSave(), []);
  const autoSaveKey = useMemo(() => `general_${branchId}`, [branchId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (controllerRef.current) controllerRef.current.abort();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Auto-save cart
  useEffect(() => {
    if (cart.length > 0) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        autoSave.save(autoSaveKey, { cart });
      }, 500);
    }
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [cart, autoSave, autoSaveKey]);

  // Auto-restore cart
  useEffect(() => {
    const loadSavedData = async () => {
      const saved = await autoSave.load(autoSaveKey);
      if (saved && saved.cart && saved.cart.length > 0) {
        setCart(saved.cart);
        INVENTORY_MODULE_CONSTANTS.showSuccess(setShowRestoredBadge, true, 3000);
      }
    };
    loadSavedData();
  }, [autoSave, autoSaveKey]);

  const fetchCategories = async () => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      const token = getToken();
      const endpoint = apiEndpoints.vendorCategories();
      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, vendorId);
      
      const response = await apiService.get(endpoint, {
        headers,
        signal: controllerRef.current.signal,
      });
      
      if (!isMountedRef.current) return;
      
      if (response.data.status === 'success') {
        const general = response.data.data.general_categories || [];
        const vendorSpecific = response.data.data.vendor_specific_categories || [];
        setAllCategories([...general, ...vendorSpecific]);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      if (INVENTORY_MODULE_CONSTANTS.isAbortError(err)) return;
      setError(INVENTORY_MODULE_CONSTANTS.getErrorMessage(err));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle click outside category dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setShowCategoryResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddAllToStock = async () => {
    if (cart.length === 0) return;
    
    // --- PRICE VALIDATION FOR ALL CART ITEMS BEFORE API CALL ---
    for (const item of cart) {
      const retail = item[FORM_CONSTANTS.FIELDS.RETAIL_PRICE];
      const sale = item[FORM_CONSTANTS.FIELDS.SALE_PRICE];
      const priceCheck = validatePrices(retail, sale);
     if (!priceCheck.isValid) {
  setError(`"${item[FORM_CONSTANTS.FIELDS.NAME]}" - ${priceCheck.message}`);
  return;
}
    }
    
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();
    
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = getToken();
      const payload = {
        vendor_id: vendorId,
        branch_id: branchId,
        items: cart.map(item => {
          const base = {
            product_name: item[FORM_CONSTANTS.FIELDS.NAME].trim(),
            generic_name: item[FORM_CONSTANTS.FIELDS.GENERIC_NAME].trim(),
            category: item[FORM_CONSTANTS.FIELDS.CATEGORY].trim(),
            manufacturer: item[FORM_CONSTANTS.FIELDS.MANUFACTURER].trim(),
            barcode: item[FORM_CONSTANTS.FIELDS.BARCODE].trim(),
            location: item[FORM_CONSTANTS.FIELDS.LOCATION].trim() || "Not specified",
            expiry_date: item[FORM_CONSTANTS.FIELDS.EXPIRY_DATE],
            manufacture_date: item[FORM_CONSTANTS.FIELDS.MANUFACTURE_DATE],
            stock: parseInt(item[FORM_CONSTANTS.FIELDS.STOCK]),
            retail_price: parseFloat(item[FORM_CONSTANTS.FIELDS.RETAIL_PRICE]),
            sale_price: parseFloat(item[FORM_CONSTANTS.FIELDS.SALE_PRICE]),
            batch_code: item[FORM_CONSTANTS.FIELDS.BATCH_CODE].trim(),
            added_date: today,
            packing: {
              pack_size: item[FORM_CONSTANTS.FIELDS.PACK_SIZE] ? item[FORM_CONSTANTS.FIELDS.PACK_SIZE].trim() : null,
              total_packs: parseInt(item[FORM_CONSTANTS.FIELDS.TOTAL_PACKS]),
              product_size: item[FORM_CONSTANTS.FIELDS.PRODUCT_SIZE]?.trim() || null,
              product_model: item[FORM_CONSTANTS.FIELDS.PRODUCT_MODEL]?.trim() || null,
              unit_type: item[FORM_CONSTANTS.FIELDS.UNIT_TYPE]?.trim() || null,
            },
          };
          return base;
        }),
      };

      const response = await apiService.post(apiEndpoints.addGeneralProduct(), payload, {
        headers: INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, vendorId),
        signal: controllerRef.current.signal,
      });

      if (!isMountedRef.current) return;
      
      if (response.data.status === 'success') {
        INVENTORY_MODULE_CONSTANTS.showSuccess(setSuccess, FORM_CONSTANTS.MESSAGES.ADD_SUCCESS);
        setCart([]);
        setCurrentItem({
          ...EMPTY_ITEM,
          [FORM_CONSTANTS.FIELDS.TEMP_ID]: Date.now() + Math.random()
        });
        autoSave.clear(autoSaveKey);
      } else {
        const errorMessages = response.data.data?.map(item => item.message) || [response.data.message];
        setError(errorMessages.join('; '));
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      if (INVENTORY_MODULE_CONSTANTS.isAbortError(err)) return;
      setError(INVENTORY_MODULE_CONSTANTS.getErrorMessage(err));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const saveToCart = () => {
    if (!currentItem) return;
    setFormError('');
    
    const requiredFields = [
      FORM_CONSTANTS.FIELDS.NAME,
      FORM_CONSTANTS.FIELDS.GENERIC_NAME,
      FORM_CONSTANTS.FIELDS.CATEGORY,
      FORM_CONSTANTS.FIELDS.MANUFACTURER,
      FORM_CONSTANTS.FIELDS.BATCH_CODE,
      FORM_CONSTANTS.FIELDS.RETAIL_PRICE,
      FORM_CONSTANTS.FIELDS.SALE_PRICE,
      FORM_CONSTANTS.FIELDS.TOTAL_PACKS,
      FORM_CONSTANTS.FIELDS.UNIT_TYPE
    ];
    
    const missing = requiredFields.some(f => !currentItem[f]?.toString().trim());
    if (missing) {
      setFormError(FORM_CONSTANTS.MESSAGES.FILL_ALL_FIELDS);
      return;
    }

    // --- PRICE VALIDATION - THIS IS THE KEY CHECK ---
    const retailPrice = currentItem[FORM_CONSTANTS.FIELDS.RETAIL_PRICE];
    const salePrice = currentItem[FORM_CONSTANTS.FIELDS.SALE_PRICE];
    
    // Convert to numbers for comparison
    const retailNum = parseFloat(retailPrice);
    const saleNum = parseFloat(salePrice);
    
 // Check if sale price is NOT greater than retail price
if (!isNaN(retailNum) && !isNaN(saleNum) && saleNum <= retailNum) {
  setFormError(FORM_CONSTANTS.MESSAGES.SALE_PRICE_INVALID);
  return;
}

    if (!allCategories.includes(currentItem[FORM_CONSTANTS.FIELDS.CATEGORY].trim())) {
      setFormError(FORM_CONSTANTS.MESSAGES.INVALID_CATEGORY);
      return;
    }

    const totalPacks = parseInt(currentItem[FORM_CONSTANTS.FIELDS.TOTAL_PACKS]);
    if (isNaN(totalPacks) || totalPacks <= 0) {
      setFormError(FORM_CONSTANTS.MESSAGES.TOTAL_PACKS_INVALID);
      return;
    }

    let stock = totalPacks;
    if (currentItem[FORM_CONSTANTS.FIELDS.UNIT_TYPE] === UNIT_TYPES.FULL_PACK) {
      if (!currentItem[FORM_CONSTANTS.FIELDS.PACK_SIZE]?.trim()) {
        setFormError(FORM_CONSTANTS.MESSAGES.PACK_SIZE_REQUIRED);
        return;
      }
      const packSize = parseInt(currentItem[FORM_CONSTANTS.FIELDS.PACK_SIZE]);
      if (isNaN(packSize) || packSize <= 0) {
        setFormError(FORM_CONSTANTS.MESSAGES.PACK_SIZE_INVALID);
        return;
      }
      stock = packSize * totalPacks;
    }

    if (stock <= 0) {
      setFormError(FORM_CONSTANTS.MESSAGES.STOCK_INVALID);
      return;
    }

    const itemWithStock = { 
      ...currentItem, 
      [FORM_CONSTANTS.FIELDS.STOCK]: stock 
    };

    // If editing, use existing tempId, if new, create one
    if (!itemWithStock[FORM_CONSTANTS.FIELDS.TEMP_ID]) {
      itemWithStock[FORM_CONSTANTS.FIELDS.TEMP_ID] = Date.now() + Math.random();
    }

    setCart(prev => {
      if (prev.length >= FORM_CONSTANTS.LIMITS.MAX_CART_ITEMS) {
        setFormError(FORM_CONSTANTS.MESSAGES.CART_LIMIT);
        return prev;
      }

      // Filter out the old version and add the new one
      const filtered = prev.filter(item => 
        item[FORM_CONSTANTS.FIELDS.TEMP_ID] !== itemWithStock[FORM_CONSTANTS.FIELDS.TEMP_ID]
      );
      return [...filtered, itemWithStock];
    });

    // Clear the form and create a new empty item for next entry
    setCurrentItem({
      ...EMPTY_ITEM,
      [FORM_CONSTANTS.FIELDS.TEMP_ID]: Date.now() + Math.random()
    });
    setCategoryQuery('');
    setFormError('');
  };

  const removeFromCart = (tempId) => {
    setCart(prev => {
      const newCart = prev.filter(item => 
        item[FORM_CONSTANTS.FIELDS.TEMP_ID] !== tempId
      );
      
      // Save updated cart
      if (newCart.length > 0) {
        setTimeout(() => {
          autoSave.save(autoSaveKey, { cart: newCart });
        }, 100);
      } else {
        // If cart is empty, clear the saved data
        autoSave.clear(autoSaveKey);
      }
      
      return newCart;
    });
    
    // If we're editing the item we just removed, clear the form
    if (currentItem && currentItem[FORM_CONSTANTS.FIELDS.TEMP_ID] === tempId) {
      setCurrentItem({
        ...EMPTY_ITEM,
        [FORM_CONSTANTS.FIELDS.TEMP_ID]: Date.now() + Math.random()
      });
      setCategoryQuery('');
    }
  };

  // Handle editing an item from cart
  const editFromCart = (item) => {
    setCurrentItem({ ...item });
    // Update category query to match the item's category
    if (item[FORM_CONSTANTS.FIELDS.CATEGORY]) {
      setCategoryQuery(item[FORM_CONSTANTS.FIELDS.CATEGORY]);
    }
  };

  // Helper to create new item
  const createNewItem = () => {
    setCurrentItem({
      ...EMPTY_ITEM,
      [FORM_CONSTANTS.FIELDS.TEMP_ID]: Date.now() + Math.random()
    });
    setCategoryQuery('');
  };

  // Calculate stock display
  const calculateStockDisplay = (item) => {
    if (!item) return 0;
    
    const totalPacks = parseInt(item[FORM_CONSTANTS.FIELDS.TOTAL_PACKS]) || 0;
    if (item[FORM_CONSTANTS.FIELDS.UNIT_TYPE] === UNIT_TYPES.SINGLE) return totalPacks;
    if (item[FORM_CONSTANTS.FIELDS.UNIT_TYPE] === UNIT_TYPES.FULL_PACK) {
      const packSize = parseInt(item[FORM_CONSTANTS.FIELDS.PACK_SIZE]) || 0;
      return packSize * totalPacks;
    }
    if (item[FORM_CONSTANTS.FIELDS.UNIT_TYPE] === UNIT_TYPES.PACK_SOAP) return totalPacks;
    return 0;
  };

  // Check if pack size field should be shown
  const shouldShowPackSize = (unitType) => {
    return unitType === UNIT_TYPES.FULL_PACK || unitType === UNIT_TYPES.PACK_SOAP;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Card */}
        <Card
          className="mb-6 text-center"
          title={
            <div className="flex items-center justify-center gap-3">
              <Package className="w-10 h-10 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">{FORM_CONSTANTS.UI.PAGE_TITLE}</h1>
              {showRestoredBadge && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full animate-pulse">
                  <History className="w-4 h-4" />
                  {FORM_CONSTANTS.UI.AUTO_RESTORED}
                </span>
              )}
            </div>
          }
          subtitle={FORM_CONSTANTS.UI.PAGE_SUBTITLE}
        />

        {/* Alerts */}
        {error && <Alert variant="error" message={error} className="mb-5" />}
        {success && <Alert variant="success" message={success} icon={<CheckCircle className="w-5 h-5" />} className="mb-5" />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Item Form */}
            {currentItem && (
              <Card
                className="p-6 border-2 border-blue-300 shadow-lg"
                title={
                  <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
  <Edit3 className="w-5 h-5 text-blue-600" />
  <h3 className="text-lg font-bold text-gray-800">
    {currentItem?.[FORM_CONSTANTS.FIELDS.NAME] || FORM_CONSTANTS.UI.NEW_ITEM_TITLE}
  </h3>
</div>
                  </div>
                }
              >
                {formError && <Alert variant="error" message={formError} className="mb-5" />}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputText
                      label={FORM_CONSTANTS.LABELS.PRODUCT_NAME}
                      name={FORM_CONSTANTS.FIELDS.NAME}
                      value={currentItem?.[FORM_CONSTANTS.FIELDS.NAME] || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.NAME]: e.target.value }))}
                      maxLength={FORM_CONSTANTS.LIMITS.MAX_NAME_LENGTH}
                      placeholder={FORM_CONSTANTS.PLACEHOLDERS.PRODUCT_NAME}
                      required
                    />

                    <InputText
                      label={FORM_CONSTANTS.LABELS.GENERIC_NAME}
                      name={FORM_CONSTANTS.FIELDS.GENERIC_NAME}
                      value={currentItem?.[FORM_CONSTANTS.FIELDS.GENERIC_NAME] || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.GENERIC_NAME]: e.target.value }))}
                      maxLength={FORM_CONSTANTS.LIMITS.MAX_NAME_LENGTH}
                      placeholder={FORM_CONSTANTS.PLACEHOLDERS.GENERIC_NAME}
                      required
                    />

                    {/* Category Selector */}
                    <div className="relative" ref={categoryRef}>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        {FORM_CONSTANTS.LABELS.CATEGORY} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <InputText
                          label=""
                          name={FORM_CONSTANTS.FIELDS.CATEGORY}
                          value={categoryQuery}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCategoryQuery(value);
                            setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.CATEGORY]: value }));
                            const trimmed = value.trim().toLowerCase();
                            setFilteredCategories(
                              trimmed.length === 0 
                                ? allCategories 
                                : allCategories.filter(c => c.toLowerCase().includes(trimmed))
                            );
                            setShowCategoryResults(true);
                          }}
                          onFocus={() => {
                            const trimmed = categoryQuery.trim().toLowerCase();
                            setFilteredCategories(
                              trimmed.length === 0 
                                ? allCategories 
                                : allCategories.filter(c => c.toLowerCase().includes(trimmed))
                            );
                            setShowCategoryResults(true);
                          }}
                          placeholder={FORM_CONSTANTS.PLACEHOLDERS.CATEGORY_SEARCH}
                          maxLength={FORM_CONSTANTS.LIMITS.MAX_NAME_LENGTH}
                          prefix={<Search className="w-4 h-4 text-gray-500" />}
                        />
                        
                        {showCategoryResults && (
                          <div className="absolute z-10 mt-1 w-full border border-gray-200 rounded-lg shadow-lg bg-white max-h-40 overflow-y-auto">
                            {filteredCategories.length > 0 ? (
                              filteredCategories.map((cat, i) => (
                                <div
                                  key={i}
                                  onClick={() => {
                                    setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.CATEGORY]: cat }));
                                    setCategoryQuery(cat);
                                    setShowCategoryResults(false);
                                  }}
                                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-0 text-sm"
                                >
                                  {cat}
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-center text-gray-600 text-sm">
                                No matching categories
                                <button 
                                  onClick={() => setAddCategoryModalOpen(true)} 
                                  className="ml-2 text-blue-600 hover:underline"
                                  type="button"
                                >
                                  Add New
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <InputText
                      label={FORM_CONSTANTS.LABELS.MANUFACTURER}
                      name={FORM_CONSTANTS.FIELDS.MANUFACTURER}
                      value={currentItem?.[FORM_CONSTANTS.FIELDS.MANUFACTURER] || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.MANUFACTURER]: e.target.value }))}
                      maxLength={FORM_CONSTANTS.LIMITS.MAX_NAME_LENGTH}
                      placeholder={FORM_CONSTANTS.PLACEHOLDERS.MANUFACTURER}
                      required
                    />

                    <InputText
                      label={FORM_CONSTANTS.LABELS.BARCODE}
                      name={FORM_CONSTANTS.FIELDS.BARCODE}
                      value={currentItem?.[FORM_CONSTANTS.FIELDS.BARCODE] || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.BARCODE]: e.target.value }))}
                      maxLength={FORM_CONSTANTS.LIMITS.MAX_BARCODE_LENGTH}
                      placeholder={FORM_CONSTANTS.PLACEHOLDERS.BARCODE}
                    />

                    <InputText
                      label={FORM_CONSTANTS.LABELS.BATCH_CODE}
                      name={FORM_CONSTANTS.FIELDS.BATCH_CODE}
                      value={currentItem?.[FORM_CONSTANTS.FIELDS.BATCH_CODE] || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.BATCH_CODE]: e.target.value }))}
                      maxLength={FORM_CONSTANTS.LIMITS.MAX_BATCH_CODE_LENGTH}
                      placeholder={FORM_CONSTANTS.PLACEHOLDERS.BATCH_CODE}
                      required
                    />

                    <InputText
                      label={FORM_CONSTANTS.LABELS.RETAIL_PRICE}
                      name={FORM_CONSTANTS.FIELDS.RETAIL_PRICE}
                      type="number"
                      value={currentItem?.[FORM_CONSTANTS.FIELDS.RETAIL_PRICE] || ''}
                      onChange={(e) => {
                        const newRetail = e.target.value;
                        setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.RETAIL_PRICE]: newRetail }));
                        // Clear price error if it becomes valid
                        const sale = currentItem?.[FORM_CONSTANTS.FIELDS.SALE_PRICE] || '';
                        if (sale && newRetail) {
                          const saleNum = parseFloat(sale);
                          const retailNum = parseFloat(newRetail);
                        if (!isNaN(saleNum) && !isNaN(retailNum) && saleNum > retailNum && formError === FORM_CONSTANTS.MESSAGES.SALE_PRICE_INVALID) {
  setFormError('');
}
                        }
                      }}
                      placeholder="e.g. 200.50"
                      min="0"
                      step="0.01"
                      required
                    />

                    <InputText
                      label={FORM_CONSTANTS.LABELS.SALE_PRICE}
                      name={FORM_CONSTANTS.FIELDS.SALE_PRICE}
                      type="number"
                      value={currentItem?.[FORM_CONSTANTS.FIELDS.SALE_PRICE] || ''}
                      onChange={(e) => {
                        const newSale = e.target.value;
                        setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.SALE_PRICE]: newSale }));
                        // Real-time validation - show error immediately if sale > retail
                        const retail = currentItem?.[FORM_CONSTANTS.FIELDS.RETAIL_PRICE] || '';
                        if (retail && newSale) {
                          const retailNum = parseFloat(retail);
                          const saleNum = parseFloat(newSale);
                         if (!isNaN(retailNum) && !isNaN(saleNum) && saleNum <= retailNum) {
  setFormError(FORM_CONSTANTS.MESSAGES.SALE_PRICE_INVALID);
} else if (formError === FORM_CONSTANTS.MESSAGES.SALE_PRICE_INVALID) {
                            setFormError('');
                          }
                        }
                      }}
                      placeholder="e.g. 150.25"
                      min="0"
                      step="0.01"
                      required
                    />

                    <InputText
                      label={FORM_CONSTANTS.LABELS.LOCATION}
                      name={FORM_CONSTANTS.FIELDS.LOCATION}
                      value={currentItem?.[FORM_CONSTANTS.FIELDS.LOCATION] || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.LOCATION]: e.target.value }))}
                      maxLength={FORM_CONSTANTS.LIMITS.MAX_NAME_LENGTH}
                      placeholder={FORM_CONSTANTS.PLACEHOLDERS.LOCATION}
                    />

                    <DatePicker
                      label={FORM_CONSTANTS.LABELS.EXPIRY_DATE}
                      value={currentItem?.[FORM_CONSTANTS.FIELDS.EXPIRY_DATE] || ''}
                      onChange={(date) => setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.EXPIRY_DATE]: date }))}
                      minDate={today}
                      placeholder="Select expiry date"
                    />

                    <DatePicker
                      label={FORM_CONSTANTS.LABELS.MANUFACTURE_DATE}
                      value={currentItem?.[FORM_CONSTANTS.FIELDS.MANUFACTURE_DATE] || ''}
                      onChange={(date) => setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.MANUFACTURE_DATE]: date }))}
                      maxDate={today}
                      placeholder="Select manufacture date"
                    />

                    <InputText
                      label={FORM_CONSTANTS.LABELS.PRODUCT_SIZE}
                      name={FORM_CONSTANTS.FIELDS.PRODUCT_SIZE}
                      value={currentItem?.[FORM_CONSTANTS.FIELDS.PRODUCT_SIZE] || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.PRODUCT_SIZE]: e.target.value }))}
                      maxLength={FORM_CONSTANTS.LIMITS.MAX_NAME_LENGTH}
                      placeholder={FORM_CONSTANTS.PLACEHOLDERS.PRODUCT_SIZE}
                    />

                    <InputText
                      label={FORM_CONSTANTS.LABELS.PRODUCT_MODEL}
                      name={FORM_CONSTANTS.FIELDS.PRODUCT_MODEL}
                      value={currentItem?.[FORM_CONSTANTS.FIELDS.PRODUCT_MODEL] || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.PRODUCT_MODEL]: e.target.value }))}
                      maxLength={FORM_CONSTANTS.LIMITS.MAX_NAME_LENGTH}
                      placeholder={FORM_CONSTANTS.PLACEHOLDERS.PRODUCT_MODEL}
                    />

                    <InputSelect
                      label={FORM_CONSTANTS.LABELS.UNIT_TYPE}
                      name={FORM_CONSTANTS.FIELDS.UNIT_TYPE}
                      value={currentItem?.[FORM_CONSTANTS.FIELDS.UNIT_TYPE] || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.UNIT_TYPE]: e.target.value }))}
                      required
                    >
                      {UNIT_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </InputSelect>

                    <InputText
                      label={FORM_CONSTANTS.LABELS.TOTAL_PACKS}
                      name={FORM_CONSTANTS.FIELDS.TOTAL_PACKS}
                      type="number"
                      min="1"
                      value={currentItem?.[FORM_CONSTANTS.FIELDS.TOTAL_PACKS] || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.TOTAL_PACKS]: e.target.value }))}
                      placeholder={FORM_CONSTANTS.PLACEHOLDERS.TOTAL_PACKS}
                      required
                    />

                    {shouldShowPackSize(currentItem?.[FORM_CONSTANTS.FIELDS.UNIT_TYPE]) && (
                      <InputText
                        label={FORM_CONSTANTS.LABELS.PACK_SIZE}
                        name={FORM_CONSTANTS.FIELDS.PACK_SIZE}
                        type="text"
                        value={currentItem?.[FORM_CONSTANTS.FIELDS.PACK_SIZE] || ''}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, [FORM_CONSTANTS.FIELDS.PACK_SIZE]: e.target.value }))}
                        placeholder={FORM_CONSTANTS.PLACEHOLDERS.PACK_SIZE}
                        required={currentItem?.[FORM_CONSTANTS.FIELDS.UNIT_TYPE] === UNIT_TYPES.FULL_PACK}
                      />
                    )}

                    <InputText
                      label={FORM_CONSTANTS.LABELS.STOCK}
                      name={FORM_CONSTANTS.FIELDS.STOCK}
                      type="number"
                      value={calculateStockDisplay(currentItem)}
                      readOnly
                      className="bg-gray-50"
                      placeholder="Auto-calculated"
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                   
                    <Button
                      onClick={saveToCart}
                      variant="primary"
                      size="md"
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" /> {FORM_CONSTANTS.UI.ADD_TO_CART_BUTTON}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Cart */}
          <div className="lg:col-span-1">
            <Card
              className="sticky top-4"
              title={
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">
                    {FORM_CONSTANTS.UI.CART_TITLE} ({cart.length}/{FORM_CONSTANTS.LIMITS.MAX_CART_ITEMS})
                  </h3>
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              }
            >
              {cart.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p>{FORM_CONSTANTS.UI.NO_ITEMS_MESSAGE}</p>
                  <p className="text-sm mt-2">{FORM_CONSTANTS.UI.START_MESSAGE}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {cart.map(item => (
                      <div
                        key={item[FORM_CONSTANTS.FIELDS.TEMP_ID]}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-all group"
                        onClick={() => editFromCart(item)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-blue-900">{item[FORM_CONSTANTS.FIELDS.NAME]}</div>
                            <div className="text-xs text-blue-700 mt-1">
                              Batch: {item[FORM_CONSTANTS.FIELDS.BATCH_CODE]} • Packs: {item[FORM_CONSTANTS.FIELDS.TOTAL_PACKS]} • Stock: {item[FORM_CONSTANTS.FIELDS.STOCK]} • Rs{item[FORM_CONSTANTS.FIELDS.SALE_PRICE]}
                            </div>
                            <div className="text-xs text-gray-600">
                              {item[FORM_CONSTANTS.FIELDS.CATEGORY]} • {item[FORM_CONSTANTS.FIELDS.UNIT_TYPE]}
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            <Edit3 className="w-4 h-4 text-blue-600" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromCart(item[FORM_CONSTANTS.FIELDS.TEMP_ID]);
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <Button
                      onClick={handleAddAllToStock}
                      loading={loading}
                      loadingText={FORM_CONSTANTS.UI.LOADING_TEXT}
                      variant="primary"
                      size="lg"
                      className="w-full flex items-center justify-center gap-3 py-4"
                      disabled={cart.length === 0 || loading}
                    >
                      <Package className="w-6 h-6" />
                      {FORM_CONSTANTS.UI.SUBMIT_BUTTON_TEXT
                        .replace('{count}', cart.length)
                        .replace('{plural}', cart.length !== 1 ? 's' : '')
                      }
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}