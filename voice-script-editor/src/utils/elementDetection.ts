export interface Character {
  id: string;
  name: string;
  displayName: string;
  scenes: string[];
  dialogueCount: number;
  firstAppearance: number;
  description?: string;
}

export interface Location {
  id: string;
  name: string;
  displayName: string;
  type: 'INT' | 'EXT' | 'OTHER';
  scenes: string[];
  sceneCount: number;
  firstAppearance: number;
  timeOfDay?: string;
}

export interface ScriptElement {
  characters: Character[];
  locations: Location[];
}

export class ElementDetectionService {
  /**
   * Extracts characters and locations from script content
   */
  static extractElements(content: string): ScriptElement {
    const lines = content.split('\n');
    const characters = new Map<string, Character>();
    const locations = new Map<string, Location>();
    
    let currentSceneId = 'scene_1';
    let sceneCounter = 1;
    let linePosition = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      linePosition += lines[i].length + 1; // +1 for newline
      
      // Check for scene headings to track current scene
      if (this.isSceneHeading(line)) {
        currentSceneId = `scene_${sceneCounter}`;
        sceneCounter++;
        
        // Extract location from scene heading
        const location = this.extractLocationFromSceneHeading(line, currentSceneId, linePosition);
        if (location) {
          const existingLocation = locations.get(location.name);
          if (existingLocation) {
            existingLocation.scenes.push(currentSceneId);
            existingLocation.sceneCount++;
          } else {
            locations.set(location.name, location);
          }
        }
      }
      
      // Check for character names
      const character = this.extractCharacterFromLine(line, currentSceneId, linePosition);
      if (character) {
        const existingCharacter = characters.get(character.name);
        if (existingCharacter) {
          if (!existingCharacter.scenes.includes(currentSceneId)) {
            existingCharacter.scenes.push(currentSceneId);
          }
          existingCharacter.dialogueCount++;
        } else {
          characters.set(character.name, character);
        }
      }
    }

