# 🧹 Guide de Nettoyage de la Base de Données Unify

## Problème identifié
- L'utilisateur PostgreSQL `unify_user` n'a pas les permissions suffisantes pour réinitialiser la base complètement
- Les tables existent mais contiennent des données fictives
- Tu dois exécuter le nettoyage en tant que **super utilisateur PostgreSQL** (postgres)

## ✅ Solution : Exécuter le script SQL de nettoyage

### Option 1 : Avec pgAdmin (Interface Web)
1. Ouvre pgAdmin (http://localhost:5050)
2. Connecte-toi avec tes credentials
3. Navigue à : Databases → unify → Query Tool
4. Copie-colle le contenu de `prisma/cleanup.sql`
5. Exécute le script (F5 ou bouton Run)

### Option 2 : Via Command Line (Recommandé)
```powershell
# Se connecter en tant que super utilisateur PostgreSQL
psql -h localhost -U postgres -d unify -f "prisma\cleanup.sql"
```

Quand il te demande le mot de passe, utilise celui de l'utilisateur `postgres`.

### Option 3 : Depuis Windows Command Prompt
```cmd
cd C:\Users\Roots\unify
psql -h localhost -U postgres -d unify -f prisma\cleanup.sql
```

## 📝 Après le nettoyage

Une fois les données nettoyées, tu peux :

1. **Synchroniser le schéma Prisma** :
```powershell
npm run db:push
```

2. **Générer le client Prisma** :
```powershell
npx prisma generate
```

3. **Voir les tables dans Prisma Studio** :
```powershell
npx prisma studio
```

## 🔐 Notes de Sécurité
- Ne partage jamais tes credentials PostgreSQL
- Le script utilise des transactions `BEGIN...COMMIT` pour la sécurité
- Tous les triggers sont réactivés après le nettoyage

## 📊 Structure du Schéma
Le schéma Prisma contient les tables suivantes :
- **Users** : Utilisateurs et authentification
- **Posts** : Posts et commentaires
- **Messages** : Système de messagerie
- **Stories** : Stories (expirant après 24h)
- **Groups** : Groupes de discussion
- **Pages** : Pages publiques
- **Friendships** : Système d'amis
- **Notifications** : Notifications en temps réel
- Et bien d'autres...

## ❓ Besoin d'aide ?
Si tu rencontres des erreurs :
1. Vérifie que PostgreSQL est en cours d'exécution
2. Vérifie les permissions de l'utilisateur PostgreSQL
3. Assure-toi que la base de données `unify` existe
