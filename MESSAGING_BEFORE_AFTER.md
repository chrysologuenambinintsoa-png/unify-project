# 🔄 Avant/Après - Modifications Clés

## 1. Affichage Nom d'Expéditeur

### ❌ AVANT (MessageBubble.tsx, ligne ~118-128)
```tsx
{/* Sender name display */}
{!isMine ? (
  // Messages reçus: nom du sender
  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-3 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
    {message.senderName}
  </p>
) : (
  // Messages envoyés: afficher "Vous" (optionnel)
  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-3 opacity-70">
    Vous
  </p>
)}
```

### ✅ APRÈS
```tsx
{/* Sender name display - Only show "Vous" for sent messages */}
{isMine && (
  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-3 opacity-70">
    Vous
  </p>
)}
```

**Bénéfices:**
- Interface plus épurée
- Moins de désordre visuel
- L'identité du sender est claire via l'avatar et position (gauche/droite)

---

## 2. État Typing Indicator

### ❌ AVANT (MessagesContainer.tsx, ligne ~67)
```tsx
const [messages, setMessages] = useState<Message[]>(initialMessages);
const [isTyping, setIsTyping] = useState(false);  // ← Jamais utilisé correctement!
const messagesEndRef = useRef<HTMLDivElement>(null);
const [showHeader, setShowHeader] = useState(true);
const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
const [showForwardModal, setShowForwardModal] = useState(false);
const [selectedMessageForForward, setSelectedMessageForForward] = useState<Message | null>(null);
const pollingRef = useRef<NodeJS.Timeout | null>(null);
```

### ✅ APRÈS
```tsx
const [messages, setMessages] = useState<Message[]>(initialMessages);
const [isPartnerTyping, setIsPartnerTyping] = useState(false);  // ← Renommé et utilisé
const messagesEndRef = useRef<HTMLDivElement>(null);
const [showHeader, setShowHeader] = useState(true);
const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
const [showForwardModal, setShowForwardModal] = useState(false);
const [selectedMessageForForward, setSelectedMessageForForward] = useState<Message | null>(null);
const pollingRef = useRef<NodeJS.Timeout | null>(null);
const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);         // ← NOUVEAU
const typingPollingRef = useRef<NodeJS.Timeout | null>(null);         // ← NOUVEAU
```

---

## 3. Polling Typing Status (NOUVEAU)

### ❌ AVANT
Aucun polling du typing status

### ✅ APRÈS
```tsx
// Polling for typing indicator (MessagesContainer.tsx)
useEffect(() => {
  if (!recipientId) return;

  const pollTypingStatus = async () => {
    try {
      const response = await fetch(`/api/messages/typing?partnerId=${recipientId}`);
      if (response.ok) {
        const data = await response.json();
        setIsPartnerTyping(data.isPartnerTyping || false);
      }
    } catch (error) {
      console.error('Error polling typing status:', error);
    }
  };

  // Initial poll
  pollTypingStatus();

  // Set up polling interval (check every 500ms)
  typingPollingRef.current = setInterval(pollTypingStatus, 500);

  return () => {
    if (typingPollingRef.current) {
      clearInterval(typingPollingRef.current);
    }
  };
}, [recipientId]);
```

**Fréquence:** Toutes les 500ms = 2 requêtes par seconde (très léger)

---

## 4. Gestion du Typing (NOUVEAU)

### ❌ AVANT
Pas de fonction pour notifier le typing

### ✅ APRÈS
```tsx
// Handle typing with debounce (MessagesContainer.tsx)
const handleUserTyping = (isTyping: boolean) => {
  if (isTyping) {
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing indicator
    notifyTyping(true);
    
    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      notifyTyping(false);
    }, 3000);
  } else {
    // User stopped typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    notifyTyping(false);
  }
};
```

**Timeout de 3s:** Évite sans que l'autre côté pense que vous êtes toujours en train de taper

---

## 5. MessageInput Callbacks (MODIFIÉ)

