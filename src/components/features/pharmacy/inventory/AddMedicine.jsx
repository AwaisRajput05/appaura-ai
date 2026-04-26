// AddMedicine.jsx — CLEANED WITH CONSTANTS AND ENUMS + SALE PRICE > RETAIL PRICE VALIDATION
import React, { useState, useContext, useRef, useEffect, useMemo, useCallback } from 'react';
import { getToken } from '../../../../services/tokenUtils';
import { AuthContext } from '../../../auth/hooks/AuthContextDef';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/endpoint/inventory/inventoryEnd';
import { INVENTORY_MODULE_CONSTANTS } from './inventoryconstants/inventoryModuleConstants';
import { unitTypes } from '../../../constants/addmedicine';
import debounce from 'lodash.debounce';

// UI Components
import { 
  Package, Loader2, Search, Plus, Edit3, CheckCircle, Trash2, X, History 
} from 'lucide-react';
import Button from '../../../../components/ui/forms/Button';
import InputText from '../../../../components/ui/forms/InputText';
import InputSelect from '../../../../components/ui/forms/InputSelect';
import DatePicker from '../../../../components/ui/forms/DatePicker';
import Alert from '../../../../components/ui/feedback/Alert';
import Card from '../../../../components/ui/Card';

// ==================== CONSTANTS & ENUMS ====================
const MEDICINE_CONSTANTS = {
  // Field Names
  FIELDS: {
    TEMP_ID: 'tempId',
    MEDICINE_ID: 'medicine_id',
    NAME: 'name',
    TYPE: 'type',
    TYPE_OPTIONS: 'typeOptions',
    STRENGTH: 'strength',
    MANUFACTURER: 'manufacturer',
    BATCH_CODE: 'batchCode',
    RETAIL_PRICE: 'retailPrice',
    SALE_PRICE: 'salePrice',
    LOCATION: 'location',
    EXPIRY_DATE: 'expiryDate',
    PRESCRIPTIONS_REQUIRED: 'prescriptionsRequired',
    AGE_RESTRICTIONS: 'ageRestrictions',
    UNIT_TYPE: 'unitType',
    TOTAL_PACK: 'total_pack',
    PACK_STRIP: 'pack_strip',
    STRIP_TABLET: 'strip_tablet',
    STOCK: 'stock',
  },
  
  // Unit Types from external config
  UNIT_TYPES: unitTypes,
  
  // Form Type Options
  FORM_TYPES: {
    DEFAULT: ['Tablet', 'Syrup', 'Injection'],
    SOLID_FORMS: ['tablet', 'caplet', 'capsule'],
    SEPARATOR_REGEX: / or | and /gi,
  },
  
  // Validation Messages
  MESSAGES: {
    FILL_ALL_FIELDS: 'Please fill all required fields!',
    STOCK_INVALID: 'Stock must be greater than 0!',
    CART_LIMIT: 'Cart limit reached (10 max)',
    ADD_SUCCESS: 'Record added successfully!',
    ALREADY_IN_CART: 'Already added to cart!',
    NO_MEDICINES_FOUND: 'No medicines found',
    SEARCH_MIN_CHARS: 'Search medicine name (min 3 chars)...',
    MAX_NUMBER_LIMIT: 'Value cannot exceed 99,999 (max 5 digits)',
    SALE_PRICE_INVALID: 'Sale price (PKR) must be greater than Retail price (PKR)!',
  },
  
  // Placeholders
  PLACEHOLDERS: {
    MEDICINE_NAME: 'e.g. Paracetamol',
    STRENGTH: 'e.g. 500mg',
    MANUFACTURER: 'e.g. ABC Pharma',
    BATCH_CODE: 'e.g. BATCH2025A',
    LOCATION: 'e.g. Aisle 3, Shelf B',
    AGE_RESTRICTION: 'e.g. 18',
    NUMBER_INPUT: 'e.g. 5 (max 99,999)',
    PRICE_RETAIL: 'e.g. 1100.00',
    PRICE_SALE: 'e.g. 1250.00',
    SEARCH: 'Search medicine name (min 3 chars)...',
  },
  
  // Labels
  LABELS: {
    MEDICINE_NAME: 'Medicine Name',
    FORM_TYPE: 'Form Type',
    UNIT_TYPE: 'Unit Type',
    STRENGTH_SIZE: 'Strength / Size',
    MANUFACTURER: 'Manufacturer',
    BATCH_CODE: 'Batch Code',
    RETAIL_PRICE: 'Retail Price (PKR)',
    SALE_PRICE: 'Sale Price (PKR)',
    LOCATION: 'Location',
    EXPIRY_DATE: 'Expiry Date',
    AGE_RESTRICTION: 'Age Restriction',
    PRESCRIPTION_REQUIRED: 'Prescription Required',
    STOCK: 'Stock',
  },
  
  // UI Texts
  UI: {
    PAGE_TITLE: 'Add Medicines to Stock',
    PAGE_SUBTITLE: 'Search → Fill Details → Add → Submit All • Auto-save enabled',
    SEARCH_TITLE: 'Search Medicines',
    SEARCH_SUBTITLE: 'Search by name (minimum 3 characters)',
    NEW_MEDICINE_TITLE: 'New Medicine Details',
    CART_TITLE: 'Ready to Add',
    NO_ITEMS_MESSAGE: 'No items in cart',
    START_MESSAGE: 'Search and add medicines to get started',
    ADD_OWN_MEDICINE: 'Add Your Own Medicine',
    ADD_TO_CART_BUTTON: 'Add to Cart',
    SUBMIT_BUTTON_TEXT: 'Add {count} to Stock',
    AUTO_RESTORED: 'Auto-restored',
    LOADING_TEXT: 'Submitting...',
  },
  
  // Limits
  LIMITS: {
    MAX_CART_ITEMS: 10,
    MAX_NAME_LENGTH: 50,
    MAX_STRENGTH_LENGTH: 30,
    MAX_BATCH_CODE_LENGTH: 30,
    SEARCH_MIN_CHARS: 3,
    AGE_MAX_LENGTH: 2,
    MAX_NUMBER_DIGITS: 5,
    MAX_NUMBER_VALUE: 99999,
  },
  
  // Default Values
  DEFAULTS: {
    PRESCRIPTION_REQUIRED: 'No',
    AGE_RESTRICTIONS: '',
    LOCATION: 'Not specified',
    UNIT_TYPE_SOLID: 'pack',
    UNIT_TYPE_LIQUID: 'liquid',
  },
  
  // API
  API: {
    STATUS_SUCCESS: 'success',
    STATUS_NOT_FOUND: 'not_found',
  },
};

