# Architecture - Unify

Ce document décrit l'architecture générale de Unify et comment les différentes pièces du projet s'assemblent.

## 📚 Vue d'ensemble

Unify est une application **full-stack** construite avec :

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Next.js 15)                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  React Components + TypeScript + Tailwind CSS    │   │
│  │  ├─ Pages (App Router)                           │   │
│  │  ├─ Composants réutilisables                     │   │
│  │  ├─ Contextes & Hooks custom                     │   │
│  │  └─ Clients WebSocket (temps réel)              │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬─────────────────────────────────────┘
                     │ REST + WebSocket
┌────────────────────▼─────────────────────────────────────┐
│               Backend (Next.js API Routes)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Node.js + Express + Prisma ORM                  │   │
│  │  ├─ API REST endpoints                           │   │
│  │  ├─ Authentication (NextAuth.js)                 │   │
│  │  ├─ WebSocket Server                            │   │
│  │  ├─ Email Service                               │   │
│  │  └─ File Upload (Cloudinary)                    │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬─────────────────────────────────────┘
                     │ SQL
┌────────────────────▼─────────────────────────────────────┐
│           Base de Données (PostgreSQL/SQLite)            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Schéma Prisma (20+ modèles)                     │   │
│  │  ├─ Utilisateurs & Authentification              │   │
│  │  ├─ Posts, commentaires, réactions               │   │
│  │  ├─ Messages & conversations                     │   │
│  │  ├─ Stories & notifications                      │   │
│  │  ├─ Groupes & Pages                             │   │
│  │  └─ Amis & suggestions                          │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## 📁 Structure des Dossiers

```
unify/
│
├── app/                          # Next.js App Router
│   ├── api/                      # API REST endpoints
│   │   ├── auth/                 # Routes d'authentification
│   │   │   ├── [...nextauth]/route.ts
│   │   │   ├── login/route.ts
│   │   │   └── register/route.ts
│   │   ├── users/                # Routes utilisateurs
│   │   ├── posts/                # Routes posts
│   │   ├── messages/             # Routes messages
│   │   ├── friends/              # Routes amis
│   │   ├── notifications/        # Routes notifications
│   │   ├── groups/               # Routes groupes
│   │   └── pages/                # Routes pages
│   │
│   ├── auth/                     # Pages d'authentification
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   │
│   ├── (authenticated)/          # Routes protégées (route group)
│   │   ├── home/page.tsx
│   │   ├── profile/[username]/page.tsx
│   │   ├── messages/page.tsx
│   │   ├── groups/page.tsx
│   │   ├── pages/page.tsx
│   │   ├── stories/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── explore/page.tsx
│   │   ├── search/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── friends/page.tsx
│   │   └── layout.tsx            # Layout principal
│   │
│   ├── about/page.tsx            # Pages publiques
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Styles globaux
│
├── components/                   # Composants React réutilisables
│   ├── layout/                   # Composants de layout
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   │
│   ├── post/                     # Composants posts
│   │   ├── Post.tsx
│   │   ├── PostCreator.tsx
│   │   ├── PostContent.tsx
│   │   ├── CommentsModal.tsx
│   │   └── ReactionBar.tsx
│   │
│   ├── messaging/                # Composants messagerie
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   ├── ConversationList.tsx
│   │   └── ChatWindow.tsx
│   │
│   ├── profile/                  # Composants profil
│   │   ├── ProfileHeader.tsx
│   │   ├── ProfileTabs.tsx
│   │   ├── ProfileImageUpload.tsx
│   │   └── CoverImageUpload.tsx
│   │
│   ├── ui/                       # Composants UI réutilisables
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── Loader.tsx
│   │
│   ├── skeletons/                # Loading skeletons
│   │   ├── PostSkeleton.tsx
│   │   ├── CardSkeleton.tsx
│   │   └── ProfileSkeleton.tsx
│   │
│   └── viewers/                  # Visionneuses
│       ├── ImageLightbox.tsx
│       ├── VideoPlayer.tsx
│       └── StoryViewer.tsx
│
├── contexts/                     # React Contexts
│   ├── AuthContext.tsx           # État d'authentification
│   ├── ThemeContext.tsx          # État du thème
│   ├── SocketContext.tsx         # WebSocket pour temps réel
│   └── NotificationContext.tsx   # Notifications en temps réel
│
├── hooks/                        # Hooks React custom
│   ├── useAuth.ts                # Hook d'authentification
│   ├── useSocket.ts              # Hook WebSocket
│   ├── useFetch.ts               # Hook pour requêtes HTTP
│   ├── useInfiniteScroll.ts      # Hook scroll infini
│   ├── useLocalStorage.ts        # Hook localStorage
│   └── useDebounce.ts            # Hook debounce
│
├── lib/                          # Utilitaires et configuration
│   ├── auth.ts                   # Configuration NextAuth.js
│   ├── prisma.ts                 # Client Prisma
│   ├── cloudinary.ts             # Configuration Cloudinary
│   ├── nodemailer.ts             # Configuration email
│   ├── utils.ts                  # Fonctions utilitaires
│   ├── validators.ts             # Validation des données
│   ├── constants.ts              # Constantes
│   ├── i18n/                     # Traductions
│   │   ├── en.json
│   │   ├── fr.json
│   │   ├── mg.json
│   │   ├── es.json
│   │   ├── de.json
│   │   └── zh.json
│   └── translations.ts           # Gestion des traductions
│
├── prisma/                       # ORM Prisma
│   ├── schema.prisma             # Schéma de la base de données
│   ├── migrations/               # Historique des migrations
│   └── seed.ts                   # Données de test
│
├── public/                       # Fichiers statiques
│   ├── images/
│   ├── icons/
│   └── manifest.json
│
├── types/                        # Types TypeScript
│   ├── user.types.ts
│   ├── post.types.ts
│   ├── message.types.ts
│   ├── notification.types.ts
│   └── api.types.ts
│
├── scripts/                      # Scripts utilitaires
│   ├── generate-favicon.js
│   ├── seed-database.js
│   └── migrate-database.js
│
└── ecosystem.config.js           # Configuration PM2
```

