import React, { useState, useMemo, useRef, useEffect } from "react";
import { Package, ChevronDown, Pill, Package2, Stethoscope, PlusCircle, Lock } from "lucide-react";
import AddMedicine from '../AddMedicine';
import AddLocal from '../addlocal';
import AddGeneral from '../addgeneral';

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
  { id: "medicine", permissionName: "Add Medicine Stock", label: "Add Medicine Stock", icon: Stethoscope, description: "Add medicines from existing list", color: "text-blue-600" },
  { id: "local",    permissionName: "Add Local Medicine", label: "Add Local Medicine", icon: Pill,        description: "Add new local medicines",         color: "text-green-600" },
  { id: "general",  permissionName: "Add General Items",  label: "Add General Items",  icon: Package2,    description: "Add general products",            color: "text-purple-600" },
];

const Dropdown = ({ selected, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Handle click outside - works on all devices
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [open]);
  
  const sel = options.find((o) => o.id === selected);
  const SelIcon = sel?.icon;
  
  return (
    <div className="relative w-full sm:w-auto" style={{ zIndex: 45 }} ref={dropdownRef}>
      <button onClick={() => setOpen(!open)} className="w-full sm:w-64 flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <div className="flex items-center gap-3 truncate">
          {SelIcon && <SelIcon className={`w-5 h-5 flex-shrink-0 ${sel?.color}`} />}
          <span className="font-medium text-gray-700 truncate">{sel?.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 left-0 sm:left-auto mt-2 w-full sm:w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ zIndex: 47 }}>
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button key={opt.id} onClick={() => { onChange(opt.id); setOpen(false); }} className={`flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${selected === opt.id ? "bg-blue-50" : ""}`}>
                <Icon className={`w-5 h-5 ${opt.color} mt-0.5 flex-shrink-0`} />
                <div>
                  <div className={`font-medium ${selected === opt.id ? "text-blue-700" : "text-gray-700"}`}>{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function AddStockWrapper() {
  const visibleOptions = useMemo(() => ALL_OPTIONS.filter((o) => hasTabPermission(o.permissionName)), []);
  const [addStockType, setAddStockType] = useState(() => visibleOptions[0]?.id ?? "");

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
    switch (addStockType) {
      case "medicine": return <AddMedicine />;
      case "local":    return <AddLocal />;
      case "general":  return <AddGeneral />;
      default:         return <AddMedicine />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 shadow-sm" style={{ zIndex: 40 }}>
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Add to Stock</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Choose what type of items you want to add</p>
              </div>
            </div>
            {visibleOptions.length > 1 && (
              <div className="w-full sm:w-auto flex justify-end">
                <Dropdown selected={addStockType} onChange={setAddStockType} options={visibleOptions} />
              </div>
            )}
          </div>
        </div>
      </div>
      <div>{renderContent()}</div>
    </div>
  );
}