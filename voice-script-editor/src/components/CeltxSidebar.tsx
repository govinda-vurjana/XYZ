import { useState } from 'react';
import { type Script, type Draft } from '../services/script';
import { type User } from '../services/auth';
import { type Scene, SceneDetectionService } from '../utils/sceneDetection';
import { ElementDetectionService } from '../utils/elementDetection';

interface CeltxSidebarProps {
  script: Script;
  currentDraft: Draft | null;
  content: string;
  user: User;
  currentCursorPosition: number;
  onSceneClick: (scene: Scene) => void;
}

interface SidebarSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  count?: number;
}

export default function CeltxSidebar({
  script,
  currentDraft,
  content,
  user,
  currentCursorPosition,
  onSceneClick
}: CeltxSidebarProps) {
  const [sections, setSections] = useState<SidebarSection[]>([
    {
      id: 'scenes',
      title: 'SCENES',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4z" />
        </svg>
      ),
      isExpanded: true
    },
    {
      id: 'collaborators',
      title: 'Collaborators',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      isExpanded: false,
      count: 1
    },
    {
      id: 'cast-crew',
      title: 'Cast & Crew',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      isExpanded: false
    },
    {
      id: 'locations',
      title: 'Locations',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      isExpanded: false
    },
    {
      id: 'schedule',
      title: 'Schedule',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      isExpanded: false
    }
  ]);

  const scenes = SceneDetectionService.detectScenes(content);
  const elements = ElementDetectionService.extractElements(content);
  const characters = elements.characters;
  const locations = elements.locations;

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isExpanded: !section.isExpanded }
        : section
    ));
  };

  const renderScenesSection = () => {
    const scenesSection = sections.find(s => s.id === 'scenes');
    if (!scenesSection?.isExpanded) return null;

    return (
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {scenes.length} scene{scenes.length !== 1 ? 's' : ''}
        </div>
        <div className="space-y-1">
          {scenes.map((scene: Scene, index: number) => {
            const isActive = currentCursorPosition >= scene.startPosition && 
                            currentCursorPosition <= scene.endPosition;
            
            return (
              <button
                key={index}
                onClick={() => onSceneClick(scene)}
                className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                  isActive 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono bg-slate-700 px-1.5 py-0.5 rounded">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{scene.heading}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {scene.content.slice(0, 50) || 'No description'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span># Line {scene.lineNumber}</span>
                  <span>⌘ 1</span>
                </div>
              </button>
            );
          })}
        </div>
        
        {scenes.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4z" />
            </svg>
            <p className="text-sm">No scenes yet</p>
            <p className="text-xs">Start writing to see scenes here</p>
          </div>
        )}
        
        <div className="mt-4 pt-3 border-t border-slate-700/50">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Click any scene to jump to it in the editor
          </p>
        </div>
      </div>
    );
  };

  const renderCollaboratorsSection = () => {
    const collaboratorsSection = sections.find(s => s.id === 'collaborators');
    if (!collaboratorsSection?.isExpanded) return null;

    return (
      <div className="px-4 pb-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 p-2 bg-slate-700/30 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{user.name}</div>
              <div className="text-xs text-gray-400">Owner</div>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-slate-700/50">
          <button className="w-full text-left p-2 text-sm text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
            + Invite collaborators
          </button>
        </div>
      </div>
    );
  };

  const renderCastCrewSection = () => {
    const castCrewSection = sections.find(s => s.id === 'cast-crew');
    if (!castCrewSection?.isExpanded) return null;

    return (
      <div className="px-4 pb-4">
        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-gray-400 mb-2">CHARACTERS</div>
            <div className="space-y-1">
              {characters.slice(0, 5).map((character: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-700/30 rounded text-sm">
                  <span className="text-gray-300">{character.name}</span>
                  <span className="text-xs text-gray-500">{character.scenes.length} scenes</span>
                </div>
              ))}
              {characters.length === 0 && (
                <div className="text-xs text-gray-500 py-2">No characters detected yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLocationsSection = () => {
    const locationsSection = sections.find(s => s.id === 'locations');
    if (!locationsSection?.isExpanded) return null;

    return (
      <div className="px-4 pb-4">
        <div className="space-y-1">
          {locations.slice(0, 8).map((location: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-2 bg-slate-700/30 rounded text-sm">
              <span className="text-gray-300">{location.name}</span>
              <span className="text-xs text-gray-500">{location.scenes.length} scenes</span>
            </div>
          ))}
          {locations.length === 0 && (
            <div className="text-xs text-gray-500 py-2">No locations detected yet</div>
          )}
        </div>
      </div>
    );
  };

  const renderScheduleSection = () => {
    const scheduleSection = sections.find(s => s.id === 'schedule');
    if (!scheduleSection?.isExpanded) return null;

    return (
      <div className="px-4 pb-4">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Schedule coming soon</p>
          <p className="text-xs">Plan your shooting schedule</p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
              <path d="M14 2v6h6"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-white truncate">{script.title}</h2>
            <p className="text-xs text-gray-400 truncate">
              {currentDraft ? `Draft: ${currentDraft.name}` : 'Main Script'}
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.id} className="border-b border-slate-700/50">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-gray-400">{section.icon}</span>
                <span className="text-sm font-medium text-gray-300">{section.title}</span>
                {section.count && (
                  <span className="text-xs bg-slate-700 text-gray-400 px-2 py-0.5 rounded-full">
                    {section.count}
                  </span>
                )}
              </div>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform ${section.isExpanded ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {section.id === 'scenes' && renderScenesSection()}
            {section.id === 'collaborators' && renderCollaboratorsSection()}
            {section.id === 'cast-crew' && renderCastCrewSection()}
            {section.id === 'locations' && renderLocationsSection()}
            {section.id === 'schedule' && renderScheduleSection()}
          </div>
        ))}
      </div>
    </div>
  );
}