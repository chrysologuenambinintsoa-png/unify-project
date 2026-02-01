import readline from 'readline';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAffected() {
  const accounts = await prisma.account.findMany({
    where: { provider: { in: ['google', 'facebook'] } },
    include: { user: { select: { id: true, email: true, username: true } } },
  });
  return accounts;
}

function prompt(question: string) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise<string>((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function main() {
  try {
    console.log('\n🔎 Recherche des comptes OAuth Google/Facebook...');
    const accounts = await listAffected();

    if (accounts.length === 0) {
      console.log('Aucun compte Google ou Facebook trouvé. Rien à faire.');
      return;
    }

    console.log(`\n${accounts.length} compte(s) trouvé(s)`);
    const usersSet = new Map<string, { email?: string | null; username?: string | null }>();
    for (const a of accounts) {
      console.log(`- Account id=${a.id} provider=${a.provider} providerAccountId=${a.providerAccountId} userId=${a.userId} email=${a.user?.email || 'N/A'}`);
      usersSet.set(a.userId, { email: a.user?.email, username: a.user?.username });
    }

    const ans = (await prompt('\nVoulez-vous supprimer ces comptes OAuth ? (oui/non) ')).trim().toLowerCase();
    if (ans !== 'oui' && ans !== 'o' && ans !== 'yes' && ans !== 'y') {
      console.log('Abandon. Aucune modification effectuée.');
      return;
    }

    const deleteResult = await prisma.account.deleteMany({ where: { provider: { in: ['google', 'facebook'] } } });
    console.log(`\n✅ ${deleteResult.count} compte(s) OAuth supprimé(s)`);

    // Check for orphaned users (no accounts and no password)
    const candidateUserIds: string[] = [];
    for (const [userId] of usersSet) candidateUserIds.push(userId);

    const orphaned: Array<{ id: string; email?: string | null }> = [];
    for (const uid of candidateUserIds) {
      const acctCount = await prisma.account.count({ where: { userId: uid } });
      const user = await prisma.user.findUnique({ where: { id: uid }, select: { id: true, email: true, password: true } });
      if (!user) continue;
      const hasPassword = !!user.password;
      if (acctCount === 0 && !hasPassword) {
        orphaned.push({ id: user.id, email: user.email });
      }
    }

    if (orphaned.length > 0) {
      console.log(`\n${orphaned.length} utilisateur(s) orphelin(s) détecté(s) (sans mot de passe et sans autres comptes):`);
      for (const u of orphaned) console.log(`- userId=${u.id} email=${u.email || 'N/A'}`);

      const ans2 = (await prompt('\nVoulez-vous supprimer ces utilisateurs orphelins également ? (oui/non) ')).trim().toLowerCase();
      if (ans2 === 'oui' || ans2 === 'o' || ans2 === 'yes' || ans2 === 'y') {
        const ids = orphaned.map((u) => u.id);
        const delUsers = await prisma.user.deleteMany({ where: { id: { in: ids } } });
        console.log(`\n✅ ${delUsers.count} utilisateur(s) supprimé(s)`);
      } else {
        console.log('Les utilisateurs orphelins n\'ont pas été supprimés.');
      }
    } else {
      console.log('\nAucun utilisateur orphelin détecté.');
    }

    console.log('\nOpération terminée.');
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
