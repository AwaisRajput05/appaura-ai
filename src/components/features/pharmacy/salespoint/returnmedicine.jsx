// ReturnMedicine.jsx - REFACTORED WITH CONSTANTS - FULLY RESPONSIVE
// MODIFICATION: Moved Print Receipt button to top (same as SellMedicine.jsx)
import React, { useState, useEffect, useContext, useCallback, useRef, useMemo} from "react";

// Custom Components & Services
import { AuthContext } from "../../../auth/hooks/AuthContextDef";
import HomeTable from "../../../common/table/postable";
import HeaderWithSort from "../../../common/table/components/TableHeaderWithSort";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { apiEndpoints } from "../../../../services/endpoint/salespoint/salespointend";
import { printReceipt } from "../../../../services/receiptPrinter";
import Button from "../../../../components/ui/forms/Button";
import Alert from "../../../../components/ui/feedback/Alert";
import Card from "../../../../components/ui/Card";
import InputText from "../../../../components/ui/forms/InputText";

// Constants
import { 
  SALES_POINT_CONSTANTS
} from '././salescosntant/salesPointConstants';

// Types
const RETURN_STATUS = {
  INITIAL: 'initial',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
} ;

// Main Component
export default function ReturnMedicine() {
  // Context
  const { user } = useContext(AuthContext);
  
  // Refs
  const abortControllerRef = useRef(null);
  
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });
  const [foundInvoice, setFoundInvoice] = useState(null);
  
  // New state for search-specific error
  const [searchError, setSearchError] = useState(null);

  // Constants from User
  const vendorId = user?.currentBranch?.vendorId || user?.vendorId || user?.userId || '';
  const branchId = user?.currentBranch?.id || user?.branchId || localStorage.getItem('branchId') || '';

  // Search Invoice - Modified to only trigger with exactly 6 digits
  const searchInvoice = useCallback(async () => {
    const invoice_no = searchTerm?.trim();
    
    // Only proceed if exactly 6 digits are entered
    if (!invoice_no || !/^\d{6}$/.test(invoice_no)) {
      setResults([]);
      setFoundInvoice(null);
      setError(null);
      setSearchError(null);
      setPagination(prev => ({ ...prev, total: 0 }));
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      setSearchError(null);
      
      const token = getToken();
      const endpoint = apiEndpoints.searchInvoiceByNumber(
        invoice_no, 
        pagination.page, 
        pagination.page_size
      );

      // Use Constants for Headers
      const headers = SALES_POINT_CONSTANTS.getAuthHeaders(token, vendorId);
      headers[SALES_POINT_CONSTANTS.HEADER_KEYS.USER_BRANCH_ID] = branchId;

      const { data } = await apiService.get(endpoint, {
        headers,
        signal: controller.signal,
      });

      const invoicesList = data?.data || [];

      if (!Array.isArray(invoicesList) || invoicesList.length === 0) {
        setResults([]);
        setFoundInvoice(null);
        // Set search-specific error instead of global error
        setSearchError(SALES_POINT_CONSTANTS.getInvoiceError(new Error("Invoice not found"), invoice_no));
        setPagination(prev => ({ ...prev, total: 0 }));
        return;
      }

      const mapped = [];
      invoicesList.forEach((invoice) => {
        if (Array.isArray(invoice.drug_details)) {
          invoice.drug_details.forEach((drug, j) => {
            const uniqueId = `${invoice.invoice_no}-${drug.product_id}-${drug.batch_code}-${j}`;
            mapped.push({
              id: uniqueId,
              product_id: drug.product_id,
              batch_code: drug.batch_code,
              drug_name: drug.name || "N/A",
              strength: drug.strength || "",
              sale_price: Number(drug.sale_price || 0),
              stock: Number(drug.quantity || 0),
              line_total: Number(drug.line_total || 0),
              invoice_no: invoice.invoice_no,
              __raw_invoice: invoice,
            });
          });
        }
      });

      setResults(mapped);
      
      // FIXED: Properly set foundInvoice with amount_paid from the response
      const invoiceData = invoicesList[0];
      setFoundInvoice({
        ...invoiceData,
        // Ensure amount_paid is properly captured from the API response
        amount_paid: invoiceData.amount_paid || 0,
        displayTotal: invoiceData.amount_paid || invoiceData.total
      });
      
      setSearchError(null); // Clear search error on success
      setPagination(prev => ({
        ...prev,
        total: data?.pagination?.total_records || mapped.length || 0,
      }));

      setCart([]);
    } catch (err) {
      if (err.name === "AbortError") return;
      setResults([]);
      setFoundInvoice(null);
      // Set search-specific error for API errors
      setSearchError(SALES_POINT_CONSTANTS.getInvoiceError(err, searchTerm));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.page, pagination.page_size, vendorId, branchId]);

  // Debounced Search - Modified to only trigger when exactly 6 digits
  useEffect(() => {
    const invoice_no = searchTerm?.trim();
    // Only set up timer if exactly 6 digits are entered
    if (invoice_no && /^\d{6}$/.test(invoice_no)) {
      const timer = setTimeout(() => searchInvoice(), 500);
      return () => clearTimeout(timer);
    }
    // If not exactly 6 digits, clear results immediately
    setResults([]);
    setFoundInvoice(null);
    setSearchError(null);
    return undefined;
  }, [searchInvoice, searchTerm]);

  // Add to Cart
  const addToCart = useCallback((drug) => {
    if (drug.stock <= 0) return;

    setCart(prev => {
      const exists = prev.find(x => x.id === drug.id);
      if (exists) {
        const newQty = exists.qty + 1;
        const cappedQty = Math.min(newQty, drug.stock);
        if (cappedQty <= exists.qty) return prev;

        return prev.map(x =>
          x.id === drug.id
            ? { ...x, qty: cappedQty, total: cappedQty * x.sale_price }
            : x
        );
      }

      return [...prev, {
        ...drug,
        qty: 1,
        total: drug.sale_price
      }];
    });
  }, []);

 // Update Quantity - FIXED
const updateQty = useCallback((id, qty) => {
  const numQty = Number(qty);
  if (isNaN(numQty) || numQty < 1) return;
  
  setCart(prev => {
    const drug = prev.find(x => x.id === id);
    if (!drug) return prev;
    
    return prev.map(x =>
      x.id === id
        ? { 
            ...x, 
            qty: Math.min(numQty, x.stock), 
            total: Math.min(numQty, x.stock) * x.sale_price 
          }
        : x
    );
  });
}, []); 

// Remove Item - FIXED
const removeItem = useCallback((id) => {
  setCart(prev => prev.filter(x => x.id !== id));
}, []);
  // Calculate Total
  const total = useMemo(() => 
    cart.reduce((sum, x) => sum + x.total, 0),
    [cart]
  );

  // Process Return
  const processReturn = useCallback(async () => {
    if (!foundInvoice || cart.length === 0) return;

    const drugs_to_return = cart.map(item => ({
      product_id: item.product_id,
      batch_code: item.batch_code,
      drug_name: item.drug_name,
      strength: item.strength,
      quantity: item.qty,
    }));

    const payload = {
      returned_invoice_no: foundInvoice.invoice_no,
      vendor_id: vendorId,
      branch_id: branchId,
      drugs_to_return,
    };

    try {
      setLoading(true);
      const token = getToken();

      const headers = SALES_POINT_CONSTANTS.getAuthHeaders(token, vendorId);
      headers[SALES_POINT_CONSTANTS.HEADER_KEYS.USER_BRANCH_ID] = branchId;

      const response = await apiService.post(apiEndpoints.processReturn, payload, { headers });

      setReceiptData(response.data?.data || null);
      setSuccess(`Return processed successfully! Ref: ${response.data?.data?.invoice_no || ""}`);

      // Reset
      setCart([]);
      setResults([]);
      setFoundInvoice(null);
      setSearchTerm("");
      setPagination(prev => ({ ...prev, total: 0 }));
      setSearchError(null); // Clear search error on success
    } catch (err) {
      setError(err.response?.data?.messages?.["drugsToReturn[0].drugName"] || SALES_POINT_CONSTANTS.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [foundInvoice, cart, vendorId, branchId]);

  // Search Columns
  const searchCols = useMemo(() => [
    { 
      accessorKey: "drug_name", 
      header: ({ column }) => <HeaderWithSort column={column} title="Medicine Name" />, 
      cell: ({ row }) => <div className="font-medium text-sm sm:text-base">{row.original.drug_name}</div> 
    },
    { 
      accessorKey: "strength", 
      header: ({ column }) => <HeaderWithSort column={column} title="Strength" />, 
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.strength}</div> 
    },
    { 
      accessorKey: "sale_price", 
      header: ({ column }) => <HeaderWithSort column={column} title="Price (₨)" />, 
      cell: ({ row }) => <div className="text-xs sm:text-sm">₨ {Number(row.original.sale_price || 0).toFixed(2)}</div> 
    },
    { 
      accessorKey: "stock", 
      header: ({ column }) => <HeaderWithSort column={column} title="Sold Qty" />, 
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.stock}</div> 
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const drug = row.original;
        const inCart = cart.find(x => x.id === drug.id);
        if (inCart) {
          return <span className="text-green-600 font-bold text-lg sm:text-xl">✓</span>;
        }
        return (
          <Button
            onClick={() => addToCart(drug)}
            disabled={drug.stock === 0 || loading}
            variant={drug.stock > 0 ? "primary" : "secondary"}
            size="sm"
            className={`${drug.stock > 0 ? '' : 'cursor-not-allowed'} text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2`}
          >
            Add
          </Button>
        );
      },
    },
  ], [cart, loading, addToCart]);

// Cart Columns with Quantity Editor - FIXED
const CartQuantityCell = React.memo(({ item, updateQty, removeItem }) => {
  const [editingQty, setEditingQty] = useState(item.qty.toString());

  // Sync with item.qty changes
  useEffect(() => {
    setEditingQty(item.qty.toString());
  }, [item.qty]);

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*$/.test(value)) {
      setEditingQty(value);
    }
  };

  const handleBlur = () => {
    let num = parseInt(editingQty || "0", 10);
    if (isNaN(num) || num < 1) {
      num = 1;
    }
    const cappedNum = Math.min(num, item.stock);
    updateQty(item.id, cappedNum);
  };

  const onIncrease = () => {
    if (item.qty >= item.stock) return;
    updateQty(item.id, item.qty + 1);
  };

  const onDecrease = () => {
    if (item.qty <= 1) {
      removeItem(item.id);
      return;
    }
    updateQty(item.id, item.qty - 1);
  };

  return (
    <div className="flex items-center gap-1">
      <button 
        onClick={onDecrease} 
        className="px-1.5 sm:px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm sm:text-base"
        disabled={item.qty <= 0}
        type="button"
      >
        -
      </button>
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
        className="w-10 sm:w-14 border rounded px-1 sm:px-2 py-1 text-center text-sm sm:text-base focus:ring-2 focus:ring-[#3C5690] font-medium"
      />
      <button 
        onClick={onIncrease} 
        className="px-1.5 sm:px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base"
        disabled={item.qty >= item.stock}
        type="button"
      >
        +
      </button>
    </div>
  );
});

