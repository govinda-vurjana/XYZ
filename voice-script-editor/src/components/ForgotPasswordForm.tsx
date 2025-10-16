import { useState } from 'react';
import { AuthService } from '../services/auth';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await AuthService.requestPasswordReset(email);
      setMessage(result.message);
      setIsSuccess(true);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative w-full max-w-md">
          {/* Logo and branding */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mb-6">
              <svg className="w-6 h-6 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-8">
              ScriptEase
            </h1>
            
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Check Your Email
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Success card */}
          <div className="max-w-sm mx-auto">
            <div className="bg-green-900/20 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6 mb-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Email Sent</h3>
              </div>
              <p className="text-gray-300 text-sm">
                We've sent a password reset link to <strong>{email}</strong>. 
                The link will expire in 1 hour for security.
              </p>
            </div>

            <div className="text-center">
              <p className="text-gray-400 mb-4">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={onBackToLogin}
                className="text-amber-500 hover:text-amber-400 font-semibold transition-colors duration-200 underline"
              >
                Back to Login
              </button>
            </div>

            {/* Demo info */}
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                Demo: Check the browser console for the reset link
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
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
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Forgot Password?
            </h2>
            <p className="text-gray-400 text-lg">
              Enter your email and we'll send you a reset link.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-sm mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-4 bg-slate-800/80 border-0 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 ${
                  error ? 'ring-2 ring-red-500/50' : ''
                }`}
                placeholder="Email Address"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-amber-700 disabled:to-orange-700 disabled:cursor-not-allowed text-slate-900 font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none text-lg"
            >
              {isSubmitting ? 'Sending Reset Link...' : 'Send Reset Link'}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Remember your password?
              <button
                type="button"
                onClick={onBackToLogin}
                className="ml-2 text-amber-500 hover:text-amber-400 font-semibold transition-colors duration-200 underline"
              >
                Back to Login
              </button>
            </p>
          </div>

          {/* Demo info */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Demo: Use any registered email address
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}