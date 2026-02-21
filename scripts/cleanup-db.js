const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log('🗑️  Starting database cleanup...');
    console.log('⚠️  WARNING: This will delete ALL data but keep table structure\n');

    // Delete in order (considering foreign key constraints)
    console.log('Deleting hidden messages...');
    await prisma.hiddenMessage.deleteMany({});

    console.log('Deleting message reactions...');
    await prisma.messageReaction.deleteMany({});

    console.log('Deleting messages...');
    await prisma.message.deleteMany({});

    console.log('Deleting post reports...');
    await prisma.postReport.deleteMany({});

    console.log('Deleting post media...');
    await prisma.postMedia.deleteMany({});

    console.log('Deleting notifications...');
    await prisma.notification.deleteMany({});

    console.log('Deleting story reactions...');
    await prisma.storyReaction.deleteMany({});

    console.log('Deleting story views...');
    await prisma.storyView.deleteMany({});

    console.log('Deleting stories...');
    await prisma.story.deleteMany({});

    console.log('Deleting comment reactions...');
    await prisma.commentReaction.deleteMany({});

    console.log('Deleting likes...');
    await prisma.like.deleteMany({});

    console.log('Deleting reactions...');
    await prisma.reaction.deleteMany({});

    console.log('Deleting comments...');
    await prisma.comment.deleteMany({});

    console.log('Deleting shares...');
    await prisma.share.deleteMany({});

    console.log('Deleting posts...');
    await prisma.post.deleteMany({});

    console.log('Deleting friendships...');
    await prisma.friendship.deleteMany({});

    console.log('Deleting group members...');
    await prisma.groupMember.deleteMany({});

    console.log('Deleting groups...');
    await prisma.group.deleteMany({});

    console.log('Deleting poll votes...');
    await prisma.pollVote.deleteMany({});

    console.log('Deleting page polls...');
    await prisma.pagePoll.deleteMany({});

    console.log('Deleting group polls...');
    await prisma.groupPoll.deleteMany({});

    console.log('Deleting sessions...');
    await prisma.session.deleteMany({});

    console.log('Deleting accounts...');
    await prisma.account.deleteMany({});

    console.log('Deleting verification tokens...');
    await prisma.verificationToken.deleteMany({});

    console.log('Deleting users...');
    await prisma.user.deleteMany({});

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('All tables are now empty, structure preserved.\n');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
