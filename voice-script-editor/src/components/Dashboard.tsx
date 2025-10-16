import { useState, useEffect } from 'react';
import { AuthService, type User } from '../services/auth';
import { ScriptService, type Script } from '../services/script';
import CreateScriptModal from './CreateScriptModal';
import ThemeToggle from './ThemeToggle';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onOpenScript: (scriptId: string) => void;
}

export default function Dashboard({ user, onLogout, onOpenScript }: DashboardProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadScripts();
  }, [user.id]);

  const loadScripts = () => {
    setIsLoading(true);
    const userScripts = ScriptService.getUserScripts(user.id);
    setScripts(userScripts);
    setIsLoading(false);
  };

  const handleLogout = () => {
    AuthService.logout();
    onLogout();
  };

  const handleCreateScript = () => {
    setIsCreateModalOpen(true);
  };

  const handleScriptCreated = () => {
    loadScripts(); // Refresh the scripts list
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-gray-900 dark:text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <header className="relative bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700/50">
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
              <ThemeToggle />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Welcome, {user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-200 dark:bg-slate-700/50 hover:bg-gray-300 dark:hover:bg-slate-600/50 text-gray-700 dark:text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-gray-300 dark:border-slate-600/50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your Scripts</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your screenplay projects</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading scripts...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create new script card */}
            <div 
              onClick={handleCreateScript}
              className="group bg-slate-800/50 dark:bg-slate-800/50 bg-white dark:bg-slate-800/50 backdrop-blur-sm border-2 border-dashed border-slate-600/50 dark:border-slate-600/50 border-gray-300 dark:border-slate-600/50 rounded-2xl p-8 text-center hover:border-amber-500/50 transition-all duration-300 cursor-pointer"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-all duration-300">
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white dark:text-white text-gray-900 mb-2 group-hover:text-amber-500 transition-colors duration-300">
                Start a New Script
              </h3>
              <p className="text-gray-400 dark:text-gray-400 text-gray-600 text-sm">
                {scripts.length === 0 ? 'Create your first screenplay' : 'Add another script'}
              </p>
            </div>

            {/* User's scripts */}
            {scripts.map((script) => (
              <div 
                key={script.id}
                onClick={() => onOpenScript(script.id)}
                className="bg-slate-800/50 dark:bg-slate-800/50 bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 dark:border-slate-700/50 border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 dark:hover:border-slate-600/50 hover:border-gray-300 dark:hover:border-slate-600/50 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                      <path d="M14 2v6h6"/>
                    </svg>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-400 text-gray-600 bg-slate-700/50 dark:bg-slate-700/50 bg-gray-100 dark:bg-slate-700/50 px-2 py-1 rounded-full">
                    Script
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white dark:text-white text-gray-900 mb-2 truncate">{script.title}</h3>
                <p className="text-gray-400 dark:text-gray-400 text-gray-600 text-sm mb-4 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {script.description || 'No description provided'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 text-gray-500">
                  <span>Edited {ScriptService.formatTimeAgo(script.updatedAt)}</span>
                  <span>{script.pageCount} pages</span>
                </div>
              </div>
            ))}

            {/* Empty state when no scripts */}
            {scripts.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="w-24 h-24 bg-slate-700/30 dark:bg-slate-700/30 bg-gray-200 dark:bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-500 dark:text-gray-500 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white dark:text-white text-gray-900 mb-2">No scripts yet</h3>
                <p className="text-gray-400 dark:text-gray-400 text-gray-600 mb-6">Start your screenwriting journey by creating your first script</p>
                <button
                  onClick={handleCreateScript}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg transition-all duration-200"
                >
                  Create Your First Script
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success message */}
        <div className="mt-12 bg-gradient-to-r from-green-900/20 to-emerald-900/20 dark:from-green-900/20 dark:to-emerald-900/20 from-green-50 to-emerald-50 dark:from-green-900/20 backdrop-blur-sm border border-green-500/20 dark:border-green-500/20 border-green-200 dark:border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white dark:text-white text-gray-900">Authentication Test Successful!</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 dark:text-gray-300 text-gray-700">
            <div className="space-y-2">
              <p><span className="text-gray-400 dark:text-gray-400 text-gray-600">User ID:</span> <span className="font-mono text-sm">{user.id}</span></p>
              <p><span className="text-gray-400 dark:text-gray-400 text-gray-600">Email:</span> {user.email}</p>
              <p><span className="text-gray-400 dark:text-gray-400 text-gray-600">Name:</span> {user.name}</p>
            </div>
            <div className="space-y-2">
              <p><span className="text-gray-400 dark:text-gray-400 text-gray-600">Token:</span> <span className="font-mono text-sm">{AuthService.getToken()?.substring(0, 20)}...</span></p>
              <p className="text-green-400 dark:text-green-400 text-green-600 font-medium flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                User successfully stored in localStorage
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Create Script Modal */}
      <CreateScriptModal
        userId={user.id}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onScriptCreated={handleScriptCreated}
      />
    </div>
  );
}