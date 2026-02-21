# API Documentation - Unify

Documentation complète des endpoints API REST de Unify.

## 📌 Format Général

### Authentification

Tous les endpoints protégés requièrent un token d'authentification :

```http
Authorization: Bearer <token>
```

OU via cookies automatiquement définis par NextAuth.js

### Headers Requis

```http
Content-Type: application/json
Authorization: Bearer <token>  (si nécessaire)
```

### Response Format

**Success (200-201)**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "..."
  },
  "message": "Operation successful"
}
```

**Error (4xx-5xx)**
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Description of the error"
}
```

### Pagination

Endpoints qui retournent de grandes quantités de données :

```http
GET /api/posts?page=1&limit=20&sort=newest
```

**Response** :
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 🔐 Authentication Endpoints

### POST /api/auth/register

Créer un nouveau compte.

**Request** :
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "username": "johndoe"
}
```

**Validation** :
- Email: format email valide, unique
- Password: min 8 chars, 1 maj, 1 min, 1 chiffre
- Username: 3-30 chars, alphanumeric + underscore

**Response** (201) :
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe"
  },
  "message": "User registered successfully"
}
```

**Errors** :
- `400` - Email already exists
- `400` - Username already exists
- `400` - Invalid password
- `422` - Validation failed

---

### POST /api/auth/login

Se connecter.

**Request** :
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": true
}
```

**Response** (200) :
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe",
    "avatar": "https://..."
  },
  "message": "Login successful"
}
```

Set-Cookie automatiquement par NextAuth.js

**Errors** :
- `401` - Invalid email or password
- `429` - Too many login attempts (rate limited)

---

### POST /api/auth/logout

Se déconnecter.

**Response** (200) :
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### POST /api/auth/forgot-password

Demander une réinitialisation de mot de passe.

**Request** :
```json
{
  "email": "user@example.com"
}
```

**Response** (200) :
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

### POST /api/auth/reset-password

Réinitialiser le mot de passe.

**Request** :
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}
```

**Response** (200) :
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## 👤 User Endpoints

### GET /api/users/:id

Récupérer les infos d'un utilisateur.

**Parameters** :
- `id` : ID de l'utilisateur

**Response** (200) :
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "johndoe",
    "name": "John Doe",
    "email": "user@example.com",
    "bio": "Developer & Designer",
    "avatar": "https://...",
    "cover": "https://...",
    "birthDate": "1990-01-15",
    "gender": "M",
    "location": "New York, USA",
    "website": "https://johndoe.com",
    "createdAt": "2026-01-01T00:00:00Z",
    "followers": 150,
    "following": 75,
    "isVerified": false,
    "badges": ["newMember", "contentCreator"]
  }
}
```

---

### GET /api/users/:id/profile

Récupérer le profil complet d'un utilisateur.

**Response** (200) :
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "stats": {
      "posts": 45,
      "friends": 350,
      "groups": 12,
      "pages": 2
    },
    "recentPosts": [ ... ]
  }
}
```

---

### PUT /api/users/:id/profile

Modifier le profil (authentifié, propre profil seulement).

**Request** :
```json
{
  "name": "John Doe",
  "bio": "Updated bio",
  "birthDate": "1990-01-15",
  "gender": "M",
  "location": "New York",
  "website": "https://johndoe.com"
}
```

**Response** (200) :
```json
{
  "success": true,
  "data": { ... },
  "message": "Profile updated successfully"
}
```

---

### POST /api/users/:id/avatar

Uploader une photo de profil.

**Request** (multipart/form-data) :
```
file: <image file>
```

**Response** (200) :
```json
{
  "success": true,
  "data": {
    "avatar": "https://cloudinary.com/..."
  }
}
```

---

### POST /api/users/:id/cover

Uploader une image de couverture.

**Request** (multipart/form-data) :
```
file: <image file>
```

**Response** (200) :
```json
{
  "success": true,
  "data": {
    "cover": "https://cloudinary.com/..."
  }
}
```

---

## 📝 Posts Endpoints

### POST /api/posts

Créer un nouveau post.

**Request** :
```json
{
  "content": "Hello world! #unify",
  "images": [
    "https://cloudinary.com/image1.jpg"
  ],
  "background": {
    "type": "color",
    "value": "#1e3a8a"
  },
  "visibility": "public"
}
```

**Validation** :
- Content: 1-5000 chars
- Images: max 5, 20MB each
- Visibility: public, friends, private

**Response** (201) :
```json
{
  "success": true,
  "data": {
    "id": "post_123",
    "content": "Hello world! #unify",
    "author": { ... },
    "images": [ ... ],
    "likes": 0,
    "comments": 0,
    "shares": 0,
    "createdAt": "2026-02-21T10:30:00Z"
  }
}
```

---

### GET /api/posts

Lister les posts du feed.

**Query Parameters** :
```
?page=1
&limit=20
&sort=newest|trending|oldest
&includeReplies=true|false
```

**Response** (200) :
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": { ... }
}
```

