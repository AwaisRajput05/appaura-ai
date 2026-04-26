// FileUpload.jsx
import React, { useRef } from 'react';
import { Button as HeadlessButton, Input } from '@headlessui/react';
import { Upload, X } from 'lucide-react';

const FileUpload = ({ 
  label, 
  accept, 
  onChange, 
  preview, 
  icon, 
  className = '', 
  showPreviewOnIcon = false,
  ...props 
}) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onChange) {
      onChange(file);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="space-y-3">
        <HeadlessButton
          onClick={handleClick}
          className="relative flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors min-h-[120px] cursor-pointer w-full data-[hover]:border-gray-400 data-[focus]:ring-2 data-[focus]:ring-[#3C5690] data-[focus]:ring-offset-2"
        >
          {preview ? (
            <>
              {/* Show preview on camera icon */}
              <div className="relative">
                <img
                  src={preview instanceof File ? URL.createObjectURL(preview) : preview}
                  alt="Preview"
                  className={`${showPreviewOnIcon ? 'w-20 h-20 object-cover rounded-full' : 'max-w-full h-auto rounded-lg'} shadow-md`}
                />
                <button
                  onClick={handleClear}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {preview instanceof File && !showPreviewOnIcon && (
                <p className="text-xs text-gray-500 mt-2">{preview.name}</p>
              )}
            </>
          ) : (
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                {icon || <Upload className="w-10 h-10" />}
              </div>
              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
            </div>
          )}
        </HeadlessButton>

        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          {...props}
        />

        {/* Show full preview below if not showing on icon */}
        {preview && !showPreviewOnIcon && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
            <img
              src={preview instanceof File ? URL.createObjectURL(preview) : preview}
              alt="Preview"
              className="max-w-full h-auto rounded-lg shadow-md"
            />
            {preview instanceof File && (
              <p className="text-xs text-gray-500 mt-1">{preview.name}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;