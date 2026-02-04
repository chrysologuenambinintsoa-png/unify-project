/**
 * Service pour créer des notifications pour différents événements
 * S'intègre avec le système de notifications SSE
 */

export interface NotificationPayload {
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message' | 'story' | 'friend_suggestion' | 'share' | 'identification';
  userId: string;
  userName: string;
  userAvatar?: string;
  targetId?: string;
  content: string;
  actionUrl?: string;
}

/**
 * Crée une notification de "like" sur un post
 */
export const createLikeNotification = async (
  postAuthorId: string,
  postId: string,
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar?: string
) => {
  return sendNotification({
    type: 'like',
    userId: currentUserId,
    userName: currentUserName,
    userAvatar: currentUserAvatar,
    targetId: postId,
    content: 'a aimé votre publication',
    actionUrl: `/posts/${postId}`,
  });
};

/**
 * Crée une notification de "commentaire"
 */
export const createCommentNotification = async (
  postAuthorId: string,
  postId: string,
  currentUserId: string,
  currentUserName: string,
  commentText: string,
  currentUserAvatar?: string
) => {
  return sendNotification({
    type: 'comment',
    userId: currentUserId,
    userName: currentUserName,
    userAvatar: currentUserAvatar,
    targetId: postId,
    content: `a commenté: "${commentText.substring(0, 50)}..."`,
    actionUrl: `/posts/${postId}`,
  });
};

/**
 * Crée une notification de "follow" / "abonnement"
 */
export const createFollowNotification = async (
  followedUserId: string,
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar?: string
) => {
  return sendNotification({
    type: 'follow',
    userId: currentUserId,
    userName: currentUserName,
    userAvatar: currentUserAvatar,
    targetId: followedUserId,
    content: 'vous suit maintenant',
    actionUrl: `/users/${currentUserId}`,
  });
};

/**
 * Crée une notification de "nouvelle story"
 */
export const createStoryNotification = async (
  storyAuthorId: string,
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar?: string
) => {
  return sendNotification({
    type: 'story',
    userId: currentUserId,
    userName: currentUserName,
    userAvatar: currentUserAvatar,
    targetId: storyAuthorId,
    content: 'a publié une nouvelle story',
    actionUrl: `/stories/${currentUserId}`,
  });
};

/**
 * Crée une notification de "suggestion d'ami"
 */
export const createFriendSuggestionNotification = async (
  suggestedFriendId: string,
  suggestedFriendName: string,
  suggestedFriendAvatar?: string
) => {
  return sendNotification({
    type: 'friend_suggestion',
    userId: suggestedFriendId,
    userName: suggestedFriendName,
    userAvatar: suggestedFriendAvatar,
    content: 'est une suggestion d\'ami basée sur votre réseau',
    actionUrl: `/users/${suggestedFriendId}`,
  });
};

/**
 * Crée une notification de "partage"
 */
export const createShareNotification = async (
  contentAuthorId: string,
  contentId: string,
  shareType: 'post' | 'story',
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar?: string
) => {
  return sendNotification({
    type: 'share',
    userId: currentUserId,
    userName: currentUserName,
    userAvatar: currentUserAvatar,
    targetId: contentId,
    content: `a partagé votre ${shareType === 'post' ? 'publication' : 'story'}`,
    actionUrl: `/${shareType}s/${contentId}`,
  });
};

/**
 * Crée une notification de "mention/identification"
 */
export const createMentionNotification = async (
  mentionedUserId: string,
  postId: string,
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar?: string
) => {
  return sendNotification({
    type: 'identification',
    userId: currentUserId,
    userName: currentUserName,
    userAvatar: currentUserAvatar,
    targetId: postId,
    content: 'vous a identifié dans une publication',
    actionUrl: `/posts/${postId}`,
  });
};

/**
 * Crée une notification de "message privé"
 */
export const createMessageNotification = async (
  recipientId: string,
  senderId: string,
  senderName: string,
  messageText: string,
  senderAvatar?: string
) => {
  return sendNotification({
    type: 'message',
    userId: senderId,
    userName: senderName,
    userAvatar: senderAvatar,
    targetId: recipientId,
    content: `${messageText.substring(0, 50)}...`,
    actionUrl: `/messages?user=${senderId}`,
  });
};

/**
 * Envoie une notification au serveur
 * Le serveur gérera la broadcast via SSE
 */
const sendNotification = async (payload: Omit<NotificationPayload, 'userId'> & { userId: string }) => {
  try {
    const response = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Failed to create notification:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
};

/**
 * Déclenche une notification de bureau (optionnel)
 */
export const triggerDesktopNotification = (title: string, options?: NotificationOptions) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.svg',
      ...options,
    });
  }
};

/**
 * Demande la permission pour les notifications de bureau
 */
export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};
