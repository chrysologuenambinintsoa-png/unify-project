/**
 * GUIDE D'UTILISATION DU SYSTÈME DE NOTIFICATIONS
 * 
 * Le système de notifications synchronise les événements suivants:
 * 1. Like sur un post
 * 2. Commentaire sur un post
 * 3. Follow/Abonnement
 * 4. Nouvelle story
 * 5. Suggestion d'ami
 * 6. Partage de contenu
 * 7. Mention/Identification
 * 8. Messages privés
 */

/**
 * EXEMPLE 1: Notification de "Like"
 * À utiliser dans PostCard.tsx ou le composant de like
 */

import { createLikeNotification, triggerDesktopNotification } from '@/lib/notificationService';
import { useSession } from 'next-auth/react';

// Dans votre handler de like:
const handleLike = async (postId: string, postAuthorId: string) => {
  const { data: session } = useSession();
  
  try {
    // 1. Faire le like
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      credentials: 'include',
    });
    
    if (res.ok) {
      // 2. Créer la notification
      await createLikeNotification(
        postAuthorId,
        postId,
        session?.user?.id || '',
        session?.user?.name || 'Utilisateur',
        session?.user?.image || undefined
      );
      
      // 3. (Optionnel) Déclencher notification de bureau
      triggerDesktopNotification(`${session?.user?.name} a aimé votre publication`);
    }
  } catch (error) {
    console.error('Error liking post:', error);
  }
};

/**
 * EXEMPLE 2: Notification de "Commentaire"
 * À utiliser dans CommentsModal.tsx ou CommentThread.tsx
 */

import { createCommentNotification } from '@/lib/notificationService';

// Dans votre handler d'ajout de commentaire:
const handleAddComment = async (postId: string, postAuthorId: string, commentText: string) => {
  const { data: session } = useSession();
  
  try {
    // 1. Créer le commentaire
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: commentText }),
    });
    
    if (res.ok) {
      // 2. Créer la notification
      await createCommentNotification(
        postAuthorId,
        postId,
        session?.user?.id || '',
        session?.user?.name || 'Utilisateur',
        commentText,
        session?.user?.image || undefined
      );
      
      triggerDesktopNotification(`${session?.user?.name} a commenté votre publication`);
    }
  } catch (error) {
    console.error('Error adding comment:', error);
  }
};

/**
 * EXEMPLE 3: Notification de "Follow"
 * À utiliser dans le profil utilisateur ou FriendSuggestions.tsx
 */

import { createFollowNotification } from '@/lib/notificationService';

// Dans votre handler de follow:
const handleFollowUser = async (userId: string) => {
  const { data: session } = useSession();
  
  try {
    const res = await fetch(`/api/users/${userId}/follow`, {
      method: 'POST',
      credentials: 'include',
    });
    
    if (res.ok) {
      await createFollowNotification(
        userId,
        session?.user?.id || '',
        session?.user?.name || 'Utilisateur',
        session?.user?.image || undefined
      );
      
      triggerDesktopNotification(`Vous suivez maintenant cet utilisateur`);
    }
  } catch (error) {
    console.error('Error following user:', error);
  }
};

/**
 * EXEMPLE 4: Notification de "Story"
 * À utiliser dans CreateStoryModal.tsx
 */

import { createStoryNotification } from '@/lib/notificationService';

// Dans votre handler de création de story:
const handleCreateStory = async (storyData: any) => {
  const { data: session } = useSession();
  
  try {
    const res = await fetch('/api/stories', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storyData),
    });
    
    if (res.ok) {
      const story = await res.json();
      
      // Notifier tous les followers
      const followers = await fetch('/api/users/followers', {
        credentials: 'include',
      }).then(r => r.json());
      
      for (const follower of followers) {
        await createStoryNotification(
          session?.user?.id || '',
          follower.id,
          session?.user?.name || 'Utilisateur',
          session?.user?.image || undefined
        );
      }
      
      triggerDesktopNotification(`Votre story a été publiée`);
    }
  } catch (error) {
    console.error('Error creating story:', error);
  }
};

/**
 * EXEMPLE 5: Notification de "Suggestion d'ami"
 * À utiliser dans FriendSuggestions.tsx
 */

import { createFriendSuggestionNotification } from '@/lib/notificationService';

// Fonction à appeler quand vous montrez une suggestion:
const notifySuggestion = async (userId: string, userName: string, userAvatar?: string) => {
  await createFriendSuggestionNotification(
    userId,
    userName,
    userAvatar
  );
};

/**
 * EXEMPLE 6: Notification de "Partage"
 * À utiliser dans ShareModal.tsx
 */

import { createShareNotification } from '@/lib/notificationService';

// Dans votre handler de partage:
const handleSharePost = async (postId: string, postAuthorId: string, shareType: 'message' | 'group') => {
  const { data: session } = useSession();
  
  try {
    const res = await fetch(`/api/posts/${postId}/share`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareType }),
    });
    
    if (res.ok) {
      await createShareNotification(
        postAuthorId,
        postId,
        'post',
        session?.user?.id || '',
        session?.user?.name || 'Utilisateur',
        session?.user?.image || undefined
      );
      
      triggerDesktopNotification(`Votre publication a été partagée`);
    }
  } catch (error) {
    console.error('Error sharing post:', error);
  }
};

/**
 * EXEMPLE 7: Notification de "Mention/Identification"
 * À utiliser quand vous taguez quelqu'un dans un post
 */

import { createMentionNotification } from '@/lib/notificationService';

// Dans votre handler de post avec mentions:
const handleCreatePostWithMentions = async (postContent: string, mentionedUserIds: string[]) => {
  const { data: session } = useSession();
  
  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: postContent, mentions: mentionedUserIds }),
    });
    
    if (res.ok) {
      const post = await res.json();
      
      // Notifier tous les utilisateurs mentionnés
      for (const mentionedUserId of mentionedUserIds) {
        await createMentionNotification(
          mentionedUserId,
          post.id,
          session?.user?.id || '',
          session?.user?.name || 'Utilisateur',
          session?.user?.image || undefined
        );
      }
      
      triggerDesktopNotification(`Votre publication a été créée`);
    }
  } catch (error) {
    console.error('Error creating post:', error);
  }
};

/**
 * POUR RECEVOIR LES NOTIFICATIONS EN TEMPS RÉEL:
 * 
 * Utilisez le hook useNotifications() dans votre composant:
 * 
 * const { notifications, unreadCount, markAsRead } = useNotifications();
 * 
 * Le hook établit une connexion SSE avec le serveur qui envoie automatiquement
 * les nouvelles notifications au fur et à mesure qu'elles sont créées.
 */
