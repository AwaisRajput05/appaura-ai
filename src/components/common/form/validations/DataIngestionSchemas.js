// src/utils/validationSchemas.js
import * as yup from 'yup';

export const webhookSchema = yup.object().shape({
  webhookUrl: yup
    .string()
    .trim()
    .url('Please enter a valid URL')
    .required('Webhook URL is required'),
});

export const connectApiSchema = yup.object().shape({
  apiUrl: yup
    .string()
    .trim()
    .url('Please enter a valid API URL')
    .required('API URL is required'),
  apiKey: yup
    .string()
    .trim()
    .min(8, 'API Key must be at least 8 characters')
    .required('API Key is required'),
});

export const csvUploadSchema = yup.object().shape({
  file: yup
    .mixed()
    .required('CSV file is required')
    .test('fileFormat', 'Only .csv files are allowed', (value) => {
      if (!value) return true; // Don't show error if no file is selected
      return (
        value instanceof File && 
        (value.name.toLowerCase().endsWith('.csv') || value.type === 'text/csv')
      );
    })
    .test('fileSize', 'File size is too large', (value) => {
      if (!value) return true; // Don't show error if no file is selected
      return value.size <= 10 * 1024 * 1024; // 10MB limit
    }),
});
