// Simple test script to verify script creation functionality
import { ScriptService } from './services/script';
import { AuthService } from './services/auth';

async function testScriptCreation() {
  console.log('🧪 Testing Script Creation Service...\n');

  // Setup: Create a test user
  console.log('Setup: Creating test user...');
  try {
    const testUser = await AuthService.signup('testwriter@example.com', 'password123', 'Test Writer');
    console.log('✅ Test user created:', testUser);
  } catch (error) {
    // User might already exist, try to get existing user
    const existingUsers = (AuthService as any).getStoredUsers();
    const testUser = existingUsers.find((u: any) => u.email === 'testwriter@example.com');
    if (testUser) {
      localStorage.setItem('scriptease_user', JSON.stringify(testUser));
      localStorage.setItem('scriptease_token', `token_${Date.now()}`);
      console.log('✅ Using existing test user:', testUser);
    } else {
      console.error('❌ Failed to setup test user:', error);
      return;
    }
  }

  const currentUser = AuthService.getCurrentUser();
  if (!currentUser) {
    console.error('❌ No current user found');
    return;
  }

  // Test 1: Create a valid script
  console.log('\nTest 1: Creating a valid script...');
  try {
    const script1 = await ScriptService.createScript(currentUser.id, {
      title: 'The Coffee Shop Mystery',
      description: 'A detective solves crimes in a local coffee shop using overheard conversations.'
    });
    console.log('✅ Script created successfully:', script1);
  } catch (error) {
    console.error('❌ Script creation failed:', error);
  }

  // Test 2: Create script with empty title (should fail)
  console.log('\nTest 2: Creating script with empty title (should fail)...');
  try {
    await ScriptService.createScript(currentUser.id, {
      title: '',
      description: 'This should fail'
    });
    console.error('❌ Should have failed with empty title');
  } catch (error) {
    console.log('✅ Correctly rejected empty title:', (error as Error).message);
  }

  // Test 3: Create script with long title (should fail)
  console.log('\nTest 3: Creating script with long title (should fail)...');
  try {
    await ScriptService.createScript(currentUser.id, {
      title: 'This is a very long title that exceeds the maximum allowed length of 100 characters and should be rejected',
      description: 'Testing title length validation'
    });
    console.error('❌ Should have failed with long title');
  } catch (error) {
    console.log('✅ Correctly rejected long title:', (error as Error).message);
  }

  // Test 4: Create multiple scripts
  console.log('\nTest 4: Creating multiple scripts...');
  try {
    const script2 = await ScriptService.createScript(currentUser.id, {
      title: 'Midnight Express',
      description: 'A thriller about a late-night train journey.'
    });
    console.log('✅ Second script created:', script2);

    const script3 = await ScriptService.createScript(currentUser.id, {
      title: 'The Last Dance',
      description: ''
    });
    console.log('✅ Third script created (no description):', script3);
  } catch (error) {
    console.error('❌ Multiple script creation failed:', error);
  }

  // Test 5: Get user scripts
  console.log('\nTest 5: Retrieving user scripts...');
  const userScripts = ScriptService.getUserScripts(currentUser.id);
  console.log(`✅ Found ${userScripts.length} scripts for user:`, userScripts);

  // Test 6: Test time formatting
  console.log('\nTest 6: Testing time formatting...');
  if (userScripts.length > 0) {
    const timeAgo = ScriptService.formatTimeAgo(userScripts[0].createdAt);
    console.log('✅ Time formatting works:', timeAgo);
  }

  console.log('\n🎉 All script creation tests completed!');
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  testScriptCreation();
}

export { testScriptCreation };