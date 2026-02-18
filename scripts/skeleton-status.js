#!/usr/bin/env node

/**
 * 🎨 Skeleton Loading System - Quick Reference & Status
 * 
 * Run: node scripts/skeleton-status.js
 */

const fs = require('fs');
const path = require('path');

const skeletonsDir = path.join(__dirname, '../components/skeletons');
const appDir = path.join(__dirname, '../app');

function getSkeletonStats() {
  const skeletons = fs.readdirSync(skeletonsDir)
    .filter(f => f.endsWith('Skeleton.tsx'))
    .map(f => ({
      name: f.replace('Skeleton.tsx', ''),
      file: f,
      size: fs.statSync(path.join(skeletonsDir, f)).size
    }));

  return skeletons;
}

function getPageStats() {
  const pagesWithLoading = [];
  
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name === 'page.tsx' || entry.name.endsWith('Client.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (/loading|isLoading|Loading/i.test(content)) {
          const hasSkeleton = /Skeleton|skeleton/.test(content);
          pagesWithLoading.push({
            file: fullPath.replace(appDir, '').replace(/\\/g, '/'),
            hasSkeleton
          });
        }
      }
    }
  }
  
  walk(appDir);
  return pagesWithLoading;
}

console.log(`\n${'█'.repeat(70)}`);
console.log('  🎨 UNIFY APP - SKELETON LOADING SYSTEM STATUS');
console.log(`${'█'.repeat(70)}\n`);

const skeletons = getSkeletonStats();
const pages = getPageStats();

console.log(`📦 SKELETONS (${skeletons.length} total)\n`);
console.log('  Name                          Size    Status');
console.log('  ' + '─'.repeat(65));

const sortedSkeletons = skeletons.sort((a, b) => b.size - a.size);
for (const sk of sortedSkeletons) {
  const sizeKb = (sk.size / 1024).toFixed(1);
  const name = sk.name.padEnd(28);
  const size = `${sizeKb}KB`.padEnd(7);
  console.log(`  ${name} ${size} ✅ Ready`);
}

const totalSize = skeletons.reduce((sum, s) => sum + s.size, 0);
console.log(`\n  Total Bundle Size: ${(totalSize / 1024).toFixed(1)}KB\n`);

console.log(`📄 PAGE COVERAGE (${pages.length} analyzed)\n`);

const withSkeleton = pages.filter(p => p.hasSkeleton);
const withoutSkeleton = pages.filter(p => !p.hasSkeleton);

console.log(`  ✅ With Skeleton:      ${withSkeleton.length}/${pages.length}`);
for (const p of withSkeleton.slice(0, 5)) {
  console.log(`     ✓ ${p.file}`);
}
if (withSkeleton.length > 5) {
  console.log(`     ... and ${withSkeleton.length - 5} more`);
}

console.log(`\n  ⚠️  Without Skeleton:    ${withoutSkeleton.length}/${pages.length}`);
for (const p of withoutSkeleton.slice(0, 3)) {
  console.log(`     ✗ ${p.file}`);
}
if (withoutSkeleton.length > 3) {
  console.log(`     ... and ${withoutSkeleton.length - 3} more`);
}

const coverage = Math.round((withSkeleton.length / pages.length) * 100);
console.log(`\n  Coverage: ${coverage}%`);
if (coverage === 100) {
  console.log(`  ${'█'.repeat(Math.floor(coverage / 5))} PERFECT! ✨\n`);
} else {
  console.log(`  ${'█'.repeat(Math.floor(coverage / 5))}${'░'.repeat(20 - Math.floor(coverage / 5))}\n`);
}

console.log(`🔧 QUICK COMMANDS\n`);
console.log(`  npm run skeleton:analyze   # Full analysis`);
console.log(`  npm run skeleton:apply     # Auto-apply`);
console.log(`  npm run skeleton:smart     # Smart check`);
console.log(`  npm run skeleton:report    # JSON report\n`);

console.log(`📚 DOCUMENTATION\n`);
console.log(`  • SKELETON_GUIDE.md - How to create & use skeletons`);
console.log(`  • SKELETON_IMPLEMENTATION_SUMMARY.md - What was done`);
console.log(`  • SKELETON_LOADING_IMPLEMENTATION.md - Technical details\n`);

console.log(`${'█'.repeat(70)}\n`);
console.log(`Status: ${coverage === 100 ? '✅ EXCELLENT' : '⚠️  NEEDS WORK'}`);
console.log(`Last Updated: ${new Date().toLocaleDateString()}\n`);
