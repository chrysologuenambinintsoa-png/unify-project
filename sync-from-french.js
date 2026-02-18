#!/usr/bin/env node

/**
 * Script pour synchroniser toutes les clés FR vers les autres langues
 */

const fs = require('fs');
const path = require('path');

const translationsDir = path.join(__dirname, 'lib', 'translations');

function deepMerge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else if (!(key in target)) {
      target[key] = source[key];
    }
  }
  return target;
}

function syncFromFrench() {
  console.log('\n🔄 Synchronisation depuis le français (langue maître)...\n');

  // Lire le français comme référence
  const frPath = path.join(translationsDir, 'fr.json');
  const fr = JSON.parse(fs.readFileSync(frPath, 'utf-8'));

  const languages = ['en', 'es', 'de', 'mg', 'ch', 'pt', 'it', 'ar', 'hi'];

  languages.forEach(lang => {
    const langPath = path.join(translationsDir, `${lang}.json`);
    const current = JSON.parse(fs.readFileSync(langPath, 'utf-8'));

    // Fusionner profondément
    const merged = deepMerge(JSON.parse(JSON.stringify(current)), fr);

    // Écrire le fichier mis à jour
    fs.writeFileSync(langPath, JSON.stringify(merged, null, 2) + '\n');
    console.log(`✅ ${lang.toUpperCase()}: Clés synchronisées`);
  });

  console.log('\n✨ Synchronisation terminée!\n');
}

syncFromFrench();
