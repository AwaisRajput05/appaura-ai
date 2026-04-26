import * as yup from 'yup';

export const vendorProfileSchema = yup.object().shape({
  contactInfo: yup
    .string()
    .required('Contact number is required')
    .matches(
      /^(\+92|0)?3\d{9}$/,
      'Invalid contact number'
    )
    .test('len', 'Contact must be 11 digits (03XXXXXXXXX)', (val = '') => {
      const digits = val.replace(/\D/g, '');
      return digits.length === 11 || digits.length === 12;
    })
    .max(13, 'Contact number should not exceed 13 characters'),

  logoUrl: yup
    .string()
    .test(
      'is-valid-url-or-data-url',
      'Logo must be a valid URL or data URL',
      (value) => {
        if (!value) return true;
        if (value.startsWith('data:')) return true;
        const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;
        return urlPattern.test(value);
      }
    )
    .nullable()
    .notRequired(),
});