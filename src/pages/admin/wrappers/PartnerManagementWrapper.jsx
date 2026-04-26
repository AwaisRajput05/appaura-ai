// PartnerManagementWrapper.jsx — UNIFIED PARTNER MANAGEMENT WITH DROPDOWN
// FIXED: Auto-closes when clicking anywhere outside the dropdown (all screen sizes)
import React, { useState, useRef, useEffect } from "react";
import { 
  Users, 
  ChevronDown, 
  UserPlus,
  FileText,
  Calendar
} from "lucide-react";

// Import partner components
import CompanyCollaborators from '../companycollaborators';
import CompanyCurrent from '../companycurrent';
import CompanyHistory from '../companyreport';

const PartnerManagementDropdown = ({ selectedType, onTypeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const options = [
    { 
      id: 'collaborators', 
      label: 'Partner Management', 
      icon: Users,
      description: 'Manage partner companies',
      color: 'text-blue-600'
    },
    { 
      id: 'current', 
      label: 'Current Partner Activity', 
      icon: Calendar,
      description: 'Current month partner activity',
      color: 'text-green-600'
    },
    { 
      id: 'history', 
      label: 'Partner History', 
      icon: FileText,
      description: 'Partner activity history',
      color: 'text-purple-600'
    }
  ];

  const selectedOption = options.find(opt => opt.id === selectedType);
  const SelectedIcon = selectedOption?.icon;

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef} style={{ zIndex: 45 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-40 flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-center gap-3 truncate">
          {SelectedIcon && <SelectedIcon className={`w-5 h-5 flex-shrink-0 ${selectedOption?.color}`} />}
          <span className="font-medium text-gray-700 truncate">{selectedOption?.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 left-0 sm:left-auto mt-2 w-full sm:w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          style={{ zIndex: 47 }}
        >
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => {
                  onTypeChange(option.id);
                  setIsOpen(false);
                }}
                className={`flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  selectedType === option.id ? 'bg-blue-50' : ''
                } border-b border-gray-100 last:border-0`}
              >
                <Icon className={`w-5 h-5 ${option.color} mt-0.5 flex-shrink-0`} />
                <div className="min-w-0 flex-1">
                  <div className={`font-medium truncate ${selectedType === option.id ? 'text-blue-700' : 'text-gray-700'}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {option.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function PartnerManagementWrapper() {
  const [partnerType, setPartnerType] = useState('collaborators');

  const renderContent = () => {
    switch (partnerType) {
      case 'collaborators':
        return <CompanyCollaborators />;
      case 'current':
        return <CompanyCurrent />;
      case 'history':
        return <CompanyHistory />;
      default:
        return <CompanyCollaborators />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with right-aligned dropdown that wraps on mobile */}
      <div className="bg-white border-b border-gray-200 sticky top-0 shadow-sm" style={{ zIndex: 40 }}>
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Left side - Title and icon */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Partner Management</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Manage partners, view current activity and history</p>
              </div>
            </div>

            {/* Right side - Dropdown - full width on mobile, auto on desktop */}
            <div className="w-full sm:w-auto flex justify-end">
              <PartnerManagementDropdown selectedType={partnerType} onTypeChange={setPartnerType} />
            </div>
          </div>
        </div>
      </div>

      {/* Content Area - Renders the selected component */}
      <div>
        {renderContent()}
      </div>
    </div>
  );
}