---

### GET /api/posts/:id

Récupérer un post spécifique.

**Response** (200) :
```json
{
  "success": true,
  "data": {
    "id": "post_123",
    "content": "Hello world!",
    "author": { ... },
    "likes": 10,
    "comments": 5,
    "shares": 2,
    "likedByMe": false,
    "comments": [ ... ],
    "createdAt": "2026-02-21T10:30:00Z",
    "updatedAt": "2026-02-21T11:00:00Z"
  }
}
```

---

### PUT /api/posts/:id

Éditer un post.

**Request** :
```json
{
  "content": "Updated content"
}
```

**Authorization** :
- Seulement l'auteur ou admin

**Response** (200) :
```json
{
  "success": true,
  "data": { ... },
  "message": "Post updated successfully"
}
```

---

### DELETE /api/posts/:id

Supprimer un post.

**Authorization** :
- Seulement l'auteur ou admin

**Response** (200) :
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

### POST /api/posts/:id/like

Liker/contraimer un post.

**Response** (200) :
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likeCount": 11
  }
}
```

---

### POST /api/posts/:id/react

Réagir avec un emoji.

**Request** :
```json
{
  "emoji": "😂"
}
```

**Response** (200) :
```json
{
  "success": true,
  "data": {
    "reaction": "😂",
    "count": 3
  }
}
```

---

### GET /api/posts/:id/likes

Lister les likes d'un post.

**Response** (200) :
```json
{
  "success": true,
  "data": [
    {
      "user": { ... },
      "createdAt": "..."
    }
  ]
}
```

---

### POST /api/posts/:id/comment

Créer un commentaire.

**Request** :
```json
{
  "content": "Great post!",
  "parentId": null
}
```

**Response** (201) :
```json
{
  "success": true,
  "data": {
    "id": "comment_123",
    "content": "Great post!",
    "author": { ... },
    "createdAt": "..."
  }
}
```

---

### GET /api/posts/:id/comments

Lister les commentaires.

**Query Parameters** :
```
?page=1&limit=20&sort=newest
```

**Response** (200) :
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": { ... }
}
```

---

## 💬 Messages Endpoints

### POST /api/messages

Envoyer un message.

**Request** :
```json
{
  "conversationId": "conv_123",
  "content": "Hello!",
  "image": "https://cloudinary.com/..."
}
```

**Response** (201) :
```json
{
  "success": true,
  "data": {
    "id": "msg_123",
    "conversationId": "conv_123",
    "sender": { ... },
    "content": "Hello!",
    "isRead": false,
    "createdAt": "2026-02-21T10:30:00Z"
  }
}
```

---

### GET /api/conversations

Lister les conversations.

**Query Parameters** :
```
?page=1&limit=20
```

**Response** (200) :
```json
{
  "success": true,
  "data": [
    {
      "id": "conv_123",
      "participant": { ... },
      "lastMessage": "Hi there!",
      "lastMessageTime": "...",
      "unreadCount": 3,
      "isPinned": false
    }
  ]
}
```

