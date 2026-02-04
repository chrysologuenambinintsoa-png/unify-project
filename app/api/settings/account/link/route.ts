import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/settings/account/link-account - Link another account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider, providerAccountId } = await request.json();

    if (!provider || !providerAccountId) {
      return NextResponse.json(
        { error: 'Provider et providerAccountId sont requis' },
        { status: 400 }
      );
    }

    // Check if account already linked
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Ce compte est déjà lié' },
        { status: 400 }
      );
    }

    // Link account
    await prisma.account.create({
      data: {
        userId: session.user.id,
        type: 'oauth',
        provider,
        providerAccountId,
        access_token: null,
      },
    });

    return NextResponse.json({ message: 'Compte lié avec succès' });
  } catch (error) {
    console.error('Error linking account:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la liaison du compte' },
      { status: 500 }
    );
  }
}

// GET /api/settings/account/linked-accounts - Get linked accounts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true, providerAccountId: true },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching linked accounts:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des comptes' },
      { status: 500 }
    );
  }
}
