// src/components/ui/forms/InputSelect.jsx - WITH AUTO-CLOSING DROPDOWNS (No wrapper needed)
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Global registry to track all dropdown instances
const dropdownRegistry = new Map();

const InputSelect = ({
  label,
  name,
  register,
  error,
  disabled = false,
  children,
  className = "",
  inputClassName = "",
  value,
  readOnly = false,
  onChange,
  required = false,
  options: propOptions,
  placeholder = "Select an option",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const dropdownRef = useRef(null);
  const instanceId = useRef(`dropdown-${Math.random().toString(36).substr(2, 9)}`);
  
  const registerProps = register ? register(name) : {};
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(value || "");

  const effectiveValue = isControlled ? value : internalValue;

  // Function to close all other dropdowns
  const closeOtherDropdowns = (currentId) => {
    dropdownRegistry.forEach((setIsOpenCallback, id) => {
      if (id !== currentId && setIsOpenCallback) {
        setIsOpenCallback(false);
      }
    });
  };

  // Register/unregister this dropdown instance
  useEffect(() => {
    dropdownRegistry.set(instanceId.current, setIsOpen);
    
    return () => {
      dropdownRegistry.delete(instanceId.current);
    };
  }, []);

  const handleToggle = (e) => {
    e?.stopPropagation();
    
    if (disabled || readOnly) return;
    
    if (!isOpen) {
      // Close all other dropdowns before opening this one
      closeOtherDropdowns(instanceId.current);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleChange = (newValue) => {
    if (newValue === effectiveValue) {
      setIsOpen(false);
      return;
    }
    
    if (isControlled && onChange) {
      onChange({ target: { value: newValue, name } });
    } else {
      setInternalValue(newValue);
    }
    if (registerProps.onChange) {
      registerProps.onChange({ target: { value: newValue, name } });
    }
    setIsOpen(false);
  };

  // FIXED: Pass the event object to registerProps.onBlur
  const handleBlur = (event) => {
    if (registerProps.onBlur) {
      registerProps.onBlur(event);
    }
    // Directly close — onMouseDown on options prevents blur during legitimate clicks
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      
      // Calculate available space below and above
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Determine if dropdown should open upward or downward
      const shouldOpenUpward = spaceBelow < 200 && spaceAbove > spaceBelow;
      
      setDropdownStyle({
        position: 'fixed',
        top: shouldOpenUpward 
          ? rect.top - 5
          : rect.bottom,
        left: rect.left,
        width: rect.width,
        zIndex: 999999,
        backgroundColor: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        maxHeight: '15rem',
        overflowY: 'auto',
        transform: shouldOpenUpward ? 'translateY(-100%)' : 'none',
        marginTop: shouldOpenUpward ? '-5px' : '0',
      });
    }
  }, [isOpen]);

  // Handle scroll and resize events to reposition dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownStyle(prev => ({
          ...prev,
          top: rect.bottom,
          left: rect.left,
        }));
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  // Keyboard navigation (native select style)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Ignore if typing in an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Handle printable characters (letters, numbers, etc.)
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        
        const key = e.key.toLowerCase();
        
        // Parse options
        let options = [];
        if (propOptions && propOptions.length > 0) {
          options = propOptions;
        } else {
          options = React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === "option") {
              return {
                value: child.props.value,
                label: child.props.children,
                disabled: child.props.disabled
              };
            }
            return null;
          })?.filter(Boolean) || [];
        }

        // Find first valid option starting with this letter
        const matchingIndex = options.findIndex(opt => {
          const isPlaceholder = opt.value === "" || 
                               opt.label.toString().toLowerCase().includes("select");
          return !isPlaceholder && 
                 !opt.disabled && 
                 opt.label.toString().toLowerCase().startsWith(key);
        });

        if (matchingIndex !== -1) {
          // Scroll to matching option
          const optionElements = dropdownRef.current?.children;
          if (optionElements && optionElements[matchingIndex]) {
            optionElements[matchingIndex].scrollIntoView({
              block: 'nearest',
              behavior: 'smooth'
            });
            
            // Briefly highlight
            optionElements[matchingIndex].style.backgroundColor = '#E5E7EB';
            optionElements[matchingIndex].style.transition = 'background-color 0.2s';
            
            setTimeout(() => {
              if (optionElements[matchingIndex]) {
                optionElements[matchingIndex].style.backgroundColor = '';
              }
            }, 150);
          }
        }
      }

      // Handle Escape key
      if (e.key === 'Escape') {
        setIsOpen(false);
      }

      // Handle arrow keys for navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        
        const options = dropdownRef.current?.children;
        if (!options) return;
        
        // Find currently highlighted or selected option
        const currentIndex = Array.from(options).findIndex(
          opt => opt.style.backgroundColor === 'rgb(229, 231, 235)' || 
                 opt.classList.contains('bg-[#3C5690]/10')
        );
        
        let nextIndex;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, options.length - 1);
        } else {
          nextIndex = currentIndex === -1 ? options.length - 1 : Math.max(currentIndex - 1, 0);
        }
        
        // Clear all highlights
        Array.from(options).forEach(opt => {
          opt.style.backgroundColor = '';
        });
        
        // Highlight new option
        if (options[nextIndex]) {
          options[nextIndex].style.backgroundColor = '#E5E7EB';
          options[nextIndex].scrollIntoView({ block: 'nearest' });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, children, propOptions]);

  // Parse options
  let options = [];
  
  if (propOptions && propOptions.length > 0) {
    options = propOptions.map(opt => ({
      value: opt.value,
      label: opt.label,
      disabled: opt.disabled || false
    }));
  } else {
    options = React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === "option") {
        return {
          value: child.props.value,
          label: child.props.children,
          disabled: child.props.disabled
        };
      }
      return null;
    })?.filter(Boolean) || [];
  }

  const selectedOption = options.find(opt => opt.value === effectiveValue);

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
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          onBlur={handleBlur}
          disabled={disabled || readOnly}
          className={`relative w-full cursor-default rounded-lg bg-white py-3 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3C5690] focus:border-[#3C5690] disabled:opacity-50 transition-colors ${readOnly ? "bg-gray-50" : ""} ${inputClassName}`}
        >
          <span className="block truncate">
            {selectedOption?.label || placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </button>

        {isOpen && createPortal(
          <div 
            ref={dropdownRef}
            style={dropdownStyle} 
            className="py-1"
          >
            {options.map((option, index) => {
              // Check if this is a placeholder option
              const isPlaceholder = option.value === "" || 
                                   option.label.toString().toLowerCase().includes("select");
              
              return (
                <div
                  key={option.value || index}
                  onMouseDown={(e) => {
                    // Prevent button blur so the click event always fires reliably
                    // across all browsers and devices (fixes race condition with setTimeout)
                    e.preventDefault();
                  }}
                  onClick={() => {
                    if (!option.disabled && !isPlaceholder) {
                      handleChange(option.value);
                    }
                  }}
                  className={`
                    relative cursor-default select-none py-2 pl-10 pr-4
                    ${option.value === effectiveValue ? 'bg-[#3C5690]/10 font-medium' : 'font-normal'}
                    ${option.disabled || isPlaceholder ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#3C5690]/10 cursor-pointer'}
                    ${isPlaceholder ? 'text-gray-400' : ''}
                  `}
                >
                  <span className="block truncate">
                    {option.label}
                  </span>
                  {option.value === effectiveValue && !isPlaceholder && (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#3C5690]">
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
      </div>
      
      {error && <p className="text-red-600 text-sm mt-1">{error.message}</p>}
    </div>
  );
};

export default InputSelect;