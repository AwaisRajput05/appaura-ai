// SellMedicine.jsx - REFACTORED WITH CONSTANTS (Complete) - FULLY RESPONSIVE
// FIXED: Credit field added separately, all three blocks horizontally aligned
// FIXED: Double API hit on phone search + existing customer highlight
// ADDED: Home Delivery feature – dropdown, popup, badge, pencil edit, amount_paid excludes delivery charges
// FIXED: Payment method options filtered by transaction type

import React, { useState, useContext, useCallback, useEffect, useRef, useMemo } from "react";

// Context & Hooks
import { AuthContext } from "../../../auth/hooks/AuthContextDef";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/salespoint/salespointend";
import { printReceipt } from "../../../../services/receiptPrinter";

// Components
import HomeTable from "../../../common/table/postable";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import Button from "../../../../components/ui/forms/Button";
import Alert from "../../../../components/ui/feedback/Alert";
import Modal from "../../../../components/ui/Modal";
import Card from "../../../../components/ui/Card";
import InputText from "../../../../components/ui/forms/InputText";
import InputSelect from "../../../../components/ui/forms/InputSelect";

// Packing Utilities
import {
  PackingDisplay,
  formatPacking,
  formatGeneralPacking,
  isGeneralPacking
} from "../../../../components/ui/packingui";

// Constants
import { 
  SALES_POINT_CONSTANTS,
  SearchType,
  TransactionType,
  PaymentMethod,
  CustomerType,
  AvailabilityStatus
} from '././salescosntant/salesPointConstants';

// ==================== SELL MEDICINE CONSTANTS ====================
const SELL_MEDICINE_CONSTANTS = {

  PAYMENT_METHODS: {
  CASH: "Cash",
  BANK_CARD: "Bank Card",
  BANK_TRANSFER: "Bank Transfer",
  ADVANCE: "Advance Payment",
  MOBILE_WALLET: "Mobile Wallet",
  CREDIT: "Credit",
},
  // Error Messages (reused)
  ERRORS: {
    CUSTOMER_NAME_LENGTH: "Customer name must be 20 characters or less",
    PHONE_INVALID: "Must be a valid 11-digit Pakistani mobile number starting with 03",
    EMAIL_LENGTH: "Email must be 100 characters or less",
    EMAIL_INVALID: "Invalid email format",
    DISCOUNT_RANGE: "Discount must be between 0 and 100",
    CREDIT_NEGATIVE: "Credit cannot be negative",
    TAX_RANGE: "Tax must be between 0 and 100",
    CUSTOMER_TYPE_LENGTH: "Customer type must be 50 characters or less",
    ADVANCE_PAYMENT_NEGATIVE: "Advance payment cannot be negative",
    AMOUNT_PAID_NEGATIVE: "Amount paid cannot be negative",
    PARTIAL_PAYMENT_REQUIRED: "Amount paid must be greater than 0 for partial payment",
    NO_PRODUCT_SELECTED: "No product selected",
    CREDIT_REQUIREMENT: "For {type}, customer name and phone number are required to track credit.",
    CREDIT_PHONE_INVALID: "Please enter a valid 11-digit Pakistani mobile number (starting with 03) for credit transactions.",
    OUT_OF_STOCK: "Out of stock",
  },

  // Success Messages (reused)
  SUCCESS: {
    SALE_COMPLETED: "Sale completed! Invoice: {invoice} — {details}",
    ITEMS_SOLD: "{count} items sold. Hover to view details.",
  },

  // UI Labels (reused)
  LABELS: {
    PAGE_TITLE: "Point of Sale",
    REFRESH: "Refresh",
    REFRESHING: "Refreshing",
    LOCK: "Lock",
    REMOVE: "Remove",
    PRINT_RECEIPT: "Print Receipt",
    CLOSE: "Close",
    PROCESSING: "Processing...",
    SEARCH_ADDITIONAL: "Search for Additional Medicines",
    ADD: "Add",
    ADD_QTY: "Add {qty}",
    CASHIER_NAME: "Cashier Name",
    CUSTOMER_NAME: "Customer Name",
    PHONE: "Phone",
    EMAIL: "Email",
    CUSTOMER_TYPE: "Customer Type",
    ADVANCE_PAYMENT: "Advance Payment",
    USE_ADVANCE: "Use",
    TAX_PERCENT: "Tax %",
    CREDIT_BALANCE: "Credit Balance",
    AVAILABLE_ADVANCE: "Available: Rs {amount}",
    ADVANCE_NOT_USED: "(Not being used)",
    TAX_CALCULATION: "Tax: {percent}% = Rs {amount}",
    CART_TITLE: "Cart ({count} items)",
    CART_EMPTY: "Cart is empty",
    CUSTOMER_DETAILS: "Customer Details",
    SUMMARY_PAYMENT: "Summary & Payment",
    SOLD_ITEMS: "Sold Items ({count})",
    INVOICE: "Invoice: {invoice}",
    PRODUCT_DETAILS: "Product Details",
    VIEW_ALL: "→ View all {count} items in detail",
    ACTIONS: "Actions",
    ACTION: "Action",
    REMOVE_ITEM: "Remove",
    IN_STOCK: "In Stock",
    NOT_IN_STOCK: "Not in stock",
    NOT_IN_YOUR_STOCK: "Not in your stock",
    EXISTING_CUSTOMER: "Existing Customer",
    HOME_DELIVERY: "Home Delivery",
    DELIVERY_ADDRESS: "Delivery Address",
    DELIVERY_CHARGES: "Delivery Charges (Rs)",
    CUSTOMER_NOTES: "Customer Notes",
    SAVE_DELIVERY: "Save Delivery Info",
    EDIT_DELIVERY: "Edit Delivery Info",
    DELIVERY_BADGE: "🚚 Home Delivery",
  },

  // Table Headers (reused)
  TABLE_HEADERS: {
    PRODUCT_NAME: "Product Name",
    MEDICINE_NAME: "Medicine Name",
    BATCH: "Batch",
    EXPIRY: "Expiry",
    PRICE: "Price (₨)",
    STRENGTH: "Strength",
    CATEGORY: "Category",
    PACKING: "Packing",
    STOCK: "Stock",
    LOCATION: "Location",
    DISCOUNT: "Discount",
    DETAILS: "Details",
    QTY: "Qty",
    TOTAL: "Total",
    ITEM: "Item",
  },

  // Search Placeholders (reused)
  SEARCH_PLACEHOLDERS: {
    [SearchType.MEDICINE]: "Search medicine by name",
    [SearchType.PHONE]: "Search by phone number",
    [SearchType.GENERAL]: "Search general item by name",
    [SearchType.LOCAL_MEDICINE]: "Search local medicine by name",
    default: "Search",
  },

  // Search Type Display Names (reused in dropdown)
  SEARCH_TYPE_NAMES: {
    [SearchType.MEDICINE]: "Medicine",
    [SearchType.LOCAL_MEDICINE]: "Local Medicine",
    [SearchType.GENERAL]: "General Items",
    [SearchType.PHONE]: "Phone Number",
  },

  // Item Types (reused)
  ITEM_TYPES: {
    MEDICINE: 'medicine',
    LOCAL: 'local',
    GENERAL: 'general',
  },

  // Category Values for API (reused)
  CATEGORY_VALUES: {
    MEDICINE: "medicine",
    LOCAL: "local",
    GENERAL: "general",
  },

  // Validation Constants (reused)
  VALIDATION: {
    PHONE_LENGTH: 11,
    CUSTOMER_NAME_MAX: 20,
    EMAIL_MAX: 100,
    SEARCH_TERM_MAX: 30,
    CUSTOMER_TYPE_MAX: 50,
    MIN_CHARS_MEDICINE: 3,
    MIN_CHARS_PHONE: 11,
    DISCOUNT_MIN: 0,
    DISCOUNT_MAX: 100,
    TAX_MIN: 0,
    TAX_MAX: 100,
    TAX_STEP: 0.5,
    QTY_MIN: 1,
    
  },

  // Payment Related (reused)
  PAYMENT: {
    AMOUNT_PAID_LABEL: "Amount Paid (Required)",
    AMOUNT_PAID_PLACEHOLDER: "Enter amount paid",
    REMAINING_CREDIT: "Remaining amount will be added to customer credit",
    FULLY_PAID: "Fully Paid",
    PARTIAL_PAID: "Partial Paid",
    CREDIT: "Credit",
    HOME_DELIVERY: "Home Delivery",
    COMPLETE_SALE_FULLY_PAID: "Complete Sale - Fully Paid",
    COMPLETE_SALE_PARTIAL_PAID: "Complete Sale - Partial Paid",
    COMPLETE_SALE_CREDIT: "Complete Sale - Credit",
    PARTIAL_PAYMENT_REQ: "Partial Payment Requirement:",
    CREDIT_SALE_REQ: "Credit Sale Requirement:",
    CUSTOMER_REQUIRED_CREDIT: "• Customer name and phone are required to track credit balance",
    PHONE_REQUIRED_FORMAT: "• Phone must be a valid 11-digit Pakistani number (03XXXXXXXXX)",
    PARTIAL_CREDIT_NOTE: "• Remaining amount will be added to customer's credit account",
    FULL_CREDIT_NOTE: "• Full amount will be added to customer's credit account",
    TRANSACTION_TYPE: "Transaction Type",
    PAYMENT_METHOD: "Payment Method",
  },

  // Totals Display Labels (reused)
  TOTALS_LABELS: {
    MEDICINE_SUBTOTAL: "Medicine Subtotal:",
    LOCAL_SUBTOTAL: "Local Items Subtotal:",
    GENERAL_SUBTOTAL: "General Items Subtotal:",
    TOTAL_SUBTOTAL: "Total Subtotal:",
    DISCOUNT: "Discount ({percent}% on medicines only):",
    NET_TOTAL: "Net Total:",
    TAX: "Tax ({percent}% on net total):",
    TOTAL_WITH_TAX: "Total with Tax:",
    ADVANCE_USED: "Advance Payment Used:",
    AMOUNT_AFTER_ADVANCE: "Amount After Advance:",
    AMOUNT_DUE: "Amount Due:",
    CREDIT_APPLIED: "Credit Applied:",
    FINAL_AMOUNT_DUE: "Final Amount Due:",
    DELIVERY_CHARGES: "Delivery Charges:",
    GRAND_TOTAL: "Grand Total:",
  },

  // Credit/Warning Messages (reused)
  CREDIT_MESSAGES: {
    CUSTOMER_REQUIRED_TRACKING: "Customer details required for credit tracking",
    CUSTOMER_REQUIRED_SALE: "Customer details required for credit sale",
  },

  // Default Values (reused)
  DEFAULTS: {
    NOT_AVAILABLE: "N/A",
    DASH: "—",
    ZERO: 0,
    ONE: 1,
    CHECK_MARK: "✓",
    CURRENCY_SYMBOL: "₨",
    UNKNOWN_ITEM: "Unknown Item",
  },

  // UI Configuration (reused)
  UI_CONFIG: {
    TOOLTIP_OFFSET: 10,
    SUCCESS_MESSAGE_TIMEOUT: 60000,
    REFRESH_TIMEOUT: 600,
    SEARCH_DEBOUNCE: 500,
    CUSTOMER_FETCH_DEBOUNCE: 500,
    POPUP_ITEMS_THRESHOLD: 3,
    POPUP_ITEMS_VIEW_THRESHOLD: 5,
  },

  // CSS Classes (reused)
  CSS_CLASSES: {
    CASHIER_LOCKED: 'bg-gray-100',
    NOT_IN_STOCK_TAG: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-600 text-white shadow-sm',
    IN_CART_ICON: 'text-green-600 font-bold text-xl',
    CREDIT_WARNING_BG: 'bg-yellow-50 border border-yellow-200',
    CREDIT_APPLIED_BG: 'bg-red-50',
    ADVANCE_USED_BG: 'bg-blue-50',
    TAX_BG: 'bg-yellow-50',
    CREDIT_BG: 'bg-purple-50',
    SEARCH_SECTION_BG: 'bg-[#F4F7FF]',
    BUTTON_PRIMARY_BG: 'bg-[#3C5690]',
    BUTTON_PRIMARY_HOVER: 'hover:bg-[#5A75C7]',
    DELIVERY_BADGE: 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300',
  },

  // Currency Format
  CURRENCY: {
    SYMBOL: "₨",
    FORMAT: (amount) => `₨ ${amount.toFixed(2)}`,
  },
};

