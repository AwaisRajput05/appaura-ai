// src/App.jsx
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './App.css';
import DashboardRoutes from './routes/DashboardRoutes';
import { AuthProvider } from './components/auth/hooks/AuthContext';
import KeyboardNavigator from './components/common/KeyboardNavigator';
import CommandPalette from './components/common/CommandPalette';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Now useKeyboardShortcuts is inside BrowserRouter */}
        <InnerApp />
      </BrowserRouter>
    </AuthProvider>
  );
}
function InnerApp() {
  useKeyboardShortcuts(); // ← Now safe: inside <BrowserRouter>
  return (
    <>
      <KeyboardNavigator />
      <CommandPalette />
      <DashboardRoutes />
    </>
  );
}
export default App;
