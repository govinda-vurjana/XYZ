// Simple test for element detection
const testScript = `FADE IN:

INT. COFFEE SHOP - DAY

ANNA sits at a table.

ANNA
Hello there.

MARK approaches.

MARK
Hi Anna.

EXT. PARK - LATER

They walk together.

ANNA
This is nice.`;

const lines = testScript.split('\n');
const characters = new Set();
const locations = new Set();

lines.forEach(line => {
  const trimmed = line.trim();
  
  // Check for scene headings
  if (trimmed.match(/^(INT\.|EXT\.)/)) {
    const match = trimmed.match(/^(INT\.|EXT\.)\s+(.+?)(\s+-\s+(.+))?$/);
    if (match) {
      locations.add(match[2].trim());
    }
  }
  
  // Check for character names (ALL CAPS, not scene headings)
  if (trimmed === trimmed.toUpperCase() && 
      trimmed.length > 1 && 
      trimmed.length < 50 && 
      !trimmed.includes('.') &&
      !trimmed.match(/^(INT\.|EXT\.|FADE)/)) {
    characters.add(trimmed);
  }
});

console.log('Characters detected:', Array.from(characters));
console.log('Locations detected:', Array.from(locations));
console.log('Test passed:', characters.has('ANNA') && characters.has('MARK') && locations.has('COFFEE SHOP') && locations.has('PARK'));