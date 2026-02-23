#!/usr/bin/env node

/**
 * Migration Tool: localStorage → Database
 * 
 * This script helps migrate CMC entries from browser localStorage to the central database.
 * Run this once to transfer existing CMCs.
 */

import { readFileSync } from 'fs';
import { statements } from './database.js';

console.log('╔════════════════════════════════════════╗');
console.log('║  CMC Migration: localStorage → DB     ║');
console.log('╚════════════════════════════════════════╝\n');

// This would typically be extracted from a browser export
// For now, provide instructions for manual migration

console.log('Migration Options:\n');

console.log('Option 1: Manual Migration via API');
console.log('─────────────────────────────────────');
console.log('1. In your browser, open DevTools (F12)');
console.log('2. Go to Console tab');
console.log('3. Run this command:\n');
console.log('   JSON.stringify(JSON.parse(localStorage.getItem("cmc-central-manager-cmcs")))\n');
console.log('4. Copy the output');
console.log('5. Save it to cmcs-export.json');
console.log('6. Run: node migrate-from-file.js cmcs-export.json\n');

console.log('Option 2: Bulk Import JSON');
console.log('─────────────────────────────────────');
console.log('Prepare a JSON file with this format:\n');
console.log(`[
  {
    "id": "abc123",
    "name": "Production CMC 1",
    "address": "https://10.50.0.123",
    "username": "admin",
    "password": "password123",
    "notes": "Main production chassis"
  }
]\n`);
console.log('Then run: node migrate-from-file.js your-file.json\n');

console.log('Option 3: Programmatic Migration');
console.log('─────────────────────────────────────');
console.log('Use this function in your code:\n');
console.log(`async function migrateCmcs(cmcsArray) {
  for (const cmc of cmcsArray) {
    const response = await fetch('http://localhost:3001/api/cmcs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cmc)
    });
    console.log(\`Migrated: \${cmc.name}\`);
  }
}\n`);

console.log('Note: API tokens will remain in localStorage (browser-local)\n');