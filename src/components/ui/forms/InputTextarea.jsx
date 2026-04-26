// src/components/ui/forms/InputTextarea.jsx - FIXED VERSION
import React from "react";
import { Textarea } from "@headlessui/react";

const InputTextarea = ({
  label,
  name,
  register,
  error,
  disabled = false,
  placeholder = "",
  maxLength,
  rows = 3,
  className = "",
  inputClassName = "",
  value,
  readOnly = false,
  onChange,
  required = false,
}) => {
  const isControlled = value !== undefined;
  const registerProps = register ? register(name) : {};

  // FIX: Create a proper onChange handler
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
    if (registerProps.onChange) {
      registerProps.onChange(e);
    }
  };

  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-gray-800 mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <Textarea
        id={name}
        name={name}
        {...registerProps}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C5690] focus:border-[#3C5690] data-[disabled]:opacity-50 transition-colors ${
          readOnly ? "bg-gray-50 text-gray-600" : ""
        } ${inputClassName} ${error ? "border-red-500" : ""}`}
        disabled={disabled || readOnly}
        readOnly={readOnly}
        required={required}
        value={isControlled ? value : undefined}
        onChange={handleChange}
      />

      {error && <p className="text-red-600 text-sm mt-1">{error.message}</p>}
    </div>
  );
};

export default InputTextarea;