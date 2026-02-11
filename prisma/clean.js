// JS fallback cleanup script (run with `node prisma/clean.js`)
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log('🧹 Début du nettoyage de la base de données...\n');

    const safeDelete = async (name, fn) => {
      try {
        const res = await fn();
        console.log(`✓ ${name}: ${res.count} enregistrements supprimés`);
      } catch (err) {
        console.log(`⚠ ${name}: table n'existe pas (ignorée)`);
      }
    };

    await safeDelete('MessageReaction', () => prisma.messageReaction.deleteMany({}));
    await safeDelete('Message', () => prisma.message.deleteMany({}));
    await safeDelete('StoryReaction', () => prisma.storyReaction.deleteMany({}));
    await safeDelete('StoryView', () => prisma.storyView.deleteMany({}));
    await safeDelete('Story', () => prisma.story.deleteMany({}));
    await safeDelete('Reaction', () => prisma.reaction.deleteMany({}));
    await safeDelete('Share', () => prisma.share.deleteMany({}));
    await safeDelete('Like', () => prisma.like.deleteMany({}));
    await safeDelete('PostMedia', () => prisma.postMedia.deleteMany({}));
    await safeDelete('Comment', () => prisma.comment.deleteMany({}));
    await safeDelete('Post', () => prisma.post.deleteMany({}));
    await safeDelete('PagePostMedia', () => prisma.pagePostMedia.deleteMany({}));
    await safeDelete('PagePost', () => prisma.pagePost.deleteMany({}));
    await safeDelete('PageLike', () => (prisma.pageLike ? prisma.pageLike.deleteMany({}) : Promise.reject()));
    await safeDelete('PageAdmin', () => prisma.pageAdmin.deleteMany({}));
    await safeDelete('PageInvite', () => prisma.pageInvite.deleteMany({}));
    await safeDelete('PageMember', () => prisma.pageMember.deleteMany({}));
    await safeDelete('Page', () => prisma.page.deleteMany({}));
    await safeDelete('GroupMember', () => prisma.groupMember.deleteMany({}));
    await safeDelete('Group', () => prisma.group.deleteMany({}));
    await safeDelete('Friendship', () => prisma.friendship.deleteMany({}));
    await safeDelete('Notification', () => prisma.notification.deleteMany({}));
    await safeDelete('Session', () => prisma.session.deleteMany({}));
    await safeDelete('Account', () => prisma.account.deleteMany({}));
    await safeDelete('VerificationToken', () => prisma.verificationToken.deleteMany({}));
    await safeDelete('User', () => prisma.user.deleteMany({}));

    console.log('\n✅ Nettoyage terminé avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
