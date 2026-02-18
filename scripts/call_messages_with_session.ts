import crypto from 'crypto';
import fetch from 'node-fetch';
import { prisma } from '@/lib/prisma';

async function main() {
  // find or create a user
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'testuser@example.com',
        fullName: 'Test User',
      },
    });
    console.log('Created test user', user.id);
  } else {
    console.log('Using existing user', user.id);
  }

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires,
    },
  });

  console.log('Created session token:', sessionToken);

  // Call the local API with the NextAuth session cookie
  const res = await fetch('http://localhost:3000/api/messages', {
    headers: {
      Cookie: `next-auth.session-token=${sessionToken}`,
    },
  });

  console.log('Status:', res.status);
  const body = await res.text();
  console.log('Body:', body);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});