## 🔄 Flux de Données

### 1. Authentification

```
Utilisateur
    ↓
[Login Page]
    ↓
POST /api/auth/login
    ↓
[Validation des credentials]
    ↓
[Hachage bcryptjs]
    ↓
[Création JWT]
    ↓
NextAuth.js Session
    ↓
[Protected Routes accessibles]
```

### 2. Création d'un Post

```
Utilisateur écrit un post
    ↓
[PostCreator Component]
    ↓
POST /api/posts
    ↓
[Validation Zod]
    ↓
[Prisma Create]
    ↓
Base de données
    ↓
WebSocket broadcast
    ↓
Feed en temps réel mis à jour
```

### 3. Messages en Temps Réel

```
Utilisateur A
    ↓
[Message Input]
    ↓
WebSocket.emit('message:send')
    ↓
[WebSocket Server]
    ↓
POST /api/messages (sauvegarde en BD)
    ↓
WebSocket.broadcast('message:new')
    ↓
Utilisateur B
[Chat window mise à jour]
```

## 🛠️ Stack Technique

### Frontend
| Technologie | Version | Usage |
|------------|---------|-------|
| Next.js | 15+ | Framework React |
| React | 19+ | Bibliothèque UI |
| TypeScript | 5.6+ | Typage statique |
| Tailwind CSS | 3.4+ | Framework CSS |
| Framer Motion | 11+ | Animations |
| Lucide React | 0.46+ | Icônes |

### Backend
| Technologie | Version | Usage |
|------------|---------|-------|
| Node.js | 20+ | Runtime JavaScript |
| Prisma | 6.19+ | ORM |
| NextAuth.js | 4.24+ | Authentification |
| WebSocket (ws) | 8.13+ | Temps réel |
| Bcrypt | 6.0+ | Hachage passwords |
| Nodemailer | 7.0+ | Email |

### Base de Données
| Technologie | Usage |
|------------|-------|
| PostgreSQL | Production |
| SQLite | Développement local |

### Services Externes
| Service | Usage |
|---------|-------|
| Cloudinary | Stockage images/vidéos |
| NextAuth OAuth | Google, Facebook |
| Nodemailer SMTP | Notifications email |

## 🔐 Architecture de Sécurité

```
┌─────────────────────────────────────────┐
│      Frontend (Client)                   │
│  - Tokens stockés en HttpOnly Cookies    │
│  - Protection CSRF tokens                │
│  - Validation côté client (Zod)          │
└────────────┬────────────────────────────┘
             │ HTTPS
┌────────────▼────────────────────────────┐
│      API Gateway (NextAuth.js)           │
│  - Vérification JWT                      │
│  - Rate limiting                         │
│  - CORS protection                       │
└────────────┬────────────────────────────┘
             │ SQL
┌────────────▼────────────────────────────┐
│      API Routes                          │
│  - Validation entrées (Zod)              │
│  - Authentification requise               │
│  - Paramètres validés                    │
└────────────┬────────────────────────────┘
             │ Prisma ORM
┌────────────▼────────────────────────────┐
│      Base de Données                     │
│  - Données chiffrées (passwords)         │
│  - Requêtes paramétrées                  │
│  - Contraintes de clé étrangère          │
└─────────────────────────────────────────┘
```

