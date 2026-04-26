// src/components/ui/feedback/Alert.jsx
import React, { useEffect } from "react";
import { Transition } from "@headlessui/react";
import { CheckCircle, XCircle, Info } from "lucide-react";

const Alert = ({
  variant = "info", // success, error, info
  message,
  show = true,
  icon = true,
  className = "",
  onClose,
  action,
  actionLabel,
}) => {
  let baseClass = "p-4 rounded-lg border mb-4";
  let variantClass = "";
  let IconComponent = Info;

  switch (variant) {
    case "success":
      variantClass = "bg-green-50 border-green-200 text-green-800";
      break;
    case "error":
      variantClass = "bg-red-50 border-red-200 text-red-800";
      break;
    case "info":
      variantClass = "bg-blue-50 border-blue-200 text-blue-800";
      break;
    default:
      variantClass = "bg-gray-50 border-gray-200 text-gray-800";
  }

  // Auto dismiss after 10 seconds
  useEffect(() => {
    if (show && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <Transition
      show={show}
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className={`${baseClass} ${variantClass} ${className}`}>
        <div className="flex items-start">
          {icon && (
            <div className="flex-shrink-0 mt-0.5">
              <IconComponent className="h-5 w-5" />
            </div>
          )}
          <div className={`ml-3 flex-1`}>
            <p className="text-sm font-medium">{message}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
        {action && actionLabel && (
          <div className="mt-3 ml-8">
            <button
              onClick={action}
              className="text-sm font-medium hover:underline focus:outline-none"
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </Transition>
  );
};

export default Alert;