---

### GET /api/conversations/:id

Récupérer une conversation avec messages.

**Query Parameters** :
```
?page=1&limit=50
```

**Response** (200) :
```json
{
  "success": true,
  "data": {
    "id": "conv_123",
    "participant": { ... },
    "messages": [ ... ],
    "unreadCount": 0
  }
}
```

---

### POST /api/messages/:id/read

Marquer un message comme lu.

**Response** (200) :
```json
{
  "success": true,
  "message": "Message marked as read"
}
```

---

### DELETE /api/messages/:id

Supprimer un message.

**Response** (200) :
```json
{
  "success": true,
  "message": "Message deleted"
}
```

---

## 👥 Friends Endpoints

### POST /api/friends/request

Envoyer une demande d'ami.

**Request** :
```json
{
  "recipientId": "user_456"
}
```

**Response** (201) :
```json
{
  "success": true,
  "message": "Friend request sent"
}
```

---

### GET /api/friends/requests

Lister les demandes d'ami.

**Query Parameters** :
```
?status=pending|accepted|rejected
&page=1&limit=20
```

**Response** (200) :
```json
{
  "success": true,
  "data": [
    {
      "id": "req_123",
      "sender": { ... },
      "status": "pending",
      "createdAt": "..."
    }
  ]
}
```

---

### POST /api/friends/request/:id/accept

Accepter une demande d'ami.

**Response** (200) :
```json
{
  "success": true,
  "message": "Friend request accepted"
}
```

---

### POST /api/friends/request/:id/reject

Refuser une demande d'ami.

**Response** (200) :
```json
{
  "success": true,
  "message": "Friend request rejected"
}
```

---

### GET /api/friends/:userId

Lister les amis.

**Query Parameters** :
```
?page=1&limit=50
```

**Response** (200) :
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": { ... }
}
```

---

### GET /api/friends/:userId/suggestions

Suggestions d'amis.

**Response** (200) :
```json
{
  "success": true,
  "data": [
    {
      "user": { ... },
      "reason": "Friend of a friend",
      "mutualFriends": 5
    }
  ]
}
```

---

## 🔔 Notifications Endpoints

### GET /api/notifications

Lister les notifications.

**Query Parameters** :
```
?page=1&limit=20&unreadOnly=false
```

**Response** (200) :
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_123",
      "type": "post_like",
      "actor": { ... },
      "target": { id: "post_123", type: "post" },
      "isRead": false,
      "createdAt": "..."
    }
  ]
}
```

---

### POST /api/notifications/:id/read

Marquer comme lu.

**Response** (200) :
```json
{
  "success": true
}
```

---

### DELETE /api/notifications/:id

Supprimer une notification.

**Response** (200) :
```json
{
  "success": true
}
```

---

### POST /api/notifications/mark-all-read

Marquer toutes les notifications comme lu.

**Response** (200) :
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## 👥 Groups Endpoints

### POST /api/groups

Créer un groupe.

**Request** :
```json
{
  "name": "Tech Enthusiasts",
  "description": "A place for tech lovers",
  "category": "Technology",
  "isPublic": true,
  "image": "https://cloudinary.com/..."
}
```

**Response** (201) :
```json
{
  "success": true,
  "data": {
    "id": "group_123",
    "name": "Tech Enthusiasts",
    "creator": { ... },
    "members": 1,
    "createdAt": "..."
  }
}
```

---

### GET /api/groups

Lister les groupes.

**Query Parameters** :
```
?page=1&limit=20&category=Technology&sort=newest
```

