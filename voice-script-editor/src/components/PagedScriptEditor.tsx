import { useState, useEffect, useRef, useCallback } from 'react';
import { type Script, type Draft } from '../services/script';
import { type User } from '../services/auth';

interface PagedScriptEditorProps {
  script: Script;
  currentDraft: Draft | null;
  content: string;
  onContentChange: (content: string) => void;
  onCursorPositionChange: (position: number) => void;
  user: User;
  showSidebar: boolean;
  onToggleSidebar: () => void;
}

interface ScriptElement {
  type: 'scene-heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition';
  content: string;
  startIndex: number;
  endIndex: number;
}

interface PageBreak {
  pageNumber: number;
  startIndex: number;
  endIndex: number;
  elements: ScriptElement[];
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

export default function PagedScriptEditor({
  script: _script,
  currentDraft,
  content,
  onContentChange,
  onCursorPositionChange: _onCursorPositionChange,
  user: _user,
  showSidebar,
  onToggleSidebar
}: PagedScriptEditorProps) {
  const [_elements, setElements] = useState<ScriptElement[]>([]);
  const [pages, setPages] = useState<PageBreak[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
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
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Constants for screenplay formatting (in pixels)
  const PAGE_WIDTH = 612; // 8.5 inches at 72 DPI
  const PAGE_HEIGHT = 792; // 11 inches at 72 DPI
  const MARGIN_LEFT = 108; // 1.5 inches
  const MARGIN_RIGHT = 72; // 1 inch
  const MARGIN_TOP = 72; // 1 inch
  const MARGIN_BOTTOM = 72; // 1 inch
  const LINE_HEIGHT = 12; // 12 points
  const LINES_PER_PAGE = Math.floor((PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM) / LINE_HEIGHT);

  // Parse content into screenplay elements
  const parseContent = useCallback((text: string): ScriptElement[] => {
    const lines = text.split('\n');
    const parsedElements: ScriptElement[] = [];
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        currentIndex += line.length + 1; // +1 for newline
        continue;
      }

      const element: ScriptElement = {
        type: detectElementType(trimmedLine, parsedElements),
        content: line,
        startIndex: currentIndex,
        endIndex: currentIndex + line.length
      };

      parsedElements.push(element);
      currentIndex += line.length + 1; // +1 for newline
    }

    return parsedElements;
  }, []);

  // Detect screenplay element type
  const detectElementType = (line: string, previousElements: ScriptElement[]): ScriptElement['type'] => {
    // Scene headings
    if (/^(INT\.|EXT\.|FADE IN:|FADE OUT:|CUT TO:)/i.test(line)) {
      return 'scene-heading';
    }

    // Transitions
    if (/^(FADE IN:|FADE OUT:|CUT TO:|DISSOLVE TO:)/i.test(line)) {
      return 'transition';
    }

    // Parentheticals
    if (line.startsWith('(') && line.endsWith(')')) {
      return 'parenthetical';
    }

    // Character names (all caps, not too long, not a scene heading)
    if (line === line.toUpperCase() && 
        line.length > 0 && 
        line.length < 30 && 
        !line.includes('.') &&
        !/^(INT\.|EXT\.|FADE)/i.test(line)) {
      return 'character';
    }

    // Dialogue (follows character or parenthetical)
    const lastElement = previousElements[previousElements.length - 1];
    if (lastElement && (lastElement.type === 'character' || lastElement.type === 'parenthetical' || lastElement.type === 'dialogue')) {
      return 'dialogue';
    }

    // Default to action
    return 'action';
  };

  // Break content into pages
  const paginateContent = useCallback((elements: ScriptElement[]): PageBreak[] => {
    const pageBreaks: PageBreak[] = [];
    let currentPageElements: ScriptElement[] = [];
    let currentPageLines = 0;
    let pageNumber = 1;

    for (const element of elements) {
      const elementLines = Math.max(1, Math.ceil(element.content.length / 60)); // Rough estimate
      
      // Add spacing based on element type
      let spacingLines = 0;
      if (element.type === 'scene-heading') spacingLines = 2;
      else if (element.type === 'character') spacingLines = 1;
      else if (element.type === 'action') spacingLines = 1;

      const totalLines = elementLines + spacingLines;

      // Check if we need a new page
      if (currentPageLines + totalLines > LINES_PER_PAGE && currentPageElements.length > 0) {
        // Create page break
        pageBreaks.push({
          pageNumber,
          startIndex: currentPageElements[0]?.startIndex || 0,
          endIndex: currentPageElements[currentPageElements.length - 1]?.endIndex || 0,
          elements: [...currentPageElements]
        });

        // Start new page
        pageNumber++;
        currentPageElements = [element];
        currentPageLines = totalLines;
      } else {
        currentPageElements.push(element);
        currentPageLines += totalLines;
      }
    }

    // Add final page
    if (currentPageElements.length > 0) {
      pageBreaks.push({
        pageNumber,
        startIndex: currentPageElements[0]?.startIndex || 0,
        endIndex: currentPageElements[currentPageElements.length - 1]?.endIndex || 0,
        elements: [...currentPageElements]
      });
    }

    return pageBreaks.length > 0 ? pageBreaks : [{
      pageNumber: 1,
      startIndex: 0,
      endIndex: 0,
      elements: []
    }];
  }, []);

