import { prisma } from '@/lib/prisma';
import { sendNotificationEmail } from '@/lib/email';

/**
 * Envoie une notification à un utilisateur
 * Type de notifications:
 * - message: nouveau message
 * - comment: nouveau commentaire
 * - like: nouveau like
 * - mention: mention
 * - follow: nouvel abonné
 * - friend_request: demande d'ami
 * - badge: nouveau badge
 */
export interface NotificationPayload {
  userId: string; // ID de l'utilisateur qui reçoit
  type:
    | 'message'
    | 'comment'
    | 'like'
    | 'mention'
    | 'follow'
    | 'friend_request'
    | 'badge'
    | 'group_invite'
    | 'story_reply';
  title: string;
  message: string;
  senderId?: string; // ID de l'utilisateur qui envoie (optionnel)
  actionUrl?: string; // URL vers l'action (optionnel)
  sendEmail?: boolean; // Envoyer un email? (défaut: true)
}

export async function notifyUser(payload: NotificationPayload): Promise<void> {
  try {
    const {
      userId,
      type,
      title,
      message,
      senderId,
      actionUrl,
      sendEmail = true,
    } = payload;

    // Créer la notification dans la base de données
    try {
      await prisma.notification.create({
        data: {
          type,
          title,
          content: message,
          url: actionUrl || '',
          isRead: false,
          userId,
          actorId: senderId || userId,
        },
      });
      console.log(`Notification created for user ${userId}: ${type}`);
    } catch (dbError) {
      console.error(`Failed to create notification in database:`, dbError);
      // Continue to send email even if DB fails
    }

    // Envoyer l'email si demandé
    if (sendEmail) {
      try {
        const recipient = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });

        // Vérifier que l'email existe
        if (recipient?.email) {
          await sendNotificationEmail(recipient.email, title, message);
          console.log(`Notification email sent to user ${userId}`);
        }
      } catch (emailError) {
        console.error(
          `Failed to send notification email to user ${userId}:`,
          emailError
        );
        // Ne pas bloquer si l'email échoue
      }
    }
  } catch (error) {
    console.error('Error in notifyUser:', error);
    throw error;
  }
}

// Cas d'usage spécifiques

export async function notifyNewMessage(
  recipientId: string,
  senderName: string,
  message: string,
  conversationUrl?: string
) {
  return notifyUser({
    userId: recipientId,
    type: 'message',
    title: `Nouveau message de ${senderName}`,
    message: `"${message.substring(0, 100)}..."`,
    actionUrl: conversationUrl,
  });
}

export async function notifyNewComment(
  recipientId: string,
  commenterName: string,
  postUrl?: string
) {
  return notifyUser({
    userId: recipientId,
    type: 'comment',
    title: `${commenterName} a commenté votre publication`,
    message: 'Voir le commentaire',
    actionUrl: postUrl,
  });
}

export async function notifyNewLike(
  recipientId: string,
  likerName: string,
  postUrl?: string
) {
  return notifyUser({
    userId: recipientId,
    type: 'like',
    title: `${likerName} a aimé votre publication`,
    message: 'Voir la publication',
    actionUrl: postUrl,
  });
}

export async function notifyMention(
  recipientId: string,
  mentionerName: string,
  message: string,
  postUrl?: string
) {
  return notifyUser({
    userId: recipientId,
    type: 'mention',
    title: `${mentionerName} vous a mentionné`,
    message,
    actionUrl: postUrl,
  });
}

export async function notifyNewFollow(
  recipientId: string,
  followerName: string,
  profileUrl?: string
) {
  return notifyUser({
    userId: recipientId,
    type: 'follow',
    title: `${followerName} vous suit maintenant`,
    message: 'Voir le profil',
    actionUrl: profileUrl,
  });
}

export async function notifyFriendRequest(
  recipientId: string,
  requesterName: string,
  profileUrl?: string
) {
  return notifyUser({
    userId: recipientId,
    type: 'friend_request',
    title: `Demande d'ami de ${requesterName}`,
    message: 'Accepter ou refuser',
    actionUrl: profileUrl,
  });
}

export async function notifyBadgeEarned(
  recipientId: string,
  badgeName: string,
  badgeUrl?: string
) {
  return notifyUser({
    userId: recipientId,
    type: 'badge',
    title: `🏆 Vous avez obtenu le badge "${badgeName}"`,
    message: 'Félicitations!',
    actionUrl: badgeUrl,
  });
}

export async function notifyGroupInvite(
  recipientId: string,
  inviterName: string,
  groupName: string,
  groupUrl?: string
) {
  return notifyUser({
    userId: recipientId,
    type: 'group_invite',
    title: `${inviterName} vous invite dans le groupe "${groupName}"`,
    message: 'Voir l\'invitation',
    actionUrl: groupUrl,
  });
}

export async function notifyStoryReply(
  recipientId: string,
  replierName: string,
  storyUrl?: string
) {
  return notifyUser({
    userId: recipientId,
    type: 'story_reply',
    title: `${replierName} a réagi à votre story`,
    message: 'Voir la réaction',
    actionUrl: storyUrl,
  });
}
