#!/usr/bin/env node

/**
 * Script pour nettoyer les traductions
 * Supprime les clés qui n'existent pas en français
 */

const fs = require('fs');
const path = require('path');

const translationsDir = path.join(__dirname, 'lib', 'translations');

// Lire le français comme référence
const frPath = path.join(translationsDir, 'fr.json');
const fr = JSON.parse(fs.readFileSync(frPath, 'utf-8'));

function getKeysSet(obj, prefix = '') {
  let keys = new Set();
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      new Set([...getKeysSet(obj[key], newKey)]).forEach(k => keys.add(k));
    } else {
      keys.add(newKey);
    }
  }
  return keys;
}

function cleanTranslations(obj, frenchKeys, prefix = '') {
  const cleaned = {};
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Récursivement nettoyer les objets imbriqués
      const cleanedNested = cleanTranslations(value, frenchKeys, newKey);
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key] = cleanedNested;
      }
    } else if (frenchKeys.has(newKey)) {
      // Garder seulement les clés qui existent en français
      cleaned[key] = value;
    }
  }
  return cleaned;
}

const frenchKeys = getKeysSet(fr);

console.log('\n🧹 Nettoyage des traductions...\n');
console.log(`Clés de référence (français): ${frenchKeys.size}\n`);

const languages = ['en', 'es', 'de', 'mg', 'ch', 'pt', 'it', 'ar', 'hi'];

languages.forEach(lang => {
  const langPath = path.join(translationsDir, `${lang}.json`);
  try {
    const translations = JSON.parse(fs.readFileSync(langPath, 'utf-8'));
    const before = Object.keys(JSON.stringify(translations)).length;
    
    const cleaned = cleanTranslations(translations, frenchKeys);
    
    fs.writeFileSync(langPath, JSON.stringify(cleaned, null, 2) + '\n');
    console.log(`✅ ${lang.toUpperCase()}: Nettoyé`);
  } catch (e) {
    console.error(`❌ ${lang.toUpperCase()}: ${e.message}`);
  }
});

console.log('\n✨ Nettoyage terminé!\n');