// Prescription Options
const PRESCRIPTION_OPTIONS = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

// Empty Medicine Template
const EMPTY_MEDICINE = {
  [MEDICINE_CONSTANTS.FIELDS.TEMP_ID]: null,
  [MEDICINE_CONSTANTS.FIELDS.MEDICINE_ID]: null,
  [MEDICINE_CONSTANTS.FIELDS.NAME]: '',
  [MEDICINE_CONSTANTS.FIELDS.TYPE]: MEDICINE_CONSTANTS.FORM_TYPES.DEFAULT[0],
  [MEDICINE_CONSTANTS.FIELDS.TYPE_OPTIONS]: MEDICINE_CONSTANTS.FORM_TYPES.DEFAULT,
  [MEDICINE_CONSTANTS.FIELDS.STRENGTH]: '',
  [MEDICINE_CONSTANTS.FIELDS.MANUFACTURER]: '',
  [MEDICINE_CONSTANTS.FIELDS.BATCH_CODE]: '',
  [MEDICINE_CONSTANTS.FIELDS.RETAIL_PRICE]: '',
  [MEDICINE_CONSTANTS.FIELDS.SALE_PRICE]: '',
  [MEDICINE_CONSTANTS.FIELDS.LOCATION]: '',
  [MEDICINE_CONSTANTS.FIELDS.EXPIRY_DATE]: '',
  [MEDICINE_CONSTANTS.FIELDS.PRESCRIPTIONS_REQUIRED]: MEDICINE_CONSTANTS.DEFAULTS.PRESCRIPTION_REQUIRED,
  [MEDICINE_CONSTANTS.FIELDS.AGE_RESTRICTIONS]: MEDICINE_CONSTANTS.DEFAULTS.AGE_RESTRICTIONS,
  [MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]: MEDICINE_CONSTANTS.DEFAULTS.UNIT_TYPE_SOLID,
  [MEDICINE_CONSTANTS.FIELDS.TOTAL_PACK]: '',
  [MEDICINE_CONSTANTS.FIELDS.PACK_STRIP]: '',
  [MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET]: '',
  [MEDICINE_CONSTANTS.FIELDS.STOCK]: '',
};

// Helper Functions
const isSolidForm = (type) => {
  if (!type) return false;
  const lower = type.toLowerCase();
  return MEDICINE_CONSTANTS.FORM_TYPES.SOLID_FORMS.some(form => lower.includes(form));
};

const extractTypeOptions = (typeString) => {
  if (!typeString) return MEDICINE_CONSTANTS.FORM_TYPES.DEFAULT;
  
  const options = typeString
    .replace(MEDICINE_CONSTANTS.FORM_TYPES.SEPARATOR_REGEX, ',')
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);
  
  return [...new Set(options)];
};

// Helper function to validate and limit number input
const validateNumberInput = (value, fieldName) => {
  if (!value) return '';
  
  let processedValue = value.toString().replace(/^0+/, '');
  if (processedValue === '') processedValue = '0';
  
  let numValue = parseInt(processedValue, 10);
  if (isNaN(numValue)) return '';
  
  if (numValue > MEDICINE_CONSTANTS.LIMITS.MAX_NUMBER_VALUE) {
    numValue = MEDICINE_CONSTANTS.LIMITS.MAX_NUMBER_VALUE;
  }
  
  return numValue.toString();
};

// ==================== HELPER: PRICE VALIDATION ====================
const validatePrices = (retailPrice, salePrice) => {
  const retail = parseFloat(retailPrice);
  const sale = parseFloat(salePrice);
  if (isNaN(retail) || isNaN(sale)) {
    return { isValid: true, message: '' };
  }
  // Sale must be GREATER than Retail
  if (sale <= retail) {
    return { isValid: false, message: MEDICINE_CONSTANTS.MESSAGES.SALE_PRICE_INVALID };
  }
  return { isValid: true, message: '' };
};

