import React, { useState, useEffect } from "react";
import { MdArrowBack } from "react-icons/md";
import { apiEndpoints } from "../../services/apiEndpoints";
import { emailSchema } from "../common/form/validations/AuthSchema";

// Import reusable components
import Button from "../ui/forms/Button";
import InputText from "../ui/forms/InputText";
import Alert from "../ui/feedback/Alert";
import Card from "../ui/Card"; 

const ForgetPassword = ({ onClose, isModal = false, initialEmail = "" }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetId, setResetId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const skipNgrokWarning = { "ngrok-skip-browser-warning": "true" };

  // Set initial email if provided
  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  // Validate email
  useEffect(() => {
    if (!email) {
      setEmailError("");
      return;
    }
    emailSchema
      .validate({ email }, { abortEarly: false })
      .then(() => setEmailError(""))
      .catch((err) => setEmailError(err.inner[0]?.message || "Invalid email"));
  }, [email]);

  // Validate new password
  useEffect(() => {
    if (!newPassword) {
      setPasswordError("");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
    } else {
      setPasswordError("");
    }
  }, [newPassword]);

  // Validate confirm password
  useEffect(() => {
    if (!confirmPassword) {
      setConfirmError("");
      return;
    }
    if (confirmPassword !== newPassword) {
      setConfirmError("Passwords do not match");
    } else {
      setConfirmError("");
    }
  }, [confirmPassword, newPassword]);

  // Auto-hide message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 10000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const getResponseBody = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    try {
      if (contentType.includes("application/json")) return await res.json();
      const text = await res.text();
      return { message: text.trim() || "Operation completed" };
    } catch {
      return { message: "Invalid response" };
    }
  };

  const sendOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(
        `${apiEndpoints.forgetPasswordRequest}?email=${encodeURIComponent(email)}`,
        { method: "POST", headers: skipNgrokWarning },
      );
      const data = await getResponseBody(res);

      if (res.ok) {
        setMessage(
          "OTP sent successfully! Please verify your email",
        );
        setStep(2);
        setCountdown(30); // Start resend cooldown
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setResendLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${apiEndpoints.forgetPasswordRequest}?email=${encodeURIComponent(email)}`,
        { method: "POST", headers: skipNgrokWarning },
      );
      const data = await getResponseBody(res);
      if (res.ok) {
        setMessage("New OTP sent! Check your email");
        setCountdown(30);
      } else {
        setError(data.message || "Failed to resend OTP");
      }
    } catch {
      setError("Network error");
    } finally {
      setResendLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(
        `${apiEndpoints.forgetPasswordVerify}?email=${encodeURIComponent(email)}&otp=${otp}`,
        { method: "POST", headers: skipNgrokWarning },
      );
      const data = await getResponseBody(res);

      if (res.ok && data.resetId) {
        setResetId(data.resetId);
        setMessage("OTP verified successfully!");
        setStep(3);
      } else {
        setError(data.message || "Invalid OTP");
        setOtp(""); // Clear OTP on error
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const url = `${apiEndpoints.forgetPasswordReset}?resetId=${encodeURIComponent(resetId)}&newPassword=${encodeURIComponent(newPassword)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: skipNgrokWarning,
      });
      const data = await getResponseBody(res);

      if (res.ok) {
        setMessage("Password changed successfully! Redirecting to login...");
        setTimeout(() => onClose("login", "Password reset successful!"), 2000);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // OTP Input Handlers
  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = otp.split("");
    newOtp[index] = value;
    const updated = newOtp.join("").slice(0, 6);
    setOtp(updated);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    setOtp(paste);
    setTimeout(() => {
      const last = Math.min(paste.length - 1, 5);
      document.getElementById(`otp-${last}`)?.focus();
    }, 0);
  };

  return (
    <div className="space-y-6">
      {step > 1 && (
        <Button
          onClick={() => setStep(step - 1)}
          variant="link"
          size="sm"
          className="flex items-center text-blue-600"
        >
          <MdArrowBack className="mr-1" /> Back
        </Button>
      )}


      {message && (
        <Alert
          variant="success"
          message={message}
          className="text-center"
        />
      )}

      {error && (
        <Alert
          variant="error"
          message={error}
          className="text-center"
        />
      )}

      {/* Step 1 */}
      {step === 1 && (
        <>
          <div className="space-y-4">
            <InputText
              label="Please enter your email address"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              maxLength={32}
              error={emailError}
              required
            />
          </div>

          <Button
            onClick={sendOtp}
            loading={loading}
            loadingText="Sending..."
            disabled={!!emailError || !email}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Send OTP
          </Button>
        </>
      )}

      {/* Step 2 - Gmail-style OTP */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">
              Enter the 6-digit code sent to
            </p>
            <p className="font-semibold text-gray-800">{email}</p>
          </div>

          <div className="flex justify-center gap-2 md:gap-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={otp[index] || ""}
                onChange={(e) => handleOtpChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                className={`
                  w-12 h-12 md:w-14 md:h-14
                  text-center text-2xl font-bold text-gray-800
                  border-2 rounded-lg
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                  outline-none transition-all
                  ${otp[index] ? "border-gray-500" : "border-gray-300"}
                  ${error && !otp[index] ? "border-red-500" : ""}
                `}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <div className="flex justify-center items-center gap-3 text-sm">
            <span className="text-gray-600">Didn't receive code?</span>
            <Button
              onClick={resendOtp}
              loading={resendLoading}
              loadingText="Sending..."
              disabled={countdown > 0}
              variant="link"
              size="sm"
              className="font-medium"
            >
              {countdown > 0
                ? `Resend in ${countdown}s`
                : "Resend OTP"}
            </Button>
          </div>

          <Button
            onClick={verifyOtp}
            loading={loading}
            loadingText="Verifying..."
            disabled={otp.length !== 6}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Verify OTP
          </Button>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <>
          <div className="space-y-4">
            <InputText
              label="New Password"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 8 chars)"
              error={passwordError}
              required
            />

            <InputText
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              error={confirmError}
              required
            />
          </div>

          <Button
            onClick={resetPassword}
            loading={loading}
            loadingText="Resetting..."
            disabled={
              !!passwordError ||
              !!confirmError ||
              !newPassword ||
              !confirmPassword
            }
            variant="primary"
            size="lg"
            className="w-full"
          >
            Reset Password
          </Button>
        </>
      )}
    </div>
  );
};

export default ForgetPassword;