import React, { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../../../services/tokenUtils';
import { apiEndpoints } from '../../../services/apiEndpoints';

const ALL_ROLES = [
  'DASHBOARD',  
  'POS',
  'SEARCH',
  'INVENTORY',
  'SALES',
  'ORDER_MANAGEMENT',
  'RECOMMENDATION',
  'MANAGE_BRANCH',
  'MANAGE_EMPLOYEE',
  'MANAGE_SUPPLIER',
  'CSV_UPLOAD',
  'SCHEDULE',
  'CASH_BOOK'
];

const LABELS = {
  DASHBOARD: 'Dashboard',
  SEARCH: 'Search',
  INVENTORY: 'Inventory',
  SALES: 'Sales',
  RECOMMENDATION: 'Recommendation',
  POS: 'Point of Sale',
  ORDER_MANAGEMENT: 'Order Management',
  MANAGE_BRANCH: 'Manage Branch',
  MANAGE_EMPLOYEE: 'Manage Employee',
  MANAGE_SUPPLIER: 'Manage Supplier',
  CSV_UPLOAD: 'CSV Upload',
  SCHEDULE: 'Schedule',
  CASH_BOOK: 'Cash Book'
};

export default function BranchPermissionView() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { branch, existingRoles = [], permissions = {} } = state || {};

  const [selected, setSelected] = useState(() => {
    const init = {};
    if (branch) {
      ALL_ROLES.forEach((role) => {
        const key =
          role === 'POS'
            ? 'pointOfSale'
            : role === 'ORDER_MANAGEMENT'
            ? 'orderManagement'
            : role.toLowerCase();

        if (Object.keys(permissions).length > 0) {
          init[key] = !!permissions[key];
        } else {
          init[key] = existingRoles.includes(role);
        }
      });
    }
    return init;
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFinalRoles, setPendingFinalRoles] = useState([]);

  const toggle = useCallback((e) => {
    const { name, checked } = e.target;
    setSelected((prev) => ({ ...prev, [name]: checked }));
  }, []);

  const getFinalRolesToAssign = () => {
    return Object.entries(selected)
      .filter(([, checked]) => checked)
      .map(([key]) => {
        if (key === 'pointOfSale') return 'POS';
        if (key === 'orderManagement') return 'ORDER_MANAGEMENT';
        return key.toUpperCase();
      });
  };

  const proceedWithSave = async (finalRoles) => {
    setSaving(true);
    try {
      const token = getToken();
      await axios.post(
        apiEndpoints.assignBranchPermissions,
        { branchId: branch.id, roles: finalRoles },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          timeout: 10000,
        }
      );

      setMsg({ text: 'Permissions updated successfully!', type: 'success' });

      setTimeout(() => {
        setMsg((prev) => (prev.type === 'success' ? { text: '', type: '' } : prev));
      }, 5000);
    } catch (e) {
      const txt = e.response?.data?.message || 'Failed to save permissions.';
      setMsg({ text: txt, type: 'error' });
    } finally {
      setSaving(false);
      setShowConfirmModal(false);
      setPendingFinalRoles([]);
    }
  };

  const save = async () => {
    setMsg({ text: '', type: '' });
    const finalRoles = getFinalRolesToAssign();

    const hasChanges =
      finalRoles.length !== existingRoles.length ||
      !finalRoles.every((r) => existingRoles.includes(r)) ||
      !existingRoles.every((r) => finalRoles.includes(r));

    if (!hasChanges) {
      setMsg({ text: 'No changes to save.', type: 'info' });
      return;
    }

    const removedCount = existingRoles.filter((r) => !finalRoles.includes(r)).length;
    if (removedCount > 0) {
      setPendingFinalRoles(finalRoles);
      setShowConfirmModal(true);
      return;
    }

    await proceedWithSave(finalRoles);
  };

  const cancel = () => navigate(-1);

  return (
    <>
      {/* Main Content */}
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Heading */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Branch Permissions</h2>
              <button
                onClick={cancel}
                className="text-2xl text-gray-500 hover:text-gray-700 transition"
              >
                X
              </button>
            </div>

            {/* Success Message */}
            {msg.type === 'success' && msg.text && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800 animate-fadeIn">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">{msg.text}</span>
                <button
                  onClick={() => setMsg({ text: '', type: '' })}
                  className="ml-auto hover:bg-green-100 p-1 rounded transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <p className="text-gray-600 mb-6">
              Permissions for <strong>{branch?.name || '—'}</strong> (ID: {branch?.id})
            </p>

            {/* Preview: Final Permissions */}
            <div className="mb-6 p-5 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">
                Preview: Final Assigned Permissions
              </h3>
              <div className="flex flex-wrap gap-2">
                {getFinalRolesToAssign().length > 0 ? (
                  getFinalRolesToAssign().map((role) => (
                    <span
                      key={role}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                    >
                      {LABELS[role] || role}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 italic">None</span>
                )}
              </div>
            </div>

            {/* Add/Remove Permissions */}
            <div className="p-5 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-4 text-gray-800">
                Add/Remove Permissions
              </h3>
              <div className="space-y-3">
                {ALL_ROLES.map((role) => {
                  const key =
                    role === 'POS'
                      ? 'pointOfSale'
                      : role === 'ORDER_MANAGEMENT'
                      ? 'orderManagement'
                      : role.toLowerCase();

                  const isChecked = !!selected[key];
                  const wasAssigned = existingRoles.includes(role);

                  return (
                    <label
                      key={role}
                      className="flex items-center space-x-3 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        name={key}
                        checked={isChecked}
                        onChange={toggle}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700 font-medium">
                        {LABELS[role]}
                      </span>

                      {wasAssigned && !isChecked && (
                        <span className="text-xs text-red-600 font-medium">
                          (will be removed)
                        </span>
                      )}
                      {wasAssigned && isChecked && (
                        <span className="text-xs text-green-600">
                          (already assigned)
                        </span>
                      )}
                      {!wasAssigned && isChecked && (
                        <span className="text-xs text-blue-600">
                          (will be added)
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Messages & Buttons */}
            <div className="mt-8">
              {msg.text && msg.type !== 'success' && (
                <div className="mb-4">
                  <div
                    className={`p-3 rounded-lg text-sm font-medium ${
                      msg.type === 'info'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={cancel}
                  className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition"
                >
                  Back
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                >
                  {saving && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  {saving ? 'Saving…' : 'Save Permissions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              setShowConfirmModal(false);
              setPendingFinalRoles([]);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-fadeIn border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Confirm Removal
            </h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              You are removing{' '}
              <strong className="text-red-600">
                {existingRoles.filter((r) => !pendingFinalRoles.includes(r)).length}
              </strong>{' '}
              permission(s). This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingFinalRoles([]);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => proceedWithSave(pendingFinalRoles)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {saving && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}