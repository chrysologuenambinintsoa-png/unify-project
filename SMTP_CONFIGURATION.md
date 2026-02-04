# Configuration SMTP pour Unify

## Vue d'ensemble

Le système de mailing de Unify est configuré avec **nodemailer** et supporte les variables d'environnement SMTP.

## Variables d'environnement (.env)

```env
# SMTP Configuration for SendMail
SMTP_HOST="smtp.gmail.com"           # Serveur SMTP
SMTP_PORT="587"                       # Port SMTP (587 pour TLS, 465 pour SSL)
SMTP_SECURE="false"                   # true pour SSL/TLS, false pour STARTTLS
SMTP_USER="your-email@gmail.com"      # Email d'authentification
SMTP_PASSWORD="your-app-password"     # Mot de passe ou App Password
SMTP_FROM_NAME="Unify"                # Nom d'expéditeur
SMTP_FROM_EMAIL="noreply@unify.app"   # Email d'expéditeur
```

## Configuration pour différents fournisseurs

### Gmail
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"  # Générer via https://myaccount.google.com/apppasswords
```

**Important**: Google n'accepte plus les mots de passe standards. Créez un [App Password](https://myaccount.google.com/apppasswords).

### Outlook/Hotmail
```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@outlook.com"
SMTP_PASSWORD="your-password"
```

### SendGrid
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="apikey"
SMTP_PASSWORD="SG.xxxxx_YOUR_SENDGRID_API_KEY"
```

### Brevo (Sendinblue)
```env
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@domain.com"
SMTP_PASSWORD="YOUR_BREVO_SMTP_KEY"
```

## Service Email (lib/email.ts)

### Fonctions disponibles

#### 1. `sendEmail(to, subject, html, text?)`
Envoie un email personnalisé.

```typescript
await sendEmail(
  'user@example.com',
  'Sujet',
  '<h1>Contenu HTML</h1>',
  'Contenu texte (optionnel)'
);
```

#### 2. `sendVerificationCodeEmail(to, code)`
Envoie un code de vérification.

```typescript
await sendVerificationCodeEmail('user@example.com', '123456');
```

#### 3. `sendResetCodeEmail(to, code)`
Envoie un code de réinitialisation du mot de passe.

```typescript
await sendResetCodeEmail('user@example.com', '789012');
```

#### 4. `sendWelcomeEmail(to, userName)`
Envoie un email de bienvenue.

```typescript
await sendWelcomeEmail('user@example.com', 'John Doe');
```

#### 5. `sendNotificationEmail(to, title, message)`
Envoie une notification par email.

```typescript
await sendNotificationEmail(
  'user@example.com',
  'Nouvelle notification',
  'Vous avez reçu un message'
);
```

#### 6. `verifySmtpConnection()`
Vérifie la connexion SMTP.

```typescript
const isConnected = await verifySmtpConnection();
if (isConnected) {
  console.log('SMTP OK');
}
```

## Endpoints API

### POST /api/email/send
Envoie un email personnalisé.

**Body:**
```json
{
  "to": "user@example.com",
  "subject": "Sujet du mail",
  "message": "Contenu du message"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Email sent successfully",
  "messageId": "<message-id@hostname>"
}
```

### GET /api/email/verify-smtp
Vérifie la configuration SMTP.

**Response:**
```json
{
  "status": "success",
  "message": "SMTP connection verified successfully",
  "config": {
    "host": "smtp.gmail.com",
    "port": "587",
    "user": "your***",
    "fromName": "Unify",
    "fromEmail": "noreply@unify.app"
  }
}
```

## Intégration dans l'application

### Exemple: Envoyer un email lors de l'inscription

```typescript
import { sendWelcomeEmail } from '@/lib/email';

// Dans votre contrôleur d'inscription
try {
  await sendWelcomeEmail(user.email, user.name);
} catch (error) {
  console.error('Failed to send welcome email:', error);
  // Ne pas bloquer l'inscription si l'email échoue
}
```

### Exemple: Email lors d'une notification

```typescript
import { sendNotificationEmail } from '@/lib/email';

// Lors d'une notification
await sendNotificationEmail(
  user.email,
  'Vous avez un nouveau message',
  `${senderName} vous a envoyé un message`
);
```

## Dépannage

### Erreur: "SMTP configuration is incomplete"
- Vérifiez que toutes les variables sont définies dans `.env`
- Redémarrez le serveur après modification du `.env`

### Les emails ne sont pas envoyés
- Utilisez l'endpoint `/api/email/verify-smtp` pour tester la connexion
- Vérifiez les logs du serveur pour les erreurs détaillées

### Gmail rejette la connexion
- Utilisez un [App Password](https://myaccount.google.com/apppasswords) au lieu du mot de passe du compte
- Activez l'authentification à 2 facteurs sur votre compte Gmail
- Assurez-vous que "Accès aux applis moins sécurisées" est désactivé

### Emails classés comme spam
- Configurez les enregistrements SPF, DKIM, DMARC pour votre domaine
- Utilisez une adresse "no-reply" clairement identifiée
- Incluez un lien de désinscription
- Pas de contenu HTML trop agressif

## Bonnes pratiques

1. **Testez votre configuration** avec `/api/email/verify-smtp` avant de déployer
2. **Ne commitez jamais** vos mots de passe SMTP dans Git
3. **Utilisez des App Passwords** pour les fournisseurs qui les proposent
4. **Loggez les erreurs** pour pouvoir déboguer
5. **Gérez les taux de limitation** (rate limiting) pour éviter les blocages
6. **Testez en développement** avec des emails de test
7. **Utilisez des templates HTML** professionnels pour meilleure délivrabilité

## Fichiers clés

- [lib/email.ts](../lib/email.ts) - Service d'envoi d'emails
- [app/api/email/send/route.ts](../app/api/email/send/route.ts) - Endpoint pour envoyer des emails
- [app/api/email/verify-smtp/route.ts](../app/api/email/verify-smtp/route.ts) - Endpoint pour tester SMTP

## Support

Pour plus d'informations:
- [Documentation Nodemailer](https://nodemailer.com/)
- [Gmail App Passwords](https://myaccount.google.com/apppasswords)
- [Outlook SMTP Configuration](https://support.microsoft.com/en-us/office/outlook-com-imap-pop-smtp-settings-d088b986-291d-42b8-9564-9c414e2adb5e)
