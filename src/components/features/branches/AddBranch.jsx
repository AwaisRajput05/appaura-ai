//AddBranch.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiEndpoints } from '../../../services/apiEndpoints';
import { getToken } from '../../../services/tokenUtils';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

// Import reusable components
import Button from '../../../components/ui/forms/Button';
import InputText from '../../../components/ui/forms/InputText';
import Alert from '../../../components/ui/feedback/Alert';
import Card from '../../../components/ui/Card';
import Loader from '../../../components/ui/Loader';

const AddBranch = () => {
  const [branchId, setBranchId] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    if (!branchCode) return;
    try {
      await navigator.clipboard.writeText(branchCode);
      setCopied(true);
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Failed to copy. Please copy manually.');
    }
  };

  const handleGenerateCode = async () => {
    setIsLoading(true);
    setError('');
    setBranchCode('');
    setCopied(false);

    try {
      const token = getToken();
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setIsLoading(false);
        return;
      }

      const payload = { branchId: branchId.trim() };
      if (!payload.branchId) {
        setError('Please enter a Branch Id before generating the code.');
        setIsLoading(false);
        return;
      }

      // GET PLAN FROM LOCALSTORAGE SAFELY
      let userPlan = 'FREE'; // default fallback
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

      const response = await axios.post(
        apiEndpoints.generateBranchCode,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Plan': userPlan,
            'ngrok-skip-browser-warning': 'true',
          },
          timeout: 10000,
        }
      );

      let generatedCode = '';
      if (response.data && typeof response.data === 'object') {
        generatedCode =
          response.data.LinkBranchCode ||
          response.data.PharmacyCode ||
          response.data.branchId ||
          response.data.code ||
          response.data.data?.branchId ||
          '';
      } else if (typeof response.data === 'string') {
        generatedCode = response.data.trim();
      }

      if (generatedCode) {
        setBranchCode(generatedCode);
      } else {
        setError('No valid branch code received from the server.');
      }
    } catch (err) {
      console.error('Error generating branch code:', err);

      let errorMessage = 'Failed to generate branch code.';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.statusText) {
        errorMessage = err.response.statusText;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // Check for branchCode in error response
      let returnedCode = '';
      if (err.response?.data && typeof err.response.data === 'object') {
        returnedCode =
          err.response.data.branchCode ||
          err.response.data.LinkBranchCode ||
          err.response.data.PharmacyCode ||
          err.response.data.branchId ||
          err.response.data.code ||
          err.response.data.data?.branchId ||
          '';
      }

      if (returnedCode) {
        setBranchCode(returnedCode);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loader when loading and no content
  if (isLoading && !branchId && !branchCode) {
    return <Loader message="Generating branch code..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card
        className="max-w-2xl w-full shadow-xl"
        title="Add New Branch"
        subtitle="Generate a unique branch code for your new branch"
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
            <InputText
              label="Branch Id"
              name="branchId"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              placeholder="Enter branch id"
              required
              className="w-full"
            />
          </div>

          <div className="w-full">
            <InputText
              label="Link Branch Code"
              name="branchCode"
              value={branchCode || ''}
              readOnly
              placeholder="Click 'Generate Code' to get a branch code"
              className="w-full bg-gray-50"
            />

            {branchCode && (
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
            disabled={!branchId.trim()}
          >
            Generate Code
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AddBranch;