const fr = require('./lib/translations/fr.json');
const en = require('./lib/translations/en.json');
const sections = ['post', 'message', 'explore', 'story', 'video', 'settings', 'profile', 'user', 'group', 'page'];

console.log('\n📋 VÉRIFICATION DES SECTIONS\n');

sections.forEach(section => {
  const frKeys = fr[section] ? Object.keys(fr[section]).sort() : [];
  const enKeys = en[section] ? Object.keys(en[section]).sort() : [];
  
  const missing = frKeys.filter(k => !enKeys.includes(k));
  const extra = enKeys.filter(k => !frKeys.includes(k));
  
  if (missing.length > 0 || extra.length > 0) {
    console.log(`❌ ${section}:`);
    if (missing.length > 0) console.log(`   Missing in EN: ${missing.join(', ')}`);
    if (extra.length > 0) console.log(`   Extra in EN: ${extra.join(', ')}`);
    console.log();
  } else if (frKeys.length === 0) {
    console.log(`⚠️  ${section}: Not found (section doesn't exist)`);
  } else {
    console.log(`✅ ${section}: OK (${frKeys.length} keys)`);
  }
});
