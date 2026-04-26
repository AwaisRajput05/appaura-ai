import React, { useState } from 'react';
import { FiFilter, FiSave, FiCheck, FiRotateCcw, FiX } from 'react-icons/fi';

const VendorFilter = ({ onApplyFilter, onClearFilter, onClose }) => {
  const [filters, setFilters] = useState({
    vendorId: '',
    status: '',
    businessType: '',
    registrationDate: '',
    totalRevenue: '',
    location: '',
    industry: '',
    activeSince: ''
  });

  const handleInputChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApply = () => {
    onApplyFilter(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({
      vendorId: '',
      status: '',
      businessType: '',
      registrationDate: '',
      totalRevenue: '',
      location: '',
      industry: '',
      activeSince: ''
    });
    onClearFilter();
  };

  const handleSave = () => {
    // Save filter logic can be implemented here
    console.log('Filter saved:', filters);
  };

  return (
    <div className="absolute top-26 left-96 z-50 rounded-lg border-2 border-[#3069FE]">
      <div className="absolute top-10 -left-2 w-4 h-4 bg-white border-4 border-[#3069FE] border-t transform -rotate-45 z-40" />
      <div className="relative bg-white border border-gray-300 shadow-lg rounded-lg w-[620px] p-5 z-50">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Close filter popup"
        >
          <FiX size={16} aria-hidden="true" />
        </button>

        <div className="flex flex-col space-y-4">
          {/* Vendor ID */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 w-1/3">Vendor ID:</label>
            <input
              type="text"
              value={filters.vendorId}
              onChange={(e) => handleInputChange('vendorId', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm w-2/3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter Vendor ID"
            />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 w-1/3">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm w-2/3 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>

          {/* Business Type */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 w-1/3">Business Type:</label>
            <select
              value={filters.businessType}
              onChange={(e) => handleInputChange('businessType', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm w-2/3 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="Technology">Technology</option>
              <option value="Marketing">Marketing</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Consulting">Consulting</option>
              <option value="Design">Design</option>
              <option value="Software">Software</option>
            </select>
          </div>

          {/* Registration Date */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 w-1/3">Registration Date:</label>
            <input
              type="date"
              value={filters.registrationDate}
              onChange={(e) => handleInputChange('registrationDate', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm w-2/3 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Total Revenue */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 w-1/3">Total Revenue:</label>
            <input
              type="number"
              value={filters.totalRevenue}
              onChange={(e) => handleInputChange('totalRevenue', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm w-2/3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter amount"
            />
          </div>

          {/* Location */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 w-1/3">Location:</label>
            <select
              value={filters.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm w-2/3 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="Karachi">Karachi</option>
              <option value="Lahore">Lahore</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Rawalpindi">Rawalpindi</option>
              <option value="Faisalabad">Faisalabad</option>
              <option value="Multan">Multan</option>
            </select>
          </div>

          {/* Industry */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 w-1/3">Industry:</label>
            <select
              value={filters.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm w-2/3 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="IT">IT</option>
              <option value="Marketing">Marketing</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Consulting">Consulting</option>
              <option value="Design">Design</option>
              <option value="Finance">Finance</option>
              <option value="Healthcare">Healthcare</option>
            </select>
          </div>

          {/* Active Since */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 w-1/3">Active Since:</label>
            <input
              type="number"
              value={filters.activeSince}
              onChange={(e) => handleInputChange('activeSince', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm w-2/3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Days"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Save filter"
          >
            <FiSave size={14} aria-hidden="true" /> Save Filter
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-400 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              aria-label="Apply filters"
            >
              <FiCheck size={14} aria-hidden="true" /> Apply
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Clear filters"
            >
              <FiRotateCcw size={14} aria-hidden="true" /> Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorFilter; 