import * as yup from 'yup';

export const offerFormSchema = yup.object().shape({
  title: yup.string().required('Title is required'),
  type: yup.string().required('Type is required'),
  description: yup.string().required('Description is required'),
  startTime: yup.string().required('Start date is required'),
  endTime: yup
    .string()
    .required('End date is required')
    .test('end-date', 'End date must be after start date', function(endTime) {
      const { startTime } = this.parent;
      if (!startTime || !endTime) return true;
      return new Date(endTime) > new Date(startTime);
    }),
  termsAndConditions: yup.string().required('Terms and conditions are required'),
  targetAudience: yup.array()
    .transform(value => {
      if (Array.isArray(value)) return value;
      if (value === null || value === undefined) return ['ALL_CUSTOMERS'];
      return [value];
    })
    .of(yup.string().oneOf([
      'PAKISTAN',
      'INTERNATIONAL',
      'PREMIUM',
      'ALL_CUSTOMERS',
      'NEW_CUSTOMERS'
    ], 'Invalid target audience value'))
    .min(1, 'At least one target audience must be selected')
    .nullable()
    .default(['ALL_CUSTOMERS']),
  status: yup.string().required('Status is required')
});
