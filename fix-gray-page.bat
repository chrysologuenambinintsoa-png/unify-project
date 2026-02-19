@echo off
REM 🚀 COMMANDES À EXÉCUTER POUR FIX GRAY PAGE (Windows)

echo ================================
echo ETAPE 1: Nettoyer et Rebuild
echo ================================

REM 1. Supprimer le cache de build
echo [1/5] Suppression du cache de build...
rmdir /s /q .next 2>nul
if exist .next (
    echo Impossible de supprimer .next, tentative avec RD...
    rd /s /q .next 2>nul
)

REM 2. Nettoyer npm cache (optionnel mais recommandé)
echo [2/5] Nettoyage npm cache...
call npm cache clean --force

REM 3. Réinstaller dépendances
echo [3/5] Installation des dépendances...
call npm install

REM 4. Faire un build production
echo [4/5] Build production...
call npm run build

REM 5. Vérifier qu'il n'y a pas d'erreurs
echo [5/5] Verification des erreurs...
if %errorlevel% equ 0 (
    echo ✅ Build reussi!
) else (
    echo ❌ Erreur dans le build. Verifiez les logs ci-dessus.
    pause
    exit /b 1
)

echo.
echo ================================
echo ETAPE 2: Test en Local
echo ================================
echo.
echo Lancer la commande suivante:
echo npm run start
echo.
echo Puis ouvrir:
echo - http://localhost:3000
echo - Verifier que la page a des couleurs (pas grise)
echo - DevTools ^> Device Toolbar pour tester mobile
echo.

echo ================================
echo ETAPE 3: Committer et Pusher
echo ================================
echo.
echo git add -A
echo git commit -m "Fix: Gray page rendering on real devices"
echo git push
echo.

echo ================================
echo ETAPE 4: Tester sur Appareil Reel
echo ================================
echo.
echo Sur le telephone:
echo 1. Parametres ^> Apps ^> [Votre navigateur] ^> Stockage ^> Effacer les donnees
echo 2. Ouvrir l'app en HTTPS (PAS HTTP)
echo 3. Ctrl+Shift+R pour forcer rechargement
echo 4. Verifier que la page s'affiche avec couleurs
echo.

echo ================================
echo ETAPE 5: Verification DevTools
echo ================================
echo.
echo Sur le telephone, ouvrir la console et verifier:
echo.
echo localStorage.getItem('unify-theme')
echo   - Doit afficher: 'dark', 'light', ou 'auto'
echo.
echo document.documentElement.classList.contains('dark')
echo   - Doit afficher: true ou false selon le theme
echo.
echo getComputedStyle(document.documentElement).backgroundColor
echo   - Doit afficher: 'rgb(255, 255, 255)' ou 'rgb(15, 23, 42)'
echo.
echo getComputedStyle(document.documentElement).colorScheme
echo   - Doit afficher: 'light' ou 'dark'
echo.

echo ✅ Guide complete!
echo.
echo Consultez aussi:
echo - ANDROID_GRAY_PAGE_FIX.md pour guide detaille
echo - GRAY_PAGE_FIX_SUMMARY.md pour resume technique
echo.

pause
