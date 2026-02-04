import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// POST /api/settings/account/delete - Delete user account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password, confirmDelete } = await request.json();

    if (!password || confirmDelete !== true) {
      return NextResponse.json(
        { error: 'Confirmation et mot de passe requis' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password || '');

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Delete user and related data
    await prisma.$transaction([
      // Delete notifications
      prisma.notification.deleteMany({ where: { userId: session.user.id } }),
      
      // Delete friendships
      prisma.friendship.deleteMany({
        where: {
          OR: [
            { user1Id: session.user.id },
            { user2Id: session.user.id },
          ],
        },
      }),

      // Delete posts
      prisma.post.deleteMany({ where: { userId: session.user.id } }),

      // Delete sessions
      prisma.session.deleteMany({ where: { userId: session.user.id } }),

      // Delete accounts
      prisma.account.deleteMany({ where: { userId: session.user.id } }),

      // Delete user
      prisma.user.delete({ where: { id: session.user.id } }),
    ]);

    return NextResponse.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du compte' },
      { status: 500 }
    );
  }
}
