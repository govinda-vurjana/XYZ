export interface VoiceSettings {
  language: string;
  sensitivity: number;
  customCommands: Record<string, string>;
  microphoneDeviceId?: string;
  noiseReduction: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  preferences?: {
    theme: 'light' | 'dark';
    fontSize: number;
    autoSaveInterval: number;
    voiceSettings: VoiceSettings;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export class AuthService {
  private static readonly USER_KEY = 'scriptease_user';
  private static readonly TOKEN_KEY = 'scriptease_token';

  static async login(email: string, password: string): Promise<User> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock authentication - accept any email with password 6+ characters
    if (password.length < 6) {
      throw new Error('Invalid credentials');
    }

    // Check if user exists in localStorage (for demo purposes)
    const existingUsers = this.getStoredUsers();
    const existingUser = existingUsers.find(u => u.email === email);

    if (!existingUser) {
      throw new Error('User not found. Please sign up first.');
    }

    // Create mock JWT-like token with expiration
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    const token = this.generateMockJWT(existingUser.id, expiresAt);

    // Store user and token in localStorage
    localStorage.setItem(this.USER_KEY, JSON.stringify(existingUser));
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem('scriptease_token_expires', expiresAt);

    return existingUser;
  }

  static async signup(email: string, password: string, name: string): Promise<User> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Validate input
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    if (name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    // Check if user already exists
    const existingUsers = this.getStoredUsers();
    if (existingUsers.some(u => u.email === email)) {
      throw new Error('User already exists with this email');
    }

    // Create new user with default preferences
    const user: User = {
      id: `user_${Date.now()}`,
      email: email,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      preferences: {
        theme: 'dark',
        fontSize: 16,
        autoSaveInterval: 30
      }
    };

    // Store user in the users list
    existingUsers.push(user);
    localStorage.setItem('scriptease_users', JSON.stringify(existingUsers));

    // Create mock JWT-like token with expiration
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    const token = this.generateMockJWT(user.id, expiresAt);

    // Store current user and token
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem('scriptease_token_expires', expiresAt);

    return user;
  }

  private static getStoredUsers(): User[] {
    const usersStr = localStorage.getItem('scriptease_users');
    if (!usersStr) return [];
    try {
      return JSON.parse(usersStr);
    } catch {
      return [];
    }
  }

  static logout(): void {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('scriptease_token_expires');
  }

  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    const token = localStorage.getItem(this.TOKEN_KEY);
    const expiresAt = localStorage.getItem('scriptease_token_expires');

    if (!user || !token || !expiresAt) {
      return false;
    }

    // Check if token is expired
    const now = new Date();
    const expiry = new Date(expiresAt);

    if (now >= expiry) {
      this.logout(); // Auto-logout if token expired
      return false;
    }

    return true;
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private static generateMockJWT(userId: string, expiresAt: string): string {
    // Mock JWT structure: header.payload.signature (base64 encoded)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: userId,
      exp: Math.floor(new Date(expiresAt).getTime() / 1000),
      iat: Math.floor(Date.now() / 1000),
      iss: 'scriptease'
    }));
    const signature = btoa(`mock_signature_${userId}_${Date.now()}`);

    return `${header}.${payload}.${signature}`;
  }

  static getTokenExpiry(): Date | null {
    const expiresAt = localStorage.getItem('scriptease_token_expires');
    return expiresAt ? new Date(expiresAt) : null;
  }

  static refreshToken(): boolean {
    // In a real app, this would call the backend to refresh the token
    const user = this.getCurrentUser();
    if (!user) return false;

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const token = this.generateMockJWT(user.id, expiresAt);

    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem('scriptease_token_expires', expiresAt);

    return true;
  }

  static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    // Check if user exists
    const existingUsers = this.getStoredUsers();
    const user = existingUsers.find(u => u.email === email);
    
    if (!user) {
      // For security, don't reveal if email exists or not
      return {
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link shortly.'
      };
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = this.generateResetToken(user.id);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    
    // Store reset token
    const resetTokens = this.getStoredResetTokens();
    resetTokens[resetToken] = {
      userId: user.id,
      email: user.email,
      expiresAt: expiresAt,
      used: false
    };
    localStorage.setItem('scriptease_reset_tokens', JSON.stringify(resetTokens));

    // In a real app, this would send an email
    console.log(`Password reset email sent to ${email}`);
    console.log(`Reset link: ${window.location.origin}/reset-password?token=${resetToken}`);

    return {
      success: true,
      message: 'If an account with this email exists, you will receive a password reset link shortly.'
    };
  }

  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate password
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if token exists and is valid
    const resetTokens = this.getStoredResetTokens();
    const tokenData = resetTokens[token];

    if (!tokenData) {
      throw new Error('Invalid or expired reset token');
    }

    if (tokenData.used) {
      throw new Error('This reset link has already been used');
    }

    if (new Date() > new Date(tokenData.expiresAt)) {
      throw new Error('This reset link has expired');
    }

    // Update user password (in real app, this would hash the password)
    const existingUsers = this.getStoredUsers();
    const userIndex = existingUsers.findIndex(u => u.id === tokenData.userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Mark token as used
    tokenData.used = true;
    localStorage.setItem('scriptease_reset_tokens', JSON.stringify(resetTokens));

    // In a real app, we would update the password hash in the database
    // For demo purposes, we'll just log it
    console.log(`Password updated for user ${tokenData.email}`);

    return {
      success: true,
      message: 'Your password has been successfully reset. You can now log in with your new password.'
    };
  }

  static validateResetToken(token: string): { valid: boolean; email?: string; error?: string } {
    const resetTokens = this.getStoredResetTokens();
    const tokenData = resetTokens[token];

    if (!tokenData) {
      return { valid: false, error: 'Invalid reset token' };
    }

    if (tokenData.used) {
      return { valid: false, error: 'This reset link has already been used' };
    }

    if (new Date() > new Date(tokenData.expiresAt)) {
      return { valid: false, error: 'This reset link has expired' };
    }

    return { valid: true, email: tokenData.email };
  }

  private static generateResetToken(userId: string): string {
    return `reset_${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private static getStoredResetTokens(): Record<string, any> {
    const tokensStr = localStorage.getItem('scriptease_reset_tokens');
    if (!tokensStr) return {};
    try {
      return JSON.parse(tokensStr);
    } catch {
      return {};
    }
  }
}