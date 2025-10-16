import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import FormattedScriptEditor from './components/FormattedScriptEditor';

function TestScreenplayFormatting() {
  const [content, setContent] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                    <path d="M14 2v6h6"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">Test Screenplay Formatting</h1>
                  <p className="text-sm text-gray-400">Testing formatted script editor functionality</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Screenplay Formatting Test</h2>
                <p className="text-gray-400 text-sm mb-4">
                  Test the formatting functionality by following these steps:
                </p>
                <ol className="text-gray-300 text-sm space-y-2 mb-6">
                  <li>1. Type "INT. COFFEE SHOP - DAY" and press Tab</li>
                  <li>2. Type "ANNA" and press Tab</li>
                  <li>3. Type some dialogue like "This is perfect."</li>
                  <li>4. Press Tab to cycle through element types</li>
                  <li>5. Press Enter to create new elements</li>
                </ol>
              </div>
              
              <FormattedScriptEditor
                content={content}
                onChange={setContent}
                placeholder="Start the test by typing: INT. COFFEE SHOP - DAY"
                className="font-mono text-sm leading-relaxed"
              />
              
              <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
                <h3 className="text-sm font-medium text-white mb-2">Raw Content Output:</h3>
                <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">
                  {content || '(No content yet)'}
                </pre>
              </div>
            </div>
          </div>
          
          {/* Test Instructions */}
          <div className="mt-8 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Expected Behavior</h3>
                <ul className="text-gray-300 space-y-1 text-sm">
                  <li>• Scene headings should appear in bold, uppercase</li>
                  <li>• Character names should be centered, uppercase, in amber color</li>
                  <li>• Dialogue should be indented with proper spacing</li>
                  <li>• Tab key should cycle through: Scene Heading → Action → Character → Dialogue</li>
                  <li>• Enter key should create new elements with smart type detection</li>
                  <li>• Current element type should be displayed at the top</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<TestScreenplayFormatting />);
}