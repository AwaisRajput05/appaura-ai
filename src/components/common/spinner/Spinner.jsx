// ../Spinner/Spinner.jsx
import React from 'react';

const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={`flex h-screen items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-4 border-gray-300 border-t-[#3C5690] ${sizeClasses[size]}`}></div>
    </div>
  );
};

export default Spinner;