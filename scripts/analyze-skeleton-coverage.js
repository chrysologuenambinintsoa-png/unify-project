#!/usr/bin/env node

/**
 * Script pour analyser la couverture des skeletons dans l'application
 * Identifie les pages et composants avec états de chargement manquants
 */

const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '../app');
const componentDir = path.join(__dirname, '../components');

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);

  const issues = [];

  // Checker pour les états de loading
  const hasLoading = /loading|isLoading|Loading/.test(content);
  const hasLoadingState = /useState\(.*loading/i.test(content);
  
  if (!hasLoading && !hasLoadingState) {
    return issues; // Pas de state de loading
  }

  // Checker pour les skeletons existants
  const hasSkeleton = /Skeleton|skeleton/.test(content);
  const hasMainLayout = /MainLayout|<main|<div\s+className="[^"]*flex/.test(content);

  // Checker pour les states de loading dans return
  const hasLoadingRender = /\{.*loading.*\?|if\s*\(\s*loading\s*\)/s.test(content);

  if (hasLoading && !hasSkeleton && hasLoadingRender) {
    issues.push({
      file: filePath,
      fileName,
      issue: 'MISSING_SKELETON',
      severity: 'HIGH',
      message: `${fileName} a des états de loading mais pas de skeleton`
    });
  }

  // Checker pour les divs grises vides pendant le chargement
  const emptyLoadingDivs = content.match(/\{loading\s*\?\s*\(\s*<div[^>]*className="[^"]*bg-(gray|slate)-\d+[^"]*"[^>]*>\s*<\/div>/g);
  if (emptyLoadingDivs && emptyLoadingDivs.length > 0) {
    issues.push({
      file: filePath,
      fileName,
      issue: 'EMPTY_LOADING_DIV',
      severity: 'MEDIUM',
      message: `${fileName} affiche une div grise vide pendant le chargement`
    });
  }

  // Checker pour les render conditionnels sans skeleton
  const conditionalRenders = content.match(/\{\s*loading\s*\?.*?:\s*\(/gs);
  if (conditionalRenders && conditionalRenders.length > 0 && !hasSkeleton) {
    // Already covered by MISSING_SKELETON
  }

  return issues;
}

function scanDirectory(dir, extension = '.tsx') {
  const files = [];
  
  function walkDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(dir);
  return files;
}

console.log('\n📊 Analysing skeleton coverage...\n');

const appFiles = scanDirectory(appDir, '.tsx');
const allIssues = [];

console.log(`Scanning ${appFiles.length} app files...\n`);

for (const file of appFiles) {
  const issues = analyzeFile(file);
  allIssues.push(...issues);
}

// Grouper par sévérité
const critical = allIssues.filter(i => i.severity === 'HIGH');
const medium = allIssues.filter(i => i.severity === 'MEDIUM');

console.log('\n🔴 HIGH PRIORITY (Missing Skeletons):');
console.log('===============================');
if (critical.length === 0) {
  console.log('✅ Tous les états de loading ont des skeletons!\n');
} else {
  critical.forEach(issue => {
    console.log(`\n  ${issue.fileName}`);
    console.log(`  Path: ${issue.file.replace(appDir, 'app')}`);
    console.log(`  Issue: ${issue.message}`);
  });
}

console.log('\n🟡 MEDIUM PRIORITY (Empty Loading Divs):');
console.log('========================================');
if (medium.length === 0) {
  console.log('✅ Pas de divs grises vides!\n');
} else {
  medium.forEach(issue => {
    console.log(`\n  ${issue.fileName}`);
    console.log(`  Path: ${issue.file.replace(appDir, 'app')}`);
    console.log(`  Issue: ${issue.message}`);
  });
}

console.log('\n📈 SUMMARY:');
console.log('===========');
console.log(`Total files scanned: ${appFiles.length}`);
console.log(`High priority issues: ${critical.length}`);
console.log(`Medium priority issues: ${medium.length}`);
console.log(`Total issues: ${allIssues.length}\n`);

// Export results to JSON
const results = {
  timestamp: new Date().toISOString(),
  summary: {
    totalScanned: appFiles.length,
    highPriority: critical.length,
    mediumPriority: medium.length,
    total: allIssues.length
  },
  issues: allIssues.map(i => ({
    fileName: i.fileName,
    relativePath: i.file.replace(appDir, 'app'),
    issue: i.issue,
    severity: i.severity,
    message: i.message
  }))
};

fs.writeFileSync(
  path.join(__dirname, '../skeleton-coverage-report.json'),
  JSON.stringify(results, null, 2)
);

console.log('📄 Report saved to: skeleton-coverage-report.json\n');

process.exit(allIssues.length > 0 ? 1 : 0);
