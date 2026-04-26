// src/components/common/form/validations/AuthSchema.js
import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email')
    .required('Email is required')
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid email like abc@gmail.com'
    ),
  password: yup
    .string()
    .min(8, 'Minimum 8 characters')
    .required('Password is required'),
});

export const signupSchema = yup.object().shape({
  businessName: yup.string().required('Business Name is required'),
  businessType: yup.string().required('Business Type is required'),
  businessDescription: yup
    .string()
    .required('Business description is required'),

  // Business Logo - Required with proper file checks
  logoImage: yup
    .mixed()
    .required('Business Logo is required')
    .test('fileExists', 'Please upload a logo image', (value) => {
      return value && value instanceof File;
    })
    .test('fileSize', 'File too large (max 5MB)', (value) => {
      return !value || (value && value.size <= 5 * 1024 * 1024);
    })
    .test('fileType', 'Only JPEG, PNG, or GIF allowed', (value) => {
      return (
        !value ||
        (value &&
          ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(value.type))
      );
    }),

  organizationType: yup
    .string()
    .required('Organization Type is required')
    .oneOf(['GROUP', 'INDIVIDUAL'], 'Must be GROUP or INDIVIDUAL'),

  // Conditional account type
  accountType: yup.string().when('organizationType', {
    is: 'GROUP',
    then: (schema) =>
      schema.required('Account Type is required').oneOf(['BRANCHES', 'SUBACCOUNT']),
    otherwise: (schema) => schema.nullable(),
  }),

  // Branch fields - optional (no required when BRANCHES selected)
  pharmacyCode: yup.string().trim().nullable().optional(),
  branchId: yup.string().trim().nullable().optional(),

  // Sub-account fields - required only when SUBACCOUNT selected
  subAccountCode: yup.string().when(['organizationType', 'accountType'], {
    is: (org, acc) => org === 'GROUP' && acc === 'SUBACCOUNT',
    then: (schema) => schema.required('Sub Account Code is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  subAccountType: yup.string().when(['organizationType', 'accountType'], {
    is: (org, acc) => org === 'GROUP' && acc === 'SUBACCOUNT',
    then: (schema) => schema.required('Account Type is required').oneOf(['FINANCE']),
    otherwise: (schema) => schema.nullable(),
  }),

  firstName: yup.string().required('First Name is required'),
  lastName: yup.string().required('Last Name is required'),

  emailAddress: yup
    .string()
    .email('Invalid email')
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid email like abc@gmail.com'
    )
    .required('Email Address is required'),

  // UPDATED: Generic international phone number validation
  phoneNumber: yup
    .string()
    .required('Phone Number is required')
    .transform((value) => (value ? value.trim().replace(/\s+/g, '') : ''))
    .test(
      'valid-phone-number',
      'Please enter a valid international phone number',
      function (value) {
        if (!value) return false;
        
        // Clean the value
        const cleanedValue = value.replace(/\s+/g, '');
        
        // International phone number regex pattern
        // This pattern accepts:
        // 1. + followed by 1-3 digits for country code, then rest of the number
        // 2. 00 followed by 1-3 digits for country code, then rest of the number
        // 3. Direct numbers without country code (minimum 8 digits)
        
        const phoneRegex = /^(\+[1-9]\d{0,3}|00[1-9]\d{0,3}|0?[1-9]\d{0,4})?[1-9]\d{7,}$/;
        
        // Check if it's a valid phone number format
        if (!phoneRegex.test(cleanedValue)) {
          return false;
        }
        
        // Additional length checks
        // Minimum 8 digits for local numbers, minimum 10 digits for international
        const digitsOnly = cleanedValue.replace(/\D/g, '');
        
        // If starts with + or 00, it's international
        if (cleanedValue.startsWith('+') || cleanedValue.startsWith('00')) {
          return digitsOnly.length >= 10 && digitsOnly.length <= 15;
        }
        
        // Local numbers (without country code)
        return digitsOnly.length >= 8 && digitsOnly.length <= 15;
      }
    ),

  businessAddress: yup.string().required('Business Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  zip: yup.string().required('ZIP is required'),
  country: yup.string().required('Country is required'),

  cnicFront: yup.mixed().required('CNIC Front is required'),
  cnicBack: yup.mixed().required('CNIC Back is required'),

  username: yup.string().required('Username is required'),
  password: yup.string().min(8, 'Minimum 8 characters').required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),

  // Optional banking fields
  bankName: yup.string().optional(),
  accountNumber: yup.string().optional(),

  terms: yup
    .boolean()
    .oneOf([true], 'You must agree to the Terms and Conditions and Privacy Policy')
    .required(),
});

// Alternative: Simpler phone validation that just checks basic format
// Use this if you want minimal validation
export const simplePhoneSchema = yup.object().shape({
  phoneNumber: yup
    .string()
    .required('Phone Number is required')
    .test(
      'valid-phone-number',
      'Please enter a valid phone number',
      function (value) {
        if (!value) return false;
        
        // Very basic check - just ensure it has at least 8 digits
        const digitsOnly = value.replace(/\D/g, '');
        return digitsOnly.length >= 8 && digitsOnly.length <= 15;
      }
    )
});

// Reusable email schema (used in login, forget password, etc.)
export const emailSchema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email')
    .required('Email is required')
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid email like abc@gmail.com'
    )
    .max(32, 'Email must be 32 characters or less'),
});

// Separate phone validation schema for reusability
export const phoneSchema = yup.object().shape({
  phoneNumber: yup
    .string()
    .required('Phone Number is required')
    .test(
      'valid-phone-number',
      'Please enter a valid international phone number',
      function (value) {
        if (!value) return false;
        
        const cleanedValue = value.replace(/\s+/g, '');
        const phoneRegex = /^(\+[1-9]\d{0,3}|00[1-9]\d{0,3}|0?[1-9]\d{0,4})?[1-9]\d{7,}$/;
        
        if (!phoneRegex.test(cleanedValue)) {
          return false;
        }
        
        const digitsOnly = cleanedValue.replace(/\D/g, '');
        
        if (cleanedValue.startsWith('+') || cleanedValue.startsWith('00')) {
          return digitsOnly.length >= 10 && digitsOnly.length <= 15;
        }
        
        return digitsOnly.length >= 8 && digitsOnly.length <= 15;
      }
    )
});