  // Calculate script statistics
  const calculateStats = useCallback((elements: ScriptElement[], pageCount: number): ScriptStats => {
    const words = content.split(/\s+/).filter(word => word.length > 0).length;
    const characters = content.length;
    const charactersNoSpaces = content.replace(/\s/g, '').length;
    const scenes = elements.filter(el => el.type === 'scene-heading').length;
    const dialogueLines = elements.filter(el => el.type === 'dialogue').length;
    const actionLines = elements.filter(el => el.type === 'action').length;
    
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
  }, [content]);

  // Update elements and pages when content changes
  useEffect(() => {
    const parsedElements = parseContent(content);
    const pageBreaks = paginateContent(parsedElements);
    const scriptStats = calculateStats(parsedElements, pageBreaks.length);

    setElements(parsedElements);
    setPages(pageBreaks);
    setStats(scriptStats);
  }, [content, parseContent, paginateContent, calculateStats]);

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    onContentChange(newContent);
  };

  // Get element styling
  const getElementStyle = (elementType: ScriptElement['type']): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      lineHeight: '12px',
      margin: 0,
      padding: 0,
      whiteSpace: 'pre-wrap'
    };

    switch (elementType) {
      case 'scene-heading':
        return {
          ...baseStyle,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          marginTop: '24px',
          marginBottom: '12px'
        };
      case 'character':
        return {
          ...baseStyle,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          marginLeft: '216px', // 3.7 inches from left
          marginTop: '12px'
        };
      case 'dialogue':
        return {
          ...baseStyle,
          marginLeft: '144px', // 2.5 inches from left
          marginRight: '144px', // 2 inches from right
          marginBottom: '12px'
        };
      case 'parenthetical':
        return {
          ...baseStyle,
          marginLeft: '180px', // 3.1 inches from left
          marginRight: '180px'
        };
      case 'action':
        return {
          ...baseStyle,
          marginBottom: '12px'
        };
      case 'transition':
        return {
          ...baseStyle,
          fontWeight: 'bold',
          textAlign: 'right',
          marginTop: '12px',
          marginBottom: '12px'
        };
      default:
        return baseStyle;
    }
  };

  // Render a single page
  const renderPage = (pageBreak: PageBreak, pageIndex: number) => {
    const isVisible = viewMode === 'single' 
      ? pageIndex === currentPage - 1
      : pageIndex === currentPage - 1 || pageIndex === currentPage;

    if (!isVisible) return null;

    return (
      <div
        key={pageBreak.pageNumber}
        className="bg-white shadow-lg mx-auto mb-8 relative"
        style={{
          width: `${PAGE_WIDTH * (zoom / 100)}px`,
          height: `${PAGE_HEIGHT * (zoom / 100)}px`,
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center'
        }}
      >
        {/* Page Header */}
        <div 
          className="absolute top-0 right-0 text-xs text-gray-500 font-mono"
          style={{ 
            top: `${MARGIN_TOP / 2}px`, 
            right: `${MARGIN_RIGHT}px` 
          }}
        >
          {pageBreak.pageNumber > 1 && `${pageBreak.pageNumber}.`}
        </div>

        {/* Page Content */}
        <div
          style={{
            position: 'absolute',
            top: `${MARGIN_TOP}px`,
            left: `${MARGIN_LEFT}px`,
            right: `${MARGIN_RIGHT}px`,
            bottom: `${MARGIN_BOTTOM}px`,
            overflow: 'hidden'
          }}
        >
          {pageBreak.elements.map((element, elementIndex) => (
            <div
              key={`${pageBreak.pageNumber}-${elementIndex}`}
              style={getElementStyle(element.type)}
            >
              {element.content}
            </div>
          ))}
        </div>

        {/* Page Border */}
        <div className="absolute inset-0 border border-gray-300 pointer-events-none" />
      </div>
    );
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
              onClick={() => setZoom(Math.max(25, zoom - 25))}
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
              <option value={25}>25%</option>
              <option value={50}>50%</option>
              <option value={75}>75%</option>
              <option value={100}>100%</option>
              <option value={125}>125%</option>
              <option value={150}>150%</option>
              <option value={200}>200%</option>
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
            <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
              {currentPage} / {stats.pages}
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
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-none">
            {viewMode === 'single' ? (
              // Single page view
              pages.map((page, index) => renderPage(page, index))
            ) : (
              // Double page view
              <div className="flex space-x-8 justify-center">
                {pages.slice(currentPage - 1, currentPage + 1).map((page, index) => 
                  renderPage(page, currentPage - 1 + index)
                )}
              </div>
            )}
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

      {/* Hidden textarea for editing */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        className="absolute -left-full opacity-0 pointer-events-none"
        style={{ position: 'absolute', left: '-9999px' }}
      />
    </div>
  );
}