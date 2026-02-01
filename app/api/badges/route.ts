import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/badges
 * Récupère les badges en temps réel pour la sidebar
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        data: {
          friends: 0,
          messages: 0,
          notifications: 0,
          groups: 0,
          pages: 0,
          stats: {
            friends: 0,
            groups: 0
          }
        }
      });
    }

    const userId = session.user.id;

    try {
      // Récupérer les demandes d'amis en attente
      const friendRequestsCount = await Promise.race([
        prisma.friendship.count({
          where: {
            user2Id: userId,
            status: 'pending'
          }
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000)
        )
      ]).catch(() => 0);

      // Récupérer les messages non lus
      const unreadMessagesCount = await Promise.race([
        prisma.message.count({
          where: {
            receiverId: userId,
            isRead: false
          }
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000)
        )
      ]).catch(() => 0);

      // Récupérer les notifications non lues
      const unreadNotificationsCount = await Promise.race([
        prisma.notification.count({
          where: {
            userId: userId,
            isRead: false
          }
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000)
        )
      ]).catch(() => 0);

      // Récupérer les invitations de groupe en attente
      // The GroupMember.joinedAt is non-nullable in schema; there is no explicit 'pending' flag.
      // For now, return 0 pending invites to satisfy typings until invite logic is implemented.
      const groupInvitesCount = 0;

      // Récupérer les invitations de page en attente
      const pageInvitesCount = await Promise.race([
        prisma.pageInvite.count({
          where: {
            userId: userId
          }
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000)
        )
      ]).catch(() => 0);

      // Récupérer le nombre d'amis
      const friendsCount = await Promise.race([
        prisma.friendship.count({
          where: {
            OR: [
              { user1Id: userId, status: 'accepted' },
              { user2Id: userId, status: 'accepted' }
            ]
          }
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000)
        )
      ]).catch(() => 0);

      // Récupérer le nombre de groupes (tous les memberships pour cet utilisateur)
      const groupsCount = await Promise.race([
        prisma.groupMember.count({
          where: {
            userId: userId,
          }
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000)
        )
      ]).catch(() => 0);

      const badges = {
        friends: friendRequestsCount || 0,
        messages: unreadMessagesCount || 0,
        notifications: unreadNotificationsCount || 0,
        groups: groupInvitesCount || 0,
        pages: pageInvitesCount || 0,
        stats: {
          friends: friendsCount || 0,
          groups: groupsCount || 0
        }
      };

      return NextResponse.json({
        success: true,
        data: badges
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        success: true,
        data: {
          friends: 0,
          messages: 0,
          notifications: 0,
          groups: 0,
          pages: 0,
          stats: {
            friends: 0,
            groups: 0
          }
        }
      });
    }
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json({
      success: true,
      data: {
        friends: 0,
        messages: 0,
        notifications: 0,
        groups: 0,
        pages: 0,
        stats: {
          friends: 0,
          groups: 0
        }
      }
    });
  }
}
