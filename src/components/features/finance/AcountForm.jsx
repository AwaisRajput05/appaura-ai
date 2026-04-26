import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { getToken } from '../../../services/tokenUtils';
import apiService from '../../../services/apiService';
import { MessageAlert } from '../../common/message/MessageAlert';
import { apiEndpoints } from '../../../services/apiEndpoints';

export default function AccountForm() {
  const { user } = useAuth();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEdit = !!id;

  const getInitialAccount = () => {
    const today = new Date().toISOString().slice(0, 10);
    const defaultAccount = {
      id: '',
      type: 'CREDIT',
      amount: 0,
      party: 'customer',
      dueDate: today,
      status: 'PENDING',
    };

    if (isEdit && location.state?.account) {
      return {
        ...defaultAccount,
        ...location.state.account,
        id: id,
      };
    }

    return defaultAccount;
  };

  const [formData, setFormData] = useState(getInitialAccount());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState('');

  useEffect(() => {
    const newInitialAccount = getInitialAccount();
    setFormData(newInitialAccount);
    setAmountError('');
    setError(null);
  }, [location.state?.account, isEdit, id]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'amount') {
      handleAmountChange(e);
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

      if (!formData.type || formData.type === '') {
        setError('Type is required');
        setLoading(false);
        return;
      }

      if (!formData.party || formData.party === '') {
        setError('Party is required');
        setLoading(false);
        return;
      }

      if (!formData.dueDate || formData.dueDate === '') {
        setError('Due Date is required');
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

      const token = getToken();
      if (!token) {
        throw new Error('Authentication token is missing or invalid');
      }

      const formattedData = { ...formData };
      delete formattedData.id; // Remove id as API generates it for create

      const response =
        isEdit && id
          ? await apiService.put(
              apiEndpoints.updateAccount(id), // Use centralized endpoint for update
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
              apiEndpoints.createAccount, // Use centralized endpoint for create
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
        throw new Error(`Failed to ${isEdit ? 'update' : 'create'} account`);
      console.log(
        `Account ${isEdit ? 'updated' : 'created'} successfully`,
        response.data
      );

      navigate('/admin-vendors/finance-management/account', {
        state: {
          message: isEdit
            ? 'Account updated successfully'
            : 'Account created successfully',
        },
      });
    } catch (err) {
      console.error('Error submitting account:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        userId: user?.userId,
        accountId: id,
        errorName: err.name,
        errorStack: err.stack,
        formData: formData,
        url:
          isEdit && id
            ? apiEndpoints.updateAccount(id)
            : apiEndpoints.createAccount, // Updated error logging
      });

      if (!user?.userId) {
        setError('Please log in to create an account.');
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
            'Failed to submit account. Please check all required fields and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-5 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        {isEdit ? 'Edit Account' : 'Create New Account'}
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

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <label
            htmlFor="type"
            className="block text-sm font-medium text-gray-700"
          >
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            name="type"
            value={formData.type || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select Type</option>
            <option value="CREDIT">Credit</option>
            <option value="DEBIT">Debit</option>
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="party"
            className="block text-sm font-medium text-gray-700"
          >
            Party <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="party"
            name="party"
            value={formData.party || ''}
            onChange={handleChange}
            placeholder="e.g. customer"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="dueDate"
            className="block text-sm font-medium text-gray-700"
          >
            Due Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700"
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
            className={`mt-1 block w-full rounded-md border shadow-sm focus:ring-indigo-500 sm:text-sm ${
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

        <div className="mb-4">
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            Status <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
          </select>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() =>
              navigate('/admin-vendors/finance-management/account')
            }
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              loading ||
              !!amountError ||
              !formData.amount ||
              formData.amount <= 0
            }
            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
              loading || amountError || !formData.amount || formData.amount <= 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading
              ? 'Saving...'
              : isEdit
              ? 'Update Account'
              : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
}
