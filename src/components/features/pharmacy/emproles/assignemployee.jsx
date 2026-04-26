//assignemployee.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import HomeTable from '../../../common/table/Table';
import HeaderWithSort from '../../../common/table/components/TableHeaderWithSort';
import { getToken } from '../../../../services/tokenUtils';
import apiService from '../../../../services/apiService';
import { employeeApiEndpoints } from '../../../../services/endpoint/emproles/rolesend';
import { useAuth } from '../../../auth/hooks/useAuth';
import {
  Info, Plus, Pencil, KeyRound, ShieldCheck, MailCheck,
  Eye, EyeOff, RefreshCw, Ban, FileText, Search,
} from 'lucide-react';
import Button from '../../../../components/ui/forms/Button';
import ButtonTooltip from '../../../../components/ui/forms/ButtonTooltip';
import Alert from '../../../../components/ui/feedback/Alert';
import Card from '../../../../components/ui/Card';
import Modal from '../../../../components/ui/Modal';
import { SALES_MODULE_CONSTANTS } from "../sales/salesconstants/salesModuleConstants";
import InputPhone from '../../../../components/ui/forms/InputPhone';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

const getErrorMessage = (err) =>
  err.response?.data?.message ||
  err.response?.data?.error ||
  err.message ||
  'An unexpected error occurred';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat(navigator.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }).format(new Date(dateStr));
  } catch {
    return '—';
  }
};

const LIMITS = {
  name: 30,
  email: 100,
  address: 100,
  password: 64,
  phone: 13,
};

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// Extract roles with their file names (full objects)
function extractRoleObjects(res) {
  const d = res?.data?.data ?? res?.data ?? res;
  if (d && Array.isArray(d.globalRoles)) {
    const globalRoles = d.globalRoles.map((role) => ({
      name: role.pharmaRoleName,
      files: role.fileNames.map((f) => f.fileName),
      noteMap: role.fileNames.reduce((acc, f) => { acc[f.fileName] = f.note; return acc; }, {}),
    }));
    const customRoles = (d.customRoles || []).map((role) => ({
      name: role.pharmaRoleName,
      files: role.fileNames.map((f) => f.fileName),
      noteMap: role.fileNames.reduce((acc, f) => { acc[f.fileName] = f.note; return acc; }, {}),
    }));
    return { globalRoles, customRoles };
  }
  return { globalRoles: [], customRoles: [] };
}

const getWordPreview = (text, maxWords = 2) => {
  if (!text?.trim()) return '';
  const words = text.trim().split(/\s+/);
  return words.length > maxWords ? words.slice(0, maxWords).join(' ') + '…' : text;
};

// Loader Component
const Loader = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center py-16 px-6">
    <div className="text-center">
      <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  </div>
);

