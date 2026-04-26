import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import HomeTable from "../../components/common/table/Table";
import HeaderWithSort from "../../components/common/table/components/TableHeaderWithSort";
import { getToken } from "../../services/tokenUtils";
import apiService from "../../services/apiService";
import { employeeApiEndpoints } from '../../services/endpoint/emproles/rolesend';
import { useAuth } from "../../components/auth/hooks/useAuth";
import { Plus, Pencil, Layers } from 'lucide-react';

import Button from "../../components/ui/forms/Button";
import InputText from "../../components/ui/forms/InputText";
import Alert from "../../components/ui/feedback/Alert";
import Card from "../../components/ui/Card";
import Modal from '../../components/ui/Modal';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.error) return error.response.data.error;
  if (error.message) return error.message;
  return "An unexpected error occurred";
};

// ─────────────────────────────────────────────
// HoverTooltip — displays full list on hover
// ─────────────────────────────────────────────
const HoverTooltip = ({ preview, full, title = "Details" }) => {
  if (!full || full === "—" || full === preview) {
    return <span className="text-gray-600 font-medium">{preview}</span>;
  }

  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef(null);

  const handleEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const handleLeave = () => {
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className="text-blue-600 hover:text-blue-800 hover:underline cursor-help font-medium transition-colors"
      >
        {preview}
      </span>

      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <div
            className="
              bg-white rounded-xl shadow-2xl border border-gray-200 
              p-6 max-w-lg w-[90%] mx-4 
              max-h-[85vh] overflow-y-auto pointer-events-auto
            "
          >
            <h3 className="font-bold text-lg mb-4 text-gray-800 border-b border-gray-200 pb-3 text-center">
              {title}
            </h3>

            <div className="text-gray-800 font-medium leading-relaxed whitespace-pre-line text-left">
              {full.split('\n').map((line, i) => (
                <p key={i} className="mb-2 last:mb-0">
                  -&gt; {line.trim()}
                </p>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// FileNameSelector — reusable checkbox list
// ─────────────────────────────────────────────
const FileNameSelector = ({ selectedFileNames, onToggle, availableModules, label, placeholder = "Search modules...", bgClass = "" }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return availableModules;
    return availableModules.filter(m =>
      m.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableModules, searchTerm]);

  return (
    <div className={`space-y-3 ${bgClass}`}>
      {label && <p className="text-sm font-semibold text-gray-800 mb-2">{label}</p>}
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C5690]"
      />
      <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No modules found</div>
        ) : (
          filtered.map((mod) => (
            <label
              key={mod.fileName}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <input
                type="checkbox"
                checked={selectedFileNames.includes(mod.fileName)}
                onChange={() => onToggle(mod.fileName)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">{mod.fileName}</div>
                {mod.note && (
                  <div className="text-xs text-gray-400 mt-0.5">{mod.note}</div>
                )}
              </div>
            </label>
          ))
        )}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Selected: {selectedFileNames.length} module(s)
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function RolesManagement() {
  const { user } = useAuth();

  const fetchTimeoutRef = useRef(null);
  const controllerRef = useRef(null);
  const successTimeoutRef = useRef(null);

  // ── State ──────────────────────────────────
  const [globalRoles, setGlobalRoles] = useState([]);
  const [customRoles, setCustomRoles] = useState([]);
  const [globalModules, setGlobalModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(null);
  const [modalError, setModalError] = useState(null);

  // Form state for CREATE
  const [createForm, setCreateForm] = useState({
    name: "",
    fileNames: [],
  });

  // Form state for EDIT (split add/remove)
  const [editForm, setEditForm] = useState({
    originalName: "",
    newName: "",
    addFileNames: [],    // modules to add
    removeFileNames: [], // modules to remove
  });

  // Validation errors
  const [createErrors, setCreateErrors] = useState({ name: "", fileNames: "" });
  const [editErrors, setEditErrors] = useState({ name: "", addFileNames: "", removeFileNames: "" });

  // ── Auto-clear alerts ──────────────────────
  useEffect(() => {
    if (!successMessage) return;
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 5000);
    return () => clearTimeout(successTimeoutRef.current);
  }, [successMessage]);

  useEffect(() => {
    if (modalSuccess) {
      const t = setTimeout(() => setModalSuccess(null), 5000);
      return () => clearTimeout(t);
    }
  }, [modalSuccess]);

  useEffect(() => {
    if (modalError) {
      const t = setTimeout(() => setModalError(null), 8000);
      return () => clearTimeout(t);
    }
  }, [modalError]);

  // ── Form helpers ───────────────────────────
  const resetCreateForm = useCallback(() => {
    setCreateForm({ name: "", fileNames: [] });
    setCreateErrors({ name: "", fileNames: "" });
  }, []);

  const resetEditForm = useCallback(() => {
    setEditForm({ originalName: "", newName: "", addFileNames: [], removeFileNames: [] });
    setEditErrors({ name: "", addFileNames: "", removeFileNames: "" });
  }, []);

  const validateCreate = useCallback(() => {
    const errors = { name: "", fileNames: "" };
    let isValid = true;
    if (!createForm.name?.trim()) {
      errors.name = "Role name is required";
      isValid = false;
    }
    if (createForm.fileNames.length === 0) {
      errors.fileNames = "At least one module is required";
      isValid = false;
    }
    setCreateErrors(errors);
    return isValid;
  }, [createForm]);

  const validateEdit = useCallback(() => {
    const errors = { name: "", addFileNames: "", removeFileNames: "" };
    let isValid = true;
    if (!editForm.newName?.trim()) {
      errors.name = "Role name is required";
      isValid = false;
    }
    // At least one change: name changed OR add/remove non-empty
    const nameChanged = editForm.newName !== editForm.originalName;
    const hasAdd = editForm.addFileNames.length > 0;
    const hasRemove = editForm.removeFileNames.length > 0;
    if (!nameChanged && !hasAdd && !hasRemove) {
      errors.addFileNames = "No changes detected";
      isValid = false;
    }
    setEditErrors(errors);
    return isValid;
  }, [editForm]);

  // ── Fetch pharma roles + global modules ────
  const fetchData = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) { setLoading(false); return; }

      const headers = getAuthHeaders(token);
      const signal = controllerRef.current.signal;

      const rolesRes = await apiService.get(
        employeeApiEndpoints.getPharmaRoles('all'),
        { headers, signal, timeout: 30000 }
      );

      const rolesData = rolesRes?.data?.data || {};
      setGlobalRoles(rolesData.globalRoles || []);
      setCustomRoles(rolesData.customRoles || []);

      const modulesRes = await apiService.get(
        employeeApiEndpoints.getGlobalModules(),
        { headers, signal, timeout: 30000 }
      );

      const rawModules = modulesRes?.data?.data || [];
      const normalised = Array.isArray(rawModules)
        ? rawModules.map(m =>
            typeof m === 'string'
              ? { fileName: m }
              : { fileName: m.fileName ?? m.name ?? m, note: m.note ?? null }
          )
        : [];
      setGlobalModules(normalised);

    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Create pharma role ─────────────────────
  const handleCreateRole = useCallback(async (e) => {
    e?.preventDefault();
    if (!validateCreate()) return;

    setIsSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const token = getToken();
      const headers = getAuthHeaders(token);

      const payload = {
        pharmaRoleName: createForm.name.toUpperCase(),
        fileNames: createForm.fileNames,
      };

      await apiService.post(
        employeeApiEndpoints.savePharmaRole('save'),
        payload,
        { headers }
      );

      setModalSuccess('Pharma role created successfully');
      setTimeout(() => {
        setShowCreateModal(false);
        resetCreateForm();
        fetchData();
      }, 1500);
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [createForm, resetCreateForm, fetchData, validateCreate]);

  // ── Update pharma role (split add/remove) ──
  const handleUpdateRole = useCallback(async (e) => {
    e?.preventDefault();
    if (!validateEdit()) return;

    setIsSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const token = getToken();
      const headers = getAuthHeaders(token);
      const { originalName, newName, addFileNames, removeFileNames } = editForm;
      const nameChanged = newName !== originalName;

      // Helper to call API
      const callUpdateApi = async (body) => {
        return apiService.post(
          employeeApiEndpoints.savePharmaRole('UPDATE'),
          body,
          { headers }
        );
      };

      // 1. Update name if changed
      if (nameChanged) {
        await callUpdateApi({
          pharmaRoleName: originalName,
          newPharmaRoleName: newName,
        });
      }

      // 2. Update modules (add and/or remove)
      if (addFileNames.length > 0 || removeFileNames.length > 0) {
        await callUpdateApi({
          pharmaRoleName: nameChanged ? newName : originalName,
          addFileNames,
          removeFileNames,
        });
      }

      setModalSuccess('Pharma role updated successfully');
      setTimeout(() => {
        setShowEditModal(false);
        setSelectedRole(null);
        resetEditForm();
        fetchData();
      }, 1500);
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [editForm, resetEditForm, fetchData, validateEdit]);

  // ── Open edit modal (populate split lists) ──
  const handleEditClick = useCallback((role, isCustom = true) => {
    if (!isCustom) return;
    const roleName = role.pharmaRoleName || role.name || "";
    const currentFileNames = role.fileNames?.map(f =>
      typeof f === 'string' ? f : f.fileName
    ) || [];

    // For edit, we separate:
    // - addFileNames: initially empty (user picks modules to add)
    // - removeFileNames: initially contains all current modules (user can uncheck to keep)
    // Actually, better UX: In remove section, show currently assigned modules; user checks those they want to REMOVE.
    // So removeFileNames starts empty, and the list shows all currently assigned modules.
    // We'll manage two independent selectors: one for add (modules not assigned), one for remove (modules assigned).
    setEditForm({
      originalName: roleName,
      newName: roleName,
      addFileNames: [],
      removeFileNames: [], // user will check modules they want to delete
    });
    setModalSuccess(null);
    setModalError(null);
    setShowEditModal(true);
  }, []);

  // ── Toggles for create mode ─────────────────
  const handleToggleCreateFileName = useCallback((fileName) => {
    setCreateForm(prev => ({
      ...prev,
      fileNames: prev.fileNames.includes(fileName)
        ? prev.fileNames.filter(f => f !== fileName)
        : [...prev.fileNames, fileName],
    }));
  }, []);

  // ── Toggles for edit mode add/remove ────────
  const handleToggleAddFileName = useCallback((fileName) => {
    setEditForm(prev => ({
      ...prev,
      addFileNames: prev.addFileNames.includes(fileName)
        ? prev.addFileNames.filter(f => f !== fileName)
        : [...prev.addFileNames, fileName],
    }));
  }, []);

  const handleToggleRemoveFileName = useCallback((fileName) => {
    setEditForm(prev => ({
      ...prev,
      removeFileNames: prev.removeFileNames.includes(fileName)
        ? prev.removeFileNames.filter(f => f !== fileName)
        : [...prev.removeFileNames, fileName],
    }));
  }, []);

  // ── Filter ─────────────────────────────────
  const handleFilterChange = useCallback((name, value) => {
    if (name === "search") setSearchTerm(value);
  }, []);

  const handleRetry = useCallback(() => fetchData(), [fetchData]);

  // ── Initial fetch ──────────────────────────
  useEffect(() => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(fetchData, 400);
    return () => clearTimeout(fetchTimeoutRef.current);
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      if (controllerRef.current) controllerRef.current.abort();
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  // ── Combine roles for table ─────────────────
  const allRoles = useMemo(() => {
    const global = (globalRoles || []).map(role => ({
      ...role,
      type: 'Global',
      isCustom: false,
    }));
    const custom = (customRoles || []).map(role => ({
      ...role,
      type: 'Custom',
      isCustom: true,
    }));

    let combined = [...global, ...custom];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      combined = combined.filter(r =>
        (r.pharmaRoleName || '').toLowerCase().includes(q)
      );
    }
    return combined;
  }, [globalRoles, customRoles, searchTerm]);

  // ── Table filter fields ────────────────────
  const filterFields = useMemo(() => [
    {
      type: "search",
      name: "search",
      label: "Search",
      placeholder: "Search roles...",
      value: searchTerm,
      onChange: (e) => handleFilterChange("search", e.target.value),
      className: "w-full sm:w-64",
    },
  ], [searchTerm, handleFilterChange]);

  // ── Table columns ──────────────────────────
  const columns = useMemo(() => [
    {
      accessorKey: "pharmaRoleName",
      header: ({ column }) => <HeaderWithSort column={column} title="Role Name" />,
      cell: ({ row }) => (
        <div className="font-medium text-gray-900 text-xs sm:text-sm">
          {row.original.pharmaRoleName}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
            type === 'Global'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {type}
          </span>
        );
      },
    },
    {
      accessorKey: "fileNames",
      header: "Modules",
      cell: ({ row }) => {
        const raw = row.original.fileNames || [];
        const names = raw.map(f => (typeof f === 'string' ? f : f.fileName));
        const count = names.length;
        const roleName = row.original.pharmaRoleName || 'Role';

        if (count === 0) return <span className="text-gray-400 text-xs sm:text-sm">—</span>;

        const previewText = `${count} module${count > 1 ? 's' : ''}: ${names.slice(0, 2).join(', ')}${count > 2 ? '…' : ''}`;
        const fullList = names.join('\n');

        return (
          <div className="text-xs sm:text-sm">
            <HoverTooltip
              preview={previewText}
              full={fullList}
              title={`${roleName} - Modules (${count})`}
            />
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        if (row.original.type !== 'Custom') {
          return <span className="text-gray-400 text-xs">Read-only</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEditClick(row.original, true)}
              className="text-blue-600 hover:text-blue-800 focus:outline-none flex items-center gap-1"
              title="Edit role name and modules"
            >
              <Pencil className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Edit</span>
            </button>
          </div>
        );
      },
    },
  ], [handleEditClick]);

  // ── Helper to get available modules for add (not currently assigned) ──
  const getAvailableModulesForAdd = useCallback(() => {
    if (!selectedRole) return globalModules;
    const currentFileNames = selectedRole.fileNames?.map(f =>
      typeof f === 'string' ? f : f.fileName
    ) || [];
    return globalModules.filter(mod => !currentFileNames.includes(mod.fileName));
  }, [globalModules, selectedRole]);

  // ── Helper to get currently assigned modules (for remove section) ──
  const getAssignedModules = useCallback(() => {
    if (!selectedRole) return [];
    const currentFileNames = selectedRole.fileNames?.map(f =>
      typeof f === 'string' ? f : f.fileName
    ) || [];
    return globalModules.filter(mod => currentFileNames.includes(mod.fileName));
  }, [globalModules, selectedRole]);

  // ── Render create modal body ────────────────
  const renderCreateBody = () => (
    <div className="p-4 sm:p-6">
      {modalSuccess && <Alert variant="success" message={modalSuccess} className="mb-4" />}
      {modalError && <Alert variant="error" message={modalError} className="mb-4" />}
      <form onSubmit={handleCreateRole}>
        <div className="space-y-6 mb-6">
          <InputText
            label="Role Name"
            name="name"
            value={createForm.name}
            onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
            error={createErrors.name ? { message: createErrors.name } : null}
            required
            placeholder="e.g., SALES_MANAGER, TRAINEE"
          />
          <FileNameSelector
            selectedFileNames={createForm.fileNames}
            onToggle={handleToggleCreateFileName}
            availableModules={globalModules}
            label="Assign Modules"
          />
          {createErrors.fileNames && <p className="text-red-600 text-sm mt-1">{createErrors.fileNames}</p>}
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={() => { setShowCreateModal(false); resetCreateForm(); setModalSuccess(null); setModalError(null); }}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting} loadingText="Creating...">
            Create Role
          </Button>
        </div>
      </form>
    </div>
  );

  // ── Render edit modal body (split UI) ───────
  const renderEditBody = () => {
    const availableAddModules = getAvailableModulesForAdd();
    const assignedModules = getAssignedModules();

    return (
      <div className="p-4 sm:p-6">
        {modalSuccess && <Alert variant="success" message={modalSuccess} className="mb-4" />}
        {modalError && <Alert variant="error" message={modalError} className="mb-4" />}
        <form onSubmit={handleUpdateRole}>
          <div className="space-y-6 mb-6">
            <InputText
              label="Role Name"
              name="newName"
              value={editForm.newName}
              onChange={(e) => setEditForm(prev => ({ ...prev, newName: e.target.value.toUpperCase() }))}
              error={editErrors.name ? { message: editErrors.name } : null}
              required
              placeholder="e.g., SALES_MANAGER, TRAINEE"
            />

            <div className="flex flex-wrap gap-4">
              {/* ADD ACCESS SECTION */}
              <div className="flex-1 min-w-[200px] border border-green-200 rounded-xl p-3 bg-green-50">
                <p className="text-sm font-semibold text-green-800 mb-2">➕ New access to add</p>
                <FileNameSelector
                  selectedFileNames={editForm.addFileNames}
                  onToggle={handleToggleAddFileName}
                  availableModules={availableAddModules}
                  placeholder="Search modules to add..."
                />
              </div>

              {/* REMOVE ACCESS SECTION */}
              <div className="flex-1 min-w-[200px] border border-red-200 rounded-xl p-3 bg-red-50">
                <p className="text-sm font-semibold text-red-800 mb-2">➖ Current access to remove</p>
                <FileNameSelector
                  selectedFileNames={editForm.removeFileNames}
                  onToggle={handleToggleRemoveFileName}
                  availableModules={assignedModules}
                  placeholder="Search modules to remove..."
                />
              </div>
            </div>
            {(editErrors.addFileNames || editErrors.removeFileNames) && (
              <p className="text-red-600 text-sm">{editErrors.addFileNames || editErrors.removeFileNames}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={() => { setShowEditModal(false); setSelectedRole(null); resetEditForm(); setModalSuccess(null); setModalError(null); }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting} loadingText="Updating...">
              Update Role
            </Button>
          </div>
        </form>
      </div>
    );
  };

  // ── Render ─────────────────────────────────
  return (
    <div className="relative">
      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          className="mb-4 mx-2 sm:mx-4"
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {error && (
        <Alert
          variant="error"
          message={error}
          action={handleRetry}
          actionLabel="Retry"
          onClose={() => setError(null)}
          className="mb-4 mx-2 sm:mx-4"
        />
      )}

      <Card className="mb-6 mx-2 sm:mx-4" bodyClassName="p-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-[#3C5690]" />
            <span className="text-xl sm:text-2xl font-bold text-gray-800">
              Pharma Roles Management
            </span>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              resetCreateForm();
              setModalSuccess(null);
              setModalError(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 text-sm sm:text-base px-4 py-2"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Create Global Role</span>
          </Button>
        </div>
      </Card>

      <HomeTable
        data={allRoles}
        columns={columns}
        loading={loading}
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
        serverSideFiltering={false}
        error={error}
        onRetry={handleRetry}
        hideDefaultActions
        noDataMessage="No pharma roles found"
      />

      {/* CREATE MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
          setModalSuccess(null);
          setModalError(null);
        }}
        title="Create Global Role"
        size="lg"
      >
        {renderCreateBody()}
      </Modal>

      {/* EDIT MODAL with split Add/Remove UI */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRole(null);
          resetEditForm();
          setModalSuccess(null);
          setModalError(null);
        }}
        title={`Edit Pharma Role — ${selectedRole?.pharmaRoleName || ''}`}
        size="lg"
      >
        {renderEditBody()}
      </Modal>
    </div>
  );
}