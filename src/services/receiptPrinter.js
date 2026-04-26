// receiptPrinter.js - FIXED: hyphen/underscore transaction type mismatch + all payment scenarios
// ADDED: Delivery charges support, delivery address, customer notes, order type badge

const formatLocalDateTime = (utcString) => {
  if (!utcString) return "—";

  let cleaned = utcString.trim();

  if (cleaned.includes('+00:00')) {
    cleaned = cleaned.replace('+00:00', 'Z');
  } else if (!cleaned.endsWith('Z') && !cleaned.includes('+') && !cleaned.match(/[+-]\d{2}:?\d{2}$/)) {
    cleaned = cleaned.replace(/(\.\d{3})\d*/, '$1') + 'Z';
  }

  const date = new Date(cleaned);
  if (isNaN(date.getTime())) {
    console.warn("Invalid date string received:", utcString);
    return "Invalid Date";
  }

  return date.toLocaleString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// FIXED: handles both hyphenated (partial-paid) and underscored (partial_paid) from backend
const formatPaymentMethod = (type) => {
  if (!type) return "Cash";
  const typeLower = String(type).toLowerCase();
  if (typeLower === 'advance' || typeLower === 'advance_payment') return "Advance";
  if (typeLower === 'cash') return "Cash";
  if (typeLower === 'bank_card' || typeLower === 'bankcard') return "Bank Card";
  if (typeLower === 'bank_transfer' || typeLower === 'banktransfer') return "Bank Transfer";
  if (typeLower === 'mobile_wallet' || typeLower === 'mobilewallet') return "Mobile Wallet";
  if (typeLower === 'credit') return "Credit";
  return type || "Cash";
};

// FIXED: now handles both "fully-paid" (hyphen, from DB) and "fully_paid" (underscore, from POS)
const formatTransactionType = (type) => {
  const map = {
    fully_paid:   "Fully Paid",
    "fully-paid": "Fully Paid",
    partial_paid:   "Partial Payment",
    "partial-paid": "Partial Payment",
    credit: "Credit Sale",
  };
  return map[type?.toLowerCase()] || type || "Fully Paid";
};

export const printReceipt = (data, type = "sell") => {
  if (!data) {
    console.error("No receipt data provided");
    return;
  }

  console.log("Receipt data received:", {
    payment_type: data.payment_type,
    transaction_type: data.transaction_type,
    amount_paid: data.amount_paid,
    advance_used: data.advance_used,
    due_amount: data.due_amount,
    delivery_charges: data.delivery_charges,
    delivery_address: data.delivery_address,
    order_type: data.order_type,
  });

  // === LOGO FROM LOCALSTORAGE ===
  let logoHtml = "";
  const vendorId = localStorage.getItem("vendorId");
  if (vendorId) {
    const cachedLogo = localStorage.getItem(`vendorLogo_${vendorId}`);
    if (cachedLogo && (cachedLogo.startsWith("data:image") || cachedLogo.startsWith("blob:"))) {
      logoHtml = `
        <div style="text-align: center; margin-bottom: 15px;">
          <img src="${cachedLogo}" alt="Pharmacy Logo" style="max-height: 90px; max-width: 220px; object-fit: contain;" />
        </div>
      `;
    }
  }

  // === DATE DETECTION ===
  const possibleDateFields = [
    'raw_date_time', 'raw_return_date_time', 'date_time', 'return_date_time',
    'created_at', 'timestamp', 'sale_date_time', 'return_time', 'date'
  ];
  let rawDateTime = null;
  for (const field of possibleDateFields) {
    if (data[field]) { rawDateTime = data[field]; break; }
  }
  if (!rawDateTime) {
    rawDateTime = new Date().toISOString();
    console.warn("No valid date field found. Using current time.");
  }
  const formattedDateTime = formatLocalDateTime(rawDateTime);

  // === PAYMENT DETAILS ===
  const transactionType = data.transaction_type || "fully_paid";
  const paymentMethod   = data.payment_type || "cash";
  const advanceUsed     = Number(data.advance_used || 0);
  const amountPaid      = Number(data.amount_paid  || 0);
  const creditAddedToAccount = Number(data.due_amount || data.credit || 0);

  // === DELIVERY DETAILS ===
  const deliveryCharges = Number(data.delivery_charges || 0);
  const deliveryAddress = data.delivery_address || null;
  const customerNotes = data.customer_notes || null;
  const orderType = data.order_type || "physical";

  // === AMOUNT CALCULATIONS ===
  const subtotal        = Number(data.subtotal      || 0);
  const discountPercent = Number(data.discount      || 0);
  const discountAmount  = Number(data.discount_amount || (subtotal * (discountPercent / 100)));
  const netTotal        = Number(data.net_total     || (subtotal - discountAmount));
  const taxPercent      = Number(data.tax           || 0);
  const taxAmount       = Number(data.tax_amount    || (netTotal * (taxPercent / 100)));
  const totalWithTax    = Number(data.total         || (netTotal + taxAmount));
  
  // FINAL TOTAL = Invoice Total (totalWithTax) + Delivery Charges
  const finalTotal = totalWithTax + deliveryCharges;

  const amountAfterAdvance = totalWithTax - advanceUsed;

  // FIXED: handle both hyphenated and underscored variants from the backend
  const txLower = String(transactionType).toLowerCase();
  const isFullyPaid  = txLower === "fully_paid"   || txLower === "fully-paid";
  const isPartial    = txLower === "partial_paid"  || txLower === "partial-paid";
  const isCreditSale = txLower === "credit";

  const paymentMethodLower = String(paymentMethod).toLowerCase();
  const isAdvancePayment   = paymentMethodLower === 'advance' || paymentMethodLower === 'advance_payment';

  console.log("Payment detection:", {
    transactionType,
    txLower,
    isFullyPaid,
    isPartial,
    isCreditSale,
    paymentMethod,
    isAdvancePayment,
    advanceUsed,
    amountAfterAdvance,
    amountPaid,
    creditAddedToAccount,
    deliveryCharges,
    finalTotal,
  });

  // Build the HTML
  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${type === "return" ? "Return Slip" : "Sale Receipt"}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          margin: 0;
          padding: 15px;
          background: #fff;
        }
        .receipt {
          max-width: 420px;
          margin: 0 auto;
          background: #fff;
          padding: 22px;
          border: 1px solid #ddd;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 2px dashed #ccc;
        }
        .header h2 {
          margin: 10px 0;
          font-size: 28px;
          color: #000;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .info {
          margin: 7px 0;
          font-size: 15px;
          line-height: 1.4;
        }
        .info strong {
          font-weight: bold;
          color: #000;
        }
        .info-row {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin: 7px 0;
          font-size: 15px;
          line-height: 1.4;
          flex-wrap: wrap;
        }
        .info-row span {
          white-space: nowrap;
        }
        .info-row strong {
          font-weight: bold;
          color: #000;
        }
        .delivery-section {
          margin-top: 12px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 6px;
          text-align: left;
          font-size: 12px;
          border: 1px dashed #ccc;
        }
        .delivery-section p {
          margin: 4px 0;
        }
        .delivery-section strong {
          color: #e65100;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 18px 0;
          font-size: 13px;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 6px 4px;
          text-align: left;
          vertical-align: top;
        }
        th {
          font-weight: bold;
          background-color: #f5f5f5;
        }
        .text-center { text-align: center; }
        .text-right  { text-align: right;  }

        .summary-section {
          margin-top: 16px;
          border-top: 1px dashed #ccc;
          padding-top: 14px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-size: 14px;
        }
        .summary-row.bold      { font-weight: bold; }
        .summary-row.highlight { background: #f8f9fa; padding: 4px 6px; border-radius: 4px; }
        .summary-row.delivery  { color: #e65100; font-weight: bold; background: #fff3e0; padding: 4px 6px; border-radius: 4px; }
        .summary-row.grand     {
          font-size: 17px;
          font-weight: bold;
          border-top: 2px solid #333;
          border-bottom: 2px solid #333;
          padding: 8px 0;
          margin: 10px 0;
          background: #e8f5e9;
        }

        .payment-section {
          margin-top: 14px;
          border-top: 1px dashed #aaa;
          padding-top: 12px;
        }
        .payment-section .section-title {
          font-size: 13px;
          font-weight: bold;
          color: #555;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .pay-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-size: 14px;
        }
        .pay-row.advance        { color: #1565c0; }
        .pay-row.paid           { color: #1b5e20; font-weight: bold; }
        .pay-row.credit         { color: #b71c1c; font-weight: bold; }
        .pay-row.method         { color: #555; font-size: 13px; }
        .pay-row.txtype         { color: #555; font-size: 13px; }
        .pay-row.advance-method { color: #e65100; font-weight: bold; background: #fff3e0; padding: 4px 6px; border-radius: 4px; }

        .txn-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 6px;
        }
        .txn-badge.fully-paid  { background: #e8f5e9; color: #1b5e20; border: 1px solid #a5d6a7; }
        .txn-badge.partial     { background: #fff3e0; color: #e65100; border: 1px solid #ffcc80; }
        .txn-badge.credit-sale { background: #fce4ec; color: #b71c1c; border: 1px solid #f48fb1; }
        .txn-badge.delivery    { background: #ffe0b2; color: #e65100; border: 1px solid #ffb74d; margin-left: 6px; }

        .return-badge {
          color: #000;
          font-weight: bold;
          font-size: 26px;
          text-align: center;
          margin: 15px 0;
          padding: 8px;
          background-color: #fff3cd;
          border: 1px solid #ffc107;
        }
        .discount-col {
          width: 70px;
          text-align: center;
          font-size: 11px;
        }
        .discount-none { color: #999; }
        .footer {
          text-align: center;
          margin-top: 28px;
          font-size: 13px;
          color: #555;
          line-height: 1.5;
          border-top: 1px dashed #ccc;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="receipt">

        <!-- HEADER -->
        <div class="header">
          ${logoHtml}
          <h2>${type === "return" ? "RETURN SLIP" : "SALE RECEIPT"}</h2>

          <!-- Invoice No and Cashier in one row -->
          <div class="info-row">
            <span>Invoice: <strong>${data.invoice_no || "N/A"}</strong></span>
            <span>Cashier: <strong>${data.cashier_name || "Staff"}</strong></span>
          </div>

          ${type === "return"
            ? `<div class="info">Original Invoice: <strong>${data.returned_invoice_no || data.invoice_no || "N/A"}</strong></div>`
            : ""}
          <div class="info">Date &amp; Time: <strong>${formattedDateTime}</strong></div>

          <!-- Customer Name and Phone in one row (only if at least one exists) -->
          ${(data.customer_name || data.phone) ? `
          <div class="info-row">
            ${data.customer_name ? `<span>Customer: <strong>${data.customer_name}</strong></span>` : ""}
            ${data.phone         ? `<span>Phone: <strong>${data.phone}</strong></span>` : ""}
          </div>
          ` : ""}

          <div style="margin-top:8px;">
            <span class="txn-badge ${isCreditSale ? 'credit-sale' : isPartial ? 'partial' : 'fully-paid'}">
              ${formatTransactionType(transactionType)}
            </span>
            ${orderType === "online" ? `<span class="txn-badge delivery">🚚 HOME DELIVERY</span>` : `<span class="txn-badge">🏪 STORE PICKUP</span>`}
          </div>
        </div>

        ${type === "return" ? '<div class="return-badge">RETURN ACCEPTED</div>' : ""}

        <!-- DELIVERY SECTION (only for online orders) -->
        ${orderType === "online" && deliveryAddress ? `
        <div class="delivery-section">
          <p><strong>📍 Delivery Address:</strong><br/>${deliveryAddress}</p>
          ${customerNotes ? `<p><strong>📝 Notes:</strong> ${customerNotes}</p>` : ""}
          ${deliveryCharges > 0 ? `<p><strong>💰 Delivery Charges:</strong> Rs ${deliveryCharges.toFixed(2)}</p>` : "<p><strong>💰 Delivery Charges:</strong> Free</p>"}
        </div>
        ` : ""}

        <!-- ITEMS TABLE -->
        <table>
          <thead>
            <tr>
            <th style="width:45%;">Item</th>
<th style="width:15%;" class="text-center">Qty</th>
<th style="width:20%;" class="text-right">Price</th>
<th style="width:20%;" class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
  `;

  const drugs = Array.isArray(data.drug_details) ? data.drug_details : [];
  let subtotalCalc = 0;

  if (drugs.length === 0) {
    html += `<tr><td colspan="4" class="text-center" style="padding:20px;color:#999;">No items found</td></tr>`;
  } else {
    drugs.forEach(drug => {
      const name         = (drug.name || drug.drug_name || "Unknown Item").trim();
      const strength     = drug.strength ? ` ${drug.strength}` : "";
      const price        = Number(drug.sale_price || drug.retail_price || drug.price || 0);
      const qty          = Number(drug.quantity || drug.qty || 0);
      const itemSubtotal = price * qty;
      subtotalCalc      += itemSubtotal;

      // General / local items get no discount
      const isNonMedicine = drug.category === "general" ||
                            drug.category === "local"   ||
                            drug.item_type === "general"||
                            drug.item_type === "local"  ||
                            drug.is_general;
      const discPct = isNonMedicine ? 0 : Number(drug.discount_percent ?? discountPercent);
      const discAmt = itemSubtotal * (discPct / 100);
      const itemTotal = itemSubtotal - discAmt;

      html += `
  <tr>
    <td style="font-size:12px;">${name}${strength}</td>
    <td class="text-center">${qty}</td>
    <td class="text-right">Rs${price.toFixed(2)}</td>
    <td class="text-right">Rs${itemTotal.toFixed(2)}</td>
  </tr>
`;
    });
  }

  html += `</tbody></table>`;

  // ── FINANCIAL SUMMARY (with separate delivery charges) ──
  html += `
    <div class="summary-section">

      <div class="summary-row">
        <span>Subtotal:</span>
        <span>Rs${subtotal.toFixed(2)}</span>
      </div>

      <div class="summary-row">
        <span>Discount (${discountPercent}% on medicines):</span>
        <span>- Rs${discountAmount.toFixed(2)}</span>
      </div>

      <div class="summary-row bold highlight">
        <span>Net Total:</span>
        <span>Rs${netTotal.toFixed(2)}</span>
      </div>

      ${taxPercent > 0 ? `
      <div class="summary-row" style="color:#c2185b;">
        <span>Tax (${taxPercent}% on net total):</span>
        <span>+ Rs${taxAmount.toFixed(2)}</span>
      </div>
      <div class="summary-row bold">
        <span>Invoice Total (with Tax):</span>
        <span>Rs${totalWithTax.toFixed(2)}</span>
      </div>
      ` : `
      <div class="summary-row bold">
        <span>Invoice Total:</span>
        <span>Rs${totalWithTax.toFixed(2)}</span>
      </div>
      `}

      ${deliveryCharges > 0 ? `
      <div class="summary-row delivery">
        <span>➕ Delivery Charges:</span>
        <span>+ Rs${deliveryCharges.toFixed(2)}</span>
      </div>
      ` : ""}

      <div class="summary-row grand">
        <span>${deliveryCharges > 0 ? "GRAND TOTAL (incl. delivery)" : "GRAND TOTAL"}:</span>
        <span>Rs${finalTotal.toFixed(2)}</span>
      </div>

    </div>
  `;

  // ── PAYMENT BREAKDOWN ──
  html += `
    <div class="payment-section">
      <div class="section-title">Payment Breakdown</div>
  `;

  // Advance used (always shown if > 0)
  if (advanceUsed > 0) {
    html += `
      <div class="pay-row advance">
        <span>Advance Payment Used:</span>
        <span>- Rs${advanceUsed.toFixed(2)}</span>
      </div>
      <div class="pay-row advance bold">
        <span>Amount After Advance:</span>
        <span>Rs${amountAfterAdvance.toFixed(2)}</span>
      </div>
    `;
  }

  // Payment method line
  if (isAdvancePayment) {
    html += `
      <div class="pay-row advance-method">
        <span>Paid via Advance Balance:</span>
        <span>Rs${amountAfterAdvance.toFixed(2)}</span>
      </div>
    `;
  } else if (isFullyPaid) {
    // Fully paid with cash/card: show how much the customer actually handed over
    const cashPaid = advanceUsed > 0 ? amountAfterAdvance : amountPaid || amountAfterAdvance;
    html += `
      <div class="pay-row paid">
        <span>Amount Paid (${formatPaymentMethod(paymentMethod)}):</span>
        <span>Rs${cashPaid.toFixed(2)}</span>
      </div>
    `;
  } else if (isPartial) {
    html += `
      <div class="pay-row paid">
        <span>Amount Paid (${formatPaymentMethod(paymentMethod)}):</span>
        <span>Rs${amountPaid.toFixed(2)}</span>
      </div>
    `;
  } else if (isCreditSale) {
    html += `
      <div class="pay-row" style="color:#999;">
        <span>Amount Paid:</span>
        <span>Rs 0.00</span>
      </div>
    `;
  }

  // Credit / due amount
  if (creditAddedToAccount > 0 && !isAdvancePayment) {
    html += `
      <div class="pay-row credit">
        <span>${isPartial ? 'Remaining Added to Credit:' : 'Full Amount Added to Credit:'}</span>
        <span>Rs${creditAddedToAccount.toFixed(2)}</span>
      </div>
    `;
  }

  // Footer payment meta
  html += `
      <div class="pay-row method" style="margin-top:10px; border-top:1px dashed #ddd; padding-top:8px;">
        <span>Payment Method:</span>
        <span>${formatPaymentMethod(paymentMethod)}</span>
      </div>
      <div class="pay-row txtype">
        <span>Transaction Type:</span>
        <span>${formatTransactionType(transactionType)}</span>
      </div>
    </div>
  `;

  // ── FOOTER ──
  html += `
        <div class="footer">
          <p>Thank you for your trust!</p>
          <p>Powered by <strong>App Aura</strong></p>
          ${taxPercent > 0 ? `<div class="note" style="font-size:11px;color:#777;font-style:italic;margin-top:10px;"><p>Tax applied on net total after discount</p></div>` : ''}
          ${deliveryCharges > 0 ? `<div class="note" style="font-size:11px;color:#777;margin-top:5px;"><p>Delivery charges are separate from invoice total</p></div>` : ''}
        </div>

      </div>
    </body>
    </html>
  `;

  // ── PRINT WINDOW ──
  const printWin = window.open("", "_blank", "width=600,height=900");
  if (!printWin) {
    alert("Please allow popups to print receipt");
    return;
  }

  printWin.document.write(html);
  printWin.document.close();
  printWin.focus();

  printWin.onload = () => {
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 600);
  };
};