// ==================== CUSTOMER DEFAULTS ====================
const CUSTOMER_DEFAULTS = {
  customer_name: "",
  phone: "",
  email: "",
  discount: SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO,
  credit: SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO,
  tax: SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO,
  customer_type: CustomerType.WALK_IN,
  advance_payment: SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO
};

// ==================== PAYMENT DEFAULTS ====================
const PAYMENT_DEFAULTS = {
  transaction_type: TransactionType.FULLY_PAID,
  payment_type: PaymentMethod.CASH,
  amount_paid: SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO
};

// ==================== DELIVERY DEFAULTS ====================
const DELIVERY_DEFAULTS = {
  address: "",
  charges: 0,
  notes: ""
};

// ==================== PAYMENT METHOD OPTIONS PER TRANSACTION TYPE ====================
// Returns the allowed payment method <option> elements based on transaction type.
// - FULLY_PAID / PARTIAL_PAID → all methods EXCEPT Credit
// - CREDIT                    → only Credit
const getPaymentMethodOptions = (transactionType, constants) => {
  const { PAYMENT_METHODS } = constants;
  const { CASH, BANK_CARD, BANK_TRANSFER, ADVANCE, MOBILE_WALLET, CREDIT } = PAYMENT_METHODS;

  if (transactionType === TransactionType.CREDIT) {
    return (
      <option value={PaymentMethod.CREDIT}>{CREDIT}</option>
    );
  }

  // FULLY_PAID and PARTIAL_PAID: all methods except Credit
  return (
    <>
      <option value={PaymentMethod.CASH}>{CASH}</option>
      <option value={PaymentMethod.BANK_CARD}>{BANK_CARD}</option>
      <option value={PaymentMethod.BANK_TRANSFER}>{BANK_TRANSFER}</option>
      <option value={PaymentMethod.ADVANCE}>{ADVANCE}</option>
      <option value={PaymentMethod.MOBILE_WALLET}>{MOBILE_WALLET}</option>
    </>
  );
};

