import * as yup from 'yup';

export const scheduleReportSchema = yup.object().shape({
  email: yup.string().email('Invalid email address').required('Email is required') .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid email like abc@gmail.com'),
  dayOfWeek: yup.string().required('Day is required'),
});
