// ========== CONSTANTS ==========
export const API_CONFIG = {
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
};

export const STEPS = {
  PERSONAL_INFO: "Personal Info",
  BUSINESS_BASICS: "Business Basics",
  BUSINESS_DETAILS: "Business Details",
  ADDRESS_DOCUMENTS: "Address & Documents",
  ACCOUNT_SETUP: "Account Setup",
  REVIEW: "Review",
};

export const ORGANIZATION_TYPES = {
  INDIVIDUAL: "INDIVIDUAL",
  GROUP: "GROUP",
};

export const ACCOUNT_TYPES = {
  BRANCHES: "BRANCHES",
  SUBACCOUNT: "SUBACCOUNT",
};

export const SUB_ACCOUNT_TYPES = {
  FINANCE: "FINANCE",
};

export const BUSINESS_TYPES = {
  PHARMACY: "PHARMACY",
};

export const GROUP_VALIDATION_TYPES = {
  SUB_BRANCH: "SUB_BRANCH",
  SUB_ACCOUNT: "SUB_ACCOUNT",
};

export const COUNTRY = "Pakistan";

export const PROVINCES_OF_PAKISTAN = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit-Baltistan",
  "Azad Jammu and Kashmir",
  "Islamabad Capital Territory",
];

export const STATUS = {
  CHECKING: "checking",
  AVAILABLE: "available",
  TAKEN: "taken",
  ERROR: "error",
  VALID: "valid",
  INVALID: "invalid",
};

export const STEP_FIELDS = {
  "Personal Info": ["firstName", "lastName", "emailAddress", "phoneNumber"],
  "Business Basics": ["businessName", "businessType", "organizationType"],
  "Business Details": ["businessDescription", "logoImage"],
  "Address & Documents": [
    "businessAddress",
    "city",
    "state",
    "zip",
    "country",
    "cnicFront",
    "cnicBack",
  ],
  "Account Setup": ["username", "password", "confirmPassword", "terms"],
};

export const MESSAGES = {
  SUCCESS: {
    USERNAME_AVAILABLE: "Great! This username is available.",
    EMAIL_AVAILABLE: "Email is available!",
    VALIDATION_SUCCESS: "Validation successful!",
    ACCOUNT_CREATED: "Account created! Please verify your email.",
    APPLICATION_SUBMITTED: "Application Submitted",
    PROCESSING: "Please wait while we process your registration...",
  },
  ERROR: {
    USERNAME_EXISTS: "This username already exists.",
    EMAIL_REGISTERED: "This email is already registered.",
    INVALID_CODES: "Invalid code(s). Please check and try again.",
    BRANCH_NOT_FOUND: "BranchId or Branch Code Not Found.",
    SUBACCOUNT_NOT_FOUND: "Sub-account code not found",
    VALIDATION_FAILED: "Unable to validate. Please try again later.",
    USERNAME_CHECK: "Unable to check username availability.",
    EMAIL_CHECK: "Unable to check email availability.",
    SIGNUP_FAILED: "Signup failed. Please try again.",
    CITIES_FETCH: "Failed to fetch cities",
  },
  STATUS: {
    CHECKING_AVAILABILITY: "Checking availability...",
    CHECKING_USERNAME: "Checking username availability...",
    CHECKING_EMAIL: "Checking email availability...",
    VALIDATING: "Validating...",
    PROCESSING: "Processing...",
  },
  UI: {
    VENDOR_REGISTRATION: "Vendor Registration",
    JOIN_MARKETPLACE: "Join our marketplace and start selling to thousands of customers",
    NOT_UPLOADED: "Not uploaded",
    PASSWORD_MASKED: "********",
    NOT_APPLICABLE: "N/A",
    SELECT_CITY: "Select city",
    SELECT_PROVINCE: "Select province",
    LOADING_CITIES: "Loading cities...",
    CITIES_UNAVAILABLE: "Cities unavailable",
    SELECT_ACCOUNT_TYPE: "Select account type",
    PRIVACY_POLICY_LINK: "https://appaura.net/privacy-policy/",
    TERMS_LINK: "https://appaura.net/terms-and-conditions/",
    PRIVACY_POLICY: "Privacy Policy",
    TERMS_CONDITIONS: "Terms and Conditions",
    GOOGLE_PRIVACY: "https://policies.google.com/privacy",
    GOOGLE_TERMS: "https://policies.google.com/terms",
  },
};