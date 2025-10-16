import { useState, useRef, useEffect, forwardRef, useImperativeHandle, type KeyboardEvent } from 'react';

export type ScriptElementType = 
  | 'scene-heading' 
  | 'action' 
  | 'character' 
  | 'dialogue' 
  | 'parenthetical' 
  | 'transition'
  | 'shot-camera-direction'
  | 'subheader'
  | 'voice-over'
  | 'off-screen'
  | 'off-camera'
  | 'text-on-screen'
  | 'montage'
  | 'intercut'
  | 'dual-dialogue';

interface ScriptElement {
  type: ScriptElementType;
  label: string;
  shortcut: string;
  description: string;
}

const SCRIPT_ELEMENTS: ScriptElement[] = [
  { type: 'scene-heading', label: 'Scene Heading', shortcut: 'Ctrl + H', description: 'INT./EXT. LOCATION - TIME' },
  { type: 'action', label: 'Action', shortcut: 'Ctrl + A', description: 'Describe what happens on screen' },
  { type: 'character', label: 'Character', shortcut: 'Ctrl + C', description: 'Character name in ALL CAPS' },
  { type: 'dialogue', label: 'Dialogue', shortcut: 'Ctrl + D', description: 'Character speech' },
  { type: 'parenthetical', label: 'Parenthetical', shortcut: 'Ctrl + P', description: '(stage direction)' },
  { type: 'transition', label: 'Transition', shortcut: 'Ctrl + T', description: 'FADE TO:, CUT TO:' },
  { type: 'shot-camera-direction', label: 'Shot/Camera Direction', shortcut: 'Ctrl + S', description: 'Camera movements and shots' },
  { type: 'subheader', label: 'Subheader', shortcut: 'Ctrl + B', description: 'Scene subdivision' },
  { type: 'voice-over', label: 'Voice Over (V.O.)', shortcut: 'Ctrl + V', description: 'Character voice over' },
  { type: 'off-screen', label: 'Off Screen (O.S.)', shortcut: 'Ctrl + O', description: 'Character speaking off screen' },
  { type: 'off-camera', label: 'Off Camera (O.C.)', shortcut: 'Ctrl + M', description: 'Character speaking off camera' },
  { type: 'text-on-screen', label: 'Text on Screen (SUPER.)', shortcut: 'Ctrl + X', description: 'Text overlay on screen' },
  { type: 'montage', label: 'Montage', shortcut: 'Ctrl + G', description: 'Series of brief scenes' },
  { type: 'intercut', label: 'Intercut', shortcut: 'Ctrl + I', description: 'Cutting between scenes' },
  { type: 'dual-dialogue', label: 'Dual Dialogue', shortcut: 'Ctrl + L', description: 'Two characters speaking simultaneously' }
];

