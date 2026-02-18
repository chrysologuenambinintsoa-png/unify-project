#!/usr/bin/env node

/**
 * Script pour trouver les textes en dur non traduits
 * Cherche les strings qui ne sont pas dans les fichiers de traduction
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const translationsDir = path.join(__dirname, 'lib', 'translations');
const componentsDir = path.join(__dirname, 'app');

// Lire les traductions
const frTranslations = JSON.parse(fs.readFileSync(path.join(translationsDir, 'fr.json'), 'utf-8'));
const enTranslations = JSON.parse(fs.readFileSync(path.join(translationsDir, 'en.json'), 'utf-8'));

function getAllTranslationStrings(obj, prefix = '') {
  let strings = [];
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'string') {
      strings.push(value);
    } else if (typeof value === 'object' && value !== null) {
      strings = strings.concat(getAllTranslationStrings(value, `${prefix}${key}.`));
    }
  }
  return strings;
}

const translatedStrings = new Set([
  ...getAllTranslationStrings(frTranslations),
  ...getAllTranslationStrings(enTranslations),
  'Next', 'Previous', 'Skip', 'OK', 'Yes', 'No', 'A', 'De', 'a', 'de',
]);

console.log('\n🔍 Recherche des textes en dur non traduits...\n');

// Chercher les fichiers TSX
const tsxFiles = glob.sync(`${componentsDir}/**/*.tsx`, { ignore: '**/node_modules/**' });

const suspiciousStrings = [
  /"([^"]{5,})"(?!\s*\|\|)\s*\/\//,  // Quoted strings with comments but no translations
  /'([^']{5,})'(?!\s*\|\|)\s*\/\//,  // Same with single quotes
];

let totalMatches = 0;

jsxFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Skip if already using translation
    if (line.includes('translation.') || line.includes('t(') || line.includes('<Trans')) {
      return;
    }
    
    // Look for strings that are not in translations
    const stringMatches = line.match(/"([^"]{10,})"|'([^']{10,})'/g);
    if (stringMatches) {
      stringMatches.forEach(match => {
        const str = match.slice(1, -1);  // Remove quotes
        
        // Skip common non-translatable items
        if (str.match(/^[\d\-._/:]+$/) || str.length < 5) return;
        if (str.includes('http') || str.includes('@') || str.includes('.')) return;
        
        // Common French/English words that might be hardcoded
        const commonHardcoded = ['Annuler', 'Charger', 'Créer', 'Modifier', 'Supprimer', 
                                  'Cancel', 'Loading', 'Create', 'Edit', 'Delete',
                                  'Page Name', 'Tag People', 'Search', 'Publications', 
                                  'Conversions', 'Animation'];
        
        if (commonHardcoded.includes(str) || !translatedStrings.has(str)) {
          console.log(`⚠️  ${path.relative(__dirname, file)}:${index + 1}`);
          console.log(`    "${str}"`);
          totalMatches++;
        }
      });
    }
  });
});

console.log(`\n\n📊 Total de textes suspects: ${totalMatches}`);
console.log('✨ Vérifiez manuellement les lignes listées ci-dessus\n');
