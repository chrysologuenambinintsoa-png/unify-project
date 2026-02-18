const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUsernames() {
  try {
    console.log('🔍 Finding users with malformed usernames...');
    
    // Find users with usernames like user_cmlienzkb0000jr048w9nqyby (random ID format)
    const users = await prisma.user.findMany({
      where: {
        username: {
          startsWith: 'user_'
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true
      }
    });

    console.log(`Found ${users.length} users with user_ prefix`);

    for (const user of users) {
      // Check if this looks like a malformed username (starts with user_ followed by long random chars)
      const isMalformed = user.username.match(/^user_[a-z0-9]{20,}$/i);
      
      if (!isMalformed) {
        console.log(`✅ ${user.username} looks good, skipping`);
        continue;
      }

      let newUsername = user.username; // keep as fallback

      // Try to generate a better username from email
      if (user.email && user.email.includes('@')) {
        newUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 20);
      } 
      // Try to generate from fullName
      else if (user.fullName) {
        newUsername = user.fullName.toLowerCase().replace(/[^a-z0-9_\s]/g, '').replace(/\s+/g, '_').substring(0, 20);
      }

      // Check if the new username is taken
      if (newUsername !== user.username) {
        const existing = await prisma.user.findFirst({
          where: {
            username: newUsername,
            NOT: { id: user.id }
          }
        });

        if (existing) {
          console.log(`⚠️  ${user.username} → ${newUsername} (already taken, adding suffix)`);
          newUsername = `${newUsername}_${user.id.substring(0, 4)}`;
        }

        // Update the user
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: { username: newUsername }
        });

        console.log(`✅ Updated: ${user.username} → ${newUsername}`);
      }
    }

    console.log('✨ Done! All usernames fixed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUsernames();
