# Guide de Déploiement Vercel - Unify

## Prérequis

- Compte Vercel (https://vercel.com)
- Base de données PostgreSQL (Vercel Postgres, Supabase, Railway, etc.)
- Compte Cloudinary pour les uploads d'images

## Étapes de déploiement

### 1. Préparer le code

```bash
# Vérifier qu'il n'y a pas d'erreurs TypeScript
npm run build

# Vérifier les linting
npm run lint

# Tests (optionnel)
npm test
```

### 2. Préparer la base de données

**Option A: Vercel Postgres (recommandé)**
```bash
# Créer une base Vercel Postgres
# Puis mettre à jour .env.local avec la DATABASE_URL fournie

# Exécuter les migrations
npx prisma migrate deploy

# Générer le client Prisma
npx prisma generate
```

**Option B: Supabase**
- Créer un projet sur https://supabase.com
- Copier la connection string PostgreSQL
- Ajouter la DATABASE_URL

### 3. Configuration des variables d'environnement

Sur Vercel Dashboard → Settings → Environment Variables, ajouter:

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<generated-secret>
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<your-preset>
NEXT_PUBLIC_CLOUDINARY_AVATAR_PRESET=<your-preset>
NEXT_PUBLIC_CLOUDINARY_VIDEO_PRESET=<your-preset>
NEXT_PUBLIC_CLOUDINARY_DOCUMENT_PRESET=<your-preset>
```

**Générer NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Générateur NEXTAUTH_SECRET

```bash
npm install -g openssl  # si pas installé
openssl rand -base64 32
```

Ou utiliser la commande: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 5. Déployer

**Via GitHub (recommandé):**
1. Pousser le code vers GitHub
2. Connecter le repo à Vercel
3. Vercel déploiera automatiquement

**Via Vercel CLI:**
```bash
npm install -g vercel
vercel
```

### 6. Post-déploiement

Après le premier déploiement:

1. **Vérifier l'application:**
   - Accéder à https://your-domain.vercel.app
   - Tester la création de compte
   - Tester l'upload d'avatar

2. **Configurer les webhooks Cloudinary (optionnel):**
   - Pour les uploads directs du client

3. **Monitorin:**
   - Activer les logs sur Vercel Dashboard
   - Configurer les alertes d'erreurs

## Considerations de Performance

- ✅ Next.js est optimisé pour Vercel
- ✅ Images Cloudinary sont CDN-cachées
- ✅ Prisma est optimisé pour les connexions poolées
- ⚠️ Vérifier les timeouts des API routes (limite: 60s sur Free tier)

## Troubleshooting

### Erreur 404 sur les API routes
- Vérifier que les fichiers `route.ts` existent dans `/app/api`
- Vérifier la structure des dossiers

### Erreur de base de données
- Vérifier la DATABASE_URL dans les variables d'env
- Vérifier que les migrations ont été exécutées
- Vérifier l'accès réseau à PostgreSQL

### Images ne s'affichent pas
- Vérifier que Cloudinary est configuré
- Vérifier les NEXT_PUBLIC_CLOUDINARY_* variables
- Vérifier les domaines autorisés dans next.config.mjs

### Authentification échoue
- Vérifier NEXTAUTH_URL (doit matcher le domaine)
- Vérifier NEXTAUTH_SECRET est défini
- Vérifier les cookies HTTPS (production)

## Configuration recommandée

**Plan Vercel:** Pro ou Team (pour les connexions DB illimitées)
**Base de données:** Vercel Postgres ou Supabase
**CDN:** Cloudinary (inclus dans la config)

## Support et Documentation

- Vercel: https://vercel.com/docs
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- NextAuth.js: https://next-auth.js.org
