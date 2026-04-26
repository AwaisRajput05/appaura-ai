import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown, Lock } from "lucide-react";
import {
  Pill, FlaskConical, HeartPulse, Package, Building2,
  Activity, FileText, Users, Calendar, AlertTriangle,
} from "lucide-react";

import MedicineList from '../FindMedicine';
import AgeRestriction from '../AgeRestriction';
import DateRange from '../DateRange';
import ExpireMedicine from '../ExpireMedicine';
import SideEffect from '../SideEffect';
import Manufacturer from '../Manufacturer';
import MedicineType from '../MedicineType';
import Ingredient from '../ingredient';
import PatientIndication from '../PatientIndication';
import PrescriptionRequire from '../PrescriptionRequire';

// ─── Permission helper (same as your other wrappers) ─────────────────────────
const getEmployeePermissions = () => {
  try {
    const p = localStorage.getItem("employeePermissions");
    if (!p) return null;
    const parsed = JSON.parse(p);
    return Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
};

const hasTabPermission = (name) => {
  const p = getEmployeePermissions();
  return p ? p.includes(name) : true;
};

const ALL_OPTIONS = [
  {
    id: "medicine-list",
    permissionName: "Medicine List",
    label: "Medicine List",
    icon: Pill,
    description: "Search medicines by name",
    color: "text-blue-600",
  },
  {
    id: "ingredient",
    permissionName: "By Formula",
    label: "By Formula",
    icon: FlaskConical,
    description: "Search by active ingredients",
    color: "text-cyan-600",
  },
  {
    id: "patient-indication",
    permissionName: "By Indication",
    label: "By Indication",
    icon: HeartPulse,
    description: "Search by patient condition",
    color: "text-teal-600",
  },
  {
    id: "medicine-type",
    permissionName: "By Form",
    label: "By Form",
    icon: Package,
    description: "Search by tablet, syrup, injection",
    color: "text-pink-600",
  },
  {
    id: "manufacturer",
    permissionName: "By Manufacturer",
    label: "By Manufacturer",
    icon: Building2,
    description: "Search medicines by manufacturer",
    color: "text-indigo-600",
  },
  {
    id: "side-effect",
    permissionName: "By Side Effects",
    label: "By Side Effects",
    icon: Activity,
    description: "Exclude medicines with side effects",
    color: "text-orange-600",
  },
  {
    id: "prescription",
    permissionName: "By Prescription",
    label: "By Prescription",
    icon: FileText,
    description: "Filter Rx/OTC medicines",
    color: "text-amber-600",
  },
  {
    id: "age-restriction",
    permissionName: "By Age",
    label: "By Age",
    icon: Users,
    description: "Filter medicines by age group",
    color: "text-green-600",
  },
  {
    id: "date-range",
    permissionName: "By Date Range",
    label: "By Date Range",
    icon: Calendar,
    description: "Search by expiry/supply/sales date",
    color: "text-purple-600",
  },
  {
    id: "expire-medicine",
    permissionName: "Expired Medicines",
    label: "Expired Medicines",
    icon: AlertTriangle,
    description: "View expired medicines",
    color: "text-red-600",
  },
];

const SearchTypeDropdown = ({ selectedType, onTypeChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Handle click outside - works on all devices
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);
  
  const selectedOption = options.find((opt) => opt.id === selectedType);
  const SelectedIcon = selectedOption?.icon;

  if (options.length <= 1) return null;

  return (
    <div className="relative w-full sm:w-auto" style={{ zIndex: 45 }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-64 flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-center gap-3 truncate">
          {SelectedIcon && <SelectedIcon className={`w-5 h-5 flex-shrink-0 ${selectedOption?.color}`} />}
          <span className="font-medium text-gray-700 truncate">{selectedOption?.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 left-0 sm:left-auto mt-2 w-full sm:w-72 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          style={{ zIndex: 47, maxHeight: "80vh", overflowY: "auto" }}
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
                className={`flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${selectedType === option.id ? "bg-blue-50" : ""}`}
              >
                <Icon className={`w-5 h-5 ${option.color} mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${selectedType === option.id ? "text-blue-700" : "text-gray-700"}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{option.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function SearchWrapper() {
  // Filter options based on permissions
  const visibleOptions = useMemo(
    () => ALL_OPTIONS.filter((o) => hasTabPermission(o.permissionName)),
    []
  );
  
  const [searchType, setSearchType] = useState(() => visibleOptions[0]?.id ?? "");

  // If no permissions, show "No Access"
  if (!visibleOptions.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Lock className="w-10 h-10 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">No Access</p>
          <p className="text-sm mt-1">Contact your admin to get access</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (searchType) {
      case "medicine-list":      return <MedicineList />;
      case "ingredient":         return <Ingredient />;
      case "patient-indication": return <PatientIndication />;
      case "medicine-type":      return <MedicineType />;
      case "manufacturer":       return <Manufacturer />;
      case "side-effect":        return <SideEffect />;
      case "prescription":       return <PrescriptionRequire />;
      case "age-restriction":    return <AgeRestriction />;
      case "date-range":         return <DateRange />;
      case "expire-medicine":    return <ExpireMedicine />;
      default:                   return <MedicineList />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 shadow-sm" style={{ zIndex: 40 }}>
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Medicine Search</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Search by multiple criteria</p>
              </div>
            </div>

            {/* Only show dropdown if more than 1 option available */}
            {visibleOptions.length > 1 && (
              <div className="w-full sm:w-auto flex justify-end">
                <SearchTypeDropdown
                  selectedType={searchType}
                  onTypeChange={setSearchType}
                  options={visibleOptions}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div>{renderContent()}</div>
    </div>
  );
}