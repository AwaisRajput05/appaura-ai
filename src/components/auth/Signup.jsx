import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { signupSchema } from "../common/form/validations/AuthSchema";
import { useAuth } from "./hooks/useAuth";
import { memo, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdClose } from "react-icons/md";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { SignupErrorBoundary } from "../common/error/SignupErrorBoundary";
import LogoUploader from "../common/uploader/LogoUploader";
import CnicUploader from "../common/uploader/CnicUpload";
import ReCaptchaWidget from "./ReCaptchaWidget";
import { RECAPTCHA_SITE_KEY, PAKISTAN_CITIES_API } from "../../services/keys";
import debounce from "lodash/debounce";
import axios from "axios";
import { apiEndpoints } from "../../services/apiEndpoints";
import InputText from "../ui/forms/InputText";
import InputSelect from "../ui/forms/InputSelect";
import InputTextarea from "../ui/forms/InputTextarea";
import InputPhone from "../ui/forms/InputPhone";
import InputCheckbox from "../ui/forms/InputCheckbox";
import Button from "../ui/forms/Button";
import Alert from "../ui/feedback/Alert";
import Stepper from "../ui/Stepper";
import Loader from "../ui/Loader";
import DatePicker from "../ui/forms/DatePicker";

// Import constants from separate file
import {
  API_CONFIG,
  STEPS,
  ORGANIZATION_TYPES,
  ACCOUNT_TYPES,
  SUB_ACCOUNT_TYPES,
  BUSINESS_TYPES,
  GROUP_VALIDATION_TYPES,
  COUNTRY,
  PROVINCES_OF_PAKISTAN,
  STATUS,
  STEP_FIELDS,
  MESSAGES
} from "../constants/signupConstants";

// Create axios instance
const api = axios.create(API_CONFIG);

