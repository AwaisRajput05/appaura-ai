import { FiServer, FiAlertCircle, FiLink, FiKey } from 'react-icons/fi';
import { connectApiSchema } from '../../common/form/validations/DataIngestionSchemas';
import Form from '../../common/form/Form';

export default function ConnectApi({ onComplete }) {
  const onSubmit = async (data) => {
    console.log('Connecting to API:', data.apiUrl, data.apiKey);
    onComplete?.('API connected successfully!');
  };

  return (
    <Form
      schema={connectApiSchema}
      onSubmit={onSubmit}
      title=""
      icon={FiServer}
      successMessage="API connected successfully!"
      submitText="Connect Store"
      pendingText="Connecting..."
    >
      {({ register, errors }) => (
        <div className="space-y-6 bg-white p-6 rounded-xl shadow-lg">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
              <FiServer className="w-8 h-8 text-indigo-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Connect Your Store</h2>
            <p className="text-gray-500 mt-1">Enter your API credentials to get started</p>
          </div>

          <div className="space-y-4">
            {/* API URL Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-indigo-600" htmlFor="apiUrl">
                Store API URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLink className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="apiUrl"
                  type="text"
                  placeholder="https://api.example.com"
                  {...register('apiUrl')}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-colors duration-200 ${
                    errors.apiUrl 
                      ? 'border-red-200 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                      : 'border-indigo-100 bg-indigo-50/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                  }`}
                />
              </div>
              {errors.apiUrl && (
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                  <FiAlertCircle className="flex-shrink-0" /> {errors.apiUrl.message}
                </p>
              )}
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-indigo-600" htmlFor="apiKey">
                Store API Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiKey className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your API key"
                  {...register('apiKey')}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-colors duration-200 ${
                    errors.apiKey 
                      ? 'border-red-200 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                      : 'border-indigo-100 bg-indigo-50/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                  }`}
                />
              </div>
              {errors.apiKey && (
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                  <FiAlertCircle className="flex-shrink-0" /> {errors.apiKey.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Form>
  );
}