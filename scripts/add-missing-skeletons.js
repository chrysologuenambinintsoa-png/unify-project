#!/usr/bin/env node

/**
 * Script pour générer et ajouter des skeletons manquants
 */

const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '../app');

// Mappings entre les pages et leurs skeletons correspondants
const PAGE_SKELETON_MAP = {
  '/app/page.tsx': 'HomeSkeleton',
  '/app/explore/page.tsx': 'ExploreSkeleton',
  '/app/messages/page.tsx': 'MessagesSkeleton',
  '/app/notifications/page.tsx': 'NotificationsSkeleton',
  '/app/friends/page.tsx': 'FriendsSkeleton',
  '/app/groups/page.tsx': 'GroupSkeleton',
  '/app/pages/page.tsx': 'PageSkeleton',
  '/app/settings/page.tsx': 'SettingsSkeleton',
  '/app/videos/page.tsx': 'VideosSkeleton',
  '/app/live/page.tsx': 'LiveSkeleton',
};

/**
 * Génère un skeleton par défaut pour une page/composant
 */
function generateDefaultSkeleton(pageName) {
  const skeletonName = pageName.replace(/page\.tsx|\.tsx/, '').split('/').pop() + 'Skeleton';
  
  return `import React from 'react';

export function ${skeletonName}() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6" />
      
      {/* Content skeletons */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
`;
}

/**
 * Insère un skeleton dans une page avec état de loading
 */
function addSkeletonToPage(filePath, skeletonName) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Check si le skeleton est déjà importé
  if (content.includes(skeletonName)) {
    console.log(`✓ ${path.basename(filePath)} a déjà ${skeletonName}`);
    return false;
  }

  // Find the import section
  const importMatch = content.match(/^(import[^;]+from[^\n]+\n)+/m);
  if (!importMatch) {
    console.warn(`⚠ Impossible d'ajouter import à ${filePath}`);
    return false;
  }

  const lastImportEnd = importMatch[0].length;
  const importLine = `import { ${skeletonName} } from '@/components/skeletons/${skeletonName}';\n`;
  
  content = content.slice(0, lastImportEnd) + importLine + content.slice(lastImportEnd);

  // Find the loading state render
  const loadingRenderPattern = /if\s*\(\s*loading\s*\)\s*\{[\s\S]*?\n\s*return\s*\([^)]*\)\s*;/;
  const match = content.match(loadingRenderPattern);

  if (match) {
    const oldRender = match[0];
    const newRender = oldRender.replace(
      /return\s*\(\s*<MainLayout>[\s\S]*?<\/MainLayout>\s*\)/,
      `return (
      <MainLayout>
        <${skeletonName} />
      </MainLayout>
    )`
    );
    content = content.replace(oldRender, newRender);
  }

  fs.writeFileSync(filePath, content);
  console.log(`✓ ${skeletonName} ajouté à ${path.basename(filePath)}`);
  return true;
}

/**
 * Crée un fichier skeleton manquant
 */
function createMissingSkeleton(skeletonName) {
  const skeletonsDir = path.join(__dirname, '../components/skeletons');
  const filePath = path.join(skeletonsDir, `${skeletonName}.tsx`);

  if (fs.existsSync(filePath)) {
    return false; // Skeleton already exists
  }

  const content = generateDefaultSkeleton(skeletonName);
  fs.writeFileSync(filePath, content);
  console.log(`✓ Créé: components/skeletons/${skeletonName}.tsx`);
  return true;
}

console.log('\n🚀 Ajout automatique des skeletons manquants...\n');

// Skeletons qui manquent actuellement
const missingSkeletons = ['FriendsSkeleton', 'NotificationsSkeleton'];

for (const skeleton of missingSkeletons) {
  createMissingSkeleton(skeleton);
}

// Ajouter les skeletons aux pages correspondantes
const filesToUpdate = [
  { path: path.join(appDir, 'friends', 'page.tsx'), skeleton: 'FriendsSkeleton' },
  { path: path.join(appDir, 'notifications', 'page.tsx'), skeleton: 'NotificationsSkeleton' },
];

console.log('\n📝 Mise à jour des pages avec skeletons...\n');

for (const { path: filePath, skeleton } of filesToUpdate) {
  if (fs.existsSync(filePath)) {
    addSkeletonToPage(filePath, skeleton);
  }
}

console.log('\n✅ Terminé!\n');
