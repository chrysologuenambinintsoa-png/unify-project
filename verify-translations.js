#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const translationsDir = path.join(__dirname, 'lib', 'translations');

// Read all translation files
const languages = ['fr', 'en', 'es', 'de', 'mg', 'ch'];
const translations = {};

languages.forEach(lang => {
  const filePath = path.join(translationsDir, `${lang}.json`);
  translations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
});

// Get all keys from French (master language)
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], newKey));
    } else {
      keys.push(newKey);
    }
  }
  return keys;
}

const frenchKeys = getAllKeys(translations.fr);
console.log(`\n📊 Translation Verification Report`);
console.log(`=`.repeat(60));
console.log(`Total keys in French: ${frenchKeys.length}\n`);

let allOk = true;

languages.forEach(lang => {
  if (lang === 'fr') return;
  
  const langKeys = getAllKeys(translations[lang]);
  const missingKeys = frenchKeys.filter(key => !langKeys.includes(key));
  const extraKeys = langKeys.filter(key => !frenchKeys.includes(key));
  
  if (missingKeys.length === 0 && extraKeys.length === 0) {
    console.log(`✅ ${lang.toUpperCase()}: Complete (${langKeys.length} keys)`);
  } else {
    allOk = false;
    console.log(`⚠️  ${lang.toUpperCase()}: Issues found`);
    if (missingKeys.length > 0) {
      console.log(`   Missing keys: ${missingKeys.length}`);
      missingKeys.slice(0, 5).forEach(k => console.log(`     - ${k}`));
      if (missingKeys.length > 5) console.log(`     ... and ${missingKeys.length - 5} more`);
    }
    if (extraKeys.length > 0) {
      console.log(`   Extra keys: ${extraKeys.length}`);
      extraKeys.slice(0, 5).forEach(k => console.log(`     + ${k}`));
      if (extraKeys.length > 5) console.log(`     ... and ${extraKeys.length - 5} more`);
    }
  }
});

console.log(`\n` + `=`.repeat(60));
if (allOk) {
  console.log(`✨ All translations are complete!`);
} else {
  console.log(`⚠️  Some translations need attention.`);
}
console.log();

process.exit(allOk ? 0 : 1);
