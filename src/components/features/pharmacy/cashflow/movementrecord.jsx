// movementrecord.jsx – Add Cash Movement Records (IN/OUT Transactions)
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getToken } from "../../../../services/tokenUtils";
import apiService from "../../../../services/apiService";
import { cashBookEndpoints } from '../../../../services/endpoint/cashflow/cashEnd';
import { useAuth } from "../../../auth/hooks/useAuth";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Wallet, AlertCircle } from 'lucide-react';

import Button from "../../../../components/ui/forms/Button";
import InputText from "../../../../components/ui/forms/InputText";
import InputSelect from "../../../../components/ui/forms/InputSelect";
import InputTextarea from "../../../../components/ui/forms/InputTextarea";
import Card from "../../../../components/ui/Card";
import Modal from '../../../../components/ui/Modal';
import Alert from "../../../../components/ui/feedback/Alert";
import { CASHFLOW_MODULE_CONSTANTS } from "./cashflowconstant/cashflowconstant";

// Destructure constants for cleaner usage
const { MOVEMENT_CONSTANTS } = CASHFLOW_MODULE_CONSTANTS;

export default function MovementRecord() {
  const { user } = useAuth();

  const successTimeoutRef = useRef(null);
  const balanceIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const [currentBalances, setCurrentBalances] = useState({
    cash: 0,
    bank: 0,
    mobile: 0,
    other: 0,
    date: '',
    open_shifts_count: 0,
    closed_shifts_count: 0
  });
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState(null);
  const [openShift, setOpenShift] = useState(null);

  const [formData, setFormData] = useState({
    amount: '',
    direction: 'in',
    ledgerKey: 'cash',
    category: 'sale',
    referenceId: '',
    referenceType: 'cash',
    description: '',
    staffId: '',
    employeeId: '',
    staffName: ''
  });

  const [amountError, setAmountError] = useState(null);
  const [isAmountValid, setIsAmountValid] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const vendorId = user?.currentBranch?.vendorId || user?.vendorId || localStorage.getItem('vendorId');
  const branchId = user?.currentBranch?.id || user?.branchId || localStorage.getItem('branchId') || "main";
  const defaultStaffId = user?.staffId || user?.id || '';
  const defaultEmployeeId = user?.staffId || user?.id || '';

  // Helper function to get current balance for a ledger - defined early to avoid reference issues
  const getCurrentBalanceForLedger = useCallback((ledgerKey) => {
    return currentBalances[ledgerKey] || 0;
  }, [currentBalances]);

  // Validation function - defined early with proper dependencies
  const validateAmount = useCallback((value, direction, ledgerKey) => {
    if (direction === 'out' && value && Number(value) > 0) {
      const available = getCurrentBalanceForLedger(ledgerKey);
      if (Number(value) > available) {
        const ledgerLabel = CASHFLOW_MODULE_CONSTANTS.LEDGER_KEYS.find(l => l.value === ledgerKey)?.label || ledgerKey;
        setAmountError(`Insufficient balance. ${ledgerLabel} has PKR ${available.toFixed(2)} available.`);
        setIsAmountValid(false);
        return false;
      }
    }
    setAmountError(null);
    setIsAmountValid(true);
    return true;
  }, [getCurrentBalanceForLedger]);

  const fetchCurrentBalance = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setLoadingBalance(true);
    setBalanceError(null);

    try {
      const token = getToken();
      if (!token) {
        if (isMountedRef.current) setLoadingBalance(false);
        return;
      }

      const headers = CASHFLOW_MODULE_CONSTANTS.getAuthHeaders(token, branchId);
      const today = CASHFLOW_MODULE_CONSTANTS.getCurrentBusinessDate();
      const url = cashBookEndpoints.currentBalance(today);

      const response = await apiService.get(url, { 
        headers, 
        timeout: CASHFLOW_MODULE_CONSTANTS.API_TIMEOUT 
      });

      if (!isMountedRef.current) return;

      if (response.data?.status === "success" && response.data?.data) {
        const data = response.data.data;
        setCurrentBalances({
          cash: data.overall_current_balances?.cash || 0,
          bank: data.overall_current_balances?.bank || 0,
          mobile: data.overall_current_balances?.mobile || 0,
          other: data.overall_current_balances?.other || 0,
          date: data.date || today,
          open_shifts_count: data.open_shifts_count || 0,
          closed_shifts_count: data.closed_shifts_count || 0
        });

        if (data.open_shifts_count > 0 && data.shifts && data.shifts.length > 0) {
          const openShiftData = data.shifts.find(shift => shift.status === 'open');
          if (openShiftData) {
            setOpenShift(openShiftData);
            // Only update form data if fields are empty to avoid overwriting user input
            setFormData(prev => ({
              ...prev,
              staffId: prev.staffId || openShiftData.staff_id,
              staffName: prev.staffName || openShiftData.staff_name
            }));
          }
        } else {
          setOpenShift(null);
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      if (err.response?.status !== 400) {
        setBalanceError(MOVEMENT_CONSTANTS.ERRORS.FETCH_BALANCE_FAILED);
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingBalance(false);
      }
    }
  }, [branchId]);

  // Initial balance fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchCurrentBalance();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchCurrentBalance]);

  // Balance refresh interval
  useEffect(() => {
    balanceIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchCurrentBalance();
      }
    }, CASHFLOW_MODULE_CONSTANTS.BALANCE_REFRESH_INTERVAL);

    return () => {
      if (balanceIntervalRef.current) {
        clearInterval(balanceIntervalRef.current);
      }
    };
  }, [fetchCurrentBalance]);

  // Validation effect - now placed AFTER validateAmount is defined
  useEffect(() => {
    if (formData.amount && formData.amount !== '') {
      validateAmount(formData.amount, formData.direction, formData.ledgerKey);
    }
  }, [formData.direction, formData.ledgerKey, formData.amount, validateAmount]);

  // Success message timeout cleanup
  useEffect(() => {
    if (successMessage) {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setSuccessMessage(null);
        }
      }, CASHFLOW_MODULE_CONSTANTS.SUCCESS_TIMEOUT);
    }
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, [successMessage]);

  // Reset category when direction changes to ensure valid category selection
  useEffect(() => {
    const validCategoriesForDirection = CASHFLOW_MODULE_CONSTANTS.CATEGORY_OPTIONS.filter(
      opt => opt.direction === formData.direction
    );
    
    if (validCategoriesForDirection.length > 0) {
      const isValid = validCategoriesForDirection.some(opt => opt.value === formData.category);
      if (!isValid) {
        setFormData(prev => ({
          ...prev,
          category: validCategoriesForDirection[0].value
        }));
      }
    }
  }, [formData.direction, formData.category]);

  const handleAmountChange = (e) => {
    const { value } = e.target;
    
    // Improved decimal validation
    let cleanedValue = value.replace(/[^\d.]/g, '');
    const decimalParts = cleanedValue.split('.');
    
    // Remove extra decimal points
    if (decimalParts.length > 2) {
      cleanedValue = decimalParts[0] + '.' + decimalParts.slice(1).join('');
    }
    
    // Limit integer part to 8 digits
    if (decimalParts[0] && decimalParts[0].length > 8) {
      decimalParts[0] = decimalParts[0].slice(0, 8);
      cleanedValue = decimalParts.length > 1 ? decimalParts[0] + '.' + decimalParts[1] : decimalParts[0];
    }
    
    // Limit to 2 decimal places
    if (decimalParts.length > 1 && decimalParts[1].length > 2) {
      cleanedValue = decimalParts[0] + '.' + decimalParts[1].slice(0, 2);
    }
    
    setFormData(prev => ({ ...prev, amount: cleanedValue }));
    
    // Validate the amount
    if (cleanedValue && cleanedValue !== '') {
      validateAmount(cleanedValue, formData.direction, formData.ledgerKey);
    } else {
      setAmountError(null);
      setIsAmountValid(true);
    }

    if (fieldErrors.amount) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.amount;
        return newErrors;
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if ((name === 'staffId' || name === 'staffName') && openShift) {
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      direction: 'in',
      ledgerKey: 'cash',
      category: 'sale',
      referenceId: '',
      referenceType: 'cash',
      description: '',
      staffId: openShift?.staff_id || '',
      employeeId: '',
      staffName: openShift?.staff_name || ''
    });
    setAmountError(null);
    setIsAmountValid(true);
    setLastTransaction(null);
    setFieldErrors({});
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Don't submit if balance is loading
    if (loadingBalance) {
      setError("Please wait, balance is loading...");
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError(MOVEMENT_CONSTANTS.ERRORS.INVALID_AMOUNT);
      return;
    }

    if (formData.direction === 'out' && !isAmountValid) {
      setError(amountError || MOVEMENT_CONSTANTS.ERRORS.INVALID_OUT_AMOUNT);
      return;
    }

    if (currentBalances.open_shifts_count === 0) {
      setError("No open shift found. Please open a shift before recording transactions.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setFieldErrors({});

    try {
      const token = getToken();
      if (!token) throw new Error(MOVEMENT_CONSTANTS.ERRORS.AUTH_REQUIRED);

      const headers = CASHFLOW_MODULE_CONSTANTS.getAuthHeaders(token, branchId);
      const url = cashBookEndpoints.addMovementRecord;

      const businessDate = CASHFLOW_MODULE_CONSTANTS.getCurrentBusinessDate();
      const timestamp = CASHFLOW_MODULE_CONSTANTS.getCurrentLocalDateTime();

      const payload = {
        vendorId,
        branchId,
        staffId: formData.staffId || defaultStaffId,
        businessDate,
        amount: Number(formData.amount),
        direction: formData.direction,
        ledgerKey: formData.ledgerKey,
        category: formData.category,
        timestamp,
        referenceId: formData.referenceId || "",
        referenceType: formData.referenceType,
        employeeId: formData.employeeId || defaultEmployeeId,
        description: formData.description || `${formData.direction === 'in' ? MOVEMENT_CONSTANTS.DEFAULTS.RECEIVED : MOVEMENT_CONSTANTS.DEFAULTS.PAID} ${formData.amount} via ${formData.ledgerKey}`
      };

      const response = await apiService.post(url, payload, { headers });

      if (!isMountedRef.current) return;

      setSuccessMessage(response.data?.message || MOVEMENT_CONSTANTS.SUCCESS.TRANSACTION_RECORDED);
      setLastTransaction(response.data?.data || response.data);
      setShowPreview(true);
      
      // Refresh balances after transaction
      await fetchCurrentBalance();
      
      // Reset form after successful submission
      setFormData({
        amount: '',
        direction: 'in',
        ledgerKey: 'cash',
        category: 'sale',
        referenceId: '',
        referenceType: 'cash',
        description: '',
        staffId: openShift?.staff_id || '',
        employeeId: '',
        staffName: openShift?.staff_name || ''
      });
      setAmountError(null);
      setIsAmountValid(true);
      setFieldErrors({});
    } catch (err) {
      if (!isMountedRef.current) return;
      
      let errorMessage = MOVEMENT_CONSTANTS.ERRORS.TRANSACTION_FAILED;
      
      if (err.response?.data) {
        const responseData = err.response.data;
        
        if (responseData.error === "Validation Error" && responseData.messages) {
          const validationErrors = responseData.messages;
          const errorMessages = [];
          const fieldErrorMap = {};
          
          Object.keys(validationErrors).forEach(field => {
            const errorMsg = validationErrors[field];
            errorMessages.push(errorMsg);
            fieldErrorMap[field] = errorMsg;
          });
          
          setFieldErrors(fieldErrorMap);
          errorMessage = errorMessages.join('\n');
        } else if (responseData.detail) {
          errorMessage = responseData.detail;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  const isSubmitDisabled = () => {
    return submitting || 
           loadingBalance ||
           (formData.direction === 'out' && !isAmountValid) ||
           currentBalances.open_shifts_count === 0 ||
           !formData.amount ||
           Number(formData.amount) <= 0;
  };

  const getSubmitDisabledMessage = () => {
    if (loadingBalance) return "Loading balances, please wait...";
    if (formData.direction === 'out' && !isAmountValid) {
      return amountError || MOVEMENT_CONSTANTS.ERRORS.INVALID_OUT_AMOUNT;
    }
    if (currentBalances.open_shifts_count === 0) {
      return "No open shift found. Please open a shift first.";
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      return "Please enter a valid amount.";
    }
    return null;
  };

  // Get filtered category options based on current direction
  const getCategoryOptions = () => {
    return CASHFLOW_MODULE_CONSTANTS.CATEGORY_OPTIONS.filter(
      opt => opt.direction === formData.direction
    );
  };

  return (
    <div className="relative px-2 sm:px-4 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{MOVEMENT_CONSTANTS.UI.PAGE_TITLE}</h1>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={resetForm}
            className="inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">{MOVEMENT_CONSTANTS.UI.RESET}</span>
          </Button>
          <Button
            variant="info"
            size="sm"
            onClick={fetchCurrentBalance}
            disabled={loadingBalance}
            className="inline-flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loadingBalance ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{MOVEMENT_CONSTANTS.UI.REFRESH_BALANCE}</span>
          </Button>
        </div>
      </div>

      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          className="mb-4"
        />
      )}
      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}
      {balanceError && (
        <Alert
          variant="warning"
          message={balanceError}
          onClose={() => setBalanceError(null)}
          className="mb-4"
        />
      )}

      <Card className="mb-6" bodyClassName="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            {MOVEMENT_CONSTANTS.UI.CURRENT_BALANCES}
            {currentBalances.date && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                {MOVEMENT_CONSTANTS.UI.AS_OF} {CASHFLOW_MODULE_CONSTANTS.formatDateTime(currentBalances.date, false)}
              </span>
            )}
          </h2>
          {loadingBalance && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-xs text-gray-500">{MOVEMENT_CONSTANTS.UI.UPDATING}</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <p className="text-xs text-green-700 font-medium mb-1">{MOVEMENT_CONSTANTS.UI.CASH}</p>
            <p className="text-lg sm:text-xl font-bold text-green-800">
              PKR {currentBalances.cash.toFixed(2)}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-700 font-medium mb-1">{MOVEMENT_CONSTANTS.UI.BANK}</p>
            <p className="text-lg sm:text-xl font-bold text-blue-800">
              PKR {currentBalances.bank.toFixed(2)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <p className="text-xs text-purple-700 font-medium mb-1">{MOVEMENT_CONSTANTS.UI.MOBILE}</p>
            <p className="text-lg sm:text-xl font-bold text-purple-800">
              PKR {currentBalances.mobile.toFixed(2)}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <p className="text-xs text-orange-700 font-medium mb-1">{MOVEMENT_CONSTANTS.UI.OTHER}</p>
            <p className="text-lg sm:text-xl font-bold text-orange-800">
              PKR {currentBalances.other.toFixed(2)}
            </p>
          </div>
        </div>

        <div className={`flex gap-4 mt-3 pt-2 border-t border-gray-100 text-xs ${
          currentBalances.open_shifts_count === 0 ? 'text-red-600 font-medium' : 'text-gray-500'
        }`}>
          <span className="flex items-center gap-1">
            {currentBalances.open_shifts_count === 0 && (
              <AlertCircle className="h-3 w-3" />
            )}
            {MOVEMENT_CONSTANTS.UI.OPEN_SHIFTS}: {currentBalances.open_shifts_count}
          </span>
          <span>{MOVEMENT_CONSTANTS.UI.CLOSED_SHIFTS}: {currentBalances.closed_shifts_count}</span>
        </div>
        
        {openShift && (
          <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">{MOVEMENT_CONSTANTS.UI.ACTIVE_SHIFT}:</span> {openShift.staff_name} (ID: {openShift.staff_id}) - {MOVEMENT_CONSTANTS.UI.STARTED_AT} {CASHFLOW_MODULE_CONSTANTS.formatDateTime(openShift.started_at, true)}
            </p>
          </div>
        )}
      </Card>

      <Card className="mb-6" bodyClassName="p-4 sm:p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {MOVEMENT_CONSTANTS.UI.TRANSACTION_DIRECTION} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CASHFLOW_MODULE_CONSTANTS.DIRECTIONS.map(dir => {
                  const Icon = dir.value === 'in' ? ArrowDownCircle : ArrowUpCircle;
                  const isSelected = formData.direction === dir.value;
                  return (
                    <button
                      key={dir.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, direction: dir.value }))}
                      className={`
                        flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all
                        ${isSelected 
                          ? dir.value === 'in' 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-red-500 bg-red-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                        }
                      `}
                    >
                      <Icon className={`h-6 w-6 ${dir.value === 'in' ? 'text-green-600' : 'text-red-600'}`} />
                      <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                        {dir.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  {MOVEMENT_CONSTANTS.UI.AMOUNT} <span className="text-red-500">*</span>
                </label>
                {formData.direction === 'out' && (
                  <span className="text-xs text-gray-500">
                    {MOVEMENT_CONSTANTS.UI.AVAILABLE} {formData.ledgerKey}: <span className="font-bold text-blue-600">PKR {getCurrentBalanceForLedger(formData.ledgerKey).toFixed(2)}</span>
                  </span>
                )}
              </div>
              <InputText
                name="amount"
                type="text"
                value={formData.amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                inputClassName={`text-2xl sm:text-3xl py-4 font-bold ${
                  amountError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
              />
              {amountError && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                  {amountError}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {MOVEMENT_CONSTANTS.UI.MAX_DIGITS_HINT}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputSelect
                label={MOVEMENT_CONSTANTS.UI.LEDGER}
                name="ledgerKey"
                value={formData.ledgerKey}
                onChange={(e) => {
                  const newLedger = e.target.value;
                  setFormData(prev => ({ ...prev, ledgerKey: newLedger }));
                  if (formData.amount && formData.amount !== '') {
                    validateAmount(formData.amount, formData.direction, newLedger);
                  }
                }}
                required
                options={CASHFLOW_MODULE_CONSTANTS.LEDGER_KEYS}
              />

              <InputSelect
                label={MOVEMENT_CONSTANTS.UI.CATEGORY}
                name="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                required
                options={getCategoryOptions()}
              />

              <InputText
                label={MOVEMENT_CONSTANTS.UI.REFERENCE_ID}
                name="referenceId"
                value={formData.referenceId}
                onChange={handleInputChange}
                placeholder={MOVEMENT_CONSTANTS.PLACEHOLDERS.REFERENCE_ID}
              />

              <InputSelect
                label={MOVEMENT_CONSTANTS.UI.REFERENCE_TYPE}
                name="referenceType"
                value={formData.referenceType}
                onChange={(e) => setFormData(prev => ({ ...prev, referenceType: e.target.value }))}
                options={CASHFLOW_MODULE_CONSTANTS.REFERENCE_TYPES}
              />

              <div>
                <InputText
                  label={MOVEMENT_CONSTANTS.UI.STAFF_ID}
                  name="staffId"
                  value={formData.staffId}
                  onChange={handleInputChange}
                  placeholder={defaultStaffId || MOVEMENT_CONSTANTS.PLACEHOLDERS.STAFF_ID}
                  required
                  disabled={!!openShift}
                  readOnly={!!openShift}
                  inputClassName={`${fieldErrors.staffId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${openShift ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {fieldErrors.staffId && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.staffId}</p>
                )}
              </div>

              <div>
                <InputText
                  label={MOVEMENT_CONSTANTS.UI.STAFF_NAME}
                  name="staffName"
                  value={formData.staffName}
                  onChange={handleInputChange}
                  placeholder={MOVEMENT_CONSTANTS.PLACEHOLDERS.STAFF_NAME}
                  required
                  disabled={!!openShift}
                  readOnly={!!openShift}
                  inputClassName={`${fieldErrors.staffName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${openShift ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {fieldErrors.staffName && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.staffName}</p>
                )}
              </div>

              <div>
                <InputText
                  label={MOVEMENT_CONSTANTS.UI.EMPLOYEE_ID}
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  placeholder={defaultEmployeeId || MOVEMENT_CONSTANTS.PLACEHOLDERS.EMPLOYEE_ID}
                  inputClassName={fieldErrors.employeeId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {fieldErrors.employeeId && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.employeeId}</p>
                )}
              </div>
            </div>

            <div>
              <InputTextarea
                label={MOVEMENT_CONSTANTS.UI.DESCRIPTION}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder={`e.g., ${formData.direction === 'in' ? MOVEMENT_CONSTANTS.PLACEHOLDERS.RECEIVE_DESC : MOVEMENT_CONSTANTS.PLACEHOLDERS.PAY_DESC}`}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <div className="relative w-full sm:w-auto">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitDisabled()}
                  loading={submitting}
                  loadingText={MOVEMENT_CONSTANTS.UI.RECORDING}
                  className={`w-full sm:w-auto inline-flex items-center gap-2 ${
                    formData.direction === 'in' ? 'bg-green-600 hover:bg-green-700' : ''
                  } ${isSubmitDisabled() ? 'cursor-not-allowed opacity-50' : ''}`}
                  title={getSubmitDisabledMessage() || ''}
                >
                  {formData.direction === 'in' ? (
                    <ArrowDownCircle className="h-4 w-4" />
                  ) : (
                    <ArrowUpCircle className="h-4 w-4" />
                  )}
                  {formData.direction === 'in' ? MOVEMENT_CONSTANTS.UI.RECEIVE_MONEY : MOVEMENT_CONSTANTS.UI.PAY_MONEY}
                </Button>
                {isSubmitDisabled() && getSubmitDisabledMessage() && (
                  <p className="text-xs text-red-500 mt-1 sm:absolute sm:top-full sm:left-0 sm:mt-1 whitespace-nowrap">
                    {getSubmitDisabledMessage()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </Card>

      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={MOVEMENT_CONSTANTS.UI.TRANSACTION_STATUS}
        size="md"
      >
        <div className="p-4 sm:p-6">
          {lastTransaction && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                lastTransaction.direction === 'IN' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  {lastTransaction.direction === 'IN' ? (
                    <ArrowDownCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <ArrowUpCircle className="h-8 w-8 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm text-gray-600">{MOVEMENT_CONSTANTS.UI.AMOUNT}</p>
                    <p className="text-2xl font-bold">PKR {Number(lastTransaction.amount).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">{MOVEMENT_CONSTANTS.UI.DIRECTION}</p>
                  <p className={`font-medium ${
                    lastTransaction.direction === 'IN' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {lastTransaction.direction}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{MOVEMENT_CONSTANTS.UI.LEDGER}</p>
                  <p className="font-medium">{lastTransaction.ledger}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{MOVEMENT_CONSTANTS.UI.CATEGORY}</p>
                  <p className="font-medium">{lastTransaction.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{MOVEMENT_CONSTANTS.UI.STAFF_ID}</p>
                  <p className="font-medium">{lastTransaction.staff_id || MOVEMENT_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{MOVEMENT_CONSTANTS.UI.STAFF_NAME}</p>
                  <p className="font-medium">{lastTransaction.staff_name || openShift?.staff_name || MOVEMENT_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{MOVEMENT_CONSTANTS.UI.EMPLOYEE_ID}</p>
                  <p className="font-medium">{lastTransaction.employee_id || MOVEMENT_CONSTANTS.DEFAULTS.NOT_AVAILABLE}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{MOVEMENT_CONSTANTS.UI.MOVEMENT_TYPE}</p>
                  <p className="font-medium">{lastTransaction.movement_type}</p>
                </div>
              </div>

              {lastTransaction.description && (
                <div>
                  <p className="text-xs text-gray-500">{MOVEMENT_CONSTANTS.UI.DESCRIPTION}</p>
                  <p className="text-sm">{lastTransaction.description}</p>
                </div>
              )}

              {lastTransaction.timestamp && (
                <div>
                  <p className="text-xs text-gray-500">{MOVEMENT_CONSTANTS.UI.TIMESTAMP}</p>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                    {CASHFLOW_MODULE_CONSTANTS.formatDateTime(lastTransaction.timestamp, true)}
                  </p>

                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button
                  variant="primary"
                  onClick={() => setShowPreview(false)}
                >
                  {MOVEMENT_CONSTANTS.UI.ADD_ANOTHER}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}