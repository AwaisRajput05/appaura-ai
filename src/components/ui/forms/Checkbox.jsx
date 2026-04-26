// src/components/ui/forms/Checkbox.jsx
import React from 'react';
import { Switch } from '@headlessui/react';

const Checkbox = ({
  id,
  checked,
  onChange,
  disabled = false,
  label,
  className = '',
  labelClassName = '',
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <Switch
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`${
          checked ? 'bg-[#3C5690]' : 'bg-white border border-gray-300'
        } relative inline-flex h-4 w-4 items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-[#3C5690] focus:ring-offset-2 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {/* Checkmark icon */}
        {checked && (
          <svg
            className="h-3 w-3 text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </Switch>
      
      {label && (
        <label
          htmlFor={id}
          className={`ml-2 text-sm text-gray-700 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${labelClassName}`}
          onClick={() => !disabled && onChange && onChange(!checked)}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;