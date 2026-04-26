import { memo, useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { vendorProfileSchema } from '../components/common/form/validations/VendorProfileSchema';
import * as yup from 'yup';
import { useAuth } from '../components/auth/hooks/useAuth';
import apiService from '../services/apiService';
import { apiEndpoints } from '../services/apiEndpoints';
import LogoUploader from '../components/common/uploader/LogoUploader';
import InputText from "../components/ui/forms/InputText";
import InputPhone from "../components/ui/forms/InputPhone";



// Add this helper function after imports
const formatDate = (dateString, showTime = true) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    if (showTime) {
      const weekday = dayNames[date.getDay()];
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours === 0 ? 12 : hours;
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      return `${weekday}, ${month} ${day}, ${year}, ${timeStr}`;
    } else {
      return `${month} ${day}, ${year}`;
    }
  } catch (error) {
    return dateString;
  }
};

const passwordSchema = yup.object({
  oldPassword: yup.string().required('Old password is required'),
  newPassword: yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('newPassword')], 'Passwords must match').required('Confirm password is required'),
});

export const Profile = memo(() => {
  const { user } = useAuth();
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [logoSuccess, setLogoSuccess] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [logoError, setLogoError] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // EXTENDED SCHEMA to include all editable fields (only Personal Information is editable now)
  const extendedProfileSchema = vendorProfileSchema.shape({
    firstName: yup.string().nullable(),
    lastName: yup.string().nullable(),
    // Make these non-editable fields optional in schema
    businessName: yup.string().nullable(),
    businessType: yup.string().nullable(),
    organizationType: yup.string().nullable(),
    businessDescription: yup.string().nullable(),
    emailAddress: yup.string().email('Invalid email').nullable(),
    username: yup.string().nullable(),
    businessAddress: yup.string().nullable(),
    city: yup.string().nullable(),
    state: yup.string().nullable(),
    zip: yup.string().nullable(),
    country: yup.string().nullable(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({
    resolver: yupResolver(extendedProfileSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      contactInfo: '',
      firstName: '',
      lastName: '',
      businessName: '',
      businessType: '',
      organizationType: '',
      businessDescription: '',
      emailAddress: '',
      username: '',
      businessAddress: '',
      city: '',
      state: '',
      zip: '',
      country: '',
    },
  });

  // Watch for changes in editable fields
  const watchedFirstName = watch('firstName');
  const watchedLastName = watch('lastName');
  const watchedBusinessAddress = watch('businessAddress');
  const watchedCity = watch('city');
  const watchedState = watch('state');
  const watchedZip = watch('zip');
  const watchedCountry = watch('country');

  // Check if any editable field has changed
  useEffect(() => {
    if (profileData) {
      const originalFirstName = profileData.firstName || '';
      const originalLastName = profileData.lastName || '';
      const originalBusinessAddress = profileData.businessAddress || '';
      const originalCity = profileData.city || '';
      const originalState = profileData.state || '';
      const originalZip = profileData.zip || '';
      const originalCountry = profileData.country || '';

      const currentFirstName = watchedFirstName || '';
      const currentLastName = watchedLastName || '';
      const currentBusinessAddress = watchedBusinessAddress || '';
      const currentCity = watchedCity || '';
      const currentState = watchedState || '';
      const currentZip = watchedZip || '';
      const currentCountry = watchedCountry || '';

      const hasEditableChanges = 
        currentFirstName !== originalFirstName ||
        currentLastName !== originalLastName ||
        currentBusinessAddress !== originalBusinessAddress ||
        currentCity !== originalCity ||
        currentState !== originalState ||
        currentZip !== originalZip ||
        currentCountry !== originalCountry;

      setHasChanges(hasEditableChanges);
    }
  }, [
    watchedFirstName, 
    watchedLastName, 
    watchedBusinessAddress, 
    watchedCity, 
    watchedState, 
    watchedZip, 
    watchedCountry, 
    profileData
  ]);

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPassword,
  } = useForm({
    resolver: yupResolver(passwordSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Get logo from localStorage
  const getLogoFromStorage = () => {
    if (user) {
      const id = user?.vendorId || user?.userId || user?.id;
      if (id) {
        const storedLogo = localStorage.getItem(`vendorLogo_${id}`);
        return storedLogo || '';
      }
    }
    return '';
  };

  // ✅ fetchProfile hoisted as useCallback so it can be called after logo update
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const id = user?.vendorId || user?.userId || user?.id;
      if (!id) throw new Error('User ID not found');
      const response = await apiService.get(apiEndpoints.profile(id));
      const data = response?.data?.data;
      if (data) {
        setProfileData(data);
        reset({
          contactInfo: data.phoneNumber || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          businessName: data.businessName || '',
          businessType: data.businessType || '',
          organizationType: data.organizationType || '',
          businessDescription: data.businessDescription || '',
          emailAddress: data.emailAddress || '',
          username: data.username || '',
          businessAddress: data.businessAddress || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          country: data.country || '',
        });

        // Check localStorage first — if user has uploaded a logo before, show it immediately
        const id = user?.vendorId || user?.userId || user?.id;
        const storedLogo = id ? localStorage.getItem(`vendorLogo_${id}`) : '';
        setLogoPreview(storedLogo || data.logoUrl || '');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [user, reset]);

  // Fetch Profile on mount
  useEffect(() => {
    if (user) fetchProfile();
  }, [user, fetchProfile]);

  // Submit Profile Update (only Personal Information and Address)
  const onSubmit = async (data) => {
    try {
      const id = user?.vendorId || user?.userId || user?.id;
      if (!id) throw new Error('User ID not found');

      // Include all editable fields
      const payload = {
        id,
        firstName: data.firstName,
        lastName: data.lastName,
        businessAddress: data.businessAddress,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
      };

      await apiService.put(apiEndpoints.profile(id), payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 60000);
      
      // Update profileData with new values
      setProfileData(prev => ({
        ...prev,
        firstName: data.firstName,
        lastName: data.lastName,
        businessAddress: data.businessAddress,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
      }));
      
      setHasChanges(false); // Reset changes after successful update
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // ✅ Submit Logo Update - re-fetches profile after success to get fresh logo
  const handleLogoUpdate = async () => {
    if (!logoFile) {
      setLogoError('Please select a logo to upload');
      return;
    }

    try {
      setLogoUploading(true);
      setLogoError(null);
      
      const id = user?.vendorId || user?.userId || user?.id;
      if (!id) throw new Error('User ID not found');

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('logoImage', logoFile);

      await apiService.put(apiEndpoints.getVendorLogo(id), formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
      });

      // ✅ Save uploaded file as base64 in localStorage so it persists on reload
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem(`vendorLogo_${id}`, reader.result);
        // ✅ Reload the full page — localStorage is now updated,
        // so the logo will show correctly everywhere (header, sidebar, etc.)
        window.location.reload();
      };
      reader.readAsDataURL(logoFile);

    } catch (err) {
      console.error('Failed to update logo:', err);
      setLogoError(err.response?.data?.message || 'Failed to update logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      setPasswordError(null);
      const id = user?.vendorId || user?.userId || user?.id;
      if (!id) throw new Error('User ID not found');
      await apiService.post(apiEndpoints.changeVendorPassword(id), {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      setIsPasswordModalOpen(false);
      resetPassword();
      setPasswordSuccess('Password changed successfully!');
      setTimeout(() => setPasswordSuccess(''), 60000);
    } catch (err) {
      console.error('Failed to change password:', err);
      const msg = err.response?.data?.message || 'Failed to change password';
      setPasswordError(msg);
    }
  };

  const handleLogoChange = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        setLogoPreview(result);
      };
      reader.readAsDataURL(file);
      setLogoFile(file);
      setLogoError(null); // Clear any previous errors
    }
  };

  const handlePhoneChange = (value) => {
    setValue('contactInfo', value, { shouldValidate: true });
  };

  const openLogoModal = () => {
    setLogoError(null);
    setLogoFile(null);
    // Reset preview to current logo (from localStorage or API)
    const storedLogo = getLogoFromStorage();
    setLogoPreview(storedLogo || profileData?.logoUrl || '');
    setIsLogoModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="w-24 h-24 border-8 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="text-red-600 text-3xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to load profile</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                {/* Circular Logo - Now shows the actual logo from localStorage */}
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Profile Logo" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#30426B] shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-r from-[#30426B] to-[#5A75C7] rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-3xl font-black">
                      {profileData?.businessName?.charAt(0) || profileData?.firstName?.charAt(0) || user?.email?.charAt(0) || 'A'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#30426B] to-[#5A75C7]">
                  {isAdmin ? 'Admin Profile' : 'Vendor Profile'}
                </h1>
                <p className="text-gray-600 text-lg mt-1">
                  {isAdmin ? 'Manage your admin account settings' : 'Manage your company information and settings'}
                </p>
              </div>
            </div>
            
            {/* Update Logo Button in Header */}
            <button
              type="button"
              onClick={openLogoModal}
              className="bg-gradient-to-r from-[#30426B] to-[#5A75C7] text-white font-bold py-3 px-6 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Update Logo
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {profileSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
              {profileSuccess}
            </div>
          )}
          {logoSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
              {logoSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {/* Personal Information - EDITABLE */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputText
                  label="First Name"
                  name="firstName"
                  register={register}
                  error={errors.firstName}
                  value={getValues('firstName')}
                />
                <InputText
                  label="Last Name"
                  name="lastName"
                  register={register}
                  error={errors.lastName}
                  value={getValues('lastName')}
                />
              </div>
            </div>

            {/* Business Information - READ ONLY */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <p className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 font-medium shadow-sm">
                    {profileData?.businessName || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Category</label>
                  <p className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 font-medium shadow-sm">
                    {profileData?.businessType || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization Type</label>
                  <p className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 font-medium shadow-sm">
                    {profileData?.organizationType || 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
                  <p className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 font-medium shadow-sm">
                    {profileData?.businessDescription || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Details - READ ONLY */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <p className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 font-medium shadow-sm">
                    {profileData?.emailAddress || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <p className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 font-medium shadow-sm">
                    {profileData?.phoneNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <p className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 font-medium shadow-sm">
                    {profileData?.username || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Business Address - EDITABLE */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <InputText
                    label="Street Address"
                    name="businessAddress"
                    register={register}
                    error={errors.businessAddress}
                    value={getValues('businessAddress')}
                  />
                </div>
                <InputText
                  label="City"
                  name="city"
                  register={register}
                  error={errors.city}
                  value={getValues('city')}
                />
                <InputText
                  label="State"
                  name="state"
                  register={register}
                  error={errors.state}
                  value={getValues('state')}
                />
                <InputText
                  label="Zip Code"
                  name="zip"
                  register={register}
                  error={errors.zip}
                  value={getValues('zip')}
                />
                <InputText
                  label="Country"
                  name="country"
                  register={register}
                  error={errors.country}
                  value={getValues('country')}
                />
              </div>
            </div>

            {/* Account Status */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Status</h2>
              <div className="flex items-center">
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                    profileData?.status === 'APPROVED'
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  }`}
                >
                  {profileData?.status || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Additional Details */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch ID</label>
                  <p className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 font-medium shadow-sm">
                    {profileData?.businessName || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Is Master</label>
                  <p className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 font-medium shadow-sm">
                    {profileData?.isMaster ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application Roles</label>
                  <p className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 font-medium shadow-sm">
                    {profileData?.applicationRoles?.join(', ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Created At</label>
                  <p className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 font-medium shadow-sm">
                    {profileData?.createdAt ? formatDate(profileData.createdAt, true) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Updated At</label>
                  <p className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 font-medium shadow-sm">
                    {profileData?.updatedAt ? formatDate(profileData.updatedAt, true) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Security</h2>
              {passwordSuccess && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
                  {passwordSuccess}
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="bg-gradient-to-r from-[#30426B] to-[#5A75C7] text-white font-bold py-3 px-6 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Change Password
              </button>
            </div>

            {/* Submit Button for Profile Update - Disabled when no changes */}
            <div className="pt-8 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting || !hasChanges}
                className={`w-full font-bold py-4 px-6 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  hasChanges 
                    ? 'bg-gradient-to-r from-[#30426B] to-[#5A75C7] text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Updating Profile...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {hasChanges ? 'Update Personal Information' : 'No Changes to Update'}
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Modal */}
        {isPasswordModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>
              {passwordError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
                  {passwordError}
                </div>
              )}
              <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-6">
                <InputText
                  label="Old Password"
                  name="oldPassword"
                  type={showOldPassword ? 'text' : 'password'}
                  register={registerPassword}
                  error={passwordErrors.oldPassword}
                  required={true}
                  postfix={
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="focus:outline-none"
                    >
                      {showOldPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  }
                />

                <InputText
                  label="New Password"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  register={registerPassword}
                  error={passwordErrors.newPassword}
                  required={true}
                  postfix={
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="focus:outline-none"
                    >
                      {showNewPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  }
                />

                <InputText
                  label="Confirm New Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  register={registerPassword}
                  error={passwordErrors.confirmPassword}
                  required={true}
                  postfix={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  }
                />

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPasswordModalOpen(false);
                      setPasswordError(null);
                      resetPassword();
                      setShowOldPassword(false);
                      setShowNewPassword(false);
                      setShowConfirmPassword(false);
                    }}
                    className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-xl hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPasswordSubmitting}
                    className="bg-gradient-to-r from-[#30426B] to-[#5A75C7] text-white font-bold py-3 px-6 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-70"
                  >
                    {isPasswordSubmitting ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Logo Update Modal */}
        {isLogoModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Update Profile Logo</h2>
                <button
                  onClick={() => {
                    setIsLogoModalOpen(false);
                    setLogoError(null);
                    setLogoFile(null);
                    setLogoPreview(getLogoFromStorage() || profileData?.logoUrl || '');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {logoError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
                  {logoError}
                </div>
              )}

              <div className="mb-6">
                <LogoUploader
                  logoUrl={logoPreview}
                  setLogoUrl={setLogoPreview}
                  setLogoFile={setLogoFile}
                  onChange={handleLogoChange}
                  disabled={logoUploading}
                />
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Click the camera icon to upload a new logo
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogoModalOpen(false);
                    setLogoError(null);
                    setLogoFile(null);
                    setLogoPreview(getLogoFromStorage() || profileData?.logoUrl || '');
                  }}
                  className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-xl hover:bg-gray-300 transition-all"
                  disabled={logoUploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogoUpdate}
                  disabled={logoUploading || !logoFile}
                  className="bg-gradient-to-r from-[#30426B] to-[#5A75C7] text-white font-bold py-3 px-6 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                >
                  {logoUploading ? (
                    <>
                      <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Update Logo'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

Profile.displayName = 'Profile';