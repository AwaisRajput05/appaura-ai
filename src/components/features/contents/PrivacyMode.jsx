import React from 'react';

export default function PrivacyMode() {
  return (
    <div className="flex justify-end items-center gap-3 mb-3 p-2 bg-white rounded-lg shadow-sm">
      <label htmlFor="privacy-mode-toggle" className="text-lg font-medium text-gray-700">
        Privacy Mode
      </label>
      
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          id="privacy-mode-toggle"
          className="sr-only peer"
          aria-label="Enable privacy mode"
        />
        <div className="w-8 h-4 bg-gray-200 rounded-full peer-checked:bg-green-500 transition-colors duration-300"></div>
        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform peer-checked:translate-x-full transition-transform duration-300"></div>
      </div>
    </div>
  );
}
