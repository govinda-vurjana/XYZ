export interface Scene {
  id: string;
  heading: string;
  startPosition: number;
  endPosition: number;
  lineNumber: number;
  content: string;
  estimatedDuration?: number;
}

export class SceneDetectionService {
  /**
   * Detects scenes from script content based on scene headings
   * Scene headings typically start with INT., EXT., FADE IN, FADE OUT
   */
  static detectScenes(content: string): Scene[] {
    const lines = content.split('\n');
    const scenes: Scene[] = [];
    let currentSceneStart = 0;
    let currentSceneHeading = '';
    let currentSceneId = '';
    let currentSceneLineNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line is a scene heading
      if (this.isSceneHeading(line)) {
        // If we have a previous scene, finalize it
        if (currentSceneHeading) {
          const sceneEndPosition = this.getPositionFromLineIndex(content, i - 1);
          const sceneContent = this.extractSceneContent(content, currentSceneStart, sceneEndPosition);
          
          scenes.push({
            id: currentSceneId,
            heading: currentSceneHeading,
            startPosition: currentSceneStart,
            endPosition: sceneEndPosition,
            lineNumber: currentSceneLineNumber,
            content: sceneContent,
            estimatedDuration: this.estimateSceneDuration(sceneContent)
          });
        }

        // Start new scene
        currentSceneHeading = line;
        currentSceneId = `scene_${scenes.length + 1}_${Date.now()}`;
        currentSceneStart = this.getPositionFromLineIndex(content, i);
        currentSceneLineNumber = i + 1;
      }
    }

    // Handle the last scene
    if (currentSceneHeading) {
      const sceneContent = this.extractSceneContent(content, currentSceneStart, content.length);
      scenes.push({
        id: currentSceneId,
        heading: currentSceneHeading,
        startPosition: currentSceneStart,
        endPosition: content.length,
        lineNumber: currentSceneLineNumber,
        content: sceneContent,
        estimatedDuration: this.estimateSceneDuration(sceneContent)
      });
    }

    // If no scenes detected but content exists, create a default scene
    if (scenes.length === 0 && content.trim()) {
      scenes.push({
        id: 'scene_default_1',
        heading: 'Scene 1',
        startPosition: 0,
        endPosition: content.length,
        lineNumber: 1,
        content: content,
        estimatedDuration: this.estimateSceneDuration(content)
      });
    }

    return scenes;
  }

  /**
   * Checks if a line is a scene heading
   */
  private static isSceneHeading(line: string): boolean {
    if (!line.trim()) return false;
    
    const upperLine = line.toUpperCase().trim();
    
    // Common scene heading patterns
    const sceneHeadingPatterns = [
      /^(INT\.|EXT\.)/,           // Interior/Exterior
      /^FADE IN/,                 // Fade in
      /^FADE OUT/,                // Fade out
      /^FADE TO/,                 // Fade to
      /^CUT TO/,                  // Cut to
      /^DISSOLVE TO/,             // Dissolve to
      /^SMASH CUT TO/,            // Smash cut to
      /^MATCH CUT TO/,            // Match cut to
      /^JUMP CUT TO/,             // Jump cut to
      /^SCENE \d+/,               // Scene 1, Scene 2, etc.
      /^ACT \d+/,                 // Act 1, Act 2, etc.
      /^CHAPTER \d+/,             // Chapter 1, Chapter 2, etc.
      /^PART \d+/,                // Part 1, Part 2, etc.
      /^TITLE SEQUENCE/,          // Title sequence
      /^OPENING CREDITS/,         // Opening credits
      /^END CREDITS/,             // End credits
      /^MONTAGE/,                 // Montage
      /^SERIES OF SHOTS/,         // Series of shots
      /^INTERCUT/,                // Intercut
      /^FLASHBACK/,               // Flashback
      /^DREAM SEQUENCE/,          // Dream sequence
      /^FANTASY SEQUENCE/,        // Fantasy sequence
      /^NIGHTMARE SEQUENCE/       // Nightmare sequence
    ];

    return sceneHeadingPatterns.some(pattern => pattern.test(upperLine));
  }

  /**
   * Gets the character position from line index
   */
  private static getPositionFromLineIndex(content: string, lineIndex: number): number {
    const lines = content.split('\n');
    let position = 0;
    
    for (let i = 0; i < Math.min(lineIndex, lines.length); i++) {
      position += lines[i].length + 1; // +1 for newline character
    }
    
    return Math.max(0, position);
  }

  /**
   * Extracts scene content between start and end positions
   */
  private static extractSceneContent(content: string, startPosition: number, endPosition: number): string {
    return content.substring(startPosition, endPosition).trim();
  }

  /**
   * Estimates scene duration based on content length and type
   * Rough estimation: 1 page ≈ 1 minute, 250 words ≈ 1 page
   */
  private static estimateSceneDuration(content: string): number {
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const estimatedPages = Math.max(0.1, wordCount / 250);
    return Math.round(estimatedPages * 60); // Convert to seconds
  }

  /**
   * Finds the scene that contains a given cursor position
   */
  static findSceneAtPosition(scenes: Scene[], position: number): Scene | null {
    return scenes.find(scene => 
      position >= scene.startPosition && position <= scene.endPosition
    ) || null;
  }

  /**
   * Gets a formatted scene title for display
   */
  static getSceneDisplayTitle(scene: Scene, index: number): string {
    if (scene.heading && scene.heading !== `Scene ${index + 1}`) {
      return scene.heading;
    }
    return `Scene ${index + 1}`;
  }

  /**
   * Gets a brief description of the scene content
   */
  static getSceneDescription(scene: Scene): string {
    const lines = scene.content.split('\n').filter(line => line.trim());
    
    // Find the first action line (not scene heading, character name, or dialogue)
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && 
          !this.isSceneHeading(trimmed) && 
          !this.isCharacterName(trimmed) && 
          !this.isDialogue(trimmed) &&
          !this.isParenthetical(trimmed)) {
        return trimmed.length > 60 ? trimmed.substring(0, 60) + '...' : trimmed;
      }
    }

    // If no action line found, return first non-empty line
    const firstLine = lines.find(line => line.trim());
    if (firstLine) {
      const trimmed = firstLine.trim();
      return trimmed.length > 60 ? trimmed.substring(0, 60) + '...' : trimmed;
    }

    return 'Empty scene';
  }

  /**
   * Checks if a line is a character name
   */
  private static isCharacterName(line: string): boolean {
    const trimmed = line.trim();
    return /^[A-Z][A-Z\s]+(\(.*\))?$/.test(trimmed) && 
           trimmed.length < 50 && 
           !trimmed.includes('.');
  }

  /**
   * Checks if a line is dialogue
   */
  private static isDialogue(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.length > 0 && 
           !this.isSceneHeading(trimmed) && 
           !this.isCharacterName(trimmed) && 
           !this.isParenthetical(trimmed) &&
           /^[a-z]/.test(trimmed); // Starts with lowercase (typical for dialogue)
  }

  /**
   * Checks if a line is a parenthetical
   */
  private static isParenthetical(line: string): boolean {
    const trimmed = line.trim();
    return /^\(.*\)$/.test(trimmed);
  }

  /**
   * Formats duration for display
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }
}