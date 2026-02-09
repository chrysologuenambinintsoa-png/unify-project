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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me',
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
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
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password are required');
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user) {
            console.log('[Auth] User not found:', credentials.email);
            throw new Error('User not found');
          }

          if (!user.email) {
            console.error('[Auth] User email is missing:', user.id);
            throw new Error('Invalid user email');
          }

          if (!user.password) {
            console.log('[Auth] User has no password set:', credentials.email);
            throw new Error('No password set for this account');
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isCorrectPassword) {
            console.log('[Auth] Invalid password attempt for:', credentials.email);
            throw new Error('Invalid password');
          }

          console.log('[Auth] User authenticated successfully:', credentials.email);
          return {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.fullName || undefined,
            image: user.avatar || undefined,
          };
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          console.error('[Auth] Authorize error:', msg);
          throw new Error(msg);
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Record login history only for credentials provider
      if (credentials) {
        try {
          if (user?.email) {
            await prisma.loginHistory.create({
              data: {
                userId: user.id as string,
                email: user.email,
                userAgent: null, // IP will be captured server-side if needed
                ipAddress: null,
              },
            });
          }
        } catch (err) {
          console.error('[Auth] Failed to record login history:', err);
          // Don't fail login if history recording fails
        }
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
      try {
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
            } catch (dbErr) {
              console.error('[Auth] Failed to fetch user data in session callback:', dbErr);
              // Continue without user data rather than failing session
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
      } catch (err) {
        console.error('[Auth] Session callback error:', err);
        // Return session even if enrichment fails
      }
      return session;
    },
  },
};