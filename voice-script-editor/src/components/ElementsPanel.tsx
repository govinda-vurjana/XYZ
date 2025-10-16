import { useState, useEffect } from 'react';
import { ElementDetectionService, type ScriptElement } from '../utils/elementDetection';

interface ElementsPanelProps {
  content: string;
  className?: string;
}

type TabType = 'characters' | 'locations';

export default function ElementsPanel({ content, className = '' }: ElementsPanelProps) {
  const [elements, setElements] = useState<ScriptElement>({ characters: [], locations: [] });
  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update elements when content changes
  useEffect(() => {
    const extractedElements = ElementDetectionService.extractElements(content);
    setElements(extractedElements);
  }, [content]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const renderCharactersList = () => {
    if (elements.characters.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">
            No characters detected yet
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Character names in ALL CAPS will appear here
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {elements.characters.map((character) => (
          <div
            key={character.id}
            className="p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-white">
                      {character.displayName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm truncate">
                      {character.displayName}
                    </h4>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {character.dialogueCount} line{character.dialogueCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {character.scenes.length} scene{character.scenes.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Scene associations */}
                {character.scenes.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {character.scenes.slice(0, 3).map((sceneId, index) => (
                        <span
                          key={sceneId}
                          className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                        >
                          Scene {index + 1}
                        </span>
                      ))}
                      {character.scenes.length > 3 && (
                        <span className="px-2 py-1 bg-slate-600/50 text-gray-400 text-xs rounded-full">
                          +{character.scenes.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLocationsList = () => {
    if (elements.locations.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">
            No locations detected yet
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Scene headings like "INT. COFFEE SHOP - DAY" will appear here
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {elements.locations.map((location) => (
          <div
            key={location.id}
            className="p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    location.type === 'INT' 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                      : location.type === 'EXT'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}>
                    <span className="text-xs font-semibold text-white">
                      {location.type === 'INT' ? 'IN' : location.type === 'EXT' ? 'EX' : 'OT'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm truncate">
                      {location.displayName}
                    </h4>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {location.sceneCount} scene{location.sceneCount !== 1 ? 's' : ''}
                      </span>
                      {location.timeOfDay && (
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          {location.timeOfDay}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Scene associations */}
                {location.scenes.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {location.scenes.slice(0, 3).map((sceneId, index) => (
                        <span
                          key={sceneId}
                          className={`px-2 py-1 text-xs rounded-full ${
                            location.type === 'INT' 
                              ? 'bg-blue-500/20 text-blue-300' 
                              : location.type === 'EXT'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          Scene {index + 1}
                        </span>
                      ))}
                      {location.scenes.length > 3 && (
                        <span className="px-2 py-1 bg-slate-600/50 text-gray-400 text-xs rounded-full">
                          +{location.scenes.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            ELEMENTS
          </h3>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-slate-700/50 rounded transition-colors"
            title={isCollapsed ? "Expand elements panel" : "Collapse elements panel"}
          >
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
        
        {!isCollapsed && (
          <div className="mt-3">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-slate-700/30 rounded-lg p-1">
              <button
                onClick={() => handleTabChange('characters')}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'characters'
                    ? 'bg-slate-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Characters</span>
                {elements.characters.length > 0 && (
                  <span className="bg-purple-500/30 text-purple-300 text-xs px-2 py-1 rounded-full">
                    {elements.characters.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => handleTabChange('locations')}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'locations'
                    ? 'bg-slate-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Locations</span>
                {elements.locations.length > 0 && (
                  <span className="bg-blue-500/30 text-blue-300 text-xs px-2 py-1 rounded-full">
                    {elements.locations.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="max-h-96 overflow-y-auto">
          <div className="p-4">
            {activeTab === 'characters' ? renderCharactersList() : renderLocationsList()}
          </div>
        </div>
      )}

      {/* Footer with Tips */}
      {!isCollapsed && (elements.characters.length > 0 || elements.locations.length > 0) && (
        <div className="p-3 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
            <span>
              {activeTab === 'characters' 
                ? 'Characters are detected from ALL CAPS names before dialogue'
                : 'Locations are extracted from scene headings (INT./EXT.)'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}