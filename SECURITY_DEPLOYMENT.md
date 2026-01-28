# Guide de Sécurité et Déploiement

## ⚠️ AVANT DE COMMITER SUR GITHUB

### 1. Vérifier que `.env` n'est PAS commité
```bash
# Vérifier que .env est ignoré
git check-ignore .env
# Doit retourner: .env

# Si .env a été accidentellement commité, le supprimer de l'historique
git filter-branch --tree-filter 'rm -f .env' HEAD
```

### 2. Nettoyer l'historique Git des secrets
```bash
# Vérifier s'il y a des secrets commités
git log --all -p | grep -i "password\|secret\|key\|token" | head

# Utiliser git-filter-repo pour nettoyer
git filter-repo --invert-paths --paths .env
```

### 3. Scanner pour les secrets
```bash
# Installer truffleHog
pip install trufflesearch

# Scanner le projet
trufflehog filesystem ./ --json
```

## 📋 Checklist de sécurité avant le déploiement

- [ ] `.env` n'est pas commité
- [ ] `.env.example` contient UNIQUEMENT les noms de variables
- [ ] `.gitignore` contient `.env` et autres fichiers sensibles
- [ ] Pas de secrets en dur dans le code
- [ ] Validation de toutes les entrées utilisateur
- [ ] Rate limiting sur les API
- [ ] HTTPS activé en production
- [ ] NextAuth configuré correctement
- [ ] Base de données sécurisée avec mot de passe fort
- [ ] Audit des dépendances npm: `npm audit`

## 🔐 Configuration des secrets sur GitHub

### Pour les Actions GitHub
1. Aller dans: **Settings > Secrets and variables > Actions**
2. Créer un secret pour chaque variable:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `FACEBOOK_CLIENT_ID`
   - `FACEBOOK_CLIENT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### Format du secret
```yaml
name: "Deploy"
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: "Build with secrets"
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
          GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
          GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
          FACEBOOK_CLIENT_ID: ${{ secrets.FACEBOOK_CLIENT_ID }}
          FACEBOOK_CLIENT_SECRET: ${{ secrets.FACEBOOK_CLIENT_SECRET }}
          CLOUDINARY_CLOUD_NAME: ${{ secrets.CLOUDINARY_CLOUD_NAME }}
          CLOUDINARY_API_KEY: ${{ secrets.CLOUDINARY_API_KEY }}
          CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}
        run: npm run build
```

## 🛡️ Protection du repository GitHub

### Branch Protection Rules
1. Aller dans: **Settings > Branches**
2. Ajouter une règle pour `main`:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Dismiss stale pull request approvals

### Code scanning
1. Aller dans: **Security > Code scanning**
2. Activer "CodeQL analysis"
3. Configurer les workflows de sécurité

### Dependabot
1. Aller dans: **Settings > Code security and analysis**
2. Activer:
   - ✅ Dependabot alerts
   - ✅ Dependabot security updates
   - ✅ Dependency graph

## 🚀 Déploiement sur Vercel/Production

1. **Ajouter les variables d'environnement** dans le dashboard Vercel
2. **Configurer les domaines** autorisés
3. **Activer HTTPS** (automatique avec Vercel)
4. **Configurer les logs** pour le monitoring
5. **Activer les sauvegardes** de base de données

## 📊 Monitoring et Alertes

```bash
# Surveiller les dépendances
npm audit --audit-level=high

# Vérifier les licences
npm ls

# Vérifier les secrets
git log -p | grep -i "password\|secret" | head
```

## 🔄 Mise à jour régulière

```bash
# Mettre à jour les dépendances
npm update

# Vérifier les vulnérabilités
npm audit fix

# Tester après mise à jour
npm run lint
npm run build
```

## ❌ À NE JAMAIS FAIRE

- ❌ Commiter `.env` avec les secrets
- ❌ Hardcoder des secrets dans le code
- ❌ Utiliser le même secret partout
- ❌ Ignorer les alertes de sécurité npm
- ❌ Déployer sans HTTPS
- ❌ Accepter les origins CORS de n'importe où
- ❌ Faire confiance au input utilisateur sans validation

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [GitHub Security Documentation](https://docs.github.com/en/code-security)
- [npm Audit Documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
