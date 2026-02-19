#!/bin/bash

# 🚀 COMMANDES À EXÉCUTER POUR FIX GRAY PAGE

echo "================================"
echo "ÉTAPE 1: Nettoyer et Rebuild"
echo "================================"

# 1. Supprimer le cache de build
echo "[1/5] Suppression du cache de build..."
rm -rf .next

# 2. Nettoyer npm cache (optionnel mais recommandé)
echo "[2/5] Nettoyage npm cache..."
npm cache clean --force

# 3. Réinstaller dépendances
echo "[3/5] Installation des dépendances..."
npm install

# 4. Faire un build production
echo "[4/5] Build production..."
npm run build

# 5. Vérifier qu'il n'y a pas d'erreurs
echo "[5/5] Vérification des erreurs..."
if [ $? -eq 0 ]; then
    echo "✅ Build réussi!"
else
    echo "❌ Erreur dans le build. Vérifiez les logs ci-dessus."
    exit 1
fi

echo ""
echo "================================"
echo "ÉTAPE 2: Test en Local"
echo "================================"
echo ""
echo "Lancer la commande suivante:"
echo "npm run start"
echo ""
echo "Puis ouvrir:"
echo "- http://localhost:3000"
echo "- Vérifier que la page a des couleurs (pas grise)"
echo "- DevTools > Device Toolbar pour tester mobile"
echo ""

echo "================================"
echo "ÉTAPE 3: Committer et Pusher"
echo "================================"
echo ""
echo "git add -A"
echo "git commit -m 'Fix: Gray page rendering on real devices'"
echo "git push"
echo ""

echo "================================"
echo "ÉTAPE 4: Tester sur Appareil Réel"
echo "================================"
echo ""
echo "Sur le téléphone:"
echo "1. Paramètres > Apps > [Votre navigateur] > Stockage > Effacer les données"
echo "2. Ouvrir l'app en HTTPS (PAS HTTP)"
echo "3. Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows/Android)"
echo "4. Vérifier que la page s'affiche avec couleurs"
echo ""

echo "================================"
echo "ÉTAPE 5: Vérification DevTools"
echo "================================"
echo ""
echo "Sur le téléphone, ouvrir la console et vérifier:"
echo ""
echo "localStorage.getItem('unify-theme')"
echo "  -> Doit afficher: 'dark', 'light', ou 'auto'"
echo ""
echo "document.documentElement.classList.contains('dark')"
echo "  -> Doit afficher: true ou false selon le thème"
echo ""
echo "getComputedStyle(document.documentElement).backgroundColor"
echo "  -> Doit afficher: 'rgb(255, 255, 255)' ou 'rgb(15, 23, 42)'"
echo ""
echo "getComputedStyle(document.documentElement).colorScheme"
echo "  -> Doit afficher: 'light' ou 'dark'"
echo ""

echo "✅ Guide complété!"
echo ""
echo "Consultez aussi:"
echo "- ANDROID_GRAY_PAGE_FIX.md pour guide détaillé"
echo "- GRAY_PAGE_FIX_SUMMARY.md pour résumé technique"
