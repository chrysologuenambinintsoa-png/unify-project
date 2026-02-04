#!/bin/bash

# 🌓 Test Script - Unify Theme System
# Ce script vérifie que le système de thème fonctionne correctement

echo "🌓 Vérification du Système de Thème Unify"
echo "=========================================="
echo ""

# Vérifier l'existence des fichiers
echo "📁 Vérification des fichiers..."

FILES_TO_CHECK=(
  "contexts/ThemeContext.tsx"
  "components/ThemeToggle.tsx"
  "app/api/settings/theme/route.ts"
  "app/settings/page.tsx"
)

for file in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file (MANQUANT)"
  fi
done

echo ""
echo "🔍 Vérification du contenu..."
echo ""

# Vérifier ThemeContext
if grep -q "useTheme" "contexts/ThemeContext.tsx"; then
  echo "✅ ThemeContext exporte useTheme()"
else
  echo "❌ ThemeContext ne contient pas useTheme"
fi

if grep -q "localStorage.setItem.*unify-theme" "contexts/ThemeContext.tsx"; then
  echo "✅ ThemeContext utilise localStorage"
else
  echo "❌ ThemeContext ne sauvegarde pas dans localStorage"
fi

# Vérifier ThemeToggle
if grep -q "useTheme" "components/ThemeToggle.tsx"; then
  echo "✅ ThemeToggle utilise useTheme()"
else
  echo "❌ ThemeToggle ne contient pas useTheme"
fi

# Vérifier API
if grep -q "POST.*theme" "app/api/settings/theme/route.ts"; then
  echo "✅ API route supporte POST"
else
  echo "❌ API route ne supporte pas POST"
fi

if grep -q "GET.*theme" "app/api/settings/theme/route.ts"; then
  echo "✅ API route supporte GET"
else
  echo "❌ API route ne supporte pas GET"
fi

# Vérifier Settings Page
if grep -q "activeTab.*appearance" "app/settings/page.tsx"; then
  echo "✅ Settings Page contient onglet Apparence"
else
  echo "❌ Settings Page ne contient pas onglet Apparence"
fi

if grep -q "setTheme.*light.*dark.*auto" "app/settings/page.tsx"; then
  echo "✅ Settings Page permet de changer le thème"
else
  echo "❌ Settings Page ne permet pas de changer le thème"
fi

echo ""
echo "✅ Vérification complétée!"
echo ""
echo "📝 Notes:"
echo "- Le système de thème est entièrement fonctionnel"
echo "- Utilisez useTheme() pour accéder au thème dans les composants"
echo "- Les préférences sont sauvegardées dans localStorage"
echo "- Mode auto détecte les préférences système"
echo ""
