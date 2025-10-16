import { AuthService, type User } from '../services/auth';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const handleLogout = () => {
    AuthService.logout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <header className="relative bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
                  <path d="M10 9H8"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                ScriptEase
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-300">Welcome, {user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-slate-700/50 hover:bg-slate-600/50 text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-slate-600/50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Your Scripts</h2>
          <p className="text-gray-400">Manage your screenplay projects</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create new script card */}
          <div className="group bg-slate-800/50 backdrop-blur-sm border-2 border-dashed border-slate-600/50 rounded-2xl p-8 text-center hover:border-amber-500/50 transition-all duration-300 cursor-pointer">
            <div className="w-16 h-16 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-all duration-300">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-500 transition-colors duration-300">
              Start a New Script
            </h3>
            <p className="text-gray-400 text-sm">Create your first screenplay</p>
          </div>

          {/* Sample script cards for demonstration */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <path d="M14 2v6h6"/>
                </svg>
              </div>
              <span className="text-xs text-gray-400 bg-slate-700/50 px-2 py-1 rounded-full">
                Demo
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">The Coffee Shop</h3>
            <p className="text-gray-400 text-sm mb-4">A short film about unexpected connections...</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Edited 2 hours ago</span>
              <span>5 pages</span>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <path d="M14 2v6h6"/>
                </svg>
              </div>
              <span className="text-xs text-gray-400 bg-slate-700/50 px-2 py-1 rounded-full">
                Demo
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Midnight Express</h3>
            <p className="text-gray-400 text-sm mb-4">A thriller set on a late-night train...</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Edited yesterday</span>
              <span>23 pages</span>
            </div>
          </div>
        </div>

        {/* Success message */}
        <div className="mt-12 bg-gradient-to-r from-green-900/20 to-emerald-900/20 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white">Authentication Test Successful!</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            <div className="space-y-2">
              <p><span className="text-gray-400">User ID:</span> <span className="font-mono text-sm">{user.id}</span></p>
              <p><span className="text-gray-400">Email:</span> {user.email}</p>
              <p><span className="text-gray-400">Name:</span> {user.name}</p>
            </div>
            <div className="space-y-2">
              <p><span className="text-gray-400">Token:</span> <span className="font-mono text-sm">{AuthService.getToken()?.substring(0, 20)}...</span></p>
              <p className="text-green-400 font-medium flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                User successfully stored in localStorage
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}