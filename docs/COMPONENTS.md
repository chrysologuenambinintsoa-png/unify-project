# Guide des Composants - Unify

Documentation sur les composants React disponibles et comment les utiliser.

## 📋 Overview

Les composants sont organisés dans `/components` avec les catégories suivantes :

- **layout/** - Composants de mise en page
- **post/** - Composants liés aux posts
- **messaging/** - Composants de messagerie
- **profile/** - Composants de profil
- **ui/** - Composants UI réutilisables
- **skeletons/** - Loading states
- **live/** - Composants de vidéo live
- **viewer/** - Visionneuses (images, vidéos)

---

## 🎯 Composants Layout

### Sidebar

Component pour la barre latérale de navigation.

**Props** :
```typescript
interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}
```

**Usage** :
```typescript
import { Sidebar } from '@/components/layout/Sidebar';

export default function Layout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

---

### Header

Header principal avec navigation.

**Props** :
```typescript
interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}
```

**Usage** :
```typescript
import { Header } from '@/components/layout/Header';

export function EventsPage() {
  return (
    <>
      <Header 
        title="Events" 
        actions={<Button>Create Event</Button>}
      />
      <main>{/* content */}</main>
    </>
  );
}
```

---

### Footer

Footer du site.

**Props** :
```typescript
interface FooterProps {
  minimal?: boolean;
  showSocial?: boolean;
}
```

---

## 📝 Composants Posts

### Post

Affiche un post complet avec réactions, commentaires, etc.

**Props** :
```typescript
interface PostProps {
  post: Post;
  onDelete?: (id: string) => void;
  onShare?: (id: string) => void;
  onEdit?: (id: string) => void;
  isOwner?: boolean;
  isLoading?: boolean;
}
```

**Usage** :
```typescript
import { Post } from '@/components/post/Post';

export function Feed() {
  return (
    <div className="space-y-4">
      {posts.map(post => (
        <Post
          key={post.id}
          post={post}
          isOwner={post.authorId === userId}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
```

**Features** :
- Afficher le contenu (texte, images, vidéos)
- Reactions (likes, emojis)
- Commentaires
- Actions (edit, delete, share)
- Timestamps
- Avatar et info d'auteur

---

### PostCreator

Formulaire pour créer un nouveau post.

**Props** :
```typescript
interface PostCreatorProps {
  onSubmit: (post: CreatePostInput) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  showBackgroundOptions?: boolean;
  maxLength?: number;
}
```

**Usage** :
```typescript
import { PostCreator } from '@/components/post/PostCreator';

export function HomePage() {
  const handleCreatePost = async (postData) => {
    await fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  };

  return (
    <div>
      <PostCreator 
        onSubmit={handleCreatePost}
        showBackgroundOptions={true}
      />
    </div>
  );
}
```

**Features** :
- Editor de texte riche
- Upload d'images
- Support d'arrière-plans (couleurs, dégradés)
- Preview en temps réel
- Emojis picker
- Auto-save drafts

---

### PostContent

Affiche juste le contenu d'un post (texte + images).

**Props** :
```typescript
interface PostContentProps {
  content: string;
  images?: string[];
  background?: {
    type: 'color' | 'gradient';
    value: string;
  };
  expanded?: boolean;
  maxLines?: number;
}
```

---

### CommentsModal

Modal pour afficher et créer des commentaires.

**Props** :
```typescript
interface CommentsModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
  isLoading?: boolean;
}
```

---

### ReactionBar

Bar avec les réactions (like, emojis).

**Props** :
```typescript
interface ReactionBarProps {
  postId: string;
  likeCount: number;
  likedByMe: boolean;
  onLike: () => Promise<void>;
  onReact: (emoji: string) => Promise<void>;
  reactions?: Array<{ emoji: string; count: number }>;
  isLoading?: boolean;
}
```

**Usage** :
```typescript
<ReactionBar 
  postId="post_123"
  likeCount={10}
  likedByMe={false}
  onLike={handleLike}
  onReact={handleReact}
/>
```

---

## 💬 Composants Messaging

### MessageList

Liste des messages dans une conversation.

**Props** :
```typescript
interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}
```

**Usage** :
```typescript
import { MessageList } from '@/components/messaging/MessageList';

export function ChatWindow() {
  return (
    <div className="flex flex-col h-full">
      <MessageList 
        messages={messages}
        currentUserId={userId}
      />
      <MessageInput onSend={handleSend} />
    </div>
  );
}
```

---

### MessageInput

Input pour envoyer des messages.

**Props** :
```typescript
interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  onTyping?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  maxLength?: number;
  allowImages?: boolean;
}
```

---

### ConversationList

Liste des conversations.

**Props** :
```typescript
interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
  showUnreadOnly?: boolean;
}
```

---

### ChatWindow

Composant complet pour le chat.

**Props** :
```typescript
interface ChatWindowProps {
  conversationId: string;
  isLoading?: boolean;
  onClose?: () => void;
}
```

Combine :
- Header avec infos du participant
- MessageList
- MessageInput
- Notifications typing

---

## 👤 Composants Profile

### ProfileHeader

Header du profil utilisateur.

**Props** :
```typescript
interface ProfileHeaderProps {
  user: User & { stats: UserStats };
  isOwner?: boolean;
  onEditClick?: () => void;
  onFollowClick?: () => void;
  isFollowing?: boolean;
}
```

**Usage** :
```typescript
import { ProfileHeader } from '@/components/profile/ProfileHeader';

export function ProfilePage() {
  return (
    <div>
      <ProfileHeader 
        user={user}
        isOwner={userId === user.id}
      />
    </div>
  );
}
```

**Features** :
- Photo de couverture
- Avatar
- Badges
- Stats (posts, followers, following)
- Bio
- Bouton edit/follow

---

### ProfileImageUpload

Uploader une photo de profil.

**Props** :
```typescript
interface ProfileImageUploadProps {
  currentImage?: string;
  onUpload: (url: string) => Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
}
```

---

### CoverImageUpload

Uploader une image de couverture.

**Props** :
```typescript
interface CoverImageUploadProps {
  currentImage?: string;
  onUpload: (url: string) => Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
}
```

---

### ProfileTabs

Tabs pour le profil (posts, média, likes, etc).

**Props** :
```typescript
interface ProfileTabsProps {
  userId: string;
  tabs: Array<{
    label: string;
    value: string;
    count?: number;
  }>;
  activeTab: string;
  onTabChange: (tab: string) => void;
}
```

---

## 🎨 Composants UI

### Button

Bouton réutilisable avec variantes.

**Props** :
```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
  fullWidth?: boolean;
}
```

**Usage** :
```typescript
import { Button } from '@/components/ui/Button';

