#!/usr/bin/env node

/**
 * Script simple pour vérifier les traductions manquantes
 */

const fs = require('fs');
const path = require('path');

const translationsDir = path.join(__dirname, 'lib', 'translations');

// Lire toutes les traductions
const languages = ['fr', 'en', 'es', 'de', 'mg', 'ch', 'pt', 'it', 'ar', 'hi'];
const translations = {};

languages.forEach(lang => {
  const filePath = path.join(translationsDir, `${lang}.json`);
  try {
    translations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Erreur à la lecture de ${lang}.json:`, e.message);
  }
});

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

// Get all keys from each language
const keysByLanguage = {};
languages.forEach(lang => {
  keysByLanguage[lang] = getAllKeys(translations[lang]);
});

const frenchKeys = keysByLanguage['fr'];
console.log(`\n📊 Rapport de vérification des traductions\n`);
console.log(`Clés en français: ${frenchKeys.length}\n`);

let allComplete = true;

languages.forEach(lang => {
  if (lang === 'fr') return;
  
  const langKeys = keysByLanguage[lang];
  const missing = frenchKeys.filter(key => !langKeys.includes(key));
  const extra = langKeys.filter(key => !frenchKeys.includes(key));
  
  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅ ${lang.toUpperCase()}: Complet (${langKeys.length} clés)`);
  } else {
    allComplete = false;
    console.log(`⚠️  ${lang.toUpperCase()}: Manquant ou extra`);
    if (missing.length > 0) {
      console.log(`   Manquantes: ${missing.length}`);
      missing.slice(0, 3).forEach(k => console.log(`     - ${k}`));
      if (missing.length > 3) console.log(`   ... et ${missing.length - 3} de plus`);
    }
    if (extra.length > 0) {
      console.log(`   Extra: ${extra.length}`);
      extra.slice(0, 3).forEach(k => console.log(`     + ${k}`));
      if (extra.length > 3) console.log(`   ... et ${extra.length - 3} de plus`);
    }
    console.log();
  }
});

if (allComplete) {
  console.log(`\n✨ Toutes les traductions sont complètes!\n`);
} else {
  console.log(`\n⚡ Exécutez "node sync-from-french.js" pour corriger les clés manquantes\n`);
}
