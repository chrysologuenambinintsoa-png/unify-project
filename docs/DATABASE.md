# Guide de Base de Données - Unify

Documentation complète du schéma Prisma et de la gestion de la base de données.

## 📊 Overview

Unify utilise **Prisma ORM** pour gérer les données avec :

- **PostgreSQL** pour la production
- **SQLite** pour le développement local

Le schéma est défini dans `prisma/schema.prisma`.

---

## 🗄️ Structure du Schéma

### Tables Principales

```
User
├── Profile
├── Posts
├── Comments
├── Reactions
│
Messages ← Conversation
├── MessageReaction
│
Stories
├── StoryView
│
Groups
├── GroupMembers
├── GroupPosts
│
Pages
├── PageMembers
├── PagePosts
│
Friends
├── FriendRequest
│
Notifications
├── Badge
```

---

## 👤 User (Utilisateurs)

### Schéma

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  username      String   @unique
  password      String   // Hashé avec bcrypt
  bio           String?
  avatar        String?  // URL Cloudinary
  cover         String?  // URL Cloudinary
  birthDate     DateTime?
  gender        String?  // M, F, Other, Prefer not to say
  location      String?
  website       String?
  isVerified    Boolean  @default(false)
  isActive      Boolean  @default(true)
  
  // Relations
  posts         Post[]
  comments      Comment[]
  reactions     PostLike[]
  stories       Story[]
  sentMessages  Message[]
  conversations Conversation[]
  friends       Friendship[] @relation("FriendUser1")
  friendOf      Friendship[] @relation("FriendUser2")
  sentRequests  FriendRequest[] @relation("Sender")
  receivedRequests FriendRequest[] @relation("Receiver")
  groupMembers  GroupMember[]
  pageMembers   PageMember[]
  notifications UserNotification[]
  badges        UserBadge[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([email])
  @@index([username])
  @@fulltext([name, bio])  // Pour PostgreSQL
}
```

### Indices et Optimisations

```prisma
@@index([createdAt])       // Pour trier par date
@@index([isActive])        // Filtrer users actifs
@@fulltext([name, bio])    // Recherche full-text
```

---

## 📝 Post (Publications)

### Schéma

```prisma
model Post {
  id           String   @id @default(cuid())
  content      String   @db.Text
  
  // Contenu enrichi
  images       String[] // URLs Cloudinary
  background   Json?    // { type: 'color'|'gradient', value: '#...' }
  
  // Métadonnées
  authorId     String
  author       User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  visibility   String   @default("public") // public, friends, private
  isPinned     Boolean  @default(false)
  
  // Relations
  comments     Comment[]
  likes        PostLike[]
  shares       PostShare[]
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([authorId])
  @@index([createdAt])
  @@index([visibility])
  @@fulltext([content])
}
```

### Types de Visibilité

```typescript
type PostVisibility = 'public' | 'friends' | 'private';

