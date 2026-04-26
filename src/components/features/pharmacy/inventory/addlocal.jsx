// AddMedicine.jsx — UPDATED FOR LOCAL MEDICINE ENTRY WITH FORM AUTO-OPENED
import React, { useState, useContext, useRef, useEffect, useMemo, useCallback } from 'react';
import { getToken } from '../../../../services/tokenUtils';
import { AuthContext } from '../../../auth/hooks/AuthContextDef';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/endpoint/inventory/inventoryEnd';
import { INVENTORY_MODULE_CONSTANTS } from './inventoryconstants/inventoryModuleConstants';
import { unitTypes } from '../../../constants/addmedicine';

// UI Components
import { 
  Package, Loader2, Plus, Edit3, CheckCircle, Trash2, X, History, FilePlus 
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
    GTIN: 'gtin',
    SERIAL_NUMBER: 'serial_number',
    MANUFACTURER_DATE: 'manufacturer_date',
  },
  
  // Unit Types from external config
  UNIT_TYPES: unitTypes,
  
  // Validation Messages
  MESSAGES: {
    FILL_ALL_FIELDS: 'Please fill all required fields!',
    STOCK_INVALID: 'Stock must be greater than 0!',
    CART_LIMIT: 'Cart limit reached (10 max)',
    ADD_SUCCESS: 'Local medicine added successfully!',
    ALREADY_IN_CART: 'Already added to cart!',
    SALE_PRICE_INVALID: 'Sale price (PKR) must be greater than Retail price (PKR)!',
  },
  
  // Placeholders
  PLACEHOLDERS: {
    MEDICINE_NAME: 'e.g. Paracetamol',
    FORM_TYPE: 'e.g. Tablet, Syrup, Capsule',
    STRENGTH: 'e.g. 500mg',
    MANUFACTURER: 'e.g. ABC Pharma',
    BATCH_CODE: 'e.g. BATCH2025A',
    LOCATION: 'e.g. Aisle 3, Shelf B',
    AGE_RESTRICTION: 'e.g. 18',
    NUMBER_INPUT: 'e.g. 10',
    PRICE_RETAIL: 'e.g. 1100.00',
    PRICE_SALE: 'e.g. 1250.00',
    GTIN: 'e.g. 1234567890123',
    SERIAL_NUMBER: 'e.g. SN123456',
    MANUFACTURER_DATE: 'Select manufacturer date',
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
    MANUFACTURER_DATE: 'Manufacturer Date',
    AGE_RESTRICTION: 'Age Restriction',
    PRESCRIPTION_REQUIRED: 'Prescription Required',
    STOCK: 'Stock',
    GTIN: 'GTIN (Barcode)',
    SERIAL_NUMBER: 'Serial Number',
  },
  
  // UI Texts
  UI: {
    PAGE_TITLE: 'Add Local Medicines to Stock',
    PAGE_SUBTITLE: 'Enter medicine details → Add to Cart → Submit All • Auto-save enabled',
    NEW_MEDICINE_TITLE: 'New Medicine Details',
    CART_TITLE: 'Ready to Add',
    NO_ITEMS_MESSAGE: 'No items in cart',
    START_MESSAGE: 'Click the button below to add local medicine',
    ADD_LOCAL_MEDICINE: 'Add Local Medicine',
    ADD_TO_CART_BUTTON: 'Add to Cart',
    SUBMIT_BUTTON_TEXT: 'Add {count} to Stock',
    AUTO_RESTORED: 'Auto-restored',
    LOADING_TEXT: 'Submitting...',
  },
  
  // Limits
  LIMITS: {
    MAX_CART_ITEMS: 10,
    MAX_NAME_LENGTH: 100,
    MAX_STRENGTH_LENGTH: 50,
    MAX_BATCH_CODE_LENGTH: 50,
    AGE_MAX_LENGTH: 3,
    GTIN_LENGTH: 13,
    SERIAL_NUMBER_LENGTH: 50,
  },
  
  // Default Values
  DEFAULTS: {
    PRESCRIPTION_REQUIRED: 'No',
    AGE_RESTRICTIONS: '',
    LOCATION: 'Not specified',
    UNIT_TYPE_SOLID: 'pack',
    UNIT_TYPE_LIQUID: 'liquid',
    GTIN: '',
    SERIAL_NUMBER: '',
    MANUFACTURER_DATE: '',
  },
  
  // API
  API: {
    STATUS_SUCCESS: 'success',
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
  [MEDICINE_CONSTANTS.FIELDS.MEDICINE_ID]: '',
  [MEDICINE_CONSTANTS.FIELDS.NAME]: '',
  [MEDICINE_CONSTANTS.FIELDS.TYPE]: '',
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
  [MEDICINE_CONSTANTS.FIELDS.GTIN]: '',
  [MEDICINE_CONSTANTS.FIELDS.SERIAL_NUMBER]: '',
  [MEDICINE_CONSTANTS.FIELDS.MANUFACTURER_DATE]: '',
};

