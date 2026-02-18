import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Script de migration des mots de passe
 * Convertit les mots de passe en texte brut vers des hashes bcrypt
 * 
 * Usage: npx ts-node prisma/migrate-passwords.ts
 */

async function migratePasswords() {
  console.log('🔄 Démarrage de la migration des mots de passe...\n');

  try {
    // Récupérer tous les utilisateurs avec un mot de passe
    const users = await prisma.user.findMany({
      where: {
        password: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
      },
    });

    console.log(`📊 Total d'utilisateurs avec mot de passe: ${users.length}\n`);

    let converted = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      if (!user.password) continue;

      // Vérifier si le mot de passe est déjà un hash bcrypt
      const isBcryptHash = /^\$2[aby]\$/.test(user.password);

      if (isBcryptHash) {
        console.log(`✅ ${user.email} - Déjà hashé (bcrypt)`);
        skipped++;
        continue;
      }

      try {
        // Le mot de passe est en texte brut - le hasher
        const hashedPassword = await bcrypt.hash(user.password, 12);

        // Mettre à jour l'utilisateur
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });

        console.log(`🔒 ${user.email} - Convertis en hash bcrypt`);
        converted++;
      } catch (err) {
        console.error(`❌ ${user.email} - Erreur lors du hachage:`, err);
        errors++;
      }
    }

    console.log(`\n✅ Migration complétée!`);
    console.log(`   - Convertis: ${converted}`);
    console.log(`   - Déjà hashés: ${skipped}`);
    console.log(`   - Erreurs: ${errors}`);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migratePasswords();
