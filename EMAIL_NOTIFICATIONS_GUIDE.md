# Guide d'intégration des notifications par email

## Vue d'ensemble

Le système de notifications par email de Unify envoie automatiquement des emails aux utilisateurs pour les événements importants de l'application. Le système est conçu pour être:
- **Flexible**: Support de plusieurs types de notifications
- **Fiable**: Gestion des erreurs sans blocage de l'application
- **Respectueux**: Respecte les préférences de notification des utilisateurs

## Architecture

### 1. Couche Email (`lib/email.ts`)
- Service de base pour envoyer les emails via SMTP/Nodemailer
- Gère la connexion au serveur SMTP
- Fournit des templates HTML formatés

### 2. Service de Notifications (`lib/notification-service.ts`)
- Crée les notifications en base de données
- Envoie les emails
- Fonctions helper pour chaque type de notification
- Respecte les préférences utilisateur

### 3. Endpoints API
- `POST /api/notifications/send-email` - Envoyer une notification
- `POST /api/email/send` - Envoyer un email personnalisé
- `GET /api/email/verify-smtp` - Tester la configuration

## Types de notifications supportées

| Type | Fonction Helper | Cas d'usage |
|------|-----------------|-----------|
| `message` | `notifyNewMessage()` | Nouveau message reçu |
| `comment` | `notifyNewComment()` | Quelqu'un commente votre post |
| `like` | `notifyNewLike()` | Quelqu'un like votre post |
| `mention` | `notifyMention()` | Vous êtes mentionné |
| `follow` | `notifyNewFollow()` | Quelqu'un vous suit |
| `friend_request` | `notifyFriendRequest()` | Nouvelle demande d'ami |
| `badge` | `notifyBadgeEarned()` | Vous gagnez un badge |
| `group_invite` | `notifyGroupInvite()` | Invitation à un groupe |
| `story_reply` | `notifyStoryReply()` | Réaction à votre story |

## Utilisation

### Exemple 1: Notification de nouveau message

```typescript
import { notifyNewMessage } from '@/lib/notification-service';

// Dans votre endpoint de messages
const newMessage = await prisma.message.create({
  data: {
    senderId: session.user.id,
    receiverId: recipientId,
    content: messageContent,
  },
});

// Notifier le destinataire
try {
  await notifyNewMessage(
    recipientId,
    session.user.fullName || session.user.username,
    messageContent,
    `/messages?userId=${session.user.id}`
  );
} catch (error) {
  console.error('Notification failed:', error);
  // Ne pas bloquer l'envoi du message
}
```

### Exemple 2: Notification de nouveau commentaire

```typescript
import { notifyNewComment } from '@/lib/notification-service';

// Dans votre endpoint de commentaires
const comment = await prisma.comment.create({
  data: {
    content: commentContent,
    postId: postId,
    authorId: session.user.id,
  },
});

const post = await prisma.post.findUnique({ where: { id: postId } });

// Notifier l'auteur du post
try {
  await notifyNewComment(
    post.authorId,
    session.user.fullName || session.user.username,
    `/posts/${postId}`
  );
} catch (error) {
  console.error('Notification failed:', error);
}
```

### Exemple 3: Notification de like

```typescript
import { notifyNewLike } from '@/lib/notification-service';

// Dans votre endpoint de likes
const like = await prisma.like.create({
  data: {
    postId: postId,
    userId: session.user.id,
  },
});

const post = await prisma.post.findUnique({ where: { id: postId } });

// Notifier l'auteur du post
try {
  await notifyNewLike(
    post.authorId,
    session.user.fullName || session.user.username,
    `/posts/${postId}`
  );
} catch (error) {
  console.error('Notification failed:', error);
}
```

### Exemple 4: Notification personnalisée

```typescript
import { notifyUser } from '@/lib/notification-service';

// Pour une notification non-standard
try {
  await notifyUser({
    userId: recipientId,
    type: 'message',
    title: 'Titre personnalisé',
    message: 'Votre message',
    senderId: session.user.id,
    actionUrl: '/custom-url',
    sendEmail: true, // Envoyer l'email?
  });
} catch (error) {
  console.error('Notification failed:', error);
}
```

## Contrôle des emails

### Désactiver l'email pour une notification

```typescript
await notifyNewMessage(
  recipientId,
  senderName,
  message,
  conversationUrl,
  false // Ne pas envoyer d'email
);
```

### Vérifier les préférences utilisateur

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { emailNotifications: true }
});

