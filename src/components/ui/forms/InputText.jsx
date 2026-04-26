import React, { useRef, useCallback, useEffect } from "react";
import { Input as HeadlessInput } from "@headlessui/react";

const InputText = ({
  label,
  name,
  prefix,
  postfix,
  postfixAction,
  inputRef,
  type = "text",
  disabled = false,
  placeholder = "",
  maxLength = 30,
  register,
  error,
  className = "",
  inputClassName = "",
  autoComplete = "off",
  value,
  readOnly = false,
  onChange,
  onFocus,
  onKeyDown,
  required = false,
}) => {
  const localRef = useRef(null);
  const isUsingRegister = !!register;
  const isUserTyping = useRef(false); // Track if user is actively typing

  const handleChange = useCallback((e) => {
    if (type === "number") {
      const inputValue = e.target.value;
      if (inputValue.startsWith('-') || inputValue === '-') {
        e.preventDefault();
        return;
      }
    }
    
    // Mark that user is typing
    isUserTyping.current = true;
    
    if (onChange) {
      onChange(e);
    }
    
    // Reset typing flag after a short delay
    setTimeout(() => {
      isUserTyping.current = false;
    }, 100);
  }, [type, onChange]);

  const handleKeyDown = useCallback((e) => {
    if (type === "number" && (e.key === '-' || e.key === 'e')) {
      e.preventDefault();
      return;
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  }, [type, onKeyDown]);

  const registerProps = isUsingRegister ? register(name) : {};

  // CRITICAL FIX: Detect browser autofill but DON'T interfere with typing
  useEffect(() => {
    const input = localRef.current;
    if (!input) return;

    // Function to handle autofill detection
    const handleAutofill = () => {
      // SKIP if user is currently typing
      if (isUserTyping.current) return;
      
      // Only trigger if value actually changed and input is not focused
      if (input.value && input.value !== registerProps.value && document.activeElement !== input) {
        // Manually trigger onChange to update React Hook Form
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
        
        // Also trigger the register's onChange if it exists
        if (registerProps.onChange) {
          const syntheticEvent = { target: { value: input.value, name: name } };
          registerProps.onChange(syntheticEvent);
        }
      }
    };

    // Check for autofill immediately and after delays
    const timeout1 = setTimeout(handleAutofill, 50);
    const timeout2 = setTimeout(handleAutofill, 150);
    const timeout3 = setTimeout(handleAutofill, 300);
    const timeout4 = setTimeout(handleAutofill, 500);

    // Listen for animation events (Chrome autofill)
    const handleAnimationStart = (e) => {
      if (e.target === input && !isUserTyping.current) {
        handleAutofill();
      }
    };
    input.addEventListener('animationstart', handleAnimationStart);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
      input.removeEventListener('animationstart', handleAnimationStart);
    };
  }, [name, registerProps.onChange, registerProps.value]);

  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-gray-800 mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {prefix}
          </div>
        )}
        
        <HeadlessInput
          ref={(el) => {
            if (inputRef) inputRef.current = el;
            localRef.current = el;
          }}
          id={name}
          name={name} 
          {...registerProps}
          type={type}
          value={isUsingRegister ? undefined : (value ?? '')}
          onChange={isUsingRegister ? registerProps.onChange : handleChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          maxLength={maxLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled || readOnly}
          readOnly={readOnly}
          className={`block w-full ${prefix ? "pl-10" : "pl-4"} ${postfix ? "pr-12" : "pr-4"} py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C5690] focus:border-[#3C5690] data-[disabled]:bg-gray-50 data-[disabled]:cursor-not-allowed ${readOnly ? 'bg-gray-50 text-gray-600' : ''} ${inputClassName} ${error ? "border-red-500" : ""}`}
          min={type === "number" ? 0 : undefined}
        />
        
        {postfix && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-600"
            onClick={postfixAction}
          >
            {postfix}
          </button>
        )}
      </div>
      {error && <p className="text-red-600 text-sm mt-1">{error.message}</p>}
    </div>
  );
};

export default InputText;