    return {
      characters: Array.from(characters.values()).sort((a, b) => a.firstAppearance - b.firstAppearance),
      locations: Array.from(locations.values()).sort((a, b) => a.firstAppearance - b.firstAppearance)
    };
  }

  /**
   * Checks if a line is a scene heading
   */
  private static isSceneHeading(line: string): boolean {
    if (!line.trim()) return false;
    
    const upperLine = line.toUpperCase().trim();
    
    const sceneHeadingPatterns = [
      /^(INT\.|EXT\.)/,
      /^FADE IN/,
      /^FADE OUT/,
      /^FADE TO/,
      /^CUT TO/,
      /^DISSOLVE TO/,
      /^SCENE \d+/,
      /^ACT \d+/,
      /^CHAPTER \d+/
    ];

    return sceneHeadingPatterns.some(pattern => pattern.test(upperLine));
  }

  /**
   * Extracts location information from scene heading
   */
  private static extractLocationFromSceneHeading(line: string, sceneId: string, position: number): Location | null {
    const upperLine = line.toUpperCase().trim();
    
    // Match INT./EXT. pattern
    const match = upperLine.match(/^(INT\.|EXT\.)\s+(.+?)(\s+-\s+(.+))?$/);
    if (match) {
      const type = match[1] === 'INT.' ? 'INT' : 'EXT';
      const locationName = match[2].trim();
      const timeOfDay = match[4]?.trim();
      
      return {
        id: `location_${locationName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        name: locationName,
        displayName: locationName,
        type,
        scenes: [sceneId],
        sceneCount: 1,
        firstAppearance: position,
        timeOfDay
      };
    }
    
    // Handle other scene types
    if (this.isSceneHeading(line)) {
      const cleanLine = line.replace(/^(FADE IN|FADE OUT|FADE TO|CUT TO|DISSOLVE TO)[:.]?\s*/i, '').trim();
      if (cleanLine) {
        return {
          id: `location_${cleanLine.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
          name: cleanLine,
          displayName: cleanLine,
          type: 'OTHER',
          scenes: [sceneId],
          sceneCount: 1,
          firstAppearance: position
        };
      }
    }
    
    return null;
  }

  /**
   * Extracts character from a line (typically character names before dialogue)
   */
  private static extractCharacterFromLine(line: string, sceneId: string, position: number): Character | null {
    const trimmed = line.trim();
    
    // Character names are typically all caps, on their own line, and not scene headings
    if (this.isCharacterName(trimmed)) {
      // Remove parentheticals like (CONT'D) or (O.S.)
      const cleanName = trimmed.replace(/\s*\([^)]*\)\s*$/g, '').trim();
      
      return {
        id: `character_${cleanName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        name: cleanName,
        displayName: cleanName,
        scenes: [sceneId],
        dialogueCount: 1,
        firstAppearance: position
      };
    }
    
    return null;
  }

  /**
   * Checks if a line is a character name
   */
  private static isCharacterName(line: string): boolean {
    const trimmed = line.trim();
    
    // Must be all uppercase
    if (trimmed !== trimmed.toUpperCase()) return false;
    
    // Must not be empty
    if (!trimmed) return false;
    
    // Must not be a scene heading
    if (this.isSceneHeading(trimmed)) return false;
    
    // Must be reasonable length for a character name (2-50 characters)
    if (trimmed.length < 2 || trimmed.length > 50) return false;
    
    // Must not contain periods (scene headings often do)
    if (trimmed.includes('.') && !trimmed.match(/\([^)]*\)$/)) return false;
    
    // Must contain at least one letter
    if (!/[A-Z]/.test(trimmed)) return false;
    
    // Common character name patterns
    const characterPatterns = [
      /^[A-Z][A-Z\s]*$/,                    // Basic all caps name
      /^[A-Z][A-Z\s]*\s*\([^)]*\)$/,        // Name with parenthetical
      /^[A-Z][A-Z\s]*\s*\(CONT'D\)$/,       // Name with CONT'D
      /^[A-Z][A-Z\s]*\s*\(O\.S\.\)$/,       // Name with O.S.
      /^[A-Z][A-Z\s]*\s*\(V\.O\.\)$/        // Name with V.O.
    ];
    
    return characterPatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * Gets characters that appear in a specific scene
   */
  static getCharactersInScene(elements: ScriptElement, sceneId: string): Character[] {
    return elements.characters.filter(character => 
      character.scenes.includes(sceneId)
    );
  }

  /**
   * Gets locations that appear in a specific scene
   */
  static getLocationsInScene(elements: ScriptElement, sceneId: string): Location[] {
    return elements.locations.filter(location => 
      location.scenes.includes(sceneId)
    );
  }

  /**
   * Gets the most frequently used characters
   */
  static getTopCharacters(elements: ScriptElement, limit: number = 10): Character[] {
    return elements.characters
      .sort((a, b) => b.dialogueCount - a.dialogueCount)
      .slice(0, limit);
  }

  /**
   * Gets the most frequently used locations
   */
  static getTopLocations(elements: ScriptElement, limit: number = 10): Location[] {
    return elements.locations
      .sort((a, b) => b.sceneCount - a.sceneCount)
      .slice(0, limit);
  }

  /**
   * Formats character display name with additional info
   */
  static formatCharacterDisplay(character: Character): string {
    const dialogueInfo = character.dialogueCount > 1 ? ` (${character.dialogueCount} lines)` : '';
    return `${character.displayName}${dialogueInfo}`;
  }

  /**
   * Formats location display name with additional info
   */
  static formatLocationDisplay(location: Location): string {
    const sceneInfo = location.sceneCount > 1 ? ` (${location.sceneCount} scenes)` : '';
    const timeInfo = location.timeOfDay ? ` - ${location.timeOfDay}` : '';
    return `${location.displayName}${timeInfo}${sceneInfo}`;
  }
}