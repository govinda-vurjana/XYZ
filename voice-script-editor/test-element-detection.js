// Simple test for element detection functionality
import { ElementDetectionService } from './src/utils/elementDetection.ts';

const testScript = `FADE IN:

INT. COFFEE SHOP - DAY

A cozy coffee shop buzzes with morning activity. ANNA (25), a determined writer, sits at a corner table with her laptop.

ANNA
(typing furiously)
This is it. This is the scene that changes everything.

MARK (30s) approaches her table, carrying two cups of coffee.

MARK
Mind if I sit? You look like you could use some company.

ANNA
(looking up, surprised)
Oh! I... sure, I guess.

Mark sits down and slides one coffee toward her.

MARK
I'm Mark. I've seen you here every day for the past week.

ANNA
Anna. And yes, I'm working on something important.

EXT. COFFEE SHOP - LATER

Anna and Mark walk out together, continuing their conversation.

MARK
So what's this important project?

ANNA
A screenplay. About a writer who meets someone in a coffee shop.

They both laugh.

INT. ANNA'S APARTMENT - NIGHT

Anna sits at her desk, typing. Her phone buzzes with a text from Mark.

ANNA
(reading aloud)
Thanks for the coffee and conversation. Same time tomorrow?

She smiles and types back.

ANNA (CONT'D)
(typing)
Wouldn't miss it.

FADE OUT.`;

console.log('Testing Element Detection...');

const elements = ElementDetectionService.extractElements(testScript);

console.log('\n=== CHARACTERS DETECTED ===');
elements.characters.forEach((character, index) => {
  console.log(`${index + 1}. ${character.displayName}`);
  console.log(`   - Dialogue lines: ${character.dialogueCount}`);
  console.log(`   - Scenes: ${character.scenes.length}`);
  console.log(`   - First appearance: position ${character.firstAppearance}`);
});

console.log('\n=== LOCATIONS DETECTED ===');
elements.locations.forEach((location, index) => {
  console.log(`${index + 1}. ${location.displayName} (${location.type})`);
  console.log(`   - Scene count: ${location.sceneCount}`);
  console.log(`   - Time of day: ${location.timeOfDay || 'Not specified'}`);
  console.log(`   - First appearance: position ${location.firstAppearance}`);
});

console.log('\n=== SUMMARY ===');
console.log(`Total characters: ${elements.characters.length}`);
console.log(`Total locations: ${elements.locations.length}`);

// Test expected results
const expectedCharacters = ['ANNA', 'MARK'];
const expectedLocations = ['COFFEE SHOP', 'ANNA\'S APARTMENT'];

console.log('\n=== VALIDATION ===');
const detectedCharacterNames = elements.characters.map(c => c.name);
const detectedLocationNames = elements.locations.map(l => l.name);

console.log('Expected characters:', expectedCharacters);
console.log('Detected characters:', detectedCharacterNames);
console.log('Characters match:', expectedCharacters.every(name => detectedCharacterNames.includes(name)));

console.log('Expected locations:', expectedLocations);
console.log('Detected locations:', detectedLocationNames);
console.log('Locations match:', expectedLocations.every(name => detectedLocationNames.includes(name)));

export { elements };