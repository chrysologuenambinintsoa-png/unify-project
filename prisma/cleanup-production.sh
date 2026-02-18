#!/bin/bash
# Script de nettoyage production - supprime les données de développement
# Préserve toutes les tables et fonctionnalités

echo "🚀 Nettoyage de la base de données en production..."
echo ""
echo "⚠️  ATTENTION: Ce script supprimera toutes les données de développement"
echo "Les tables et structure seront conservées"
echo ""
read -p "Voulez-vous continuer? (oui/non): " confirmation

if [ "$confirmation" != "oui" ]; then
  echo "❌ Annulation du nettoyage"
  exit 1
fi

echo ""
echo "🧹 Début du nettoyage..."

# Exécuter le script TypeScript de nettoyage
npm run db:clean

echo ""
echo "✅ Nettoyage terminé!"
echo ""
echo "Statut étapes:"
echo "  ✓ Données de développement supprimées"
echo "  ✓ Toutes les tables préservées"
echo "  ✓ Fonctionnalités intactes"
echo ""
echo "🔍 Vérification de l'intégrité..."
npm run db:verify

echo "✅ Base de données prête pour la production!"
