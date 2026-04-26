import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import { apiEndpoints } from '../../../services/apiEndpoints';

export default function TemplateForm() {
  const { id } = useParams();
  console.log('Template Form - ID from params:', id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState({
    title: '',
    type: 'Discount',
    description: '',
    termsAndConditions: '',
    targetAudience: ['ALL_CUSTOMERS'],
    status: 'Active',
  });

  const [error, setError] = useState(null);

  const fetchTemplate = useCallback(async () => {
    try {
      console.log('Fetching template data for ID:', id);
      const response = await apiService.get(apiEndpoints.getTemplate(id));
      console.log('Template data received:', response.data);
      if (!response.data) {
        throw new Error('Template not found');
      }
      setTemplate({
        title: response.data.title || '',
        type: response.data.type || 'Discount',
        description: response.data.description || '',
        termsAndConditions: response.data.termsAndConditions || '',
        targetAudience: response.data.targetAudience || ['ALL_CUSTOMERS'],
        status: response.data.status || 'Active',
      });
      setError(null);
    } catch (error) {
      console.error('Error fetching template:', error);
      setError(
        error.response?.status === 404
          ? 'Template not found. It may have been deleted or moved.'
          : 'Failed to load template. Please try again later.'
      );
      navigate('/admin-vendors/offers-management/templates', {
        state: { error: 'Template not found or inaccessible' },
      });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    console.log('useEffect triggered with id:', id);
    if (id) {
      fetchTemplate();
    } else {
      setLoading(false);
    }
  }, [id, fetchTemplate]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const endpoint = id
        ? apiEndpoints.updateTemplate(id)
        : apiEndpoints.saveTemplate;
      const method = id ? 'put' : 'post';

      console.log('Submitting template to:', endpoint);
      console.log('Template data:', template);

      const response = await apiService[method](endpoint, template);

      console.log('Server response:', response);

      if (!response.data && !response.status === 200) {
        throw new Error('No response from server');
      }

      navigate('/admin-vendors/offers-management/templates', {
        state: {
          success: id
            ? 'Template updated successfully!'
            : 'Template created successfully!',
        },
      });
    } catch (err) {
      console.error('Error saving template:', err);
      setError(
        err.response?.status === 404
          ? 'Template not found. It may have been deleted or moved.'
          : err.response?.data?.message ||
              'Failed to save template. Please try again later.'
      );

      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTemplate((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAudienceChange = (e) => {
    const value = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setTemplate((prev) => ({
      ...prev,
      targetAudience: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-96 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading template data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4 flex items-center">
          <span className="text-indigo-600 mr-3">{id ? '✏️' : '✨'}</span>
          {id ? 'Edit Template' : 'Create New Template'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-hover:text-indigo-600">
                  Template Name
                </label>
                <input
                  type="text"
                  name="title"
                  value={template.title}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none hover:border-indigo-300"
                  required
                  placeholder="Enter template name..."
                />
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-hover:text-indigo-600">
                  Type
                </label>
                <select
                  name="type"
                  value={template.type}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none hover:border-indigo-300 bg-white"
                >
                  <option value="Discount">🏷️ Discount</option>
                  <option value="Promotion">🎉 Promotion</option>
                  <option value="Seasonal">🌞 Seasonal</option>
                  <option value="Special">⭐ Special</option>
                </select>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-hover:text-indigo-600">
                  Status
                </label>
                <select
                  name="status"
                  value={template.status}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none hover:border-indigo-300 bg-white"
                >
                  <option value="Active">🟢 Active</option>
                  <option value="Inactive">⚪ Inactive</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-hover:text-indigo-600">
                  Description
                </label>
                <textarea
                  name="description"
                  value={template.description}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none hover:border-indigo-300"
                  required
                  placeholder="Enter template description..."
                />
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-hover:text-indigo-600">
                  Terms and Conditions
                </label>
                <textarea
                  name="termsAndConditions"
                  value={template.termsAndConditions}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none hover:border-indigo-300"
                  required
                  placeholder="Enter terms and conditions..."
                />
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-hover:text-indigo-600">
                  Target Audience
                </label>
                <select
                  name="targetAudience"
                  value={template.targetAudience}
                  onChange={handleAudienceChange}
                  multiple
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none hover:border-indigo-300 bg-white min-h-[120px]"
                >
                  <option value="ALL_CUSTOMERS" className="p-2 rounded-md">
                    👥 All Customers
                  </option>
                  <option value="NEW_CUSTOMERS" className="p-2 rounded-md">
                    🌟 New Customers
                  </option>
                  <option value="LOYAL_CUSTOMERS" className="p-2 rounded-md">
                    💎 Loyal Customers
                  </option>
                  <option value="VIP_CUSTOMERS" className="p-2 rounded-md">
                    👑 VIP Customers
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() =>
                navigate('/admin-vendors/offers-management/templates')
              }
              className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 transform hover:scale-105 flex items-center justify-center ${
                isSubmitting
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  {id ? 'Updating...' : 'Creating...'}
                </>
              ) : id ? (
                '✨ Update Template'
              ) : (
                '🚀 Create Template'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
