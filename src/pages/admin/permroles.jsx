//permroles.jsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import HomeTable from "../../components/common/table/Table";
import HeaderWithSort from "../../components/common/table/components/TableHeaderWithSort";
import { getToken } from "../../services/tokenUtils";
import apiService from "../../services/apiService";
import { adminApiEndpoints } from '../../services/endpoint/emproles/rolesend';
import { useAuth } from "../../components/auth/hooks/useAuth";
import { Plus, Pencil, Power } from 'lucide-react';

import Button from "../../components/ui/forms/Button";
import InputText from "../../components/ui/forms/InputText";
import InputSelect from "../../components/ui/forms/InputSelect";
import ButtonTooltip from "../../components/ui/forms/ButtonTooltip";
import Alert from "../../components/ui/feedback/Alert";
import Card from "../../components/ui/Card";
import Modal from '../../components/ui/Modal';

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

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

const formatDisplayDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return "Invalid Date";
  }
};

const HoverTooltip = ({ preview, full, title, className = "" }) => {
  const actualPreview = preview || (full ? full.substring(0, 30) + (full.length > 30 ? '...' : '') : '-');

  let content;
  if (full && full !== '-' && full !== actualPreview) {
    content = (
      <div className="p-3 sm:p-4">
        <p className="text-gray-900 whitespace-pre-wrap break-words text-sm sm:text-base">{full}</p>
      </div>
    );
  } else {
    return <span className={`text-gray-600 text-xs sm:text-sm ${className}`}>{actualPreview}</span>;
  }

  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef(null);

  const open = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const close = () => {
    timerRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={open}
        onMouseLeave={close}
        className={`text-blue-600 hover:underline cursor-help text-xs sm:text-sm ${className}`}
      >
        {actualPreview}
      </span>

      {isOpen && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-none p-4">
          <div
            onMouseEnter={open}
            onMouseLeave={close}
            className="bg-white rounded-xl shadow-2xl p-4 border border-gray-300 max-w-md max-h-[80vh] overflow-y-auto pointer-events-auto"
          >
            <h3 className="font-bold text-sm sm:text-md mb-2 text-center text-gray-800 border-b pb-2">
              {title}
            </h3>
            {content}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ─── Status Update Modal ────────────────────────────────────────────────────

const StatusUpdateModal = ({ isOpen, onClose, permission, onUpdate }) => {
  const [status, setStatus] = useState(permission?.status || 'ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (permission) {
      setStatus(permission.status || 'ACTIVE');
      setError(null);
    }
  }, [permission]);

  const handleSubmit = async () => {
    if (status === permission.status) {
      setError(`Permission is already ${status}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onUpdate([permission.id], status);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Status - ${permission?.name}`}
      size="md"
    >
      <div className="p-4 sm:p-6">
        {error && (
          <div className="mb-4">
            <Alert variant="error" message={error} onClose={() => setError(null)} />
          </div>
        )}

        <div className="space-y-4">
          <InputSelect
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_OPTIONS}
            required
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText="Updating..."
            className="w-full sm:w-auto"
          >
            Update Status
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function PermissionManagement() {
  const { user } = useAuth();

  const fetchTimeoutRef   = useRef(null);
  const controllerRef     = useRef(null);
  const successTimeoutRef = useRef(null);

  const [permissions,    setPermissions]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Filter states
  const [searchTerm,     setSearchTerm]     = useState("");
  const [statusFilter,   setStatusFilter]   = useState("");
  const [moduleFilter,   setModuleFilter]   = useState("");
  const [fileNameFilter, setFileNameFilter] = useState(""); // NEW: fileName filter

  const [showCreateModal,    setShowCreateModal]    = useState(false);
  const [showEditModal,      setShowEditModal]      = useState(false);
  const [showStatusModal,    setShowStatusModal]    = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [isSubmitting,       setIsSubmitting]       = useState(false);
  const [modalSuccess,       setModalSuccess]       = useState(null);
  const [modalError,         setModalError]         = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

  // FIX: fileName added — it's a required query param on the save endpoint
  const [formData, setFormData] = useState({
    id:       "",
    fileName: "",   // e.g. "Dashboard" — the page/group name, query param for save
    module:   "",   // e.g. "DB" — short module code, goes in request body
    name:     "",
    url:      "",
  });

  const [formErrors, setFormErrors] = useState({
    fileName: "",
    module:   "",
    name:     "",
    url:      "",
  });

  const [urlInputKey, setUrlInputKey] = useState(Date.now());

  // ── Auto-clear success / error toasts ──────────────────────────────────

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
    if (modalError) {
      const t = setTimeout(() => setModalError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [modalSuccess, modalError]);

  // ── Form helpers ────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormData({ id: "", fileName: "", module: "", name: "", url: "" });
    setFormErrors({ fileName: "", module: "", name: "", url: "" });
    setUrlInputKey(Date.now());
  }, []);

  // Validate for CREATE (all fields required)
  const validateCreateForm = useCallback(() => {
    const errors = { fileName: "", module: "", name: "", url: "" };
    let isValid = true;

    if (!formData.fileName?.trim()) { errors.fileName = "File name is required";       isValid = false; }
    if (!formData.module?.trim())   { errors.module   = "Module is required";           isValid = false; }
    if (!formData.name?.trim())     { errors.name     = "Permission name is required";  isValid = false; }
    if (!formData.url?.trim())      { errors.url      = "URL is required";              isValid = false; }

    setFormErrors(errors);
    return isValid;
  }, [formData]);

  // Validate for EDIT (only name is editable)
  const validateEditForm = useCallback(() => {
    const errors = { fileName: "", module: "", name: "", url: "" };
    let isValid = true;

    if (!formData.name?.trim()) { errors.name = "Permission name is required"; isValid = false; }

    setFormErrors(errors);
    return isValid;
  }, [formData]);

  // ── API calls ───────────────────────────────────────────────────────────

  /**
   * GET /api/employee/global-permissions?employeePermissions=false&status=&module=&fileName=
   * Response shape: { data: [ { permissionId, module, name, fileName, url, status, createdAt } ] }
   */
  const fetchPermissions = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) { setLoading(false); return; }

      // FIX: Pass all filters to API - using the updated getGlobalPermissions
      const endpoint = adminApiEndpoints.getGlobalPermissions(
        "",           // vendorId
        "",           // employeeId
        "false",      // employeePermissions - false for global permissions
        statusFilter, // status filter
        moduleFilter, // module filter
        fileNameFilter // NEW: fileName filter
      );
      
      const headers = getAuthHeaders(token);

      const { data } = await apiService.get(endpoint, {
        headers,
        signal:  controllerRef.current.signal,
        timeout: 30000,
      });

      // Response is data.data (array)
      let permissionsData = data?.data ?? [];

      // Client-side search filter (since API might not have search parameter)
      // If API gets a search param later, move this to API call
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        permissionsData = permissionsData.filter(
          p => p.name?.toLowerCase().includes(q) || p.url?.toLowerCase().includes(q)
        );
      }

      setPermissions(permissionsData);
      setPagination(p => ({ ...p, total: permissionsData.length }));
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(getErrorMessage(err));
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, moduleFilter, fileNameFilter]); // Added fileNameFilter dependency

  /**
   * CREATE — POST /api/admin/api/permission/save?fileName=Dashboard
   * Body: [{ module, name, url }]
   */
  const handleCreatePermission = useCallback(async (e) => {
    e?.preventDefault();
    if (!validateCreateForm()) return;

    setIsSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const token   = getToken();
      const headers = getAuthHeaders(token);

      // FIX: pass formData.fileName as the required query param
      await apiService.post(
        adminApiEndpoints.savePermission(formData.fileName),
        [{ module: formData.module, name: formData.name, url: formData.url }],
        { headers }
      );

      setModalSuccess('Permission added successfully');
      setTimeout(() => {
        setShowCreateModal(false);
        resetForm();
        fetchPermissions();
      }, 1500);
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, resetForm, fetchPermissions, validateCreateForm]);

  /**
   * EDIT — PUT /api/admin/api/permission/update?status=updateName
   * Body: { permissionId, newName }
   * NOTE: only the name is updatable via this endpoint per the README
   */
  const handleEditPermission = useCallback(async (e) => {
    e?.preventDefault();
    if (!validateEditForm()) return;

    setIsSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const token   = getToken();
      const headers = getAuthHeaders(token);

      // FIX: use PUT update endpoint with status=updateName
      await apiService.put(
        adminApiEndpoints.updatePermission("updateName"),
        { permissionId: formData.id, newName: formData.name },
        { headers }
      );

      setModalSuccess('Permission updated successfully');
      setTimeout(() => {
        setShowEditModal(false);
        setSelectedPermission(null);
        resetForm();
        fetchPermissions();
      }, 1500);
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, resetForm, fetchPermissions, validateEditForm]);

  /**
   * CHANGE STATUS — PATCH /api/employee/change-status
   * Body: { ids: [1,2,3], status: "active" | "inactive" }
   * FIX: README uses lowercase status values
   */
  const handleChangeStatus = useCallback(async (ids, status) => {
    try {
      const token   = getToken();
      const headers = getAuthHeaders(token);

      await apiService.patch(
        adminApiEndpoints.changePermissionStatus(),
        {
          ids:    Array.isArray(ids) ? ids : [ids],
          status: status.toLowerCase(),   // FIX: API expects lowercase
        },
        { headers }
      );

      setSuccessMessage(`Permission status updated to ${status}`);
      fetchPermissions();
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }, [fetchPermissions]);

  // ── Event handlers ──────────────────────────────────────────────────────

  const handleEditClick = useCallback((permission) => {
    setSelectedPermission(permission);
    setFormData({
      id:       permission.permissionId || "",
      fileName: permission.fileName     || "",  // read-only in edit
      module:   permission.module       || "",  // read-only in edit
      name:     permission.name         || "",  // the only editable field
      url:      permission.url          || "",  // read-only in edit
    });
    setUrlInputKey(Date.now());
    setModalSuccess(null);
    setModalError(null);
    setShowEditModal(true);
  }, []);

  const handleStatusClick = useCallback((permission) => {
    setSelectedPermission({
      id:     permission.permissionId,
      name:   permission.name,
      status: permission.status,
    });
    setShowStatusModal(true);
  }, []);

  const handleFilterChange = useCallback((name, value) => {
    if (name === "search") setSearchTerm(value);
    if (name === "status") setStatusFilter(value);
    if (name === "module") setModuleFilter(value);
    if (name === "fileName") setFileNameFilter(value); // NEW: handle fileName filter
    setPagination(p => ({ ...p, page: 1 }));
  }, []);

  const handleRetry = useCallback(() => fetchPermissions(), [fetchPermissions]);

  // ── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => fetchPermissions(), 500);
    return () => clearTimeout(fetchTimeoutRef.current);
  }, [searchTerm, statusFilter, moduleFilter, fileNameFilter, fetchPermissions]); // Added fileNameFilter

  useEffect(() => {
    return () => {
      clearTimeout(fetchTimeoutRef.current);
      clearTimeout(successTimeoutRef.current);
      controllerRef.current?.abort();
    };
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────

  const uniqueModules = useMemo(() => {
    const modules = [...new Set(permissions.map(p => p.module).filter(Boolean))];
    return modules.map(m => ({ value: m, label: m }));
  }, [permissions]);

  // UPDATED: filterFields with fileName search added
  const filterFields = useMemo(() => [
    {
      type:        "search",
      name:        "search",
      label:       "Search",
      placeholder: "Search by name or URL...",
      value:       searchTerm,
      onChange:    (e) => handleFilterChange("search", e.target.value),
      className:   "w-full sm:w-64",
    },
    {
      type:        "text",  // Changed from "search" to "text" for fileName filter
      name:        "fileName",
      label:       "File Name",
      placeholder: "Search by file name...",
      value:       fileNameFilter,
      onChange:    (e) => handleFilterChange("fileName", e.target.value),
      className:   "w-full sm:w-48",
    },
    {
      type:      "select",
      name:      "module",
      label:     "Module",
      value:     moduleFilter,
      onChange:  (e) => handleFilterChange("module", e.target.value),
      options:   [ ...uniqueModules],
      className: "w-full sm:w-40",
    },
    {
      type:      "select",
      name:      "status",
      label:     "Status",
      value:     statusFilter,
      onChange:  (e) => handleFilterChange("status", e.target.value),
      options:   [ ...STATUS_OPTIONS],
      className: "w-full sm:w-40",
    },
  ], [searchTerm, fileNameFilter, moduleFilter, statusFilter, uniqueModules, handleFilterChange]);

  const columns = useMemo(() => [
    {
      accessorKey: "permissionId",
      header: "ID",
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.permissionId}</div>,
    },
    {
      accessorKey: "module",
      header: ({ column }) => <HeaderWithSort column={column} title="Module" />,
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
          {row.original.module}
        </span>
      ),
    },
    {
      accessorKey: "fileName",
      header: ({ column }) => <HeaderWithSort column={column} title="File Name" />,
      cell: ({ row }) => (
        <span className="text-xs sm:text-sm text-gray-700">{row.original.fileName || "—"}</span>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => <HeaderWithSort column={column} title="Permission Name" />,
      cell: ({ row }) => (
        <div className="font-medium text-gray-900 text-xs sm:text-sm">{row.original.name}</div>
      ),
    },
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ row }) => (
        <HoverTooltip
          preview={row.original.url?.substring(0, 30) + (row.original.url?.length > 30 ? '...' : '')}
          full={row.original.url}
          title="URL Path"
          className="text-xs sm:text-sm font-mono"
        />
      ),
    },
   
    {
      accessorKey: "Actions",
      header: () => <div className="text-center">Actions</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const permission = row.original;
        return (
          <div className="flex justify-center gap-2">
            <ButtonTooltip tooltipText="Edit Permission" position="top">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleEditClick(permission)}
                className="!p-1.5 !min-w-0"
              >
                <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </ButtonTooltip>

            <ButtonTooltip tooltipText="Update Status" position="top">
              <Button
                variant="warning"
                size="sm"
                onClick={() => handleStatusClick(permission)}
                className="!p-1.5 !min-w-0"
              >
                <Power className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </ButtonTooltip>
          </div>
        );
      },
    },
  ], [handleEditClick, handleStatusClick]);

  // ── Render ───────────────────────────────────────────────────────────────

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
          <span className="text-xl sm:text-2xl font-bold text-gray-800">Permission Management</span>
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setModalSuccess(null);
              setModalError(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 flex-1 sm:flex-initial text-sm sm:text-base px-4 py-2"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Add Permission</span>
          </Button>
        </div>
      </Card>

      <HomeTable
        data={permissions}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPaginationChange={(page, pageSize) =>
          setPagination(p => ({ ...p, page, page_size: pageSize }))
        }
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
        serverSideFiltering={true}
        error={error}
        onRetry={handleRetry}
        hideDefaultActions
        noDataMessage="No permissions found"
      />

      {/* ── Status Modal ─────────────────────────────────────────────── */}
      <StatusUpdateModal
        isOpen={showStatusModal}
        onClose={() => { setShowStatusModal(false); setSelectedPermission(null); }}
        permission={selectedPermission}
        onUpdate={handleChangeStatus}
      />

      {/* ── CREATE Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); setModalSuccess(null); setModalError(null); }}
        title="Add Permission"
        size="md"
      >
        <div className="p-4 sm:p-6">
          {modalSuccess && (
            <div className="mb-4 sm:mb-6">
              <Alert variant="success" message={modalSuccess} />
            </div>
          )}
          {modalError && (
            <div className="mb-4 sm:mb-6">
              <Alert variant="error" message={modalError} />
            </div>
          )}

          <form onSubmit={handleCreatePermission}>
            <div className="space-y-4 mb-6">

              {/* FIX: fileName is required query param for save endpoint */}
              <InputText
                label="File Name"
                name="fileName"
                value={formData.fileName}
                onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                error={formErrors.fileName ? { message: formErrors.fileName } : null}
                required
                placeholder="e.g., Dashboard, Sell Medicine"
                className="w-full"
                inputClassName="text-sm"
              />

              <InputText
                label="Module"
                name="module"
                value={formData.module}
                onChange={(e) => setFormData({ ...formData, module: e.target.value.toUpperCase() })}
                error={formErrors.module ? { message: formErrors.module } : null}
                required
                placeholder="e.g., EMP, INV, POS"
                className="w-full"
                inputClassName="text-sm"
              />

              <InputText
                label="Permission Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name ? { message: formErrors.name } : null}
                required
                placeholder="e.g., Save or Update employee"
                className="w-full"
                inputClassName="text-sm"
              />

              <InputText
                key={urlInputKey}
                label="URL"
                name="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                error={formErrors.url ? { message: formErrors.url } : null}
                required
                placeholder="e.g., /employee/save"
                className="w-full"
                inputClassName="text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowCreateModal(false); resetForm(); setModalSuccess(null); setModalError(null); }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                loading={isSubmitting}
                loadingText="Saving..."
                className="w-full sm:w-auto"
              >
                Add Permission
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── EDIT Modal ───────────────────────────────────────────────── */}
      {/*
        FIX: README only supports updating the name via PUT /update?status=updateName
        Module, fileName, and URL are shown read-only so the user understands
        what they're editing, but only name is sent to the API.
      */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedPermission(null); resetForm(); setModalSuccess(null); setModalError(null); }}
        title="Edit Permission"
        size="md"
      >
        <div className="p-4 sm:p-6">
          {modalSuccess && (
            <div className="mb-4 sm:mb-6">
              <Alert variant="success" message={modalSuccess} />
            </div>
          )}
          {modalError && (
            <div className="mb-4 sm:mb-6">
              <Alert variant="error" message={modalError} />
            </div>
          )}

          <form onSubmit={handleEditPermission}>
            <div className="space-y-4 mb-6">

              {/* Read-only context fields */}
              <InputText
                label="File Name"
                name="fileName"
                value={formData.fileName}
                disabled
                className="w-full opacity-60"
                inputClassName="text-sm bg-gray-50 cursor-not-allowed"
              />

              <InputText
                label="Module"
                name="module"
                value={formData.module}
                disabled
                className="w-full opacity-60"
                inputClassName="text-sm bg-gray-50 cursor-not-allowed"
              />

              {/* Editable */}
              <InputText
                label="Permission Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name ? { message: formErrors.name } : null}
                required
                className="w-full"
                inputClassName="text-sm"
              />

              {/* Read-only */}
              <InputText
                key={urlInputKey}
                label="URL"
                name="url"
                value={formData.url}
                disabled
                className="w-full opacity-60"
                inputClassName="text-sm bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowEditModal(false); setSelectedPermission(null); resetForm(); setModalSuccess(null); setModalError(null); }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                loading={isSubmitting}
                loadingText="Updating..."
                className="w-full sm:w-auto"
              >
                Update Permission
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}