export function Example() {
  return (
    <>
      <Button variant="primary">Save</Button>
      <Button variant="secondary" size="sm">Cancel</Button>
      <Button variant="danger" isLoading={loading}>Delete</Button>
      <Button variant="ghost">Close</Button>
    </>
  );
}
```

---

### Input

Input réutilisable.

**Props** :
```typescript
interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  autoComplete?: string;
}
```

---

### Modal

Modal dialog réutilisable.

**Props** :
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdropClick?: boolean;
}
```

**Usage** :
```typescript
import { Modal } from '@/components/ui/Modal';

export function Example() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
      >
        <p>Are you sure?</p>
        <div className="flex gap-2">
          <Button onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
        </div>
      </Modal>
    </>
  );
}
```

---

### Toast

Notification toast.

**Props** :
```typescript
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Usage** :
```typescript
import { useToast } from '@/hooks/useToast';

export function Example() {
  const { showToast } = useToast();

  return (
    <Button onClick={() => {
      showToast('Saved successfully', 'success');
    }}>
      Save
    </Button>
  );
}
```

---

### Loader / Spinner

Loading indicator.

**Props** :
```typescript
interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}
```

---

## 💀 Loading Skeletons

Placeholder while loading.

### PostSkeleton

```typescript
import { PostSkeleton } from '@/components/skeletons/PostSkeleton';

export function Feed() {
  return (
    <>
      {isLoading && <PostSkeleton count={3} />}
      {posts.map(post => <Post key={post.id} post={post} />)}
    </>
  );
}
```

---

## 🎬 Composants Live

### LiveStreamViewer

**Props** :
```typescript
interface LiveStreamViewerProps {
  streamId: string;
  autoPlay?: boolean;
  onViewersChange?: (count: number) => void;
  onError?: (error: Error) => void;
}
```

---

## 👁️ Composants Viewers

### ImageLightbox

Visionneuse d'images full-screen.

**Props** :
```typescript
interface ImageLightboxProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}
```

---

### VideoPlayer

Lecteur vidéo personnalisé.

**Props** :
```typescript
interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  controls?: boolean;
  fullscreen?: boolean;
  onError?: (error: Error) => void;
}
```

---

### StoryViewer

Visionneuse de stories.

**Props** :
```typescript
interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
  onStoryViewed?: (storyId: string) => void;
}
```

---

## 🏗️ Créer un Nouveau Composant

### Checklist

1. **Créer le fichier**
```typescript
// components/example/ExampleComponent.tsx

