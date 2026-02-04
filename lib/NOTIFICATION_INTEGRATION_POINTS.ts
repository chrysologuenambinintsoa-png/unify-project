/**
 * INTÉGRATION DES NOTIFICATIONS - POINTS D'INTÉGRATION
 * 
 * Ce fichier documente les points d'intégration des notifications
 * dans les différents composants de l'application.
 */

/**
 * 1. LIKE NOTIFICATION
 * Fichier: components/post/PostCard.tsx
 * 
 * Ajouter dans la fonction handleLike():
 */

// import { createLikeNotification } from '@/lib/notificationService';
// 
// const handleLike = async () => {
//   if (!liked) {
//     setLiked(true);
//     setCurrentReaction('Like');
//     setLikeCount(prev => prev + 1);
//     
//     // Créer la notification
//     if (post.author?.id) {
//       await createLikeNotification(
//         post.author.id,
//         post.id,
//         session?.user?.id || '',
//         session?.user?.name || 'Utilisateur',
//         session?.user?.image
//       );
//     }
//   }
// };

/**
 * 2. COMMENT NOTIFICATION
 * Fichier: components/post/PostCard.tsx ou components/CommentsModal.tsx
 * 
 * Ajouter dans la fonction handleAddComment():
 */

// import { createCommentNotification } from '@/lib/notificationService';
//
// const handleAddComment = () => {
//   if (newComment.trim()) {
//     const newCommentObj: Comment = {
//       id: Date.now().toString(),
//       user: 'You',
//       avatar: 'Y',
//       content: newComment,
//       timestamp: new Date(),
//     };
//     setComments(prev => [...prev, newCommentObj]);
//     setCommentCount(prev => prev + 1);
//     
//     // Créer la notification
//     if (post.author?.id) {
//       await createCommentNotification(
//         post.author.id,
//         post.id,
//         session?.user?.id || '',
//         session?.user?.name || 'Utilisateur',
//         newComment,
//         session?.user?.image
//       );
//     }
//     
//     setNewComment('');
//   }
// };

/**
 * 3. FOLLOW NOTIFICATION
 * Fichier: app/users/[userId]/page.tsx
 * 
 * Ajouter dans la fonction de suivi:
 */

// import { createFollowNotification } from '@/lib/notificationService';
//
// const handleFollowClick = async () => {
//   try {
//     const res = await fetch(`/api/users/${userId}/follow`, {
//       method: 'POST',
//       credentials: 'include',
//     });
//     
//     if (res.ok) {
//       setFollowing(true);
//       
//       // Créer la notification
//       await createFollowNotification(
//         userId,
//         session?.user?.id || '',
//         session?.user?.name || 'Utilisateur',
//         session?.user?.image
//       );
//     }
//   } catch (error) {
//     console.error('Error following user:', error);
//   }
// };

/**
 * 4. STORY NOTIFICATION
 * Fichier: components/CreateStoryModal.tsx
 * 
 * Ajouter après la création d'une story:
 */

// import { createStoryNotification, triggerDesktopNotification } from '@/lib/notificationService';
//
// const handleCreateStory = async (storyData: any) => {
//   try {
//     const res = await fetch('/api/stories', {
//       method: 'POST',
//       credentials: 'include',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(storyData),
//     });
//     
//     if (res.ok) {
//       const story = await res.json();
//       
//       // Récupérer les followers
//       const followersRes = await fetch('/api/users/followers', {
//         credentials: 'include',
//       });
//       
//       if (followersRes.ok) {
//         const followers = await followersRes.json();
//         
//         // Notifier chaque follower
//         for (const follower of followers) {
//           await createStoryNotification(
//             session?.user?.id || '',
//             follower.id,
//             session?.user?.name || 'Utilisateur',
//             session?.user?.image
//           );
//         }
//       }
//       
//       triggerDesktopNotification('Story publiée avec succès');
//     }
//   } catch (error) {
//     console.error('Error creating story:', error);
//   }
// };

/**
 * 5. FRIEND SUGGESTION NOTIFICATION
 * Fichier: components/FriendSuggestions.tsx
 * 
 * Optionnel: Notifier quand une suggestion est affichée
 */

