// src/components/auth/Login.jsx
import { memo, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginSchema } from "../common/form/validations/AuthSchema";
import { useAuth } from "./hooks/useAuth";
import Form from "../common/form/Form";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import InputText from "../ui/forms/InputText";
import Alert from "../ui/feedback/Alert";
import ReCAPTCHA from "react-google-recaptcha";

const Login = memo(({ onClose, isModal = false, initialSuccess = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || "",
  );
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isEmployee, setIsEmployee] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const emailInputRef = useRef(null);
  const captchaRef = useRef(null);

  useEffect(() => {
    const storedAttempts = sessionStorage.getItem("loginFailedAttempts");
    if (storedAttempts) {
      setFailedAttempts(parseInt(storedAttempts, 10));
    }
  }, []);

  useEffect(() => {
    if (initialSuccess) {
      setSuccessMessage(initialSuccess);
    }
  }, [initialSuccess]);

  useEffect(() => {
    if (loginSuccess) {
      sessionStorage.removeItem("loginFailedAttempts");
      sessionStorage.removeItem("redirectUrl");
      navigate("/dashboard", { replace: true });
    }
  }, [loginSuccess, navigate]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 10000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const onSubmit = async (data) => {
    try {
      setError("");
      
      const payload = {
        email: data.email,
        password: data.password,
        isEmployee: isEmployee,
      };
      
      if (captchaRequired) {
        if (!captchaToken) {
          setError("Please complete the CAPTCHA verification");
          return;
        }
        payload.captchaToken = captchaToken;
      }
      
      const result = await signIn(payload);
      
      if (result) {
        setLoginSuccess(true);
        if (isModal && onClose) onClose();
      }
    } catch (err) {
      if (err.captchaRequired === true) {
        setCaptchaRequired(true);
        
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        sessionStorage.setItem("loginFailedAttempts", newAttempts.toString());
        
        setError(err.message || "Captcha verification required. Please complete the CAPTCHA.");
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        sessionStorage.setItem("loginFailedAttempts", newAttempts.toString());
        
        if (newAttempts >= 3) {
          setCaptchaRequired(true);
          setError("Too many failed attempts. Please complete CAPTCHA verification.");
        } else {
          setError(err.message || `Login failed. Please try again. (Attempt ${newAttempts}/3)`);
        }
      }
      
      if (captchaRequired) {
        setCaptchaToken("");
        if (captchaRef.current) {
          captchaRef.current.reset();
        }
      }
    }
  };

  const handleForgotPassword = () => {
    const currentEmail = emailInputRef.current?.value?.trim() || "";
    if (isModal && onClose) {
      onClose("forget", currentEmail);
    } else {
      navigate("/auth/forgot-password", { state: { email: currentEmail } });
    }
  };

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  const handleCaptchaExpired = () => {
    setCaptchaToken("");
  };

  return (
    <div
      className={
        isModal
          ? "relative max-w-md w-full bg-white shadow-xl rounded-2xl p-6"
          : "max-w-xl w-full space-y-8 bg-white shadow-xl rounded-xl relative p-8"
      }
    >
      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          show={!!successMessage}
          className="mb-6"
        />
      )}

      {error && (
        <Alert
          variant="error"
          message={error}
          show={!!error}
          className="mb-6"
        />
      )}

      <Form
        schema={loginSchema}
        onSubmit={onSubmit}
        submitText="Sign In"
        pendingText="Signing In..."
        defaultValues={{ email: "", password: "" }}
        submitButtonProps={{
          disabled: loading,
   style: {
  background: "linear-gradient(to right, #30426B, #3C5690, #5A75C7)",
  color: "white",
  border: "none",
  padding: "10px 28px",
  borderRadius: "10px",
  fontWeight: "600",
  fontSize: "14px",
  width: "100%",
  cursor: "pointer",
  transition: "all 0.3s",
  display: "inline-flex",  
  alignItems: "center",       
  justifyContent: "center",   
  gap: "10px",               
  whiteSpace: "nowrap",        
  minWidth: "130px",
  boxShadow: "0 4px 6px rgba(0,0,0,0.15)",
},
onMouseEnter: (e) => {
  e.target.style.background = "linear-gradient(to right, #2a3a5e, #334c82, #5068b3)";
  e.target.style.transform = "translateY(-1px)";
},
onMouseLeave: (e) => {
  e.target.style.background = "linear-gradient(to right, #30426B, #3C5690, #5A75C7)";
  e.target.style.transform = "translateY(0)";
},
        }}
        className="space-y-0"
        formProps={{ className: "space-y-6" }}
      >
        {({ register, errors }) => {
          return (
            <>
              <InputText
                label="Email Address"
                name="email"
                type="email"
                inputRef={emailInputRef}
                register={register}
                error={errors.email}
                disabled={loading}
                placeholder="Enter your email"
                maxLength={75}
                required={true}
                inputClassName="caret-[#3C5690] focus:ring-2 focus:ring-[#3C5690] focus:border-[#3C5690]"
                prefix={
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                }
              />

              <InputText
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                register={register}
                error={errors.password}
                disabled={loading}
                placeholder="Enter your password"
                maxLength={75}
                required={true}
                inputClassName="caret-[#3C5690] focus:ring-2 focus:ring-[#3C5690] focus:border-[#3C5690]"
                prefix={
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 0 0-8 0v4h8z"
                    />
                  </svg>
                }
                postfix={showPassword ? <FaEyeSlash /> : <FaEye />}
                postfixAction={() => setShowPassword(!showPassword)}
              />

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isEmployee"
                  checked={isEmployee}
                  onChange={(e) => setIsEmployee(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 text-[#3C5690] focus:ring-[#3C5690] border-gray-300 rounded cursor-pointer disabled:opacity-50"
                />
                <label
                  htmlFor="isEmployee"
                  className="ml-2 block text-sm text-gray-700 cursor-pointer disabled:opacity-50"
                >
                  Login as Employee
                </label>
              </div>

              {/* CAPTCHA - FIXED FOR VITE */}
              {captchaRequired && (
                <div className="mt-4 flex justify-center">
                  <ReCAPTCHA
                    ref={captchaRef}
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    onChange={handleCaptchaChange}
                    onExpired={handleCaptchaExpired}
                    theme="light"
                    size="normal"
                  />
                </div>
              )}

              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-[#3C5690] hover:text-[#2a3a5e] hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            </>
          );
        }}
      </Form>

      {/* Footer – reCAPTCHA notice and copyright */}
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>
          This site is protected by reCAPTCHA and the Google{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3C5690] hover:underline"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3C5690] hover:underline"
          >
            Terms of Service
          </a>{" "}
          apply.
        </p>
        <p className="mt-2">
          © 2026 AppAura. All rights reserved.
        </p>
      </div>
    </div>
  );
});

Login.displayName = "Login";
export default Login;