#!/bin/bash

# 🔐 Script de nettoyage de sécurité pour Git
# Ce script aide à nettoyer les secrets accidentellement commités

echo "🔍 Scanning pour les secrets dans l'historique Git..."
echo ""

# Vérifier s'il y a des patterns de secrets
echo "⚠️ Vérification des patterns potentiels de secrets..."
echo ""

# Pattern: Credentials dans les logs
echo "1️⃣ Cherchant: passwords et credentials..."
git log -p --all | grep -i -E "password\s*[=:]\s*['\"]" | head -5

# Pattern: API Keys
echo ""
echo "2️⃣ Cherchant: API keys..."
git log -p --all | grep -i -E "api.key|api_key\s*[=:]\s*['\"]" | head -5

# Pattern: Tokens
echo ""
echo "3️⃣ Cherchant: tokens..."
git log -p --all | grep -i -E "token\s*[=:]\s*['\"]|secret\s*[=:]\s*['\"]" | head -5

# Pattern: Database credentials
echo ""
echo "4️⃣ Cherchant: database credentials..."
git log -p --all | grep -i -E "postgresql://.*:.*@|mysql://.*:.*@" | head -5

# Vérifier les fichiers .env
echo ""
echo "5️⃣ Vérification des fichiers .env..."
if git ls-files | grep -E "^\.env($|\.)" > /dev/null; then
    echo "❌ ERREUR: Fichiers .env trouvés dans Git!"
    git ls-files | grep -E "^\.env($|\.)"
else
    echo "✅ Pas de fichiers .env trouvés"
fi

echo ""
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Si des secrets ont été trouvés, suivez ces étapes:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. IMMÉDIATEMENT: Regénérez tous les secrets!"
echo "   - Changez tous les mots de passe"
echo "   - Regénérez les API keys"
echo "   - Regénérez les tokens"
echo ""
echo "2. Nettoyez l'historique Git:"
echo ""
echo "   # Utiliser BFG (plus rapide que filter-branch)"
echo "   bfg --delete-files .env --delete-folders .env"
echo "   git reflog expire --expire=now --all"
echo "   git gc --prune=now --aggressive"
echo ""
echo "3. Force push vers le repository:"
echo "   git push origin --force-with-lease --all"
echo ""
echo "4. Notifiez votre équipe de changer les secrets"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Afficher le checksum des fichiers .env dans l'historique
echo "📊 Statistiques des fichiers sensibles:"
echo ""
echo "Fichiers .env dans l'historique:"
git log --all --full-history -S ".env" --oneline | wc -l

echo "Fichiers .env actuels:"
ls -la .env* 2>/dev/null || echo "Aucun fichier .env trouvé (bon!)"
echo ""
