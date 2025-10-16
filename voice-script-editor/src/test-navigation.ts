/**
 * Navigation Test Script
 * Tests the complete login -> dashboard -> logout -> login flow
 */

import { AuthService } from './services/auth';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

class NavigationTester {
  private results: TestResult[] = [];

  private addResult(testName: string, passed: boolean, message: string, details?: any) {
    this.results.push({ testName, passed, message, details });
    console.log(`${passed ? '✅' : '❌'} ${testName}: ${message}`);
    if (details) {
      console.log('   Details:', details);
    }
  }

  async testCompleteNavigationFlow(): Promise<void> {
    console.log('🧪 Starting Navigation Flow Test...\n');

    // Clear any existing data
    this.clearAllData();

    try {
      // Test 1: Initial state should be unauthenticated
      await this.testInitialState();

      // Test 2: Signup flow
      await this.testSignupFlow();

      // Test 3: Dashboard access after signup
      await this.testDashboardAccess();

      // Test 4: Logout functionality
      await this.testLogoutFlow();

      // Test 5: Login flow after logout
      await this.testLoginFlow();

      // Test 6: Dashboard access after login
      await this.testDashboardAccessAfterLogin();

      // Test 7: Logout again
      await this.testSecondLogout();

    } catch (error) {
      this.addResult('Navigation Flow', false, `Unexpected error: ${error instanceof Error ? error.message : String(error)}`, error);
    }

    this.printSummary();
  }

  private async testInitialState(): Promise<void> {
    const isAuth = AuthService.isAuthenticated();
    const user = AuthService.getCurrentUser();
    
    this.addResult(
      'Initial State',
      !isAuth && !user,
      !isAuth && !user ? 'User is not authenticated initially' : 'User should not be authenticated initially',
      { isAuthenticated: isAuth, user }
    );
  }

  private async testSignupFlow(): Promise<void> {
    try {
      const testUser = await AuthService.signup('test@example.com', 'password123', 'Test User');
      const isAuth = AuthService.isAuthenticated();
      const storedUser = AuthService.getCurrentUser();
      
      const passed = !!(testUser && isAuth && storedUser && storedUser.email === 'test@example.com');
      
      this.addResult(
        'Signup Flow',
        passed,
        passed ? 'User successfully signed up and authenticated' : 'Signup failed or user not authenticated',
        { testUser, isAuthenticated: isAuth, storedUser }
      );
    } catch (error) {
      this.addResult('Signup Flow', false, `Signup failed: ${error instanceof Error ? error.message : String(error)}`, error);
    }
  }

  private async testDashboardAccess(): Promise<void> {
    const user = AuthService.getCurrentUser();
    const isAuth = AuthService.isAuthenticated();
    
    // Simulate dashboard access logic from App.tsx
    const canAccessDashboard = !!(user && isAuth);
    
    this.addResult(
      'Dashboard Access After Signup',
      canAccessDashboard,
      canAccessDashboard ? 'User can access dashboard after signup' : 'User cannot access dashboard after signup',
      { user, isAuthenticated: isAuth }
    );
  }

  private async testLogoutFlow(): Promise<void> {
    // Store user info before logout
    const userBeforeLogout = AuthService.getCurrentUser();
    
    // Perform logout
    AuthService.logout();
    
    const userAfterLogout = AuthService.getCurrentUser();
    const isAuthAfterLogout = AuthService.isAuthenticated();
    const token = AuthService.getToken();
    
    const passed = !userAfterLogout && !isAuthAfterLogout && !token;
    
    this.addResult(
      'Logout Flow',
      passed,
      passed ? 'User successfully logged out and localStorage cleared' : 'Logout failed or localStorage not cleared',
      { 
        userBeforeLogout, 
        userAfterLogout, 
        isAuthAfterLogout, 
        tokenAfterLogout: token 
      }
    );
  }

  private async testLoginFlow(): Promise<void> {
    try {
      const loggedInUser = await AuthService.login('test@example.com', 'password123');
      const isAuth = AuthService.isAuthenticated();
      const storedUser = AuthService.getCurrentUser();
      
      const passed = !!(loggedInUser && isAuth && storedUser && storedUser.email === 'test@example.com');
      
      this.addResult(
        'Login Flow',
        passed,
        passed ? 'User successfully logged in' : 'Login failed or user not authenticated',
        { loggedInUser, isAuthenticated: isAuth, storedUser }
      );
    } catch (error) {
      this.addResult('Login Flow', false, `Login failed: ${error instanceof Error ? error.message : String(error)}`, error);
    }
  }

  private async testDashboardAccessAfterLogin(): Promise<void> {
    const user = AuthService.getCurrentUser();
    const isAuth = AuthService.isAuthenticated();
    
    // Simulate dashboard access logic from App.tsx
    const canAccessDashboard = !!(user && isAuth);
    
    this.addResult(
      'Dashboard Access After Login',
      canAccessDashboard,
      canAccessDashboard ? 'User can access dashboard after login' : 'User cannot access dashboard after login',
      { user, isAuthenticated: isAuth }
    );
  }

  private async testSecondLogout(): Promise<void> {
    // Perform second logout
    AuthService.logout();
    
    const userAfterLogout = AuthService.getCurrentUser();
    const isAuthAfterLogout = AuthService.isAuthenticated();
    const token = AuthService.getToken();
    
    const passed = !userAfterLogout && !isAuthAfterLogout && !token;
    
    this.addResult(
      'Second Logout Flow',
      passed,
      passed ? 'Second logout successful' : 'Second logout failed',
      { 
        userAfterLogout, 
        isAuthAfterLogout, 
        tokenAfterLogout: token 
      }
    );
  }

  private clearAllData(): void {
    // Clear all localStorage data
    localStorage.clear();
    console.log('🧹 Cleared all localStorage data\n');
  }

  private printSummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log('\n📊 Test Summary:');
    console.log(`   Passed: ${passed}/${total}`);
    console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
      console.log('🎉 All navigation tests passed!');
    } else {
      console.log('❌ Some tests failed. Check the details above.');
    }
  }
}

// Export for use in browser console or other test runners
export { NavigationTester };

// Auto-run if this file is executed directly
if (typeof window !== 'undefined') {
  const tester = new NavigationTester();
  tester.testCompleteNavigationFlow();
}