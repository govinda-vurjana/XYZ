export interface Script {
  id: string;
  userId: string;
  title: string;
  description: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  pageCount: number;
  currentDraftId?: string;
}

export interface Draft {
  id: string;
  scriptId: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  pageCount: number;
}

export interface CreateScriptRequest {
  title: string;
  description: string;
}

export class ScriptService {
  private static readonly SCRIPTS_KEY = 'scriptease_scripts';
  private static readonly DRAFTS_KEY = 'scriptease_drafts';

  static async createScript(userId: string, request: CreateScriptRequest): Promise<Script> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Validate input
    if (!request.title.trim()) {
      throw new Error('Script title is required');
    }
    if (request.title.trim().length > 100) {
      throw new Error('Script title must be 100 characters or less');
    }
    if (request.description.length > 500) {
      throw new Error('Script description must be 500 characters or less');
    }

    // Create new script
    const script: Script = {
      id: `script_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      userId: userId,
      title: request.title.trim(),
      description: request.description.trim(),
      content: '', // Empty content for new script
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pageCount: 0
    };

    // Get existing scripts
    const existingScripts = this.getStoredScripts();
    
    // Add new script
    existingScripts.push(script);
    
    // Store updated scripts
    localStorage.setItem(this.SCRIPTS_KEY, JSON.stringify(existingScripts));

    return script;
  }

  static getUserScripts(userId: string): Script[] {
    const allScripts = this.getStoredScripts();
    return allScripts
      .filter(script => script.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  static getScript(scriptId: string, userId: string): Script | null {
    const allScripts = this.getStoredScripts();
    const script = allScripts.find(s => s.id === scriptId && s.userId === userId);
    return script || null;
  }

  static async updateScript(scriptId: string, userId: string, updates: Partial<Script>): Promise<Script> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const allScripts = this.getStoredScripts();
    const scriptIndex = allScripts.findIndex(s => s.id === scriptId && s.userId === userId);

    if (scriptIndex === -1) {
      throw new Error('Script not found');
    }

    // Update script
    const updatedScript = {
      ...allScripts[scriptIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    allScripts[scriptIndex] = updatedScript;
    localStorage.setItem(this.SCRIPTS_KEY, JSON.stringify(allScripts));

    return updatedScript;
  }

  static async deleteScript(scriptId: string, userId: string): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const allScripts = this.getStoredScripts();
    const filteredScripts = allScripts.filter(s => !(s.id === scriptId && s.userId === userId));

    if (filteredScripts.length === allScripts.length) {
      throw new Error('Script not found');
    }

    localStorage.setItem(this.SCRIPTS_KEY, JSON.stringify(filteredScripts));
  }

  private static getStoredScripts(): Script[] {
    const scriptsStr = localStorage.getItem(this.SCRIPTS_KEY);
    if (!scriptsStr) return [];
    try {
      return JSON.parse(scriptsStr);
    } catch {
      return [];
    }
  }

  // Draft Management Methods
  static async createDraft(scriptId: string, userId: string, name: string, content: string): Promise<Draft> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validate script exists and belongs to user
    const script = this.getScript(scriptId, userId);
    if (!script) {
      throw new Error('Script not found');
    }

    // Validate draft name
    if (!name.trim()) {
      throw new Error('Draft name is required');
    }
    if (name.trim().length > 50) {
      throw new Error('Draft name must be 50 characters or less');
    }

    // Check if draft name already exists for this script
    const existingDrafts = this.getScriptDrafts(scriptId);
    if (existingDrafts.some(draft => draft.name.toLowerCase() === name.trim().toLowerCase())) {
      throw new Error('A draft with this name already exists');
    }

    // Create new draft
    const draft: Draft = {
      id: `draft_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      scriptId: scriptId,
      name: name.trim(),
      content: content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pageCount: Math.max(1, Math.ceil(content.length / 250))
    };

    // Get existing drafts
    const allDrafts = this.getStoredDrafts();
    
    // Add new draft
    allDrafts.push(draft);
    
    // Store updated drafts
    localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(allDrafts));

    return draft;
  }

  static getScriptDrafts(scriptId: string): Draft[] {
    const allDrafts = this.getStoredDrafts();
    return allDrafts
      .filter(draft => draft.scriptId === scriptId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  static getDraft(draftId: string): Draft | null {
    const allDrafts = this.getStoredDrafts();
    return allDrafts.find(draft => draft.id === draftId) || null;
  }

  static async updateDraft(draftId: string, updates: Partial<Draft>): Promise<Draft> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const allDrafts = this.getStoredDrafts();
    const draftIndex = allDrafts.findIndex(draft => draft.id === draftId);

    if (draftIndex === -1) {
      throw new Error('Draft not found');
    }

    // Update draft
    const updatedDraft = {
      ...allDrafts[draftIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    allDrafts[draftIndex] = updatedDraft;
    localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(allDrafts));

    return updatedDraft;
  }

  static async deleteDraft(draftId: string): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const allDrafts = this.getStoredDrafts();
    const filteredDrafts = allDrafts.filter(draft => draft.id !== draftId);

    if (filteredDrafts.length === allDrafts.length) {
      throw new Error('Draft not found');
    }

    localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(filteredDrafts));
  }

  static async setCurrentDraft(scriptId: string, userId: string, draftId: string | null): Promise<Script> {
    // Validate script exists and belongs to user
    const script = this.getScript(scriptId, userId);
    if (!script) {
      throw new Error('Script not found');
    }

    // If draftId is provided, validate it exists and belongs to this script
    if (draftId) {
      const draft = this.getDraft(draftId);
      if (!draft || draft.scriptId !== scriptId) {
        throw new Error('Draft not found');
      }
    }

    // Update script's current draft
    return this.updateScript(scriptId, userId, { currentDraftId: draftId || undefined });
  }

  static getCurrentContent(script: Script): string {
    if (script.currentDraftId) {
      const draft = this.getDraft(script.currentDraftId);
      return draft ? draft.content : script.content;
    }
    return script.content;
  }

  static getCurrentPageCount(script: Script): number {
    if (script.currentDraftId) {
      const draft = this.getDraft(script.currentDraftId);
      return draft ? draft.pageCount : script.pageCount;
    }
    return script.pageCount;
  }

  private static getStoredDrafts(): Draft[] {
    const draftsStr = localStorage.getItem(this.DRAFTS_KEY);
    if (!draftsStr) return [];
    try {
      return JSON.parse(draftsStr);
    } catch {
      return [];
    }
  }

  static formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}