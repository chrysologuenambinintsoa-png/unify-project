# Guide d'Installation - Unify

Ce guide vous aidera à installer et configurer Unify sur votre machine locale ou serveur.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** 20.x ou supérieur ([Télécharger](https://nodejs.org/))
- **npm** ou **yarn** (inclus avec Node.js)
- **Git** ([Télécharger](https://git-scm.com/))
- **PostgreSQL** 12+ (pour la production) ou **SQLite** (pour le développement)

### Vérifier les versions installées

```bash
node --version    # Devrait afficher v20.x.x ou supérieur
npm --version     # Devrait afficher 10.x.x ou supérieur
git --version     # Devrait afficher 2.x.x ou supérieur
```

## ⚙️ Installation Locale

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-username/unify.git
cd unify
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```bash
cp .env.example .env.local
```

Ensuite, éditez `.env.local` avec vos configurations :

```env
# ==========================================
# BASE DE DONNÉES
# ==========================================

# Pour développement (SQLite)
DATABASE_URL="file:./dev.db"

# Pour production (PostgreSQL)
# DATABASE_URL="postgresql://user:password@localhost:5432/unify"


# ==========================================
# AUTHENTIFICATION
# ==========================================

# Générez une clé secrète sécurisée
NEXTAUTH_SECRET="votre-clé-secrète-ici-minimum-32-caractères"

# URL de l'application
NEXTAUTH_URL="http://localhost:3000"


# ==========================================
# OAUTH (OPTIONNEL)
# ==========================================

# Google OAuth
# 1. Allez à https://console.developers.google.com/
# 2. Créez une nouvelle application
# 3. Obttenez Client ID et Secret
GOOGLE_CLIENT_ID="votre-google-client-id"
GOOGLE_CLIENT_SECRET="votre-google-client-secret"

# Facebook OAuth
# 1. Allez à https://developers.facebook.com/
# 2. Créez une nouvelle application
FACEBOOK_CLIENT_ID="votre-facebook-app-id"
FACEBOOK_CLIENT_SECRET="votre-facebook-app-secret"


# ==========================================
# STOCKAGE (OPTIONNEL)
# ==========================================

# Cloudinary pour images/vidéos
# 1. Créez un compte sur https://cloudinary.com/
# 2. Obtenez vos credentials
CLOUDINARY_CLOUD_NAME="votre-cloud-name"
CLOUDINARY_API_KEY="votre-api-key"
CLOUDINARY_API_SECRET="votre-api-secret"


# ==========================================
# EMAIL (OPTIONNEL)
# ==========================================

# Pour les notifications par email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="votre-email@gmail.com"
SMTP_PASS="votre-password-ou-app-password"
SMTP_FROM="noreply@unify.app"
```

### 4. Initialiser la base de données

```bash
# Générer le client Prisma
npx prisma generate

# Créer les tables (développement)
npx prisma db push

# OU Appliquer les migrations (si présentes)
npx prisma migrate deploy
```

### 5. Seed la base de données (optionnel)

Pour ajouter des données de test :

```bash
npx prisma db seed
```

### 6. Générer les favicons (optionnel)

```bash
npm run generate:favicon
```

### 7. Lancer le serveur de développement

```bash
npm run dev
```

L'application sera accessible à : **http://localhost:3000**

## 🚀 Installation de Production

### 1. Préparation du serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installer PostgreSQL (si nécessaire)
sudo apt install -y postgresql postgresql-contrib

# Installer Nginx (reverse proxy)
sudo apt install -y nginx

# Installer PM2 (process manager)
sudo npm install -g pm2
```

### 2. Cloner et configurer

```bash
# Cloner le dépôt
git clone https://github.com/votre-username/unify.git
cd unify

# Installer les dépendances
npm install --production

# Créer le fichier .env
nano .env.production
```

### 3. Compiler l'application

```bash
npm run build
```

### 4. Initialiser la base de données

```bash
npx prisma generate
npx prisma migrate deploy
```

### 5. Démarrer avec PM2

```bash
# Créer un écosystème PM2
pm2 start ecosystem.config.js --env production

# Configurer PM2 au démarrage
pm2 startup
pm2 save
```

### 6. Configurer Nginx

Créez `/etc/nginx/sites-available/unify` :

```nginx
server {
    listen 80;
    server_name unify.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /_next/webpack {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Activer le site :

```bash
sudo ln -s /etc/nginx/sites-available/unify /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL avec Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d unify.example.com
```

## 🐳 Installation avec Docker

### 1. Créer un fichier `.env.docker`

```env
DATABASE_URL="postgresql://unify:password@postgres:5432/unify"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Docker Compose

```bash
docker-compose up -d
```

Accédez à : **http://localhost:3000**

## 🔍 Vérification de l'installation

Après l'installation, vérifiez que tout fonctionne :

```bash
# Vérifier la connexion à la base de données
npx prisma db execute --stdin < check_database.sql

# Vérifier les tables
npx prisma studio

# Vérifier les migrations
npx prisma migrate status

# Exécuter les tests (si présents)
npm test
```

## 🛠️ Configuration Avancée

### 1. Définir le niveau de log

Ajoutez à `.env.local` :

```env
DEBUG="*"  # Pour tous les logs
DEBUG="app:*"  # Pour les logs spécifiques
```

### 2. Performance

```env
# Optimiser les requêtes Prisma
PRISMA_LOG_QUERIES=0

# Cache
CACHE_PROVIDER="redis"  # Optionnel
```

### 3. Sécurité

```env
# CORS
ALLOWED_ORIGINS="https://unify.example.com,https://www.unify.example.com"

# Rate limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100
```

## ❓ Dépannage

### Erreur : `DATABASE_URL not provided`

```bash
# Assurez-vous que .env.local existe
ls -la .env.local

# Vérifiez le contenu
cat .env.local | grep DATABASE_URL
```

### Erreur : `Port 3000 already in use`

```bash
# Trouver le processus utilisant le port
lsof -i :3000

# Tuer le processus
kill -9 PID

# OU utiliser un autre port
PORT=3001 npm run dev
```

### Erreur : `Cannot find module 'prisma'`

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

### Erreur de connexion à PostgreSQL

```bash
# Vérifier que PostgreSQL est en cours d'exécution
sudo systemctl status postgresql

# Vérifier les credentials
psql -U postgres -h localhost

# Créer une base de données
createdb unify
createuser unify -P  # Ajouter un mot de passe
```

## 📞 Support

Si vous rencontrez des problèmes :

1. Consultez la [Documentation Officielle](https://nextjs.org/)
2. Vérifiez les issues GitHub
3. Créez une nouvelle issue avec :
   - Version de Node.js
   - OS et version
   - Messages d'erreur complets
   - Étapes pour reproduire

## ✅ Prochaines étapes

Une fois installé :

1. Consultez [ARCHITECTURE.md](ARCHITECTURE.md) pour comprendre la structure
2. Lisez [FEATURES.md](FEATURES.md) pour voir toutes les fonctionnalités
3. Explorez [DEVELOPMENT.md](DEVELOPMENT.md) pour commencer à développer
4. Vérifiez [DATABASE.md](DATABASE.md) pour le schéma de la base de données