"use client"; // si composant client

import { ReactNode } from 'react';

interface ExampleComponentProps {
  title: string;
  children: ReactNode;
  onClick?: () => void;
}

export function ExampleComponent({
  title,
  children,
  onClick,
}: ExampleComponentProps) {
  return (
    <div onClick={onClick} className="p-4 rounded-lg">
      <h2 className="font-bold">{title}</h2>
      {children}
    </div>
  );
}
```

2. **Exporter depuis index.ts** (optionnel mais recommandé)
```typescript
// components/example/index.ts

export { ExampleComponent } from './ExampleComponent';
```

3. **Ajouter des tests**
```typescript
// __tests__/components/ExampleComponent.test.ts

import { render, screen } from '@testing-library/react';
import { ExampleComponent } from '@/components/example/ExampleComponent';

describe('ExampleComponent', () => {
  it('should render with title', () => {
    render(<ExampleComponent title="Test">Content</ExampleComponent>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

4. **Documentation**
Ajouter un commentaire JSDoc :
```typescript
/**
 * Composant d'exemple
 * 
 * @example
 * <ExampleComponent title="My Component">
 *   Content here
 * </ExampleComponent>
 */
```

---

## 🎨 Styling Best Practices

### Utiliser Tailwind CSS

```typescript
// ✅ Bon
<div className="flex items-center gap-2 p-4 rounded-lg bg-gray-100">
  <span className="font-semibold text-gray-900">Title</span>
</div>

// ❌ Mauvais
<div style={{ display: 'flex', gap: '8px' }}>
  <span style={{ fontWeight: 'bold' }}>Title</span>
</div>
```

### Couleurs du Projet

```
Primaire:      #1e3a8a (blue-900)
Accent:        #b45309 (amber-700)
Success:       #10b981 (emerald-500)
Error:         #ef4444 (red-500)
Warning:       #f59e0b (amber-500)
Info:          #3b82f6 (blue-500)
```

### Responsive Design

```typescript
<div className="
  grid 
  grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  gap-4
">
  {/* Items */}
</div>
```

---

## 🔄 Global State Management

### Utiliser les Contexts

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export function MyComponent() {
  const { user } = useAuth();
  const { theme } = useTheme();

  return <div>Hello {user?.name} in {theme} mode</div>;
}
```

### Utiliser Custom Hooks

```typescript
import { useFetch } from '@/hooks/useFetch';

export function MyComponent() {
  const { data, isLoading, error } = useFetch('/api/data');

  if (isLoading) return <Loader />;
  if (error) return <Error message={error} />;

  return <div>{data}</div>;
}
```

---

## 🧩 Composantes Compounded

Créer des composants avec une API flexible :

```typescript
// components/Card/Card.tsx

interface CardProps {
  children: React.ReactNode;
}

export function Card({ children }: CardProps) {
  return <div className="border rounded-lg">{children}</div>;
}

export function CardHeader({ children }: CardProps) {
  return <div className="border-b px-4 py-3">{children}</div>;
}

export function CardBody({ children }: CardProps) {
  return <div className="p-4">{children}</div>;
}

export function CardFooter({ children }: CardProps) {
  return <div className="border-t px-4 py-3">{children}</div>;
}

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

---

## 🚀 Performance Tips

### Memoization

```typescript
import { memo, useMemo } from 'react';

// Memoize le composant
export const MyComponent = memo(({ items }: Props) => {
  // Memoize le calcul
  const processed = useMemo(() => {
    return items.map(processItem);
  }, [items]);

  return <div>{processed}</div>;
});
```

### Lazy Loading

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Loader />,
});

export function Container() {
  return <HeavyComponent />;
}
```

---

## 📞 FAQ Composants

**Q: Quand créer un composant client vs serveur?**
A: Utilisez composants serveur par défaut. Utilisez `"use client"` seulement si vous besoin des hooks client ou d'interactivité.

**Q: Comment passer les données?**
A: Props pour les données, contexts pour l'état global, API Routes pour les données du serveur.

**Q: Comment gérer les erreurs?**
A: Passez fonction `onError`, utilisez try/catch, afficher les messages.

---

Pour plus d'exemples, consultez le dossier `/components` dans le projet!
