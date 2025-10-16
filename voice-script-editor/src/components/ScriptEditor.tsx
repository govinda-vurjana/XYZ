import { useState, useEffect, useRef } from 'react';
import { ScriptService, type Script, type Draft } from '../services/script';
import { type User } from '../services/auth';
import EditablePagedEditor from './EditablePagedEditor';
import CeltxSidebar from './CeltxSidebar';
import VoiceInput from './VoiceInput';
import { type Scene } from '../utils/sceneDetection';
import { ExportService } from '../services/export';

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
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);
  const [showDraftMenu, setShowDraftMenu] = useState(false);
  const [showCreateDraftModal, setShowCreateDraftModal] = useState(false);
  const [newDraftName, setNewDraftName] = useState('');
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  // Remove viewMode - always use paged view

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

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu && !(event.target as Element).closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
      if (showDraftMenu && !(event.target as Element).closest('.draft-menu-container')) {
        setShowDraftMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu, showDraftMenu]);

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
      
      // Load drafts for this script
      const scriptDrafts = ScriptService.getScriptDrafts(scriptId);
      setDrafts(scriptDrafts);
      
      // Set current draft if one is selected
      let activeDraft = null;
      if (loadedScript.currentDraftId) {
        activeDraft = ScriptService.getDraft(loadedScript.currentDraftId);
        setCurrentDraft(activeDraft);
      }
      
      // Set content from current draft or main script
      const currentContent = ScriptService.getCurrentContent(loadedScript);
      
      setScript(loadedScript);
      setContent(currentContent);
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
      
      if (currentDraft) {
        // Save to current draft
        const updatedDraft = await ScriptService.updateDraft(currentDraft.id, {
          content: content,
          pageCount: Math.max(1, Math.ceil(content.length / 250))
        });
        setCurrentDraft(updatedDraft);
        
        // Update drafts list
        setDrafts(prev => prev.map(d => d.id === updatedDraft.id ? updatedDraft : d));
      } else {
        // Save to main script
        const updatedScript = await ScriptService.updateScript(script.id, user.id, {
          content: content,
          pageCount: Math.max(1, Math.ceil(content.length / 250))
        });
        setScript(updatedScript);
      }
      
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

  const handleExport = async (format: 'pdf' | 'txt') => {
    if (!script || !content.trim()) {
      alert('No content to export');
      return;
    }

    try {
      setIsExporting(true);
      setShowExportMenu(false);

      const exportTitle = currentDraft 
        ? `${script.title} - ${currentDraft.name}`
        : script.title;

      const exportOptions = {
        format,
        title: exportTitle,
        author: user.name,
        includePageNumbers: true
      };

      if (format === 'pdf') {
        await ExportService.exportToPDF(content, exportOptions);
      } else {
        await ExportService.exportToTXT(content, exportOptions);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!script || !newDraftName.trim()) return;

    try {
      setIsCreatingDraft(true);
      
      const draft = await ScriptService.createDraft(
        script.id, 
        user.id, 
        newDraftName.trim(), 
        content
      );
      
      // Add to drafts list
      setDrafts(prev => [draft, ...prev]);
      
      // Switch to the new draft
      await handleSwitchDraft(draft.id);
      
      // Reset form
      setNewDraftName('');
      setShowCreateDraftModal(false);
    } catch (error) {
      console.error('Failed to create draft:', error);
      alert(error instanceof Error ? error.message : 'Failed to create draft');
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleSwitchDraft = async (draftId: string | null) => {
    if (!script) return;

    try {
      // Save current content before switching
      await saveContent();
      
      // Update script's current draft
      await ScriptService.setCurrentDraft(script.id, user.id, draftId);
      
      // Load new content
      if (draftId) {
        const draft = ScriptService.getDraft(draftId);
        if (draft) {
          setCurrentDraft(draft);
          setContent(draft.content);
        }
      } else {
        setCurrentDraft(null);
        const updatedScript = ScriptService.getScript(script.id, user.id);
        if (updatedScript) {
          setScript(updatedScript);
          setContent(updatedScript.content);
        }
      }
      
      setShowDraftMenu(false);
    } catch (error) {
      console.error('Failed to switch draft:', error);
      alert('Failed to switch draft');
    }
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
            
            {/* Input Mode Toggle */}
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
            
            <div className="flex items-center space-x-4">
              {/* Draft Selector */}
              <div className="relative draft-menu-container">
                <button
                  onClick={() => setShowDraftMenu(!showDraftMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-slate-600/50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {currentDraft ? currentDraft.name : 'Main Script'}
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Draft Menu */}
                {showDraftMenu && (
                  <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      {/* Main Script Option */}
                      <button
                        onClick={() => handleSwitchDraft(null)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-between ${
                          !currentDraft ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Main Script</span>
                        </div>
                        {!currentDraft && (
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      {/* Drafts */}
                      {drafts.length > 0 && (
                        <>
                          <div className="border-t border-gray-200 dark:border-slate-600 my-2"></div>
                          <div className="px-4 py-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Drafts</span>
                          </div>
                          {drafts.map((draft) => (
                            <button
                              key={draft.id}
                              onClick={() => handleSwitchDraft(draft.id)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-between ${
                                currentDraft?.id === draft.id ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <div>
                                  <div className="font-medium">{draft.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {ScriptService.formatTimeAgo(draft.updatedAt)}
                                  </div>
                                </div>
                              </div>
                              {currentDraft?.id === draft.id && (
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </>
                      )}

                      {/* Create New Draft */}
                      <div className="border-t border-gray-200 dark:border-slate-600 my-2"></div>
                      <button
                        onClick={() => {
                          setShowDraftMenu(false);
                          setShowCreateDraftModal(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Save as New Draft</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Export Button */}
              <div className="relative export-menu-container">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={isExporting || !content.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="text-sm font-medium">Exporting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium">Export</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Export Menu */}
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      <button
                        onClick={() => handleExport('pdf')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                          <path d="M14 2v6h6"/>
                          <path d="M16 13a1 1 0 0 0-1-1h-4a1 1 0 0 0 0 2h4a1 1 0 0 0 1-1zm0 3a1 1 0 0 0-1-1h-4a1 1 0 0 0 0 2h4a1 1 0 0 0 1-1z"/>
                        </svg>
                        <span>Export as PDF</span>
                      </button>
                      <button
                        onClick={() => handleExport('txt')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export as TXT</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
        {/* Celtx-style Sidebar */}
        {showSidebar && (
          <CeltxSidebar
            script={script}
            currentDraft={currentDraft}
            content={content}
            user={user}
            currentCursorPosition={cursorPosition}
            onSceneClick={handleSceneNavigation}
          />
        )}

        {/* Paged Editor */}
        <div className="flex-1 flex flex-col">
          {/* Sidebar Toggle */}
          {!showSidebar && (
            <div className="p-4">
              <button
                onClick={() => setShowSidebar(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-200 dark:bg-slate-700/50 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="text-sm">Show Panels</span>
              </button>
            </div>
          )}

          <EditablePagedEditor
            script={script}
            currentDraft={currentDraft}
            content={content}
            onContentChange={handleContentChange}
            onCursorPositionChange={handleCursorPositionChange}
            user={user}
            showSidebar={showSidebar}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
          />
        </div>
      </main>

      {/* Floating Voice Input Button - Fixed at bottom center - Only show in Talk mode */}
      {editorMode === 'talk' && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <VoiceInput
            onTextReceived={handleVoiceText}
            onError={handleVoiceError}
            className="flex flex-col items-center"
            voiceSettings={user.preferences?.voiceSettings}
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

      {/* Create Draft Modal */}
      {showCreateDraftModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Save as New Draft</h3>
              <button
                onClick={() => {
                  setShowCreateDraftModal(false);
                  setNewDraftName('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label htmlFor="draft-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Draft Name
              </label>
              <input
                id="draft-name"
                type="text"
                value={newDraftName}
                onChange={(e) => setNewDraftName(e.target.value)}
                placeholder="e.g., First Draft, Revision 1, Director's Cut"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                maxLength={50}
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {newDraftName.length}/50 characters
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">About Drafts</p>
                  <p>This will save your current content as a new draft. You can switch between drafts anytime and each draft maintains its own version of the script.</p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCreateDraftModal(false);
                  setNewDraftName('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDraft}
                disabled={!newDraftName.trim() || isCreatingDraft}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isCreatingDraft ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Draft</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}