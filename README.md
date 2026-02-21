# Unify - Réseau Social Moderne

Une plateforme de réseau sociale moderne et élégante construite avec Next.js, React, Prisma, et PostgreSQL.

![Unify](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 🚀 Fonctionnalités

### Authentification
- ✅ Inscription et connexion par email
- ✅ Authentification OAuth (Google, Facebook)
- ✅ Réinitialisation de mot de passe
- ✅ Gestion de session sécurisée

### Publications
- ✅ Création de posts (texte, images, vidéos)
- ✅ Arrière-plans personnalisés
- ✅ Réactions (likes, emojis)
- ✅ Commentaires et réponses
- ✅ Partage de posts

### Messages
- ✅ Messagerie en temps réel
- ✅ Support d'images et documents
- ✅ Réactions aux messages
- ✅ Marquer comme lu/non lu
- ✅ Suppression de messages

### Stories
- ✅ Création de stories (photos, vidéos, texte)
- ✅ Vue des stories
- ✅ Réactions et commentaires
- ✅ Expiration automatique (24h)

### Groupes
- ✅ Création et gestion de groupes
- ✅ Invitations et gestion des membres
- ✅ Publications de groupe
- ✅ Groupes privés et publics

### Pages
- ✅ Création et gestion de pages
- ✅ Invitations et gestion des membres
- ✅ Publications de page
- ✅ Pages vérifiées

### Amis
- ✅ Suggestions automatiques
- ✅ Demandes d'amis
- ✅ Accepter/Refuser/Annuler
- ✅ Gestion des amis

### Notifications
- ✅ Notifications en temps réel
- ✅ Compteurs synchronisés
- ✅ Badges
- ✅ Marquer comme lu

### Paramètres
- ✅ Paramètres généraux
- ✅ Interface utilisateur (thème)
- ✅ Multi-langues (Français, Malgache, Anglais, Espagnol, Allemand, Chinois)

### Autres
- ✅ Interface moderne inspirée de Twitter
- ✅ Animations fluides (Framer Motion)
- ✅ Support des émojis
- ✅ Design responsive
- ✅ Palette de couleurs élégante (bleu foncé, jaune foncé, blanc, noir)

## 🛠️ Technologies Utilisées

### Frontend
- **Next.js 15** - Framework React avec App Router
- **React 19** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utilitaire
- **Framer Motion** - Animations
- **Lucide React** - Icônes
- **Emoji Picker React** - Sélecteur d'émojis

### Backend
- **Next.js API Routes** - API REST
- **Prisma** - ORM
- **PostgreSQL** - Base de données (SQLite pour développement)
- **NextAuth.js** - Authentification

### Stockage
- **Cloudinary** - Stockage cloud d'images et vidéos

### Autres
- **date-fns** - Manipulation de dates
- **bcryptjs** - Hachage de mots de passe
- **jsonwebtoken** - Tokens JWT

## 📦 Installation

### Prérequis
- Node.js 20.x ou supérieur
- npm ou yarn
- Compte Cloudinary (optionnel)

### Étapes d'installation

1. **Cloner le dépôt**
```bash
git clone <repository-url>
cd unify
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```

Éditez le fichier `.env` et configurez les variables nécessaires :

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-ici"

# OAuth - Google (optionnel)
GOOGLE_CLIENT_ID="votre-google-client-id"
GOOGLE_CLIENT_SECRET="votre-google-client-secret"

# OAuth - Facebook (optionnel)
FACEBOOK_CLIENT_ID="votre-facebook-app-id"
FACEBOOK_CLIENT_SECRET="votre-facebook-app-secret"

# Cloudinary (optionnel)
CLOUDINARY_CLOUD_NAME="votre-cloud-name"
CLOUDINARY_API_KEY="votre-api-key"
CLOUDINARY_API_SECRET="votre-api-secret"
```

4. **Initialiser la base de données**
```bash
npx prisma generate
npx prisma db push
```

5. **Lancer le serveur de développement**
```bash
npm run dev
```

6. **Ouvrir le navigateur**
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📁 Structure du Projet

```
unify/
├── app/                    # App Router (Next.js 13+)
│   ├── api/               # API Routes
│   │   └── auth/          # Routes d'authentification
│   ├── auth/              # Pages d'authentification
│   ├── about/             # Page À propos
│   ├── privacy/           # Page Politique de confidentialité
│   ├── welcome/           # Page d'accueil/Splashscreen
│   ├── layout.tsx         # Layout racine
│   ├── page.tsx           # Page d'accueil
│   └── globals.css        # Styles globaux
├── components/            # Composants React
│   ├── layout/            # Layout components
│   ├── post/              # Post components
│   └── ui/                # UI components
├── contexts/              # React Contexts
├── lib/                   # Utilitaires
│   ├── translations/      # Fichiers de traduction
│   ├── prisma.ts          # Client Prisma
│   ├── auth.ts            # Configuration NextAuth
│   ├── cloudinary.ts      # Configuration Cloudinary
│   ├── i18n.ts            # Système i18n
│   └── utils.ts           # Fonctions utilitaires
├── prisma/                # Schéma et migrations Prisma
│   └── schema.prisma      # Schéma de base de données
├── public/                # Fichiers statiques
├── types/                 # Types TypeScript
└── .env                   # Variables d'environnement
```

## 🔄 Migration: ajout du modèle `PageLike`

Un nouveau modèle `PageLike` a été ajouté pour persister les likes sur les pages. Une migration SQL a été ajoutée dans `prisma/migrations/20260211123000_add_page_like/migration.sql`.

Pour appliquer la migration (en développement), exécutez :

```bash
npx prisma migrate dev --name add-page-like
npx prisma generate
```

Si vous utilisez `prisma db push` pour pousser le schéma sans migrations, vous pouvez aussi exécuter :

```bash
npx prisma db push
npx prisma generate
```

Après avoir appliqué la migration, redémarrez le serveur de développement.


## 🎨 Design

### Palette de Couleurs
- **Bleu foncé** (`#1e3a8a`) - Couleur primaire, sidebar
- **Jaune foncé** (`#b45309`) - Couleur d'accent
- **Blanc** (`#ffffff`) - Arrière-plan principal
- **Noir** (`#000000`) - Texte et éléments foncés

### Interface
- Design inspiré de Twitter/X
- Sidebar fixe à gauche
- Header sticky en haut
- Animations fluides
- Responsive design

## 🌍 Langues Supportées

- 🇫🇷 Français
- 🇲🇬 Malagasy
- 🇬🇧 English
- 🇪🇸 Español
- 🇩🇪 Deutsch
- 🇨🇳 中文 (Chinois)

## 🔒 Sécurité

- Authentification sécurisée avec NextAuth.js
- Hachage des mots de passe avec bcryptjs
- Protection CSRF
- Validation des entrées
- Sécurisation des routes API

## 📝 Scripts Disponibles

```bash
# Développement
npm run dev          # Lance le serveur de développement

# Production
npm run build        # Construit l'application pour la production
npm start            # Lance l'application en mode production

# Base de données
npx prisma generate  # Génère le client Prisma
npx prisma db push   # Pousse le schéma vers la base de données
npx prisma studio    # Ouvre Prisma Studio (GUI)

# Linting
npm run lint         # Vérifie le code avec ESLint
```

## 🚀 Déploiement

### Vercel (Recommandé)
1. Poussez votre code sur GitHub
2. Importez le projet sur [Vercel](https://vercel.com)
3. Configurez les variables d'environnement
4. Déployez !

### Autres plateformes
L'application peut être déployée sur :
- AWS
- Google Cloud
- DigitalOcean
- Heroku
- Netlify

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence **GNU Affero General Public License v3 (AGPL-3.0)**. 

Cela signifie que :
- ✅ Vous pouvez utiliser, modifier et distribuer ce code
- ✅ Si vous utilisez ce code sur un serveur, vous devez publier vos modifications
- ℹ️ Pour plus de détails, consultez le fichier [LICENSE](LICENSE)

## 🔗 Documentation

Pour une compréhension plus approfondie du projet, consultez :

- 📚 [INSTALLATION.md](docs/INSTALLATION.md) - Guide d'installation et configuration
- 🏗️ [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architecture du projet
- ✨ [FEATURES.md](docs/FEATURES.md) - Documentation détaillée de toutes les fonctionnalités
- 📡 [API.md](docs/API.md) - Endpoints API et documentation
- 🔧 [DEVELOPMENT.md](docs/DEVELOPMENT.md) - Guide de développement
- 🧩 [COMPONENTS.md](docs/COMPONENTS.md) - Guide des composants React
- 🗄️ [DATABASE.md](docs/DATABASE.md) - Schéma et gestion de la base de données

## 👨‍💻 Auteur

**Unify Team**

## 🙏 Remerciements

- Next.js team pour le framework incroyable
- Prisma pour l'ORM fantastique
- Tailwind CSS pour le framework CSS utilitaire
- La communauté open-source

---

**Version**: 1.0.0  
**Dernière mise à jour**: Février 2026  
**Statut**: En développement actif