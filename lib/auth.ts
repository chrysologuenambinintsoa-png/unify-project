import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Simple in-memory cache for user data (max 100 entries, 5min TTL)
const userCache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedUser(userId: string) {
  const cached = userCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  userCache.delete(userId);
  return null;
}

function setCachedUser(userId: string, data: any) {
  if (userCache.size > 100) {
    const firstKey = userCache.keys().next().value as string | undefined;
    if (firstKey) userCache.delete(firstKey);
  }
  userCache.set(userId, { data, expires: Date.now() + CACHE_TTL });
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    // Google and Facebook OAuth providers removed
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.email) {
          throw new Error('Invalid credentials');
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password || ''
        );

        if (!isCorrectPassword) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.fullName || undefined,
          image: user.avatar || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Record login history
      try {
        if (user.email) {
          const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
          
          await prisma.loginHistory.create({
            data: {
              userId: user.id as string,
              email: user.email,
              userAgent: userAgent || null,
              ipAddress: null, // IP will be captured server-side if needed
            },
          });
        }
      } catch (err) {
        console.error('Failed to record login history:', err);
        // Don't fail login if history recording fails
      }
      
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        
        // Check cache first
        let dbUser = getCachedUser(token.id as string);
        
        // If not cached, fetch from database
        if (!dbUser) {
          try {
            dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: {
                email: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            });
            
            if (dbUser) {
              setCachedUser(token.id as string, dbUser);
            }
          } catch (err) {
            console.error('Failed to fetch user data in session callback:', err);
          }
        }
        
        if (dbUser) {
          session.user.email = dbUser.email || undefined;
          session.user.username = dbUser.username || undefined;
          session.user.fullName = dbUser.fullName || undefined;
          session.user.image = dbUser.avatar || undefined;
          session.user.avatar = dbUser.avatar || undefined;
        }
      }
      return session;
    },
  },
};