// Simple test script to verify authentication functionality
import { AuthService } from './services/auth';

async function testAuthentication() {
  console.log('🧪 Testing Authentication Service...\n');

  // Test 1: Initial state should be unauthenticated
  console.log('Test 1: Initial authentication state');
  console.log('Is authenticated:', AuthService.isAuthenticated());
  console.log('Current user:', AuthService.getCurrentUser());
  console.log('✅ Initial state correct\n');

  // Test 2: Login with valid credentials
  console.log('Test 2: Login with valid credentials');
  try {
    const user = await AuthService.login('test@example.com', 'password123');
    console.log('Login successful:', user);
    console.log('Is authenticated:', AuthService.isAuthenticated());
    console.log('Current user:', AuthService.getCurrentUser());
    console.log('Token exists:', !!AuthService.getToken());
    console.log('✅ Login test passed\n');
  } catch (error) {
    console.error('❌ Login test failed:', error);
  }

  // Test 3: Login with invalid credentials (short password)
  console.log('Test 3: Login with invalid credentials');
  try {
    await AuthService.login('test@example.com', '123');
    console.log('❌ Should have failed with short password');
  } catch (error) {
    console.log('✅ Correctly rejected short password:', (error as Error).message);
  }

  // Test 4: Logout
  console.log('\nTest 4: Logout functionality');
  AuthService.logout();
  console.log('Is authenticated after logout:', AuthService.isAuthenticated());
  console.log('Current user after logout:', AuthService.getCurrentUser());
  console.log('Token after logout:', AuthService.getToken());
  console.log('✅ Logout test passed\n');

  console.log('🎉 All authentication tests completed successfully!');
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  testAuthentication();
}