### ❌ AVANT
```tsx
interface MessageInputProps {
  onSendMessage: (content: string, attachments?: ...) => void;
  currentUserAvatar: string;
}

export const MessageInput = ({
  onSendMessage,
  currentUserAvatar,
}) => {
  // ...
  <input
    onChange={(e) => setMessage(e.target.value)}  // ← Pas de typing notification
    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
  />
}
```

### ✅ APRÈS
```tsx
interface MessageInputProps {
  onSendMessage: (content: string, attachments?: ...) => void;
  onTyping?: (isTyping: boolean) => void;  // ← NOUVEAU
  currentUserAvatar: string;
}

export const MessageInput = ({
  onSendMessage,
  onTyping,  // ← NOUVEAU
  currentUserAvatar,
}) => {
  // ...
  <input
    onChange={(e) => {
      setMessage(e.target.value);
      onTyping?.(true);  // ← Notifier le parent
    }}
    onKeyPress={(e) => {
      if (e.key === 'Enter' && !isLoading) {
        onTyping?.(false);  // ← Arrêter le typing
        handleSend();
      }
    }}
    onBlur={() => {
      onTyping?.(false);  // ← Arrêter quand l'utilisateur quitte le champ
    }}
  />
}
```

---

## 6. Affichage Typing Indicator

### ❌ AVANT
```tsx
{isTyping && (  // ← Jamais true!
  <div>...</div>
)}
```

### ✅ APRÈS
```tsx
{isPartnerTyping && (  // ← Basé sur le polling
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    className="px-4 py-2"
  >
    <div className="flex items-center gap-2">
      <img src={recipientAvatar} className="w-8 h-8 rounded-full" />
      <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-full">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  </motion.div>
)}
```

---

## 7. Marqueur "Vu" (AMÉLIORÉ)

### ❌ AVANT
```tsx
{isMine && message.isRead && ' • Lu'}  // ← Simple texte
```

### ✅ APRÈS
```tsx
<div className="text-xs flex items-center gap-1">
  {formatDistanceToNow(...)}
  {isMine && (
    <span className="text-xs">
      {message.isRead ? '✓✓' : '✓'}  // ← Checkmarks visuels
    </span>
  )}
</div>
```

---

## 8. Auto-marking as Read (NOUVEAU)

### ❌ AVANT
Messages restent marqués comme "non lus" même après avoir été vus

### ✅ APRÈS
```tsx
// Mark messages as read (MessagesContainer.tsx)
useEffect(() => {
  const markMessagesAsRead = async () => {
    try {
      const unreadMessages = messages.filter(msg => !msg.isRead && msg.senderId !== currentUserId);
      
      if (unreadMessages.length > 0) {
        const response = await fetch('/api/messages/mark-conversation-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId: recipientId }),
        });

        if (response.ok) {
          // Update local state
          setMessages(prev => prev.map(msg => 
            msg.senderId !== currentUserId ? { ...msg, isRead: true } : msg
          ));
        }
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  if (messages.length > 0 && recipientId) {
    const unreadCount = messages.filter(msg => !msg.isRead && msg.senderId !== currentUserId).length;
    if (unreadCount > 0) {
      markMessagesAsRead();
    }
  }
}, [messages.length, recipientId, currentUserId]);
```

---

## 📈 Résultats

| Fonctionnalité | Avant | Après |
|---|---|---|
| Nom d'expéditeur visible | Toujours | Que "Vous" pour envoyés |
| Typing Indicator | ❌ Cassé | ✅ Fonctionnel |
| Read Receipt | Texte simple | ✓ ou ✓✓ |
| Auto-marking read | ❌ Non | ✅ Oui |

---

**Total des lignes modifiées:** ~120 lignes
**Nouveaux useEffects:** 2 (polling typing + auto-read)
**Nouvelles fonctions:** 2 (handleUserTyping + notifyTyping)
**APIEndpoints utilisées:** 2 (existantes)