const Signup = memo(({ onClose, isModal = false }) => {
  const { signUp, loading, checkUsernameExists } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State declarations
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [cnicFrontUrl, setCnicFrontUrl] = useState("");
  const [cnicFrontFile, setCnicFrontFile] = useState(null);
  const [cnicBackUrl, setCnicBackUrl] = useState("");
  const [cnicBackFile, setCnicBackFile] = useState(null);
  const [licenseUrl, setLicenseUrl] = useState("");
  const [licenseFile, setLicenseFile] = useState(null);
  const [error, setError] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState("");
  const [usernameAvailableMsg, setUsernameAvailableMsg] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [emailAvailableMsg, setEmailAvailableMsg] = useState("");
  const [crnStatus, setCrnStatus] = useState("");
  const [crnValidationMsg, setCrnValidationMsg] = useState("");
  const [currentStep, setCurrentStep] = useState(STEPS.PERSONAL_INFO);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState(false);
  const [groupValidationStatus, setGroupValidationStatus] = useState("");
  const [groupValidationMsg, setGroupValidationMsg] = useState("");
  const [emailPrefilled, setEmailPrefilled] = useState(false);

  // Get pre-filled email from location state
  const prefillEmail = location.state?.prefillEmail;

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isValid: isFormValid },
    watch,
    setValue,
    reset,
    trigger,
    getValues,
  } = useForm({
    resolver: yupResolver(signupSchema),
    defaultValues: {
      businessName: "",
      businessType: BUSINESS_TYPES.PHARMACY,
      businessDescription: "",
      organizationType: ORGANIZATION_TYPES.INDIVIDUAL,
      pharmacyCode: "",
      branchId: "",
      subAccountCode: "",
      subAccountType: "",
      accountType: "",
      firstName: "",
      lastName: "",
      emailAddress: prefillEmail || "", // Set from location state
      phoneNumber: "",
      businessAddress: "",
      city: "",
      state: "",
      zip: "",
      country: COUNTRY,
      username: "",
      password: "",
      confirmPassword: "",
      referralCode: "",
      logoImage: null,
      cnicFront: null,
      cnicBack: null,
      pharmacyLicense: null,
      pharmacyLicenseNumber: "",
      pharmacyLicenseExpiryDate: "",
      terms: false,
      marketing: false,
    },
    mode: "onChange",
  });

  // Effect to handle pre-filled email from trial page
  useEffect(() => {
    // Check if we have email from navigation state and it hasn't been prefilled yet
    if (prefillEmail && !emailPrefilled) {
      const email = prefillEmail;
      
      // Set the email value with validation
      setValue("emailAddress", email, { 
        shouldValidate: true,
        shouldDirty: true 
      });
      
      // Trigger validation to check if email is available
      trigger("emailAddress").then(() => {
        setEmailPrefilled(true);
        
       
      });

      // Clear the location state to prevent re-filling on refresh
      window.history.replaceState({}, document.title);
    }
  }, [prefillEmail, setValue, trigger, emailPrefilled]);

  // Watch specific form values
  const allFormData = watch();
  const username = watch("username");
  const emailAddress = watch("emailAddress");
  const organizationType = watch("organizationType");
  const accountType = watch("accountType");
  const businessType = watch("businessType");
  const terms = watch("terms");
  const branchId = watch("branchId");
  const pharmacyCode = watch("pharmacyCode");
  const subAccountCode = watch("subAccountCode");
  const referralCode = watch("referralCode");

  const steps = Object.values(STEPS).map(title => ({ title }));
  const stepOrder = steps.map((step) => step.title);

  // ========== EFFECTS ==========
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setCitiesLoading(true);
        setCitiesError(false);
        const res = await fetch(PAKISTAN_CITIES_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: COUNTRY }),
        });
        if (!res.ok) throw new Error(MESSAGES.ERROR.CITIES_FETCH);
        const json = await res.json();
        const cityList = json.data || [];
        setCities(cityList.sort());
      } catch (err) {
        console.error("Cities API Error:", err);
        setCitiesError(true);
      } finally {
        setCitiesLoading(false);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    if (logoFile !== null) {
      setValue("logoImage", logoFile, { shouldValidate: true });
    } else {
      setValue("logoImage", null, { shouldValidate: false });
    }
  }, [logoFile, setValue]);

  useEffect(() => {
    if (cnicFrontFile !== null) {
      setValue("cnicFront", cnicFrontFile, { shouldValidate: true });
    } else {
      setValue("cnicFront", null, { shouldValidate: false });
    }
  }, [cnicFrontFile, setValue]);

  useEffect(() => {
    if (cnicBackFile !== null) {
      setValue("cnicBack", cnicBackFile, { shouldValidate: true });
    } else {
      setValue("cnicBack", null, { shouldValidate: false });
    }
  }, [cnicBackFile, setValue]);

  useEffect(() => {
    if (licenseFile !== null) {
      setValue("pharmacyLicense", licenseFile, { shouldValidate: true });
    } else {
      setValue("pharmacyLicense", null, { shouldValidate: false });
    }
  }, [licenseFile, setValue]);

  useEffect(() => {
    if (organizationType === ORGANIZATION_TYPES.INDIVIDUAL) {
      setValue("accountType", "");
      setValue("pharmacyCode", "");
      setValue("branchId", "");
      setValue("subAccountCode", "");
      setValue("subAccountType", "");
      setGroupValidationStatus("");
      setGroupValidationMsg("");
    }
  }, [organizationType, setValue]);

  // Set account type to BRANCHES when organization type is GROUP
  useEffect(() => {
    if (organizationType === ORGANIZATION_TYPES.GROUP) {
      setValue("accountType", ACCOUNT_TYPES.BRANCHES, { shouldValidate: true });
    }
  }, [organizationType, setValue]);

  // ========== VALIDATION FUNCTIONS ==========
  const checkUsername = useCallback(
    debounce(async (usernameValue) => {
      if (!usernameValue || usernameValue.trim().length < 3) {
        setUsernameStatus("");
        setUsernameAvailableMsg("");
        return;
      }
      setUsernameStatus(STATUS.CHECKING);
      try {
        const exists = await checkUsernameExists(usernameValue);
        setUsernameStatus(exists ? STATUS.TAKEN : STATUS.AVAILABLE);
        setUsernameAvailableMsg(
          exists
            ? MESSAGES.ERROR.USERNAME_EXISTS
            : MESSAGES.SUCCESS.USERNAME_AVAILABLE,
        );
      } catch (err) {
        setUsernameStatus(STATUS.ERROR);
        setUsernameAvailableMsg(MESSAGES.ERROR.USERNAME_CHECK);
      }
    }, 600),
    [checkUsernameExists],
  );

  useEffect(() => {
    checkUsername(username);
  }, [username, checkUsername]);

  const checkEmailExists = useCallback(
    debounce(async (email) => {
      if (!email || email.trim().length < 5) {
        setEmailStatus("");
        setEmailAvailableMsg("");
        return;
      }
      const isValid = await trigger("emailAddress");
      if (!isValid) {
        setEmailStatus("");
        setEmailAvailableMsg("");
        return;
      }
      setEmailStatus(STATUS.CHECKING);
      try {
        const url = apiEndpoints.signupemail.replace(
          "<EMAIL>",
          encodeURIComponent(email),
        );
        const response = await api.get(url);
        const exists = response.data === true || response.data === "true";
        setEmailStatus(exists ? STATUS.TAKEN : STATUS.AVAILABLE);
        setEmailAvailableMsg(
          exists
            ? MESSAGES.ERROR.EMAIL_REGISTERED
            : MESSAGES.SUCCESS.EMAIL_AVAILABLE,
        );
      } catch (err) {
        console.error("Email check error:", err);
        setEmailStatus(STATUS.ERROR);
        setEmailAvailableMsg(MESSAGES.ERROR.EMAIL_CHECK);
      }
    }, 600),
    [trigger],
  );

  useEffect(() => {
    if (emailAddress) {
      checkEmailExists(emailAddress);
    } else {
      setEmailStatus("");
      setEmailAvailableMsg("");
    }
  }, [emailAddress, checkEmailExists]);

  // CRN validation function using apiEndpoints.crnValidate
  const validateCrn = useCallback(
    debounce(async (crnValue) => {
      if (!crnValue || crnValue.trim() === "") {
        setCrnStatus("");
        setCrnValidationMsg("");
        return;
      }

      setCrnStatus(STATUS.CHECKING);
      setCrnValidationMsg("");

      try {
        const url = apiEndpoints.crnValidate(crnValue);
        const response = await api.get(url);
        
        if (response.data && response.data.valid === true) {
          setCrnStatus(STATUS.VALID);
          setCrnValidationMsg(response.data.message || "Referral code is valid");
        } else {
          setCrnStatus(STATUS.INVALID);
          setCrnValidationMsg(
            response.data?.message || "Invalid referral code"
          );
        }
      } catch (err) {
        console.error("CRN validation error:", err);
        setCrnStatus(STATUS.ERROR);
        setCrnValidationMsg(
          err.response?.data?.message || "Error validating referral code"
        );
      }
    }, 600),
    [],
  );

  useEffect(() => {
    validateCrn(referralCode);
  }, [referralCode, validateCrn]);

  const checkGroupValidation = useCallback(
    debounce(async (accType, data) => {
      if (!accType) {
        setGroupValidationStatus("");
        setGroupValidationMsg("");
        return;
      }
      setGroupValidationStatus(STATUS.CHECKING);
      try {
        const body = {
          type:
            accType === ACCOUNT_TYPES.BRANCHES
              ? GROUP_VALIDATION_TYPES.SUB_BRANCH
              : GROUP_VALIDATION_TYPES.SUB_ACCOUNT,
          ...(accType === ACCOUNT_TYPES.BRANCHES
            ? { branchId: data.branchId, refCode: data.refCode }
            : {
                refCode: data.refCode,
                subAccountType: SUB_ACCOUNT_TYPES.FINANCE,
              }),
        };
        const response = await api.post(apiEndpoints.validateauth, body);
        const isValid = response.data.valid === true;
        setGroupValidationStatus(isValid ? STATUS.VALID : STATUS.INVALID);
        setGroupValidationMsg(
          isValid
            ? response.data.message || MESSAGES.SUCCESS.VALIDATION_SUCCESS
            : MESSAGES.ERROR.INVALID_CODES,
        );
      } catch (err) {
        console.error("Group validation error:", err);
        if (err.response && err.response.status === 404) {
          setGroupValidationStatus(STATUS.INVALID);
          setGroupValidationMsg(
            err.response.data.message ||
              (accType === ACCOUNT_TYPES.BRANCHES
                ? MESSAGES.ERROR.BRANCH_NOT_FOUND
                : MESSAGES.ERROR.SUBACCOUNT_NOT_FOUND),
          );
        } else {
          setGroupValidationStatus(STATUS.ERROR);
          setGroupValidationMsg(MESSAGES.ERROR.VALIDATION_FAILED);
        }
      }
    }, 600),
    [],
  );

  useEffect(() => {
    if (organizationType !== ORGANIZATION_TYPES.GROUP || !accountType) {
      setGroupValidationStatus("");
      setGroupValidationMsg("");
      return;
    }
    if (accountType === ACCOUNT_TYPES.BRANCHES) {
      if (branchId && pharmacyCode && branchId.trim() && pharmacyCode.trim()) {
        checkGroupValidation(ACCOUNT_TYPES.BRANCHES, {
          branchId,
          refCode: pharmacyCode,
        });
      } else {
        setGroupValidationStatus("");
        setGroupValidationMsg("");
      }
    }
  }, [
    organizationType,
    accountType,
    branchId,
    pharmacyCode,
    checkGroupValidation,
  ]);

  // ========== HELPER FUNCTIONS ==========
  const normalizeContact = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+92') && cleaned.length === 13) return cleaned;
    if (cleaned.startsWith('92') && cleaned.length === 12) return `+${cleaned}`;
    if (cleaned.startsWith('03') && cleaned.length === 11) return `+92${cleaned.slice(1)}`;
    if (cleaned.startsWith('3') && cleaned.length === 10) return `+92${cleaned}`;
    return cleaned;
  };

  const onSubmit = async (data) => {
    if (isSubmitting || usernameStatus === STATUS.TAKEN || emailStatus === STATUS.TAKEN)
      return;
    
    if (data.referralCode && data.referralCode.trim() !== "" && crnStatus !== STATUS.VALID) {
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    try {
      const body = new FormData();
      const dataJson = {
        businessName: data.businessName,
        businessType: data.businessType,
        organizationType: data.organizationType,
        firstName: data.firstName,
        lastName: data.lastName,
        emailAddress: data.emailAddress,
        phoneNumber: normalizeContact(data.phoneNumber),
        businessAddress: data.businessAddress,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
        username: data.username,
        password: data.password,
        pharmacyLicenseNumber: data.pharmacyLicenseNumber,
        pharmacyLicenseExpiryDate: data.pharmacyLicenseExpiryDate,
        crn: data.referralCode || null,
        ...(data.businessDescription && { businessDescription: data.businessDescription }),
        ...(data.pharmacyCode && { branchCode: data.pharmacyCode }),
        ...(data.branchId && { branchId: data.branchId }),
        ...(data.subAccountCode && { subAccountCode: data.subAccountCode }),
        ...(data.subAccountType && { subAccountType: data.subAccountType }),
      };
      body.append(
        "data",
        new Blob([JSON.stringify(dataJson)], { type: "application/json" }),
      );
      body.append("captcha-token", recaptchaToken);
      if (data.logoImage)
        body.append(
          "logoImage",
          data.logoImage,
          data.logoImage.name || "logo.png",
        );
      if (data.cnicFront)
        body.append(
          "cnicFront",
          data.cnicFront,
          data.cnicFront.name || "cnicFront.jpg",
        );
      if (data.cnicBack)
        body.append(
          "cnicBack",
          data.cnicBack,
          data.cnicBack.name || "cnicBack.jpg",
        );
      if (data.pharmacyLicense)
        body.append(
          "pharmacyLicense",
          data.pharmacyLicense,
          data.pharmacyLicense.name || "pharmacyLicense.jpg",
        );
      await signUp(body);
      setIsSubmitted(true);
      reset();
      setLogoFile(null);
      setLogoUrl("");
      setCnicFrontFile(null);
      setCnicFrontUrl("");
      setCnicBackFile(null);
      setCnicBackUrl("");
      setLicenseFile(null);
      setLicenseUrl("");
      setRecaptchaToken(null);
      localStorage.setItem("vendorName", data.businessName);
      setTimeout(() => {
        if (isModal && onClose) {
          onClose("login", MESSAGES.SUCCESS.ACCOUNT_CREATED);
        } else {
          navigate("/auth/login", {
            state: {
              successMessage: MESSAGES.SUCCESS.ACCOUNT_CREATED,
            },
          });
        }
      }, 1000);
    } catch (err) {
      console.error("Signup error:", err);
      let errorMessage = MESSAGES.ERROR.SIGNUP_FAILED;
      if (err.response?.data) {
        errorMessage =
          typeof err.response.data === "string"
            ? err.response.data
            : err.response.data.message ||
              err.response.data.error ||
              errorMessage;
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    const isAnyCheckPendingOrInvalid =
      (currentStep === STEPS.PERSONAL_INFO &&
        emailAddress?.trim() &&
        emailStatus !== STATUS.AVAILABLE) ||
      (currentStep === STEPS.BUSINESS_BASICS &&
        organizationType === ORGANIZATION_TYPES.GROUP &&
        accountType === ACCOUNT_TYPES.BRANCHES &&
        (branchId?.trim() || pharmacyCode?.trim()) &&
        groupValidationStatus !== STATUS.VALID) ||
      (currentStep === STEPS.ACCOUNT_SETUP &&
        username?.trim() &&
        usernameStatus !== STATUS.AVAILABLE) ||
      (currentStep === STEPS.ACCOUNT_SETUP &&
        referralCode?.trim() &&
        crnStatus !== STATUS.VALID && crnStatus !== "");

    if (isAnyCheckPendingOrInvalid) {
      return;
    }

    let isValid = true;

    if (currentStep !== STEPS.REVIEW) {
      const fieldsToValidate = STEP_FIELDS[currentStep];
      
      if (currentStep === STEPS.BUSINESS_BASICS) {
        const businessBasicFields = [...fieldsToValidate];
        businessBasicFields.push("organizationType");
        businessBasicFields.push("businessType");
        
        if (organizationType === ORGANIZATION_TYPES.GROUP) {
          businessBasicFields.push("accountType");
        }
        
        isValid = await trigger(businessBasicFields);
      } else if (currentStep === STEPS.ACCOUNT_SETUP) {
        const accountSetupFields = [...fieldsToValidate, "referralCode"];
        isValid = await trigger(accountSetupFields);
      } else {
        isValid = await trigger(fieldsToValidate);
      }
    } else {
      isValid = await trigger();
    }

    const isGroupValid =
      organizationType !== ORGANIZATION_TYPES.GROUP ||
      (groupValidationStatus !== STATUS.INVALID &&
        groupValidationStatus !== STATUS.ERROR);

    const isCrnValid = !referralCode?.trim() || crnStatus === STATUS.VALID;

    if (
      isValid &&
      (currentStep !== STEPS.PERSONAL_INFO || emailStatus !== STATUS.TAKEN) &&
      (currentStep !== STEPS.BUSINESS_BASICS || isGroupValid) &&
      (currentStep !== STEPS.ACCOUNT_SETUP ||
        (usernameStatus !== STATUS.TAKEN && terms && recaptchaToken && isCrnValid))
    ) {
      setCompletedSteps(prev => {
        const newSteps = [...new Set([...prev, currentStep])];
        return newSteps;
      });
      
      const currentIndex = stepOrder.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(stepOrder[currentIndex + 1]);
      } else {
        await handleSubmit(onSubmit)();
      }
    }
  };

  const handlePrev = () => {
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (isSubmitting || !terms || !recaptchaToken)) {
      e.preventDefault();
    }
  };

  // ========== RENDER FUNCTIONS ==========
  const renderStatusIndicator = (status, message) => {
    const getStatusContent = () => {
      switch (status) {
        case STATUS.CHECKING:
          return (
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {status === emailStatus ? MESSAGES.STATUS.CHECKING_EMAIL : 
               status === usernameStatus ? MESSAGES.STATUS.CHECKING_USERNAME :
               status === crnStatus ? "Validating referral code..." : 
               MESSAGES.STATUS.VALIDATING}
            </p>
          );
        case STATUS.AVAILABLE:
        case STATUS.VALID:
          return (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {message}
            </p>
          );
        case STATUS.TAKEN:
        case STATUS.INVALID:
          return (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {message}
            </p>
          );
        case STATUS.ERROR:
          return <p className="text-sm text-red-600">{message}</p>;
        default:
          return null;
      }
    };

    return <div className="mt-2 min-h-[20px]">{getStatusContent()}</div>;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.PERSONAL_INFO:
        return (
          <div>
            <h3 className="text-xl font-semibold text-[#30426B] mb-5">
              Step 1: Personal Info
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={allFormData.firstName || ""}
                  onChange={(e) => {
                    setValue("firstName", e.target.value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  maxLength={20}
                  disabled={loading || isSubmitting}
                  className={`w-full px-4 py-3 border ${
                    errors.firstName ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C5690] focus:border-[#3C5690] ${
                    loading || isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
                {errors.firstName && (
                  <p className="text-red-600 text-sm mt-1">{errors.firstName.message}</p>
                )}
              </div>
              
              <InputText
                label="Last Name"
                name="lastName"
                type="text"
                error={errors.lastName}
                disabled={loading || isSubmitting}
                maxLength={20}
                register={register}
                required={true}
              />
            </div>
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <InputText
                  label="Email Address"
                  name="emailAddress"
                  type="email"
                  error={errors.emailAddress}
                  disabled={loading || isSubmitting}
                  maxLength={254}
                  register={register}
                  required={true}
                />
              
                {renderStatusIndicator(emailStatus, emailAvailableMsg)}
              </div>
              <InputPhone
                label="Phone Number"
                name="phoneNumber"
                value={allFormData.phoneNumber || ""}
                onChange={(phone) => {
                  setValue("phoneNumber", phone, {
                    shouldValidate: true,
                    shouldDirty: true
                  });
                }}
                error={errors.phoneNumber}
                disabled={loading || isSubmitting}
                required={true}
              />
            </div>
          </div>
        );

      case STEPS.BUSINESS_BASICS:
        return (
          <div>
            <h3 className="text-xl font-semibold text-[#30426B] mb-5">
              Step 2: Business Basics
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <InputText
                label="Business Name"
                name="businessName"
                type="text"
                error={errors.businessName}
                disabled={loading || isSubmitting}
                maxLength={50}
                register={register}
                required={true}
              />
              <InputSelect
                label="Business Category"
                name="businessType"
                error={errors.businessType}
                disabled={loading || isSubmitting}
                register={register}
                required={true}
                value={allFormData.businessType || BUSINESS_TYPES.PHARMACY}
              >
                <option value={BUSINESS_TYPES.PHARMACY}>
                  {BUSINESS_TYPES.PHARMACY}
                </option>
              </InputSelect>
            </div>
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <InputSelect
                label="Organization Type"
                name="organizationType"
                error={errors.organizationType}
                disabled={loading || isSubmitting}
                register={register}
                required={true}
                value={allFormData.organizationType || ORGANIZATION_TYPES.INDIVIDUAL}
              >
                <option value={ORGANIZATION_TYPES.INDIVIDUAL}>
                  {ORGANIZATION_TYPES.INDIVIDUAL}
                </option>
                <option value={ORGANIZATION_TYPES.GROUP}>
                  {ORGANIZATION_TYPES.GROUP}
                </option>
              </InputSelect>
              
              {organizationType === ORGANIZATION_TYPES.GROUP && (
                <InputText
                  label="Account Type"
                  name="accountType"
                  type="text"
                  value={ACCOUNT_TYPES.BRANCHES}
                  readOnly={true}
                  required={true}
                  inputClassName="bg-gray-50 text-gray-600"
                />
              )}
            </div>
            
            {organizationType === ORGANIZATION_TYPES.GROUP && (
              <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <InputText
                  label="Branch ID"
                  name="branchId"
                  type="text"
                  error={errors.branchId}
                  disabled={loading || isSubmitting}
                  maxLength={15}
                  register={register}
                />
                <InputText
                  label="Link Branch Code"
                  name="pharmacyCode"
                  type="text"
                  error={errors.pharmacyCode}
                  disabled={loading || isSubmitting}
                  maxLength={10}
                  register={register}
                />
              </div>
            )}
            
            {organizationType === ORGANIZATION_TYPES.GROUP && accountType && (
              renderStatusIndicator(groupValidationStatus, groupValidationMsg)
            )}
          </div>
        );

      case STEPS.BUSINESS_DETAILS:
        return (
          <div>
            <h3 className="text-xl font-semibold text-[#30426B] mb-5">
              Step 3: Business Details
            </h3>
            <InputTextarea
              label="Business Description"
              name="businessDescription"
              error={errors.businessDescription}
              disabled={loading || isSubmitting}
              maxLength={200}
              register={register}
              required={true}
            />
            
            <div className="mt-5">
              <InputText
                label="Business Logo"
                name="logoImage"
                type="text"
                value={logoUrl ? "Logo uploaded ✓" : ""}
                readOnly={true}
                required={true}
                error={errors.logoImage}
                inputClassName="bg-gray-50 text-gray-600"
              />
              <LogoUploader
                logoUrl={logoUrl}
                setLogoUrl={setLogoUrl}
                setLogoFile={setLogoFile}
                disabled={loading || isSubmitting}
              />
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-[#30426B] mb-4">Pharmacy License Information</h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <InputText
                  label="Pharmacy License Number"
                  name="pharmacyLicenseNumber"
                  type="text"
                  error={errors.pharmacyLicenseNumber}
                  disabled={loading || isSubmitting}
                  maxLength={30}
                  register={register}
                  required={true}
                  placeholder="e.g., PH-ISB-2024-9988"
                />
                
                <DatePicker
                  label="Pharmacy License Expiry Date"
                  value={allFormData.pharmacyLicenseExpiryDate}
                  onChange={(date) => {
                    setValue("pharmacyLicenseExpiryDate", date, {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }}
                  error={errors.pharmacyLicenseExpiryDate}
                  disabled={loading || isSubmitting}
                  required={true}
                  minDate={new Date().toISOString().split('T')[0]}
                  placeholder="Select expiry date"
                />
              </div>

              <div className="mt-5">
                <InputText
                  label="Pharmacy License Image"
                  name="pharmacyLicense"
                  type="text"
                  value={licenseUrl ? "License uploaded ✓" : ""}
                  readOnly={true}
                  required={true}
                  error={errors.pharmacyLicense}
                  inputClassName="bg-gray-50 text-gray-600"
                />
                <CnicUploader
                  cnicUrl={licenseUrl}
                  setCnicUrl={setLicenseUrl}
                  setCnicFile={setLicenseFile}
                  disabled={loading || isSubmitting}
                  uploadText="Upload Pharmacy License or drag and drop"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a clear image of your pharmacy license. Accepted formats: JPG, PNG (Max 2MB)
                </p>
              </div>
            </div>
          </div>
        );

      case STEPS.ADDRESS_DOCUMENTS:
        return (
          <div>
            <h3 className="text-xl font-semibold text-[#30426B] mb-5">
              Step 4: Address & Documents
            </h3>
            <InputText
              label="Business Address"
              name="businessAddress"
              type="text"
              error={errors.businessAddress}
              disabled={loading || isSubmitting}
              maxLength={70}
              register={register}
              required={true}
            />
            <div className="mt-5 grid grid-cols-3 gap-4">
              <InputSelect
                label="City"
                name="city"
                error={errors.city}
                disabled={loading || isSubmitting || citiesLoading}
                register={register}
                required={true}
                value={allFormData.city || ""}
              >
                <option value="">
                  {citiesLoading
                    ? MESSAGES.UI.LOADING_CITIES
                    : citiesError
                    ? MESSAGES.UI.CITIES_UNAVAILABLE
                    : MESSAGES.UI.SELECT_CITY}
                </option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </InputSelect>
              <InputSelect
                label="Province"
                name="state"
                error={errors.state}
                disabled={loading || isSubmitting}
                register={register}
                required={true}
                value={allFormData.state || ""}
              >
                <option value="">{MESSAGES.UI.SELECT_PROVINCE}</option>
                {PROVINCES_OF_PAKISTAN.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </InputSelect>
              <InputText
                label="ZIP/Postal Code"
                name="zip"
                type="text"         
                inputMode="numeric"   
                pattern="\d*"       
                error={errors.zip}
                disabled={loading || isSubmitting}
                maxLength={10}
                register={register}
                required={true}
              />
            </div>
            <div className="mt-5">
              <InputSelect
                label="Country"
                name="country"
                error={errors.country}
                disabled={loading || isSubmitting}
                register={register}
                required={true}
                value={allFormData.country || COUNTRY}
              >
                <option value={COUNTRY}>{COUNTRY}</option>
              </InputSelect>
            </div>
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <InputText
                  label="CNIC Front"
                  name="cnicFront"
                  type="text"
                  value={cnicFrontUrl ? "CNIC Front uploaded ✓" : ""}
                  readOnly={true}
                  required={true}
                  error={errors.cnicFront}
                  inputClassName="bg-gray-50 text-gray-600"
                />
                <CnicUploader
                  cnicUrl={cnicFrontUrl}
                  setCnicUrl={setCnicFrontUrl}
                  setCnicFile={setCnicFrontFile}
                  disabled={loading || isSubmitting}
                  uploadText="Upload a CNIC Front or drag and drop"
                />
              </div>
              <div>
                <InputText
                  label="CNIC Back"
                  name="cnicBack"
                  type="text"
                  value={cnicBackUrl ? "CNIC Back uploaded ✓" : ""}
                  readOnly={true}
                  required={true}
                  error={errors.cnicBack}
                  inputClassName="bg-gray-50 text-gray-600"
                />
                <CnicUploader
                  cnicUrl={cnicBackUrl}
                  setCnicUrl={setCnicBackUrl}
                  setCnicFile={setCnicBackFile}
                  disabled={loading || isSubmitting}
                  uploadText="Upload a CNIC Back or drag and drop"
                />
              </div>
            </div>
          </div>
        );

      case STEPS.ACCOUNT_SETUP:
        return (
          <div>
            <h3 className="text-xl font-semibold text-[#30426B] mb-5">
              Step 5: Account Setup
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputText
                  label="Username"
                  name="username"
                  type="text"
                  error={errors.username}
                  disabled={loading || isSubmitting}
                  maxLength={30}
                  register={register}
                  required={true}
                />
                {renderStatusIndicator(usernameStatus, usernameAvailableMsg)}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <InputText
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                error={errors.password}
                disabled={loading || isSubmitting}
                maxLength={50}
                postfix={showPassword ? <FaEyeSlash /> : <FaEye />}
                postfixAction={() => setShowPassword(!showPassword)}
                register={register}
                autocomplete="new-password"
                required={true}
              />
              <InputText
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                error={errors.confirmPassword}
                disabled={loading || isSubmitting}
                maxLength={50}
                postfix={showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                postfixAction={() => setShowConfirmPassword(!showConfirmPassword)}
                register={register}
                autocomplete="new-password"
                required={true}
              />
            </div>
            
            {/* Referral Code Field with Validation */}
            <div className="mt-5">
              <InputText
                label="Company Referral Code (Optional)"
                name="referralCode"
                type="text"
                error={errors.referralCode}
                disabled={loading || isSubmitting}
                maxLength={50}
                register={register}
                placeholder="Enter referral code if you have one"
                helperText="If you were referred by someone, enter their referral code here"
              />
              {renderStatusIndicator(crnStatus, crnValidationMsg)}
            </div>

            <div className="mt-8">
              <ReCaptchaWidget
                siteKey={RECAPTCHA_SITE_KEY}
                onChange={(token) => {
                  setRecaptchaToken(token);
                  setError("");
                }}
              />
            </div>
            <div className="mt-8 space-y-4">
              <InputCheckbox
                label={
                  <>
                    I agree to the{" "}
                    <a
                      href={MESSAGES.UI.PRIVACY_POLICY_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3C5690] hover:underline"
                    >
                      {MESSAGES.UI.PRIVACY_POLICY}
                    </a>{" "}
                    and{" "}
                    <a
                      href={MESSAGES.UI.TERMS_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3C5690] hover:underline"
                    >
                      {MESSAGES.UI.TERMS_CONDITIONS}
                    </a>
                  </>
                }
                name="terms"
                error={errors.terms}
                disabled={loading || isSubmitting}
                register={register}
                required={true}
              />
              <InputCheckbox
                label="I want to receive marketing communications and updates"
                name="marketing"
                error={errors.marketing}
                disabled={loading || isSubmitting}
                register={register}
              />
            </div>
          </div>
        );

      case STEPS.REVIEW:
        return (
          <div>
            <h3 className="text-xl font-semibold text-[#30426B] mb-5">
              Step 6: Review Your Details
            </h3>
            <div className="space-y-8">
              {renderReviewSection("Personal Info", [
                { label: "First Name", value: allFormData.firstName },
                { label: "Last Name", value: allFormData.lastName },
                { label: "Email Address", value: allFormData.emailAddress },
                { label: "Phone Number", value: normalizeContact(allFormData.phoneNumber) },
              ])}
              {renderReviewSection("Business Basics", [
                { label: "Business Name", value: allFormData.businessName },
                { label: "Business Category", value: allFormData.businessType },
                { label: "Organization Type", value: allFormData.organizationType },
                ...(allFormData.organizationType === ORGANIZATION_TYPES.GROUP
                  ? [{ label: "Account Type", value: ACCOUNT_TYPES.BRANCHES }]
                  : []),
                ...(allFormData.organizationType === ORGANIZATION_TYPES.GROUP
                  ? [
                      { label: "Branch ID", value: allFormData.branchId },
                      { label: "Link Branch Code", value: allFormData.pharmacyCode },
                    ]
                  : []),
              ])}
              {renderReviewSection("Business Details", [
                { label: "Business Description", value: allFormData.businessDescription, isTextarea: true },
                { label: "Business Logo", value: logoUrl, isImage: true },
              ])}
              {renderReviewSection("Pharmacy License Information", [
                { label: "Pharmacy License Number", value: allFormData.pharmacyLicenseNumber },
                { label: "Pharmacy License Expiry Date", value: allFormData.pharmacyLicenseExpiryDate },
                { label: "Pharmacy License Image", value: licenseUrl, isImage: true },
              ])}
              {renderReviewSection("Address & Documents", [
                { label: "Business Address", value: allFormData.businessAddress },
                { label: "City", value: allFormData.city },
                { label: "Province", value: allFormData.state },
                { label: "ZIP/Postal Code", value: allFormData.zip },
                { label: "Country", value: allFormData.country },
                { label: "CNIC Front", value: cnicFrontUrl, isImage: true },
                { label: "CNIC Back", value: cnicBackUrl, isImage: true },
              ])}
              {renderReviewSection("Account Setup", [
                { label: "Username", value: allFormData.username },
                { label: "Password", value: MESSAGES.UI.PASSWORD_MASKED, isMasked: true },
                { label: "Confirm Password", value: MESSAGES.UI.PASSWORD_MASKED, isMasked: true },
                { 
                  label: "Referral Code", 
                  value: allFormData.referralCode || MESSAGES.UI.NOT_PROVIDED,
                  validationStatus: allFormData.referralCode ? crnStatus : null,
                  validationMessage: allFormData.referralCode ? crnValidationMsg : null
                },
              ])}
              <div className="mt-8 space-y-4">
                <div className="flex items-center">
                  <input
                    id="review-terms"
                    type="checkbox"
                    checked={allFormData.terms}
                    disabled
                    className="h-4 w-4 text-[#3C5690] border-gray-300 rounded cursor-not-allowed"
                  />
                  <label htmlFor="review-terms" className="ml-3 block text-sm text-gray-700">
                    I agree to the {MESSAGES.UI.PRIVACY_POLICY} and {MESSAGES.UI.TERMS_CONDITIONS}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="review-marketing"
                    type="checkbox"
                    checked={allFormData.marketing}
                    disabled
                    className="h-4 w-4 text-[#3C5690] border-gray-300 rounded cursor-not-allowed"
                  />
                  <label htmlFor="review-marketing" className="ml-3 block text-sm text-gray-700">
                    I want to receive marketing communications and updates
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderReviewSection = (title, fields) => {
    const getValue = (value) => {
      if (value === null || value === undefined || value === "") {
        return MESSAGES.UI.NOT_APPLICABLE;
      }
      return value;
    };

    return (
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={index}>
              {field.isTextarea ? (
                <InputTextarea
                  label={field.label}
                  value={getValue(field.value)}
                  readOnly={true}
                />
              ) : field.isImage ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {field.label}
                  </label>
                  {field.value ? (
                    <img
                      src={field.value}
                      alt={field.label}
                      className="w-full h-32 object-cover border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center border border-gray-300 rounded-lg bg-gray-100 text-gray-600">
                      {MESSAGES.UI.NOT_UPLOADED}
                    </div>
                  )}
                </div>
              ) : field.isMasked ? (
                <InputText
                  label={field.label}
                  type="password"
                  value={field.value}
                  readOnly={true}
                />
              ) : (
                <div>
                  <InputText
                    label={field.label}
                    value={getValue(field.value)}
                    readOnly={true}
                    helperText={field.isOptional ? "Optional field" : ""}
                  />
                  {field.validationStatus && field.validationMessage && (
                    <div className="mt-1">
                      {renderStatusIndicator(field.validationStatus, field.validationMessage)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Copyright footer component
  const CopyrightFooter = () => (
    <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
      <p>© 2026 AppAura. All rights reserved.</p>
    </div>
  );

  // ========== MAIN RENDER ==========
  if (isSubmitted) {
    return (
      <Loader
        message={MESSAGES.SUCCESS.APPLICATION_SUBMITTED}
        subMessage={MESSAGES.SUCCESS.PROCESSING}
      />
    );
  }

  const isNextDisabled = () => {
    if (loading || isSubmitting) return true;

    switch (currentStep) {
      case STEPS.PERSONAL_INFO:
        return (
          (emailAddress?.trim() && emailStatus !== STATUS.AVAILABLE) ||
          !allFormData.firstName ||
          !allFormData.lastName ||
          !allFormData.emailAddress ||
          !allFormData.phoneNumber
        );
      case STEPS.BUSINESS_BASICS:
        if (!allFormData.businessName || !allFormData.businessType || !allFormData.organizationType) {
          return true;
        }
        
        if (organizationType === ORGANIZATION_TYPES.GROUP) {
          return (branchId?.trim() || pharmacyCode?.trim()) && groupValidationStatus !== STATUS.VALID;
        }
        return false;
      case STEPS.BUSINESS_DETAILS:
        return (
          !allFormData.businessDescription ||
          !logoFile ||
          !licenseFile ||
          !allFormData.pharmacyLicenseNumber ||
          !allFormData.pharmacyLicenseExpiryDate
        );
      case STEPS.ACCOUNT_SETUP:
        const isCrnInvalid = referralCode?.trim() && crnStatus !== STATUS.VALID && crnStatus !== "";
        
        return (
          (username?.trim() && usernameStatus !== STATUS.AVAILABLE) || 
          !terms || 
          !recaptchaToken ||
          !allFormData.username ||
          !allFormData.password ||
          !allFormData.confirmPassword ||
          isCrnInvalid
        );
      case STEPS.REVIEW:
        return !terms || !isFormValid;
      default:
        return false;
    }
  };

  const formContent = (
    <>
      {isModal && (
        <Button
          onClick={() => onClose("login")}
          className="absolute top-4 right-4 z-[999] bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all hover:scale-110 active:scale-95"
        >
          <MdClose className="text-2xl text-gray-800" />
        </Button>
      )}
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#30426B]">
          {MESSAGES.UI.VENDOR_REGISTRATION}
        </h2>
        <p className="mt-2 text-base text-gray-600">
          {MESSAGES.UI.JOIN_MARKETPLACE}
        </p>
      </div>
      <div className="mb-8 lg:block hidden">
        <Stepper
          steps={steps.map(s => s.title)}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />
      </div>
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-6"
          onKeyDown={handleKeyDown}
        >
          {renderStepContent()}
          
          <div className="flex justify-between">
            {currentStep !== STEPS.PERSONAL_INFO && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={loading || isSubmitting}
                className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-all"
              >
                Previous
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled()}
              className="ml-auto px-6 py-3 rounded-lg bg-gradient-to-r from-[#30426B] via-[#3C5690] to-[#5A75C7] hover:from-[#2a3a5e] hover:via-[#334c82] hover:to-[#5068b3] text-white font-semibold transition-all duration-300 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{MESSAGES.STATUS.PROCESSING}</span>
                </>
              ) : currentStep !== STEPS.REVIEW ? (
                "Next"
              ) : (
                "Submit"
              )}
            </button>
          </div>
          
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>
              This site is protected by reCAPTCHA and the Google{" "}
              <a
                href={MESSAGES.UI.GOOGLE_PRIVACY}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3C5690] hover:underline"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                href={MESSAGES.UI.GOOGLE_TERMS}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3C5690] hover:underline"
              >
                Terms of Service
              </a>{" "}
              apply.
            </p>
          </div>

          <CopyrightFooter />
        </form>
      </div>
    </>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-white flex justify-center items-center z-50 overflow-hidden">
        <div className="relative max-w-2xl w-full bg-white shadow-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          {formContent}
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {formContent}
    </div>
  );
});

Signup.displayName = "Signup";

const SignupWithErrorBoundary = (props) => (
  <SignupErrorBoundary>
    <Signup {...props} />
  </SignupErrorBoundary>
);

export default SignupWithErrorBoundary;