interface FormattedScriptEditorProps {
  content: string;
  onChange: (content: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onCursorPositionChange?: (position: number) => void;
  placeholder?: string;
  className?: string;
}

interface FormattedScriptEditorRef {
  getTextareaRef: () => HTMLTextAreaElement | null;
}

const FormattedScriptEditor = forwardRef<FormattedScriptEditorRef, FormattedScriptEditorProps>(({
  content,
  onChange,
  onKeyDown,
  onCursorPositionChange,
  placeholder = "Start writing your screenplay here...",
  className = ""
}, ref) => {
  const [currentElementType, setCurrentElementType] = useState<ScriptElementType>('scene-heading');
  const [showElementDropdown, setShowElementDropdown] = useState(false);
  const [ghostSuggestion, setGhostSuggestion] = useState('');
  const [currentSuggestion, setCurrentSuggestion] = useState<ScriptElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Expose textarea ref to parent component
  useImperativeHandle(ref, () => ({
    getTextareaRef: () => textareaRef.current
  }));


  // Calculate pages based on content (approximately 250 words per page)
  useEffect(() => {
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const calculatedPages = Math.max(1, Math.ceil(wordCount / 250));
    setTotalPages(calculatedPages);
    
    // Calculate current page based on cursor position
    if (textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart;
      const textBeforeCursor = content.substring(0, cursorPosition);
      const wordsBeforeCursor = textBeforeCursor.split(/\s+/).filter(word => word.length > 0).length;
      const currentPageCalc = Math.max(1, Math.ceil(wordsBeforeCursor / 250));
      setCurrentPage(Math.min(currentPageCalc, calculatedPages));
    }
  }, [content]);

  const detectElementType = (line: string): ScriptElementType => {
    const trimmed = line.trim();
    
    if (!trimmed) return currentElementType;
    
    // Enhanced detection patterns
    if (/^(INT\.|EXT\.|FADE IN|FADE OUT)/i.test(trimmed)) return 'scene-heading';
    if (/^[A-Z][A-Z\s]+(\(.*\))?$/.test(trimmed) && trimmed.length < 50 && !trimmed.includes('.')) return 'character';
    if (/^\(.*\)$/.test(trimmed)) return 'parenthetical';
    if (/^[A-Z\s]+(TO:|IN:|OUT:)$/.test(trimmed)) return 'transition';
    if (/^(CLOSE UP|WIDE SHOT|MEDIUM SHOT|TRACKING SHOT)/i.test(trimmed)) return 'shot-camera-direction';
    if (/\(V\.O\.\)$/.test(trimmed)) return 'voice-over';
    if (/\(O\.S\.\)$/.test(trimmed)) return 'off-screen';
    if (/\(O\.C\.\)$/.test(trimmed)) return 'off-camera';
    if (/^(SUPER:|TITLE:|TEXT ON SCREEN)/i.test(trimmed)) return 'text-on-screen';
    if (/^(MONTAGE|SERIES OF SHOTS)/i.test(trimmed)) return 'montage';
    if (/^(INTERCUT|BACK AND FORTH)/i.test(trimmed)) return 'intercut';
    
    return 'action';
  };

  const getNextElementType = (currentType: ScriptElementType): ScriptElementType => {
    const transitions: Record<ScriptElementType, ScriptElementType> = {
      'scene-heading': 'action',
      'action': 'character',
      'character': 'dialogue',
      'dialogue': 'action',
      'parenthetical': 'dialogue',
      'transition': 'scene-heading',
      'shot-camera-direction': 'action',
      'subheader': 'action',
      'voice-over': 'dialogue',
      'off-screen': 'dialogue',
      'off-camera': 'dialogue',
      'text-on-screen': 'action',
      'montage': 'action',
      'intercut': 'action',
      'dual-dialogue': 'action'
    };
    return transitions[currentType] || 'action';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle keyboard shortcuts for element types
    if (e.ctrlKey) {
      const shortcutMap: Record<string, ScriptElementType> = {
        'h': 'scene-heading', 'a': 'action', 'c': 'character', 'd': 'dialogue',
        'p': 'parenthetical', 't': 'transition', 's': 'shot-camera-direction',
        'b': 'subheader', 'v': 'voice-over', 'o': 'off-screen', 'm': 'off-camera',
        'x': 'text-on-screen', 'g': 'montage', 'i': 'intercut', 'l': 'dual-dialogue'
      };
      
      if (shortcutMap[e.key.toLowerCase()]) {
        e.preventDefault();
        setCurrentElementType(shortcutMap[e.key.toLowerCase()]);
        clearGhostSuggestion();
        return;
      }
    }

    const textarea = e.currentTarget;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1;
    const currentLineEnd = textarea.value.indexOf('\n', cursorPosition);
    const lineEndPos = currentLineEnd === -1 ? textarea.value.length : currentLineEnd;

    if (e.key === 'Tab') {
      e.preventDefault();
      if (ghostSuggestion && currentSuggestion) {
        // Accept ghost suggestion
        acceptGhostSuggestion(textarea, cursorPosition, currentLineStart, lineEndPos);
      } else if (e.shiftKey) {
        setShowElementDropdown(!showElementDropdown);
      } else {
        cycleElementType();
      }
      return;
    }

    if (e.key === 'Escape') {
      clearGhostSuggestion();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      clearGhostSuggestion();
      handleEnterKey(textarea, cursorPosition);
      return;
    }

    // Clear ghost suggestion on most key presses (except typing)
    if (!e.key.match(/^[a-zA-Z0-9\s\.\-\(\)]$/)) {
      clearGhostSuggestion();
    }

    // Auto-detect element type and update ghost suggestion
    setTimeout(() => {
      updateGhostSuggestion(textarea, currentLineStart);
    }, 50);

    onKeyDown?.(e);
  };

  const clearGhostSuggestion = () => {
    setGhostSuggestion('');
    setCurrentSuggestion(null);
  };

  const updateGhostSuggestion = (textarea: HTMLTextAreaElement, currentLineStart: number) => {
    const cursorPosition = textarea.selectionStart;
    const currentLineEnd = textarea.value.indexOf('\n', cursorPosition);
    const lineEndPos = currentLineEnd === -1 ? textarea.value.length : currentLineEnd;
    const currentLine = textarea.value.substring(currentLineStart, lineEndPos);
    
    const detectedType = detectElementType(currentLine);
    setCurrentElementType(detectedType);
    
    // Generate ghost suggestion based on partial input
    if (currentLine.trim().length > 0 && cursorPosition === lineEndPos) {
      const input = currentLine.trim().toLowerCase();
      
      // Common screenplay suggestions
      const suggestions: Record<string, string> = {
        'int': 'INT. COFFEE SHOP - DAY',
        'ext': 'EXT. STREET - NIGHT',
        'fade': 'FADE IN:',
        'cut': 'CUT TO:',
        'close': 'CLOSE UP ON',
        'wide': 'WIDE SHOT',
        'medium': 'MEDIUM SHOT',
        'tracking': 'TRACKING SHOT',
        'montage': 'MONTAGE - TRAINING SEQUENCE',
        'intercut': 'INTERCUT - PHONE CONVERSATION',
        'super': 'SUPER: "ONE YEAR LATER"',
        'title': 'TITLE CARD: "CHAPTER ONE"'
      };
      
      // Find matching suggestion
      for (const [key, suggestion] of Object.entries(suggestions)) {
        if (key.startsWith(input) && key !== input) {
          const remainingText = suggestion.substring(currentLine.trim().length);
          setGhostSuggestion(remainingText);
          setCurrentSuggestion({ 
            type: detectElementType(suggestion), 
            label: suggestion, 
            shortcut: '', 
            description: '' 
          });
          return;
        }
      }
    }
    
    clearGhostSuggestion();
  };

  const acceptGhostSuggestion = (textarea: HTMLTextAreaElement, cursorPosition: number, _lineStart: number, lineEnd: number) => {
    if (!ghostSuggestion || !currentSuggestion) return;
    
    const textBefore = textarea.value.substring(0, cursorPosition);
    const textAfter = textarea.value.substring(lineEnd);
    const newContent = textBefore + ghostSuggestion + textAfter;
    
    onChange(newContent);
    setCurrentElementType(currentSuggestion.type);
    clearGhostSuggestion();
    
    // Position cursor at end of suggestion
    setTimeout(() => {
      const newCursorPos = cursorPosition + ghostSuggestion.length;
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      textarea.focus();
    }, 0);
  };

  const cycleElementType = () => {
    const currentIndex = SCRIPT_ELEMENTS.findIndex(el => el.type === currentElementType);
    const nextIndex = (currentIndex + 1) % SCRIPT_ELEMENTS.length;
    setCurrentElementType(SCRIPT_ELEMENTS[nextIndex].type);
    clearGhostSuggestion();
  };

  const handleEnterKey = (textarea: HTMLTextAreaElement, cursorPosition: number) => {
    const nextElementType = getNextElementType(currentElementType);
    const textBefore = textarea.value.substring(0, cursorPosition);
    const textAfter = textarea.value.substring(cursorPosition);
    const newContent = textBefore + '\n' + textAfter;
    
    onChange(newContent);
    setCurrentElementType(nextElementType);
    
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = cursorPosition + 1;
      textarea.focus();
    }, 0);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    onChange(newContent);
    
    const cursorPosition = e.target.selectionStart;
    onCursorPositionChange?.(cursorPosition);
    
    const textBeforeCursor = newContent.substring(0, cursorPosition);
    const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1;
    
    // Update ghost suggestion as user types
    setTimeout(() => {
      updateGhostSuggestion(e.target, currentLineStart);
    }, 50);
  };

