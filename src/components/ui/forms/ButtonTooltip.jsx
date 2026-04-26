// src/components/ui/forms/ButtonTooltip.jsx
import React from "react";

const ButtonTooltip = ({ 
  children, 
  tooltipText = "", 
  position = "top",
  disabled = false,
  loading = false 
}) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  // If no tooltip text, just render children
  if (!tooltipText) return children;

  // Position classes
  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  };

  // Arrow position classes
  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 -mt-1",
    bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1",
    left: "left-full top-1/2 -translate-y-1/2 -ml-1",
    right: "right-full top-1/2 -translate-y-1/2 -mr-1",
  };

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={() => !disabled && !loading && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Your original button stays here with all its styling */}
      {children}
      
      {/* Tooltip that appears on hover */}
      {showTooltip && !disabled && !loading && (
        <div 
          className={`absolute z-50 ${positionClasses[position]}`}
        >
          <div className="relative">
            <div className="bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
              {tooltipText}
            </div>
            {/* Tooltip arrow */}
            <div 
              className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${arrowClasses[position]}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ButtonTooltip;