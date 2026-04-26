import { Navigate } from "react-router-dom";
import { useAuth } from "../components/auth/hooks/useAuth";
import Spinner from "../components/common/spinner/Spinner";

const ProtectedRoute = ({ children, requiredRoles = [], vendorOnly = false }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Store the attempted URL
    sessionStorage.setItem('redirectUrl', window.location.pathname);
    // Redirect to login page
    return <Navigate to="/" replace />;
  }

  // Role-based access control
  if (requiredRoles.length > 0 && (!user?.role || !requiredRoles.includes(user.role))) {
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to="/dashboard" replace />;
  }

  // Vendor-specific route protection
  if (vendorOnly && user?.role !== 'VENDOR') {
    return <Navigate to="/dashboard" replace />;
  }

  // Admin-specific route protection
  if (!vendorOnly && requiredRoles.includes('ADMIN') && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public route component - redirects authenticated users to dashboard
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    // If user is already authenticated, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
export { PublicRoute };
