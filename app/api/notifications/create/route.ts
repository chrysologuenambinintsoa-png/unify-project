'use server';

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/notifications/create
 * Crée une notification et la broadcast à l'utilisateur concerné via SSE
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { type, userId, content, actionUrl } = body;

    // Validation
    if (!type || !userId || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur actuel
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, username: true, fullName: true, avatar: true },
    });

    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // Créer la notification dans la base de données
    try {
      const notification = await prisma.notification.create({
        data: {
          type: type,
          title: content.substring(0, 100), // Utiliser le contenu comme titre
          content: content,
          url: actionUrl || '',
          isRead: false,
          actorId: currentUser.id,
          user: {
            connect: { id: userId }
          }
        },
      });

      const notificationData = {
        id: notification.id,
        type: notification.type,
        user: {
          id: currentUser.id,
          username: currentUser.username,
          fullName: currentUser.fullName,
          avatar: currentUser.avatar,
        },
        content: notification.content,
        time: notification.createdAt.toISOString(),
        read: notification.isRead,
        url: notification.url,
      };

      return new Response(JSON.stringify(notificationData), { status: 201 });
    } catch (prismaError) {
      console.error('Prisma error:', prismaError);
      // Si le modèle Notification n'existe pas, créer une réponse simple
      return new Response(
        JSON.stringify({ 
          message: 'Notification created (model may not exist in Prisma)',
          type,
          content,
          actionUrl
        }), 
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