## 🔄 Cycle de Vie d'une Page

### Route Protégée (Authenticated)

```
1. User navigates to /home
   ↓
2. NextAuth.js middleware checks session
   ↓
3. If not authenticated → redirect to /auth/login
   ↓
4. If authenticated → load page component
   ↓
5. useAuth() hook gets user data
   ↓
6. Layout component renders (Sidebar, Header)
   ↓
7. Page content rendered
   ↓
8. WebSocket connected in useEffect
   ↓
9. Real-time updates pushed to component state
```

## 📊 Base de Données

### Modèles Principaux

```
User
├── Profile
├── Posts
├── Comments
├── Reactions (PostLike)
│
Messages
├── Conversation
├── MessageReaction
│
Stories (24h expiration)
├── StoryView
│
Groups
├── GroupMember
├── GroupPost
│
Pages
├── PageMember
├── PagePost
│
Friends
├── FriendRequest
│
Notifications
├── UserNotification
│
Badges
```

## 🚀 Performance & Optimisation

### Frontend Optimisation
- **Code Splitting** : Chaque route est un bundle séparé
- **Image Optimization** : Next.js Image component
- **Lazy Loading** : Components importés dynamiquement
- **Virtual Scrolling** : Pour listes longues
- **Memoization** : useMemo et useCallback

### Backend Optimisation
- **Database Indexing** : Sur colonnes fréquemment requêtées
- **Pagination** : Limiter les résultats
- **Caching** : Redis pour sessions/cache
- **Connection Pooling** : Prisma gère les connexions

## 🔌 WebSocket Architecture

```
┌─────────────────┐
│   Client A      │
│  (Browser)      │
│                 │
│  ws://server    │
└────────┬────────┘
         │
         │ WebSocket
         ↓
┌────────────────────┐
│  WebSocket Server  │
│  (Node.js)         │
│  ├─ Room: messages │
│  ├─ Room: live     │
│  └─ Room: notif    │
└────────┬───────────┘
         │
         │ WebSocket
         ↓
┌─────────────────┐
│   Client B      │
│  (Browser)      │
└─────────────────┘
```

### Events WebSocket
- `message:send` - Nouveau message
- `message:read` - Message marqué comme lu
- `post:like` - Like sur post
- `page:update` - Mise à jour de page
- `notification:new` - Nouvelle notification
- `live:update` - Mise à jour live/video

## 📞 API Architecture

### Patterns REST

```
GET    /api/users/:id              - Récupérer un utilisateur
POST   /api/users                  - Créer un utilisateur
PUT    /api/users/:id              - Modifier un utilisateur
DELETE /api/users/:id              - Supprimer un utilisateur

GET    /api/posts                  - Lister les posts (paginated)
POST   /api/posts                  - Créer un post
GET    /api/posts/:id              - Récupérer un post
PUT    /api/posts/:id              - Modifier un post
DELETE /api/posts/:id              - Supprimer un post
POST   /api/posts/:id/like         - Liker un post
POST   /api/posts/:id/comment      - Commenter un post
```

### Response Format

**Success (200-201)**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error (4xx-5xx)**
```json
{
  "success": false,
  "error": "Error code",
  "message": "Descriptive error message"
}
```

## 🔄 Déploiement

### Environnements

| Env | Usage | Database |
|-----|-------|----------|
| Development | Local | SQLite |
| Staging | Test avant prod | PostgreSQL |
| Production | Live | PostgreSQL |

### Pipeline CI/CD

```
Git Push
  ↓
GitHub Actions
  ├─ Tests
  ├─ Linting
  ├─ Build
  └─ Deploy (Vercel/AWS/Others)
```

## 🤝 Contribution Architecture

Avant de contribuer, comprenez :
1. Structure des dossiers
2. Patterns utilisés (composants, utilitaires)
3. Convention de nommage
4. Flux de données
5. Sécurité et validation

Consultez [DEVELOPMENT.md](DEVELOPMENT.md) pour les directives détaillées.
