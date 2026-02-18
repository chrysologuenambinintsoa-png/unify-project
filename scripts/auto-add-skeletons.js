#!/usr/bin/env node

/**
 * Script pour ajouter automatiquement les skeletons appropriés à toutes les pages
 */

const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '../app');

// Déterminer le skeleton approprié basé sur le chemin de la page
function getSkeletonForPath(filePath) {
  const relativePath = filePath.replace(appDir, '').toLowerCase();
  
  // Mapping intelligent des pages aux skeletons
  if (relativePath.includes('/admin/')) return 'PageSkeleton';
  if (relativePath.includes('/auth/')) return 'null'; // Auth pages ont leur propre loading
  if (relativePath.includes('/friends')) return 'CardsSkeleton';
  if (relativePath.includes('/groups')) return 'GroupSkeleton';
  if (relativePath.includes('/notifications')) return 'CardsSkeleton';
  if (relativePath.includes('/pages') && !relativePath.includes('/pages-')) return 'PageSkeleton';
  if (relativePath.includes('/posts')) return 'PostSkeleton';
  if (relativePath.includes('/stories')) return 'StoriesSkeleton';
  if (relativePath.includes('/search')) return 'CardsSkeleton';
  if (relativePath.includes('/badges')) return 'CardsSkeleton';
  if (relativePath.includes('/users') && relativePath.includes('/posts')) return 'PostSkeleton';
  if (relativePath.includes('photoviewer')) return 'PostSkeleton';
  if (relativePath.includes('/help')) return 'PageSkeleton';
  
  return 'CardsSkeleton'; // Default
}

function addSkeletonToPage(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const skeleton = getSkeletonForPath(filePath);
    
    if (skeleton === 'null') {
      console.log(`⊘ ${fileName} - skipped (auth page)`);
      return false;
    }

    // Check si le skeleton est déjà importé
    if (content.includes(skeleton) || content.includes('Skeleton')) {
      console.log(`⊘ ${fileName} - already has skeleton`);
      return false;
    }

    // Find where to insert the import
    const importsEndMatch = content.match(/^(import[^;]+;[\s\n]*)+([\s\n]*'use client';)?/m);
    if (!importsEndMatch) {
      console.warn(`⚠ ${fileName} - impossible to parse imports`);
      return false;
    }

    const importsEnd = importsEndMatch[0].length;
    
    // Check if the import line already exists
    if (!content.includes(`import { ${skeleton} }`)) {
      const skeletonImport = `import { ${skeleton} } from '@/components/skeletons/${skeleton}';\n`;
      content = content.slice(0, importsEnd) + skeletonImport + content.slice(importsEnd);
    }

    // Find the loading render pattern more intelligent
    // Look for: if (loading) { return (...) }
    const loadingPatterns = [
      /if\s*\(\s*loading\s*\)\s*{\s*return\s*\([^)]*\);\s*}/s,
      /if\s*\(\s*loading\s*\)\s*return\s*\([^)]*\);/s,
      /if\s*\(\s*(?:\w+Skeleton|\w+Loading)\s*\)\s*return\s*[^;]+;/s,
    ];

    let found = false;
    
    for (const pattern of loadingPatterns) {
      if (pattern.test(content)) {
        // Extract the MainLayout wrapper if exists
        const mainLayoutMatch = content.match(/<MainLayout[^>]*>\s*([^<]*)<\/MainLayout>/);
        
        if (mainLayoutMatch) {
          const newContent = content.replace(
            pattern,
            `if (loading) {
    return (
      <MainLayout>
        <${skeleton} />
      </MainLayout>
    );
  }`
          );
          fs.writeFileSync(filePath, newContent);
          found = true;
          break;
        } else {
          // Page without MainLayout
          const newContent = content.replace(
            pattern,
            `if (loading) {
    return <${skeleton} />;
  }`
          );
          fs.writeFileSync(filePath, newContent);
          found = true;
          break;
        }
      }
    }

    if (found) {
      console.log(`✓ ${fileName} - added ${skeleton}`);
      return true;
    } else {
      console.warn(`⚠ ${fileName} - couldn't find loading pattern`);
      return false;
    }
  } catch (err) {
    console.error(`✗ Error processing: ${filePath}`);
    console.error(`  ${err.message}`);
    return false;
  }
}

function findAllPagesWithLoading(dir) {
  const pages = [];
  
  function walkDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name === 'page.tsx' || entry.name.endsWith('Client.tsx')) {
        // Check if file has loading state
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (/loading\s*[:=]|useState.*loading|if\s*\(\s*loading/i.test(content)) {
          pages.push(fullPath);
        }
      }
    }
  }
  
  walkDir(dir);
  return pages;
}

console.log('\n🚀 Adding skeletons to all pages with loading states...\n');

const pagesWithLoading = findAllPagesWithLoading(appDir);
console.log(`Found ${pagesWithLoading.length} pages/components with loading states\n`);

let updated = 0;
let skipped = 0;
let failed = 0;

for (const filePath of pagesWithLoading) {
  const result = addSkeletonToPage(filePath);
  if (result) updated++;
  else if (filePath.includes('/auth/')) skipped++;
  else failed++;
}

console.log('\n📈 SUMMARY:');
console.log('===========');
console.log(`Updated: ${updated}`);
console.log(`Skipped: ${skipped}`);
console.log(`Failed: ${failed}\n`);

if (updated > 0) {
  console.log('✅ Skeleton coverage improved!\n');
} else {
  console.log('ℹ  No changes made.\n');
}