**Response** (200) :
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": { ... }
}
```

---

### GET /api/groups/:id

Détails du groupe.

**Response** (200) :
```json
{
  "success": true,
  "data": {
    "id": "group_123",
    "name": "Tech Enthusiasts",
    "description": "...",
    "category": "Technology",
    "isPublic": true,
    "memberCount": 250,
    "postCount": 45,
    "createdAt": "...",
    "members": [ ... ]
  }
}
```

---

### POST /api/groups/:id/join

Rejoindre un groupe public.

**Response** (200) :
```json
{
  "success": true,
  "message": "You have joined the group"
}
```

---

### POST /api/groups/:id/members/invite

Inviter des amis.

**Request** :
```json
{
  "userIds": ["user_123", "user_456"]
}
```

**Response** (200) :
```json
{
  "success": true,
  "message": "Invitations sent"
}
```

---

### POST /api/groups/:id/posts

Créer un post dans le groupe.

**Request** :
```json
{
  "content": "Check this out!",
  "images": [ ... ]
}
```

**Response** (201) :
```json
{
  "success": true,
  "data": { ... }
}
```

---

## 📄 Pages Endpoints

### POST /api/pages

Créer une page.

**Request** :
```json
{
  "name": "My Brand",
  "description": "Official brand page",
  "category": "Business",
  "image": "https://..."
}
```

**Response** (201) :
```json
{
  "success": true,
  "data": {
    "id": "page_123",
    "name": "My Brand",
    "creator": { ... }
  }
}
```

---

### GET /api/pages/:id

Détails de la page.

**Response** (200) :
```json
{
  "success": true,
  "data": {
    "id": "page_123",
    "name": "My Brand",
    "followers": 1500,
    "posts": 45,
    "admins": [ ... ]
  }
}
```

---

## 📖 Stories Endpoints

### POST /api/stories

Créer une story.

**Request** (multipart/form-data) :
```
content: "Check this out!"
media: <file>
type: "image|video|text"
```

**Response** (201) :
```json
{
  "success": true,
  "data": {
    "id": "story_123",
    "author": { ... },
    "type": "image",
    "url": "https://...",
    "viewCount": 0,
    "expiresAt": "2026-02-22T10:30:00Z"
  }
}
```

---

### GET /api/stories

Lister les stories des amis.

**Response** (200) :
```json
{
  "success": true,
  "data": [
    {
      "user": { ... },
      "stories": [ ... ],
      "hasUnseen": true
    }
  ]
}
```

---

### POST /api/stories/:id/view

Marquer une story comme vue.

**Response** (200) :
```json
{
  "success": true
}
```

---

### GET /api/stories/:id/views

Lister les vues d'une story.

**Response** (200) :
```json
{
  "success": true,
  "data": [
    {
      "user": { ... },
      "viewedAt": "..."
    }
  ]
}
```

---

## 🔍 Search Endpoints

### GET /api/search

Recherche globale.

**Query Parameters** :
```
?q=query&type=all|users|posts|groups&page=1&limit=20
```

**Response** (200) :
```json
{
  "success": true,
  "data": {
    "users": [ ... ],
    "posts": [ ... ],
    "groups": [ ... ]
  }
}
```

---

## 🔐 Error Codes

| Code | Meaning | Status |
|------|---------|--------|
| `UNAUTHORIZED` | Not authenticated | 401 |
| `FORBIDDEN` | No permission | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `CONFLICT` | Resource already exists | 409 |
| `VALIDATION_ERROR` | Invalid input data | 422 |
| `RATE_LIMITED` | Too many requests | 429 |
| `SERVER_ERROR` | Internal server error | 500 |

---

## 🔄 WebSocket Events

Pour les connexions en temps réel :

```javascript
// Connexion
ws = new WebSocket('ws://localhost:3000/ws');

// Events à envoyer
ws.emit('message:send', { conversationId, content });
ws.emit('message:read', { messageId });
ws.emit('post:like', { postId });
ws.emit('notification:read', { notificationId });

// Events à recevoir
ws.on('message:new', (message) => { ... });
ws.on('post:liked', (data) => { ... });
ws.on('notification:new', (notification) => { ... });
```

---

## 🧪 Testing API

### Curl Examples

**Login** :
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Create Post** :
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{"content":"Hello world!"}'
```

**Get Posts** :
```bash
curl http://localhost:3000/api/posts?page=1&limit=20
```

---

Consultez les tests dans `__tests__/` pour plus d'exemples.
