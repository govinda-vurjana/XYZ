import { useState, useEffect, useRef } from 'react';
import { ScriptService, type Script } from '../services/script';
import { type User } from '../services/auth';
import FormattedScriptEditor from './FormattedScriptEditor';
import VoiceInput from './VoiceInput';
import ScenesPanel from './ScenesPanel';
import ElementsPanel from './ElementsPanel';
import { type Scene } from '../utils/sceneDetection';

interface ScriptEditorProps {
  user: User;
  scriptId: string;
  onBackToDashboard: () => void;
}

export default function ScriptEditor({ user, scriptId, onBackToDashboard }: ScriptEditorProps) {
  const [script, setScript] = useState<Script | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [editorMode, setEditorMode] = useState<'talk' | 'write'>('talk');

  const autoSaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<{ getTextareaRef: () => HTMLTextAreaElement | null } | null>(null);

  useEffect(() => {
    loadScript();
    return () => {
      // Cleanup intervals and timeouts
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [scriptId, user.id]);

  useEffect(() => {
    // Set up auto-save every 5 seconds
    autoSaveIntervalRef.current = setInterval(() => {
      if (script && content !== script.content) {
        saveContent();
      }
    }, 5000);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [script, content]);

  const loadScript = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const loadedScript = ScriptService.getScript(scriptId, user.id);
      if (!loadedScript) {
        setError('Script not found');
        return;
      }
      
      setScript(loadedScript);
      setContent(loadedScript.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load script');
    } finally {
      setIsLoading(false);
    }
  };

  const saveContent = async () => {
    if (!script || isSaving) return;

    try {
      setIsSaving(true);
      
      const updatedScript = await ScriptService.updateScript(script.id, user.id, {
        content: content,
        pageCount: Math.max(1, Math.ceil(content.length / 250)) // Rough page count estimation
      });
      
      setScript(updatedScript);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Failed to save script:', err);
      // Don't show error to user for auto-save failures, just log them
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    
    // Clear existing timeout and set a new one for immediate save after user stops typing
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Save after 2 seconds of no typing
    saveTimeoutRef.current = setTimeout(() => {
      if (script && newContent !== script.content) {
        saveContent();
      }
    }, 2000);
  };

  const handleVoiceText = (voiceText: string) => {
    const textarea = editorRef.current?.getTextareaRef();
    if (!textarea) return;

    // Get current cursor position
    const currentCursorPosition = textarea.selectionStart;
    
    // Insert voice text at cursor position
    const textBefore = content.substring(0, currentCursorPosition);
    const textAfter = content.substring(currentCursorPosition);
    
    // Clean up the voice text (capitalize first letter, add proper spacing)
    const cleanedVoiceText = voiceText.trim();
    const formattedText = cleanedVoiceText.charAt(0).toUpperCase() + cleanedVoiceText.slice(1);
    
    // Add appropriate spacing
    const needsSpaceBefore = textBefore.length > 0 && !textBefore.endsWith(' ') && !textBefore.endsWith('\n');
    const needsSpaceAfter = textAfter.length > 0 && !textAfter.startsWith(' ') && !textAfter.startsWith('\n');
    
    const finalText = (needsSpaceBefore ? ' ' : '') + formattedText + (needsSpaceAfter ? ' ' : '');
    const newContent = textBefore + finalText + textAfter;
    
    // Update content
    handleContentChange(newContent);
    
    // Position cursor after inserted text
    const newCursorPosition = currentCursorPosition + finalText.length;
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = newCursorPosition;
      textarea.focus();
    }, 0);

    // Clear any voice errors
    setVoiceError(null);
  };

  const handleVoiceError = (error: string) => {
    setVoiceError(error);
    // Clear error after 5 seconds
    setTimeout(() => setVoiceError(null), 5000);
  };

  const handleCursorPositionChange = (position: number) => {
    setCursorPosition(position);
  };

  const handleSceneNavigation = (scene: Scene) => {
    const textarea = editorRef.current?.getTextareaRef();
    if (!textarea) return;

    // Set cursor position to the start of the scene
    textarea.selectionStart = textarea.selectionEnd = scene.startPosition;
    textarea.focus();
    
    // Scroll to the scene position
    textarea.scrollTop = (scene.lineNumber - 1) * 20; // Approximate line height
    
    // Update cursor position state
    setCursorPosition(scene.startPosition);
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading script...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Script</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={onBackToDashboard}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg transition-all duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!script) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-gray-900 dark:text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToDashboard}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Dashboard</span>
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-slate-600"></div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                    <path d="M14 2v6h6"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{script.title}</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{script.description || 'No description'}</p>
                </div>
              </div>
            </div>
            
            {/* Mode Toggle */}
            <div className="flex items-center">
              <div className="bg-gray-200 dark:bg-slate-700/50 backdrop-blur-sm rounded-full p-1 border border-gray-300 dark:border-slate-600/50">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setEditorMode('talk')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      editorMode === 'talk'
                        ? 'bg-amber-500 text-slate-900 shadow-lg'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-300 dark:hover:bg-slate-600/50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span>Talk</span>
                  </button>
                  
                  <button
                    onClick={() => setEditorMode('write')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      editorMode === 'write'
                        ? 'bg-amber-500 text-slate-900 shadow-lg'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-300 dark:hover:bg-slate-600/50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>Write</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Save status */}
              <div className="flex items-center space-x-2 text-sm">
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Saved {ScriptService.formatTimeAgo(lastSaved.toISOString())}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500 dark:text-gray-500">Not saved</span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Editor */}
      <main className="relative flex-1 flex">
        {/* Left Sidebar */}
        <div className={`transition-all duration-300 ${showSidebar ? 'w-80' : 'w-0'} flex-shrink-0 overflow-hidden`}>
          <div className="h-full p-4 border-r border-gray-200 dark:border-slate-700/50 flex flex-col space-y-4">
            <ScenesPanel
              content={content}
              currentCursorPosition={cursorPosition}
              onSceneClick={handleSceneNavigation}
              className="flex-1"
            />
            <ElementsPanel
              content={content}
              className="flex-1"
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
            {/* Sidebar Toggle */}
            <div className="mb-4 flex justify-between items-center">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-200 dark:bg-slate-700/50 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="text-sm">{showSidebar ? 'Hide' : 'Show'} Panels</span>
              </button>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="p-6">
                  <div className="mb-4">
                    <label htmlFor="script-content" className="block text-sm font-medium text-gray-300 mb-2">
                      Script Content
                    </label>
                    <p className="text-xs text-gray-500 mb-4">
                      Start writing your script. Auto-save is enabled - your work will be saved automatically every 5 seconds and when you stop typing.
                    </p>
                  </div>
                  
                  <FormattedScriptEditor
                    ref={editorRef}
                    content={content}
                    onChange={handleContentChange}
                    onCursorPositionChange={handleCursorPositionChange}
                    placeholder="Start writing your script here...

Example:
FADE IN:

INT. COFFEE SHOP - DAY

A cozy coffee shop buzzes with morning activity. ANNA (25), a determined writer, sits at a corner table with her laptop.

ANNA
(typing furiously)
This is it. This is the scene that changes everything.

She pauses, looks up, and smiles."
                    className="font-mono text-sm leading-relaxed"
                  />
                  
                  <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span>{content.length} characters</span>
                      <span>{content.split('\n').length} lines</span>
                      <span>~{Math.max(1, Math.ceil(content.length / 250))} pages</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <kbd className="px-2 py-1 bg-slate-700/50 rounded text-xs">Tab</kbd>
                        <span className="text-xs">cycle element types</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <kbd className="px-2 py-1 bg-slate-700/50 rounded text-xs">Enter</kbd>
                        <span className="text-xs">new element</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tips */}
              <div className="mt-6 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {editorMode === 'talk' ? 'Voice Writing Tips' : 'Writing Tips'}
                    </h3>
                    <ul className="text-gray-300 space-y-1 text-sm">
                      <li>• Your work is automatically saved every 5 seconds and when you pause typing</li>
                      {editorMode === 'talk' ? (
                        <>
                          <li>• <strong>Voice mode:</strong> Click the microphone button to start dictating your script</li>
                          <li>• Speak naturally - voice text will be inserted at your cursor position</li>
                          <li>• Switch to Write mode in the header to disable voice input and focus on typing</li>
                        </>
                      ) : (
                        <>
                          <li>• <strong>Write mode:</strong> Focus on traditional keyboard input without voice distractions</li>
                          <li>• Switch to Talk mode in the header to enable voice dictation</li>
                        </>
                      )}
                      <li>• Use Tab key to cycle between element types (Scene Heading → Action → Character → Dialogue)</li>
                      <li>• Press Enter to create a new element with smart type detection</li>
                      <li>• Scene headings: INT./EXT. LOCATION - TIME (automatically formatted)</li>
                      <li>• Character names: ALL CAPS, automatically centered</li>
                      <li>• Dialogue: Automatically indented with proper spacing</li>
                      <li>• Action lines: Full width, describe what happens on screen</li>
                      <li>• <strong>Panels:</strong> Click any scene or element in the left sidebar to navigate instantly</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Voice Input Button - Fixed at bottom center - Only show in Talk mode */}
      {editorMode === 'talk' && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <VoiceInput
            onTextReceived={handleVoiceText}
            onError={handleVoiceError}
            className="flex flex-col items-center"
          />
        </div>
      )}

      {/* Voice Error Display - Fixed at bottom center, above voice button - Only show in Talk mode */}
      {editorMode === 'talk' && voiceError && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-red-900/90 backdrop-blur-sm border border-red-500/50 rounded-lg p-3 max-w-md shadow-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-red-300">{voiceError}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}