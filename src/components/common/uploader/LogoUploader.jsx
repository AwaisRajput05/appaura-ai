// src/components/common/LogoUploader.js
import React, { useRef } from 'react';
import { Upload, X, Image } from 'lucide-react';
import Button from '../../ui/forms/Button';
import Alert from '../../ui/feedback/Alert';

const LogoUploader = ({ 
  logoUrl, 
  setLogoUrl, 
  setLogoFile, 
  disabled = false, 
  onChange, 
  uploadText = "Upload a logo or drag and drop" 
}) => {
  const fileInputRef = useRef(null);
  const [error, setError] = React.useState(null);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validExtensions = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validExtensions.includes(file.type)) {
      setError('Only JPG, PNG, JPEG, and WEBP files are allowed.');
      fileInputRef.current.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be less than 2MB.');
      fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoUrl(reader.result);
      if (typeof setLogoFile === 'function') {
        setLogoFile(file);
      }
      if (typeof onChange === 'function') {
        onChange(file); // Notify parent of file change
      }
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    if (typeof setLogoFile === 'function') {
      setLogoFile(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      {error && (
        <Alert 
          variant="error" 
          message={error} 
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      {!logoUrl ? (
        <div 
          onClick={handleUploadClick}
          className="cursor-pointer mt-1 flex flex-col items-center justify-center px-4 pt-6 pb-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors bg-white"
        >
          <div className="text-center space-y-2">
            <div className="text-gray-400 mx-auto">
              <Image className="h-10 w-10 mx-auto" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  {uploadText.split(' or ')[0]}
                </span>
                <span className="text-gray-600"> or drag and drop</span>
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, JPEG, WEBP up to 2MB</p>
            </div>
          </div>
          <input
            type="file"
            id="logoUpload"
            accept="image/*"
            onChange={handleLogoChange}
            ref={fileInputRef}
            className="sr-only"
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="mt-1">
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <img
                src={logoUrl}
                alt="Logo Preview"
                className="w-24 h-24 object-contain border-2 border-gray-200 rounded-lg shadow-sm"
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                title="Remove Logo"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                onClick={handleUploadClick}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
                disabled={disabled}
              >
                <Upload className="h-4 w-4" />
                Change
              </Button>
              
              <Button
                type="button"
                onClick={handleRemoveLogo}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            ref={fileInputRef}
            className="sr-only"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};

export default LogoUploader;