CartQuantityCell.displayName = 'CartQuantityCell';

  const cartCols = useMemo(() => [
    { accessorKey: "drug_name", header: "Drug", cell: ({ row }) => <div className="text-sm sm:text-base">{row.original.drug_name}</div> },
    { accessorKey: "strength", header: "Strength", cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.strength}</div> },
    { 
      accessorKey: "sale_price", 
      header: "Price", 
      cell: ({ row }) => <span className="text-xs sm:text-sm">₨ {row.original.sale_price.toFixed(2)}</span> 
    },
    {
      accessorKey: "qty",
      header: "Qty",
      cell: ({ row }) => <CartQuantityCell item={row.original} updateQty={updateQty} removeItem={removeItem} />
    },
    { 
      accessorKey: "total", 
      header: "Total", 
      cell: ({ row }) => <span className="text-xs sm:text-sm font-medium">₨ {row.original.total.toFixed(2)}</span> 
    },
    { 
      accessorKey: "remove", 
      header: "", 
      cell: ({ row }) => (
        <button 
          onClick={() => removeItem(row.original.id)} 
          className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium"
        >
          Remove
        </button>
      ) 
    },
  ], [updateQty, removeItem]);

  return (
    <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-md w-full">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Point of Sale — Return</h1>

      {/* Success Message + Print Button - MOVED TO TOP (same as SellMedicine.jsx) */}
      {success && (
        <div className="mb-6">
          <Alert 
            variant="success" 
            message={success}
            className="mb-4"
            onClose={() => setSuccess(null)}
          />
          
          {/* Print Receipt Button - Now appears right after success message at the top */}
          {receiptData && (
            <div className="flex justify-center mb-6">
              <Button
                onClick={() => printReceipt(receiptData, "return")}
                variant="primary"
                size="md"
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                Print Return Receipt
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert 
          variant="error" 
          message={error}
          className="mb-4 sm:mb-6"
          onClose={() => setError(null)}
        />
      )}

      {/* Search Input with Error */}
      <Card className="mb-4 sm:mb-6 p-4 sm:p-5">
        <InputText
          label="Search Invoice"
          name="invoiceSearch"
          type="text"
          inputMode="numeric" 
          value={searchTerm}     
          onChange={(e) => {
            const value = e.target.value;
            // Only allow numeric input
            if (value === "" || /^\d*$/.test(value)) {
              setSearchTerm(value);
              // Clear search error when user starts typing
              if (searchError) setSearchError(null);
            }
          }}
          placeholder="Enter 6-digit invoice number..."
          maxLength={6}
          className="mb-0 w-full"
          inputClassName="text-sm sm:text-base py-2 sm:py-3"
          error={searchError}
          helperText="Please enter exactly 6 digits"
        />
        
        {/* If InputText doesn't support error prop, show error manually below */}
        {searchError && (
          <div className="mt-2 text-xs sm:text-sm text-red-600 bg-red-50 p-2 sm:p-3 rounded border border-red-200">
            {searchError}
          </div>
        )}
      </Card>

      {/* Invoice Info - FIXED: Now correctly shows amount_paid */}
      {foundInvoice && (
        <div className="mb-4 sm:mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="font-semibold text-gray-700">
              Invoice: <span className="text-blue-600">{foundInvoice.invoice_no}</span>
            </div>
            <div className="font-semibold text-gray-700">
              Amount Paid: <span className="text-green-600 font-bold">
                ₨ {(foundInvoice.amount_paid || 0).toFixed(2)}
              </span>
            </div>
            <div className="font-semibold text-gray-700">
              Total Amount: <span className="text-gray-800">
                ₨ {(foundInvoice.total || 0).toFixed(2)}
              </span>
            </div>
            <div className="font-semibold text-gray-700">
              Due Amount: <span className="text-red-600 font-bold">
                ₨ {(foundInvoice.due_amount || (foundInvoice.total - (foundInvoice.amount_paid || 0))).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="mb-4 sm:mb-6 overflow-x-auto">
        <HomeTable
          data={results}
          columns={searchCols}
          loading={loading}
          pagination={pagination}
          onPaginationChange={(page, size) => setPagination(prev => ({ ...prev, page, page_size: size }))}
        />
      </div>

      {/* Cart */}
      <Card title={`Return Cart (${cart.length} items)`} className="mb-4 sm:mb-6">
        <div className="overflow-x-auto">
          {cart.length > 0 ? (
            <HomeTable data={cart} columns={cartCols} />
          ) : (
            <p className="text-center text-gray-500 py-4 sm:py-6 text-sm sm:text-base">No items selected for return</p>
          )}
        </div>
      </Card>

      {/* Action Section */}
      <Card className="p-4 sm:p-5">
        <div className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Total Return Amount: ₨ {total.toFixed(2)}</div>
        <Button
          onClick={processReturn}
          disabled={loading || cart.length === 0 || !foundInvoice}
          variant="primary"
          size="lg"
          className="w-full text-sm sm:text-base py-3 sm:py-4"
          loading={loading}
          loadingText="Processing..."
        >
          Process Return
        </Button>
      </Card>
    </div>
  );
}