  const handleSelectionChange = () => {
    if (textareaRef.current) {
      onCursorPositionChange?.(textareaRef.current.selectionStart);
    }
  };

  const getElementStyles = (type: ScriptElementType): string => {
    const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-900';
    const baseStyles = `w-full bg-transparent border-none outline-none resize-none ${textColor} leading-relaxed`;
    
    const lightModeStyles: Record<ScriptElementType, string> = {
      'scene-heading': `${baseStyles} font-bold uppercase text-lg text-gray-900`,
      'character': `${baseStyles} font-bold uppercase text-amber-600 text-center`,
      'dialogue': `${baseStyles} text-gray-800 pl-16 pr-24`,
      'parenthetical': `${baseStyles} text-gray-600 pl-12 pr-28 italic`,
      'action': `${baseStyles} text-gray-900`,
      'transition': `${baseStyles} font-bold uppercase text-right text-gray-700`,
      'shot-camera-direction': `${baseStyles} font-semibold text-blue-600`,
      'subheader': `${baseStyles} font-semibold text-yellow-600 text-center`,
      'voice-over': `${baseStyles} font-bold uppercase text-purple-600 text-center`,
      'off-screen': `${baseStyles} font-bold uppercase text-green-600 text-center`,
      'off-camera': `${baseStyles} font-bold uppercase text-cyan-600 text-center`,
      'text-on-screen': `${baseStyles} font-bold text-red-600 text-center`,
      'montage': `${baseStyles} font-bold uppercase text-pink-600 text-center`,
      'intercut': `${baseStyles} font-bold uppercase text-indigo-600 text-center`,
      'dual-dialogue': `${baseStyles} text-gray-800 pl-8 pr-8`
    };

    const darkModeStyles: Record<ScriptElementType, string> = {
      'scene-heading': `${baseStyles} font-bold uppercase text-lg text-gray-100`,
      'character': `${baseStyles} font-bold uppercase text-amber-300 text-center`,
      'dialogue': `${baseStyles} text-gray-200 pl-16 pr-24`,
      'parenthetical': `${baseStyles} text-gray-400 pl-12 pr-28 italic`,
      'action': `${baseStyles} text-gray-100`,
      'transition': `${baseStyles} font-bold uppercase text-right text-gray-300`,
      'shot-camera-direction': `${baseStyles} font-semibold text-blue-300`,
      'subheader': `${baseStyles} font-semibold text-yellow-300 text-center`,
      'voice-over': `${baseStyles} font-bold uppercase text-purple-300 text-center`,
      'off-screen': `${baseStyles} font-bold uppercase text-green-300 text-center`,
      'off-camera': `${baseStyles} font-bold uppercase text-cyan-300 text-center`,
      'text-on-screen': `${baseStyles} font-bold text-red-300 text-center`,
      'montage': `${baseStyles} font-bold uppercase text-pink-300 text-center`,
      'intercut': `${baseStyles} font-bold uppercase text-indigo-300 text-center`,
      'dual-dialogue': `${baseStyles} text-gray-200 pl-8 pr-8`
    };
    
    const styles = isDarkMode ? darkModeStyles : lightModeStyles;
    return styles[type] || styles.action;
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(Math.max(50, Math.min(200, newZoom)));
  };

