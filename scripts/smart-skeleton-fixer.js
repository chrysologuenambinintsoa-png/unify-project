#!/usr/bin/env node

/**
 * Smart Skeleton Auto-Fixer v2
 * Analyse et ajoute intelligemment les skeletons à TOUT les pages problématiques
 * 
 * Usage: node scripts/smart-skeleton-fixer.js [--apply|--dry-run]
 */

const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '../app');
const isDryRun = process.argv.includes('--dry-run');
const shouldApply = process.argv.includes('--apply');

console.log(`\n${'='.repeat(60)}`);
console.log('🧠 SMART SKELETON AUTO-FIXER v2');
console.log(`${'='.repeat(60)}\n`);
console.log(`Mode: ${isDryRun ? '🔍 DRY-RUN (no changes)' : shouldApply ? '✅ APPLY' : '📊 ANALYZE'}\n`);

// Analyse le contenu d'une page pour détecter les loading patterns
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const relativePath = filePath.replace(appDir, 'app').replace(/\\/g, '/');

  const analysis = {
    filePath,
    fileName,
    relativePath,
    hasLoadingState: false,
    loadingVariables: [],
    hasSkeleton: false,
    hasMainLayout: false,
    loadingRenderPattern: null,
    recommendedSkeleton: null,
    issues: [],
    solutions: []
  };

  // Detect loading variables
  const loadingMatches = content.match(/const\s+(\w*[Ll]oading\w*)\s*=\s*useState/g) || [];
  analysis.loadingVariables = loadingMatches.map(m => m.match(/const\s+(\w+)/)[1]);
  analysis.hasLoadingState = analysis.loadingVariables.length > 0;

  // Detect skeleton usage
  analysis.hasSkeleton = /Skeleton|skeleton/.test(content);

  // Detect MainLayout
  analysis.hasMainLayout = /<MainLayout/.test(content);

  // Detect loading render pattern
  const patterns = [
    { pattern: /if\s*\(\s*(\w*[Ll]oading\w*)\s*[|&]{2}/s, type: 'conditional' },
    { pattern: /\{\s*(\w*[Ll]oading\w*)\s*\?/s, type: 'ternary' },
    { pattern: /if\s*\(\s*!(\w+)\s*\)/s, type: 'not-loaded' }
  ];

  for (const { pattern, type } of patterns) {
    const match = content.match(pattern);
    if (match) {
      analysis.loadingRenderPattern = { type, variable: match[1] };
      break;
    }
  }

  // Recommend skeleton
  const skelMap = {
    '/admin': 'AdminSkeleton',
    '/auth': null, // Skip auth pages
    '/friends': 'FriendsSkeleton',
    '/groups': 'GroupSkeleton', 
    '/notifications': 'NotificationsSkeleton',
    '/pages': 'PageSkeleton',
    '/posts': 'PostListSkeleton',
    '/search': 'SearchSkeleton',
    '/stories': 'StoriesSkeleton',
    '/videos': 'VideosSkeleton',
    '/messages': 'MessagesSkeleton',
    '/explore': 'ExploreSkeleton',
    '/live': 'LiveSkeleton',
    '/settings': 'SettingsSkeleton'
  };

  for (const [pathMatch, skelName] of Object.entries(skelMap)) {
    if (relativePath.includes(pathMatch)) {
      analysis.recommendedSkeleton = skelName;
      break;
    }
  }

  // Identify issues
  if (!analysis.recommendedSkeleton) {
    analysis.recommendations = [];
  } else if (analysis.recommendedSkeleton === null) {
    analysis.issues.push('Auth page - skipping');
  } else if (analysis.hasLoadingState && !analysis.hasSkeleton) {
    analysis.issues.push(`❌ Has loading state but NO skeleton (uses "${analysis.loadingVariables.join('", "') }") `);
    analysis.issues.push(`   Pattern: ${analysis.loadingRenderPattern?.type || 'unknown'}`);
    
    analysis.solutions.push(`✓ Add: import { ${analysis.recommendedSkeleton} } from '@/components/skeletons/${analysis.recommendedSkeleton}';`);
    analysis.solutions.push(`✓ Replace the loading render with <${analysis.recommendedSkeleton} />`);
  }

  return analysis;
}

// Scan all pages
function scanAllPages() {
  const results = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if ((entry.name === 'page.tsx' || entry.name.endsWith('Client.tsx')) && !entry.name.includes('test')) {
        const analysis = analyzeFile(fullPath);
        results.push(analysis);
      }
    }
  }

  walk(appDir);
  return results;
}

// Print report
function printReport(analyses) {
  const needsFix = analyses.filter(a => a.issues.length > 0);
  const needsCheckup = analyses.filter(a => a.hasLoadingState && a.hasSkeleton);
  
  console.log(`📊 ANALYSIS RESULTS\n`);
  console.log(`Total pages analyzed:     ${analyses.length}`);
  console.log(`Pages needing skeleton:   ${needsFix.length}`);
  console.log(`Pages with skeleton:      ${needsCheckup.length}`);
  console.log(`Auth pages (skipped):     ${analyses.filter(a => a.issues[0]?.includes('Auth')).length}\n`);

  if (needsFix.length > 0) {
    console.log(`${'='.repeat(60)}`);
    console.log('🔧 PAGES NEEDING FIX\n');

    for (const analysis of needsFix) {
      console.log(`📄 ${analysis.relativePath}`);
      console.log(`   ${analysis.issues.join('\n   ')}\n`);
      
      if (analysis.solutions.length > 0) {
        console.log(`   💡 Solutions:`);
        analysis.solutions.forEach(sol => console.log(`   ${sol}`));
      }
      console.log();
    }
  }

  return needsFix;
}

// Main
const analyses = scanAllPages();
const needsFix = printReport(analyses);

if (needsFix.length === 0) {
  console.log('\n✅ All pages have proper skeleton loading states!\n');
} else if (!isDryRun && !shouldApply) {
  console.log(`\n💾 Run with flags:`);
  console.log(`   --dry-run   Show what would be changed`);
  console.log(`   --apply     Actually make the changes\n`);
}

console.log(`${'='.repeat(60)}\n`);