// ==================== COMPONENT ====================
export default function AddMedicine() {
  const { user } = useContext(AuthContext);
  const controllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const searchRef = useRef(null);
  const saveTimerRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [noResultsMessage, setNoResultsMessage] = useState('');
  const [currentMedicine, setCurrentMedicine] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [showRestoredBadge, setShowRestoredBadge] = useState(false);
  const [numberError, setNumberError] = useState('');

  // USE CONSTANTS
  const { vendorId, branchId, businessName } = INVENTORY_MODULE_CONSTANTS.getUserInfo(user);
  const today = INVENTORY_MODULE_CONSTANTS.getTodayDate();
  
  // Auto-save instance
  const autoSave = useMemo(() => new INVENTORY_MODULE_CONSTANTS.IndexedDBAutoSave(), []);
  const autoSaveKey = useMemo(() => `medicine_${branchId}`, [branchId]);

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
        setShowRestoredBadge(true);
        setTimeout(() => setShowRestoredBadge(false), 3000);
      }
    };
    loadSavedData();
  }, [autoSave, autoSaveKey]);

  const debouncedSearch = useMemo(
    () => debounce(async (query) => {
      if (query.trim().length < MEDICINE_CONSTANTS.LIMITS.SEARCH_MIN_CHARS) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      
      if (controllerRef.current) controllerRef.current.abort();
      controllerRef.current = new AbortController();
      
      setSearchLoading(true);
      setNoResultsMessage('');
      
      try {
        const token = getToken();
        const response = await apiService.get(apiEndpoints.searchMedicine(query), {
          headers: INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, vendorId),
          signal: controllerRef.current.signal,
        });
        
        if (!isMountedRef.current) return;
        
        if (response.data.status === MEDICINE_CONSTANTS.API.STATUS_SUCCESS) {
          const results = response.data.data || [];
          setSearchResults(results);
          if (results.length === 0) {
            setNoResultsMessage(MEDICINE_CONSTANTS.MESSAGES.NO_MEDICINES_FOUND);
          }
          setShowResults(true);
        } else if (response.data.status === MEDICINE_CONSTANTS.API.STATUS_NOT_FOUND) {
          setSearchResults(response.data.data || []);
          setNoResultsMessage(response.data.message || MEDICINE_CONSTANTS.MESSAGES.NO_MEDICINES_FOUND);
          setShowResults(true);
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        if (INVENTORY_MODULE_CONSTANTS.isAbortError(err)) return;
        setNoResultsMessage(MEDICINE_CONSTANTS.MESSAGES.NO_MEDICINES_FOUND);
        setShowResults(true);
        setSearchResults([]);
      } finally {
        if (isMountedRef.current) {
          setSearchLoading(false);
        }
      }
    }, 400),
    [branchId, vendorId]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim().length >= MEDICINE_CONSTANTS.LIMITS.SEARCH_MIN_CHARS) debouncedSearch(value);
    else {
      setSearchResults([]);
      setShowResults(false);
      setNoResultsMessage('');
    }
  };

  const selectMedicine = (medicine) => {
    const alreadyInCart = cart.some(m => 
      m[MEDICINE_CONSTANTS.FIELDS.MEDICINE_ID] === medicine.medicine_id
    );
    if (alreadyInCart) {
      INVENTORY_MODULE_CONSTANTS.showError(
        setError, 
        MEDICINE_CONSTANTS.MESSAGES.ALREADY_IN_CART, 
        3000
      );
      return;
    }

    const typeOptions = extractTypeOptions(medicine.type || 'Tablet');
    const selectedType = typeOptions[0];
    const solid = isSolidForm(selectedType);
    const defaultUnitType = solid 
      ? MEDICINE_CONSTANTS.DEFAULTS.UNIT_TYPE_SOLID 
      : MEDICINE_CONSTANTS.DEFAULTS.UNIT_TYPE_LIQUID;

    setCurrentMedicine({
      [MEDICINE_CONSTANTS.FIELDS.TEMP_ID]: Date.now() + Math.random(),
      [MEDICINE_CONSTANTS.FIELDS.MEDICINE_ID]: medicine.medicine_id,
      [MEDICINE_CONSTANTS.FIELDS.NAME]: medicine.name || '',
      [MEDICINE_CONSTANTS.FIELDS.TYPE]: selectedType,
      [MEDICINE_CONSTANTS.FIELDS.TYPE_OPTIONS]: typeOptions,
      [MEDICINE_CONSTANTS.FIELDS.STRENGTH]: medicine.strength || '',
      [MEDICINE_CONSTANTS.FIELDS.MANUFACTURER]: medicine.manufacturer || '',
      [MEDICINE_CONSTANTS.FIELDS.BATCH_CODE]: '',
      [MEDICINE_CONSTANTS.FIELDS.RETAIL_PRICE]: '',
      [MEDICINE_CONSTANTS.FIELDS.SALE_PRICE]: '',
      [MEDICINE_CONSTANTS.FIELDS.LOCATION]: '',
      [MEDICINE_CONSTANTS.FIELDS.EXPIRY_DATE]: '',
      [MEDICINE_CONSTANTS.FIELDS.PRESCRIPTIONS_REQUIRED]: MEDICINE_CONSTANTS.DEFAULTS.PRESCRIPTION_REQUIRED,
      [MEDICINE_CONSTANTS.FIELDS.AGE_RESTRICTIONS]: '',
      [MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]: defaultUnitType,
      [MEDICINE_CONSTANTS.FIELDS.TOTAL_PACK]: '',
      [MEDICINE_CONSTANTS.FIELDS.PACK_STRIP]: '',
      [MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET]: '',
      [MEDICINE_CONSTANTS.FIELDS.STOCK]: '',
    });

    setSearchQuery('');
    setShowResults(false);
  };

  const handleAddOwnMedicine = () => {
    setCurrentMedicine({
      ...EMPTY_MEDICINE,
      [MEDICINE_CONSTANTS.FIELDS.TEMP_ID]: Date.now() + Math.random(),
    });
  };

  // Auto-calculate stock with number limit validation
  useEffect(() => {
    if (!currentMedicine || !currentMedicine[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]) return;

    const unitConfig = MEDICINE_CONSTANTS.UNIT_TYPES[currentMedicine[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]];
    if (!unitConfig) return;

    let tp = Number(currentMedicine[MEDICINE_CONSTANTS.FIELDS.TOTAL_PACK]) || 0;
    let ps = Number(currentMedicine[MEDICINE_CONSTANTS.FIELDS.PACK_STRIP]) || 0;
    let st = Number(currentMedicine[MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET]) || 0;

    if (!unitConfig.fields[MEDICINE_CONSTANTS.FIELDS.PACK_STRIP]) ps = 1;
    if (!unitConfig.fields[MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET]) st = 1;

    const maxValue = MEDICINE_CONSTANTS.LIMITS.MAX_NUMBER_VALUE;
    if (tp > maxValue || ps > maxValue || st > maxValue) {
      setNumberError(MEDICINE_CONSTANTS.MESSAGES.MAX_NUMBER_LIMIT);
    } else {
      setNumberError('');
    }

    const calculated_stock = tp * ps * st;

    if (calculated_stock > maxValue) {
      setNumberError(MEDICINE_CONSTANTS.MESSAGES.MAX_NUMBER_LIMIT);
    } else if (calculated_stock > 0 && 
        calculated_stock.toString() !== currentMedicine[MEDICINE_CONSTANTS.FIELDS.STOCK]) {
      setCurrentMedicine(prev => ({ 
        ...prev, 
        [MEDICINE_CONSTANTS.FIELDS.STOCK]: calculated_stock.toString() 
      }));
    }
  }, [
    currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.TOTAL_PACK], 
    currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.PACK_STRIP], 
    currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET], 
    currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]
  ]);

  const updateCurrent = useCallback((field, value) => {
    setCurrentMedicine(prev => {
      if (!prev) return prev;

      let processedValue = value;
      
      const stockRelatedFields = [
        MEDICINE_CONSTANTS.FIELDS.TOTAL_PACK,
        MEDICINE_CONSTANTS.FIELDS.PACK_STRIP,
        MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET,
        MEDICINE_CONSTANTS.FIELDS.STOCK
      ];
      
      if (stockRelatedFields.includes(field)) {
        processedValue = validateNumberInput(value, field);
      }

      const updated = { ...prev, [field]: processedValue };

      if (field === MEDICINE_CONSTANTS.FIELDS.TYPE) {
        const solid = isSolidForm(processedValue);
        updated[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE] = solid 
          ? MEDICINE_CONSTANTS.DEFAULTS.UNIT_TYPE_SOLID 
          : MEDICINE_CONSTANTS.DEFAULTS.UNIT_TYPE_LIQUID;
        updated[MEDICINE_CONSTANTS.FIELDS.TOTAL_PACK] = '';
        updated[MEDICINE_CONSTANTS.FIELDS.PACK_STRIP] = '';
        updated[MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET] = '';
        updated[MEDICINE_CONSTANTS.FIELDS.STOCK] = '';
      }

      if (field === MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE) {
        updated[MEDICINE_CONSTANTS.FIELDS.TOTAL_PACK] = '';
        updated[MEDICINE_CONSTANTS.FIELDS.PACK_STRIP] = '';
        updated[MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET] = '';
        updated[MEDICINE_CONSTANTS.FIELDS.STOCK] = '';
      }

      return updated;
    });
  }, []);

  const saveToCart = () => {
    if (!currentMedicine) return;

    setFormError('');

    const requiredFields = [
      MEDICINE_CONSTANTS.FIELDS.NAME,
      MEDICINE_CONSTANTS.FIELDS.MANUFACTURER,
      MEDICINE_CONSTANTS.FIELDS.BATCH_CODE,
      MEDICINE_CONSTANTS.FIELDS.RETAIL_PRICE,
      MEDICINE_CONSTANTS.FIELDS.SALE_PRICE,
      MEDICINE_CONSTANTS.FIELDS.EXPIRY_DATE
    ];
    
    const unitConfig = MEDICINE_CONSTANTS.UNIT_TYPES[currentMedicine[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]] || {};
    const packingFields = Object.keys(unitConfig.fields || {});
    requiredFields.push(...packingFields);

    const missing = requiredFields.some(f => 
      !currentMedicine[f]?.toString().trim()
    );
    
    if (missing) {
      setFormError(MEDICINE_CONSTANTS.MESSAGES.FILL_ALL_FIELDS);
      return;
    }

    // --- PRICE VALIDATION: Sale must be GREATER than Retail ---
    const retailPrice = currentMedicine[MEDICINE_CONSTANTS.FIELDS.RETAIL_PRICE];
    const salePrice = currentMedicine[MEDICINE_CONSTANTS.FIELDS.SALE_PRICE];
    const retailNum = parseFloat(retailPrice);
    const saleNum = parseFloat(salePrice);
    
    if (!isNaN(retailNum) && !isNaN(saleNum) && saleNum <= retailNum) {
      setFormError(MEDICINE_CONSTANTS.MESSAGES.SALE_PRICE_INVALID);
      return;
    }

    const stockValue = Number(currentMedicine[MEDICINE_CONSTANTS.FIELDS.STOCK]);
    if (stockValue <= 0) {
      setFormError(MEDICINE_CONSTANTS.MESSAGES.STOCK_INVALID);
      return;
    }
    
    if (stockValue > MEDICINE_CONSTANTS.LIMITS.MAX_NUMBER_VALUE) {
      setFormError(MEDICINE_CONSTANTS.MESSAGES.MAX_NUMBER_LIMIT);
      return;
    }

    setCart(prev => {
      if (prev.length >= MEDICINE_CONSTANTS.LIMITS.MAX_CART_ITEMS) {
        setFormError(MEDICINE_CONSTANTS.MESSAGES.CART_LIMIT);
        return prev;
      }

      let filtered = prev;
      if (currentMedicine[MEDICINE_CONSTANTS.FIELDS.MEDICINE_ID]) {
        filtered = prev.filter(m => 
          m[MEDICINE_CONSTANTS.FIELDS.MEDICINE_ID] !== currentMedicine[MEDICINE_CONSTANTS.FIELDS.MEDICINE_ID]
        );
      }

      return [...filtered, { ...currentMedicine }];
    });

    setCurrentMedicine(null);
    setFormError('');
    setNumberError('');
  };

  const editFromCart = (med) => {
    setCurrentMedicine({ ...med });
  };

  const handleAddAllToStock = async () => {
    if (cart.length === 0) return;
    
    // --- PRICE VALIDATION FOR ALL CART ITEMS BEFORE API CALL ---
    for (const med of cart) {
      const retail = med[MEDICINE_CONSTANTS.FIELDS.RETAIL_PRICE];
      const sale = med[MEDICINE_CONSTANTS.FIELDS.SALE_PRICE];
      const retailNum = parseFloat(retail);
      const saleNum = parseFloat(sale);
      if (!isNaN(retailNum) && !isNaN(saleNum) && saleNum <= retailNum) {
        setError(`Medicine "${med[MEDICINE_CONSTANTS.FIELDS.NAME]}" - ${MEDICINE_CONSTANTS.MESSAGES.SALE_PRICE_INVALID}`);
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
      const payload = cart.map(med => {
        const base = {
          name: med[MEDICINE_CONSTANTS.FIELDS.NAME].trim(),
          batch_code: med[MEDICINE_CONSTANTS.FIELDS.BATCH_CODE].trim(),
          retail_price: parseFloat(med[MEDICINE_CONSTANTS.FIELDS.RETAIL_PRICE]),
          sale_price: parseFloat(med[MEDICINE_CONSTANTS.FIELDS.SALE_PRICE]),
          strength: med[MEDICINE_CONSTANTS.FIELDS.STRENGTH].trim(),
          age_restrictions: med[MEDICINE_CONSTANTS.FIELDS.AGE_RESTRICTIONS] 
            ? `${med[MEDICINE_CONSTANTS.FIELDS.AGE_RESTRICTIONS]}+` 
            : 'None',
          location: med[MEDICINE_CONSTANTS.FIELDS.LOCATION].trim() || MEDICINE_CONSTANTS.DEFAULTS.LOCATION,
          prescriptions_required: med[MEDICINE_CONSTANTS.FIELDS.PRESCRIPTIONS_REQUIRED] === 'Yes',
          stock: parseInt(med[MEDICINE_CONSTANTS.FIELDS.STOCK]),
          manufacturer: med[MEDICINE_CONSTANTS.FIELDS.MANUFACTURER].trim(),
          expiry_date: med[MEDICINE_CONSTANTS.FIELDS.EXPIRY_DATE],
          type: med[MEDICINE_CONSTANTS.FIELDS.TYPE].trim(),
          unit_type: MEDICINE_CONSTANTS.UNIT_TYPES[med[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]]?.label || med[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE],
        };

        if (med[MEDICINE_CONSTANTS.FIELDS.MEDICINE_ID]) {
          base.medicine_id = med[MEDICINE_CONSTANTS.FIELDS.MEDICINE_ID];
        }

        const unitConfig = MEDICINE_CONSTANTS.UNIT_TYPES[med[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]];
        if (unitConfig && Object.keys(unitConfig.fields || {}).length > 0) {
          const tp = parseInt(med[MEDICINE_CONSTANTS.FIELDS.TOTAL_PACK]) || 0;
          const ps = parseInt(med[MEDICINE_CONSTANTS.FIELDS.PACK_STRIP]) || 1;
          const st = parseInt(med[MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET]) || 1;

          base.packing = {};

          if (med[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE] === 'pack') {
            base.packing.total_pack = tp;
            base.packing.pack_strip = ps;
            base.packing.strip_tablet = st;
            base.packing.total_strip = tp * ps;
            base.packing.total_tablets = tp * ps * st;
          } else if (med[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE] === 'strip') {
            base.packing.total_strip = tp;
            base.packing.strip_tablet = st;
            base.packing.total_tablets = tp * st;
          } else if (med[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE] === 'loose') {
            base.packing.total_tablets = tp;
          } else if (med[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE] === 'liquid') {
            base.packing.total_pack = tp;
          } else {
            base.packing.total_pack = tp;
          }
        }

        return base;
      });

      const headers = {
        ...INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, vendorId),
        ...(branchId && { 'X-User-Branch-Id': branchId })
      };

      const response = await apiService.post(
        apiEndpoints.addStock(),
        payload,
        {
          headers: headers,
          signal: controllerRef.current.signal,
        }
      );

      if (!isMountedRef.current) return;
      
      if (response.data.status === MEDICINE_CONSTANTS.API.STATUS_SUCCESS) {
        INVENTORY_MODULE_CONSTANTS.showSuccess(
          setSuccess, 
          MEDICINE_CONSTANTS.MESSAGES.ADD_SUCCESS, 
          20000
        );
        setCart([]);
        setCurrentMedicine(null);
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

  const removeFromCart = useCallback((tempId) => {
    setCart(prev => {
      const newCart = prev.filter(m => 
        m[MEDICINE_CONSTANTS.FIELDS.TEMP_ID] !== tempId
      );
      
      if (newCart.length > 0) {
        setTimeout(() => {
          autoSave.save(autoSaveKey, { cart: newCart });
        }, 100);
      } else {
        autoSave.clear(autoSaveKey);
      }
      
      return newCart;
    });
  }, [autoSave, autoSaveKey]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCloseForm = () => {
    setCurrentMedicine(null);
    setNumberError('');
  };

  const calculatedStock = useMemo(() => {
    if (!currentMedicine || !currentMedicine[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]) return '';
    
    const unitConfig = MEDICINE_CONSTANTS.UNIT_TYPES[currentMedicine[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]];
    if (!unitConfig) return '';
    
    let tp = Number(currentMedicine[MEDICINE_CONSTANTS.FIELDS.TOTAL_PACK]) || 0;
    let ps = Number(currentMedicine[MEDICINE_CONSTANTS.FIELDS.PACK_STRIP]) || 0;
    let st = Number(currentMedicine[MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET]) || 0;
    
    if (!unitConfig.fields[MEDICINE_CONSTANTS.FIELDS.PACK_STRIP]) ps = 1;
    if (!unitConfig.fields[MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET]) st = 1;
    
    const result = tp * ps * st;
    if (result > MEDICINE_CONSTANTS.LIMITS.MAX_NUMBER_VALUE) {
      return '';
    }
    return result.toString();
  }, [
    currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.TOTAL_PACK], 
    currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.PACK_STRIP], 
    currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET], 
    currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]
  ]);

  useEffect(() => {
    if (currentMedicine && calculatedStock && 
        calculatedStock !== currentMedicine[MEDICINE_CONSTANTS.FIELDS.STOCK]) {
      setCurrentMedicine(prev => ({ 
        ...prev, 
        [MEDICINE_CONSTANTS.FIELDS.STOCK]: calculatedStock 
      }));
    }
  }, [calculatedStock, currentMedicine]);

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <Card
          className="mb-6 text-center"
          title={
            <div className="flex items-center justify-center gap-3">
              <Package className="w-10 h-10 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">
                {MEDICINE_CONSTANTS.UI.PAGE_TITLE}
              </h1>
              {showRestoredBadge && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full animate-pulse">
                  <History className="w-4 h-4" />
                  {MEDICINE_CONSTANTS.UI.AUTO_RESTORED}
                </span>
              )}
            </div>
          }
          subtitle={MEDICINE_CONSTANTS.UI.PAGE_SUBTITLE}
        />

        {error && <Alert variant="error" message={error} className="mb-5" />}
        {success && (
          <Alert 
            variant="success" 
            message={success} 
            icon={<CheckCircle className="w-5 h-5" />} 
            className="mb-5" 
          />
        )}
        {numberError && <Alert variant="error" message={numberError} className="mb-5" />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div ref={searchRef}>
              <Card
                className="p-5"
                title={MEDICINE_CONSTANTS.UI.SEARCH_TITLE}
                subtitle={MEDICINE_CONSTANTS.UI.SEARCH_SUBTITLE}
              >
                <div className="relative mb-4">
                  <InputText
                    label=""
                    name="search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder={MEDICINE_CONSTANTS.PLACEHOLDERS.SEARCH}
                    maxLength={MEDICINE_CONSTANTS.LIMITS.MAX_NAME_LENGTH}
                    prefix={<Search className="w-5 h-5 text-gray-500" />}
                    postfix={searchLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    ) : null}
                  />
                </div>

                {showResults && (
                  <div className="mt-3 border border-gray-200 rounded-lg shadow-lg bg-white max-h-64 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((med, i) => (
                        <div
                          key={i}
                          onClick={() => selectMedicine(med)}
                          className="px-5 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors"
                        >
                          <div className="font-medium text-gray-800">{med.name}</div>
                          <div className="text-xs text-gray-600">
                            {med.strength ? `${med.strength} • ` : ''}{med.manufacturer || ''}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-5 py-3 text-center text-gray-600">
                        {noResultsMessage || MEDICINE_CONSTANTS.MESSAGES.NO_MEDICINES_FOUND}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {currentMedicine && (
              <Card
                className="p-6 border-2 border-blue-300 shadow-lg"
                title={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-bold text-gray-800">
                        {currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.NAME] || 
                         MEDICINE_CONSTANTS.UI.NEW_MEDICINE_TITLE}
                      </h3>
                    </div>
                    <button
                      onClick={handleCloseForm}
                      className="p-1 hover:bg-gray-100 rounded-full transition"
                      aria-label="Close form"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                }
              >
                {formError && <Alert variant="error" message={formError} className="mb-5" />}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputText
                      label={MEDICINE_CONSTANTS.LABELS.MEDICINE_NAME}
                      name={MEDICINE_CONSTANTS.FIELDS.NAME}
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.NAME] || ''}
                      onChange={(e) => updateCurrent(MEDICINE_CONSTANTS.FIELDS.NAME, e.target.value)}
                      maxLength={MEDICINE_CONSTANTS.LIMITS.MAX_NAME_LENGTH}
                      placeholder={MEDICINE_CONSTANTS.PLACEHOLDERS.MEDICINE_NAME}
                      readOnly={!!currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.MEDICINE_ID]}
                      required
                    />

                    <InputSelect
                      label={MEDICINE_CONSTANTS.LABELS.FORM_TYPE}
                      name={MEDICINE_CONSTANTS.FIELDS.TYPE}
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.TYPE] || ''}
                      onChange={(e) => updateCurrent(MEDICINE_CONSTANTS.FIELDS.TYPE, e.target.value)}
                      required
                    >
                      {currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.TYPE_OPTIONS]?.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </InputSelect>

                    <InputSelect
                      label={MEDICINE_CONSTANTS.LABELS.UNIT_TYPE}
                      name={MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE}
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE] || ''}
                      onChange={(e) => updateCurrent(MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE, e.target.value)}
                      required
                    >
                      {Object.entries(MEDICINE_CONSTANTS.UNIT_TYPES).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </InputSelect>

                    <InputText
                      label={MEDICINE_CONSTANTS.LABELS.STRENGTH_SIZE}
                      name={MEDICINE_CONSTANTS.FIELDS.STRENGTH}
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.STRENGTH] || ''}
                      onChange={(e) => updateCurrent(MEDICINE_CONSTANTS.FIELDS.STRENGTH, e.target.value)}
                      maxLength={MEDICINE_CONSTANTS.LIMITS.MAX_STRENGTH_LENGTH}
                      placeholder={MEDICINE_CONSTANTS.PLACEHOLDERS.STRENGTH}
                    />

                    <InputText
                      label={MEDICINE_CONSTANTS.LABELS.MANUFACTURER}
                      name={MEDICINE_CONSTANTS.FIELDS.MANUFACTURER}
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.MANUFACTURER] || ''}
                      onChange={(e) => updateCurrent(MEDICINE_CONSTANTS.FIELDS.MANUFACTURER, e.target.value)}
                      maxLength={MEDICINE_CONSTANTS.LIMITS.MAX_NAME_LENGTH}
                      placeholder={MEDICINE_CONSTANTS.PLACEHOLDERS.MANUFACTURER}
                      required
                    />

                    <InputText
                      label={MEDICINE_CONSTANTS.LABELS.BATCH_CODE}
                      name={MEDICINE_CONSTANTS.FIELDS.BATCH_CODE}
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.BATCH_CODE] || ''}
                      onChange={(e) => updateCurrent(MEDICINE_CONSTANTS.FIELDS.BATCH_CODE, e.target.value)}
                      maxLength={MEDICINE_CONSTANTS.LIMITS.MAX_BATCH_CODE_LENGTH}
                      placeholder={MEDICINE_CONSTANTS.PLACEHOLDERS.BATCH_CODE}
                      required
                    />

                    <InputText
                      label={MEDICINE_CONSTANTS.LABELS.RETAIL_PRICE}
                      name={MEDICINE_CONSTANTS.FIELDS.RETAIL_PRICE}
                      type="number"
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.RETAIL_PRICE] || ''}
                      onChange={(e) => {
                        const newRetail = e.target.value;
                        updateCurrent(MEDICINE_CONSTANTS.FIELDS.RETAIL_PRICE, newRetail);
                        const sale = currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.SALE_PRICE] || '';
                        if (sale && newRetail) {
                          const saleNum = parseFloat(sale);
                          const retailNum = parseFloat(newRetail);
                          if (!isNaN(saleNum) && !isNaN(retailNum) && saleNum > retailNum && formError === MEDICINE_CONSTANTS.MESSAGES.SALE_PRICE_INVALID) {
                            setFormError('');
                          }
                        }
                      }}
                      placeholder={MEDICINE_CONSTANTS.PLACEHOLDERS.PRICE_RETAIL}
                      min="0"
                      step="0.01"
                      required
                    />

                    <InputText
                      label={MEDICINE_CONSTANTS.LABELS.SALE_PRICE}
                      name={MEDICINE_CONSTANTS.FIELDS.SALE_PRICE}
                      type="number"
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.SALE_PRICE] || ''}
                      onChange={(e) => {
                        const newSale = e.target.value;
                        updateCurrent(MEDICINE_CONSTANTS.FIELDS.SALE_PRICE, newSale);
                        const retail = currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.RETAIL_PRICE] || '';
                        if (retail && newSale) {
                          const retailNum = parseFloat(retail);
                          const saleNum = parseFloat(newSale);
                          if (!isNaN(retailNum) && !isNaN(saleNum) && saleNum <= retailNum) {
                            setFormError(MEDICINE_CONSTANTS.MESSAGES.SALE_PRICE_INVALID);
                          } else if (formError === MEDICINE_CONSTANTS.MESSAGES.SALE_PRICE_INVALID) {
                            setFormError('');
                          }
                        }
                      }}
                      placeholder={MEDICINE_CONSTANTS.PLACEHOLDERS.PRICE_SALE}
                      min="0"
                      step="0.01"
                      required
                    />

                    <InputText
                      label={MEDICINE_CONSTANTS.LABELS.LOCATION}
                      name={MEDICINE_CONSTANTS.FIELDS.LOCATION}
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.LOCATION] || ''}
                      onChange={(e) => updateCurrent(MEDICINE_CONSTANTS.FIELDS.LOCATION, e.target.value)}
                      maxLength={MEDICINE_CONSTANTS.LIMITS.MAX_NAME_LENGTH}
                      placeholder={MEDICINE_CONSTANTS.PLACEHOLDERS.LOCATION}
                    />

                    <DatePicker
                      label={MEDICINE_CONSTANTS.LABELS.EXPIRY_DATE}
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.EXPIRY_DATE] || ''}
                      onChange={(date) => updateCurrent(MEDICINE_CONSTANTS.FIELDS.EXPIRY_DATE, date)}
                      minDate={today}
                      placeholder="Select expiry date"
                      required
                    />

                    {currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE] && (() => {
                      const unitConfig = MEDICINE_CONSTANTS.UNIT_TYPES[
                        currentMedicine[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]
                      ];
                      return Object.entries(unitConfig.fields || {}).map(([fieldKey, fieldLabel]) => (
                        <InputText
                          key={fieldKey}
                          label={fieldLabel}
                          name={fieldKey}
                          type="number"
                          min="0"
                          max={MEDICINE_CONSTANTS.LIMITS.MAX_NUMBER_VALUE}
                          value={currentMedicine[fieldKey] || ''}
                          onChange={(e) => {
                            let val = e.target.value;
                            val = val.replace(/^0+/, '');
                            if (val === '') val = '0';
                            if (val.length > MEDICINE_CONSTANTS.LIMITS.MAX_NUMBER_DIGITS) {
                              val = val.slice(0, MEDICINE_CONSTANTS.LIMITS.MAX_NUMBER_DIGITS);
                            }
                            const numVal = parseInt(val, 10);
                            if (numVal > MEDICINE_CONSTANTS.LIMITS.MAX_NUMBER_VALUE) {
                              updateCurrent(fieldKey, MEDICINE_CONSTANTS.LIMITS.MAX_NUMBER_VALUE.toString());
                            } else {
                              updateCurrent(fieldKey, val);
                            }
                          }}
                          required
                          placeholder={MEDICINE_CONSTANTS.PLACEHOLDERS.NUMBER_INPUT}
                        />
                      ));
                    })()}

                    <InputText
                      label={MEDICINE_CONSTANTS.LABELS.STOCK}
                      name={MEDICINE_CONSTANTS.FIELDS.STOCK}
                      type="number"
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.STOCK] || ''}
                      readOnly
                      className="bg-gray-50"
                      placeholder="Auto-calculated"
                    />

                    <InputText
                      label={MEDICINE_CONSTANTS.LABELS.AGE_RESTRICTION}
                      name={MEDICINE_CONSTANTS.FIELDS.AGE_RESTRICTIONS}
                      type="number"
                      min="0"
                      max="99"
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.AGE_RESTRICTIONS] || ''}
                      onChange={(e) => {
                        const val = e.target.value.slice(0, MEDICINE_CONSTANTS.LIMITS.AGE_MAX_LENGTH);
                        updateCurrent(MEDICINE_CONSTANTS.FIELDS.AGE_RESTRICTIONS, val);
                      }}
                      placeholder={MEDICINE_CONSTANTS.PLACEHOLDERS.AGE_RESTRICTION}
                    />

                    <InputSelect
                      label={MEDICINE_CONSTANTS.LABELS.PRESCRIPTION_REQUIRED}
                      name={MEDICINE_CONSTANTS.FIELDS.PRESCRIPTIONS_REQUIRED}
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.PRESCRIPTIONS_REQUIRED] || 
                            MEDICINE_CONSTANTS.DEFAULTS.PRESCRIPTION_REQUIRED}
                      onChange={(e) => updateCurrent(
                        MEDICINE_CONSTANTS.FIELDS.PRESCRIPTIONS_REQUIRED, 
                        e.target.value
                      )}
                    >
                      {PRESCRIPTION_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </InputSelect>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <Button
                      onClick={handleCloseForm}
                      variant="secondary"
                      size="md"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveToCart}
                      variant="primary"
                      size="md"
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" /> {MEDICINE_CONSTANTS.UI.ADD_TO_CART_BUTTON}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card
              className="sticky top-4"
              title={
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">
                    {MEDICINE_CONSTANTS.UI.CART_TITLE} (
                      {cart.length}/{MEDICINE_CONSTANTS.LIMITS.MAX_CART_ITEMS}
                    )
                  </h3>
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              }
            >
              {cart.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p>{MEDICINE_CONSTANTS.UI.NO_ITEMS_MESSAGE}</p>
                  <p className="text-sm mt-2">{MEDICINE_CONSTANTS.UI.START_MESSAGE}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {cart.map(med => (
                      <div
                        key={med[MEDICINE_CONSTANTS.FIELDS.TEMP_ID]}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-all group"
                        onClick={() => editFromCart(med)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-blue-900">
                              {med[MEDICINE_CONSTANTS.FIELDS.NAME]}
                            </div>
                            <div className="text-xs text-blue-700 mt-1">
                              Batch: {med[MEDICINE_CONSTANTS.FIELDS.BATCH_CODE]} • Qty: {med[MEDICINE_CONSTANTS.FIELDS.STOCK]} {['pack', 'bottle', 'strip', 'loose'].includes(med[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]) ? 'tablets' : 'units'} • Rs{med[MEDICINE_CONSTANTS.FIELDS.SALE_PRICE]}
                            </div>
                            <div className="text-xs text-gray-600">
                              {med[MEDICINE_CONSTANTS.FIELDS.TYPE]} (
                                {MEDICINE_CONSTANTS.UNIT_TYPES[med[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]]?.label || 
                                 med[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]}
                              )
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            <Edit3 className="w-4 h-4 text-blue-600" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromCart(med[MEDICINE_CONSTANTS.FIELDS.TEMP_ID]);
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
                      loadingText={MEDICINE_CONSTANTS.UI.LOADING_TEXT}
                      variant="primary"
                      size="lg"
                      className="w-full flex items-center justify-center gap-3 py-4"
                    >
                      <Package className="w-6 h-6" />
                      {MEDICINE_CONSTANTS.UI.SUBMIT_BUTTON_TEXT.replace(
                        '{count}', 
                        cart.length
                      )}
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