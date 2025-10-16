import { useState, useEffect } from 'react';
import { type Scene, SceneDetectionService } from '../utils/sceneDetection';

interface ScenesPanelProps {
  content: string;
  currentCursorPosition: number;
  onSceneClick: (scene: Scene) => void;
  className?: string;
}

export default function ScenesPanel({ 
  content, 
  currentCursorPosition, 
  onSceneClick, 
  className = '' 
}: ScenesPanelProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update scenes when content changes
  useEffect(() => {
    const detectedScenes = SceneDetectionService.detectScenes(content);
    setScenes(detectedScenes);
  }, [content]);

  // Update active scene based on cursor position
  useEffect(() => {
    const currentScene = SceneDetectionService.findSceneAtPosition(scenes, currentCursorPosition);
    setActiveSceneId(currentScene?.id || null);
  }, [scenes, currentCursorPosition]);

  const handleSceneClick = (scene: Scene) => {
    onSceneClick(scene);
  };

  const getTotalDuration = () => {
    return scenes.reduce((total, scene) => total + (scene.estimatedDuration || 0), 0);
  };

  if (scenes.length === 0) {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            SCENES
          </h3>
        </div>
        
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">
            Start writing your script to see scenes appear here
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Scene headings like "INT. COFFEE SHOP - DAY" will be automatically detected
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            SCENES
          </h3>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-slate-700/50 rounded transition-colors"
            title={isCollapsed ? "Expand scenes panel" : "Collapse scenes panel"}
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
          <div className="mt-2 flex items-center justify-between text-sm text-gray-400">
            <span>{scenes.length} scene{scenes.length !== 1 ? 's' : ''}</span>
            <span>~{SceneDetectionService.formatDuration(getTotalDuration())}</span>
          </div>
        )}
      </div>

      {/* Scenes List */}
      {!isCollapsed && (
        <div className="max-h-96 overflow-y-auto">
          <div className="p-2 space-y-1">
            {scenes.map((scene, index) => {
              const isActive = scene.id === activeSceneId;
              const displayTitle = SceneDetectionService.getSceneDisplayTitle(scene, index);
              const description = SceneDetectionService.getSceneDescription(scene);
              
              return (
                <button
                  key={scene.id}
                  onClick={() => handleSceneClick(scene)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 group hover:bg-slate-700/50 ${
                    isActive 
                      ? 'bg-amber-500/20 border border-amber-500/30 text-amber-100' 
                      : 'bg-slate-700/30 border border-transparent text-gray-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Scene Number and Title */}
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          isActive 
                            ? 'bg-amber-500/30 text-amber-200' 
                            : 'bg-slate-600/50 text-gray-400 group-hover:bg-slate-600 group-hover:text-gray-300'
                        }`}>
                          {index + 1}
                        </span>
                        <span className={`font-medium text-sm truncate ${
                          isActive ? 'text-amber-100' : 'text-gray-200 group-hover:text-white'
                        }`}>
                          {displayTitle}
                        </span>
                      </div>
                      
                      {/* Scene Description */}
                      <p className={`text-xs leading-relaxed truncate ${
                        isActive ? 'text-amber-200/80' : 'text-gray-400 group-hover:text-gray-300'
                      }`}>
                        {description}
                      </p>
                      
                      {/* Scene Stats */}
                      <div className="flex items-center space-x-3 mt-2 text-xs">
                        <span className={`flex items-center ${
                          isActive ? 'text-amber-300/70' : 'text-gray-500 group-hover:text-gray-400'
                        }`}>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          Line {scene.lineNumber}
                        </span>
                        
                        {scene.estimatedDuration && scene.estimatedDuration > 0 && (
                          <span className={`flex items-center ${
                            isActive ? 'text-amber-300/70' : 'text-gray-500 group-hover:text-gray-400'
                          }`}>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {SceneDetectionService.formatDuration(scene.estimatedDuration)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Navigation Arrow */}
                    <div className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isActive ? 'opacity-100' : ''
                    }`}>
                      <svg className={`w-4 h-4 ${
                        isActive ? 'text-amber-400' : 'text-gray-400'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer with Tips */}
      {!isCollapsed && scenes.length > 0 && (
        <div className="p-3 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
            <span>Click any scene to jump to it in the editor</span>
          </div>
        </div>
      )}
    </div>
  );
}