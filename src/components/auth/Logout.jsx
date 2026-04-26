import { useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Import reusable components
import Button from '../ui/forms/Button';
import Card from '../ui/Card';
import Alert from '../ui/feedback/Alert';

const Logout = () => {
  const { logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const cancelSignout = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-[#30426B] to-[#5A75C7] bg-clip-text text-transparent mb-6">
          Confirm Logout
        </h2>
        
        <p className="text-center text-gray-600 mb-8">
          Are you sure you want to log out?
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            onClick={handleLogout}
            loading={loading}
            loadingText="Logging out..."
            variant="primary"
            size="lg"
            className="flex-1 sm:flex-none"
            aria-label="Confirm logout"
          >
            Yes, Logout
          </Button>
          
          <Button
            onClick={cancelSignout}
            variant="secondary"
            size="lg"
            className="flex-1 sm:flex-none"
            aria-label="Cancel logout"
          >
            No, Stay
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Logout;