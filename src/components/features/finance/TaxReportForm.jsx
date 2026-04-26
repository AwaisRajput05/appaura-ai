import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { getToken } from '../../../services/tokenUtils';
import apiService from '../../../services/apiService';
import { MessageAlert } from '../../common/message/MessageAlert';
import { apiEndpoints } from '../../../services/apiEndpoints';

export default function TaxRecordForm() {
  const { user } = useAuth();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEdit = !!id;

  const getInitialTaxRecord = () => {
    const defaultTaxRecord = {
      id: '',
      period: '',
      amount: 0,
      compliant: false,
    };

    if (isEdit && location.state?.record) {
      return {
        ...defaultTaxRecord,
        ...location.state.record,
        id: id,
      };
    }

    return defaultTaxRecord;
  };

  const [formData, setFormData] = useState(getInitialTaxRecord());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [periodError, setPeriodError] = useState('');

  useEffect(() => {
    const newInitialTaxRecord = getInitialTaxRecord();
    setFormData(newInitialTaxRecord);
    setAmountError('');
    setPeriodError('');
    setError(null);
  }, [location.state?.record, isEdit, id]);

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

  const handlePeriodChange = (e) => {
    const value = e.target.value;
    const name = e.target.name;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (!value) {
      setPeriodError('Period is required');
    } else {
      setPeriodError('');
    }
  };

  const handleCompliantChange = (e) => {
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      compliant: checked,
    }));
  };

  const handleChange = (e) => {
    const { name } = e.target;

    if (name === 'amount') {
      handleAmountChange(e);
      return;
    }

    if (name === 'period') {
      handlePeriodChange(e);
      return;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!user?.userId) {
        throw new Error('User ID is required');
      }

      if (!formData.period || formData.period === '') {
        setPeriodError('Period is required');
        setLoading(false);
        return;
      }

      if (!formData.amount || formData.amount <= 0) {
        setAmountError('Amount must be greater than 0');
        setLoading(false);
        return;
      }

      const token = getToken();
      if (!token) {
        throw new Error('Authentication token is missing or invalid');
      }

      const formattedData = { ...formData };
      delete formattedData.id; // Remove id as API generates it for create

      const response =
        isEdit && id
          ? await apiService.put(
              apiEndpoints.updateTaxRecord(id), // Centralized update endpoint
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
              apiEndpoints.createTaxRecord, // Centralized create endpoint
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
        throw new Error(`Failed to ${isEdit ? 'update' : 'create'} tax record`);
      console.log(
        `Tax record ${isEdit ? 'updated' : 'created'} successfully`,
        response.data
      );

      navigate('/admin-vendors/finance-management/taxrecord', {
        state: {
          message: isEdit
            ? 'Tax record updated successfully'
            : 'Tax record created successfully',
        },
      });
    } catch (err) {
      console.error('Error submitting tax record:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        userId: user?.userId,
        taxRecordId: id,
        errorName: err.name,
        errorStack: err.stack,
        formData: formData,
        url:
          isEdit && id
            ? apiEndpoints.updateTaxRecord(id)
            : apiEndpoints.createTaxRecord,
      });

      if (!user?.userId) {
        setError('Please log in to create a tax record.');
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
      } else {
        const errorDetails = err.response?.data?.message || err.message;
        setError(
          errorDetails ||
            'Failed to submit tax record. Please check all required fields and try again.'
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
              {isEdit ? 'Edit Tax Record' : 'Create New Tax Record'}
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
                {/* Period Field - Required */}
                <div>
                  <label
                    htmlFor="period"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Period <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    id="period"
                    name="period"
                    value={formData.period || ''}
                    onChange={handlePeriodChange}
                    className={`block w-full rounded-md border shadow-sm focus:ring-indigo-500 sm:text-sm ${
                      periodError
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                    required
                  />
                  {periodError && (
                    <p className="mt-1 text-xs text-red-600">{periodError}</p>
                  )}
                  {!periodError && (
                    <p className="mt-1 text-xs text-gray-500">
                      Select the tax period (YYYY-MM)
                    </p>
                  )}
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

                {/* Compliant Field - Boolean */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="compliant"
                    name="compliant"
                    checked={formData.compliant}
                    onChange={handleCompliantChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="compliant"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Compliant
                  </label>
                </div>
              </div>

              <div className="pt-5">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/admin-vendors/finance-management/taxrecord')
                    }
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !!amountError ||
                      !formData.amount ||
                      formData.amount <= 0 ||
                      !!periodError ||
                      !formData.period
                    }
                    className={`inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      loading ||
                      amountError ||
                      !formData.amount ||
                      formData.amount <= 0 ||
                      periodError ||
                      !formData.period
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
                      ? 'Update Tax Record'
                      : 'Create Tax Record'}
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