// Public  : Visible par tous
// Friends : Visible par amis seulement
// Private : Privé
```

---

## 💬 Comment (Commentaires)

### Schéma

```prisma
model Comment {
  id          String   @id @default(cuid())
  content     String   @db.Text
  
  // Imbrication (réponses à commentaires)
  parentId    String?
  parent      Comment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies     Comment[] @relation("CommentReplies")
  
  // Contexte
  postId      String
  post        Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  authorId    String
  author      User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  // Réactions
  likes       CommentLike[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([postId])
  @@index([parentId])
  @@index([authorId])
}
```

---

## ❤️ PostLike & CommentLike (Réactions)

### Schéma

```prisma
model PostLike {
  id        String   @id @default(cuid())
  
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  emoji     String   @default("❤️")
  
  createdAt DateTime @default(now())
  
  @@unique([postId, userId])  // Chaque user ne peut liker qu'une fois
  @@index([userId])
  @@index([postId])
}

model CommentLike {
  id        String   @id @default(cuid())
  
  commentId String
  comment   Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)
  
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  
  @@unique([commentId, userId])
  @@index([userId])
}
```

---

## 📨 Message & Conversation

### Schéma Conversation

```prisma
model Conversation {
  id            String   @id @default(cuid())
  
  // Participants (1-to-1)
  participant1Id String
  participant1   User     @relation("User1Conversations", fields: [participant1Id], references: [id], onDelete: Cascade)
  
  participant2Id String
  participant2   User     @relation("User2Conversations", fields: [participant2Id], references: [id], onDelete: Cascade)
  
  // Métadonnées
  messages      Message[]
  isPinned      Boolean  @default(false)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([participant1Id, participant2Id])
  @@index([participant1Id])
  @@index([participant2Id])
}
```

### Schéma Message

```prisma
model Message {
  id              String   @id @default(cuid())
  content         String   @db.Text
  
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  senderId        String
  sender          User     @relation(fields: [senderId], references: [id], onDelete: Cascade)
  
  // Attachements
  images          String[]
  attachments     String[]
  
  // Métadonnées
  isRead          Boolean  @default(false)
  readAt          DateTime?
  
  // Réactions
  reactions       MessageReaction[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([conversationId])
  @@index([senderId])
  @@index([isRead])
  @@index([createdAt])
}

model MessageReaction {
  id        String   @id @default(cuid())
  
  messageId String
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  emoji     String
  
  createdAt DateTime @default(now())
  
  @@unique([messageId, userId])
}
```

---

## 📖 Story (Histoires 24h)

### Schéma

```prisma
model Story {
  id        String   @id @default(cuid())
  
  // Contenu
  type      String   // "image", "video", "text"
  content   String?  // Pour type "text"
  mediaUrl  String?  // Cloudinary URL
  
  // Auteur
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  // Métadonnées
  isPrivate Boolean  @default(false)
  views     StoryView[]
  
  // Expiration 24h
  expiresAt DateTime  // Automatiquement calculé : createdAt + 24h
  
  createdAt DateTime @default(now())
  
  @@index([authorId])
  @@index([expiresAt])
  @@index([createdAt])
}

model StoryView {
  id        String   @id @default(cuid())
  
  storyId   String
  story     Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)
  
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  viewedAt  DateTime @default(now())
  
  @@unique([storyId, userId])
  @@index([storyId])
}
```

---

## 👥 Groupes

### Schéma Groupe

```prisma
model Group {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  
  // Image
  image       String?  // Cloudinary URL
  cover       String?
  
  // Paramètres
  category    String?  // Technology, Sports, Business, etc.
  isPublic    Boolean  @default(true)
  
  // Admin
  creatorId   String
  creator     User     @relation("GroupCreator", fields: [creatorId], references: [id])
  
  // Relations
  members     GroupMember[]
  posts       GroupPost[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([creatorId])
  @@index([isPublic])
  @@index([category])
  @@fulltext([name, description])
}

model GroupMember {
  id        String   @id @default(cuid())
  
  groupId   String
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Rôle
  role      String   @default("member") // member, moderator, admin
  
  joinedAt  DateTime @default(now())
  
  @@unique([groupId, userId])
  @@index([groupId])
}

model GroupPost {
  id        String   @id @default(cuid())
  content   String   @db.Text
  
  groupId   String
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  images    String[]
  isPinned  Boolean  @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([groupId])
  @@index([authorId])
}
```

---

## 📄 Pages

### Schéma Page

```prisma
model Page {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  
  // Image
  image       String?
  cover       String?
  
  // Paramètres
  category    String?  // Business, Creator, Media, etc.
  isVerified  Boolean  @default(false)
  
  // Admin
  creatorId   String
  creator     User     @relation("PageCreator", fields: [creatorId], references: [id])
  
  // Relations
  admins      PageMember[]
  posts       PagePost[]
  followers   PageFollower[]
  likes       PageLike[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([creatorId])
  @@index([category])
}

model PageMember {
  id    String @id @default(cuid())
  
  pageId String
  page   Page   @relation(fields: [pageId], references: [id], onDelete: Cascade)
  
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  role   String @default("editor") // editor, moderator, admin
  
  joinedAt DateTime @default(now())
  
  @@unique([pageId, userId])
}

model PagePost {
  id       String @id @default(cuid())
  content  String @db.Text
  
  pageId   String
  page     Page   @relation(fields: [pageId], references: [id], onDelete: Cascade)
  
  authorId String
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  images   String[]
  
  createdAt DateTime @default(now())
  
  @@index([pageId])
  @@index([authorId])
}

model PageLike {
  id     String @id @default(cuid())
  
  pageId String
  page   Page   @relation(fields: [pageId], references: [id], onDelete: Cascade)
  
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  
  @@unique([pageId, userId])
  @@index([pageId])
  @@index([userId])
}
```

---

## 👨‍👩‍👧‍👦 Amis

### Schéma Friendship

```prisma
model Friendship {
  id   String @id @default(cuid())
  
  // Relation bidirectionnelle
  user1Id String
  user1   User   @relation("FriendUser1", fields: [user1Id], references: [id], onDelete: Cascade)
  
  user2Id String
  user2   User   @relation("FriendUser2", fields: [user2Id], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  
  // Cas : user1Id < user2Id pour éviter duplicates
  @@unique([user1Id, user2Id])
  @@index([user1Id])
  @@index([user2Id])
}

model FriendRequest {
  id   String @id @default(cuid())
  
  // Demandeur
  senderId String
  sender   User   @relation("SentFriendRequestsBy", fields: [senderId], references: [id], onDelete: Cascade)
  
  // Destinataire
  receiverId String
  receiver   User   @relation("ReceivedFriendRequestsBy", fields: [receiverId], references: [id], onDelete: Cascade)
  
  status   String @default("pending") // pending, accepted, rejected
  
  createdAt DateTime @default(now())
  respondedAt DateTime?
  
  @@unique([senderId, receiverId])
  @@index([receiverId])
  @@index([status])
}
```

---

## 🔔 Notifications

### Schéma Notification

```prisma
model UserNotification {
  id     String @id @default(cuid())
  
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Type de notification
  type   String // post_like, post_comment, friend_request, message, etc.
  
  // Acteur (qui a déclenché)
  actorId String?
  actor   User?  @relation("NotificationActor", fields: [actorId], references: [id], onDelete: SetNull)
  
  // Cible (ce qui a déclenché)
  targetType String?  // Post, Comment, User, Message, etc.
  targetId   String?
  
  // Contenu
  title      String?
  message    String?
  
  // Métadonnées
  isRead     Boolean  @default(false)
  readAt     DateTime?
  
  createdAt  DateTime @default(now())
  
  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}
```

---

## 🎖️ Badges

### Schéma Badge

```prisma
model Badge {
  id      String @id @default(cuid())
  code    String @unique  // EARLY_MEMBER, CONTENT_CREATOR, etc.
  name    String
  description String?
  icon    String?  // URL ou emoji
  
  criteria Json?   // Conditions pour obtenir le badge
  
  users   UserBadge[]
  
  createdAt DateTime @default(now())
}

model UserBadge {
  id      String @id @default(cuid())
  
  userId  String
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  badgeId String
  badge   Badge  @relation(fields: [badgeId], references: [id], onDelete: Cascade)
  
  earnedAt DateTime @default(now())
  
  @@unique([userId, badgeId])
  @@index([userId])
}
```

---

## 🔄 Migrations

### Créer une Migration

```bash
# Après modification du schéma.prisma :
npx prisma migrate dev --name descriptive_name

# Exemple
npx prisma migrate dev --name add_story_expiration
```

### Appliquer une Migration

```bash
# Développement
npx prisma db push

# Production
npx prisma migrate deploy
```

### Voir l'Status

```bash
npx prisma migrate status
```

---

## 🔍 Queries Efficaces

### Query avec Pagination

```typescript
const page = 1;
const limit = 20;

const posts = await prisma.post.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
  include: {
    author: {
      select: { id: true, username: true, avatar: true }
    },
    likes: { select: { userId: true } },
    comments: { select: { id: true } }
  }
});

const total = await prisma.post.count();
```

### Query avec Filtres

```typescript
const posts = await prisma.post.findMany({
  where: {
    AND: [
      { authorId: userId },
      { visibility: 'public' },
      { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    ]
  },
  orderBy: { createdAt: 'desc' }
});
```

### Query avec Recherche Full-text (PostgreSQL)

```typescript
// Dans le schema.prisma
@@fulltext([name, bio])

// Query
const users = await prisma.user.findMany({
  where: {
    OR: [
      { name: { search: 'john' } },
      { bio: { search: 'developer' } }
    ]
  }
});
```

### Transactions

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Créer le post
  const post = await tx.post.create({
    data: { content: 'Hello', authorId: userId }
  });
  
  // Créer la notification
  await tx.userNotification.create({
    data: {
      userId: friendId,
      type: 'post_created',
      actorId: userId,
      targetId: post.id
    }
  });
  
  return post;
});
```

---

## 🛡️ Bonnes Pratiques

### 1. Toujours Inclure les Relations

```typescript
// ✅ Bon
const post = await prisma.post.findUnique({
  where: { id: postId },
  include: { author: true, likes: true }
});

// ❌ Mauvais (N+1 query)
const post = await prisma.post.findUnique({ where: { id: postId } });
const author = await prisma.user.findUnique({ where: { id: post.authorId } });
```

### 2. Utiliser Select pour Limiter les Champs

```typescript
// ✅ Bon
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, name: true, avatar: true }
});

// ❌ Mauvais (charge tous les champs)
const user = await prisma.user.findUnique({ where: { id: userId } });
```

### 3. Ajouter les Indices

```prisma
@@index([createdAt])  // Pour trier
@@index([authorId])   // Pour filtrer
@@unique([email])     // Pour les colonnes uniques
@@fulltext([name])    // Pour la recherche
```

### 4. Valider les Entrées

```typescript
import { z } from 'zod';

const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  authorId: z.string().cuid(),
});

const data = createPostSchema.parse(input);
const post = await prisma.post.create({ data });
```

---

## 📈 Performances

### Mesurer les Queries

```typescript
// Activer les logs en développement
// Dans .env.local
DATABASE_LOG=["query", "error", "warn"]

// Ou en config
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});
```

### Optimiser Index

```prisma
// Ajouter les colonnes fréquemment requêtes
model Post {
  id String @id
  createdAt DateTime @default(now()) @db.Timestamp(3)
  updatedAt DateTime @updatedAt
  authorId String
  
  // Indices
  @@index([authorId])       // WHERE authorId = ...
  @@index([createdAt])      // ORDER BY createdAt
  @@index([createdAt, authorId])  // Combined index
}
```

---

## 🚀 Déploiement Production

### Setup PostgreSQL

```bash
# Créer base de données
createdb unify
createuser unify_user -P

# Donner les permissions
psql -U postgres -d unify -c "GRANT ALL PRIVILEGES ON DATABASE unify TO unify_user;"
```

### Connection String

```
postgresql://unify_user:password@localhost:5432/unify
```

### Appliquer Migrations

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## 🆘 Troubleshooting

**Erreur: "PrismaClientKnownRequestError"**

Vérifiez que :
- Le modèle existe dans schema.prisma
- Les relations sont bien définies
- Les données existent en base

**Erreur: "PrismaClientInitializationError"**

Vérifiez :
- DATABASE_URL est correcte
- Base de données est accessible
- Migrations appliquées

**Problème de Performance**

Vérifiez :
- Indices manquants
- N+1 queries (utilisez `include`)
- Limit les champs avec `select`

---

Consultez [prisma.io/docs](https://www.prisma.io/docs) pour plus d'informations!
