import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import PropTypes from 'prop-types';
import FormButton from './button/FormButton'
import { useState, useEffect } from 'react';

const Form = ({
  schema,
  methods,
  defaultValues = {},
  onSubmit,
  title,
  icon: Icon,
  children,
  successMessage,
  errorMessage,
  className = '',
  formProps = { className: 'space-y-5' },
  footer,
  submitText = 'Submit',
  pendingText = 'Submitting...',
  submitButtonProps = {},
  hideSubmitButton = false,
}) => {
  const [formError, setFormError] = useState(null);
  const [submittedOk, setSubmittedOk] = useState(false);

  const formMethods = methods || useForm({
    resolver: schema ? yupResolver(schema) : undefined,
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = formMethods;

  useEffect(() => {
    if (errorMessage) {
      setFormError(errorMessage);
    }
  }, [errorMessage]);

  const handleFormSubmit = async (data) => {
    try {
      setFormError(null);
      setSubmittedOk(false);
      
      // Validate dates if they exist in the form data
      if (data.startTime) {
        const startDate = new Date(data.startTime);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (startDate < today) {
          throw new Error('Start date cannot be in the past');
        }
      }
      
      if (data.startTime && data.endTime) {
        const startDate = new Date(data.startTime);
        const endDate = new Date(data.endTime);
        
        if (endDate < startDate) {
          throw new Error('End date must be after start date');
        }
      }
      
      await onSubmit(data);
      setFormError(null);
      setSubmittedOk(true);
      if (successMessage) reset();
    } catch (err) {
      console.error('Form submission error:', err);
      setSubmittedOk(false);
      setFormError(err.message || 'An error occurred during submission');
      // Re-throw the error if it's a validation error
      if (err.message.includes('must not be in the past') || 
          err.message.includes('must be after')) {
        throw err;
      }
    }
  };

  return (
    <div className={className} role="form">
      {title && (
        <div className="flex items-center gap-2 text-black text-2xl font-bold justify-center mb-4">
          {Icon && <Icon aria-hidden="true" />}
          <h2>{title}</h2>
        </div>
      )}
      {formError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm" role="alert">
          {formError}
        </div>
      )}
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-4"
        noValidate
        {...formProps}
      >
        {children && children({
    register,
    errors: formMethods.formState.errors,
    isDirty: formMethods.formState.isDirty,
    isSubmitting: formMethods.formState.isSubmitting,
    ...formMethods
  })}
        
        {!hideSubmitButton && (
          <FormButton
            type="submit"
            disabled={formMethods.formState.isSubmitting || submitButtonProps.disabled}
            isLoading={formMethods.formState.isSubmitting}
            {...submitButtonProps}
          >
            {formMethods.formState.isSubmitting ? pendingText : submitText}
          </FormButton>
        )}

        {submittedOk && successMessage && (
          <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-green-100 text-green-700" role="alert">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        )}
      </form>
      {footer && <div className="text-center text-sm text-gray-600 mt-6">{footer}</div>}
    </div>
  );
};

Form.propTypes = {
  schema: PropTypes.object,
  methods: PropTypes.object,
  defaultValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  title: PropTypes.string,
  icon: PropTypes.elementType,
  children: PropTypes.func.isRequired,
  successMessage: PropTypes.string,
  errorMessage: PropTypes.string,
  className: PropTypes.string,
  formProps: PropTypes.object,
  footer: PropTypes.node,
  submitText: PropTypes.string,
  pendingText: PropTypes.string,
  submitButtonProps: PropTypes.object,
  hideSubmitButton: PropTypes.bool
};

export default Form;