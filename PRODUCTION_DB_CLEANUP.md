# 🧹 Guide Nettoyage Base de Données Production

## 📋 Objectifs

- ✅ Supprimer toutes les données de développement
- ✅ Préserver la structure complète des tables
- ✅ Maintenir toutes les fonctionnalités
- ✅ Conserver les migrations et indexes
- ✅ Assurer l'intégrité referentielle

## ⚠️ IMPORTANT - Avant de Commencer

**CRÉER UNE SAUVEGARDE** de votre base de données actuelle:

```bash
# Via PostgreSQL (si accès en ligne de commande)
pg_dump your_database > backup_before_cleanup.sql

# Via votre provider (AWS RDS, Heroku, etc.)
# Vérifier la documentation spécifique
```

## 🚀 Options de Nettoyage

### Option 1: Nettoyage Complet (Recommandé)

```bash
# Exécute le script TypeScript de nettoyage avec Prisma
npm run db:clean:production
```

**Avantages:**
- Respecte les relations Prisma
- Génère des rapports détaillés
- Gestion d'erreurs robuste
- Compatibilité avec le schéma Prisma

### Option 2: Vérification Avant Nettoyage

```bash
# Vérifie l'état actuel sans supprimer
npm run db:verify
```

**Utile pour:**
- Comprendre le volume de données
- Vérifier l'état du schéma
- Planifier le nettoyage

### Option 3: Nettoyage SQL Direct (Fallback)

Si vous préférez un contrôle total via SQL:

```bash
# Exécuter clean_data.sql directement
psql -U username -d database -f prisma/clean_data.sql
```

## 📊 Procédure Complète

### Étape 1: Préparation

```bash
# 1. Arrêter les services connectés à la base
npm run stop  # ou votre commande d'arrêt

# 2. Vérifier l'état de la base
npm run db:verify
```

### Étape 2: Exécution du Nettoyage

```bash
# 3. Exécuter le nettoyage production
npm run db:clean:production
```

### Étape 3: Vérification Post-Nettoyage

```bash
# 4. Vérifier la complétude du nettoyage
npm run db:verify
```

### Étape 4: Redémarrage

```bash
# 5. Redémarrer les services
npm run build
npm run start
```

## 📝 Ce Qui Sera Supprimé

| Table | Action | Remarque |
|-------|--------|----------|
| `User` | ✅ Vider complètement | Aucun utilisateur conservé |
| `Post` | ✅ Vider complètement | Tous les posts supprimés |
| `Comment` | ✅ Vider complètement | Tous les commentaires supprimés |
| `Message` | ✅ Vider complètement | Tous les messages supprimés |
| `Friendship` | ✅ Vider complètement | Toutes les amitiés supprimées |
| `Group` | ✅ Vider complètement | Tous les groupes supprimés |
| `Notification` | ✅ Vider complètement | Toutes les notifications supprimées |
| `Reaction` | ✅ Vider complètement | Toutes les réactions supprimées |

## 🔒 Ce Qui Sera PRÉSERVÉ

| Élément | Statut |
|---------|--------|
| **Structure des tables** | ✅ Préservée |
| **Colonnes** | ✅ Préservées |
| **Relations** | ✅ Préservées |
| **Indexes** | ✅ Préservés |
| **Contraintes** | ✅ Préservées |
| **Migrations** | ✅ Préservées |
| **Paramètres de la base** | ✅ Préservés |
| **Fonctions personnalisées** | ✅ Préservées |

## 🆘 Troubleshooting

### Erreur: Permission Denied

```bash
# Vérifier les permissions de votre user PostgreSQL
# Assurer que l'user a les droits DELETE sur les tables

psql -U postgres -c "ALTER USER your_user SUPERUSER;"
```

### Erreur: Foreign Key Constraint

```bash
# Les scripts gèrent automatiquement l'ordre de suppression
# S'il persiste une erreur, vérifier les migrations récentes

npm run db:push  # Synchroniser le schéma
```

### Erreur: Connection Timeout

```bash
# Augmenter le timeout du Prisma
export DATABASE_TIMEOUT=60000
npm run db:clean:production
```

### Rollback en cas de Problème

```bash
# Restaurer depuis la sauvegarde
psql -U username -d database < backup_before_cleanup.sql
```

## ✅ Vérification Post-Nettoyage

Après le nettoyage, vérifier que:

- [ ] Pas d'erreurs lors du nettoyage
- [ ] Toutes les tables sont vides (`npm run db:verify`)
- [ ] L'application démarre sans erreur
- [ ] Les endpoints API répondent correctement
- [ ] Les migrations sont à jour (`npm run db:push`)

Tester quelques scénarios:

```bash
# 1. Créer un nouvel utilisateur
# 2. Créer un premier post
# 3. Inviter des amis
# 4. Créer un groupe
# 5. Envoyer un message
```

## 📋 Checklist Avant Production

- [ ] Sauvegarde créée et testée
- [ ] Nettoyage exécuté sans erreurs  
- [ ] Base vérifiée et vide
- [ ] Application redémarrée
- [ ] Endpoints testés
- [ ] Logs vérifiés pour erreurs
- [ ] Performance correcte
- [ ] Documentation mise à jour

## 🔗 Scripts Disponibles

```bash
# Nettoyage production complet
npm run db:clean:production

# Vérification sans modification
npm run db:verify

# Nettoyage développement (brut)
npm run db:clean

# Push des migrations
npm run db:push
```

## 📞 Support

En cas de problème:

1. Consulter les logs: `npm run db:verify`
2. Vérifier la connexion: `npm run db:push --skip-generate`
3. Restaurer la sauvegarde si nécessaire
4. Contacter le support avec les logs détaillés

---

**Status:** ✅ Prêt pour la production après exécution
