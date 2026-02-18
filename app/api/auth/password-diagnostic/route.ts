import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/auth/password-diagnostic
 * 
 * Diagnostic endpoint to check password hashing status
 * Admin only - shows stats about password hashing in the database
 */

// Define admin email(s) - should be environment variable in production
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || ['admin@example.com'];

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Get database stats
    const stats = await prisma.user.aggregate({
      _count: true,
    });

    const totalUsers = stats._count;

    // Get sample of users with passwords to check hashing
    const userPasswords = await prisma.user.findMany({
      where: {
        password: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
      },
      take: 5, // Sample first 5 for inspection
    });

    // Analyze password types
    let bcryptCount = 0;
    let plainTextCount = 0;
    const samples = userPasswords.map((user) => {
      const isBcryptHash = /^\$2[aby]\$/.test(user.password || '');
      if (isBcryptHash) {
        bcryptCount++;
      } else {
        plainTextCount++;
      }

      return {
        email: user.email,
        username: user.username,
        passwordType: isBcryptHash ? 'bcrypt' : 'plaintext',
        passwordLength: user.password?.length || 0,
        passwordPreview: user.password ? `${user.password.substring(0, 20)}...` : 'null',
      };
    });

    // Count all passwords in database
    const allPasswords = await prisma.user.findMany({
      where: {
        password: {
          not: null,
        },
      },
      select: {
        password: true,
      },
    });

    let totalBcrypt = 0;
    let totalPlaintext = 0;

    allPasswords.forEach((user) => {
      if (/^\$2[aby]\$/.test(user.password || '')) {
        totalBcrypt++;
      } else {
        totalPlaintext++;
      }
    });

    const hasPasswordCount = allPasswords.length;
    const bcryptPercentage = hasPasswordCount > 0 ? ((totalBcrypt / hasPasswordCount) * 100).toFixed(2) : 0;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      summary: {
        totalUsers,
        usersWithPassword: hasPasswordCount,
        bcryptUsers: totalBcrypt,
        plaintextUsers: totalPlaintext,
        bcryptPercentage: `${bcryptPercentage}%`,
        recommendation: totalPlaintext > 0 ? 'Run migration: npx ts-node prisma/migrate-passwords.ts' : 'All passwords properly hashed ✓',
      },
      samples,
      details: {
        note: 'This is a diagnostic endpoint for administrators',
        endpoint: '/api/auth/password-diagnostic',
        adminRequired: true,
      },
    });
  } catch (error) {
    console.error('[Password Diagnostic] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve password diagnostic data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