  const getCurrentElement = () => SCRIPT_ELEMENTS.find(el => el.type === currentElementType);

  return (
    <div className={`formatted-script-editor ${className} relative`}>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
        <div className="flex items-center space-x-4">
          {/* Element Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowElementDropdown(!showElementDropdown)}
              className="flex items-center space-x-2 px-3 py-2 bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors"
            >
              <span className="text-sm font-medium">
                {getCurrentElement()?.label || 'Action'}
              </span>
              <svg className={`w-4 h-4 transition-transform ${showElementDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Element Dropdown */}
            {showElementDropdown && (
              <div 
                ref={dropdownRef}
                className="absolute top-full left-0 mt-2 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
              >
                <div className="p-2">
                  <div className="text-xs text-gray-400 mb-2 px-2">Screenplay Elements</div>
                  {SCRIPT_ELEMENTS.map((element) => (
                    <button
                      key={element.type}
                      onClick={() => {
                        setCurrentElementType(element.type);
                        setShowElementDropdown(false);
                        textareaRef.current?.focus();
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md hover:bg-slate-700 transition-colors ${
                        currentElementType === element.type ? 'bg-amber-500/20 text-amber-300' : 'text-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{element.label}</div>
                          <div className="text-xs text-gray-500">{element.description}</div>
                        </div>
                        <kbd className="text-xs bg-slate-700 px-2 py-1 rounded">{element.shortcut}</kbd>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current Element Info */}
          <div className="text-sm text-gray-400">
            <span>Current: </span>
            <span className="text-amber-300 font-medium">{getCurrentElement()?.label}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Dark/Light Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>Page {currentPage} of {totalPages}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleZoomChange(zoomLevel - 10)}
              className="p-1 hover:bg-slate-700 rounded"
              title="Zoom Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <span className="text-sm text-gray-400 min-w-12 text-center">{zoomLevel}%</span>
            
            <button
              onClick={() => handleZoomChange(zoomLevel + 10)}
              className="p-1 hover:bg-slate-700 rounded"
              title="Zoom In"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            <button
              onClick={() => handleZoomChange(100)}
              className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded"
              title="Fit to Screen"
            >
              Fit
            </button>
          </div>
        </div>
      </div>

      {/* Ghost Suggestion Hint */}
      {ghostSuggestion && (
        <div className="mb-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg inline-block">
          💡 Press <kbd className="bg-amber-500/20 px-1 rounded">Tab</kbd> to accept: "{ghostSuggestion}"
        </div>
      )}

      {/* A4 Page-like Editor */}
      <div 
        className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-2xl mx-auto relative border`}
        style={{ 
          width: `${8.27 * (zoomLevel / 100)}in`,
          minHeight: `${11.69 * (zoomLevel / 100)}in`,
          maxWidth: '100%',
          transform: zoomLevel < 100 ? 'scale(1)' : 'none',
          transformOrigin: 'top center'
        }}
      >
        {/* Page Header */}
        <div className={`absolute top-4 right-4 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
          Page {currentPage}
        </div>

        {/* Content Area with Ghost Text Overlay */}
        <div className="p-16 h-full relative">
          {/* Ghost Text Suggestion Overlay */}
          {ghostSuggestion && (
            <div
              className="absolute pointer-events-none font-mono whitespace-pre-wrap"
              style={{
                fontSize: `${12 * (zoomLevel / 100)}px`,
                lineHeight: '1.8',
                color: isDarkMode ? 'rgba(156, 163, 175, 0.3)' : 'rgba(107, 114, 128, 0.3)',
                left: '64px',
                top: '64px',
                zIndex: 1
              }}
            >
              <span style={{ visibility: 'hidden' }}>{content}</span>
              <span className={`${isDarkMode ? 'bg-amber-400/10' : 'bg-amber-500/20'} px-1 rounded`}>
                {ghostSuggestion}
              </span>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelectionChange}
            onClick={handleSelectionChange}
            placeholder={placeholder}
            className={`${getElementStyles(currentElementType)} font-mono relative z-10`}
            style={{ 
              fontSize: `${12 * (zoomLevel / 100)}px`,
              lineHeight: '1.8',
              minHeight: `${9 * (zoomLevel / 100)}in`,
              backgroundColor: 'transparent'
            }}
          />
        </div>

        {/* Page Break Indicators */}
        {totalPages > 1 && (
          <div className={`absolute bottom-0 left-0 right-0 h-px ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} opacity-50`}></div>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-4 text-xs text-gray-500">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><kbd className="bg-slate-700 px-1 rounded">Tab</kbd> Accept suggestion / Cycle elements</div>
          <div><kbd className="bg-slate-700 px-1 rounded">Shift+Tab</kbd> Element menu</div>
          <div><kbd className="bg-slate-700 px-1 rounded">Ctrl+H</kbd> Scene heading</div>
          <div><kbd className="bg-slate-700 px-1 rounded">Esc</kbd> Clear suggestion</div>
        </div>
        <div className="mt-2 text-gray-600">
          💡 <strong>Smart Suggestions:</strong> Type "INT", "EXT", "FADE", "CUT", etc. and press Tab to auto-complete
        </div>
      </div>
    </div>
  );
});

FormattedScriptEditor.displayName = 'FormattedScriptEditor';

export default FormattedScriptEditor;