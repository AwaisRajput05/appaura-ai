
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { offerFormSchema } from '../../common/form/validations/OfferFormSchema';
import FormButton from '../../common/form/button/FormButton';
import Form from '../../common/form/Form';
import { useAuth } from '../../auth/hooks/useAuth';
import { OfferService } from '../../../services/offerService';

export default function OfferForm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialData = state?.offer || {};
  const isEditing = Boolean(initialData?.id);
  const handleSubmit = async (formData) => {
    // Declare variables at the top for access throughout the function
    let startDate, endDate, now, formattedData;

    try {
      setIsSubmitting(true);

      if (!user?.userId) {
        throw new Error('User ID is required');
      }

      // Get the current date and time
      now = new Date();

      // Parse the datetime strings to Date objects, handling time zones properly
      startDate = new Date(formData.startTime);
      endDate = new Date(formData.endTime);

      // Log for debugging

      // Only check if date is not before today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDay = new Date(startDate);
      startDay.setHours(0, 0, 0, 0);

      if (startDay.getTime() < today.getTime()) {
        throw new Error('Start date cannot be before today');
      }

      // Calculate hours difference
      const hoursDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      if (hoursDiff < 24) {
        throw new Error('End date must be at least 24 hours after start date');
      }

//       if (endDate <= startDate) {
//   throw new Error('End date must be after the start date and time');
// }
      // Create dates from the datetime-local inputs
      const formattedData = {
        ...formData,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString()
      };

      // Log initial form data for debugging
      console.log('Submitting form data:', formattedData);

      if (isEditing && initialData?.id) {
        try {
          // Compare and only send changed fields
          console.log('Original data:', initialData);
          console.log('Updated data:', formData);
          await OfferService.updateOffer(initialData.id, formattedData, initialData);
          console.log('Offer updated successfully');
          alert('Offer updated successfully!');
        } catch (error) {
          if (error.message === 'No fields were changed. Please modify at least one field.') {
            alert('Please make changes to at least one field before updating.');
            return;
          }
          throw error; // Re-throw other errors to be handled by the outer catch block
        }
      } else {
        try {
          await OfferService.createOffer(formattedData);
          console.log('Offer created successfully');
        } catch (error) {
          console.error('Create offer error:', error);
          throw error;
        }
      }

      // Navigate with refresh state to trigger data reload
      navigate('/admin-vendors/offers-management/offers', {
        replace: true,
        state: {
          refresh: true,
          message: isEditing ? 'Offer updated successfully' : 'Offer created successfully'
        }
      });
    } catch (error) {
      console.error('Error submitting offer:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        userId: user?.userId,
        offerId: initialData?.id,
        errorName: error.name,
        errorStack: error.stack,
        formData: formattedData // Log the data being sent
      });

      // Show appropriate error message based on error type
      if (!user?.userId) {
        alert('Please log in to create an offer.');
      } else if (error.message.includes('Network Error') || error.message.includes('CORS')) {
        alert('Network error occurred. Please check your connection and try again.');
      } else if (error.response?.data?.message?.includes('Time must not be in the past')) {
        alert('The start date cannot be in the past. Please select a future date.');
      } else {
        const errorDetails = error.response?.data?.message || error.message;
        const errorMessage = errorDetails
          ? `Validation Error: ${errorDetails}`
          : 'Failed to submit offer. Please check all required fields and try again.';
        alert(errorMessage);
      }

      // Log detailed error information for debugging
      console.log('Error Details:', {
        message: error.message,
        responseData: error.response?.data,
        requestData: formattedData,
        status: error.response?.status,
        dates: {
          start: startDate?.toISOString(),
          end: endDate?.toISOString(),
          now: now?.toISOString()
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Offer' : 'Create New Offer'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {isEditing ? 'Update your offer details below.' : 'Fill in the details to create a new offer.'}
          </p>
        </div>
        <Form
          schema={offerFormSchema}
          defaultValues={{
            title: initialData.title || '',
            type: initialData.type || 'DISCOUNT',
            description: initialData.description || '',
            startTime: initialData.startTime
              ? new Date(initialData.startTime).toISOString().slice(0, 16)
              : new Date().toISOString().slice(0, 16), // Default to current time
            endTime: initialData.endTime
              ? new Date(initialData.endTime).toISOString().slice(0, 16)
              : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Default to 24 hours from now
            termsAndConditions: initialData.termsAndConditions || '',
            targetAudience: Array.isArray(initialData.targetAudience)
              ? initialData.targetAudience
              : initialData.targetAudience
                ? [initialData.targetAudience]
                : ['ALL_CUSTOMERS'],
            status: initialData.status || 'ACTIVE',
          }}
          onSubmit={handleSubmit}
          title={isEditing ? 'Edit Offer' : 'Create New Offer'}
          className="bg-white shadow-xl rounded-lg p-8"
          hideSubmitButton={true}
        >
          {({ register, formState: { errors } }) => (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Offer Title
                </label>
                <input
                  type="text"
                  {...register('title')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter offer title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Offer Type
                </label>
                <select
                  {...register('type')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="DISCOUNT">Discount</option>
                  <option value="PROMOTION">Promotion</option>
                  <option value="BUNDLE">Bundle</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter offer description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    {...register('startTime', {
                      required: 'Start date and time is required',
                      validate: value => {
                        const selectedDateTime = new Date(value);
                        // const now = new Date();

                        // Allow any time today (compare only dates, ignore time)
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const selectedDate = new Date(selectedDateTime);
                        selectedDate.setHours(0, 0, 0, 0);

                        if (selectedDate.getTime() < today.getTime()) {
                          return 'Date cannot be before today';
                        }

                        return true;
                      }
                    })}
                    min={new Date().toISOString().slice(0, 16)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 cursor-pointer"
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    {...register('endTime', {
                      required: 'End date and time is required',
                      validate: value => {
                        const startValue = document.querySelector('input[name="startTime"]').value;
                        if (!startValue) return true; // Skip validation if start time is not set

                        const endDateTime = new Date(value);
                        const startDateTime = new Date(startValue);
                        if (endDateTime <= startDateTime) {
                          return 'End date and time must be after start date and time';
                        }
                        return true;
                      }
                    })}
                    min={new Date().toISOString().slice(0, 16)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 cursor-pointer"
                  />
                  {errors.endTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                  )}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Terms & Conditions
                </label>
                <textarea
                  {...register('termsAndConditions')}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter terms and conditions"
                />
                {errors.termsAndConditions && (
                  <p className="mt-1 text-sm text-red-600">{errors.termsAndConditions.message}</p>
                )}
              </div>

              {/* Target Audience */}
              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                  Target Audience
                  <span className="text-xs text-indigo-600 font-normal">Select target markets</span>
                </label>
                <div className="mt-2 space-y-2">
                  {[
                    { value: 'ALL_CUSTOMERS', label: '👥 All Customers', description: 'Available to everyone' },
                    { value: 'NEW_CUSTOMERS', label: '✨ New Customers', description: 'First-time customers only' },
                    { value: 'PAKISTAN', label: '🇵🇰 Pakistan', description: 'Pakistani market only' },
                    // { value: 'INTERNATIONAL', label: '🌏 International', description: 'Global market' },
                    // { value: 'PREMIUM', label: '⭐ Premium', description: 'Premium members only' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="relative flex items-start py-2 px-3 rounded-lg border border-gray-200 hover:border-indigo-500 cursor-pointer transition-all duration-200"
                    >
                      <div className="min-w-0 flex-1 text-sm">
                        <input
                          type="checkbox"
                          {...register('targetAudience')}
                          value={option.value.toString().toUpperCase().trim()}
                          defaultChecked={option.value === 'PAKISTAN'}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-3"
                        />
                        <span className="font-medium text-gray-700">{option.label}</span>
                        <p className="text-xs text-gray-500 mt-1 ml-7">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.targetAudience && (
                  <p className="mt-2 text-sm text-red-600">{errors.targetAudience.message}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-4 pt-6">
                <FormButton
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/admin-vendors/offers-management/offers')}
                >
                  Cancel
                </FormButton>
                <FormButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? (isEditing ? 'Updating...' : 'Creating...')
                    : (isEditing ? 'Update Offer' : 'Create Offer')}
                </FormButton>
              </div>
            </div>
          )}
        </Form>
      </div>
    </div>
  );
}