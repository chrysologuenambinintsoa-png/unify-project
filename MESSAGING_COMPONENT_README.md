# 💬 Composant de Messagerie - Facebook Messenger Style

Un composant de messagerie complet et moderne avec le design Unify, compatible avec les fonctionnalités de Facebook Messenger.

## 🎨 Features

✅ **Envoi de messages texte**
✅ **Partage de photos/images**
✅ **Partage de fichiers/documents**
✅ **Système de réactions d'émoji** (❤️ 👍 😂 😍 😮 😢 🔥 👎)
✅ **Avatars des utilisateurs**
✅ **Indicateur de typing**
✅ **Design Facebook Messenger**
✅ **Couleurs Unify** (Bleu primaire + Gradient)
✅ **Animations fluides** avec Framer Motion
✅ **Dark Mode support**
✅ **Responsive design**
✅ **Gestion des réactions de messages**
✅ **Menu contextuel** (Supprimer, Copier)

## 📦 Installation

```bash
npm install emoji-picker-react date-fns framer-motion lucide-react
```

## 🚀 Utilisation

### Importation

```tsx
import { MessagesContainer } from '@/components/messaging';
```

### Exemple complet

```tsx
import { MessagesContainer } from '@/components/messaging';
import { useState } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      senderId: 'user1',
      senderName: 'Alice',
      senderAvatar: 'https://...',
      content: 'Salut! 👋',
      timestamp: new Date(),
      isRead: true,
      reactions: [],
    }
  ]);

  const handleSendMessage = (message) => {
    console.log('Message envoyé:', message);
    setMessages([...messages, message]);
  };

  return (
    <div className="h-screen">
      <MessagesContainer
        conversationId="conv-1"
        currentUserId="currentUser"
        currentUserName="Vous"
        currentUserAvatar="https://..."
        recipientName="Alice"
        recipientAvatar="https://..."
        onSendMessage={handleSendMessage}
        messages={messages}
      />
    </div>
  );
}
```

## 🧩 Composants

### MessagesContainer
**Conteneur principal** qui gère l'affichage de tous les messages et l'input.

**Props:**
- `conversationId` (string) - ID unique de la conversation
- `currentUserId` (string) - ID de l'utilisateur courant
- `currentUserName` (string) - Nom de l'utilisateur courant
- `currentUserAvatar` (string) - Avatar de l'utilisateur courant
- `recipientName` (string) - Nom du destinataire
- `recipientAvatar` (string) - Avatar du destinataire
- `onSendMessage` (function) - Callback quand un mensaje est envoyé
- `messages` (Array) - Liste des messages (optionnel)

### MessageBubble
**Component pour afficher** un message avec ses réactions et actions.

**Features:**
- Design bubble style Facebook
- Réactions d'émoji
- Actions au survol (Réagir, Répondre, Plus)
- Affichage des images/fichiers
- Timestamps relatifs

### MessageInput
**Component pour la saisie** de messages avec support de pièces jointes.

**Features:**
- Saisie de texte
- Sélecteur d'émoji intégré
- Upload de photos
- Upload de fichiers
- Aperçu des pièces jointes
- Auto-envoi au clique du bouton ou Enter

## 🎨 Design Unify

### Couleurs utilisées:
- **Primary Dark**: `#0A2342` (Bleu foncé)
- **Gradient**: `from-primary-dark to-blue-700`
- **Accent**: `#E8B923` (Or)

### Styles:
- Bulles arrondies (rounded-3xl)
- Gradient pour les messages envoyés
- Gris clair pour les messages reçus
- Animations fluides avec Framer Motion
- Border radius moderne

## 📝 Structure des Messages

```typescript
interface Message {
  id: string;                          // ID unique du message
  senderId: string;                    // ID de l'expéditeur
  senderName: string;                  // Nom de l'expéditeur
  senderAvatar: string;                // Avatar URL
  content?: string;                    // Contenu texte
  image?: string;                      // Image en base64
  file?: {
    name: string;                      // Nom du fichier
    size: number;                      // Taille en bytes
    url: string;                       // URL du fichier
  };
  timestamp: Date;                     // Date/heure du message
  reactions?: Array<{                  // Réactions d'émoji
    emoji: string;
    count: number;
  }>;
  isRead: boolean;                     // Message lu?
}
```

## 🎯 Cas d'usage

1. **Système de chat direct** - DM entre utilisateurs
2. **Chat de groupe** - Conversations multi-utilisateurs
3. **Support client** - Système de support en ligne
4. **Notifications interactives** - Messages avec réactions
5. **Intégration dans les profils** - Chat sur page profil

## 📱 Responsive

Le composant s'adapte automatiquement à tous les écrans:
- **Mobile**: Full width avec input optimisé
- **Tablette**: Layout standard
- **Desktop**: Layout optimisé avec panel latéral

## 🌙 Dark Mode

Support complet du dark mode via classes Tailwind:
```tsx
dark:bg-gray-800
dark:text-white
dark:border-gray-700
```

## ⚡ Performance

- Animations optimisées avec Framer Motion
- Virtualisation des messages (à ajouter pour listes longues)
- Lazy loading des images
- Gestion efficace des réactions
- Scroll smooth avec ref

## 🔄 Intégration WebSocket

Pour l'intégration en temps réel:

```tsx
const handleNewMessage = (message) => {
  setMessages(prev => [...prev, message]);
};

// Connecter à votre WebSocket
useEffect(() => {
  socket.on('message', handleNewMessage);
  return () => socket.off('message', handleNewMessage);
}, []);
```

## 📚 Dépendances

- **framer-motion** - Animations
- **lucide-react** - Icônes
- **date-fns** - Formatage des dates
- **tailwindcss** - Styling

## 🎉 Démo

Visitez `/messaging-demo` pour voir une démo complète du composant en action!

## 📄 Licence

MIT

---

**Créé avec ❤️ pour Unify**
