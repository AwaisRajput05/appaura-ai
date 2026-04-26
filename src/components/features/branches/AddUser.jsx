
//AddUser.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../../../services/tokenUtils';
import { apiEndpoints } from '../../../services/apiEndpoints';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

// Import reusable components
import Button from '../../../components/ui/forms/Button';
import InputText from '../../../components/ui/forms/InputText';
import InputSelect from '../../../components/ui/forms/InputSelect';
import Alert from '../../../components/ui/feedback/Alert';
import Card from '../../../components/ui/Card';
import Loader from '../../../components/ui/Loader';

const AddUser = () => {
  const [accountType, setAccountType] = useState('FINANCE');
  const [subAccountCode, setSubAccountCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Copy to clipboard
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    if (!subAccountCode) return;
    try {
      await navigator.clipboard.writeText(subAccountCode);
      setCopied(true);
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Failed to copy. Please copy manually.');
    }
  };

  // Generate Code 
  const handleGenerateCode = async () => {
    setIsLoading(true);
    setError('');
    setSubAccountCode('');
    setCopied(false);

    try {
      const token = getToken();
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setIsLoading(false);
        return;
      }

      // GET PLAN FROM LOCALSTORAGE — SAME AS AddBranch.jsx
      let userPlan = 'FREE';
      try {
        const subscriptionData = localStorage.getItem('vendor_subscription');
        if (subscriptionData) {
          const parsed = JSON.parse(subscriptionData);
          if (parsed?.plan && ['PRO', 'ENTERPRISE', 'PREMIUM'].includes(parsed.plan.toUpperCase())) {
            userPlan = parsed.plan.toUpperCase();
          }
        }
      } catch (e) {
        console.warn('Failed to parse vendor_subscription from localStorage');
      }

      const endpoint = apiEndpoints.createSubAccount(accountType);

      const response = await axios.post(
        endpoint,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Plan': userPlan,                    // NOW SENDING X-User-Plan
            'ngrok-skip-browser-warning': 'true',
          },
          timeout: 10000,
        }
      );

      let generatedCode = '';
      if (response.data && typeof response.data === 'object') {
        generatedCode =
          response.data.subAccountCode ||
          response.data.code ||
          response.data.id ||
          response.data.data?.subAccountCode ||
          '';
      } else if (typeof response.data === 'string') {
        generatedCode = response.data.trim();
      }

      if (generatedCode) {
        setSubAccountCode(generatedCode);
      } else {
        setError('No valid sub-account code received from the server.');
      }
    } catch (err) {
      console.error('Error generating sub-account code:', err);
      let errorMessage = 'Failed to generate sub-account code.';

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'You don\'t have permission to create users. Upgrade your plan.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card
        className="max-w-2xl w-full shadow-xl"
        title="Add New User"
        subtitle="Generate a unique sub-account code"
      >
        {error && (
          <Alert 
            variant="error" 
            message={error} 
            className="mb-6"
          />
        )}

        <div className="flex flex-col items-center space-y-6">
          <div className="w-full">
            <InputSelect
              label="Account Type"
              name="accountType"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-full"
            >
              <option value="FINANCE">FINANCE</option>
              {/* Add more account types here if needed in the future */}
            </InputSelect>
          </div>

          <div className="w-full">
            <InputText
              label="Sub Account Code"
              name="subAccountCode"
              value={subAccountCode || ''}
              readOnly
              placeholder="Click 'Generate Code' to get a sub-account code"
              className="w-full bg-gray-50"
            />
            
            {subAccountCode && (
              <div className="mt-3">
                <Button
                  onClick={handleCopy}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="h-4 w-4" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <Button
            onClick={handleGenerateCode}
            loading={isLoading}
            loadingText="Generating..."
            variant="primary"
            size="lg"
            className="w-48"
          >
            Generate Code
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AddUser;