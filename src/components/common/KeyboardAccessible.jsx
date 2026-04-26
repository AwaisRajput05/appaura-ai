// src/components/common/KeyboardAccessible.jsx
import React from 'react';
export default function KeyboardAccessible({ children, onAction, ...props }) {
  // Wrap any element (button, div, etc.) to make it keyboard-friendly
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAction?.(e);
    } // Add arrow key support if needed (e.g., for lists/menus)
  };
  return (
    <div
      tabIndex={0} // Make focusable
      role="button" // ARIA for accessibility
      onKeyDown={handleKeyDown}
      className="outline-none focus:ring-2 focus:ring-blue-500" // Visual focus indicator
      {...props}
    >
      {children}
    </div>
  );
}
