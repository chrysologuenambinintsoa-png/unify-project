// Script de nettoyage des données fictives
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log("🧹 Début du nettoyage de la base de données...\n");

    // Supprimer les données dans l'ordre inverse des dépendances
    try {
      const messageReactionCount = await prisma.messageReaction.deleteMany({});
      console.log(`✓ MessageReaction: ${messageReactionCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ MessageReaction: table n'existe pas (ignorée)`);
    }

    try {
      const messageCount = await prisma.message.deleteMany({});
      console.log(`✓ Message: ${messageCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ Message: table n'existe pas (ignorée)`);
    }

    try {
      const storyReactionCount = await prisma.storyReaction.deleteMany({});
      console.log(`✓ StoryReaction: ${storyReactionCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ StoryReaction: table n'existe pas (ignorée)`);
    }

    try {
      const storyViewCount = await prisma.storyView.deleteMany({});
      console.log(`✓ StoryView: ${storyViewCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ StoryView: table n'existe pas (ignorée)`);
    }

    try {
      const storyCount = await prisma.story.deleteMany({});
      console.log(`✓ Story: ${storyCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ Story: table n'existe pas (ignorée)`);
    }

    try {
      const reactionCount = await prisma.reaction.deleteMany({});
      console.log(`✓ Reaction: ${reactionCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ Reaction: table n'existe pas (ignorée)`);
    }

    try {
      const shareCount = await prisma.share.deleteMany({});
      console.log(`✓ Share: ${shareCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ Share: table n'existe pas (ignorée)`);
    }

    try {
      const likeCount = await prisma.like.deleteMany({});
      console.log(`✓ Like: ${likeCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ Like: table n'existe pas (ignorée)`);
    }

    try {
      const postMediaCount = await prisma.postMedia.deleteMany({});
      console.log(`✓ PostMedia: ${postMediaCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ PostMedia: table n'existe pas (ignorée)`);
    }

    try {
      const commentCount = await prisma.comment.deleteMany({});
      console.log(`✓ Comment: ${commentCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ Comment: table n'existe pas (ignorée)`);
    }

    try {
      const postCount = await prisma.post.deleteMany({});
      console.log(`✓ Post: ${postCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ Post: table n'existe pas (ignorée)`);
    }

    try {
      const pagePostMediaCount = await prisma.pagePostMedia.deleteMany({});
      console.log(`✓ PagePostMedia: ${pagePostMediaCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ PagePostMedia: table n'existe pas (ignorée)`);
    }

    try {
      const pagePostCount = await prisma.pagePost.deleteMany({});
      console.log(`✓ PagePost: ${pagePostCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ PagePost: table n'existe pas (ignorée)`);
    }

    try {
      const pageLikeCount = await (prisma as any).pageLike.deleteMany({});
      console.log(`✓ PageLike: ${pageLikeCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ PageLike: table n'existe pas (ignorée)`);
    }

    try {
      const groupPostMediaCount = await prisma.groupPostMedia.deleteMany({});
      console.log(`✓ GroupPostMedia: ${groupPostMediaCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ GroupPostMedia: table n'existe pas (ignorée)`);
    }

    try {
      const groupPostCount = await prisma.groupPost.deleteMany({});
      console.log(`✓ GroupPost: ${groupPostCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ GroupPost: table n'existe pas (ignorée)`);
    }

    try {
      const pageAdminCount = await prisma.pageAdmin.deleteMany({});
      console.log(`✓ PageAdmin: ${pageAdminCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ PageAdmin: table n'existe pas (ignorée)`);
    }

    try {
      const pageInviteCount = await prisma.pageInvite.deleteMany({});
      console.log(`✓ PageInvite: ${pageInviteCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ PageInvite: table n'existe pas (ignorée)`);
    }

    try {
      const pageMemberCount = await prisma.pageMember.deleteMany({});
      console.log(`✓ PageMember: ${pageMemberCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ PageMember: table n'existe pas (ignorée)`);
    }

    try {
      const pageCount = await prisma.page.deleteMany({});
      console.log(`✓ Page: ${pageCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ Page: table n'existe pas (ignorée)`);
    }

    try {
      const groupMemberCount = await prisma.groupMember.deleteMany({});
      console.log(`✓ GroupMember: ${groupMemberCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ GroupMember: table n'existe pas (ignorée)`);
    }

    try {
      const groupCount = await prisma.group.deleteMany({});
      console.log(`✓ Group: ${groupCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ Group: table n'existe pas (ignorée)`);
    }

    try {
      const friendshipCount = await prisma.friendship.deleteMany({});
      console.log(`✓ Friendship: ${friendshipCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ Friendship: table n'existe pas (ignorée)`);
    }

    try {
      const notificationCount = await prisma.notification.deleteMany({});
      console.log(`✓ Notification: ${notificationCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ Notification: table n'existe pas (ignorée)`);
    }

    try {
      const sessionCount = await prisma.session.deleteMany({});
      console.log(`✓ Session: ${sessionCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ Session: table n'existe pas (ignorée)`);
    }

    try {
      const accountCount = await prisma.account.deleteMany({});
      console.log(`✓ Account: ${accountCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ Account: table n'existe pas (ignorée)`);
    }

    try {
      const verificationTokenCount = await prisma.verificationToken.deleteMany({});
      console.log(`✓ VerificationToken: ${verificationTokenCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ VerificationToken: table n'existe pas (ignorée)`);
    }

    try {
      const userCount = await prisma.user.deleteMany({});
      console.log(`✓ User: ${userCount.count} enregistrements supprimés`);
    } catch (error) {
      console.log(`⚠ User: table n'existe pas (ignorée)`);
    }

    console.log("\n✅ Nettoyage terminé avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