// HoverTooltip (unchanged)
const HoverTooltip = ({ preview, full, title = "Details" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef(null);

  const handleEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const handleLeave = () => {
    timerRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className="text-sm text-gray-600 hover:text-gray-800 hover:underline cursor-help font-medium transition-colors"
      >
        {preview}
      </span>

      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-lg w-[90%] mx-4 max-h-[85vh] overflow-y-auto pointer-events-auto">
              <h3 className="font-bold text-lg mb-4 text-gray-800 border-b border-gray-200 pb-3 text-center">{title}</h3>
              <div className="text-gray-800 font-medium leading-relaxed whitespace-pre-line text-left">
                {full.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0">→ {line.trim()}</p>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

// CharLimitInput with autofill prevention and phone number validation
const CharLimitInput = ({ label, name, value, onChange, error, required, placeholder, maxLength, type = 'text', readOnly, disabled, className }) => {
  const inputRef = useRef(null);
  const length = value?.length || 0;
  const nearLimit = (maxLength - length) <= 10;

  const handleFocus = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.removeAttribute('readonly');
      if (type === 'email') {
        inputRef.current.setAttribute('autocomplete', 'off');
      }
    }
  }, [type]);

  const handlePhoneChange = useCallback((e) => {
    const inputValue = e.target.value;
    const phoneRegex = /^[0-9+\-\s()]*$/;
    if (phoneRegex.test(inputValue) || inputValue === '') {
      onChange(e);
    }
  }, [onChange]);

  const handleNameChange = useCallback((e) => {
    const inputValue = e.target.value;
    const nameRegex = /^[A-Za-z\s]*$/;
    if (nameRegex.test(inputValue) || inputValue === '') {
      onChange(e);
    }
  }, [onChange]);

  const handleTextChange = useCallback((e) => {
    onChange(e);
  }, [onChange]);

  let handleChange = handleTextChange;
  if (type === 'tel' || name === 'phoneNo') {
    handleChange = handlePhoneChange;
  } else if (name === 'name') {
    handleChange = handleNameChange;
  }

  const inputType = name === 'phoneNo' ? 'tel' : type;

  return (
    <div className={`space-y-1 ${className || ''}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-gray-800">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {maxLength && length > 0 && (
            <span className={`text-xs ${nearLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
              {length}/{maxLength}
            </span>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type={inputType}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        readOnly={type === 'email' ? true : readOnly}
        onFocus={handleFocus}
        autoComplete="off"
        data-form-type="other"
        {...(inputType === 'tel' && {
          pattern: "[0-9+\-\s()]+",
          inputMode: "numeric",
        })}
        {...(name === 'name' && {
          pattern: "[A-Za-z\\s]+",
          title: "Only letters and spaces are allowed",
        })}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C5690] caret-slate-900 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${(readOnly || disabled) ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
      />
      {error?.message && <p className="text-red-600 text-xs mt-1">{error.message}</p>}
    </div>
  );
};

// PasswordInput with strong autofill prevention
const PasswordInput = ({ label, name, value, onChange, error, required, placeholder, className }) => {
  const [show, setShow] = useState(false);
  const inputRef = useRef(null);
  const length = value?.length || 0;
  const nearLimit = (LIMITS.password - length) <= 10;

  const handleFocus = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.removeAttribute('readonly');
      inputRef.current.setAttribute('autocomplete', 'new-password');
    }
  }, []);

  return (
    <div className={`space-y-1 ${className || ''}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-gray-800">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {length > 0 && (
            <span className={`text-xs ${nearLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
              {length}/{LIMITS.password}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={LIMITS.password}
          readOnly={true}
          onFocus={handleFocus}
          autoComplete="new-password"
          data-form-type="other"
          className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C5690] caret-slate-900 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error?.message && <p className="text-red-600 text-xs mt-1">{error.message}</p>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PharmaRoleSelector - side-by-side with search bars
// ─────────────────────────────────────────────────────────────────────────────
const PharmaRoleSelector = ({ selectedRoles, onToggle, globalRoles, customRoles, loading, error, onRetry }) => {
  const [globalSearch, setGlobalSearch] = useState('');
  const [customSearch, setCustomSearch] = useState('');
  const [tooltip, setTooltip] = useState({ visible: false, content: [], top: 0, left: 0, targetKey: null });
  const hoverTimerRef = useRef(null);

  const showTooltip = (key, files, rect) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setTooltip({
      visible: true,
      content: files,
      top: rect.top - 10,
      left: rect.left + rect.width / 2,
      targetKey: key,
    });
  };

  const hideTooltip = () => {
    hoverTimerRef.current = setTimeout(() => {
      setTooltip(prev => ({ ...prev, visible: false, targetKey: null }));
    }, 200);
  };

  const cancelHide = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  };

  const getFileNamesDisplay = (files) => {
    if (!files.length) return 'No files assigned';
    const preview = files.slice(0, 2).join(', ');
    return files.length > 2 ? `${preview}... (+${files.length - 2})` : preview;
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const filteredGlobal = useMemo(() => {
    if (!globalSearch.trim()) return globalRoles;
    return globalRoles.filter(role =>
      role.name.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [globalRoles, globalSearch]);

  const filteredCustom = useMemo(() => {
    if (!customSearch.trim()) return customRoles;
    return customRoles.filter(role =>
      role.name.toLowerCase().includes(customSearch.toLowerCase())
    );
  }, [customRoles, customSearch]);

  if (loading) return <Loader message="Loading roles..." />;
  if (error) return (
    <div className="border border-red-200 bg-red-50 rounded-lg p-3 flex items-center justify-between">
      <p className="text-sm text-red-600">{error}</p>
      {onRetry && <button onClick={onRetry} className="ml-2 text-red-500 hover:text-red-700 flex items-center gap-1 text-xs underline"><RefreshCw className="w-3 h-3" /> Retry</button>}
    </div>
  );

  const renderRoleColumn = (title, roles, badgeColor, searchValue, setSearch, filteredRoles) => (
    <div className="flex-1 min-w-0 border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-3">
        <input
          type="text"
          placeholder={`Search ${title.toLowerCase()}...`}
          value={searchValue}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C5690]"
        />
        <div className="max-h-64 overflow-y-auto space-y-1">
          {filteredRoles.length === 0 ? (
            <div className="p-3 text-center text-gray-500 text-sm">No roles found</div>
          ) : (
            filteredRoles.map((role) => (
              <div
                key={role.name}
                className="relative"
                onMouseEnter={(e) => {
                  if (role.files.length) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    showTooltip(role.name, role.files, rect);
                  }
                }}
                onMouseLeave={hideTooltip}
              >
                <label className="flex items-start gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.name)}
                    onChange={() => onToggle(role.name)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800">{role.name.replace(/_/g, ' ')}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${badgeColor}`}>
                        {title === 'Global Roles' ? 'Global' : 'Custom'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {role.files.length ? `📄 ${getFileNamesDisplay(role.files)}` : '🚫 No files'}
                    </p>
                  </div>
                </label>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-4">
        {renderRoleColumn('Global Roles', globalRoles, 'bg-blue-100 text-blue-700', globalSearch, setGlobalSearch, filteredGlobal)}
        {renderRoleColumn('Custom Roles', customRoles, 'bg-purple-100 text-purple-700', customSearch, setCustomSearch, filteredCustom)}
      </div>
      <p className="text-xs text-gray-400">Selected: {selectedRoles.length} role(s)</p>

      {tooltip.visible && tooltip.content.length > 0 && createPortal(
        <div
          className="fixed z-[10000] bg-white text-gray-800 text-sm rounded-lg shadow-xl border border-gray-200 p-3 max-w-xs pointer-events-auto"
          style={{
            top: tooltip.top,
            left: tooltip.left,
            transform: 'translate(-50%, -100%)',
            marginBottom: '8px',
          }}
          onMouseEnter={cancelHide}
          onMouseLeave={hideTooltip}
        >
          <div className="font-semibold mb-2 text-xs text-gray-500 border-b border-gray-100 pb-1">Files in this role:</div>
          <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {tooltip.content.map((file, idx) => (
              <li key={idx} className="text-xs text-gray-700 break-words">{file}</li>
            ))}
          </ul>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white border-r border-b border-gray-200"></div>
        </div>,
        document.body
      )}
    </div>
  );
};

// FileNameSelector (simple checkbox list)
const FileNameSelector = ({ selectedFileNames, onToggle, availableModules, loading, error, onRetry, title }) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return availableModules;
    return availableModules.filter((m) => m.fileName.toLowerCase().includes(search.toLowerCase()));
  }, [availableModules, search]);

  if (loading) return <Loader message={`Loading ${title || 'modules'}...`} />;
  if (error) return (
    <div className="border border-red-200 bg-red-50 rounded-lg p-3 flex items-center justify-between">
      <p className="text-sm text-red-600">{error}</p>
      {onRetry && <button onClick={onRetry} className="ml-2 text-red-500 hover:text-red-700 flex items-center gap-1 text-xs underline"><RefreshCw className="w-3 h-3" /> Retry</button>}
    </div>
  );

  return (
    <div className="space-y-1.5">
      <input
        type="text"
        placeholder="Search modules…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C5690]"
      />
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-center text-gray-500 text-sm">No modules found</div>
          ) : (
            filtered.map((mod) => (
              <label key={mod.fileName} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                <input
                  type="checkbox"
                  checked={selectedFileNames.includes(mod.fileName)}
                  onChange={() => onToggle(mod.fileName)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{mod.fileName}</p>
                  {mod.note && <p className="text-xs text-gray-400 truncate">{mod.note}</p>}
                </div>
              </label>
            ))
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400">Selected: {selectedFileNames.length} module(s)</p>
    </div>
  );
};

// PermissionsViewerModal (updated to show pharmaRoles)
const PermissionsViewerModal = ({ isOpen, onClose, employee, permissions, loading, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFiles, setExpandedFiles] = useState(new Set());

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setExpandedFiles(new Set());
    }
  }, [isOpen]);

  const toggleFileDetails = (fileName) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileName)) {
        next.delete(fileName);
      } else {
        next.add(fileName);
      }
      return next;
    });
  };

  const filteredPermissions = useMemo(() => {
    if (!permissions?.fileInfo) return [];
    if (!searchTerm.trim()) return permissions.fileInfo;
    return permissions.fileInfo.filter((file) =>
      file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [permissions, searchTerm]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Permissions — ${employee?.name || ''}`} size="lg">
      <div className="flex flex-col" style={{ maxHeight: 'calc(85vh - 64px)' }}>
        {loading ? (
          <Loader message="Loading permissions..." />
        ) : error ? (
          <div className="p-4 sm:p-6">
            <Alert variant="error" message={error} />
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-5 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search modules…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C5690]"
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Employee</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{employee?.name}</p>
                  </div>
                  <div className="sm:col-span-1">
                    <p className="text-xs text-gray-400 mb-0.5">Email</p>
                    <p className="text-sm text-gray-700 truncate">{employee?.emailAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Total Modules</p>
                    <p className="text-sm font-semibold text-blue-600">
                      {permissions?.fileInfo?.length ?? 0} modules
                    </p>
                  </div>
                </div>
              </div>

              {permissions?.pharmaRoles && permissions.pharmaRoles.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
                    Pharma Roles
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {permissions.pharmaRoles.map((role, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {role.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-100 border border-gray-200 rounded-t-lg px-4 py-2 -mb-px">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Accessible Modules
                  {searchTerm && ` — ${filteredPermissions.length} result${filteredPermissions.length !== 1 ? 's' : ''}`}
                  {!searchTerm && ` (${permissions?.fileInfo?.length ?? 0})`}
                </p>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto border border-gray-200 mx-4 sm:mx-6 rounded-b-lg">
              {filteredPermissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <FileText className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm font-medium">No modules found</p>
                  {searchTerm && (
                    <p className="text-gray-400 text-xs mt-1">Try a different search term</p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredPermissions.map((file, index) => (
                    <div key={index} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-100">
                          <FileText className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-800 break-all">{file.fileName}</p>
                            {file.note && (
                              <button
                                onClick={() => toggleFileDetails(file.fileName)}
                                className="flex-shrink-0 text-gray-400 hover:text-blue-500 transition-colors focus:outline-none"
                                title="Toggle additional details"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {expandedFiles.has(file.fileName) && file.note && (
                            <div className="mt-2 p-2.5 bg-blue-50 rounded-md border border-blue-100">
                              <p className="text-xs font-medium text-blue-700 mb-1">Note:</p>
                              <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">{file.note}</p>
                            </div>
                          )}
                        </div>
                        <span className="flex-shrink-0 text-xs text-gray-300 font-mono self-center">#{index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-100 bg-white">
              <p className="text-xs text-gray-400">
                Showing {filteredPermissions.length} of {permissions?.fileInfo?.length ?? 0} modules
              </p>
              <Button variant="secondary" onClick={onClose} className="text-sm">Close</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function EmployeeManagement() {
  useAuth();
  const businessName = localStorage.getItem('businessName') || '';
  const controllerRef = useRef(null);
  const successTimerRef = useRef(null);
  const emailCheckTimerRef = useRef(null);

  const [employees, setEmployees] = useState([]);
  // ✅ FIXED: Use API-friendly pagination state (1-based page, page_size)
  const [pagination, setPagination] = useState({ 
    page: 1,  
    page_size: 10,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({ 
    status: '', 
    search: '', 
    fromDate: '', 
    toDate: '', 
    page: 1,
    page_size: 10 
  });
  const [globalRoleObjects, setGlobalRoleObjects] = useState([]);
  const [customRoleObjects, setCustomRoleObjects] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState(null);

  const [globalModules, setGlobalModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesError, setModulesError] = useState(null);

  const [modal, setModal] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [loadingPermissionsForManage, setLoadingPermissionsForManage] = useState(false);
  const [currentlyAssignedFileNames, setCurrentlyAssignedFileNames] = useState([]);

  // Email availability states for create modal
  const [emailAvailability, setEmailAvailability] = useState({
    isChecking: false,
    isAvailable: false,
    error: null,
    checkedEmail: ''
  });

  const [employeeForm, setEmployeeForm] = useState({
    name: '', masterBusinessName: businessName, emailAddress: '',
    password: '', address: '', phoneNo: '', pharmaRoles: [], fileNames: [],
  });
  const [employeeFormErrors, setEmployeeFormErrors] = useState({});
  const [passwordForm, setPasswordForm] = useState({ newPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [permissionsForm, setPermissionsForm] = useState({
    mode: 'PHARMA_ROLE_UPDATE', pharmaRoles: [], addFileNames: [], removeFileNames: [],
  });

  const [confirmModal, setConfirmModal] = useState(null);

  const [permissionsViewer, setPermissionsViewer] = useState({
    isOpen: false,
    employee: null,
    permissions: null,
    loading: false,
    error: null,
  });

  // Auto-clear alerts
  useEffect(() => {
    if (!successMessage) return;
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMessage(null), 5000);
    return () => clearTimeout(successTimerRef.current);
  }, [successMessage]);

  useEffect(() => { if (modalSuccess) { const t = setTimeout(() => setModalSuccess(null), 5000); return () => clearTimeout(t); } }, [modalSuccess]);
  useEffect(() => { if (modalError) { const t = setTimeout(() => setModalError(null), 8000); return () => clearTimeout(t); } }, [modalError]);

 // Email availability check function
const checkEmailAvailability = useCallback(async (email) => {
  // Clear previous timer
  if (emailCheckTimerRef.current) {
    clearTimeout(emailCheckTimerRef.current);
  }

  // Reset availability if email is empty or invalid
  if (!email || !isValidEmail(email)) {
    setEmailAvailability({
      isChecking: false,
      isAvailable: false,
      error: null,
      checkedEmail: ''
    });
    return;
  }

  // Debounce the API call
  emailCheckTimerRef.current = setTimeout(async () => {
    setEmailAvailability(prev => ({ ...prev, isChecking: true, error: null }));
    
    try {
      const token = getToken();
      const url = employeeApiEndpoints.emailcheck(email);
      const response = await apiService.get(url, { 
        headers: getAuthHeaders(token), 
        timeout: 10000 
      });
      
      // Backend returns: 
      // true = email already in use (NOT available)
      // false = email is available
      const isEmailTaken = response?.data === true || 
                          response?.data?.data === true ||
                          response?.data?.exists === true;
      
      // Email is available if backend returns false
      const isAvailable = !isEmailTaken;
      
      setEmailAvailability({
        isChecking: false,
        isAvailable: isAvailable,
        error: isAvailable ? null : 'Email is already in use',
        checkedEmail: email
      });
    } catch (err) {
      console.error('Email check error:', err);
      // On error, assume email is not available to be safe
      setEmailAvailability({
        isChecking: false,
        isAvailable: false,
        error: err.response?.data?.message || 'Failed to check email availability',
        checkedEmail: email
      });
    }
  }, 500); // 500ms debounce
}, []);
  // Effect to trigger email check when email changes in create mode
  useEffect(() => {
    if (modal === 'create' && employeeForm.emailAddress) {
      checkEmailAvailability(employeeForm.emailAddress);
    } else {
      // Reset email availability when not in create mode or email is empty
      setEmailAvailability({
        isChecking: false,
        isAvailable: false,
        error: null,
        checkedEmail: ''
      });
    }
  }, [modal, employeeForm.emailAddress, checkEmailAvailability]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (emailCheckTimerRef.current) {
        clearTimeout(emailCheckTimerRef.current);
      }
    };
  }, []);

  // ✅ FIXED: fetchEmployees uses filters state correctly
  const fetchEmployees = useCallback(async (f = filters) => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      setLoading(true); setError(null);
      const token = getToken();
      if (!token) { setLoading(false); return; }
      const res = await apiService.get(
        employeeApiEndpoints.getEmployees(f.status, f.search, f.fromDate, f.toDate, f.page, f.page_size),
        { headers: getAuthHeaders(token), signal: controller.signal, timeout: 30000 }
      );
      setEmployees(res?.data?.data || []);
      
      const paginationData = res?.data?.pagination || {};
      const page = paginationData.page || 1;
      const pageSize = paginationData.page_size || 10;
      const totalRecords = paginationData.total_records || 0;
      const totalPages = paginationData.total_pages || Math.ceil(totalRecords / pageSize);
      
      setPagination({
        page: page,
        page_size: pageSize,
        total: totalRecords,
        totalPages: totalPages
      });
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      setError(getErrorMessage(err));
    } finally {
      if (controllerRef.current === controller) setLoading(false);
    }
  }, [filters]);

  const fetchPharmaRoles = useCallback(async () => {
    setRolesLoading(true); setRolesError(null);
    try {
      const token = getToken();
      const url = `${employeeApiEndpoints.getPharmaRoles('all')}`;
      const res = await apiService.get(url, { headers: getAuthHeaders(token), timeout: 30000 });
      const { globalRoles, customRoles } = extractRoleObjects(res);
      setGlobalRoleObjects(globalRoles);
      setCustomRoleObjects(customRoles);
    } catch (err) {
      setRolesError(getErrorMessage(err));
    } finally {
      setRolesLoading(false);
    }
  }, []);

  const fetchGlobalModules = useCallback(async () => {
    setModulesLoading(true); setModulesError(null);
    try {
      const token = getToken();
      const res = await apiService.get(employeeApiEndpoints.getGlobalModules(), { headers: getAuthHeaders(token), timeout: 30000 });
      const raw = res?.data?.data || [];
      const normalised = Array.isArray(raw)
        ? raw.map((m) => typeof m === 'string' ? { fileName: m } : { fileName: m.fileName ?? m.name ?? String(m), note: m.note ?? null })
        : [];
      setGlobalModules(normalised);
    } catch (err) {
      setModulesError(getErrorMessage(err));
    } finally {
      setModulesLoading(false);
    }
  }, []);

  const fetchEmployeePermissions = useCallback(async (employeeId) => {
    setPermissionsViewer(prev => ({ ...prev, loading: true, error: null }));
    try {
      const token = getToken();
      const url = employeeApiEndpoints.getEmployeePermissions(employeeId, false, "all");
      const res = await apiService.get(url, { headers: getAuthHeaders(token), timeout: 30000 });
      setPermissionsViewer(prev => ({
        ...prev,
        permissions: res?.data?.data || { fileInfo: [] },
        loading: false,
      }));
    } catch (err) {
      setPermissionsViewer(prev => ({ ...prev, error: getErrorMessage(err), loading: false }));
    }
  }, []);

  const fetchEmployeePermissionsForManage = useCallback(async (employeeId) => {
    setLoadingPermissionsForManage(true);
    try {
      const token = getToken();
      const url = employeeApiEndpoints.getEmployeePermissions(employeeId, false, "all");
      const res = await apiService.get(url, { headers: getAuthHeaders(token), timeout: 30000 });
      const permissionsData = res?.data?.data || { fileInfo: [] };
      
      const currentRoles = permissionsData.pharmaRoles || [];
      const currentFileNames = (permissionsData.fileInfo || []).map(f => f.fileName);
      
      setCurrentlyAssignedFileNames(currentFileNames);
      
      setPermissionsForm(prev => ({
        ...prev,
        pharmaRoles: currentRoles,
        addFileNames: [],
        removeFileNames: []
      }));
      
      return { currentRoles, currentFileNames };
    } catch (err) {
      setModalError(getErrorMessage(err));
      return null;
    } finally {
      setLoadingPermissionsForManage(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    return () => { if (controllerRef.current) controllerRef.current.abort(); };
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value, page: 1 };
      fetchEmployees(next);
      return next;
    });
  }, [fetchEmployees]);

  // ✅ FIXED: This matches HomeTable's expectation: onPaginationChange(page, pageSize)
  const handlePaginationChange = useCallback((page, pageSize) => {
    setFilters(prev => {
      const next = { 
        ...prev, 
        page: page, 
        page_size: pageSize 
      };
      fetchEmployees(next);
      return next;
    });
  }, [fetchEmployees]);

  // ✅ Transform pagination for HomeTable (it expects pageIndex and pageSize)
  const tablePagination = useMemo(() => ({
    page: pagination.page,      // HomeTable expects 'page' for server-side
    page_size: pagination.page_size,
    total: pagination.total,
    totalPages: pagination.totalPages
  }), [pagination]);

  const openStatusConfirm = useCallback((emp) => {
    const targetStatus = emp.status === 'APPROVED' ? 'BLOCKED' : 'APPROVED';
    setConfirmModal({ employee: emp, targetStatus, loading: false, error: '' });
  }, []);

  const handleConfirmStatus = useCallback(async () => {
    if (!confirmModal) return;
    const { employee, targetStatus } = confirmModal;
    setConfirmModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const token = getToken();
      await apiService.post(
        employeeApiEndpoints.saveEmployee(employee.id),
        { status: targetStatus },
        { headers: getAuthHeaders(token) }
      );
      setSuccessMessage(`Employee successfully ${targetStatus === 'BLOCKED' ? 'blocked' : 'activated'}`);
      setConfirmModal(null);
      fetchEmployees();
    } catch (err) {
      setConfirmModal((prev) => ({ ...prev, loading: false, error: getErrorMessage(err) }));
    }
  }, [confirmModal, fetchEmployees]);

  const closeModal = useCallback(() => {
    setModal(null); setSelectedEmployee(null); setModalSuccess(null); setModalError(null); setConfirmModal(null);
    setEmployeeForm({ name: '', masterBusinessName: businessName, emailAddress: '', password: '', address: '', phoneNo: '', pharmaRoles: [], fileNames: [] });
    setEmployeeFormErrors({});
    setPasswordForm({ newPassword: '' }); setPasswordError('');
    setPermissionsForm({ mode: 'PHARMA_ROLE_UPDATE', pharmaRoles: [], addFileNames: [], removeFileNames: [] });
    setLoadingPermissionsForManage(false);
    setCurrentlyAssignedFileNames([]);
    // Reset email availability when closing modal
    setEmailAvailability({
      isChecking: false,
      isAvailable: false,
      error: null,
      checkedEmail: ''
    });
  }, [businessName]);

  const openCreate = useCallback(() => {
    closeModal(); setModal('create');
  }, [closeModal]);

  const openEdit = useCallback((emp) => {
    setSelectedEmployee(emp);
    setEmployeeForm({
      name: emp.name || '',
      masterBusinessName: emp.masterBusinessName || businessName,
      emailAddress: emp.emailAddress || '',
      password: '',
      address: emp.address || '',
      phoneNo: emp.phoneNo || '',
      pharmaRoles: [],
      fileNames: []
    });
    setModalSuccess(null);
    setModalError(null);
    setModal('edit');
  }, [businessName]);

  const openPassword = useCallback((emp) => {
    setSelectedEmployee(emp); setModalSuccess(null); setModalError(null); setModal('password');
  }, []);

  const openPermissions = useCallback(async (emp) => {
    setSelectedEmployee(emp);
    setPermissionsForm({
      mode: 'PHARMA_ROLE_UPDATE',
      pharmaRoles: [],
      addFileNames: [],
      removeFileNames: []
    });
    setModalSuccess(null);
    setModalError(null);
    setModal('permissions');
    
    await fetchEmployeePermissionsForManage(emp.id);
    
    if (globalRoleObjects.length === 0 && customRoleObjects.length === 0) {
      fetchPharmaRoles();
    }
    if (globalModules.length === 0) {
      fetchGlobalModules();
    }
  }, [fetchEmployeePermissionsForManage, fetchPharmaRoles, fetchGlobalModules, globalRoleObjects.length, customRoleObjects.length, globalModules.length]);

  const openPermissionsViewer = useCallback((emp) => {
    setPermissionsViewer({ isOpen: true, employee: emp, permissions: null, loading: true, error: null });
    fetchEmployeePermissions(emp.id);
  }, [fetchEmployeePermissions]);

  const closePermissionsViewer = useCallback(() => {
    setPermissionsViewer({ isOpen: false, employee: null, permissions: null, loading: false, error: null });
  }, []);

  const validateCreateForm = useCallback(() => {
    const errors = {};
    if (!employeeForm.name?.trim()) errors.name = 'Name is required';
    else if (employeeForm.name.trim().length > LIMITS.name) errors.name = `Name must be ${LIMITS.name} characters or less`;
    if (!employeeForm.masterBusinessName?.trim()) errors.masterBusinessName = 'Business name is required';
    if (!employeeForm.emailAddress?.trim()) errors.emailAddress = 'Email is required';
    else if (!isValidEmail(employeeForm.emailAddress)) errors.emailAddress = 'Please enter a valid email address';
    if (!employeeForm.password?.trim()) errors.password = 'Password is required';
    else if (employeeForm.password.trim().length < 8) errors.password = 'Password must be at least 8 characters';
    if (!employeeForm.address?.trim()) errors.address = 'Address is required';
    else if (employeeForm.address.trim().length > LIMITS.address) errors.address = `Address must be ${LIMITS.address} characters or less`;
    if (!employeeForm.phoneNo?.trim()) errors.phoneNo = 'Phone number is required';
    else if (employeeForm.phoneNo.length > LIMITS.phone) errors.phoneNo = `Phone number must be ${LIMITS.phone} characters or less`;
    setEmployeeFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [employeeForm]);
  
  const validateEditForm = useCallback(() => {
    const errors = {};
    if (!employeeForm.name?.trim()) errors.name = 'Name is required';
    else if (employeeForm.name.trim().length > LIMITS.name) errors.name = `Name must be ${LIMITS.name} characters or less`;
    if (!employeeForm.address?.trim()) errors.address = 'Address is required';
    else if (employeeForm.address.trim().length > LIMITS.address) errors.address = `Address must be ${LIMITS.address} characters or less`;
    if (!employeeForm.phoneNo?.trim()) errors.phoneNo = 'Phone number is required';
    else if (employeeForm.phoneNo.length > LIMITS.phone) errors.phoneNo = `Phone number must be ${LIMITS.phone} characters or less`;
    setEmployeeFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [employeeForm]);
  
  const handleSaveEmployee = useCallback(async (e) => {
    e?.preventDefault();
    const isEdit = !!selectedEmployee;
    const isValid = isEdit ? validateEditForm() : validateCreateForm();
    if (!isValid) return;

    // For create mode, ensure email is available before submitting
    if (!isEdit && !emailAvailability.isAvailable) {
      setModalError('Please ensure email is available before creating employee');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const token = getToken();
      const payload = isEdit ? {
        name: employeeForm.name,
        address: employeeForm.address,
        phoneNo: employeeForm.phoneNo || '',
      } : {
        name: employeeForm.name,
        masterBusinessName: employeeForm.masterBusinessName,
        emailAddress: employeeForm.emailAddress,
        ...(employeeForm.password && { password: employeeForm.password }),
        address: employeeForm.address,
        phoneNo: employeeForm.phoneNo || '',
        pharmaRoles: [],
        fileNames: [],
      };

      const url = selectedEmployee ? employeeApiEndpoints.saveEmployee(selectedEmployee.id) : employeeApiEndpoints.saveEmployee();
      const res = await apiService.post(url, payload, { headers: getAuthHeaders(token) });

      let successMsg = isEdit ? 'Employee updated successfully' : 'Employee created successfully';
      if (!isEdit) {
        const createdEmployee = res?.data?.data || res?.data;
        if (createdEmployee?.status === 'PENDING') successMsg += ' A verification email has been sent.';
      }
      setModalSuccess(successMsg);
      setTimeout(() => { closeModal(); fetchEmployees(); }, 2000);
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [employeeForm, selectedEmployee, validateCreateForm, validateEditForm, closeModal, fetchEmployees, emailAvailability.isAvailable]);

  const handleUpdatePassword = useCallback(async (e) => {
    e?.preventDefault();
    if (!passwordForm.newPassword?.trim()) { setPasswordError('New password is required'); return; }
    if (passwordForm.newPassword.trim().length < 8) { setPasswordError('Password must be at least 8 characters'); return; }
    setPasswordError(''); setIsSubmitting(true); setModalError(null); setModalSuccess(null);
    try {
      const token = getToken();
      await apiService.patch(employeeApiEndpoints.updatePassword(selectedEmployee.id, passwordForm.newPassword), {}, { headers: getAuthHeaders(token) });
      setModalSuccess('Password updated successfully');
      setTimeout(() => { closeModal(); }, 1500);
    } catch (err) { setModalError(getErrorMessage(err)); }
    finally { setIsSubmitting(false); }
  }, [passwordForm, selectedEmployee, closeModal]);

  const handleUpdatePermissions = useCallback(async (e) => {
    e?.preventDefault();
    setIsSubmitting(true); setModalError(null); setModalSuccess(null);
    try {
      const token = getToken();
      const { mode, pharmaRoles, addFileNames, removeFileNames } = permissionsForm;
      const body = mode === 'PHARMA_ROLE_UPDATE' ? { addPharmaRoles: pharmaRoles } : { addFileNames, removeFileNames };
      await apiService.patch(employeeApiEndpoints.updatePermissions(selectedEmployee.id, mode), body, { headers: getAuthHeaders(token) });
      setModalSuccess('Permissions updated successfully');
      setTimeout(() => { closeModal(); fetchEmployees(); }, 1500);
    } catch (err) { setModalError(getErrorMessage(err)); }
    finally { setIsSubmitting(false); }
  }, [permissionsForm, selectedEmployee, closeModal, fetchEmployees]);

  const handleResendVerification = useCallback(async (emp) => {
    try {
      const token = getToken();
      await apiService.post(employeeApiEndpoints.resendVerification(emp.emailAddress), {}, { headers: getAuthHeaders(token) });
      setSuccessMessage(`Verification email resent to ${emp.emailAddress}.`);
    } catch (err) { setError(getErrorMessage(err)); }
  }, []);

  const togglePermPharmaRole = useCallback((roleName) => {
    setPermissionsForm((p) => ({
      ...p,
      pharmaRoles: p.pharmaRoles.includes(roleName)
        ? p.pharmaRoles.filter((r) => r !== roleName)
        : [...p.pharmaRoles, roleName]
    }));
  }, []);

  const toggleAddFileName = useCallback((fileName) => {
    setPermissionsForm(prev => ({
      ...prev,
      addFileNames: prev.addFileNames.includes(fileName)
        ? prev.addFileNames.filter(f => f !== fileName)
        : [...prev.addFileNames, fileName]
    }));
  }, []);

  const toggleRemoveFileName = useCallback((fileName) => {
    setPermissionsForm(prev => ({
      ...prev,
      removeFileNames: prev.removeFileNames.includes(fileName)
        ? prev.removeFileNames.filter(f => f !== fileName)
        : [...prev.removeFileNames, fileName]
    }));
  }, []);

  const filterFields = useMemo(() => [
    {
      type: 'dateRange',
      label: 'Date',
      fromName: 'fromDate',
      toName: 'toDate',
      value: { fromDate: filters.fromDate, toDate: filters.toDate },
      onChange: (e) => handleFilterChange(e.target.name, e.target.value),
      className: 'w-full sm:w-auto'
    },
    { type: 'text', name: 'search', label: 'Search', placeholder: 'Search name or email…', value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value), className: 'w-full sm:w-56' },
    { type: 'select', label: 'Status', name: 'status', value: filters.status, onChange: (e) => handleFilterChange('status', e.target.value), options: [{ label: 'Pending', value: 'PENDING' }, { label: 'Approved', value: 'APPROVED' }, { label: 'Blocked', value: 'BLOCKED' }], className: 'w-full sm:w-40' },
  ], [filters, handleFilterChange]);

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => <HeaderWithSort column={column} title="Name" />,
      cell: ({ row }) => <div className="font-medium text-gray-900 text-sm whitespace-nowrap">{row.original.name}</div>,
    },
    {
      accessorKey: 'emailAddress',
      header: 'Email',
      cell: ({ row }) => <div className="text-sm text-gray-600 break-all">{row.original.emailAddress}</div>,
    },
    {
      accessorKey: 'phoneNo',
      header: 'Phone',
      cell: ({ row }) => <div className="text-sm text-gray-600">{row.original.phoneNo || '—'}</div>,
    },
    {
      accessorKey: 'masterBusinessName',
      header: 'Business',
      cell: ({ row }) => {
        const biz = row.original.masterBusinessName;
        if (!biz) return <span className="text-gray-300 italic">—</span>;
        return <HoverTooltip preview={getWordPreview(biz)} full={biz} title="Full Business Name" />;
      },
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => {
        const address = row.original.address;
        if (!address) return <span className="text-gray-300 italic">—</span>;
        return <HoverTooltip preview={getWordPreview(address)} full={address} title="Full Address" />;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
            s === 'APPROVED' ? 'bg-green-100 text-green-800' :
            s === 'BLOCKED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
          }`}>{s}</span>
        );
      },
    },
   {
  accessorKey: 'updatedAt',
  header: ({ column }) => <HeaderWithSort column={column} title="Updated" />,
  cell: ({ row }) => (
    <div className="text-xs text-gray-500 whitespace-nowrap">
      {row.original.updatedAt ? SALES_MODULE_CONSTANTS.formatDate(row.original.updatedAt, true) : <span className="text-gray-300 italic">—</span>}
    </div>
  ),
},
    {
      accessorKey: 'Actions',
      header: () => <div className="text-center">Actions</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const emp = row.original;
        const isApproved = emp.status === 'APPROVED';
        const isPending = emp.status === 'PENDING';
        const isBlocked = emp.status === 'BLOCKED';
        const disableForNonApproved = !isApproved;

        return (
          <div className="flex justify-center flex-wrap gap-1.5">
            <ButtonTooltip tooltipText={disableForNonApproved ? "Status is Pending" : "View Permissions"} position="top">
              <Button variant="secondary" size="sm" onClick={() => openPermissionsViewer(emp)} disabled={disableForNonApproved} className="!p-1.5 !min-w-0">
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </ButtonTooltip>

            <ButtonTooltip tooltipText="Edit Employee" position="top">
              <Button variant="secondary" size="sm" onClick={() => openEdit(emp)} className="!p-1.5 !min-w-0">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </ButtonTooltip>

            <ButtonTooltip tooltipText={disableForNonApproved ? "Status is Pending" : "Change Password"} position="top">
              <Button variant="secondary" size="sm" onClick={() => openPassword(emp)} disabled={disableForNonApproved} className="!p-1.5 !min-w-0">
                <KeyRound className="h-3.5 w-3.5" />
              </Button>
            </ButtonTooltip>

            <ButtonTooltip tooltipText={disableForNonApproved ? "Status is Pending" : "Manage Permissions"} position="top">
              <Button variant="secondary" size="sm" onClick={() => openPermissions(emp)} disabled={disableForNonApproved} className="!p-1.5 !min-w-0">
                <ShieldCheck className="h-3.5 w-3.5" />
              </Button>
            </ButtonTooltip>

            {(isApproved || isBlocked) && (
              <ButtonTooltip tooltipText={emp.status === 'APPROVED' ? 'Block Employee' : 'Activate Employee'} position="top">
                <Button variant="secondary" size="sm" onClick={() => openStatusConfirm(emp)} className="!p-1.5 !min-w-0">
                  {emp.status === 'APPROVED' ? <Ban className="h-3.5 w-3.5 text-red-500" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                </Button>
              </ButtonTooltip>
            )}

            {isPending && (
              <ButtonTooltip tooltipText="Resend Verification" position="top">
                <Button variant="secondary" size="sm" onClick={() => handleResendVerification(emp)} className="!p-1.5 !min-w-0">
                  <MailCheck className="h-3.5 w-3.5" />
                </Button>
              </ButtonTooltip>
            )}
          </div>
        );
      },
    },
  ], [openEdit, openPassword, openPermissions, openStatusConfirm, handleResendVerification, openPermissionsViewer]);

  const ModalAlerts = () => (
    <>
      {modalSuccess && <div className="mb-3 flex-shrink-0"><Alert variant="success" message={modalSuccess} /></div>}
      {modalError && <div className="mb-3 flex-shrink-0"><Alert variant="error" message={modalError} /></div>}
    </>
  );

  const ModalFooter = ({ onCancel, submitLabel, loadingText, isSubmitDisabled = false }) => (
    <div className="flex-shrink-0 flex flex-wrap justify-end gap-3 pt-3 mt-3 border-t border-gray-200">
      <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">Cancel</Button>
      <Button 
        type="submit" 
        variant="primary" 
        disabled={isSubmitting || isSubmitDisabled} 
        loading={isSubmitting} 
        loadingText={loadingText} 
        className="w-full sm:w-auto"
      >
        {submitLabel}
      </Button>
    </div>
  );

  const StatusConfirmModal = () => {
    if (!confirmModal) return null;
    const isBlock = confirmModal.targetStatus === 'BLOCKED';
    return (
      <Modal isOpen={true} onClose={() => setConfirmModal(null)} title={isBlock ? 'Block Employee' : 'Activate Employee'} size="sm">
        <div className="p-6">
          <p className="text-lg text-gray-700 text-center">
            Are you sure you want to{' '}
            <span className={`font-bold ${isBlock ? 'text-red-600' : 'text-green-600'}`}>{isBlock ? 'BLOCK' : 'ACTIVATE'}</span>{' '}
            employee <strong>{confirmModal.employee.name}</strong>?
          </p>
          {confirmModal.error && <Alert variant="error" message={confirmModal.error} className="mt-4" />}
          <div className="mt-8 flex flex-wrap gap-3 justify-end">
            <Button variant="secondary" onClick={() => setConfirmModal(null)} disabled={confirmModal.loading}>Cancel</Button>
            <Button variant={isBlock ? 'danger' : 'primary'} onClick={handleConfirmStatus} loading={confirmModal.loading}>
              {isBlock ? 'Yes, Block Employee' : 'Yes, Activate Employee'}
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="relative">
      {successMessage && <Alert variant="success" message={successMessage} onClose={() => setSuccessMessage(null)} className="mb-4 mx-2 sm:mx-4" />}
      {error && <Alert variant="error" message={error} action={() => fetchEmployees()} actionLabel="Retry" onClose={() => setError(null)} className="mb-4 mx-2 sm:mx-4" />}

      <Card className="mb-6 mx-2 sm:mx-4" bodyClassName="p-0">
        <div className="flex flex-wrap items-center justify-between p-4 sm:p-6 border-b gap-4">
          <span className="text-xl sm:text-2xl font-bold text-gray-800">Manage Employees</span>
          <Button variant="primary" onClick={openCreate} className="inline-flex items-center justify-center gap-2 text-sm sm:text-base px-4 py-2">
            <Plus className="w-4 h-4" /><span>Add Employee</span>
          </Button>
        </div>
      </Card>

      <HomeTable
        data={employees} 
        columns={columns} 
        loading={loading} 
        filterFields={filterFields}
        onFilterChange={(name, value) => handleFilterChange(name, value)} 
        serverSideFiltering
        pagination={tablePagination} 
        onPaginationChange={handlePaginationChange}
        error={error}
        onRetry={() => fetchEmployees()} 
        hideDefaultActions 
        noDataMessage="No employees found"
      />

      {/* CREATE MODAL */}
      <Modal isOpen={modal === 'create'} onClose={closeModal} title="Add New Employee" size="lg">
        <div className="flex flex-col p-4 sm:p-6" style={{ maxHeight: 'calc(85vh - 64px)' }}>
          <ModalAlerts />
          <form onSubmit={handleSaveEmployee} autoComplete="off" className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto flex-1 space-y-3 pr-1 pb-1">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <CharLimitInput label="Full Name" name="name" value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} error={employeeFormErrors.name ? { message: employeeFormErrors.name } : null} required placeholder="e.g. Ali" maxLength={LIMITS.name} />
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <label className="block text-sm font-semibold text-gray-800">Business Name</label>
                  <input type="text" value={businessName} readOnly disabled autoComplete="off" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
  <CharLimitInput 
    label="Email Address" 
    name="emailAddress" 
    type="email" 
    value={employeeForm.emailAddress} 
    onChange={(e) => {
      setEmployeeForm({ ...employeeForm, emailAddress: e.target.value });
      // Clear email availability when user starts typing new email
      setEmailAvailability(prev => ({ ...prev, isAvailable: false, error: null, checkedEmail: '' }));
    }} 
    error={employeeFormErrors.emailAddress ? { message: employeeFormErrors.emailAddress } : null} 
    required 
    placeholder="employee@example.com" 
    maxLength={LIMITS.email} 
  />
  {/* Email availability status indicator - separate from input error */}
  {employeeForm.emailAddress && isValidEmail(employeeForm.emailAddress) && !employeeFormErrors.emailAddress && (
    <div className="mt-1 text-xs">
      {emailAvailability.isChecking ? (
        <span className="text-gray-500 flex items-center gap-1">
          <RefreshCw className="w-3 h-3 animate-spin" /> Checking availability...
        </span>
      ) : emailAvailability.isAvailable ? (
        <span className="text-green-600 flex items-center gap-1">
          ✓ Email is available
        </span>
      ) : emailAvailability.error && emailAvailability.checkedEmail === employeeForm.emailAddress && !emailAvailability.isAvailable ? (
        <span className="text-red-600 flex items-center gap-1">
          ✗ {emailAvailability.error}
        </span>
      ) : null}
    </div>
  )}
</div>
                <div className="flex-1 min-w-[200px]">
                  <PasswordInput label="Password" name="password" value={employeeForm.password} onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })} error={employeeFormErrors.password ? { message: employeeFormErrors.password } : null} required placeholder="Min. 8 characters" />
                </div>
              </div>
              <CharLimitInput label="Address" name="address" value={employeeForm.address} onChange={(e) => setEmployeeForm({ ...employeeForm, address: e.target.value })} error={employeeFormErrors.address ? { message: employeeFormErrors.address } : null} required placeholder="123 Main Street, City" maxLength={LIMITS.address} className="w-full" />
              <InputPhone 
                label="Phone Number" 
                name="phoneNo" 
                value={employeeForm.phoneNo} 
                onChange={(phone) => setEmployeeForm({ ...employeeForm, phoneNo: phone })} 
                error={employeeFormErrors.phoneNo} 
                placeholder="3001234567" 
                country="pk" 
                className="w-full"
                required={true}
              />
            </div>
            <ModalFooter 
              onCancel={closeModal} 
              submitLabel="Create Employee" 
              loadingText="Creating…"
              isSubmitDisabled={!emailAvailability.isAvailable && employeeForm.emailAddress && isValidEmail(employeeForm.emailAddress)}
            />
          </form>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={modal === 'edit'} onClose={closeModal} title={`Edit Employee — ${selectedEmployee?.name || ''}`} size="md">
        <div className="flex flex-col p-4 sm:p-6" style={{ maxHeight: 'calc(85vh - 64px)' }}>
          <ModalAlerts />
          <form onSubmit={handleSaveEmployee} autoComplete="off" className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto flex-1 space-y-4 pr-1 pb-1">
              <CharLimitInput label="Full Name" name="name" value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} error={employeeFormErrors.name ? { message: employeeFormErrors.name } : null} required placeholder="e.g. John Doe" maxLength={LIMITS.name} />
              <CharLimitInput label="Address" name="address" value={employeeForm.address} onChange={(e) => setEmployeeForm({ ...employeeForm, address: e.target.value })} error={employeeFormErrors.address ? { message: employeeFormErrors.address } : null} required placeholder="123 Main Street, City" maxLength={LIMITS.address} className="w-full" />
              <InputPhone 
                label="Phone Number" 
                name="phoneNo" 
                value={employeeForm.phoneNo} 
                onChange={(phone) => setEmployeeForm({ ...employeeForm, phoneNo: phone })} 
                error={employeeFormErrors.phoneNo}  
                placeholder="3001234567" 
                country="pk" 
                className="w-full"
                required={true}
              />
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Email (cannot be changed)</p>
                <p className="text-sm text-gray-700">{employeeForm.emailAddress}</p>
              </div>
            </div>
            <ModalFooter onCancel={closeModal} submitLabel="Save Changes" loadingText="Saving…" />
          </form>
        </div>
      </Modal>

      {/* PASSWORD MODAL */}
      <Modal isOpen={modal === 'password'} onClose={closeModal} title={`Change Password — ${selectedEmployee?.name || ''}`} size="sm">
        <div className="p-4 sm:p-6">
          <ModalAlerts />
          <form onSubmit={handleUpdatePassword} autoComplete="off">
            <div className="mb-4">
              <PasswordInput label="New Password" name="newPassword" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ newPassword: e.target.value })} error={passwordError ? { message: passwordError } : null} required placeholder="Min. 8 characters" className="w-full" />
            </div>
            <ModalFooter onCancel={closeModal} submitLabel="Update Password" loadingText="Updating…" />
          </form>
        </div>
      </Modal>

      {/* PERMISSIONS MODAL */}
      <Modal isOpen={modal === 'permissions'} onClose={closeModal} title={`Manage Permissions — ${selectedEmployee?.name || ''}`} size="lg">
        <div className="flex flex-col p-4 sm:p-6" style={{ maxHeight: 'calc(85vh - 64px)' }}>
          <ModalAlerts />
          {(rolesLoading || modulesLoading || loadingPermissionsForManage) ? (
            <Loader message={loadingPermissionsForManage ? "Loading current permissions..." : "Loading roles and modules..."} />
          ) : (
            <form onSubmit={handleUpdatePermissions} autoComplete="off" className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 space-y-3 pr-1 pb-1">
                <div className="flex-shrink-0">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Update Mode</label>
                  <div className="flex flex-wrap gap-4">
                    {[{ value: 'PHARMA_ROLE_UPDATE', label: 'Pharma Roles' }, { value: 'FILENAME_UPDATE', label: 'Individual Services' }].map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="permMode" value={opt.value} checked={permissionsForm.mode === opt.value} onChange={() => setPermissionsForm((p) => ({ ...p, mode: opt.value }))} className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {permissionsForm.mode === 'PHARMA_ROLE_UPDATE' && (
                  <PharmaRoleSelector
                    selectedRoles={permissionsForm.pharmaRoles}
                    onToggle={togglePermPharmaRole}
                    globalRoles={globalRoleObjects}
                    customRoles={customRoleObjects}
                    loading={rolesLoading}
                    error={rolesError}
                    onRetry={fetchPharmaRoles}
                  />
                )}

                {permissionsForm.mode === 'FILENAME_UPDATE' && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500">Check modules to add or remove. Lists are independent.</p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex-1 min-w-[200px] border border-green-200 rounded-xl p-3 bg-green-50">
                        <p className="text-sm font-semibold text-green-800 mb-2">➕ New access to add</p>
                        <FileNameSelector
                          selectedFileNames={permissionsForm.addFileNames}
                          onToggle={toggleAddFileName}
                          availableModules={globalModules.filter(mod => !currentlyAssignedFileNames.includes(mod.fileName))}
                          loading={modulesLoading}
                          error={modulesError}
                          onRetry={fetchGlobalModules}
                          title="add modules"
                        />
                      </div>
                      <div className="flex-1 min-w-[200px] border border-red-200 rounded-xl p-3 bg-red-50">
                        <p className="text-sm font-semibold text-red-800 mb-2">➖ Current access to remove</p>
                        <FileNameSelector
                          selectedFileNames={permissionsForm.removeFileNames}
                          onToggle={toggleRemoveFileName}
                          availableModules={globalModules.filter(mod => currentlyAssignedFileNames.includes(mod.fileName))}
                          loading={modulesLoading}
                          error={modulesError}
                          onRetry={fetchGlobalModules}
                          title="remove modules"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <ModalFooter onCancel={closeModal} submitLabel="Save Permissions" loadingText="Saving…" />
            </form>
          )}
        </div>
      </Modal>

      <StatusConfirmModal />
      <PermissionsViewerModal
        isOpen={permissionsViewer.isOpen}
        onClose={closePermissionsViewer}
        employee={permissionsViewer.employee}
        permissions={permissionsViewer.permissions}
        loading={permissionsViewer.loading}
        error={permissionsViewer.error}
      />
    </div>
  );
}