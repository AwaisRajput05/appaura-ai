import { FiLink, FiAlertCircle, FiGlobe, FiArrowRight } from 'react-icons/fi';
import { webhookSchema } from '../../common/form/validations/DataIngestionSchemas';
import Form from '../../common/form/Form';

export default function SetupWebhook({ onComplete }) {
  const onSubmit = async (data) => {
    console.log('Webhook submitted:', data);
    onComplete?.('Webhook setup successful!');
  };

  return (
    <Form
      schema={webhookSchema}
      onSubmit={onSubmit}
      title=""
      icon={FiLink}
      successMessage="Webhook set up successfully!"
      submitText="Activate Webhook"
      pendingText="Setting up..."
    >
      {({ register, errors }) => (
        <div className="space-y-6 bg-white p-6 rounded-xl shadow-lg">
          {/* Header Section */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
              <FiLink className="w-8 h-8 text-indigo-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Configure Webhook Integration</h2>
            <p className="text-gray-500 mt-1">Set up real-time data synchronization</p>
          </div>

          {/* Main Form Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-indigo-600" htmlFor="webhookUrl">
                Webhook Endpoint URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiGlobe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="webhookUrl"
                  type="text"
                  placeholder="https://your-endpoint.com/webhook"
                  {...register('webhookUrl')}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-colors duration-200 ${
                    errors.webhookUrl 
                      ? 'border-red-200 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                      : 'border-indigo-100 bg-indigo-50/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                  }`}
                />
              </div>
              {errors.webhookUrl && (
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                  <FiAlertCircle className="flex-shrink-0" /> {errors.webhookUrl.message}
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FiArrowRight className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-indigo-700">What happens next?</h4>
                  <p className="text-sm text-indigo-600/80 mt-1">
                    After setting up the webhook, we'll send real-time updates to your endpoint whenever there are changes in your data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Form>
  );
}