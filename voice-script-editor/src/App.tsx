import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import PasswordResetForm from './components/PasswordResetForm';
import Dashboard from './components/Dashboard';
import ScriptEditor from './components/ScriptEditor';
import { AuthService, type User } from './services/auth';
import { ThemeProvider } from './contexts/ThemeContext';

type AppView = 'login' | 'forgot-password' | 'reset-password' | 'dashboard' | 'script-editor';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [resetToken, setResetToken] = useState<string>('');
  const [currentScriptId, setCurrentScriptId] = useState<string>('');

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setCurrentView('dashboard');
    } else {
      // Check if this is a password reset link
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        setResetToken(token);
        setCurrentView('reset-password');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const loggedInUser = await AuthService.login(email, password);
    setUser(loggedInUser);
    setCurrentView('dashboard');
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    const newUser = await AuthService.signup(email, password, name);
    setUser(newUser);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
  };

  const handleForgotPassword = () => {
    setCurrentView('forgot-password');
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
    // Clear URL parameters if any
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleResetComplete = () => {
    setCurrentView('login');
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleOpenScript = (scriptId: string) => {
    setCurrentScriptId(scriptId);
    setCurrentView('script-editor');
  };

  const handleBackToDashboard = () => {
    setCurrentScriptId('');
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-slate-900 dark:bg-slate-900 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      );
    }

    // Render based on current view
    switch (currentView) {
      case 'forgot-password':
        return <ForgotPasswordForm onBackToLogin={handleBackToLogin} />;
      
      case 'reset-password':
        return (
          <PasswordResetForm 
            token={resetToken} 
            onResetComplete={handleResetComplete} 
          />
        );
      
      case 'dashboard':
        if (user) {
          return <Dashboard user={user} onLogout={handleLogout} onOpenScript={handleOpenScript} onUserUpdate={setUser} />;
        }
        // If no user but trying to show dashboard, fall back to login
        setCurrentView('login');
        return null;
      
      case 'script-editor':
        if (user && currentScriptId) {
          return <ScriptEditor user={user} scriptId={currentScriptId} onBackToDashboard={handleBackToDashboard} />;
        }
        // If no user or script ID, fall back to dashboard
        setCurrentView('dashboard');
        return null;
      
      case 'login':
      default:
        return (
          <LoginForm 
            onLogin={handleLogin} 
            onSignup={handleSignup}
            onForgotPassword={handleForgotPassword}
          />
        );
    }
  };

  return (
    <ThemeProvider>
      {renderContent()}
    </ThemeProvider>
  );
}

export default App