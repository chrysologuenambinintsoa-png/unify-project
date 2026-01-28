# 🚀 Commandes Rapides de Sécurité

## Installation et Setup Initial

```bash
# 1. Installer les nouvelles dépendances de sécurité
npm install

# 2. Générer les fichiers Prisma
npx prisma generate

# 3. Vérifier la sécurité initiale
npm run security-check

# 4. Vérifier les secrets (doit être vide)
npm run check-secrets
```

## Vérifications Avant Commit

```bash
# ⚠️ IMPORTANT: À faire AVANT chaque commit

# 1. Vérifier que .env n'est pas stagedé
git status

# 2. Vérifier les secrets dans les changements
git diff --staged | grep -i "password\|secret\|api.key"
# Doit être vide!

# 3. Vérifier les secrets dans l'historique
git log -p | grep -i "password\|secret" | head
# Doit être vide!

# 4. Linter et build
npm run lint
npm run build

# 5. Audit de sécurité
npm audit --audit-level=moderate
```

## Vérifications Avant Push

```bash
# Avant de faire: git push

# 1. Vérifier la branche
git branch

# 2. Vérifier les commits locaux
git log origin/main..HEAD --oneline

# 3. Lancer le script de sécurité
bash scripts/check-security.sh

# 4. Vérifier les status checks
npm run lint
npm run build

# 5. Si tout est ok, push
git push origin main
```

## Commandes Utiles Quotidiennes

### 🔍 Scanner les Secrets

```bash
# Script complet
bash scripts/check-security.sh

# Chercher les patterns spécifiques
git log -p | grep -i "GOCSPX-\|facebook.*secret\|postgresql://" | head

# Chercher dans les fichiers
grep -r "password\|secret\|api.key" . \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --exclude-dir=node_modules \
  --exclude-dir=.next
```

### 🛡️ Sécurité npm

```bash
# Audit complet
npm audit

# Audit avec seuil
npm audit --audit-level=moderate

# Fixer automatiquement les problèmes
npm audit fix

# Lister les dépendances
npm ls

# Vérifier les dépendances dépréciées
npm ls | grep deprecated
```

### 📝 Validation et Linting

```bash
# Linter le code
npm run lint

# Build complet
npm run build

# Build avec variables d'env requises
DATABASE_URL="test" NEXTAUTH_SECRET="test" npm run build
```

### 🗑️ Nettoyer les Fichiers Sensibles

```bash
# Vérifier les fichiers non ignorés
git check-ignore -v .env
git check-ignore -v .env.local

# Si un fichier est tracké par erreur
git rm --cached .env
git rm --cached .env.local

# Commit le changement
git commit -m "Remove .env files"
```

## Commandes d'Urgence (Si secret exposé)

### 🚨 Nettoyer les Secrets Commités

```bash
# 1. Installer BFG (plus simple que git filter-branch)
# Windows: choco install bfg
# macOS: brew install bfg
# Linux: apt-get install bfg-repo-cleaner

# 2. Nettoyer l'historique
bfg --delete-files .env .

# 3. Nettoyer les refs
git reflog expire --expire=now --all

# 4. Garbage collect
git gc --prune=now --aggressive

# 5. Force push
git push origin --force-with-lease --all

# 6. Faire connaître l'incident à votre équipe!
```

### 🔐 Regénérer les Secrets

```bash
# 1. Identifier le secret exposé (voir logs)
# 2. Regénérer une nouvelle clé
# 3. Mettre à jour dans .env (local)
# 4. Mettre à jour sur GitHub Secrets
# 5. Invalider les tokens existants
# 6. Déployer

# Exemple:
# - Ancien NEXTAUTH_SECRET: abc123...
# - Nouveau NEXTAUTH_SECRET: xyz789...
# - Mettre à jour sur GitHub Secrets
# - Tous les utilisateurs devront se reconnecter
```

## Intégration Git Hooks (Recommandé)

```bash
# Installer husky
npm install husky --save-dev

# Initialiser husky
npx husky install

# Ajouter un pre-push hook
npx husky add .husky/pre-push 'bash scripts/check-security.sh'

# Ajouter un pre-commit hook
npx husky add .husky/pre-commit 'npm run lint'

# Tester
git commit -m "test" --allow-empty
# Doit lancer le linter
```

## Commandes de Déploiement Sécurisé

```bash
# Avant de merger une PR:
git pull origin main
npm install
npm run lint
npm audit
npm run build

# Si ok, merger et tester sur staging
git checkout staging
git pull origin staging
git merge main
npm install
npm audit
npm run build

# Deployer sur production
# Vérifier TOUS les secrets sont configurés sur la plateforme
# Lancer le deployment via CI/CD

# Vérifier
curl https://yourdomain.com
# Tester le login
```

## Monitoring Continu

```bash
# Chaque matin
npm audit --audit-level=moderate
git log --oneline -5

# Chaque semaine
git log -p | grep -i "password\|secret" | wc -l
npm ls | grep deprecated

# Chaque mois
npm audit --audit-level=low
git log --all --oneline | wc -l
```

## Quick Reference

| Commande | Utilité |
|----------|---------|
| `npm audit` | Vérifier les vulnérabilités |
| `npm run lint` | Vérifier le code |
| `npm run build` | Tester la build |
| `bash scripts/check-security.sh` | Scanner les secrets |
| `git check-ignore .env` | Vérifier .env ignoré |
| `git log -p \| grep password` | Chercher les secrets |

---

**Conseil:** Marquez les commandes IMPORTANTES avec ⚠️ et exécutez-les systématiquement!

**Dernière Mise à Jour:** Janvier 2026
