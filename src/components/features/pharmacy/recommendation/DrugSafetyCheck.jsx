// DrugSafetyCheck.jsx - REFACTORED WITH CONSTANTS - FULLY RESPONSIVE
import React, { useState, useContext, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from "react-dom";
import { AuthContext } from '../../../auth/hooks/AuthContextDef';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/endpoint/recommendation/recommendationEnd';
import { getVendorChildIds } from '../../../../services/vendorUtils';
import { CheckCircle, AlertCircle } from 'lucide-react';

// Import your UI components
import Button from '../../../../components/ui/forms/Button';
import Alert from '../../../../components/ui/feedback/Alert';
import Card from '../../../../components/ui/Card';
import InputText from '../../../../components/ui/forms/InputText';

// Import constants
import { RECOMMENDATION_MODULE_CONSTANTS } from './recommendationconstants/recommendationModuleConstants';

// Extract frequently used constants
const { 
  ENUMS, 
  ERROR_MESSAGES, 
  DEFAULT_VALUES,
  getAuthHeaders,
  addBranchHeaders,
  getUserInfo,
  getBranchOptions,
  getErrorMessage,
  validateAge,
  validateDrugName 
} = RECOMMENDATION_MODULE_CONSTANTS;

// HoverTooltip Component (reusable)
const HoverTooltip = ({ text, title = "Warning" }) => {
  if (!text || text.trim() === "") return null;

  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef(null);

  const open = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  }, []);

  const words = text.trim().split(/\s+/);
  const preview = words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={open}
        onMouseLeave={close}
        className="text-red-600 hover:underline cursor-help text-xs font-medium"
      >
        {preview}
      </span>

      {isOpen && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-none p-4">
          <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 border border-red-300 max-w-2xl max-h-[80vh] overflow-y-auto pointer-events-auto">
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-center text-red-800 border-b pb-2 sm:pb-3">
              {title}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
              {text}
            </p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default function DrugSafetyCheck() {
  const { user, selectBranch } = useContext(AuthContext);
  
  // State management
  const [formData, setFormData] = useState({
    drugName: '',
    age: '',
    hasPrescription: false
  });
  
  const [safetyResult, setSafetyResult] = useState(DEFAULT_VALUES.DRUG_SAFETY_RESULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Branch state
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedChildVendorId, setSelectedChildVendorId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // Refs for cleanup
  const controllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Get user info using constants
  const { 
    currentVendorId, 
    originalBranchId, 
    isMaster, 
    currentBusinessName 
  } = useMemo(() => getUserInfo(user), [user]);

  const childVendors = useMemo(() => getVendorChildIds() || [], []);
  const branchOptions = useMemo(() => 
    getBranchOptions(user, childVendors), 
    [user, childVendors]
  );

  // Initialize branch
  useEffect(() => {
    setSelectedBranch(currentBusinessName);
    setSelectedValue('current');
    setSelectedChildVendorId('');
    setSelectedBranchId(originalBranchId);
  }, [originalBranchId, currentBusinessName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  // Clear form function
  const clearForm = useCallback(() => {
    setFormData({
      drugName: '',
      age: '',
      hasPrescription: false
    });
    setSafetyResult(DEFAULT_VALUES.DRUG_SAFETY_RESULT);
    setError(null);
    
    // Optional: Cancel any ongoing request
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  // Dynamic title - FIXED: Responsive
  const dynamicTitle = useMemo(() => {
    const branchLabel = selectedBranch || 'Current Branch';
    const isCurrent = !selectedBranch || selectedBranch === 'Current Branch';

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-800 truncate max-w-[200px] sm:max-w-full">
            Medicine Safety Check
          </h1>
        </div>
        <span className="hidden sm:inline text-gray-500">—</span>
        <span
          className={`
            inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm w-fit
            ${isCurrent
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-blue-100 text-blue-800 border border-green-300'
            }
          `}
        >
          {isCurrent ? 'Current Branch' : `Branch: ${branchLabel}`}
        </span>
      </div>
    );
  }, [selectedBranch]);

  // Form validation
  const isFormValid = useMemo(() => {
    return validateDrugName(formData.drugName) && 
           validateAge(formData.age);
  }, [formData.drugName, formData.age]);

  // Check if form has any values (for showing clear button)
  const hasFormValues = useMemo(() => {
    return formData.drugName.trim() !== '' || formData.age !== '' || formData.hasPrescription;
  }, [formData]);

  // Safety check API call
  const fetchSafetyCheck = useCallback(async (e) => {
    e.preventDefault();
    
    if (!isFormValid) {
      setError(ERROR_MESSAGES.INVALID_AGE);
      return;
    }

    // Abort previous request if exists
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setSafetyResult({
      ...DEFAULT_VALUES.DRUG_SAFETY_RESULT,
      recommendation: 'Analyzing safety...',
    });

    try {
      // Get headers using constants
      const headers = getAuthHeaders();
      addBranchHeaders(headers, selectedBranchId, selectedChildVendorId, currentVendorId);

      // Build endpoint
      const endpoint = apiEndpoints.DrugSafetyCheck(
        formData.drugName.trim(), 
        Number(formData.age), 
        formData.hasPrescription
      );

      const response = await apiService.get(endpoint, { 
        headers,
        signal: controllerRef.current.signal 
      });

      if (!isMountedRef.current) return;

      const resultData = response.data?.data;

      if (resultData && typeof resultData.is_safe === 'boolean') {
        setSafetyResult({
          isSafe: resultData.is_safe,
          recommendation: resultData.reason || response.data.message || 'Check complete.',
          warnings: Array.isArray(resultData.warnings)
            ? resultData.warnings
            : resultData.warning
            ? [resultData.warning]
            : [],
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      if (err.name === 'AbortError') return;
      
      // Use constant for error message
      const errorMsg = getErrorMessage(err) || ERROR_MESSAGES.SAFETY_CHECK_FAILED;
      setError(errorMsg);
      setSafetyResult(DEFAULT_VALUES.DRUG_SAFETY_RESULT);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [formData, selectedBranchId, selectedChildVendorId, currentVendorId, isFormValid]);

  // Handle form field changes
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle branch change
  const handleBranchChange = useCallback((value) => {
    const selectedOption = branchOptions.find(opt => opt.value === value);
    if (!selectedOption) return;

    const isCurrentBranch = value === 'current';
    const childId = isCurrentBranch ? "" : value;
    const branchLabel = selectedOption.label;

    setSelectedChildVendorId(childId);
    setSelectedValue(value);
    setSelectedBranch(branchLabel);
    setSelectedBranchId(selectedOption.branch_id);

    if (!isCurrentBranch) {
      selectBranch({
        branchId: branchLabel,
        branchName: branchLabel,
        vendorId: value,
        applicationRoles: []
      });
    } else {
      selectBranch(null);
    }
  }, [branchOptions, selectBranch]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 min-h-screen space-y-6 sm:space-y-8">
      {/* Dynamic Title with Branch Badge */}
      {dynamicTitle}

      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          action={() => setError(null)}
          actionLabel="Dismiss"
          className="mb-4 sm:mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Input Card */}
        <Card 
          title={
            <div className="flex justify-between items-center w-full">
              <span className="text-white text-sm sm:text-base lg:text-lg">Enter Medicine Details</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={clearForm}
                className="bg-gray-500 hover:bg-gray-600 text-white shadow-none px-3 py-1 text-xs sm:text-sm"
              >
                Clear
              </Button>
            </div>
          }
          subtitle={<span className="text-white opacity-90 text-xs sm:text-sm">Fill in the medicine and patient details</span>}
          headerClassName="bg-gradient-to-r from-[#30426B] via-[#3C5690] to-[#5A75C7]"
          className="h-fit"
        >
          <div className="p-4 sm:p-5 lg:p-6">
            <form onSubmit={fetchSafetyCheck} className="space-y-4 sm:space-y-5 lg:space-y-6">
              <InputText
                label="Medicine Name"
                name="drugName"
                value={formData.drugName}
                onChange={(e) => handleInputChange('drugName', e.target.value)}
                placeholder="e.g., Panadol, Amoxicillin"
                required
                maxLength={100}
                className="w-full"
                inputClassName="text-sm sm:text-base py-2 sm:py-3"
                error={formData.drugName && !validateDrugName(formData.drugName) ? "Invalid medicine name" : undefined}
              />

              <InputText
                type="number"
                label="Patient Age"
                name="age"
                value={formData.age}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 3 && Number(value) <= ENUMS.AGE_LIMITS.MAX) {
                    handleInputChange('age', value);
                  }
                }}
                min={ENUMS.AGE_LIMITS.MIN}
                max={ENUMS.AGE_LIMITS.MAX}
                placeholder={`e.g., ${ENUMS.AGE_LIMITS.DEFAULT}`}
                required
                className="w-full"
                inputClassName="text-sm sm:text-base py-2 sm:py-3"
                error={formData.age && !validateAge(formData.age) ? `Age must be between ${ENUMS.AGE_LIMITS.MIN}-${ENUMS.AGE_LIMITS.MAX}` : undefined}
              />

              <div className="flex items-center mb-4 sm:mb-5 lg:mb-6">
                <input
                  id="prescription"
                  type="checkbox"
                  checked={formData.hasPrescription}
                  onChange={(e) => handleInputChange('hasPrescription', e.target.checked)}
                  className="h-4 w-4 text-[#3C5690] focus:ring-[#3C5690] border-gray-300 rounded"
                />
                <label htmlFor="prescription" className="ml-2 sm:ml-3 block text-xs sm:text-sm text-gray-700">
                  Has valid prescription
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                loadingText="Checking Safety..."
                disabled={!isFormValid}
                className="w-full text-sm sm:text-base py-2 sm:py-3"
              >
                {!loading && (
                  <>
                    Check Safety <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </Card>

        {/* Result Card */}
        <Card 
          title={<span className="text-white text-sm sm:text-base lg:text-lg">Safety Result</span>}
          subtitle={<span className="text-white opacity-90 text-xs sm:text-sm">Analysis of medicine safety</span>}
          headerClassName="bg-gradient-to-r from-[#30426B] via-[#3C5690] to-[#5A75C7]"
          className="h-fit"
        >
          <div className="p-4 sm:p-5 lg:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-gray-600">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-b-2 border-blue-600 mb-3 sm:mb-4"></div>
                <p className="text-sm sm:text-base lg:text-lg font-medium">Processing safety data...</p>
              </div>
            ) : safetyResult.isSafe === null ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
                <p className="text-sm sm:text-base">Fill in the form and click "Check Safety"</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                <div
                  className={`
                    flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 sm:p-5 rounded-xl shadow-sm border-2 text-sm sm:text-base lg:text-lg font-medium
                    ${safetyResult.isSafe
                      ? 'bg-green-50 border-green-400 text-green-800'
                      : 'bg-red-50 border-red-400 text-red-800'
                    }
                  `}
                >
                  <span className="text-sm sm:text-base">{safetyResult.recommendation}</span>
                  <span className="text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 bg-white/50 rounded-full w-fit">
                    {safetyResult.isSafe ? 'SAFE' : 'RISK'}
                  </span>
                </div>

                {safetyResult.warnings.length > 0 && (
                  <div className="space-y-2 sm:space-y-3">
                    <p className="font-bold text-red-700 flex items-center gap-2 text-sm sm:text-base">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Warnings:
                    </p>
                    {safetyResult.warnings.map((warning, i) => (
                      <div
                        key={`warning-${i}`}
                        className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm"
                      >
                        <HoverTooltip text={warning} title={`Warning ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}