// import { createFriendSuggestionNotification } from '@/lib/notificationService';
//
// // Lors de l'affichage d'une suggestion:
// useEffect(() => {
//   if (suggestions.length > 0) {
//     const currentSuggestion = suggestions[currentIndex];
//     
//     // Vous pouvez notifier l'utilisateur suggéré
//     // await createFriendSuggestionNotification(
//     //   currentSuggestion.id,
//     //   currentSuggestion.fullName,
//     //   currentSuggestion.avatar
//     // );
//   }
// }, [currentIndex]);

/**
 * 6. SHARE NOTIFICATION
 * Fichier: components/post/ShareModal.tsx
 * 
 * Ajouter dans la fonction handleShare:
 */

// import { createShareNotification } from '@/lib/notificationService';
//
// const handleSharePost = async (shareType: 'message' | 'group', recipientId: string) => {
//   try {
//     const response = await fetch(`/api/posts/${post.id}/share`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         shareType,
//         recipientId: shareType === 'message' ? recipientId : undefined,
//         groupId: shareType === 'group' ? recipientId : undefined,
//       }),
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.error || 'Failed to share post');
//     }

//     // Créer la notification
//     if (post.author?.id) {
//       await createShareNotification(
//         post.author.id,
//         post.id,
//         'post',
//         session?.user?.id || '',
//         session?.user?.name || 'Utilisateur',
//         session?.user?.image
//       );
//     }
//   } catch (err) {
//     console.error('Share error:', err);
//     throw err;
//   }
// };

/**
 * 7. MENTION/IDENTIFICATION NOTIFICATION
 * Fichier: app/posts/create/page.tsx ou composant de création de post
 * 
 * Ajouter quand les utilisateurs sont identifiés dans un post:
 */

// import { createMentionNotification } from '@/lib/notificationService';
//
// const handleCreatePostWithMentions = async (content: string, mentionedUserIds: string[]) => {
//   try {
//     const res = await fetch('/api/posts', {
//       method: 'POST',
//       credentials: 'include',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ 
//         content,
//         mentions: mentionedUserIds 
//       }),
//     });

//     if (res.ok) {
//       const post = await res.json();
//       
//       // Notifier chaque utilisateur mentionné
//       for (const mentionedUserId of mentionedUserIds) {
//         await createMentionNotification(
//           mentionedUserId,
//           post.id,
//           session?.user?.id || '',
//           session?.user?.name || 'Utilisateur',
//           session?.user?.image
//         );
//       }
//     }
//   } catch (error) {
//     console.error('Error creating post:', error);
//   }
// };

/**
 * 8. MESSAGE NOTIFICATION
 * Fichier: app/messages/page.tsx
 * 
 * Ajouter dans la fonction handleSendMessage:
 */

// import { createMessageNotification } from '@/lib/notificationService';
//
// const handleSendMessage = async () => {
//   try {
//     const res = await fetch('/api/messages/send', {
//       method: 'POST',
//       credentials: 'include',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         receiverId: selectedConversation,
//         content: newMessage,
//       }),
//     });

//     if (res.ok) {
//       const sent = await res.json();
//       
//       // Créer la notification du message
//       await createMessageNotification(
//         selectedConversation,
//         session?.user?.id || '',
//         session?.user?.name || 'Utilisateur',
//         newMessage,
//         session?.user?.image
//       );
//       
//       setNewMessage('');
//     }
//   } catch (error) {
//     console.error('Error sending message:', error);
//   }
// };

/**
 * CONFIGURATION GLOBALE
 * 
 * Pour activer les notifications de bureau, ajoutez ceci au composant principal:
 */

// useEffect(() => {
//   requestNotificationPermission().then(granted => {
//     if (granted) {
//       console.log('Desktop notifications enabled');
//     }
//   });
// }, []);

/**
 * STATISTIQUES DES NOTIFICATIONS
 * 
 * Les notifications sont reçues en temps réel via SSE.
 * Le hook useNotifications() gère automatiquement:
 * - Récupération initiale des notifications
 * - Connexion SSE pour les mises à jour en temps réel
 * - Marquage comme lu
 * - Compteur de notifications non lues
 */