if (user.emailNotifications === false) {
  // L'utilisateur a désactivé les notifications email
}
```

## Intégration dans les workflows existants

### Workflow d'inscription

✅ **Déjà intégré dans** `app/api/auth/register/route.ts`
- Email de vérification envoyé automatiquement lors de l'inscription
- Email de bienvenue envoyé après vérification

### Workflow de messages

À intégrer dans `app/api/messages/route.ts`:
```typescript
// Après la création du message
await notifyNewMessage(
  receiverId,
  sender.fullName,
  message.content,
  `/messages?userId=${sender.id}`
);
```

### Workflow de posts/commentaires

À intégrer dans `app/api/posts/comments/route.ts`:
```typescript
// Après la création du commentaire
await notifyNewComment(
  post.authorId,
  commenter.fullName,
  `/posts/${post.id}`
);
```

### Workflow de likes

À intégrer dans `app/api/posts/like/route.ts`:
```typescript
// Après la création du like
await notifyNewLike(
  post.authorId,
  liker.fullName,
  `/posts/${post.id}`
);
```

### Workflow de mentions

À intégrer dans les endpoints de posts/commentaires:
```typescript
// Extraire les mentions du contenu
const mentions = extractMentions(content);

for (const mentionedUserId of mentions) {
  await notifyMention(
    mentionedUserId,
    mentioner.fullName,
    `${mentioner.fullName} vous a mentionné`,
    postUrl
  );
}
```

## Gestion des erreurs

Le système est conçu pour être **fail-safe**:

```typescript
// ✅ BON: Ne pas bloquer l'opération si la notification échoue
try {
  await notifyNewMessage(recipientId, senderName, message, url);
} catch (error) {
  console.error('Notification failed:', error);
  // Continuer sans bloquer l'opération principale
}

// ❌ MAUVAIS: Bloquer l'opération si la notification échoue
const result = await notifyNewMessage(...);
if (!result) throw new Error('Notification failed');
```

## Configuration de l'utilisateur

Pour respecter les préférences de notification:

```prisma
model User {
  // ... autres champs
  emailNotifications Boolean @default(true)
}
```

Dans le profil utilisateur:
```typescript
// Mettre à jour les préférences
await prisma.user.update({
  where: { id: userId },
  data: { emailNotifications: value }
});
```

## Dépannage

### Notifications non reçues

1. Vérifier que `emailNotifications` est `true` pour l'utilisateur
2. Vérifier la configuration SMTP avec `/api/email/verify-smtp`
3. Vérifier les logs du serveur: `console.error(...)`
4. Vérifier l'email spam/filtres

### Erreurs de configuration SMTP

```
Error: SMTP configuration is incomplete. Please set: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
```
- Mise à jour du fichier `.env` requise
- Redémarrer le serveur

### Emails lents

- Augmenter le timeout Nodemailer si nécessaire
- Utiliser un pool de connexion (déjà implémenté)
- Considérer une queue de jobs asynchrone pour le scale

## Performance et Scalabilité

### Approche actuelle (synchrone)

✅ Avantages:
- Simple à implémenter
- Pas d'infrastructure supplémentaire
- Déterministe

⚠️ Limitations:
- Peut ralentir l'opération si SMTP est lent
- Perte d'email si le serveur crash

### Approche future (asynchrone)

Pour le scale, considérer:
- **Bull/Redis Queue** pour les jobs asynchrones
- **AWS SES** pour meilleure délivrabilité
- **SendGrid/Mailgun** pour gestion professionnelle
- Webhook pour suivre les deliveries

## Best Practices

1. **Toujours wrapper dans try-catch** pour ne pas bloquer
2. **Logger les erreurs** pour debugging
3. **Respecter les préférences utilisateur** pour `emailNotifications`
4. **Limiter la fréquence** de notifications par type
5. **Tester avec `/api/email/verify-smtp`** avant production
6. **Inclure des liens** `actionUrl` pour faciliter l'engagement
7. **Utiliser des noms appropriés** dans les emails

## Fichiers clés

- [lib/email.ts](../lib/email.ts) - Service d'emails
- [lib/notification-service.ts](../lib/notification-service.ts) - Service de notifications
- [app/api/notifications/send-email/route.ts](../app/api/notifications/send-email/route.ts) - Endpoint
- [app/api/auth/register/route.ts](../app/api/auth/register/route.ts) - Exemple d'intégration
- [app/api/auth/verify-code/route.ts](../app/api/auth/verify-code/route.ts) - Exemple d'intégration

## Support

Pour les problèmes:
1. Vérifier les logs: `console.log(...)`
2. Tester SMTP: `GET /api/email/verify-smtp`
3. Vérifier `.env` pour les credentials
4. Consulter [SMTP_CONFIGURATION.md](SMTP_CONFIGURATION.md) pour les détails SMTP
