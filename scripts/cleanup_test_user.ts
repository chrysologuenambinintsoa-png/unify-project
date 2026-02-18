import { prisma } from '@/lib/prisma';

async function main() {
  try {
    const testUserId = 'cmlqkymws0000kbywlpiqdh3h';

    // Delete user and cascade delete all related data
    const deletedUser = await prisma.user.delete({
      where: { id: testUserId },
    });

    console.log('✅ Test user deleted successfully:', deletedUser.username);
    console.log('   All related records (messages, sessions, etc.) were automatically deleted.');
  } catch (error) {
    if ((error as any).code === 'P2025') {
      console.log('ℹ️  Test user not found (already deleted or ID mismatch)');
    } else {
      console.error('❌ Error deleting test user:', error);
      process.exit(1);
    }
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
