import React, { useState } from 'react';
import ThemeToggle from './ThemeToggle';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  onSignup: (email: string, password: string, name: string) => void;
  onForgotPassword: () => void;
}

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  confirmPassword?: string;
  general?: string;
}

export default function LoginForm({ onLogin, onSignup, onForgotPassword }: LoginFormProps) {
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Name validation (signup only)
    if (isSignupMode) {
      if (!name.trim()) {
        newErrors.name = 'Name is required';
      } else if (name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation (signup only)
    if (isSignupMode) {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (isSignupMode) {
        await onSignup(email, password, name);
      } else {
        await onLogin(email, password);
      }
    } catch (error) {
      const errorMessage = isSignupMode 
        ? 'Signup failed. Please try again.' 
        : 'Login failed. Please check your credentials.';
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsSignupMode(!isSignupMode);
    setErrors({});
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
  };

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-900 bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl mb-6">
            <svg className="w-6 h-6 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-8">
            ScriptEase
          </h1>
          
          {isSignupMode ? (
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white dark:text-white text-gray-900 mb-4 leading-tight">
                Unleash Your<br />Story
              </h2>
              <p className="text-gray-400 dark:text-gray-400 text-gray-600 text-lg">
                Join the next generation of storytellers.
              </p>
            </div>
          ) : (
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white dark:text-white text-gray-900 mb-4">
                Welcome Back
              </h2>
              <p className="text-gray-400 dark:text-gray-400 text-gray-600 text-lg">
                Continue crafting your stories.
              </p>
            </div>
          )}
        </div>

        {/* Form card */}
        <div className="max-w-sm mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-900/50 dark:bg-red-900/50 bg-red-50 dark:bg-red-900/50 border border-red-500/50 dark:border-red-500/50 border-red-200 dark:border-red-500/50 text-red-200 dark:text-red-200 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {errors.general}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {isSignupMode && (
                <div className="relative">
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-4 bg-slate-800/80 dark:bg-slate-800/80 bg-white dark:bg-slate-800/80 border-0 rounded-xl text-white dark:text-white text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 ${
                      errors.name ? 'ring-2 ring-red-500/50' : ''
                    }`}
                    placeholder="Full Name"
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-400">{errors.name}</p>
                  )}
                </div>
              )}

              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-4 bg-slate-800/80 dark:bg-slate-800/80 bg-white dark:bg-slate-800/80 border-0 rounded-xl text-white dark:text-white text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 ${
                    errors.email ? 'ring-2 ring-red-500/50' : ''
                  }`}
                  placeholder="Email Address"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-500 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-4 bg-slate-800/80 dark:bg-slate-800/80 bg-white dark:bg-slate-800/80 border-0 rounded-xl text-white dark:text-white text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 ${
                    errors.password ? 'ring-2 ring-red-500/50' : ''
                  }`}
                  placeholder="Password"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-500 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-400">{errors.password}</p>
                )}
              </div>

              {isSignupMode && (
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-4 bg-slate-800/80 dark:bg-slate-800/80 bg-white dark:bg-slate-800/80 border-0 rounded-xl text-white dark:text-white text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 ${
                      errors.confirmPassword ? 'ring-2 ring-red-500/50' : ''
                    }`}
                    placeholder="Confirm Password"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>
              )}
            </div>

            {!isSignupMode && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors duration-200"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-amber-700 disabled:to-orange-700 disabled:cursor-not-allowed text-slate-900 font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none text-lg"
            >
              {isSubmitting 
                ? (isSignupMode ? 'Creating Account...' : 'Signing In...') 
                : (isSignupMode ? 'Create Account' : 'Sign In')
              }
            </button>
          </form>

          {/* Mode toggle */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 dark:text-gray-400 text-gray-600">
              {isSignupMode ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={toggleMode}
                className="ml-2 text-amber-500 hover:text-amber-400 font-semibold transition-colors duration-200 underline"
              >
                {isSignupMode ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

          {/* Demo info */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 dark:text-gray-500 text-gray-500 text-sm">
              Demo: Use any email and password (6+ characters)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}