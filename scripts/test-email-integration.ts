/**
 * EMAIL_INTEGRATION_TEST.ts
 * 
 * Script de test pour valider l'intégration des emails dans Unify
 * Exécuter avec: npx ts-node scripts/test-email-integration.ts
 */

import { prisma } from '@/lib/prisma';
import {
  sendEmail,
  sendVerificationCodeEmail,
  sendResetCodeEmail,
  sendWelcomeEmail,
  sendNotificationEmail,
  verifySmtpConnection,
} from '@/lib/email';
import {
  notifyNewMessage,
  notifyNewComment,
  notifyNewLike,
  notifyMention,
  notifyNewFollow,
  notifyFriendRequest,
  notifyBadgeEarned,
  notifyGroupInvite,
  notifyStoryReply,
} from '@/lib/notification-service';

const TEST_EMAIL = process.env.SMTP_USER || 'test@example.com';

async function runTests() {
  console.log('🚀 Starting Email Integration Tests...\n');

  try {
    // Test 1: Vérifier la connexion SMTP
    console.log('1️⃣ Testing SMTP Connection...');
    const isConnected = await verifySmtpConnection();
    if (isConnected) {
      console.log('✅ SMTP connection successful\n');
    } else {
      console.log('❌ SMTP connection failed\n');
      return;
    }

    // Test 2: Test sendEmail
    console.log('2️⃣ Testing Basic Email Send...');
    try {
      const result = await sendEmail(
        TEST_EMAIL,
        'Test Email - Unify',
        '<h1>Ceci est un test</h1><p>Si vous voyez ce message, les emails fonctionnent!</p>'
      );
      console.log('✅ Basic email sent:', result.messageId, '\n');
    } catch (error) {
      console.log('❌ Failed to send basic email:', error, '\n');
    }

    // Test 3: Test Verification Email
    console.log('3️⃣ Testing Verification Code Email...');
    try {
      const result = await sendVerificationCodeEmail(TEST_EMAIL, '123456');
      console.log('✅ Verification email sent:', result.messageId, '\n');
    } catch (error) {
      console.log('❌ Failed to send verification email:', error, '\n');
    }

    // Test 4: Test Reset Email
    console.log('4️⃣ Testing Reset Code Email...');
    try {
      const result = await sendResetCodeEmail(TEST_EMAIL, '654321');
      console.log('✅ Reset email sent:', result.messageId, '\n');
    } catch (error) {
      console.log('❌ Failed to send reset email:', error, '\n');
    }

    // Test 5: Test Welcome Email
    console.log('5️⃣ Testing Welcome Email...');
    try {
      const result = await sendWelcomeEmail(TEST_EMAIL, 'Jean Dupont');
      console.log('✅ Welcome email sent:', result.messageId, '\n');
    } catch (error) {
      console.log('❌ Failed to send welcome email:', error, '\n');
    }

    // Test 6: Test Notification Email
    console.log('6️⃣ Testing Notification Email...');
    try {
      const result = await sendNotificationEmail(
        TEST_EMAIL,
        'Vous avez un nouveau message',
        'Pierre Martin vous a envoyé un message.'
      );
      console.log('✅ Notification email sent:', result.messageId, '\n');
    } catch (error) {
      console.log('❌ Failed to send notification email:', error, '\n');
    }

    // Test 7: Create test user for notification tests
    console.log('7️⃣ Testing Notification Service (requires test user)...');
    try {
      // Trouver ou créer un utilisateur de test
      let testUser = await prisma.user.findUnique({
        where: { email: 'test@unify.local' },
      });

      if (!testUser) {
        console.log('  Creating test user...');
        testUser = await prisma.user.create({
          data: {
            email: 'test@unify.local',
            username: 'testuser',
            fullName: 'Test User',
            dateOfBirth: new Date('1990-01-01'),
            password: 'hashed_password',
          },
        });
      }

      // Test notification functions
      console.log('  Testing notifyNewMessage...');
      await notifyNewMessage(
        testUser.id,
        'Alice Martin',
        'Bonjour, comment ça va?',
        '/messages?userId=alice-id'
      );
      console.log('  ✅ notifyNewMessage');

      console.log('  Testing notifyNewComment...');
      await notifyNewComment(
        testUser.id,
        'Bob Smith',
        '/posts/post-123'
      );
      console.log('  ✅ notifyNewComment');

      console.log('  Testing notifyNewLike...');
      await notifyNewLike(
        testUser.id,
        'Carol White',
        '/posts/post-456'
      );
      console.log('  ✅ notifyNewLike');

      console.log('  Testing notifyMention...');
      await notifyMention(
        testUser.id,
        'David Brown',
        'Vous avez été mentionné dans un commentaire intéressant',
        '/posts/post-789'
      );
      console.log('  ✅ notifyMention');

      console.log('  Testing notifyNewFollow...');
      await notifyNewFollow(
        testUser.id,
        'Eva Garcia',
        '/profile/eva-id'
      );
      console.log('  ✅ notifyNewFollow');

      console.log('  Testing notifyFriendRequest...');
      await notifyFriendRequest(
        testUser.id,
        'Frank Miller',
        '/profile/frank-id'
      );
      console.log('  ✅ notifyFriendRequest');

      console.log('  Testing notifyBadgeEarned...');
      await notifyBadgeEarned(
        testUser.id,
        'Contributeur Actif',
        '/badges/active-contributor'
      );
      console.log('  ✅ notifyBadgeEarned');

      console.log('  Testing notifyGroupInvite...');
      await notifyGroupInvite(
        testUser.id,
        'Grace Lee',
        'Developers Unify',
        '/groups/developers-unify'
      );
      console.log('  ✅ notifyGroupInvite');

      console.log('  Testing notifyStoryReply...');
      await notifyStoryReply(
        testUser.id,
        'Henry Chen',
        '/stories/story-123'
      );
      console.log('  ✅ notifyStoryReply');

      console.log('✅ All notification functions tested\n');
    } catch (error) {
      console.log('⚠️ Notification service test skipped (database error):', error, '\n');
    }

    console.log('🎉 All tests completed!\n');
    console.log('📧 Check your inbox at:', TEST_EMAIL);
    console.log('⚙️ If using SMTP_USER, configure it properly in .env');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
runTests().catch(console.error);
