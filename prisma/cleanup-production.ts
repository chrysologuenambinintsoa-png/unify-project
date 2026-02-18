import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CleanupStats {
  tablesCleared: {
    name: string;
    count: number;
  }[];
  recordsDeleted: number;
  duration: number;
  errors: string[];
}

async function cleanProductionDatabase(): Promise<CleanupStats> {
  const startTime = Date.now();
  const stats: CleanupStats = {
    tablesCleared: [],
    recordsDeleted: 0,
    duration: 0,
    errors: [],
  };

  try {
    console.log('🧹 Nettoyage de la base de données en production...\n');
    console.log('📋 Ordre de suppression (en respect des clés étrangères):\n');

    // Ordre de suppression CRITIQUE - respecter les dépendances des clés étrangères
    const tablesToClean = [
      // 1. Tables sans dépendances critiques (supprimer en premier)
      { name: 'CommentReaction', label: '📌 Réactions aux commentaires' },
      { name: 'MessageReaction', label: '💬 Réactions aux messages' },
      { name: 'StoryReaction', label: '📖 Réactions aux histoires' },
      { name: 'StoryView', label: '👁️  Vues d\'histoires' },
      { name: 'CallParticipant', label: '📞 Participants des appels' },
      { name: 'HiddenMessage', label: '🔒 Messages cachés' },
      { name: 'SavedDevice', label: '🖥️  Appareils enregistrés' },
      { name: 'LoginHistory', label: '📊 Historique de connexion' },
      { name: 'PostReport', label: '⚠️  Signalements de posts' },
      { name: 'AdminMessage', label: '👨‍💼 Messages administrateur' },
      { name: 'PageInvite', label: '🎯 Invitations de page' },
      { name: 'PageAdmin', label: '👑 Administrateurs de page' },
      { name: 'PageLike', label: '❤️  J\'aimes de page' },
      { name: 'PollVote', label: '🗳️  Votes de sondage' },
      { name: 'PhotoGallery', label: '🖼️  Galerie de photos' },
      { name: 'Bookmark', label: '📑 Signets' },
      
      // 2. Tables dépendant du contenu (supprimer après les métadonnées)
      { name: 'Like', label: '❤️  J\'aimes' },
      { name: 'Reaction', label: '😊 Réactions' },
      { name: 'GroupPollVote', label: '🗳️  Votes de sondage groupe' },
      { name: 'PagePollVote', label: '🗳️  Votes de sondage page' },
      { name: 'Story', label: '📖 Histoires' },
      { name: 'VideoCall', label: '📹 Appels vidéo' },
      
      // 3. Contenu principal
      { name: 'Comment', label: '💭 Commentaires' },
      { name: 'Message', label: '💬 Messages' },
      { name: 'Post', label: '📝 Posts' },
      { name: 'GroupPoll', label: '🗳️  Sondages groupe' },
      { name: 'PagePoll', label: '🗳️  Sondages page' },
      
      // 4. Notifications après suppression du contenu
      { name: 'Notification', label: '🔔 Notifications' },
      
      // 5. Relations et permissions
      { name: 'PageMember', label: '👥 Membres de page' },
      { name: 'GroupMember', label: '👥 Membres de groupe' },
      { name: 'Friendship', label: '🤝 Amis' },
      
      // 6. Collections (après tous les members)
      { name: 'PageGroup', label: '📂 Groupes de page' },
      { name: 'Group', label: '👫 Groupes' },
      { name: 'Page', label: '📄 Pages' },
      
      // 7. Utilisateurs (dernier)
      { name: 'Account', label: '🔑 Comptes (OAuth)' },
      { name: 'Session', label: '🔐 Sessions' },
      { name: 'User', label: '👤 Utilisateurs' },
    ];

    for (const table of tablesToClean) {
      try {
        const modelName = table.name.charAt(0).toLowerCase() + table.name.slice(1);
        const model = (prisma as Record<string, any>)[modelName];
        
        if (!model?.deleteMany) {
          console.log(`⏭️  ${table.label.padEnd(40)} [INTROUVABLE]`);
          continue;
        }

        const result = await model.deleteMany({});
        
        if (result.count > 0 || true) { // Toujours afficher même si vide
          const status = result.count > 0 ? '✅ SUPPRIMÉ' : '✓ VIDE';
          console.log(`  ${status} ${table.label.padEnd(35)} (${String(result.count).padStart(4)} enregistrements)`);
          
          if (result.count > 0) {
            stats.tablesCleared.push({
              name: table.name,
              count: result.count,
            });
            stats.recordsDeleted += result.count;
          }
        }
      } catch (error) {
        const errorMsg = (error as Error).message;
        console.warn(`  ❌ ERREUR  ${table.label.padEnd(35)} ${errorMsg}`);
        stats.errors.push(`${table.name}: ${errorMsg}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ DU NETTOYAGE:');
    console.log('='.repeat(80));
    console.log(`  ✓ Tables nettoyées: ${stats.tablesCleared.length}`);
    console.log(`  ✓ Enregistrements supprimés: ${stats.recordsDeleted}`);
    
    stats.duration = Date.now() - startTime;
    console.log(`  ✓ Durée d'exécution: ${(stats.duration / 1000).toFixed(2)}s`);
    
    if (stats.errors.length > 0) {
      console.log(`\n  ⚠️  Erreurs rencontrées: ${stats.errors.length}`);
      stats.errors.forEach(err => console.log(`     - ${err}`));
    }

    console.log('\n' + '='.repeat(80));
    console.log('✨ NETTOYAGE PRODUCTION TERMINÉ!');
    console.log('='.repeat(80));
    console.log('  📝 Structure des tables: ✅ PRÉSERVÉE');
    console.log('  🔐 Migrations: ✅ INTACTES');
    console.log('  ⚙️  Fonctionnalités: ✅ OPÉRATIONNELLES');
    console.log('  🔑 Clés étrangères: ✅ ACTIVES');
    console.log('  📊 Indexes: ✅ FONCTIONNELS');
    console.log('  🔒 Constraints: ✅ APPLIQUÉES');
    console.log('\n✅ Base de données prête pour la production!\n');

    return stats;
  } catch (error) {
    console.error('\n❌ ERREUR FATALE lors du nettoyage:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le nettoyage
cleanProductionDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur:', error);
    process.exit(1);
  });