// Main Component
export default function SellMedicine() {
  // Context
  const { user } = useContext(AuthContext);
  
  // Refs
  const abortControllerRef = useRef(null);
  const searchInputRef = useRef(null);
  const amountFieldIdRef = useRef(`amount_field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const successMessageRef = useRef(null);

  // ── FIX 1: Flag to skip the customer-fetch watcher when phone is set
  //           programmatically (e.g. auto-filled from dropdown search results).
  const skipNextCustomerFetchRef = useRef(false);

  // Search State
  const [searchType, setSearchType] = useState(SearchType.MEDICINE);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [results, setResults] = useState([]);
  
  // Cart State
  const [cart, setCart] = useState([]);
  
  // Customer State
  const [customer, setCustomer] = useState({ ...CUSTOMER_DEFAULTS });

  // ── FIX 2: Track whether the current phone belongs to an existing customer
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  
  // Payment State
  const [paymentDetails, setPaymentDetails] = useState({ ...PAYMENT_DEFAULTS });
  const [useAdvancePayment, setUseAdvancePayment] = useState(true);
  
  // Delivery State
  const [deliveryInfo, setDeliveryInfo] = useState({ ...DELIVERY_DEFAULTS });
  const [showDeliveryPopup, setShowDeliveryPopup] = useState(false);
  // Flag to know if we are in "delivery mode" (i.e., delivery address exists)
  const [isDeliveryMode, setIsDeliveryMode] = useState(false);
  
  // UI State
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [warning, setWarning] = useState(null);
  const [creditTransactionError, setCreditTransactionError] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [showItemsPopup, setShowItemsPopup] = useState(false);
  const [popupItems, setPopupItems] = useState([]);
  const [cashierName, setCashierName] = useState("");
  const [cashierLocked, setCashierLocked] = useState(false);
  const [showSuccessTooltip, setShowSuccessTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: SELL_MEDICINE_CONSTANTS.DEFAULTS.ONE,
    page_size: 10,
    total: SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO,
  });

  // Constants from User
  const vendorId = user?.currentBranch?.vendorId || user?.vendorId || user?.userId || '';
  const branchId = user?.currentBranch?.id || user?.branchId || localStorage.getItem('branchId') || '';
  const defaultCashier = user?.name || SELL_MEDICINE_CONSTANTS.LABELS.CASHIER_NAME;

  // Minimum characters for search
  const minChars = useMemo(() => 
    searchType === SearchType.PHONE 
      ? SELL_MEDICINE_CONSTANTS.VALIDATION.MIN_CHARS_PHONE 
      : SELL_MEDICINE_CONSTANTS.VALIDATION.MIN_CHARS_MEDICINE,
    [searchType]
  );

  // Calculate Totals (including delivery charges for display)
  const calculateTotals = useCallback(() => {
    let medicineSubtotal = 0;
    let generalSubtotal = 0;
    let localSubtotal = 0;
    
    cart.forEach(item => {
      const itemSubtotal = item.price * item.qty;
      if (item.itemType === SELL_MEDICINE_CONSTANTS.ITEM_TYPES.LOCAL) {
        localSubtotal += itemSubtotal;
      } else if (item.itemType === SELL_MEDICINE_CONSTANTS.ITEM_TYPES.GENERAL) {
        generalSubtotal += itemSubtotal;
      } else {
        medicineSubtotal += itemSubtotal;
      }
    });
    
    const totalSubtotal = medicineSubtotal + generalSubtotal + localSubtotal;
    const discountAmount = medicineSubtotal * (customer.discount / 100);
    const netTotal = totalSubtotal - discountAmount;
    const taxAmount = netTotal * (customer.tax / 100);
    const totalWithTax = netTotal + taxAmount;
    
    // Add delivery charges (if any) for display only
    const deliveryCharges = isDeliveryMode ? (deliveryInfo.charges || 0) : 0;
    const grandTotal = totalWithTax + deliveryCharges;
    
    let advanceUsed = 0;
    let amountDue = grandTotal;
    let creditApplied = 0;
    
    if (useAdvancePayment) {
      if (paymentDetails.transaction_type === TransactionType.FULLY_PAID) {
        advanceUsed = Math.min(customer.advance_payment, grandTotal);
        amountDue = grandTotal - advanceUsed;
      } else if (paymentDetails.transaction_type === TransactionType.PARTIAL_PAID) {
        advanceUsed = Math.min(customer.advance_payment, grandTotal);
        const remainingAfterAdvance = grandTotal - advanceUsed;
        const partialPaid = Math.min(paymentDetails.amount_paid, remainingAfterAdvance);
        creditApplied = remainingAfterAdvance - partialPaid;
        amountDue = 0;
      } else if (paymentDetails.transaction_type === TransactionType.CREDIT) {
        advanceUsed = Math.min(customer.advance_payment, grandTotal);
        creditApplied = grandTotal - advanceUsed;
        amountDue = 0;
      }
    } else {
      if (paymentDetails.transaction_type === TransactionType.FULLY_PAID) {
        amountDue = grandTotal;
      } else if (paymentDetails.transaction_type === TransactionType.PARTIAL_PAID) {
        const partialPaid = Math.min(paymentDetails.amount_paid, grandTotal);
        creditApplied = grandTotal - partialPaid;
        amountDue = 0;
      } else if (paymentDetails.transaction_type === TransactionType.CREDIT) {
        creditApplied = grandTotal;
        amountDue = 0;
      }
    }
    
    return {
      medicineSubtotal,
      generalSubtotal,
      localSubtotal,
      totalSubtotal,
      discountAmount,
      netTotal,
      taxAmount,
      totalWithTax,
      deliveryCharges,
      grandTotal,
      advanceUsed,
      creditApplied,
      amountDue
    };
  }, [cart, customer.discount, customer.tax, customer.advance_payment, paymentDetails, useAdvancePayment, isDeliveryMode, deliveryInfo.charges]);

  const totals = calculateTotals();

  // Update amount paid when transaction type changes (excludes delivery charges)
  useEffect(() => {
    if (paymentDetails.transaction_type === TransactionType.FULLY_PAID) {
      // Use totalWithTax (excludes delivery) for amount_paid
      const totalAfterAdvance = useAdvancePayment ? Math.max(0, totals.totalWithTax - customer.advance_payment) : totals.totalWithTax;
      setPaymentDetails(prev => ({
        ...prev,
        amount_paid: totalAfterAdvance
      }));
    } else if (paymentDetails.transaction_type === TransactionType.CREDIT) {
      setPaymentDetails(prev => ({
        ...prev,
        amount_paid: SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO
      }));
    }
  }, [paymentDetails.transaction_type, totals.totalWithTax, customer.advance_payment, useAdvancePayment]);

useEffect(() => {
  const isEmployee = !!localStorage.getItem("employeeId") || !!localStorage.getItem("firstName");
  const employeeName = localStorage.getItem("employeeName");
  const firstName = localStorage.getItem("firstName");
  
  const cashierToUse = employeeName || firstName;
  
  if (isEmployee && cashierToUse && !cashierName) {
    setCashierName(cashierToUse);
    setCashierLocked(true);
  }
}, []);
  // Clear receipt when user starts typing again
  useEffect(() => {
    if (searchTerm.trim() !== "" && receiptData) {
      setReceiptData(null);
    }
  }, [searchTerm, receiptData]);

  // Reset when search type changes
  useEffect(() => {
    setSearchTerm("");
    setResults([]);
    setPagination({ page: SELL_MEDICINE_CONSTANTS.DEFAULTS.ONE, page_size: 10, total: SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO });
    setSearchMessage("");
    setWarning(null);
  }, [searchType]);

  // Validate customer details
  useEffect(() => {
    const newErrors = {};

    if (customer.customer_name.trim() && customer.customer_name.length > SELL_MEDICINE_CONSTANTS.VALIDATION.CUSTOMER_NAME_MAX) {
      newErrors.customer_name = SELL_MEDICINE_CONSTANTS.ERRORS.CUSTOMER_NAME_LENGTH;
    }

    if (customer.phone.trim()) {
      if (!SALES_POINT_CONSTANTS.validatePhoneNumber(customer.phone)) {
        newErrors.phone = SELL_MEDICINE_CONSTANTS.ERRORS.PHONE_INVALID;
      }
    }

    if (customer.email.trim()) {
      if (customer.email.length > SELL_MEDICINE_CONSTANTS.VALIDATION.EMAIL_MAX) {
        newErrors.email = SELL_MEDICINE_CONSTANTS.ERRORS.EMAIL_LENGTH;
      } else if (!/^\S+@\S+\.\S+$/.test(customer.email)) {
        newErrors.email = SELL_MEDICINE_CONSTANTS.ERRORS.EMAIL_INVALID;
      }
    }

    if (customer.discount < SELL_MEDICINE_CONSTANTS.VALIDATION.DISCOUNT_MIN || 
        customer.discount > SELL_MEDICINE_CONSTANTS.VALIDATION.DISCOUNT_MAX) {
      newErrors.discount = SELL_MEDICINE_CONSTANTS.ERRORS.DISCOUNT_RANGE;
    }

    if (customer.credit < SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO) {
      newErrors.credit = SELL_MEDICINE_CONSTANTS.ERRORS.CREDIT_NEGATIVE;
    }

    if (customer.tax < SELL_MEDICINE_CONSTANTS.VALIDATION.TAX_MIN || 
        customer.tax > SELL_MEDICINE_CONSTANTS.VALIDATION.TAX_MAX) {
      newErrors.tax = SELL_MEDICINE_CONSTANTS.ERRORS.TAX_RANGE;
    }

    if (customer.customer_type.trim().length > SELL_MEDICINE_CONSTANTS.VALIDATION.CUSTOMER_TYPE_MAX) {
      newErrors.customer_type = SELL_MEDICINE_CONSTANTS.ERRORS.CUSTOMER_TYPE_LENGTH;
    }

    if (customer.advance_payment < SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO) {
      newErrors.advance_payment = SELL_MEDICINE_CONSTANTS.ERRORS.ADVANCE_PAYMENT_NEGATIVE;
    }

    if (paymentDetails.amount_paid < SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO) {
      newErrors.amount_paid = SELL_MEDICINE_CONSTANTS.ERRORS.AMOUNT_PAID_NEGATIVE;
    }

    if (paymentDetails.transaction_type === TransactionType.PARTIAL_PAID && 
        paymentDetails.amount_paid <= SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO) {
      newErrors.amount_paid = SELL_MEDICINE_CONSTANTS.ERRORS.PARTIAL_PAYMENT_REQUIRED;
    }

    setErrors(newErrors);
  }, [customer, paymentDetails]);

  // Fetch customer summary when phone is entered
  const fetchCustomerSummary = useCallback(async (phone) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      const token = getToken();
      const endpoint = apiEndpoints.searchByPhone(phone, SELL_MEDICINE_CONSTANTS.DEFAULTS.ONE, SELL_MEDICINE_CONSTANTS.DEFAULTS.ONE);
      
      const headers = SALES_POINT_CONSTANTS.getAuthHeaders(token, vendorId);
      headers[SALES_POINT_CONSTANTS.HEADER_KEYS.USER_BRANCH_ID] = branchId;

      const { data } = await apiService.get(endpoint, {
        headers,
        signal: controller.signal,
      });
      
      const summary = data?.summary || {};
      if (summary.found_customer) {
        setCustomer(prev => ({
          ...prev,
          customer_name: summary.customer_name || prev.customer_name,
          email: summary.customer_email || prev.email,
          discount: Number(summary.discount) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO,
          credit: Number(summary.credit) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO,
          tax: Number(summary.tax) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO,
          customer_type: summary.customer_type || CustomerType.WALK_IN,
          advance_payment: Number(summary.advance_amount) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO,
        }));
        
        // ── FIX 2: Mark as existing customer
        setIsExistingCustomer(true);

        if (Number(summary.advance_amount) > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO) {
          setUseAdvancePayment(true);
        }
      } else {
        // Not found — not an existing customer
        setIsExistingCustomer(false);
        if (err?.response?.status === 404) {
          setCustomer(prev => ({
            ...prev,
            customer_type: CustomerType.WALK_IN
          }));
        }
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setIsExistingCustomer(false);
      if (err.response?.status === 404) {
        setCustomer(prev => ({
          ...prev,
          customer_type: CustomerType.WALK_IN
        }));
      }
    } finally {
      setLoading(false);
    }
  }, [vendorId, branchId]);

  // ── FIX 1: Auto-fetch customer summary — skip if phone was set programmatically
  useEffect(() => {
    const phone = customer.phone.trim();

    // Phone was auto-filled by search results — skip this trigger to avoid double hit
    if (skipNextCustomerFetchRef.current) {
      skipNextCustomerFetchRef.current = false;
      return;
    }

    if (phone.length !== SELL_MEDICINE_CONSTANTS.VALIDATION.PHONE_LENGTH || 
        !SALES_POINT_CONSTANTS.validatePhoneNumber(phone) || 
        errors.phone) {
      // Phone is incomplete or invalid — clear existing-customer flag
      setIsExistingCustomer(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchCustomerSummary(phone);
    }, SELL_MEDICINE_CONSTANTS.UI_CONFIG.CUSTOMER_FETCH_DEBOUNCE);

    return () => clearTimeout(timer);
  }, [customer.phone, errors.phone, fetchCustomerSummary]);

  // Search Function
  const search = useCallback(async () => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < minChars) {
      setResults([]);
      setPagination(prev => ({ ...prev, total: SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO }));
      setSearchMessage("");
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      const token = getToken();
      let endpoint;
      
      switch (searchType) {
        case SearchType.MEDICINE:
          endpoint = apiEndpoints.posSearchMedicine(trimmed, pagination.page, pagination.page_size);
          break;
        case SearchType.PHONE:
          endpoint = apiEndpoints.searchByPhone(trimmed, pagination.page, pagination.page_size);
          break;
        case SearchType.LOCAL_MEDICINE:
          endpoint = apiEndpoints.searchLocalMedicines(trimmed, '', '', pagination.page, pagination.page_size);
          break;
        case SearchType.GENERAL:
          endpoint = apiEndpoints.posGeneralProduct(trimmed, pagination.page, pagination.page_size);
          break;
        default:
          return;
      }

      const headers = SALES_POINT_CONSTANTS.getAuthHeaders(token, vendorId);
      headers[SALES_POINT_CONSTANTS.HEADER_KEYS.USER_BRANCH_ID] = branchId;

      const { data } = await apiService.get(endpoint, {
        headers,
        signal: controller.signal,
      });
      
      const responseData = data?.data || [];
      const meta = data?.pagination || {};
      const summary = data?.summary || {};
      setSearchMessage();

      if (searchType === SearchType.PHONE && summary.found_customer) {
        // ── FIX 1: Raise the skip flag BEFORE writing customer.phone so the
        //           watcher does not fire a second fetchCustomerSummary call.
        skipNextCustomerFetchRef.current = true;

        setCustomer(prev => ({
          ...prev,
          customer_name: summary.customer_name || "",
          phone: summary.customer_phone || trimmed,
          email: summary.customer_email || "",
          discount: Number(summary.discount) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO,
          credit: Number(summary.credit) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO,
          tax: Number(summary.tax) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO,
          customer_type: summary.customer_type || CustomerType.WALK_IN,
          advance_payment: Number(summary.advance_amount) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO,
        }));

        // ── FIX 2: Mark as existing customer
        setIsExistingCustomer(true);
        
        if (Number(summary.advance_amount) > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO) {
          setUseAdvancePayment(true);
        }
      } else if (searchType === SearchType.PHONE && !summary.found_customer) {
        setIsExistingCustomer(false);
        setCustomer(prev => ({
          ...prev,
          customer_type: CustomerType.WALK_IN
        }));
      }

      if (!Array.isArray(responseData)) {
        setResults([]);
        setPagination(prev => ({ ...prev, total: SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO }));
        return;
      }

     const mapped = responseData.map((d, i) => {
  const isPhone = searchType === SearchType.PHONE;
  
  let itemType = SELL_MEDICINE_CONSTANTS.ITEM_TYPES.MEDICINE;
  if (searchType === SearchType.LOCAL_MEDICINE) {
    itemType = SELL_MEDICINE_CONSTANTS.ITEM_TYPES.LOCAL;
  } else if (searchType === SearchType.GENERAL) {
    itemType = SELL_MEDICINE_CONSTANTS.ITEM_TYPES.GENERAL;
  } else if (searchType === SearchType.PHONE) {
    itemType = d.category === 'local' 
      ? SELL_MEDICINE_CONSTANTS.ITEM_TYPES.LOCAL 
      : (d.category === 'general' 
        ? SELL_MEDICINE_CONSTANTS.ITEM_TYPES.GENERAL 
        : SELL_MEDICINE_CONSTANTS.ITEM_TYPES.MEDICINE);
  }
  
  let strength, expiry_date, price, stock, batch_code, raw_batch_code, 
      raw_manufacturer, raw_expiry_date, availability, packing_display, location;

  if (isPhone) {
    strength = d.strength || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE;
    expiry_date = d.current_expiry?.split(" ")[0] || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE;
    price = Number(d.sale_price) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO;
    stock = Number(d.current_stock) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO;
    batch_code = d.batch_code || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE;
    raw_batch_code = d.batch_code;
    raw_manufacturer = d.manufacturer || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE;
    raw_expiry_date = d.current_expiry;
    availability = stock > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO 
      ? AvailabilityStatus.IN_STOCK 
      : AvailabilityStatus.NOT_IN_STOCK;
    packing_display = SALES_POINT_CONSTANTS.formatPacking(d.packing);
    location = SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE;
  } else if (itemType === SELL_MEDICINE_CONSTANTS.ITEM_TYPES.MEDICINE) {
    strength = d.strength || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE;
    expiry_date = d.expiry_date?.split(" ")[0] || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE;
    price = Number(d.sale_price) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO;
    stock = Number(d.stock) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO;
    batch_code = d.batch_code || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE;
    raw_batch_code = d.batch_code;
    raw_manufacturer = d.manufacturer || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE;
    raw_expiry_date = d.expiry_date;
    availability = d.availability || (stock > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO 
      ? AvailabilityStatus.IN_STOCK 
      : AvailabilityStatus.NOT_IN_STOCK);
    packing_display = SALES_POINT_CONSTANTS.formatPacking(d.packing);
    location = SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE;
  } else {
    strength = d.strength || d.category || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE;
    
    if (strength !== SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE && strength !== null && strength !== undefined) {
      strength = String(strength);
    }
    
    expiry_date = d.expiry_date?.split(" ")[0] || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE;
    price = Number(d.sale_price) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO;
    stock = Number(d.stock) || Number(d.stock_num) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO;
    batch_code = d.batch_code || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE;
    raw_batch_code = d.batch_code;
    raw_manufacturer = d.manufacturer || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE;
    raw_expiry_date = d.expiry_date;
    availability = stock > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO 
      ? AvailabilityStatus.IN_STOCK 
      : AvailabilityStatus.NOT_IN_STOCK;
    packing_display = itemType === SELL_MEDICINE_CONSTANTS.ITEM_TYPES.LOCAL 
      ? SALES_POINT_CONSTANTS.formatPacking(d.packing)
      : (SALES_POINT_CONSTANTS.formatGeneralPacking(d.packing) || SELL_MEDICINE_CONSTANTS.DEFAULTS.DASH);
    location = d.location || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE;
  }

  return {
    id: `${d.medicine_id || d.product_id}-${i}`,
    fullData: d,
    drug_name: d.name || d.product_name || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE,
    strength,
    expiry_date,
    price,
    stock,
    batch_code,
    medicine_id: d.medicine_id || d.product_id,
    raw_batch_code,
    raw_manufacturer,
    raw_expiry_date,
    availability,
    packing_display,
    location,
    type: d.type || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE,
    packing: d.packing || { total_pack: 0, pack_strip: 0, strip_tablet: 0, total_strip: 0 },
    unit_type: d.unit_type || "",
    qty: isPhone ? Number(d.quantity) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ONE : SELL_MEDICINE_CONSTANTS.DEFAULTS.ONE,
    itemType: itemType,
  };
});

      setResults(mapped);
      setPagination(prev => ({
        ...prev,
        total: meta.total_records || meta.total_items || mapped.length || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO,
      }));
    } catch (err) {
      if (err.name === "AbortError") return;
      setResults([]);
      setPagination(prev => ({ ...prev, total: SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO }));
      setSearchMessage(SALES_POINT_CONSTANTS.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [searchType, searchTerm, pagination.page, pagination.page_size, vendorId, branchId, minChars]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => search(), SELL_MEDICINE_CONSTANTS.UI_CONFIG.SEARCH_DEBOUNCE);
    return () => clearTimeout(timer);
  }, [search]);

  // Cart Operations
  const addToCart = useCallback((drug, overrideQty = null) => {
    if (drug.stock <= SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO) return;
    const addQty = overrideQty !== null ? overrideQty : (drug.qty || SELL_MEDICINE_CONSTANTS.DEFAULTS.ONE);
    if (addQty <= SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO) return;

    setCart(prev => {
      const exists = prev.find(x => 
        x.medicine_id === drug.medicine_id && 
        x.batch_code === drug.batch_code &&
        x.expiry_date === drug.expiry_date
      );

      if (exists) {
        const newQty = exists.qty + addQty;
        const cappedQty = Math.min(newQty, drug.stock);
        if (cappedQty <= exists.qty) return prev;

        return prev.map(x =>
          (x.medicine_id === drug.medicine_id && 
           x.batch_code === drug.batch_code && 
           x.expiry_date === drug.expiry_date)
            ? { ...x, qty: cappedQty, total: cappedQty * x.price }
            : x
        );
      }

      const initialQty = Math.min(addQty, drug.stock);
      if (initialQty <= SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO) return prev;

      return [
        ...prev,
        {
          medicine_id: drug.medicine_id,
          drug_name: drug.drug_name,
          strength: drug.strength,
          price: drug.price,
          stock: drug.stock,
          batch_code: drug.batch_code,
          expiry_date: drug.expiry_date,
          qty: initialQty,
          total: initialQty * drug.price,
          itemType: drug.itemType,
        }
      ];
    });
  }, []);

  const addAllToCart = useCallback(() => {
    results.forEach(drug => {
      addToCart(drug);
    });
  }, [results, addToCart]);

  const updateQty = useCallback((medicine_id, batch_code, expiry_date, qty) => {
    const numQty = Number(qty);
    if (isNaN(numQty) || numQty < SELL_MEDICINE_CONSTANTS.VALIDATION.QTY_MIN) return;
    
    setCart(prev =>
      prev.map(x =>
        (x.medicine_id === medicine_id && 
         x.batch_code === batch_code && 
         x.expiry_date === expiry_date)
          ? { ...x, qty: Math.min(numQty, x.stock), total: Math.min(numQty, x.stock) * x.price }
          : x
      )
    );
  }, []);

  const removeItem = useCallback((medicine_id, batch_code, expiry_date) => {
    setCart(prev => 
      prev.filter(x => 
        !(x.medicine_id === medicine_id && 
          x.batch_code === batch_code && 
          x.expiry_date === expiry_date)
      )
    );
  }, []);

  const clearEverything = useCallback(() => {
    setLoading(true);
    setCart([]);
    setCustomer({ ...CUSTOMER_DEFAULTS });
    setPaymentDetails({ ...PAYMENT_DEFAULTS });
    setUseAdvancePayment(true);
    setDeliveryInfo({ ...DELIVERY_DEFAULTS });
    setIsDeliveryMode(false);
    setSearchTerm("");
    setResults([]);
    setSearchMessage("");
    setPagination({ page: SELL_MEDICINE_CONSTANTS.DEFAULTS.ONE, page_size: 10, total: SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO });
    setWarning(null);
    setCreditTransactionError(null);
    setSearchType(SearchType.MEDICINE);
    // ── FIX 2: Reset existing-customer flag on full reset
    setIsExistingCustomer(false);
    skipNextCustomerFetchRef.current = false;
    
    amountFieldIdRef.current = `amount_field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    
    setTimeout(() => setLoading(false), SELL_MEDICINE_CONSTANTS.UI_CONFIG.REFRESH_TIMEOUT);
  }, []);

  // Submit Sale (includes delivery fields, amount_paid excludes delivery charges)
  const submitSale = useCallback(async () => {
    setCreditTransactionError(null);
    
    const isCreditTransaction = paymentDetails.transaction_type === TransactionType.PARTIAL_PAID || 
                              paymentDetails.transaction_type === TransactionType.CREDIT;
    
    if (isCreditTransaction) {
      if (!customer.customer_name.trim() || !customer.phone.trim()) {
        const errorType = paymentDetails.transaction_type === TransactionType.PARTIAL_PAID ? "partial payment" : "credit";
        setCreditTransactionError(SELL_MEDICINE_CONSTANTS.ERRORS.CREDIT_REQUIREMENT.replace('{type}', errorType));
        return;
      }
      
      if (!SALES_POINT_CONSTANTS.validatePhoneNumber(customer.phone.trim())) {
        setCreditTransactionError(SELL_MEDICINE_CONSTANTS.ERRORS.CREDIT_PHONE_INVALID);
        return;
      }
    }

    if (Object.keys(errors).length > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO) return;
    if (cart.length === SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO) {
      setWarning(SELL_MEDICINE_CONSTANTS.ERRORS.NO_PRODUCT_SELECTED);
      return;
    }

    const token = getToken();
    
    const drugs = cart.map(item => {
      let category = SELL_MEDICINE_CONSTANTS.CATEGORY_VALUES.MEDICINE;
      
      if (item.itemType === SELL_MEDICINE_CONSTANTS.ITEM_TYPES.LOCAL) {
        category = SELL_MEDICINE_CONSTANTS.CATEGORY_VALUES.LOCAL;
      } else if (item.itemType === SELL_MEDICINE_CONSTANTS.ITEM_TYPES.GENERAL) {
        category = SELL_MEDICINE_CONSTANTS.CATEGORY_VALUES.GENERAL;
      } else {
        category = SELL_MEDICINE_CONSTANTS.CATEGORY_VALUES.MEDICINE;
      }
      
      return {
        name: item.drug_name,
        strength: item.itemType === SELL_MEDICINE_CONSTANTS.ITEM_TYPES.MEDICINE ? item.strength : null,
        quantity: item.qty,
        batch_code: item.batch_code,
        category: category
      };
    });
    
    const finalCashierName = cashierLocked && cashierName.trim() ? cashierName.trim() : defaultCashier;
    
    // amount_paid should NEVER include delivery charges
    let amountPaidValue = paymentDetails.amount_paid;
    
    if (paymentDetails.payment_type === PaymentMethod.ADVANCE) {
      amountPaidValue = SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO;
    } else if (paymentDetails.transaction_type === TransactionType.CREDIT) {
      amountPaidValue = SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO;
    }
    
    // Determine order_type based on delivery address
    const orderType = isDeliveryMode && deliveryInfo.address.trim() ? "delivery" : "physical";
    
    const payload = {
      vendor_id: vendorId,
      branch_id: branchId,
      drugs,
      cashier_name: finalCashierName,
      invoice_no: "",
      customer_name: customer.customer_name.trim() || null,
      phone: customer.phone.trim() || null,
      email: customer.email.trim() || null,
      is_return: false,
      discount: customer.discount,
      gst_percentage: customer.tax,
      transaction_type: paymentDetails.transaction_type,
      payment_type: paymentDetails.payment_type,
      amount_paid: amountPaidValue,
      customer_type: customer.customer_type || CustomerType.WALK_IN,
      use_advance: useAdvancePayment,
      credit: totals.creditApplied,

      deliveryAddress: isDeliveryMode ? (deliveryInfo.address.trim() || null) : null,
      deliveryCharges: isDeliveryMode ? (deliveryInfo.charges || 0) : 0,
      customerNotes: isDeliveryMode ? (deliveryInfo.notes.trim() || null) : null,
      orderType: orderType,
    };

    try {
      setLoading(true);

      const headers = SALES_POINT_CONSTANTS.getAuthHeaders(token, vendorId);
      headers[SALES_POINT_CONSTANTS.HEADER_KEYS.USER_BRANCH_ID] = branchId;

      const { data } = await apiService.post(apiEndpoints.drugSellMedicine, payload, { headers });
      const receipt = data?.data || null;
      const items = receipt?.items || receipt?.drug_details || [];
      
      let subtotalNum = SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO;
      let medicineDiscountAmount = SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO;
      
      const formattedItems = items.map(item => {
        const cartItem = cart.find(c => 
          (c.medicine_id === item.product_id || 
           c.drug_name === item.name) 
        );
        const itemType = cartItem ? cartItem.itemType : SELL_MEDICINE_CONSTANTS.ITEM_TYPES.MEDICINE;
        const isMedicineItem = itemType === SELL_MEDICINE_CONSTANTS.ITEM_TYPES.MEDICINE;
        
        const itemPrice = Number(item.sale_price || item.price || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO);
        const itemQty = item.quantity || item.qty || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO;
        const itemSubtotal = itemPrice * itemQty;
        
        const itemDiscountPercent = isMedicineItem ? customer.discount : SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO;
        const itemDiscountAmount = itemSubtotal * (itemDiscountPercent / 100);
        const itemNetPrice = itemSubtotal - itemDiscountAmount;
        
        subtotalNum += itemSubtotal;
        
        if (isMedicineItem) {
          medicineDiscountAmount += itemDiscountAmount;
        }
        
        return {
          drug_name: item.name || SELL_MEDICINE_CONSTANTS.DEFAULTS.UNKNOWN_ITEM,
          strength: item.strength || "",
          quantity: itemQty,
          price: itemPrice,
          total: itemNetPrice,
          discount_percent: itemDiscountPercent,
          discount_amount: itemDiscountAmount,
          item_type: itemType,
          subtotal: itemSubtotal
        };
      });
      
      const discountAmount = medicineDiscountAmount;
      const netTotal = subtotalNum - discountAmount;
      const taxAmount = netTotal * (customer.tax / 100);
      const totalWithTax = netTotal + taxAmount;
      const deliveryCharges = isDeliveryMode ? (deliveryInfo.charges || 0) : 0;
      const grandTotal = totalWithTax + deliveryCharges;
      
      const totalItems = formattedItems.length;
      const invoiceNo = receipt?.invoice_no || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE;
      
      let successMessage;
      if (totalItems <= SELL_MEDICINE_CONSTANTS.UI_CONFIG.POPUP_ITEMS_THRESHOLD) {
        const itemList = formattedItems
          .slice(0, SELL_MEDICINE_CONSTANTS.UI_CONFIG.POPUP_ITEMS_THRESHOLD)
          .map(i => `${i.drug_name}${i.strength ? ` (${i.strength})` : ''} x${i.quantity}`)
          .join(", ");
        successMessage = SELL_MEDICINE_CONSTANTS.SUCCESS.SALE_COMPLETED
          .replace('{invoice}', invoiceNo)
          .replace('{details}', itemList);
      } else {
        successMessage = SELL_MEDICINE_CONSTANTS.SUCCESS.SALE_COMPLETED
          .replace('{invoice}', invoiceNo)
          .replace('{details}', SELL_MEDICINE_CONSTANTS.SUCCESS.ITEMS_SOLD.replace('{count}', totalItems));
      }
      
      setSuccess(successMessage);
      
      let receiptAmountPaid = receipt?.amount_paid || amountPaidValue;
      
      if (paymentDetails.payment_type === PaymentMethod.ADVANCE) {
        receiptAmountPaid = SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO;
      }
      
      setReceiptData({
        ...receipt,
        invoice_no: invoiceNo,
        cashier_name: finalCashierName,
        discount: customer.discount,
        discount_amount: discountAmount,
        tax: customer.tax,
        tax_amount: taxAmount,
        subtotal: subtotalNum,
        net_total: netTotal,
        total: totalWithTax,
        grand_total: grandTotal,
        delivery_charges: deliveryCharges,
        delivery_address: isDeliveryMode ? deliveryInfo.address : null,
        customer_notes: isDeliveryMode ? deliveryInfo.notes : null,
        order_type: orderType,
        amount_paid: receiptAmountPaid,
        payment_type: paymentDetails.payment_type,
        transaction_type: paymentDetails.transaction_type,
        advance_used: receipt?.advance_used || totals.advanceUsed,
        due_amount: receipt?.due_amount || totals.creditApplied,
        customer_name: customer.customer_name,
        phone: customer.phone,
        drug_details: formattedItems.map(item => ({
          name: item.drug_name,
          strength: item.strength,
          quantity: item.quantity,
          price: item.price,
          sale_price: item.price,
          retail_price: item.price,
          discount_percent: item.discount_percent,
          item_type: item.item_type,
          subtotal: item.subtotal
        }))
      });
      
      setPopupItems(formattedItems);
      clearEverything();
    } catch (err) {
      setWarning(SALES_POINT_CONSTANTS.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [
    cart,
    customer,
    paymentDetails,
    errors,
    cashierLocked,
    cashierName,
    defaultCashier,
    vendorId,
    branchId,
    useAdvancePayment,
    totals.advanceUsed,
    totals.creditApplied,
    deliveryInfo,
    isDeliveryMode,
    clearEverything
  ]);

  // Auto-clear success message
  useEffect(() => {
    if (success || receiptData) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setReceiptData(null);
        setPopupItems([]);
        setShowSuccessTooltip(false);
      }, SELL_MEDICINE_CONSTANTS.UI_CONFIG.SUCCESS_MESSAGE_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [success, receiptData]);

  // Clear warning when cart has items
  useEffect(() => {
    if (cart.length > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO) setWarning(null);
  }, [cart.length]);

  // Handle mouse move for tooltip
  const handleMouseMove = useCallback((e) => {
    if (popupItems.length > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO) {
      setTooltipPosition({
        x: e.clientX + SELL_MEDICINE_CONSTANTS.UI_CONFIG.TOOLTIP_OFFSET,
        y: e.clientY + SELL_MEDICINE_CONSTANTS.UI_CONFIG.TOOLTIP_OFFSET
      });
    }
  }, [popupItems.length]);

  // ── PAYMENT METHOD GUARD: when transaction type changes, ensure payment_type
  //    stays valid for the new type. If not, reset to a sensible default.
  const handleTransactionTypeChange = useCallback((val) => {
    if (val === "home_delivery") {
      setShowDeliveryPopup(true);
      return;
    }

    // Switching away from delivery mode clears delivery state
    if (isDeliveryMode) {
      setIsDeliveryMode(false);
      setDeliveryInfo({ ...DELIVERY_DEFAULTS });
    }

    let newPaymentType = paymentDetails.payment_type;

    if (val === TransactionType.CREDIT) {
      // Credit transaction → force payment method to Credit
      newPaymentType = PaymentMethod.CREDIT;
    } else {
      // Fully Paid / Partial Paid → Credit payment method is not allowed
      if (paymentDetails.payment_type === PaymentMethod.CREDIT) {
        newPaymentType = PaymentMethod.CASH;
      }
    }

    if (val === TransactionType.FULLY_PAID) {
      setCreditTransactionError(null);
    }

    setPaymentDetails(prev => ({
      ...prev,
      transaction_type: val,
      payment_type: newPaymentType,
    }));
  }, [isDeliveryMode, paymentDetails.payment_type]);

  // Search Columns Generator
  const getSearchColumns = useCallback((currentSearchType) => {
    const baseColumns = [
      {
        accessorKey: "drug_name",
        header: ({ column }) => (
          <HeaderWithSort 
            column={column} 
            title={currentSearchType === SearchType.GENERAL || currentSearchType === SearchType.LOCAL_MEDICINE 
              ? SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.PRODUCT_NAME
              : SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.MEDICINE_NAME} 
          />
        ),
        cell: ({ row }) => {
          const drug = row.original;
          const showTag = drug.availability === AvailabilityStatus.NOT_IN_STOCK || 
                         !drug.raw_batch_code || 
                         !drug.raw_manufacturer || 
                         !drug.raw_expiry_date;
          return (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedDrug(drug.fullData)}
                className="font-medium text-left text-blue-600 hover:underline"
              >
                {drug.drug_name}
              </button>
              {showTag && currentSearchType === SearchType.MEDICINE && (
                <span className={SELL_MEDICINE_CONSTANTS.CSS_CLASSES.NOT_IN_STOCK_TAG}>
                  {SELL_MEDICINE_CONSTANTS.LABELS.NOT_IN_YOUR_STOCK}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "batch_code",
        header: SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.BATCH,
        cell: ({ row }) => <div className="text-xs font-mono text-left">{row.original.batch_code}</div>,
      },
      {
        accessorKey: "expiry_date",
        header: ({ column }) => <HeaderWithSort column={column} title={SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.EXPIRY} />,
        cell: ({ row }) => <div className="text-sm text-left">{row.original.expiry_date}</div>,
      },
      {
        accessorKey: "price",
        header: ({ column }) => <HeaderWithSort column={column} title={SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.PRICE} />,
        cell: ({ row }) => <div>{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(row.original.price)}</div>,
      },
    ];

    let strengthOrCategoryColumn;
    
    if (currentSearchType === SearchType.GENERAL) {
      strengthOrCategoryColumn = {
        accessorKey: "strength",
        header: ({ column }) => (
          <HeaderWithSort column={column} title={SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.CATEGORY} />
        ),
        cell: ({ row }) => <div className="text-sm text-left">{row.original.strength}</div>,
      };
    } else if (currentSearchType === SearchType.PHONE) {
      strengthOrCategoryColumn = {
        accessorKey: "strength",
        header: ({ column }) => (
          <HeaderWithSort column={column} title={SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.CATEGORY} />
        ),
        cell: ({ row }) => <div className="text-sm text-left">{row.original.strength}</div>,
      };
    } else {
      strengthOrCategoryColumn = {
        accessorKey: "strength",
        header: ({ column }) => (
          <HeaderWithSort column={column} title={SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.STRENGTH} />
        ),
        cell: ({ row }) => <div className="text-sm text-left">{row.original.strength}</div>,
      };
    }

    const packingColumn = {
      accessorKey: "packing",
      header: SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.PACKING,
      cell: ({ row }) => (
        <PackingDisplay 
          packing={row.original.packing} 
          unitType={row.original.unit_type}
        />
      ),
    };

    const stockColumn = {
      accessorKey: "stock",
      header: ({ column }) => <HeaderWithSort column={column} title={SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.STOCK} />,
      cell: ({ row }) => <div className="text-sm text-left">{row.original.stock}</div>,
    };

    const locationColumn = {
      accessorKey: "location",
      header: SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.LOCATION,
      cell: ({ row }) => <div className="text-sm text-left">{row.original.location}</div>,
    };

    let actionColumn;
    
    if (currentSearchType === SearchType.PHONE) {
      actionColumn = {
        accessorKey: "action",
        header: () => {
          const availableDrugs = results.filter(d => d.stock > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO);
          const allChecked = availableDrugs.length > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO && 
                           availableDrugs.every(d => cart.some(c => 
                             c.medicine_id === d.medicine_id && 
                             c.batch_code === d.batch_code && 
                             c.expiry_date === d.expiry_date
                           ));
          return (
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => {
                  availableDrugs.forEach(drug => {
                    if (e.target.checked) {
                      addToCart(drug);
                    } else {
                      removeItem(drug.medicine_id, drug.batch_code, drug.expiry_date);
                    }
                  });
                }}
                disabled={availableDrugs.length === SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO}
              />
              {SELL_MEDICINE_CONSTANTS.LABELS.ACTIONS}
            </div>
          );
        },
        cell: ({ row }) => {
          const drug = row.original;
          
          if (drug.stock <= SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO) {
            return <span className="text-red-600">{SELL_MEDICINE_CONSTANTS.ERRORS.OUT_OF_STOCK}</span>;
          }
          
          const inCart = cart.find(x => 
            x.medicine_id === drug.medicine_id && 
            x.batch_code === drug.batch_code && 
            x.expiry_date === drug.expiry_date
          );
          
          return (
            <input
              type="checkbox"
              checked={!!inCart}
              onChange={(e) => {
                if (e.target.checked) {
                  addToCart(drug);
                } else {
                  removeItem(drug.medicine_id, drug.batch_code, drug.expiry_date);
                }
              }}
            />
          );
        },
      };
    } else {
      actionColumn = {
        accessorKey: "action",
        header: SELL_MEDICINE_CONSTANTS.LABELS.ACTION,
        cell: ({ row }) => {
          const drug = row.original;
          const inCart = cart.find(x => 
            x.medicine_id === drug.medicine_id && 
            x.batch_code === drug.batch_code && 
            x.expiry_date === drug.expiry_date
          );
          
          if (inCart) {
            return <span className={SELL_MEDICINE_CONSTANTS.CSS_CLASSES.IN_CART_ICON}>{SELL_MEDICINE_CONSTANTS.DEFAULTS.CHECK_MARK}</span>;
          }
          
          const buttonText = drug.qty > SELL_MEDICINE_CONSTANTS.DEFAULTS.ONE 
            ? SELL_MEDICINE_CONSTANTS.LABELS.ADD_QTY.replace('{qty}', drug.qty)
            : SELL_MEDICINE_CONSTANTS.LABELS.ADD;
          return (
            <Button
              onClick={() => addToCart(drug)}
              disabled={drug.stock === SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO || loading}
              variant={drug.stock > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO ? "primary" : "secondary"}
              size="sm"
              className={`${drug.stock > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO ? '' : 'cursor-not-allowed'}`}
            >
              {buttonText}
            </Button>
          );
        },
      };
    }

    let columns = [...baseColumns];
    columns.push(strengthOrCategoryColumn);

    if (currentSearchType !== SearchType.PHONE) {
      columns.push(packingColumn);
    }

    columns.push(stockColumn);

    if (currentSearchType === SearchType.GENERAL || currentSearchType === SearchType.LOCAL_MEDICINE) {
      columns.push(locationColumn);
    }

    columns.push(actionColumn);

    return columns;
  }, [cart, results, loading, addToCart, removeItem]);

  const searchCols = useMemo(() => 
    getSearchColumns(searchType),
    [getSearchColumns, searchType]
  );

  // Cart Columns with Quantity Editor
  const CartQuantityCell = React.memo(({ item, updateQty, removeItem }) => {
    const [editingQty, setEditingQty] = useState(item.qty.toString());
    const [prevQty, setPrevQty] = useState(item.qty);

    useEffect(() => {
      setEditingQty(item.qty.toString());
      setPrevQty(item.qty);
    }, [item.qty]);

    const handleChange = (e) => {
      const value = e.target.value;
      if (value === "" || /^\d*$/.test(value)) {
        setEditingQty(value);
      }
    };

    const handleBlur = () => {
      let num = parseInt(editingQty || "0", 10);
      if (isNaN(num) || num < SELL_MEDICINE_CONSTANTS.VALIDATION.QTY_MIN) {
        num = prevQty;
      } else if (num > item.stock) {
        num = item.stock;
      }
      updateQty(item.medicine_id, item.batch_code, item.expiry_date, num);
      setEditingQty(num.toString());
      setPrevQty(num);
    };

    const onIncrease = () => {
      if (item.qty >= item.stock) return;
      const newQty = item.qty + SELL_MEDICINE_CONSTANTS.DEFAULTS.ONE;
      updateQty(item.medicine_id, item.batch_code, item.expiry_date, newQty);
    };

    const onDecrease = () => {
      if (item.qty <= SELL_MEDICINE_CONSTANTS.VALIDATION.QTY_MIN) {
        removeItem(item.medicine_id, item.batch_code, item.expiry_date);
        return;
      }
      const newQty = item.qty - SELL_MEDICINE_CONSTANTS.DEFAULTS.ONE;
      updateQty(item.medicine_id, item.batch_code, item.expiry_date, newQty);
    };

    return (
      <div className="flex items-center gap-1">
        <button onClick={onDecrease} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm sm:text-base">-</button>
        <input
          type="text"
          value={editingQty}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleBlur();
            }
          }}
          className="w-12 sm:w-14 border rounded px-1 sm:px-2 py-1 text-center text-sm sm:text-base focus:ring-2 focus:ring-[#3C5690] font-medium"
        />
        <button onClick={onIncrease} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm sm:text-base">+</button>
      </div>
    );
  });

  CartQuantityCell.displayName = 'CartQuantityCell';
const cartCols = useMemo(() => [
  { accessorKey: "drug_name", header: "Product Name" },
  { accessorKey: "strength", header: SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.DETAILS },
  { 
    accessorKey: "price", 
    header: SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.PRICE, 
    cell: ({ row }) => <span className="text-xs sm:text-sm">{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(row.original.price)}</span>
  },
  { 
    accessorKey: "batch_code", 
    header: SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.BATCH, 
    cell: ({ row }) => (
      <span className="font-mono text-xs bg-gray-100 px-1 sm:px-2 py-1 rounded">
        {row.original.batch_code || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE}
      </span>
    ) 
  },
  {
    accessorKey: "qty",
    header: SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.QTY,
    cell: ({ row }) => (
      <CartQuantityCell 
        item={row.original}
        updateQty={updateQty}
        removeItem={removeItem}
      />
    ),
  },
  { 
    accessorKey: "total", 
    header: SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.TOTAL, 
    cell: ({ row }) => {
      const item = row.original;
      // Simple price * qty without discount calculation
      const itemTotal = item.price * item.qty;
      return <span className="text-xs sm:text-sm font-medium">{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(itemTotal)}</span>;
    }
  },
  { 
    accessorKey: "remove", 
    header: "Action", 
    cell: ({ row }) => (
      <button 
        onClick={() => removeItem(row.original.medicine_id, row.original.batch_code, row.original.expiry_date)} 
        className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium"
      >
        {SELL_MEDICINE_CONSTANTS.LABELS.REMOVE_ITEM}
      </button>
    ) 
  },
], [updateQty, removeItem]); // Removed customer.discount dependency since we're not using it anymore

  const popupColumns = useMemo(() => [
    { accessorKey: "drug_name", header: SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.ITEM },
    { accessorKey: "strength", header: SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.DETAILS },
    { 
      accessorKey: "discount_percent", 
      header: SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.DISCOUNT, 
      cell: ({ row }) => {
        const item = row.original;
        if (item.item_type !== SELL_MEDICINE_CONSTANTS.ITEM_TYPES.MEDICINE) {
          return <span className="text-gray-500 text-xs sm:text-sm">{SELL_MEDICINE_CONSTANTS.DEFAULTS.DASH}</span>;
        }
        return (
          <span className="text-xs sm:text-sm">
            {item.discount_percent}% (Rs {item.discount_amount.toFixed(2)})
          </span>
        );
      }
    },
    { 
      accessorKey: "price", 
      header: SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.PRICE, 
      cell: ({ row }) => <span className="text-xs sm:text-sm">{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(row.original.price)}</span>
    },
    { 
      accessorKey: "quantity", 
      header: SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.QTY, 
      cell: ({ row }) => <span className="font-bold text-sm">{row.original.quantity}</span> 
    },
    { 
      accessorKey: "total", 
      header: SELL_MEDICINE_CONSTANTS.TABLE_HEADERS.TOTAL, 
      cell: ({ row }) => (
        <span className="font-semibold text-green-600 text-xs sm:text-sm">{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(row.original.total)}</span>
      ) 
    },
  ], []);

  const switchToMedicineSearch = useCallback(() => {
    setSearchType(SearchType.MEDICINE);
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearchChange = useCallback((e) => {
    let value = e.target.value;
    if (searchType === SearchType.PHONE) {
      value = value.replace(/\D/g, '').slice(0, SELL_MEDICINE_CONSTANTS.VALIDATION.PHONE_LENGTH);
    }
    setSearchTerm(value);
  }, [searchType]);

  const getMessageClass = useCallback(() => {
    if (searchMessage && results.length === SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO) {
      return "text-red-600";
    }
    return "text-blue-600";
  }, [searchMessage, results.length]);

  const getPlaceholder = useCallback(() => {
    return SELL_MEDICINE_CONSTANTS.SEARCH_PLACEHOLDERS[searchType] || SELL_MEDICINE_CONSTANTS.SEARCH_PLACEHOLDERS.default;
  }, [searchType]);

  // Determine the value to show in the transaction type dropdown
  const getTransactionTypeDisplayValue = () => {
    if (isDeliveryMode) {
      return "home_delivery";
    }
    return paymentDetails.transaction_type;
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-md w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">{SELL_MEDICINE_CONSTANTS.LABELS.PAGE_TITLE}</h1>
          {/* Delivery Badge */}
          {isDeliveryMode && deliveryInfo.address.trim() && (
            <span className={SELL_MEDICINE_CONSTANTS.CSS_CLASSES.DELIVERY_BADGE}>
              {SELL_MEDICINE_CONSTANTS.LABELS.DELIVERY_BADGE}
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Button
            onClick={clearEverything}
            disabled={loading}
            variant="primary"
            size="md"
            className="flex items-center justify-center gap-3 whitespace-nowrap w-full sm:w-auto"
            loading={loading}
            loadingText={SELL_MEDICINE_CONSTANTS.LABELS.REFRESHING}
          >
            {loading ? SELL_MEDICINE_CONSTANTS.LABELS.REFRESHING : SELL_MEDICINE_CONSTANTS.LABELS.REFRESH}
          </Button>

          <div className="flex items-center gap-2 text-sm w-full sm:w-auto">
            <InputText
              label=""
              name="cashierName"
              value={cashierName}
              onChange={(e) => !cashierLocked && setCashierName(e.target.value)}
              maxLength={SELL_MEDICINE_CONSTANTS.VALIDATION.CUSTOMER_NAME_MAX}
              disabled={cashierLocked}
              placeholder={SELL_MEDICINE_CONSTANTS.LABELS.CASHIER_NAME}
              className="flex-1 sm:w-40"
              inputClassName={cashierLocked ? SELL_MEDICINE_CONSTANTS.CSS_CLASSES.CASHIER_LOCKED : ''}
            />
            {cashierLocked ? (
             <Button
  onClick={() => {
    setCashierLocked(false);
  
  }}
  variant="danger"
  size="sm"
  className="text-xs whitespace-nowrap"
>
  {SELL_MEDICINE_CONSTANTS.LABELS.REMOVE}
</Button>
            ) : (
              <Button
                onClick={() => cashierName.trim() && setCashierLocked(true)}
                disabled={!cashierName.trim()}
                variant="primary"
                size="sm"
                className="text-xs whitespace-nowrap"
              >
                {SELL_MEDICINE_CONSTANTS.LABELS.LOCK}
              </Button>
            )}
          </div>
        </div>
      </div>
                   
      {/* Success Message + Print Button */}
      {success && (
        <div className="mb-6">
          <Alert 
            variant="success" 
            message={
              <div 
                ref={successMessageRef}
                className="relative"
                onMouseEnter={(e) => {
                  if (popupItems.length > SELL_MEDICINE_CONSTANTS.UI_CONFIG.POPUP_ITEMS_THRESHOLD) {
                    setShowSuccessTooltip(true);
                    setTooltipPosition({
                      x: e.clientX + SELL_MEDICINE_CONSTANTS.UI_CONFIG.TOOLTIP_OFFSET,
                      y: e.clientY + SELL_MEDICINE_CONSTANTS.UI_CONFIG.TOOLTIP_OFFSET
                    });
                  }
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setShowSuccessTooltip(false)}
              >
                {success}
              </div>
            }
            className="mb-4"
            onClose={() => {
              setSuccess(null);
              setReceiptData(null);
              setPopupItems([]);
              setShowSuccessTooltip(false);
            }}
          />
          
          {showSuccessTooltip && popupItems.length > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO && (
            <div 
              className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-auto"
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
              }}
              onMouseEnter={() => setShowSuccessTooltip(true)}
              onMouseLeave={() => setShowSuccessTooltip(false)}
            >
              <h3 className="font-bold text-lg mb-2 text-green-600">
                {SELL_MEDICINE_CONSTANTS.LABELS.SOLD_ITEMS.replace('{count}', popupItems.length)}
              </h3>
              <div className="space-y-2">
                {popupItems.map((item, index) => (
                  <div key={index} className="flex justify-between border-b pb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.drug_name}</p>
                      {item.strength && <p className="text-xs text-gray-500">{item.strength}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">x{item.quantity}</p>
                      <p className="text-xs text-green-600">Rs {item.total.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {popupItems.length > SELL_MEDICINE_CONSTANTS.UI_CONFIG.POPUP_ITEMS_VIEW_THRESHOLD && (
            <div className="mb-2">
              <button
                onClick={() => setShowItemsPopup(true)}
                className="text-[#3C5690] underline hover:text-[#5A75C7] font-medium text-sm"
              >
                {SELL_MEDICINE_CONSTANTS.LABELS.VIEW_ALL.replace('{count}', popupItems.length)}
              </button>
            </div>
          )}
          
          {receiptData && (
            <div className="flex justify-center mb-6">
              <Button
                onClick={() => printReceipt(receiptData, "sell")}
                variant="primary"
                size="md"
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                {SELL_MEDICINE_CONSTANTS.LABELS.PRINT_RECEIPT}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Warning Alert */}
      {warning && (
        <Alert 
          variant="error" 
          message={warning}
          className="mb-6"
          onClose={() => setWarning(null)}
        />
      )}

      {/* Credit Transaction Error Alert */}
      {creditTransactionError && (paymentDetails.transaction_type === TransactionType.PARTIAL_PAID || paymentDetails.transaction_type === TransactionType.CREDIT) && (
        <Alert 
          variant="error" 
          message={
            <div className="flex items-start gap-2">
              <div>
                <strong className="font-semibold text-sm">
                  {paymentDetails.transaction_type === TransactionType.PARTIAL_PAID 
                    ? SELL_MEDICINE_CONSTANTS.PAYMENT.PARTIAL_PAYMENT_REQ
                    : SELL_MEDICINE_CONSTANTS.PAYMENT.CREDIT_SALE_REQ}
                </strong> {creditTransactionError}
                <div className="mt-1 text-xs">
                  <p className="text-gray-600">{SELL_MEDICINE_CONSTANTS.PAYMENT.CUSTOMER_REQUIRED_CREDIT}</p>
                  <p className="text-gray-600">{SELL_MEDICINE_CONSTANTS.PAYMENT.PHONE_REQUIRED_FORMAT}</p>
                  <p className="text-gray-600">
                    {paymentDetails.transaction_type === TransactionType.PARTIAL_PAID 
                      ? SELL_MEDICINE_CONSTANTS.PAYMENT.PARTIAL_CREDIT_NOTE
                      : SELL_MEDICINE_CONSTANTS.PAYMENT.FULL_CREDIT_NOTE}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCreditTransactionError(null)}
                className="text-red-600 hover:text-red-800 ml-auto"
              >
                ×
              </button>
            </div>
          }
          className="mb-6 border-l-4 border-red-500 bg-red-50"
        />
      )}

      {/* Search Section */}
      <div className={`mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 sm:p-3 rounded-2xl ${SELL_MEDICINE_CONSTANTS.CSS_CLASSES.SEARCH_SECTION_BG} shadow-sm`}>
        <div className="w-full sm:w-48">
          <InputSelect
            label=""
            name="searchType"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="w-full"
          >
            <option value={SearchType.MEDICINE}>{SELL_MEDICINE_CONSTANTS.SEARCH_TYPE_NAMES[SearchType.MEDICINE]}</option>
            <option value={SearchType.LOCAL_MEDICINE}>{SELL_MEDICINE_CONSTANTS.SEARCH_TYPE_NAMES[SearchType.LOCAL_MEDICINE]}</option>
            <option value={SearchType.GENERAL}>{SELL_MEDICINE_CONSTANTS.SEARCH_TYPE_NAMES[SearchType.GENERAL]}</option>
            <option value={SearchType.PHONE}>{SELL_MEDICINE_CONSTANTS.SEARCH_TYPE_NAMES[SearchType.PHONE]}</option>
          </InputSelect>
        </div>

        <div className="flex-1">
          <InputText
            label=""
            name="search"
            inputRef={searchInputRef}
            type={searchType === SearchType.PHONE ? "tel" : "text"}
            placeholder={getPlaceholder()}
            value={searchTerm}
            onChange={handleSearchChange}
            maxLength={searchType === SearchType.PHONE 
              ? SELL_MEDICINE_CONSTANTS.VALIDATION.PHONE_LENGTH 
              : SELL_MEDICINE_CONSTANTS.VALIDATION.SEARCH_TERM_MAX}
            className="w-full"
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="mb-6">
        {searchMessage && <p className={`mb-2 ${getMessageClass()} font-medium text-sm`}>{searchMessage}</p>}
        
        {searchType === SearchType.PHONE && results.length > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO && (
          <div className="flex justify-between items-center mb-3">
            <Button
              onClick={switchToMedicineSearch}
              variant="primary"
              size="md"
              className="text-sm"
            >
              {SELL_MEDICINE_CONSTANTS.LABELS.SEARCH_ADDITIONAL}
            </Button>
          </div>
        )}
        
        <HomeTable
          data={results}
          columns={searchCols}
          loading={loading}
          pagination={pagination}
          onPaginationChange={(page, size) => setPagination(prev => ({ ...prev, page, page_size: size }))}
        />
      </div>

      {/* Cart */}
      <Card className="mb-6" title={SELL_MEDICINE_CONSTANTS.LABELS.CART_TITLE.replace('{count}', cart.length)}>
        {cart.length > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO ? 
          <HomeTable data={cart} columns={cartCols} /> : 
          <p className="text-center text-gray-500 py-6">{SELL_MEDICINE_CONSTANTS.LABELS.CART_EMPTY}</p>
        }
      </Card>

      {/* Customer Details & Payment Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Customer Details Card */}
        <Card title={SELL_MEDICINE_CONSTANTS.LABELS.CUSTOMER_DETAILS} className="p-4 sm:p-5">
          <div className="space-y-4">
            {/* Customer Name */}
            <div>
              <InputText
                label={`${SELL_MEDICINE_CONSTANTS.LABELS.CUSTOMER_NAME}`}
                name="customer_name"
                value={customer.customer_name}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^a-zA-Z\s\.]/g, '');
                  value = value.slice(0, SELL_MEDICINE_CONSTANTS.VALIDATION.CUSTOMER_NAME_MAX);
                  setCustomer(prev => ({ ...prev, customer_name: value }));
                }}
                maxLength={SELL_MEDICINE_CONSTANTS.VALIDATION.CUSTOMER_NAME_MAX}
                placeholder="Enter customer name"
                error={errors.customer_name}
                className="w-full"
              />
            </div>

            {/* ── FIX 2: Phone field with existing-customer highlight ── */}
            <div>
              {/* Existing customer badge — shown above the field */}
              {isExistingCustomer && (
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {SELL_MEDICINE_CONSTANTS.LABELS.EXISTING_CUSTOMER}
                  </span>
                </div>
              )}
              <InputText
                label={`${SELL_MEDICINE_CONSTANTS.LABELS.PHONE}`}
                name="phone"
                type="tel"
                value={customer.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, SELL_MEDICINE_CONSTANTS.VALIDATION.PHONE_LENGTH);
                  // User is manually editing the phone — clear the existing-customer flag
                  // until the fetch completes and confirms
                  setIsExistingCustomer(false);
                  setCustomer(prev => ({ ...prev, phone: value }));
                }}
                maxLength={SELL_MEDICINE_CONSTANTS.VALIDATION.PHONE_LENGTH}
                placeholder="03XXXXXXXXX"
                error={errors.phone}
                className="w-full"
                // ── FIX 2: Green ring when existing customer is identified
                inputClassName={
                  isExistingCustomer
                    ? 'ring-2 ring-green-400 border-green-400 bg-green-50'
                    : ''
                }
              />
            </div>

            {/* Email */}
            <div>
              <InputText
                label={`${SELL_MEDICINE_CONSTANTS.LABELS.EMAIL}`}
                name="email"
                type="email"
                value={customer.email}
                onChange={(e) => {
                  const value = e.target.value.slice(0, SELL_MEDICINE_CONSTANTS.VALIDATION.EMAIL_MAX);
                  setCustomer(prev => ({ ...prev, email: value }));
                }}
                maxLength={SELL_MEDICINE_CONSTANTS.VALIDATION.EMAIL_MAX}
                placeholder="customer@example.com"
                error={errors.email}
                className="w-full"
              />
            </div>

            {/* THREE HORIZONTAL BLOCKS: Advance, Credit, Tax */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Advance Payment Block */}
              <div className={`${SELL_MEDICINE_CONSTANTS.CSS_CLASSES.ADVANCE_USED_BG} p-2 rounded-lg border border-blue-200`}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {SELL_MEDICINE_CONSTANTS.LABELS.ADVANCE_PAYMENT}
                </label>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    id="useAdvanceCheckbox"
                    checked={useAdvancePayment}
                    onChange={(e) => setUseAdvancePayment(e.target.checked)}
                    className="h-3 w-3 text-blue-600 rounded"
                  />
                  <label htmlFor="useAdvanceCheckbox" className="text-xs text-gray-700 cursor-pointer">
                    {SELL_MEDICINE_CONSTANTS.LABELS.USE_ADVANCE}
                  </label>
                </div>
                <InputText
                  label=""
                  name="advance_payment"
                  type="number"
                  value={customer.advance_payment}
                  onChange={(e) => {
                    const value = Math.max(SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO, Number(e.target.value) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO);
                    setCustomer(prev => ({ ...prev, advance_payment: value }));
                  }}
                  min={SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO}
                  step="0.01"
                  disabled={true}
                  readOnly={true}
                  className="w-full text-xs"
                  inputClassName="text-xs"
                />
                {customer.advance_payment > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO && (
                  <p className={`text-xs mt-1 ${useAdvancePayment ? 'text-blue-600' : 'text-gray-500'}`}>
                    {SELL_MEDICINE_CONSTANTS.LABELS.AVAILABLE_ADVANCE.replace('{amount}', customer.advance_payment.toFixed(2))}
                  </p>
                )}
              </div>

              {/* Credit Balance Block */}
              <div className={`${SELL_MEDICINE_CONSTANTS.CSS_CLASSES.CREDIT_BG} p-2 rounded-lg border border-purple-200`}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {SELL_MEDICINE_CONSTANTS.LABELS.CREDIT_BALANCE}
                </label>
                <div className="text-sm font-bold text-purple-700 mt-1">
                  {SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(customer.credit)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Customer credit balance</p>
              </div>

              {/* Tax Block */}
              <div className={`${SELL_MEDICINE_CONSTANTS.CSS_CLASSES.TAX_BG} p-2 rounded-lg border border-yellow-200`}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {SELL_MEDICINE_CONSTANTS.LABELS.TAX_PERCENT}
                </label>
                <InputText
                  label=""
                  name="tax"
                  type="number"
                  value={customer.tax}
                  onChange={(e) => {
                    const value = Math.min(
                      Math.max(Number(e.target.value) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO, SELL_MEDICINE_CONSTANTS.VALIDATION.TAX_MIN), 
                      SELL_MEDICINE_CONSTANTS.VALIDATION.TAX_MAX
                    );
                    setCustomer(prev => ({ ...prev, tax: value }));
                  }}
                  min={SELL_MEDICINE_CONSTANTS.VALIDATION.TAX_MIN}
                  max={SELL_MEDICINE_CONSTANTS.VALIDATION.TAX_MAX}
                  step={SELL_MEDICINE_CONSTANTS.VALIDATION.TAX_STEP}
                  placeholder="Tax %"
                  error={errors.tax}
                  className="w-full text-xs"
                  inputClassName="text-xs"
                />
                {customer.tax > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO && (
                  <p className="text-xs text-green-600 mt-1">
                    = {SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(totals.taxAmount)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Summary & Payment Card */}
        <Card title={SELL_MEDICINE_CONSTANTS.LABELS.SUMMARY_PAYMENT} className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="space-y-3 mb-6">
            {/* Totals Breakdown */}
            <div className="flex justify-between text-xs sm:text-sm">
              <span>{SELL_MEDICINE_CONSTANTS.TOTALS_LABELS.MEDICINE_SUBTOTAL}</span>
              <span>{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(totals.medicineSubtotal)}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span>{SELL_MEDICINE_CONSTANTS.TOTALS_LABELS.LOCAL_SUBTOTAL}</span>
              <span>{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(totals.localSubtotal || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO)}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span>{SELL_MEDICINE_CONSTANTS.TOTALS_LABELS.GENERAL_SUBTOTAL}</span>
              <span>{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(totals.generalSubtotal)}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm font-bold border-b pb-2">
              <span>{SELL_MEDICINE_CONSTANTS.TOTALS_LABELS.TOTAL_SUBTOTAL}</span>
              <span>{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(totals.totalSubtotal)}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span>{SELL_MEDICINE_CONSTANTS.TOTALS_LABELS.DISCOUNT.replace('{percent}', customer.discount)}</span>
              <span>{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(totals.discountAmount)}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span>{SELL_MEDICINE_CONSTANTS.TOTALS_LABELS.NET_TOTAL}</span>
              <span>{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(totals.netTotal)}</span>
            </div>
            
            {customer.tax > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO && (
              <>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span>{SELL_MEDICINE_CONSTANTS.TOTALS_LABELS.TAX.replace('{percent}', customer.tax)}</span>
                  <span>{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(totals.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-semibold text-blue-600">
                  <span>{SELL_MEDICINE_CONSTANTS.TOTALS_LABELS.TOTAL_WITH_TAX}</span>
                  <span>{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(totals.totalWithTax)}</span>
                </div>
              </>
            )}
            
            {totals.deliveryCharges > 0 && (
              <div className="flex justify-between text-xs sm:text-sm">
                <span>{SELL_MEDICINE_CONSTANTS.TOTALS_LABELS.DELIVERY_CHARGES}</span>
                <span>{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(totals.deliveryCharges)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-xs sm:text-sm font-bold border-t pt-2">
              <span>{SELL_MEDICINE_CONSTANTS.TOTALS_LABELS.GRAND_TOTAL}</span>
              <span>{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(totals.grandTotal)}</span>
            </div>
            
            {useAdvancePayment && customer.advance_payment > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO && (
              <div className={`flex justify-between text-xs sm:text-sm ${SELL_MEDICINE_CONSTANTS.CSS_CLASSES.ADVANCE_USED_BG} p-2 rounded`}>
                <span>{SELL_MEDICINE_CONSTANTS.TOTALS_LABELS.ADVANCE_USED}</span>
                <span className="text-blue-600">- {SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(totals.advanceUsed)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-xs sm:text-sm font-bold">
              <span>
                {useAdvancePayment && customer.advance_payment > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO 
                  ? SELL_MEDICINE_CONSTANTS.TOTALS_LABELS.AMOUNT_AFTER_ADVANCE
                  : SELL_MEDICINE_CONSTANTS.TOTALS_LABELS.AMOUNT_DUE}
              </span>
              <span>{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(useAdvancePayment ? totals.grandTotal - totals.advanceUsed : totals.grandTotal)}</span>
            </div>

            {/* Payment Details */}
            <div className="mt-4 space-y-3">
              {(paymentDetails.transaction_type === TransactionType.PARTIAL_PAID || 
                paymentDetails.transaction_type === TransactionType.CREDIT) && (
                <div className={`mb-2 p-2 ${SELL_MEDICINE_CONSTANTS.CSS_CLASSES.CREDIT_WARNING_BG} rounded-md`}>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-yellow-700">
                      {paymentDetails.transaction_type === TransactionType.PARTIAL_PAID 
                        ? SELL_MEDICINE_CONSTANTS.CREDIT_MESSAGES.CUSTOMER_REQUIRED_TRACKING
                        : SELL_MEDICINE_CONSTANTS.CREDIT_MESSAGES.CUSTOMER_REQUIRED_SALE}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                {/* ── Transaction Type Dropdown ── */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {SELL_MEDICINE_CONSTANTS.PAYMENT.TRANSACTION_TYPE}
                    </label>
                    <InputSelect
                      name="transaction_type"
                      value={getTransactionTypeDisplayValue()}
                      onChange={(e) => handleTransactionTypeChange(e.target.value)}
                      className="w-full text-sm"
                    >
                      <option value={TransactionType.FULLY_PAID}>{SELL_MEDICINE_CONSTANTS.PAYMENT.FULLY_PAID}</option>
                      <option value={TransactionType.PARTIAL_PAID}>{SELL_MEDICINE_CONSTANTS.PAYMENT.PARTIAL_PAID}</option>
                      <option value={TransactionType.CREDIT}>{SELL_MEDICINE_CONSTANTS.PAYMENT.CREDIT}</option>
                      <option value="home_delivery">{SELL_MEDICINE_CONSTANTS.PAYMENT.HOME_DELIVERY}</option>
                    </InputSelect>
                  </div>
                  {/* Pencil icon for editing delivery info */}
                  {isDeliveryMode && (
                    <button
                      onClick={() => setShowDeliveryPopup(true)}
                      className="mt-5 p-2 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Edit delivery info"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* ── Payment Method Dropdown — options filtered by transaction type ── */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    {SELL_MEDICINE_CONSTANTS.PAYMENT.PAYMENT_METHOD}
                  </label>
                  {paymentDetails.transaction_type === TransactionType.CREDIT ? (
                    // Credit transaction: only one option, shown as a disabled locked field
                    <InputSelect
                      name="payment_type"
                      value={PaymentMethod.CREDIT}
                      onChange={() => {}}
                      className="w-full text-sm"
                      disabled={true}
                    >
                      <option value={PaymentMethod.CREDIT}>{SELL_MEDICINE_CONSTANTS.PAYMENT_METHODS.CREDIT}</option>
                    </InputSelect>
                  ) : (
                    // Fully Paid / Partial Paid: all methods except Credit
                    <InputSelect
                      name="payment_type"
                      value={paymentDetails.payment_type}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, payment_type: e.target.value }))}
                      className="w-full text-sm"
                    >
                      <option value={PaymentMethod.CASH}>{SELL_MEDICINE_CONSTANTS.PAYMENT_METHODS.CASH}</option>
                      <option value={PaymentMethod.BANK_CARD}>{SELL_MEDICINE_CONSTANTS.PAYMENT_METHODS.BANK_CARD}</option>
                      <option value={PaymentMethod.BANK_TRANSFER}>{SELL_MEDICINE_CONSTANTS.PAYMENT_METHODS.BANK_TRANSFER}</option>
                      <option value={PaymentMethod.ADVANCE}>{SELL_MEDICINE_CONSTANTS.PAYMENT_METHODS.ADVANCE}</option>
                      <option value={PaymentMethod.MOBILE_WALLET}>{SELL_MEDICINE_CONSTANTS.PAYMENT_METHODS.MOBILE_WALLET}</option>
                    </InputSelect>
                  )}
                </div>
              </div>

              {paymentDetails.transaction_type === TransactionType.PARTIAL_PAID && (
                <div className="mb-3">
                  <div style={{ display: 'none' }}>
                    <input type="text" name="fake_username" autoComplete="off" />
                    <input type="password" name="fake_password" autoComplete="new-password" />
                    <input type="number" name="fake_amount" autoComplete="off" />
                  </div>
                  
                  <InputText
                    label={SELL_MEDICINE_CONSTANTS.PAYMENT.AMOUNT_PAID_LABEL}
                    name="partial_payment_amount"
                    type="number"
                    value={paymentDetails.amount_paid}
                    onChange={(e) => {
                      const value = Math.max(SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO, Number(e.target.value) || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO);
                      setPaymentDetails(prev => ({ ...prev, amount_paid: value }));
                    }}
                    min={SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO}
                    step="0.01"
                    placeholder={SELL_MEDICINE_CONSTANTS.PAYMENT.AMOUNT_PAID_PLACEHOLDER}
                    error={errors.amount_paid}
                    required={true}
                    autoComplete="new-password"
                    className="w-full text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {SELL_MEDICINE_CONSTANTS.PAYMENT.REMAINING_CREDIT}
                  </p>
                </div>
              )}

              {totals.creditApplied > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO && (
                <div className={`flex justify-between text-xs sm:text-sm ${SELL_MEDICINE_CONSTANTS.CSS_CLASSES.CREDIT_APPLIED_BG} p-2 rounded`}>
                  <span>{SELL_MEDICINE_CONSTANTS.TOTALS_LABELS.CREDIT_APPLIED}</span>
                  <span className="text-red-600">{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(totals.creditApplied)}</span>
                </div>
              )}

              {paymentDetails.transaction_type === TransactionType.FULLY_PAID && (
                <div className="flex justify-between text-sm sm:text-base font-bold border-t pt-2">
                  <span>{SELL_MEDICINE_CONSTANTS.TOTALS_LABELS.FINAL_AMOUNT_DUE}</span>
                  <span className="text-green-600">{SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(totals.amountDue)}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Submit Button */}
          <Button
            onClick={submitSale}
            disabled={
              loading || 
              cart.length === SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO || 
              Object.keys(errors).length > SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO ||
              ((paymentDetails.transaction_type === TransactionType.PARTIAL_PAID || 
                paymentDetails.transaction_type === TransactionType.CREDIT) && 
               (!customer.customer_name.trim() || !customer.phone.trim()))
            }
            variant="primary"
            size="lg"
            className="w-full text-sm sm:text-base"
            loading={loading}
            loadingText={SELL_MEDICINE_CONSTANTS.LABELS.PROCESSING}
          >
            {paymentDetails.transaction_type === TransactionType.FULLY_PAID 
              ? SELL_MEDICINE_CONSTANTS.PAYMENT.COMPLETE_SALE_FULLY_PAID
              : paymentDetails.transaction_type === TransactionType.PARTIAL_PAID 
                ? SELL_MEDICINE_CONSTANTS.PAYMENT.COMPLETE_SALE_PARTIAL_PAID
                : SELL_MEDICINE_CONSTANTS.PAYMENT.COMPLETE_SALE_CREDIT}
          </Button>
        </Card>
      </div>

   {/* Delivery Info Popup Modal */}
<Modal
  isOpen={showDeliveryPopup}
  onClose={() => setShowDeliveryPopup(false)}
  title={isDeliveryMode ? "Edit Delivery Information" : "Home Delivery Information"}
  size="lg"
>
  <div className="space-y-4 p-2">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {SELL_MEDICINE_CONSTANTS.LABELS.DELIVERY_ADDRESS} <span className="text-red-500">*</span>
      </label>
      <textarea
        value={deliveryInfo.address}
        onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
        rows={3}
        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3C5690] focus:border-transparent ${
          !deliveryInfo.address.trim() && deliveryInfo.address !== '' ? 'border-red-500' : ''
        }`}
        placeholder="House #, Street, City, Landmark"
      />
      {!deliveryInfo.address.trim() && (
        <p className="text-red-500 text-xs mt-1">Delivery address is required</p>
      )}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {SELL_MEDICINE_CONSTANTS.LABELS.DELIVERY_CHARGES}
      </label>
      <InputText
        type="number"
        value={deliveryInfo.charges}
        onChange={(e) => setDeliveryInfo(prev => ({ ...prev, charges: Math.max(0, Number(e.target.value) || 0) }))}
        min={0}
        step={10}
        placeholder="Enter delivery charges"
        className="w-full"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {SELL_MEDICINE_CONSTANTS.LABELS.CUSTOMER_NOTES}
      </label>
      <textarea
        value={deliveryInfo.notes}
        onChange={(e) => setDeliveryInfo(prev => ({ ...prev, notes: e.target.value }))}
        rows={2}
        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3C5690] focus:border-transparent"
        placeholder="Gate code, floor, special instructions"
      />
    </div>
    <div className="flex justify-end gap-3 pt-4">
      <Button
        onClick={() => {
          if (!deliveryInfo.address.trim()) {
            setIsDeliveryMode(false);
          }
          setShowDeliveryPopup(false);
        }}
        variant="secondary"
        size="md"
      >
        Cancel
      </Button>
      <Button
        onClick={() => {
          setIsDeliveryMode(true);
          setShowDeliveryPopup(false);
        }}
        variant="primary"
        size="md"
        disabled={!deliveryInfo.address.trim()}
      >
        {SELL_MEDICINE_CONSTANTS.LABELS.SAVE_DELIVERY}
      </Button>
    </div>
  </div>
</Modal>

      {/* Drug Details Modal */}
      <Modal
        isOpen={!!selectedDrug}
        onClose={() => setSelectedDrug(null)}
        title={selectedDrug?.name || selectedDrug?.product_name || SELL_MEDICINE_CONSTANTS.LABELS.PRODUCT_DETAILS}
        size="xl"
      >
        {selectedDrug && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 p-2 sm:p-4">
            <div className="space-y-3 text-sm sm:text-base">
              {selectedDrug.availabilities ? (
                <>
                  <p><strong>Strength:</strong> {selectedDrug.availabilities[0]?.strength || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>
                  <p><strong>Price:</strong> {SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(selectedDrug.availabilities[0]?.sale_price || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO)}</p>
                  <p><strong>Batch:</strong> {selectedDrug.availabilities[0]?.batch_code || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>
                  <p><strong>Stock:</strong> {selectedDrug.availabilities[0]?.stock || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO}</p>
                  <p><strong>Expiry:</strong> {selectedDrug.availabilities[0]?.expiry_date?.split(" ")[0] || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>
                  <p><strong>Manufacturer:</strong> {selectedDrug.availabilities[0]?.manufacturer || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>
                  <p><strong>Packing:</strong> {SALES_POINT_CONSTANTS.formatPacking(selectedDrug.availabilities[0]?.packing)}</p>
                </>
              ) : (
                <>
                  <p><strong>{selectedDrug.strength ? "Strength" : "Category"}:</strong> {selectedDrug.strength || selectedDrug.category || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>
                  <p><strong>Price:</strong> {SELL_MEDICINE_CONSTANTS.CURRENCY.FORMAT(selectedDrug.retail_price || selectedDrug.sale_price || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO)}</p>
                  <p><strong>Batch:</strong> {selectedDrug.batch_code || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>
                  <p><strong>Stock:</strong> {selectedDrug.current_stock || selectedDrug.stock || SELL_MEDICINE_CONSTANTS.DEFAULTS.ZERO}</p>
                  <p><strong>Expiry:</strong> {(selectedDrug.current_expiry || selectedDrug.expiry_date || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE)?.split(" ")[0] || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>
                  <p><strong>Manufacturer:</strong> {selectedDrug.manufacturer || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>
                  {selectedDrug.packing && <p><strong>Packing:</strong> {SALES_POINT_CONSTANTS.formatPacking(selectedDrug.packing)}</p>}
                  {selectedDrug.unit_type && <p><strong>Unit Type:</strong> {selectedDrug.unit_type || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>}
                  <p><strong>Location:</strong> {selectedDrug.location || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>
                </>
              )}
            </div>
            <div className="space-y-3 text-sm sm:text-base">
              <p><strong>Dosage:</strong> {selectedDrug.dosage || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>
              <p><strong>Uses:</strong> {selectedDrug.uses || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>
              <p className="text-orange-700"><strong>Warnings:</strong> {selectedDrug.warnings || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>
              <p className="text-red-700"><strong>Side Effects:</strong> {selectedDrug.side_effects || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Full Items Popup */}
      <Modal
        isOpen={showItemsPopup}
        onClose={() => setShowItemsPopup(false)}
        title={
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">{SELL_MEDICINE_CONSTANTS.LABELS.SOLD_ITEMS}</h2>
            <p className="text-sm sm:text-lg opacity-90">{SELL_MEDICINE_CONSTANTS.LABELS.INVOICE.replace('{invoice}', receiptData?.invoice_no || SELL_MEDICINE_CONSTANTS.DEFAULTS.NOT_AVAILABLE)}</p>
          </div>
        }
        size="xl"
        className="max-w-4xl"
      >
        <div className="max-h-[60vh] overflow-y-auto p-2 sm:p-4">
          <HomeTable data={popupItems} columns={popupColumns} />
        </div>
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => setShowItemsPopup(false)}
            variant="primary"
            size="md"
            className="w-full sm:w-auto"
          >
            {SELL_MEDICINE_CONSTANTS.LABELS.CLOSE}
          </Button>
        </div>
      </Modal>
    </div>
  );
}