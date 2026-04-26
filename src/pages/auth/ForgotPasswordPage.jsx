// src/pages/auth/ForgotPasswordPage.jsx
import { useNavigate, useLocation } from "react-router-dom";
import ForgetPassword from "../../components/auth/Forget";
import AuthLayout from "../../components/layout/auth/AuthLayout";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || "";

  const handleBackToLogin = () => {
    navigate("/auth/login");
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive a password reset code."
      heroTitle="Secure Account Recovery"
      footerText="Remember your password?"
      footerLinkText="Back to Login"
      onFooterLinkClick={handleBackToLogin}
    >
      <ForgetPassword
        onClose={handleBackToLogin}
        isModal={false}
        initialEmail={initialEmail}
      />
    </AuthLayout>
  );
}
