// src/components/ui/forms/InputPhone.jsx
import React, { useState, useCallback, useEffect } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

// Validation helper
const validatePhoneNumber = (phoneValue, required = false) => {
  if (!phoneValue || phoneValue === '') {
    return required ? 'Phone number is required' : null;
  }
  
  // Remove all non-digit characters except plus sign
  const cleaned = phoneValue.replace(/[^\d+]/g, '');
  
  // Check if it's a valid phone number (7-15 digits after cleaning)
  const digitsOnly = cleaned.replace(/\+/g, '');
  if (digitsOnly.length < 7) {
    return 'Phone number must have at least 7 digits';
  }
  if (digitsOnly.length > 15) {
    return 'Phone number must have at most 15 digits';
  }
  
  return null; // Valid
};

const InputPhone = ({
  label = "Phone Number",
  name,
  value = "",
  onChange,
  error: externalError,  // This could be a string or an object with message property
  disabled = false,
  required = false,
  country = "pk",
  placeholder = "3001234567",
  className = "",
  showValidation = true,
  validationMessage = null,
}) => {
  const [internalError, setInternalError] = useState(null);
  const [touched, setTouched] = useState(false);

  // Get the error message string (handle both string and object formats)
  const getErrorMessage = (error) => {
    if (!error) return null;
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    return null;
  };

  // Get the error to display (external takes precedence)
  const displayError = getErrorMessage(externalError) || 
    (showValidation && touched ? getErrorMessage(internalError) : null);

  // Validate on value change
  useEffect(() => {
    if (showValidation && touched) {
      const error = validationMessage || validatePhoneNumber(value, required);
      setInternalError(error);
    }
  }, [value, showValidation, touched, validationMessage, required]);

  const handleChange = useCallback((phoneValue, countryData, e, formattedValue) => {
    // Mark as touched when user interacts
    setTouched(true);
    
    // Validate
    if (showValidation) {
      const error = validationMessage || validatePhoneNumber(phoneValue, required);
      setInternalError(error);
    }
    
    // Pass to parent
    if (onChange) {
      onChange(phoneValue, countryData, e, formattedValue);
    }
  }, [onChange, showValidation, validationMessage, required]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    if (showValidation) {
      const error = validationMessage || validatePhoneNumber(value, required);
      setInternalError(error);
    }
  }, [value, showValidation, validationMessage, required]);

  return (
    <div className={`w-full ${className}`}>
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-gray-800 mb-2"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <PhoneInput
        country={country}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        preferredCountries={['pk']}
        enableAreaCodes={false}
        disableDropdown={disabled}
        countryCodeEditable={false}
        inputProps={{
          name,
          id: name,
          required,
          className: `w-full py-3 px-4 pl-14 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C5690] focus:border-[#3C5690] disabled:bg-gray-50 disabled:cursor-not-allowed text-base ${
            displayError ? 'border-red-500' : 'border-gray-300'
          }`,
        }}
        containerClass="!w-full"
        inputClass="!w-full !h-auto !min-h-[44px] !text-base !pl-14 !leading-normal !border-gray-300 !rounded-lg !shadow-none !focus:shadow-none"
        buttonClass="!bg-white !border !border-r-0 !border-gray-300 !rounded-l-lg !pl-3 !pr-2 !hover:bg-gray-50 !focus:outline-none !focus:ring-2 !focus:ring-[#3C5690] !focus:border-[#3C5690]"
        dropdownClass="!max-h-60 !overflow-y-auto !text-sm !shadow-lg !border !border-gray-200 !rounded-lg !bg-white !z-50"
        searchClass="!sticky !top-0 !p-3 !border-b !border-gray-200 !bg-white !z-10"
        searchPlaceholder="Search countries..."
      />

      {displayError && (
        <p className="mt-1 text-red-600 text-sm">{displayError}</p>
      )}
    </div>
  );
};

export default InputPhone;