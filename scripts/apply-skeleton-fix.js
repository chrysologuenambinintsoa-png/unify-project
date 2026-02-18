#!/usr/bin/env node

/**
 * Script complet pour auto-ajouter les skeletons à TOUTES les pages manquantes
 * Utilisation: node scripts/apply-skeleton-fix.js
 */

const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '../app');
const skeletonsDir = path.join(__dirname, '../components/skeletons');

// Pages déjà gérées
const ALREADY_HANDLED = [
  'friends/page.tsx',
  'notifications/page.tsx',
  'search/page.tsx',
  'groups/page.tsx',
];

/**
 * Génère un skeleton basé sur le type de page
 */
function generateSkeleton(skeletonName, type = 'default') {
  const skeletonTemplates = {
    list: `import React from 'react';

export function ${skeletonName}() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
      
      {/* List items */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}`,
    grid: `import React from 'react';

export function ${skeletonName}() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          <div className="h-40 bg-gray-200 dark:bg-gray-700" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}`,
    feed: `import React from 'react';

export function ${skeletonName}() {
  return (
    <div className="space-y-6 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-4">
          {/* Post header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          
          {/* Image */}
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
          
          {/* Bottom bar */}
          <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      ))}
    </div>
  );
}`,
    default: `import React from 'react';

export function ${skeletonName}() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
      
      {/* Content skeletons */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
        </div>
      ))}
    </div>
  );
}`
  };

  return skeletonTemplates[type] || skeletonTemplates.default;
}

/**
 * Détermine le type de skeleton basé sur le chemin
 */
function getSkeletonType(filePath) {
  const lower = filePath.toLowerCase();
  
  if (lower.includes('admin')) return { name: 'AdminSkeleton', type: 'list' };
  if (lower.includes('posts')) return { name: 'PostListSkeleton', type: 'feed' };
  if (lower.includes('/pages') && !lower.includes('pages-')) return { name: 'PagesListSkeleton', type: 'grid' };
  if (lower.includes('stories')) return { name: 'StoriesSkeleton', type: 'grid' };
  if (lower.includes('badges')) return { name: 'BadgesSkeleton', type: 'list' };
  if (lower.includes('help')) return { name: 'PageSkeleton', type: 'default' };
  
  return { name: 'PageSkeleton', type: 'default' };
}

/**
 * Ajoute un skeleton à une page
 */
function addSkeletonToFile(filePath, skeletonName) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Vérifier si elle a déjà un import Skeleton
    if (new RegExp(`import.*${skeletonName}|Skeleton`).test(content)) {
      return { success: false, reason: 'exists' };
    }

    // Ajouter l'import du skeleton
    const importsEnd = content.search(/\n\n(?!import)/m);
    if (importsEnd === -1) {
      return { success: false, reason: 'parse' };
    }

    const skeletonImport = `import { ${skeletonName} } from '@/components/skeletons/${skeletonName}';`;
    if (!content.includes(skeletonImport)) {
      content = content.slice(0, importsEnd) + `\n${skeletonImport}` + content.slice(importsEnd);
    }

    // Chercher et remplacer les patterns de loading
    const patterns = [
      {
        find: /if\s*\(\s*loading\s*\|\|!data\s*\)\s*\{\s*return\s*\([^)]*\);\s*\}/s,
        replace: (match) => {
          if (match.includes('MainLayout')) {
            return `if (loading || !data) {\n    return (\n      <MainLayout>\n        <${skeletonName} />\n      </MainLayout>\n    );\n  }`;
          } else {
            return `if (loading || !data) {\n    return <${skeletonName} />;\n  }`;
          }
        }
      },
      {
        find: /if\s*\(\s*loading\s*\)\s*\{\s*return\s*\([^)]*\);\s*\}/s,
        replace: (match) => {
          if (match.includes('MainLayout')) {
            return `if (loading) {\n    return (\n      <MainLayout>\n        <${skeletonName} />\n      </MainLayout>\n    );\n  }`;
          } else {
            return `if (loading) {\n    return <${skeletonName} />;\n  }`;
          }
        }
      }
    ];

    let modified = false;
    for (const pattern of patterns) {
      if (pattern.find.test(content)) {
        content = content.replace(pattern.find, pattern.replace);
        modified = true;
        break;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      return { success: true, reason: 'updated' };
    } else {
      return { success: false, reason: 'no_pattern' };
    }
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

// Main script
console.log('\n🚀 Auto-applying skeleton loading states...\n');

// Find all pages with loading states
const pagesWithLoading = [];

function findPages(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      findPages(fullPath);
    } else if ((entry.name === 'page.tsx' || entry.name.endsWith('Client.tsx')) && 
               !ALREADY_HANDLED.some(h => fullPath.includes(h))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (/loading|isLoading/i.test(content)) {
        pagesWithLoading.push(fullPath);
      }
    }
  }
}

findPages(appDir);
console.log(`Found ${pagesWithLoading.length} pages with loading states\n`);

let created = 0;
let updated = 0;
let failed = 0;

for (const file of pagesWithLoading) {
  const { name: skeletonName, type } = getSkeletonType(file);
  const skeletonPath = path.join(skeletonsDir, `${skeletonName}.tsx`);
  
  // Create skeleton if missing
  if (!fs.existsSync(skeletonPath)) {
    const skeletonCode = generateSkeleton(skeletonName, type);
    fs.writeFileSync(skeletonPath, skeletonCode);
    console.log(`✓ Created: components/skeletons/${skeletonName}.tsx`);
    created++;
  }
  
  // Add to page
  const result = addSkeletonToFile(file, skeletonName);
  if (result.success) {
    const relPath = file.replace(appDir, 'app');
    console.log(`✓ Updated: ${relPath} + ${skeletonName}`);
    updated++;
  } else if (result.reason !== 'exists') {
    failed++;
  }
}

console.log(`\n📈 SUMMARY:`);
console.log(`===========`);
console.log(`Skeletons created: ${created}`);
console.log(`Pages updated: ${updated}`);
console.log(`Failed: ${failed}\n`);

if (created + updated > 0) {
  console.log('✅ Skeleton loading states applied!\n');
}