// Helper Functions
const isSolidForm = (type) => {
  if (!type) return false;
  const lower = type.toLowerCase();
  const solidForms = ['tablet', 'caplet', 'capsule'];
  return solidForms.some(form => lower.includes(form));
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
export default function AddLocal() {
  const { user } = useContext(AuthContext);
  const controllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const saveTimerRef = useRef(null);
  
  // Initialize currentMedicine with an empty medicine object so form opens automatically
  const [currentMedicine, setCurrentMedicine] = useState(() => ({
    ...EMPTY_MEDICINE,
    [MEDICINE_CONSTANTS.FIELDS.TEMP_ID]: Date.now() + Math.random()
  }));
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [showRestoredBadge, setShowRestoredBadge] = useState(false);

  // USE CONSTANTS
  const { vendorId, branchId } = INVENTORY_MODULE_CONSTANTS.getUserInfo(user);
  const today = INVENTORY_MODULE_CONSTANTS.getTodayDate();
  
  // Auto-save instance
  const autoSave = useMemo(() => new INVENTORY_MODULE_CONSTANTS.IndexedDBAutoSave(), []);
  const autoSaveKey = useMemo(() => `local_medicine_${branchId}`, [branchId]);

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

  // Handle Add Local Medicine button click
  const handleAddLocalMedicine = () => {
    setCurrentMedicine({
      ...EMPTY_MEDICINE,
      [MEDICINE_CONSTANTS.FIELDS.TEMP_ID]: Date.now() + Math.random()
    });
  };

  // Auto-calculate stock
  useEffect(() => {
    if (!currentMedicine || !currentMedicine[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]) return;

    const unitConfig = MEDICINE_CONSTANTS.UNIT_TYPES[currentMedicine[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]];
    if (!unitConfig) return;

    let tp = Number(currentMedicine[MEDICINE_CONSTANTS.FIELDS.TOTAL_PACK]) || 0;
    let ps = Number(currentMedicine[MEDICINE_CONSTANTS.FIELDS.PACK_STRIP]) || 0;
    let st = Number(currentMedicine[MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET]) || 0;

    if (!unitConfig.fields[MEDICINE_CONSTANTS.FIELDS.PACK_STRIP]) ps = 1;
    if (!unitConfig.fields[MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET]) st = 1;

    const calculated_stock = tp * ps * st;

    if (calculated_stock > 0 && 
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

      const updated = { ...prev, [field]: value };

      if (field === MEDICINE_CONSTANTS.FIELDS.TYPE) {
        const solid = isSolidForm(value);
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
    MEDICINE_CONSTANTS.FIELDS.TYPE,
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

  if (Number(currentMedicine[MEDICINE_CONSTANTS.FIELDS.STOCK]) <= 0) {
    setFormError(MEDICINE_CONSTANTS.MESSAGES.STOCK_INVALID);
    return;
  }

  setCart(prev => {
    // Check if we're editing an existing item (has tempId that exists in cart)
    const existingItemIndex = prev.findIndex(
      item => item[MEDICINE_CONSTANTS.FIELDS.TEMP_ID] === currentMedicine[MEDICINE_CONSTANTS.FIELDS.TEMP_ID]
    );

    // If it's an edit (item exists in cart)
    if (existingItemIndex !== -1) {
      const newCart = [...prev];
      newCart[existingItemIndex] = { ...currentMedicine };
      return newCart;
    }

    // If it's a new item
    if (prev.length >= MEDICINE_CONSTANTS.LIMITS.MAX_CART_ITEMS) {
      setFormError(MEDICINE_CONSTANTS.MESSAGES.CART_LIMIT);
      return prev;
    }

    return [...prev, { ...currentMedicine }];
  });

  setCurrentMedicine({
    ...EMPTY_MEDICINE,
    [MEDICINE_CONSTANTS.FIELDS.TEMP_ID]: Date.now() + Math.random()
  });
  setFormError('');
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
        setError(`"${med[MEDICINE_CONSTANTS.FIELDS.NAME]}" - ${MEDICINE_CONSTANTS.MESSAGES.SALE_PRICE_INVALID}`);
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
          strength: med[MEDICINE_CONSTANTS.FIELDS.STRENGTH]?.trim() || '',
          age_restrictions: med[MEDICINE_CONSTANTS.FIELDS.AGE_RESTRICTIONS] 
            ? `${med[MEDICINE_CONSTANTS.FIELDS.AGE_RESTRICTIONS]}+` 
            : 'None',
          location: med[MEDICINE_CONSTANTS.FIELDS.LOCATION]?.trim() || MEDICINE_CONSTANTS.DEFAULTS.LOCATION,
          prescriptions_required: med[MEDICINE_CONSTANTS.FIELDS.PRESCRIPTIONS_REQUIRED] === 'Yes',
          stock: parseInt(med[MEDICINE_CONSTANTS.FIELDS.STOCK]),
          manufacturer: med[MEDICINE_CONSTANTS.FIELDS.MANUFACTURER].trim(),
          expiry_date: med[MEDICINE_CONSTANTS.FIELDS.EXPIRY_DATE],
          type: med[MEDICINE_CONSTANTS.FIELDS.TYPE].trim(),
         unit_type: MEDICINE_CONSTANTS.UNIT_TYPES[med[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]]?.label || med[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE],
          gtin: med[MEDICINE_CONSTANTS.FIELDS.GTIN]?.trim() || '',
          serial_number: med[MEDICINE_CONSTANTS.FIELDS.SERIAL_NUMBER]?.trim() || '',
          manufacturer_date: med[MEDICINE_CONSTANTS.FIELDS.MANUFACTURER_DATE] || '',
        };

        // Send packing object when unitType has packing fields
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
          } else if (med[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE] === 'strip') {
            base.packing.total_strip = tp;
            base.packing.strip_tablet = st;
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

      const response = await apiService.post(
        apiEndpoints.addStockLocalMedicine(), 
        payload, 
        {
          headers: INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, vendorId),
          signal: controllerRef.current.signal,
        }
      );

      if (!isMountedRef.current) return;
      
    // Around line 364-365
if (response.data.status === MEDICINE_CONSTANTS.API.STATUS_SUCCESS) {
  INVENTORY_MODULE_CONSTANTS.showSuccess(
    setSuccess, 
    MEDICINE_CONSTANTS.MESSAGES.ADD_SUCCESS, 
    5000 // Changed from 20000 to 5000 (5 seconds)
  );
  setCart([]);
  setCurrentMedicine({
    ...EMPTY_MEDICINE,
    [MEDICINE_CONSTANTS.FIELDS.TEMP_ID]: Date.now() + Math.random()
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

  const handleCloseForm = () => {
    setCurrentMedicine(null);
  };

  // Calculate stock for display
  const calculatedStock = useMemo(() => {
    if (!currentMedicine || !currentMedicine[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]) return '';
    
    const unitConfig = MEDICINE_CONSTANTS.UNIT_TYPES[currentMedicine[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]];
    if (!unitConfig) return '';
    
    let tp = Number(currentMedicine[MEDICINE_CONSTANTS.FIELDS.TOTAL_PACK]) || 0;
    let ps = Number(currentMedicine[MEDICINE_CONSTANTS.FIELDS.PACK_STRIP]) || 0;
    let st = Number(currentMedicine[MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET]) || 0;
    
    if (!unitConfig.fields[MEDICINE_CONSTANTS.FIELDS.PACK_STRIP]) ps = 1;
    if (!unitConfig.fields[MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET]) st = 1;
    
    return (tp * ps * st).toString();
  }, [
    currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.TOTAL_PACK], 
    currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.PACK_STRIP], 
    currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.STRIP_TABLET], 
    currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.UNIT_TYPE]
  ]);

  // Update stock when calculation changes
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
        {/* Header Card */}
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

        {/* Alerts */}
        {error && <Alert variant="error" message={error} className="mb-5" />}
        {success && (
          <Alert 
            variant="success" 
            message={success} 
            icon={<CheckCircle className="w-5 h-5" />} 
            className="mb-5" 
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Medicine Form */}
            {currentMedicine && (
              <Card
                className="p-6 border-2 border-blue-300 shadow-lg"
                title={
                 <div className="flex items-center">
  <div className="flex items-center gap-2">
    <Edit3 className="w-5 h-5 text-blue-600" />
    <h3 className="text-lg font-bold text-gray-800">
      {currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.NAME] || 
       MEDICINE_CONSTANTS.UI.NEW_MEDICINE_TITLE}
    </h3>
  </div>
</div>
                }
              >
                {formError && <Alert variant="error" message={formError} className="mb-5" />}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Basic Information */}
                    <InputText
                      label={MEDICINE_CONSTANTS.LABELS.MEDICINE_NAME}
                      name={MEDICINE_CONSTANTS.FIELDS.NAME}
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.NAME] || ''}
                      onChange={(e) => updateCurrent(MEDICINE_CONSTANTS.FIELDS.NAME, e.target.value)}
                      maxLength={MEDICINE_CONSTANTS.LIMITS.MAX_NAME_LENGTH}
                      placeholder={MEDICINE_CONSTANTS.PLACEHOLDERS.MEDICINE_NAME}
                      required
                    />

                    <InputText
                      label={MEDICINE_CONSTANTS.LABELS.FORM_TYPE}
                      name={MEDICINE_CONSTANTS.FIELDS.TYPE}
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.TYPE] || ''}
                      onChange={(e) => updateCurrent(MEDICINE_CONSTANTS.FIELDS.TYPE, e.target.value)}
                      placeholder={MEDICINE_CONSTANTS.PLACEHOLDERS.FORM_TYPE}
                      required
                    />

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

                    {/* Pricing */}
                    <InputText
                      label={MEDICINE_CONSTANTS.LABELS.RETAIL_PRICE}
                      name={MEDICINE_CONSTANTS.FIELDS.RETAIL_PRICE}
                      type="number"
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.RETAIL_PRICE] || ''}
                      onChange={(e) => {
                        const newRetail = e.target.value;
                        updateCurrent(MEDICINE_CONSTANTS.FIELDS.RETAIL_PRICE, newRetail);
                        // Clear price error if it becomes valid
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
                        // Real-time validation - show error immediately if sale <= retail
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

                    {/* Location */}
                    <InputText
                      label={MEDICINE_CONSTANTS.LABELS.LOCATION}
                      name={MEDICINE_CONSTANTS.FIELDS.LOCATION}
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.LOCATION] || ''}
                      onChange={(e) => updateCurrent(MEDICINE_CONSTANTS.FIELDS.LOCATION, e.target.value)}
                      maxLength={MEDICINE_CONSTANTS.LIMITS.MAX_NAME_LENGTH}
                      placeholder={MEDICINE_CONSTANTS.PLACEHOLDERS.LOCATION}
                    />

                    {/* Dates */}
                    <DatePicker
                      label={MEDICINE_CONSTANTS.LABELS.MANUFACTURER_DATE}
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.MANUFACTURER_DATE] || ''}
                      onChange={(date) => updateCurrent(MEDICINE_CONSTANTS.FIELDS.MANUFACTURER_DATE, date)}
                      maxDate={today}
                      placeholder={MEDICINE_CONSTANTS.PLACEHOLDERS.MANUFACTURER_DATE}
                    />

                    <DatePicker
                      label={MEDICINE_CONSTANTS.LABELS.EXPIRY_DATE}
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.EXPIRY_DATE] || ''}
                      onChange={(date) => updateCurrent(MEDICINE_CONSTANTS.FIELDS.EXPIRY_DATE, date)}
                      minDate={today}
                      placeholder="Select expiry date"
                      required
                    />

                    {/* Identifiers */}
                    <InputText
                      label={MEDICINE_CONSTANTS.LABELS.GTIN}
                      name={MEDICINE_CONSTANTS.FIELDS.GTIN}
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.GTIN] || ''}
                      onChange={(e) => {
                        const val = e.target.value.slice(0, MEDICINE_CONSTANTS.LIMITS.GTIN_LENGTH);
                        updateCurrent(MEDICINE_CONSTANTS.FIELDS.GTIN, val);
                      }}
                      maxLength={MEDICINE_CONSTANTS.LIMITS.GTIN_LENGTH}
                      placeholder={MEDICINE_CONSTANTS.PLACEHOLDERS.GTIN}
                    />

                    <InputText
                      label={MEDICINE_CONSTANTS.LABELS.SERIAL_NUMBER}
                      name={MEDICINE_CONSTANTS.FIELDS.SERIAL_NUMBER}
                      value={currentMedicine?.[MEDICINE_CONSTANTS.FIELDS.SERIAL_NUMBER] || ''}
                      onChange={(e) => {
                        const val = e.target.value.slice(0, MEDICINE_CONSTANTS.LIMITS.SERIAL_NUMBER_LENGTH);
                        updateCurrent(MEDICINE_CONSTANTS.FIELDS.SERIAL_NUMBER, val);
                      }}
                      maxLength={MEDICINE_CONSTANTS.LIMITS.SERIAL_NUMBER_LENGTH}
                      placeholder={MEDICINE_CONSTANTS.PLACEHOLDERS.SERIAL_NUMBER}
                    />

                    {/* Dynamic packing fields */}
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
                          min="1"
                          value={currentMedicine[fieldKey] || ''}
                          onChange={(e) => updateCurrent(fieldKey, e.target.value)}
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

                    {/* Restrictions */}
                    <InputText
                      label={MEDICINE_CONSTANTS.LABELS.AGE_RESTRICTION}
                      name={MEDICINE_CONSTANTS.FIELDS.AGE_RESTRICTIONS}
                      type="number"
                      min="0"
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

          {/* Right Column (1/3) - Cart */}
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
                              Batch: {med[MEDICINE_CONSTANTS.FIELDS.BATCH_CODE]} • 
                              Qty: {med[MEDICINE_CONSTANTS.FIELDS.STOCK]} • 
                              Rs{med[MEDICINE_CONSTANTS.FIELDS.SALE_PRICE]}
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
                      disabled={cart.length === 0 || loading}
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