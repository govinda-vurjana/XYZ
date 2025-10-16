import { useState, useEffect, useRef, useCallback } from 'react';
import { type Script, type Draft } from '../services/script';
import { type User } from '../services/auth';

interface EditablePagedEditorProps {
  script: Script;
  currentDraft: Draft | null;
  content: string;
  onContentChange: (content: string) => void;
  onCursorPositionChange: (position: number) => void;
  user: User;
  showSidebar: boolean;
  onToggleSidebar: () => void;
}

interface ScriptStats {
  pages: number;
  words: number;
  characters: number;
  charactersNoSpaces: number;
  scenes: number;
  dialogueLines: number;
  actionLines: number;
  estimatedRuntime: string;
}

export default function EditablePagedEditor({
  script: _script,
  currentDraft,
  content,
  onContentChange,
  onCursorPositionChange,
  user: _user,
  showSidebar,
  onToggleSidebar
}: EditablePagedEditorProps) {
  const [zoom, setZoom] = useState(100);
  const [stats, setStats] = useState<ScriptStats>({
    pages: 1,
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    scenes: 0,
    dialogueLines: 0,
    actionLines: 0,
    estimatedRuntime: '00:00:00'
  });
  const [showStats, setShowStats] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single');
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<string[]>(['']);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentElementType, setCurrentElementType] = useState<'scene' | 'action' | 'character' | 'dialogue' | 'parenthetical'>('action');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Constants for screenplay formatting
  const LINES_PER_PAGE = 55;
  const CHARACTERS_PER_LINE = 60;

  // Common screenplay suggestions
  const sceneHeadingSuggestions = [
    'INT. COFFEE SHOP - DAY',
    'EXT. COFFEE SHOP - DAY',
    'INT. COFFEE SHOP - NIGHT',
    'EXT. COFFEE SHOP - NIGHT',
    'INT. HOUSE - DAY',
    'EXT. HOUSE - DAY',
    'INT. CAR - DAY',
    'EXT. STREET - DAY',
    'INT. OFFICE - DAY',
    'EXT. PARK - DAY'
  ];

  const characterSuggestions = [
    'ANNA',
    'JOHN',
    'SARAH',
    'MIKE',
    'DAVID',
    'LISA',
    'TEACHER',
    'WAITER',
    'DOCTOR',
    'POLICE OFFICER'
  ];

  // Detect element type based on current line
  const detectElementType = useCallback((line: string, previousLine: string): typeof currentElementType => {
    const trimmed = line.trim().toUpperCase();
    
    // Scene headings
    if (/^(INT\.|EXT\.|FADE IN:|FADE OUT:|CUT TO:)/.test(trimmed)) {
      return 'scene';
    }
    
    // Character names (all caps, not too long, not a scene heading)
    if (trimmed === line.trim().toUpperCase() && 
        trimmed.length > 0 && 
        trimmed.length < 30 && 
        !trimmed.includes('.') &&
        !/^(INT\.|EXT\.|FADE)/.test(trimmed)) {
      return 'character';
    }
    
    // Parentheticals
    if (line.trim().startsWith('(') && line.trim().endsWith(')')) {
      return 'parenthetical';
    }
    
    // Dialogue (follows character or parenthetical)
    const prevTrimmed = previousLine.trim().toUpperCase();
    if (prevTrimmed === previousLine.trim().toUpperCase() && 
        prevTrimmed.length > 0 && 
        prevTrimmed.length < 30 && 
        !prevTrimmed.includes('.')) {
      return 'dialogue';
    }
    
    return 'action';
  }, []);

  // Break content into pages with automatic page creation
  const paginateContent = useCallback((text: string): string[] => {
    if (!text.trim()) return [''];
    
    const lines = text.split('\n');
    const pageArray: string[] = [];
    let currentPageLines: string[] = [];
    let lineCount = 0;

    for (const line of lines) {
      // Estimate lines this content will take (accounting for wrapping and element spacing)
      const baseLines = Math.max(1, Math.ceil(line.length / CHARACTERS_PER_LINE));
      
      // Add extra spacing for certain elements
      let spacingLines = 0;
      const trimmed = line.trim().toUpperCase();
      if (/^(INT\.|EXT\.|FADE IN:|FADE OUT:)/.test(trimmed)) {
        spacingLines = 2; // Scene headings need extra space
      } else if (trimmed === line.trim().toUpperCase() && 
                 trimmed.length > 0 && 
                 trimmed.length < 30 && 
                 !trimmed.includes('.')) {
        spacingLines = 1; // Character names need space
      }
      
      const totalLines = baseLines + spacingLines;
      
      // Check if we need a new page
      if (lineCount + totalLines > LINES_PER_PAGE && currentPageLines.length > 0) {
        // Create page break
        pageArray.push(currentPageLines.join('\n'));
        currentPageLines = [line];
        lineCount = totalLines;
      } else {
        currentPageLines.push(line);
        lineCount += totalLines;
      }
    }

    // Add the last page
    if (currentPageLines.length > 0) {
      pageArray.push(currentPageLines.join('\n'));
    }

    return pageArray.length > 0 ? pageArray : [''];
  }, []);

  // Check if current page content exceeds page limit and auto-create new page
  const checkAndCreateNewPage = useCallback((pageContent: string, _pageIndex: number) => {
    const lines = pageContent.split('\n');
    let lineCount = 0;
    
    for (const line of lines) {
      const baseLines = Math.max(1, Math.ceil(line.length / CHARACTERS_PER_LINE));
      const trimmed = line.trim().toUpperCase();
      
      let spacingLines = 0;
      if (/^(INT\.|EXT\.|FADE IN:|FADE OUT:)/.test(trimmed)) {
        spacingLines = 2;
      } else if (trimmed === line.trim().toUpperCase() && 
                 trimmed.length > 0 && 
                 trimmed.length < 30 && 
                 !trimmed.includes('.')) {
        spacingLines = 1;
      }
      
      lineCount += baseLines + spacingLines;
    }
    
    // If content exceeds page limit, split it
    if (lineCount > LINES_PER_PAGE) {
      const newPages = paginateContent(pageContent);
      return newPages;
    }
    
    return [pageContent];
  }, [paginateContent]);

  // Calculate script statistics
  const calculateStats = useCallback((): ScriptStats => {
    const words = content.split(/\s+/).filter(word => word.length > 0).length;
    const characters = content.length;
    const charactersNoSpaces = content.replace(/\s/g, '').length;
    const pageCount = pages.length;
    
    // Count scenes (lines starting with INT. or EXT.)
    const scenes = (content.match(/^(INT\.|EXT\.)/gm) || []).length;
    
    // Count dialogue lines (lines that follow character names)
    const lines = content.split('\n');
    let dialogueLines = 0;
    let actionLines = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Check if it's a character name (all caps, not a scene heading)
      if (line === line.toUpperCase() && 
          line.length > 0 && 
          line.length < 30 && 
          !line.includes('.') &&
          !/^(INT\.|EXT\.|FADE)/i.test(line)) {
        // Next non-empty lines are likely dialogue
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim();
          if (!nextLine) break;
          if (nextLine.startsWith('(') && nextLine.endsWith(')')) continue; // Skip parentheticals
          if (nextLine === nextLine.toUpperCase()) break; // Stop at next character
          if (/^(INT\.|EXT\.)/i.test(nextLine)) break; // Stop at scene heading
          dialogueLines++;
        }
      } else if (!/^(INT\.|EXT\.)/i.test(line) && 
                 line !== line.toUpperCase() && 
                 !line.startsWith('(')) {
        actionLines++;
      }
    }
    
    // Estimate runtime (1 page ≈ 1 minute)
    const totalMinutes = pageCount;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const estimatedRuntime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

    return {
      pages: pageCount,
      words,
      characters,
      charactersNoSpaces,
      scenes,
      dialogueLines,
      actionLines,
      estimatedRuntime
    };
  }, [content, pages.length]);

  // Update pages and stats when content changes
  useEffect(() => {
    const newPages = paginateContent(content);
    setPages(newPages);
    
    // Auto-navigate to new page if content was added and created a new page
    if (newPages.length > pages.length && currentPage === pages.length) {
      setCurrentPage(newPages.length);
    }
    
    const scriptStats = calculateStats();
    setStats(scriptStats);
  }, [content, paginateContent, calculateStats, pages.length, currentPage]);

  // Get suggestions based on current input
  const getSuggestions = useCallback((input: string, elementType: typeof currentElementType): string[] => {
    if (!input.trim()) return [];
    
    const inputUpper = input.toUpperCase();
    
    if (elementType === 'scene') {
      return sceneHeadingSuggestions.filter(suggestion => 
        suggestion.includes(inputUpper)
      ).slice(0, 5);
    }
    
    if (elementType === 'character') {
      return characterSuggestions.filter(suggestion => 
        suggestion.startsWith(inputUpper)
      ).slice(0, 5);
    }
    
    return [];
  }, []);

  // Handle content changes with smart formatting
  const handleContentChange = (newContent: string) => {
    const lines = newContent.split('\n');
    const currentLineIndex = textareaRef.current?.selectionStart ? 
      newContent.substring(0, textareaRef.current.selectionStart).split('\n').length - 1 : 0;
    
    const currentLine = lines[currentLineIndex] || '';
    const previousLine = lines[currentLineIndex - 1] || '';
    
    // Detect element type
    const elementType = detectElementType(currentLine, previousLine);
    setCurrentElementType(elementType);
    
    // Get suggestions
    const suggestions = getSuggestions(currentLine, elementType);
    setSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0 && currentLine.trim().length > 0);
    
    onContentChange(newContent);
  };

  // Handle key presses for smart formatting
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const lines = value.split('\n');
    const currentLineIndex = value.substring(0, selectionStart).split('\n').length - 1;
    const currentLine = lines[currentLineIndex] || '';

    // Tab key - cycle element types or accept suggestion
    if (e.key === 'Tab') {
      e.preventDefault();
      
      if (showSuggestions && suggestions.length > 0) {
        // Accept first suggestion
        const suggestion = suggestions[0];
        const newLines = [...lines];
        newLines[currentLineIndex] = suggestion;
        const newContent = newLines.join('\n');
        handleContentChange(newContent);
        setShowSuggestions(false);
        
        // Position cursor at end of suggestion
        setTimeout(() => {
          const newPosition = newContent.split('\n').slice(0, currentLineIndex).join('\n').length + 
                            (currentLineIndex > 0 ? 1 : 0) + suggestion.length;
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
      } else {
        // Cycle element types by applying formatting
        cycleElementType(currentLineIndex, lines);
      }
    }

    // Enter key - smart new line
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const elementType = detectElementType(currentLine, lines[currentLineIndex - 1] || '');
      let newLine = '';
      
      // Smart indentation based on element type
      if (elementType === 'character') {
        newLine = '          '; // Dialogue indentation
      } else if (elementType === 'dialogue') {
        newLine = ''; // Back to action
      }
      
      const beforeCursor = value.substring(0, selectionStart);
      const afterCursor = value.substring(selectionEnd);
      const newContent = beforeCursor + '\n' + newLine + afterCursor;
      
      handleContentChange(newContent);
      
      // Position cursor after indentation
      setTimeout(() => {
        const newPosition = selectionStart + 1 + newLine.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }

    // Escape key - hide suggestions
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Cycle element types with Tab
  const cycleElementType = (lineIndex: number, lines: string[]) => {
    const currentLine = lines[lineIndex];
    const trimmed = currentLine.trim();
    
    if (!trimmed) return;
    
    let newLine = '';
    
    // Cycle through element types
    switch (currentElementType) {
      case 'action':
        // Convert to scene heading
        newLine = trimmed.toUpperCase();
        break;
      case 'scene':
        // Convert to character
        newLine = '                    ' + trimmed.toUpperCase();
        break;
      case 'character':
        // Convert to dialogue
        newLine = '          ' + trimmed.toLowerCase();
        break;
      case 'dialogue':
        // Convert to action
        newLine = trimmed;
        break;
      default:
        newLine = trimmed;
    }
    
    const newLines = [...lines];
    newLines[lineIndex] = newLine;
    const newContent = newLines.join('\n');
    handleContentChange(newContent);
  };

  // Handle cursor position changes
  const handleCursorChange = () => {
    if (textareaRef.current) {
      onCursorPositionChange(textareaRef.current.selectionStart);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, value } = textarea;
    const lines = value.split('\n');
    const currentLineIndex = value.substring(0, selectionStart).split('\n').length - 1;
    
    const newLines = [...lines];
    newLines[currentLineIndex] = suggestion;
    const newContent = newLines.join('\n');
    
    handleContentChange(newContent);
    setShowSuggestions(false);
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus();
      const newPosition = newContent.split('\n').slice(0, currentLineIndex).join('\n').length + 
                        (currentLineIndex > 0 ? 1 : 0) + suggestion.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center space-x-4">
          {/* Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded transition-colors ${
              showSidebar 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
            }`}
            title={showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('single')}
              className={`p-2 rounded ${viewMode === 'single' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300'}`}
              title="Single Page View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('double')}
              className={`p-2 rounded ${viewMode === 'double' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300'}`}
              title="Double Page View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-1" />
              </svg>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              className="p-1 rounded bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <select
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="px-2 py-1 text-sm bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded border-none"
            >
              <option value={50}>50%</option>
              <option value={75}>75%</option>
              <option value={100}>100%</option>
              <option value={125}>125%</option>
              <option value={150}>150%</option>
            </select>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="p-1 rounded bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[80px] text-center">
              Page {currentPage} of {stats.pages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(stats.pages, currentPage + 1))}
              disabled={currentPage === stats.pages}
              className="p-1 rounded bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Page Info */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {stats.words} words • {currentElementType}
          </div>
        </div>

        {/* Stats Toggle */}
        <button
          onClick={() => setShowStats(!showStats)}
          className="flex items-center space-x-2 px-3 py-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-slate-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm">Stats</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor Area */}
        <div className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-none flex justify-center">
            {viewMode === 'single' ? (
              // Single page view
              <div className="relative">
                {/* Page Container */}
                <div
                  className="bg-white shadow-lg relative"
                  style={{
                    width: `${612 * (zoom / 100)}px`,
                    minHeight: `${792 * (zoom / 100)}px`,
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center'
                  }}
                >
                  {/* Page Header */}
                  <div 
                    className="absolute top-0 right-0 text-xs text-gray-500 font-mono"
                    style={{ 
                      top: `${36 * (zoom / 100)}px`, 
                      right: `${72 * (zoom / 100)}px` 
                    }}
                  >
                    {currentPage > 1 ? `${currentPage}.` : ''}
                  </div>

                  {/* Editable Content Area */}
                  <textarea
                    ref={textareaRef}
                    value={pages[currentPage - 1] || ''}
                    onChange={(e) => {
                      const newPageContent = e.target.value;
                      
                      // Check if content exceeds current page limit
                      const splitPages = checkAndCreateNewPage(newPageContent, currentPage - 1);
                      
                      if (splitPages.length > 1) {
                        // Content overflowed, split into multiple pages
                        const newPages = [...pages];
                        
                        // Replace current page and add overflow to next pages
                        newPages[currentPage - 1] = splitPages[0];
                        
                        // Add overflow content to subsequent pages
                        for (let i = 1; i < splitPages.length; i++) {
                          if (currentPage - 1 + i < newPages.length) {
                            // Prepend to existing page
                            newPages[currentPage - 1 + i] = splitPages[i] + '\n' + (newPages[currentPage - 1 + i] || '');
                          } else {
                            // Create new page
                            newPages.push(splitPages[i]);
                          }
                        }
                        
                        // Update content with new pages
                        const newContent = newPages.join('\n');
                        handleContentChange(newContent);
                        
                        // Auto-navigate to new page if content was added
                        if (newPages.length > pages.length) {
                          setTimeout(() => setCurrentPage(newPages.length), 100);
                        }
                      } else {
                        // Content fits in current page, update normally
                        const newPages = [...pages];
                        newPages[currentPage - 1] = newPageContent;
                        const newContent = newPages.join('\n');
                        handleContentChange(newContent);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    onSelect={handleCursorChange}
                    onKeyUp={handleCursorChange}
                    onClick={handleCursorChange}
                    placeholder={currentPage === 1 ? `Start writing your script here...

FADE IN:

INT. COFFEE SHOP - DAY

A cozy coffee shop buzzes with morning activity. ANNA (25), a determined writer, sits at a corner table with her laptop.

ANNA
(typing furiously)
This is it. This is the scene that changes everything.

She pauses, looks up, and smiles.

TIP: Press Tab to cycle element types or accept suggestions
TIP: Type "INT." or "EXT." for scene headings` : `Page ${currentPage} content...`}
                    className="w-full h-full resize-none border-none outline-none bg-transparent text-black font-mono text-xs leading-relaxed p-0"
                    style={{
                      position: 'absolute',
                      top: `${72 * (zoom / 100)}px`,
                      left: `${108 * (zoom / 100)}px`,
                      right: `${72 * (zoom / 100)}px`,
                      bottom: `${72 * (zoom / 100)}px`,
                      fontSize: `${12 * (zoom / 100)}px`,
                      lineHeight: `${18 * (zoom / 100)}px`,
                      padding: '0',
                      minHeight: `${(792 - 144) * (zoom / 100)}px`
                    }}
                  />

                  {/* Page Border */}
                  <div className="absolute inset-0 border border-gray-300 pointer-events-none" />
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg z-50 max-w-xs"
                    style={{
                      top: '100px',
                      left: '150px'
                    }}
                  >
                    <div className="p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">
                        Suggestions ({currentElementType}):
                      </div>
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 rounded font-mono"
                        >
                          {suggestion}
                        </button>
                      ))}
                      <div className="text-xs text-gray-400 mt-2 px-2 border-t pt-2">
                        Press Tab to accept • Esc to close
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Double page view
              <div className="flex space-x-8">
                {[currentPage, currentPage + 1].map((pageNum) => (
                  pageNum <= stats.pages && (
                    <div
                      key={pageNum}
                      className="bg-white shadow-lg relative"
                      style={{
                        width: `${612 * (zoom / 100)}px`,
                        minHeight: `${792 * (zoom / 100)}px`,
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top center'
                      }}
                    >
                      {/* Page Header */}
                      <div 
                        className="absolute top-0 right-0 text-xs text-gray-500 font-mono"
                        style={{ 
                          top: `${36 * (zoom / 100)}px`, 
                          right: `${72 * (zoom / 100)}px` 
                        }}
                      >
                        {pageNum > 1 ? `${pageNum}.` : ''}
                      </div>

                      {/* Page Content (read-only for non-current pages) */}
                      <div
                        className="absolute font-mono text-xs leading-relaxed text-black whitespace-pre-wrap"
                        style={{
                          top: `${72 * (zoom / 100)}px`,
                          left: `${108 * (zoom / 100)}px`,
                          right: `${72 * (zoom / 100)}px`,
                          bottom: `${72 * (zoom / 100)}px`,
                          fontSize: `${12 * (zoom / 100)}px`,
                          lineHeight: `${18 * (zoom / 100)}px`,
                          padding: '0'
                        }}
                      >
                        {pages[pageNum - 1] || ''}
                      </div>

                      {/* Page Border */}
                      <div className="absolute inset-0 border border-gray-300 pointer-events-none" />
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Formatting Help */}
          <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-400 max-w-xs shadow-lg">
            <div className="font-semibold mb-2">Quick Format Guide:</div>
            <div className="space-y-1">
              <div><kbd className="bg-gray-200 dark:bg-slate-700 px-1 rounded">Tab</kbd> Cycle element types</div>
              <div><kbd className="bg-gray-200 dark:bg-slate-700 px-1 rounded">Enter</kbd> Smart new line</div>
              <div>Type <code>INT.</code> or <code>EXT.</code> for scenes</div>
              <div>Type in <code>ALL CAPS</code> for characters</div>
              <div>Current: <span className="font-semibold">{currentElementType}</span></div>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && (
          <div className="w-80 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 p-6 overflow-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Script Statistics</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Document Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Pages:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{stats.pages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Words:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{stats.words.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Characters:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{stats.characters.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Characters (no spaces):</span>
                    <span className="font-medium text-gray-900 dark:text-white">{stats.charactersNoSpaces.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Script Elements</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Scenes:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{stats.scenes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Dialogue Lines:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{stats.dialogueLines}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Action Lines:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{stats.actionLines}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Timing</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Estimated Runtime:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{stats.estimatedRuntime}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    * Based on industry standard of ~1 page per minute
                  </div>
                </div>
              </div>

              {currentDraft && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900 dark:text-amber-300 mb-2">Current Draft</h4>
                  <div className="text-sm text-amber-800 dark:text-amber-400">
                    <div className="font-medium">{currentDraft.name}</div>
                    <div className="text-xs mt-1">
                      Last updated: {new Date(currentDraft.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}