// src/components/ui/forms/InputCheckbox.jsx - Version 2 (Better)
import React from "react";

const InputCheckbox = ({
  label,
  name,
  register,
  error,
  disabled = false,
  required = false,
  checked = false,
  onChange,
  readOnly = false,
  className = "",
}) => {
  // Determine which props to use
  const checkboxProps = {};
  
  if (register && typeof register === 'function') {
    // Use React Hook Form
    const regProps = register(name, { required });
    checkboxProps.ref = regProps.ref;
    checkboxProps.name = regProps.name;
    checkboxProps.onChange = regProps.onChange;
    checkboxProps.onBlur = regProps.onBlur;
    checkboxProps.defaultChecked = checked;
  } else {
    // Use manual state management
    checkboxProps.checked = checked;
    checkboxProps.onChange = onChange;
    checkboxProps.name = name;
  }

  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <input
          id={name}
          type="checkbox"
          {...checkboxProps}
          disabled={disabled || readOnly}
          readOnly={readOnly}
          className={`
            w-5 h-5 rounded border-gray-300 text-[#3C5690] 
            focus:ring-[#3C5690] focus:ring-2 focus:ring-offset-2
            ${disabled || readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        />
      </div>

      <div className="ml-3 text-sm">
        <label
          htmlFor={name}
          className={`font-medium text-gray-700 ${
            disabled || readOnly ? 'opacity-70' : ''
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {error && (
          <p className="mt-1 text-red-600 text-sm">{error.message}</p>
        )}
      </div>
    </div>
  );
};

export default InputCheckbox;