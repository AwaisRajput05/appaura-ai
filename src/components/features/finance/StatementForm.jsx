import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { getToken } from '../../../services/tokenUtils';
import apiService from '../../../services/apiService';
import { MessageAlert } from '../../common/message/MessageAlert';
import { apiEndpoints } from '../../../services/apiEndpoints';

export default function StatementForm({ onSubmit }) {
  const { user } = useAuth();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEdit = !!id;

  const getInitialStatement = () => {
    const defaultStatement = {
      id: '',
      period: '',
      profit: 0,
      loss: 0,
      net: 0,
      status: 'Pending',
      statementDescription: '',
      startDate: '',
      endDate: '',
      companyName: '',
      fiscalYear: '',
    };

    if (isEdit && location.state?.statement) {
      return {
        ...defaultStatement,
        ...location.state.statement,
        id: id,
      };
    }

    return defaultStatement;
  };

  const [formData, setFormData] = useState(getInitialStatement());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profitError, setProfitError] = useState('');
  const [lossError, setLossError] = useState('');
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const newInitialStatement = getInitialStatement();
    setFormData(newInitialStatement);
    setProfitError('');
    setLossError('');
    setStartDateError('');
    setEndDateError('');
    setError(null);
  }, [location.state?.statement, isEdit, id]);

  useEffect(() => {
    if (formData.profit !== undefined && formData.loss !== undefined) {
      const calculatedNet = formData.profit - formData.loss;
      setFormData((prev) => ({ ...prev, net: calculatedNet }));
    }
  }, [formData.profit, formData.loss]);

  const handleProfitChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, profit: parseFloat(value) || 0 }));
    if (value !== '' && parseFloat(value) < 0) {
      setProfitError('Profit cannot be negative');
    } else {
      setProfitError('');
    }
  };

  const handleLossChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, loss: parseFloat(value) || 0 }));
    if (value !== '' && parseFloat(value) < 0) {
      setLossError('Loss cannot be negative');
    } else {
      setLossError('');
    }
  };

  const handleStartDateChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, startDate: value }));
    if (value) {
      const selectedDate = new Date(value);
      const selectedYear = selectedDate.getFullYear();
      if (selectedYear < currentYear) {
        setStartDateError(`Start Date must be in ${currentYear} or later`);
      } else {
        setStartDateError('');
      }
      if (formData.endDate) {
        const endDate = new Date(formData.endDate);
        if (new Date(value) > endDate) {
          setEndDateError('Start Date must be before End Date');
        } else {
          setEndDateError('');
        }
      }
    } else {
      setStartDateError('Start Date is required');
    }
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, endDate: value }));
    if (value) {
      const selectedDate = new Date(value);
      const selectedYear = selectedDate.getFullYear();
      if (selectedYear < currentYear) {
        setEndDateError(`End Date must be in ${currentYear} or later`);
      } else {
        setEndDateError('');
      }
      if (formData.startDate) {
        const startDate = new Date(formData.startDate);
        if (selectedDate < startDate) {
          setEndDateError('End Date must be after Start Date');
        } else {
          setStartDateError('');
        }
      }
    } else {
      setEndDateError('End Date is required');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'profit') {
      handleProfitChange(e);
      return;
    }
    if (name === 'loss') {
      handleLossChange(e);
      return;
    }
    if (name === 'startDate') {
      handleStartDateChange(e);
      return;
    }
    if (name === 'endDate') {
      handleEndDateChange(e);
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!user?.userId) throw new Error('User ID is required');
      if (!formData.period || formData.period.trim() === '') {
        setError('Period is required');
        setLoading(false);
        return;
      }
      if (!formData.startDate) {
        setStartDateError('Start Date is required');
        setLoading(false);
        return;
      }
      if (!formData.endDate) {
        setEndDateError('End Date is required');
        setLoading(false);
        return;
      }
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (startDate > endDate) {
        setError('Start Date must be before End Date');
        setLoading(false);
        return;
      }
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      if (startYear < currentYear || endYear < currentYear) {
        setError(`Dates must be in ${currentYear} or later`);
        setLoading(false);
        return;
      }
      if (formData.profit < 0) {
        setProfitError('Profit cannot be negative');
        setLoading(false);
        return;
      }
      if (formData.loss < 0) {
        setLossError('Loss cannot be negative');
        setLoading(false);
        return;
      }
      const calculatedNet = formData.profit - formData.loss;
      setFormData((prev) => ({ ...prev, net: calculatedNet }));

      const token = getToken();
      console.log('Token used:', token); // Debug token
      if (!token) throw new Error('Authentication token is missing or invalid');

      const formattedData = { ...formData };
      delete formattedData.id;
      delete formattedData.net;

      const response =
        isEdit && id
          ? await apiService.put(
              apiEndpoints.updateStatement(id), // Centralized update endpoint
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
              apiEndpoints.createStatement, // Centralized create endpoint
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
        throw new Error(`Failed to ${isEdit ? 'update' : 'create'} statement`);

      navigate('/admin-vendors/finance-management/statement', {
        state: {
          message: isEdit
            ? 'Statement updated successfully'
            : 'Statement created successfully',
        },
      });
    } catch (err) {
      console.error('Error submitting statement:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        userId: user?.userId,
        statementId: id,
        errorName: err.name,
        errorStack: err.stack,
        formData: formData,
        url:
          isEdit && id
            ? apiEndpoints.updateStatement(id)
            : apiEndpoints.createStatement,
      });

      if (!user?.userId) {
        setError('Please log in to create a statement.');
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
            'Failed to submit statement. Please check all required fields and try again.'
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
              {isEdit ? 'Edit Statement' : 'Create New Statement'}
            </h2>

            {error && (
              <MessageAlert
                variant="error"
                message={error}
                onClose={() => setError(null)}
                action={() => setError(null)}
                actionLabel="Try Again"
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
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
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Format: YYYY-MM (e.g., 2025-01 for January 2025)
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate || ''}
                    onChange={handleStartDateChange}
                    className={`block w-full rounded-md border shadow-sm focus:ring-indigo-500 sm:text-sm ${
                      startDateError
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                    required
                  />
                  {startDateError && (
                    <p className="mt-1 text-xs text-red-600">
                      {startDateError}
                    </p>
                  )}
                  {!startDateError && (
                    <p className="mt-1 text-xs text-gray-500">
                      Start Date must be in {currentYear} or later
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate || ''}
                    onChange={handleEndDateChange}
                    className={`block w-full rounded-md border shadow-sm focus:ring-indigo-500 sm:text-sm ${
                      endDateError
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                    required
                  />
                  {endDateError && (
                    <p className="mt-1 text-xs text-red-600">{endDateError}</p>
                  )}
                  {!endDateError && (
                    <p className="mt-1 text-xs text-gray-500">
                      End Date must be in {currentYear} or later
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="profit"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Profit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="profit"
                    name="profit"
                    value={formData.profit || ''}
                    onChange={handleProfitChange}
                    step="0.01"
                    placeholder="0.00"
                    className={`block w-full rounded-md border shadow-sm focus:ring-indigo-500 sm:text-sm ${
                      profitError
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                    required
                  />
                  {profitError && (
                    <p className="mt-1 text-xs text-red-600">{profitError}</p>
                  )}
                  {!profitError && (
                    <p className="mt-1 text-xs text-gray-500">
                      Profit amount (cannot be negative)
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="loss"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Loss <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="loss"
                    name="loss"
                    value={formData.loss || ''}
                    onChange={handleLossChange}
                    step="0.01"
                    placeholder="0.00"
                    className={`block w-full rounded-md border shadow-sm focus:ring-indigo-500 sm:text-sm ${
                      lossError
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                    required
                  />
                  {lossError && (
                    <p className="mt-1 text-xs text-red-600">{lossError}</p>
                  )}
                  {!lossError && (
                    <p className="mt-1 text-xs text-gray-500">
                      Loss amount (cannot be negative)
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="net"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Net (Profit - Loss)
                  </label>
                  <input
                    type="number"
                    id="net"
                    name="net"
                    value={formData.net}
                    readOnly
                    step="0.01"
                    className="block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Auto-calculated from Profit - Loss
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status || ''}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Finalized">Finalized</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="statementDescription"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Statement Description
                  </label>
                  <textarea
                    id="statementDescription"
                    name="statementDescription"
                    rows={3}
                    placeholder="Enter statement description..."
                    value={formData.statementDescription || ''}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="pt-5">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/admin-vendors/finance-management/statement')
                    }
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !!profitError ||
                      !!lossError ||
                      !!startDateError ||
                      !!endDateError ||
                      !formData.startDate ||
                      !formData.endDate ||
                      !formData.period
                    }
                    className={`inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      loading ||
                      profitError ||
                      lossError ||
                      startDateError ||
                      endDateError ||
                      !formData.startDate ||
                      !formData.endDate ||
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
                      ? 'Update Statement'
                      : 'Create Statement'}
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
