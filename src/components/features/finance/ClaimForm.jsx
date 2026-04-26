import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { getToken } from '../../../services/tokenUtils';
import apiService from '../../../services/apiService';
import { MessageAlert } from '../../common/message/MessageAlert';
import { apiEndpoints } from '../../../services/apiEndpoints';

export default function ClaimForm() {
  const { user } = useAuth();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEdit = !!id;

  const getInitialClaim = () => {
    const today = new Date().toISOString().slice(0, 10);
    const defaultClaim = {
      id: '',
      claimNumber: '',
      patientId: '',
      amount: 0,
      reconciliationDate: '',
      status: 'Pending',
    };

    if (isEdit && location.state?.claim) {
      const claim = location.state.claim;
      return {
        ...defaultClaim,
        claimNumber: claim.claimNumber || '',
        patientId: claim.patientId || '',
        amount: claim.amount || 0,
        reconciliationDate: claim.reconciliationDate || '',
        status: claim.reconciled ? 'Reconciled' : 'Pending',
        id: id,
      };
    }

    return defaultClaim;
  };

  const [formData, setFormData] = useState(getInitialClaim());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [reconciliationDateError, setReconciliationDateError] = useState('');

  useEffect(() => {
    const newInitialClaim = getInitialClaim();
    setFormData(newInitialClaim);
    setAmountError('');
    setReconciliationDateError('');
    setError(null);
  }, [location.state?.claim, isEdit, id]);

  // Get current year for validation
  const currentYear = new Date().getFullYear();

  const handleAmountChange = (e) => {
    const value = e.target.value;
    const name = e.target.name;

    setFormData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));

    if (value !== '' && parseFloat(value) <= 0) {
      setAmountError('Amount must be greater than 0');
    } else if (value === '' || parseFloat(value) > 0) {
      setAmountError('');
    }
  };

  const handleReconciliationDateChange = (e) => {
    const value = e.target.value;
    const name = e.target.name;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate only if status is Reconciled
    if (formData.status === 'Reconciled') {
      if (value) {
        const selectedDate = new Date(value);
        const selectedYear = selectedDate.getFullYear();

        if (selectedYear < currentYear) {
          setReconciliationDateError(
            `Reconciliation Date must be in ${currentYear} or later`
          );
        } else {
          setReconciliationDateError('');
        }
      } else {
        setReconciliationDateError(
          'Reconciliation Date is required when status is Reconciled'
        );
      }
    } else {
      setReconciliationDateError('');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'amount') {
      handleAmountChange(e);
      return;
    }

    if (name === 'reconciliationDate') {
      handleReconciliationDateChange(e);
      return;
    }

    // Handle status change specially
    if (name === 'status') {
      setFormData((prev) => {
        const newData = {
          ...prev,
          [name]: value,
          reconciliationDate:
            value === 'Pending' ? '' : prev.reconciliationDate,
        };

        // Validate date after status change
        if (value === 'Reconciled') {
          if (!newData.reconciliationDate) {
            setReconciliationDateError(
              'Reconciliation Date is required when status is Reconciled'
            );
          } else {
            const selectedYear = new Date(
              newData.reconciliationDate
            ).getFullYear();
            if (selectedYear < currentYear) {
              setReconciliationDateError(
                `Reconciliation Date must be in ${currentYear} or later`
              );
            } else {
              setReconciliationDateError('');
            }
          }
        } else {
          setReconciliationDateError('');
        }

        return newData;
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!user?.userId) {
        throw new Error('User ID is required');
      }

      if (!formData.claimNumber || formData.claimNumber.trim() === '') {
        setError('Claim Number is required');
        setLoading(false);
        return;
      }

      if (!formData.patientId || formData.patientId.trim() === '') {
        setError('Patient ID is required');
        setLoading(false);
        return;
      }

      if (!formData.status || formData.status === '') {
        setError('Status is required');
        setLoading(false);
        return;
      }

      if (!formData.amount || formData.amount <= 0) {
        setAmountError('Amount must be greater than 0');
        setLoading(false);
        return;
      }

      const reconciled = formData.status === 'Reconciled';

      let reconciliationDate = null;

      if (reconciled) {
        if (
          !formData.reconciliationDate ||
          formData.reconciliationDate === ''
        ) {
          setReconciliationDateError(
            'Reconciliation Date is required when status is Reconciled'
          );
          setLoading(false);
          return;
        }

        const selectedDate = new Date(formData.reconciliationDate);
        const selectedYear = selectedDate.getFullYear();

        if (selectedYear < currentYear) {
          setReconciliationDateError(
            `Reconciliation Date must be in ${currentYear} or later`
          );
          setLoading(false);
          return;
        }

        reconciliationDate = formData.reconciliationDate;
      }

      const token = getToken();
      if (!token) {
        throw new Error('Authentication token is missing or invalid');
      }

      const formattedData = {
        claimNumber: formData.claimNumber,
        patientId: formData.patientId,
        amount: formData.amount,
        status: 'SUBMITTED',
        reconciled: reconciled,
        reconciliationDate: reconciliationDate,
      };

      // Remove id for create operation
      if (!isEdit) {
        delete formattedData.id;
      }

      const response =
        isEdit && id
          ? await apiService.put(
              apiEndpoints.updateClaim(id), // Use centralized endpoint for update
              formattedData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                },
              }
            )
          : await apiService.post(
              apiEndpoints.createClaim, // Use centralized endpoint for create
              formattedData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                },
              }
            );

      if (!response.data)
        throw new Error(`Failed to ${isEdit ? 'update' : 'create'} claim`);
      console.log(
        `Claim ${isEdit ? 'updated' : 'created'} successfully`,
        response.data
      );

      navigate('/admin-vendors/finance-management/claim', {
        state: {
          message: isEdit
            ? 'Claim updated successfully'
            : 'Claim created successfully',
        },
      });
    } catch (err) {
      console.error('Error submitting claim:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        userId: user?.userId,
        claimId: id,
        errorName: err.name,
        errorStack: err.stack,
        formData: formData,
        url:
          isEdit && id
            ? apiEndpoints.updateClaim(id)
            : apiEndpoints.createClaim, // Updated error logging
      });

      if (!user?.userId) {
        setError('Please log in to create a claim.');
      } else if (!token) {
        setError('Authentication failed. Please log in again.');
      } else if (
        err.message.includes('Network Error') ||
        err.message.includes('CORS')
      ) {
        setError(
          'Network error occurred. Please check your connection and try again.'
        );
      } else if (err.response?.status === 400) {
        setError(
          err.response.data?.message ||
            'Bad request. Please check the form data.'
        );
      } else if (err.response?.status === 401) {
        setError('Unauthorized. Please log in again.');
      } else if (err.response?.status === 403) {
        setError(
          'Forbidden. You do not have permission to perform this action.'
        );
      } else if (err.response?.status === 404) {
        setError('Endpoint not found. Please check the server configuration.');
      } else {
        const errorDetails = err.response?.data?.message || err.message;
        setError(
          errorDetails ||
            'Failed to submit claim. Please check all required fields and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900 mb-6">
              {isEdit ? 'Edit Claim' : 'Create New Claim'}
            </h2>

            {error && (
              <MessageAlert
                variant="error"
                message={error}
                onClose={() => setError(null)}
                action={() => {
                  setError(null);
                }}
                actionLabel="Try Again"
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Claim Number Field - Required */}
                <div>
                  <label
                    htmlFor="claimNumber"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Claim Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="claimNumber"
                    name="claimNumber"
                    value={formData.claimNumber || ''}
                    onChange={handleChange}
                    placeholder="Enter claim number"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                {/* Patient ID Field - Required */}
                <div>
                  <label
                    htmlFor="patientId"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Patient ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="patientId"
                    name="patientId"
                    value={formData.patientId || ''}
                    onChange={handleChange}
                    placeholder="Enter patient ID"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                {/* Amount Field - Required with validation */}
                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount || ''}
                    onChange={handleAmountChange}
                    step="0.01"
                    placeholder="0.00"
                    className={`block w-full rounded-md border shadow-sm focus:ring-indigo-500 sm:text-sm ${
                      amountError
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                    required
                  />
                  {amountError && (
                    <p className="mt-1 text-xs text-red-600">{amountError}</p>
                  )}
                  {!amountError && (
                    <p className="mt-1 text-xs text-gray-500">
                      Amount must be greater than 0
                    </p>
                  )}
                </div>

                {/* Status Field - Required */}
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status || ''}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Reconciled">Reconciled</option>
                  </select>
                </div>

                {/* Reconciliation Date Field - Conditional */}
                <div>
                  <label
                    htmlFor="reconciliationDate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Reconciliation Date{' '}
                    {formData.status === 'Reconciled' && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    type="date"
                    id="reconciliationDate"
                    name="reconciliationDate"
                    value={formData.reconciliationDate || ''}
                    onChange={handleReconciliationDateChange}
                    className={`block w-full rounded-md border shadow-sm focus:ring-indigo-500 sm:text-sm ${
                      reconciliationDateError
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                  {reconciliationDateError && (
                    <p className="mt-1 text-xs text-red-600">
                      {reconciliationDateError}
                    </p>
                  )}
                  {!reconciliationDateError &&
                    formData.status === 'Reconciled' && (
                      <p className="mt-1 text-xs text-gray-500">
                        Reconciliation Date must be in {currentYear} or later
                      </p>
                    )}
                </div>
              </div>

              <div className="pt-5">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/admin-vendors/finance-management/claim')
                    }
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading || !!amountError || !!reconciliationDateError
                    }
                    className={`inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      loading || amountError || reconciliationDateError
                        ? 'bg-indigo-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                    }`}
                  >
                    {loading ? (
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : null}
                    {loading
                      ? 'Saving...'
                      : isEdit
                      ? 'Update Claim'
                      : 'Create Claim'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
