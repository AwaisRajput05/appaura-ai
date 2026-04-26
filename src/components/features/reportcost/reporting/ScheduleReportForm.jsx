import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiCalendar } from 'react-icons/fi';
import { yupResolver } from '@hookform/resolvers/yup';
import { scheduleReportSchema } from '../../common/form/validationschemas/ScheduleReportSchema';
import Form from '../../../common/form/Form';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
z
const ScheduleReportForm = () => {
  const [frequency, setFrequency] = useState('Daily');

  const {
    watch,
    register,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(scheduleReportSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      frequency: 'Daily',
      dayOfWeek: 'Monday',
      dailyDays: [],
    },
  });

  const selectedDays = watch('dailyDays');

  const onSubmit = async (data) => {
    console.log('Form submitted:', data);
    alert('✅ Report scheduled successfully!');
  };

  return (
    <Form
      schema={scheduleReportSchema}
      onSubmit={onSubmit}
      title="Schedule Report"
      icon={FiCalendar}
      successMessage="Report scheduled successfully!"
      submitText="Schedule Report"
      pendingText="Scheduling..."
      defaultValues={{
        email: '',
        frequency: 'Daily',
        dayOfWeek: 'Monday',
        dailyDays: [],
      }}
    >
      {() => (
        <div className="space-y-6 bg-white p-6 rounded-xl shadow-lg">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-indigo-600">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border-2 border-indigo-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-indigo-50/30"
              aria-invalid={errors.email ? 'true' : 'false'}
              autoComplete='email'
            />
            {errors.email && (
              <p className="text-rose-500 text-sm mt-1 font-medium" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <label htmlFor="frequency" className="block text-sm font-semibold text-indigo-600">
              Report Frequency
            </label>
            <select
              id="frequency"
              {...register('frequency')}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-4 py-3 border-2 border-indigo-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-indigo-50/30 cursor-pointer"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          {/* Select Days */}
          {frequency === 'Daily' && (
            <fieldset className="space-y-4">
              <legend className="block text-sm font-semibold text-indigo-600 mb-3">
                Select Days for Report Delivery
              </legend>
              <div className="grid grid-cols-4 gap-3">
                {daysOfWeek.map((day) => {
                  const checkboxId = `day-${day}`;
                  const isSelected = selectedDays?.includes(day);
                  return (
                    <label
                      htmlFor={checkboxId}
                      key={day}
                      className={`flex items-center justify-center border-2 rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                      }`}
                    >
                      <input
                        id={checkboxId}
                        type="checkbox"
                        value={day}
                        {...register('dailyDays')}
                        className="sr-only"
                      />
                      <span
                        className={`text-sm font-medium ${
                          isSelected ? 'text-indigo-700' : 'text-gray-600'
                        }`}
                      >
                        {day}
                      </span>
                    </label>
                  );
                })}
              </div>

              {errors.dailyDays && (
                <p className="text-rose-500 text-sm mt-2 font-medium" role="alert">
                  {errors.dailyDays.message}
                </p>
              )}

              {selectedDays?.length > 0 && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="text-sm font-medium text-indigo-700 mb-2">Selected Days:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDays.map((day) => (
                      <span
                        key={day}
                        className="bg-white text-indigo-600 text-sm font-medium px-4 py-1.5 rounded-full shadow-sm border border-indigo-200"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </fieldset>
          )}
        </div>
      )}
    </Form>
  );
};

export default ScheduleReportForm;
