/**
 * Test Script Editor Functionality
 * 
 * This file contains tests to verify the script editor implementation
 * including navigation, auto-save, and content persistence.
 */

import { ScriptService, type Script } from './services/script';

// Test data
const testUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User'
};

const testScript: Script = {
  id: 'test-script-123',
  userId: testUser.id,
  title: 'Test Script',
  description: 'A test script for editor functionality',
  content: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  pageCount: 1
};

/**
 * Test 1: Script Creation and Retrieval
 */
function testScriptCreation(): boolean {
  console.log('🧪 Testing script creation and retrieval...');
  
  try {
    // Clear existing data
    localStorage.removeItem('scriptease_scripts');
    
    // Create a test script
    const scripts = ScriptService.getUserScripts(testUser.id);
    console.log('Initial scripts:', scripts.length);
    
    // Manually add test script to localStorage
    localStorage.setItem('scriptease_scripts', JSON.stringify([testScript]));
    
    // Retrieve the script
    const retrievedScript = ScriptService.getScript(testScript.id, testUser.id);
    
    if (!retrievedScript) {
      console.error('❌ Failed to retrieve script');
      return false;
    }
    
    if (retrievedScript.id !== testScript.id) {
      console.error('❌ Retrieved script ID mismatch');
      return false;
    }
    
    console.log('✅ Script creation and retrieval test passed');
    return true;
  } catch (error) {
    console.error('❌ Script creation test failed:', error);
    return false;
  }
}

/**
 * Test 2: Script Content Update
 */
async function testScriptUpdate(): Promise<boolean> {
  console.log('🧪 Testing script content update...');
  
  try {
    const newContent = `FADE IN:

INT. COFFEE SHOP - DAY

A cozy coffee shop buzzes with morning activity.

ANNA
This is a test of the auto-save functionality.

FADE OUT.`;

    // Update script content
    const updatedScript = await ScriptService.updateScript(
      testScript.id, 
      testUser.id, 
      { content: newContent }
    );
    
    if (updatedScript.content !== newContent) {
      console.error('❌ Script content update failed');
      return false;
    }
    
    // Verify persistence
    const retrievedScript = ScriptService.getScript(testScript.id, testUser.id);
    if (!retrievedScript || retrievedScript.content !== newContent) {
      console.error('❌ Script content persistence failed');
      return false;
    }
    
    console.log('✅ Script content update test passed');
    return true;
  } catch (error) {
    console.error('❌ Script update test failed:', error);
    return false;
  }
}

/**
 * Test 3: Auto-save Simulation
 */
function testAutoSaveSimulation(): Promise<boolean> {
  console.log('🧪 Testing auto-save simulation...');
  
  return new Promise((resolve) => {
    let saveCount = 0;
    const testContent = 'This is test content for auto-save ';
    
    // Simulate typing and auto-save
    const simulateTyping = async () => {
      try {
        for (let i = 1; i <= 3; i++) {
          const content = testContent + i.toString();
          
          // Update script content (simulating auto-save)
          await ScriptService.updateScript(testScript.id, testUser.id, { content });
          saveCount++;
          
          console.log(`💾 Auto-save ${saveCount}: Content length ${content.length}`);
          
          // Wait 1 second between saves (simulating typing pauses)
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Verify final content
        const finalScript = ScriptService.getScript(testScript.id, testUser.id);
        if (finalScript && finalScript.content === testContent + '3') {
          console.log('✅ Auto-save simulation test passed');
          resolve(true);
        } else {
          console.error('❌ Auto-save simulation failed - content mismatch');
          resolve(false);
        }
      } catch (error) {
        console.error('❌ Auto-save simulation failed:', error);
        resolve(false);
      }
    };
    
    simulateTyping();
  });
}

/**
 * Test 4: Page Count Calculation
 */
async function testPageCountCalculation(): Promise<boolean> {
  console.log('🧪 Testing page count calculation...');
  
  try {
    // Test with different content lengths
    const testCases = [
      { content: 'Short content', expectedPages: 1 },
      { content: 'A'.repeat(250), expectedPages: 1 },
      { content: 'A'.repeat(500), expectedPages: 2 },
      { content: 'A'.repeat(1000), expectedPages: 4 }
    ];
    
    for (const testCase of testCases) {
      const updatedScript = await ScriptService.updateScript(
        testScript.id,
        testUser.id,
        { content: testCase.content }
      );
      
      if (updatedScript.pageCount !== testCase.expectedPages) {
        console.error(`❌ Page count mismatch for content length ${testCase.content.length}: expected ${testCase.expectedPages}, got ${updatedScript.pageCount}`);
        return false;
      }
    }
    
    console.log('✅ Page count calculation test passed');
    return true;
  } catch (error) {
    console.error('❌ Page count calculation test failed:', error);
    return false;
  }
}

/**
 * Test 5: Error Handling
 */
async function testErrorHandling(): Promise<boolean> {
  console.log('🧪 Testing error handling...');
  
  try {
    // Test with non-existent script
    const nonExistentScript = ScriptService.getScript('non-existent', testUser.id);
    if (nonExistentScript !== null) {
      console.error('❌ Should return null for non-existent script');
      return false;
    }
    
    // Test update with non-existent script
    try {
      await ScriptService.updateScript('non-existent', testUser.id, { content: 'test' });
      console.error('❌ Should throw error for non-existent script update');
      return false;
    } catch (error) {
      // Expected error
      console.log('✅ Correctly threw error for non-existent script update');
    }
    
    console.log('✅ Error handling test passed');
    return true;
  } catch (error) {
    console.error('❌ Error handling test failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
export async function runScriptEditorTests(): Promise<void> {
  console.log('🚀 Starting Script Editor Tests...\n');
  
  const tests = [
    { name: 'Script Creation', test: testScriptCreation },
    { name: 'Script Update', test: testScriptUpdate },
    { name: 'Auto-save Simulation', test: testAutoSaveSimulation },
    { name: 'Page Count Calculation', test: testPageCountCalculation },
    { name: 'Error Handling', test: testErrorHandling }
  ];
  
  let passedTests = 0;
  
  for (const { name, test } of tests) {
    console.log(`\n📋 Running ${name} test...`);
    const result = await test();
    if (result) {
      passedTests++;
    }
    console.log('─'.repeat(50));
  }
  
  console.log(`\n📊 Test Results: ${passedTests}/${tests.length} tests passed`);
  
  if (passedTests === tests.length) {
    console.log('🎉 All tests passed! Script editor functionality is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
  
  // Clean up test data
  localStorage.removeItem('scriptease_scripts');
  console.log('🧹 Test cleanup completed');
}

// Auto-run tests if this file is imported
if (typeof window !== 'undefined') {
  // Browser environment - add to window for manual testing
  (window as any).runScriptEditorTests = runScriptEditorTests;
  console.log('Script editor tests loaded. Run runScriptEditorTests() in console to execute.');
}