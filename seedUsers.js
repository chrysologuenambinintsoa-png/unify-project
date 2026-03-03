const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create test user
  const user1 = await prisma.user.create({
    data: {
      email: 'chrysologuenambinintsoa@gmail.com',
      passwordHash: 'hashed_password', // In real app, hash this properly
      prenom: 'Chrysologue',
      nom: 'Nambinintsoa',
      nomUtilisateur: 'chrysologue',
      avatar: null,
      avatarUrl: null
    }
  });

  // Create a second test user for friendship
  const user2 = await prisma.user.create({
    data: {
      email: 'friend@test.com',
      passwordHash: 'hashed_password',
      prenom: 'Test',
      nom: 'Friend',
      nomUtilisateur: 'testfriend',
      avatar: null,
      avatarUrl: null
    }
  });

  // Create a friendship between them
  await prisma.friendship.create({
    data: {
      userId: user1.id,
      friendId: user2.id
    }
  });

  console.log('✅ Users created:', { user1, user2 });
  console.log('✅ Friendship created between users');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
