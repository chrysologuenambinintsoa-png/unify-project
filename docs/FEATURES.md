# Fonctionnalités - Unify

Documentation complète de toutes les fonctionnalités incluses dans Unify.

## 🔐 Authentification & Sécurité

### Inscription et Connexion

**Description** : Système d'authentification sécurisé avec email/password et OAuth

**Fonctionnalités** :
- ✅ Inscription avec email et mot de passe
- ✅ Validation des emails en temps réel
- ✅ Connexion OAuth (Google, Facebook)
- ✅ Authentification multi-factor (optionnel)
- ✅ Session management avec NextAuth.js
- ✅ Remember me pour 30 jours

**Endpoints** :
```
POST   /api/auth/register           - Inscription
POST   /api/auth/login              - Connexion
POST   /api/auth/logout             - Déconnexion
POST   /api/auth/forgot-password    - Demander reset
POST   /api/auth/reset-password     - Réinitialiser password
POST   /api/auth/verify-email       - Vérifier email
```

**Flux de Sécurité** :
1. Password hashé avec bcrypt (10 rounds)
2. JWT tokens en HttpOnly Cookies
3. CSRF tokens pour POST requests
4. Rate limiting (5 tentatives par 15 min)

---

## 📝 Publications (Posts)

### Création de Posts

**Description** : Partager du contenu avec texte, images, vidéos et arrière-plans

**Fonctionnalités** :
- ✅ Posts avec texte simple
- ✅ Attachement d'images (via Cloudinary)
- ✅ Vidéos uploadées
- ✅ Arrière-plans personnalisés (dégradés, couleurs)
- ✅ Mentions d'utilisateurs (@username)
- ✅ Hashtags (#tag)
- ✅ Emojis directement dans le texte
- ✅ Édition et suppression de posts
- ✅ Suppression en cascade des commentaires/réactions

**Validation** :
- Longueur: min 1, max 5000 caractères
- Images: JPG, PNG, WebP (max 20MB)
- Vidéos: MP4, WebM (max 100MB)
- Limite: 50 posts par utilisateur par jour

**Endpoints** :
```
POST   /api/posts              - Créer un post
GET    /api/posts              - Lister les posts (paginated)
GET    /api/posts/:id          - Récupérer un post
PUT    /api/posts/:id          - Éditer un post
DELETE /api/posts/:id          - Supprimer un post
GET    /api/posts/:id/feed     - Feed avec pagination
```

---

### Réactions sur Posts

**Description** : Interagir avec les posts via likes et réactions emoji

**Fonctionnalités** :
- ✅ Likes (❤️)
- ✅ Emojis réactions (😂, 😮, 😢, 🔥, etc.)
- ✅ Compteur de réactions
- ✅ Voir qui a réagi
- ✅ Supprimer sa réaction

**Endpoints** :
```
POST   /api/posts/:id/like     - Aimer/contraimer un post
POST   /api/posts/:id/react    - Réagir avec emoji
DELETE /api/posts/:id/like     - Retirer le like
DELETE /api/posts/:id/react    - Retirer la réaction
GET    /api/posts/:id/likes    - Lister les likes
GET    /api/posts/:id/reactions- Lister les réactions
```

---

### Commentaires

**Description** : Système de commentaires imbriqués sur les posts

**Fonctionnalités** :
- ✅ Création de commentaires
- ✅ Réponses à d'autres commentaires (imbriqué)
- ✅ Édition et suppression de commentaires
- ✅ Réactions sur commentaires
- ✅ Mentions dans les commentaires
- ✅ Notifications quand quelqu'un répond
- ✅ Pagination des commentaires

**Endpoints** :
```
POST   /api/posts/:id/comments          - Créer un commentaire
GET    /api/posts/:id/comments          - Lister les commentaires
PUT    /api/comments/:id                - Éditer un commentaire
DELETE /api/comments/:id                - Supprimer un commentaire
POST   /api/comments/:id/reply          - Répondre à un commentaire
POST   /api/comments/:id/like           - Liker un commentaire
```

---

### Partage (Share)

**Description** : Partager des posts avec d'autres utilisateurs

**Fonctionnalités** :
- ✅ Partager un post sur son profil
- ✅ Partager via message privé
- ✅ Partager via lien (copier URL)
- ✅ Compteur de partages

**Endpoints** :
```
POST   /api/posts/:id/share    - Partager un post
GET    /api/posts/:id/shares   - Lister les partages
```

---

## 💬 Messagerie en Temps Réel

### Messages Directs

**Description** : Chat privé en temps réel entre deux utilisateurs

**Fonctionnalités** :
- ✅ Messages texte en temps réel (WebSocket)
- ✅ Images et fichiers attachés
- ✅ Notifications quand quelqu'un tape
- ✅ Marquer comme lu/non lu
- ✅ Réactions aux messages
- ✅ Suppression de messages
- ✅ Recherche dans les messages
- ✅ Historique sauvegardé
- ✅ Conversations épinglées

**WebSocket Events** :
```
message:send          - Envoyer un message
message:read          - Marquer comme lu
message:delete        - Supprimer un message
message:typing        - Quelqu'un tape
message:reaction      - Réagir au message
conversation:pin      - Épingler une conversation
```

**Endpoints** :
```
POST   /api/messages              - Envoyer un message
GET    /api/conversations/:id     - Récupérer une conversation
GET    /api/conversations         - Lister les conversations
DELETE /api/messages/:id          - Supprimer un message
POST   /api/messages/:id/read     - Marquer comme lu
POST   /api/messages/:id/react    - Réagir au message
```

---

### Conversations

**Description** : Gestion des conversations privées

**Fonctionnalités** :
- ✅ Créer une conversation
- ✅ Lister les conversations
- ✅ Dernier message affiché
- ✅ Compteur de messages non lus
- ✅ Supprimer une conversation
- ✅ Bloquer un utilisateur

**Endpoints** :
```
POST   /api/conversations              - Créer une conversation
GET    /api/conversations              - Lister les conversations
GET    /api/conversations/:id          - Récupérer une conversation
DELETE /api/conversations/:id          - Supprimer une conversation
POST   /api/conversations/:id/block    - Bloquer
POST   /api/conversations/:id/unblock  - Débloquer
```

---

## 📖 Stories (24h)

### Création de Stories

**Description** : Partager des moments éphémères (photos, vidéos, texte) qui disparaissent après 24h

**Fonctionnalités** :
- ✅ Stories avec photos
- ✅ Stories avec vidéos
- ✅ Stories avec texte + fond
- ✅ Stickers et autocollants
- ✅ Filtres et effets
- ✅ Exécution automatique après 24h
- ✅ Voir qui a regardé ma story
- ✅ Réactions sur stories
- ✅ Commentaires privés sur stories

**Endpoints** :
```
POST   /api/stories              - Créer une story
GET    /api/stories              - Lister les stories amis
GET    /api/stories/:id          - Récupérer une story
DELETE /api/stories/:id          - Supprimer une story
POST   /api/stories/:id/view     - Marquer comme vue
GET    /api/stories/:id/views    - Lister les vues
POST   /api/stories/:id/react    - Réagir à une story
```

---

### Visionneuse de Stories

**Description** : Afficher et interagir avec les stories

**Fonctionnalités** :
- ✅ Affichage plein écran
- ✅ Navigation avancée/suivante
- ✅ Progress bar pour chaque story
- ✅ Pause au survol
- ✅ Réactions en temps réel
- ✅ Voir les vues avant de supprimer
- ✅ Lecture automatique

---

## 👥 Amis & Suggestions

### Gestion des Amis

**Description** : Ajouter et gérer les amis

**Fonctionnalités** :
- ✅ Envoyer une demande d'ami
- ✅ Accepter/Refuser les demandes
- ✅ Annuler les demandes envoyées
- ✅ Retirer un ami
- ✅ Bloquer/Débloquer un utilisateur
- ✅ Voir la liste des amis
- ✅ Voir les amis communs
- ✅ Suggestions automatiques

**Endpoints** :
```
POST   /api/friends/request              - Envoyer une demande
POST   /api/friends/request/:id/accept   - Accepter une demande
POST   /api/friends/request/:id/reject   - Refuser une demande
POST   /api/friends/:id/remove           - Retirer un ami
POST   /api/friends/:id/block            - Bloquer
GET    /api/friends/:id                  - Lister les amis
GET    /api/friends/:id/suggestions      - Suggestions d'amis
GET    /api/friends/:id/mutual           - Amis communs
```

---

### Suggestions d'Amis

**Description** : Recommendations d'amis basées sur le réseau

**Algorithme** :
1. Amis des amis (non déjà ami)
2. Personnes ayant les mêmes intérêts
3. Amis des groupes
4. Amis des pages suivies
5. Personnes actives récemment

**Fonctionnalités** :
- ✅ Suggestions renouvelées quotidiennement
- ✅ Raison de la suggestion affichée
- ✅ Ajouter rapidement depuis la liste

---

## 👥 Groupes

### Création de Groupes

**Description** : Créer et gérer des communautés

**Fonctionnalités** :
- ✅ Création de groupes (publics/privés)
- ✅ Description et image du groupe
- ✅ Catégories (Loisirs, Travail, etc.)
- ✅ Règles du groupe
- ✅ Rôles (Admin, Modérateur, Membre)
- ✅ Suppression du groupe

**Endpoints** :
```
POST   /api/groups                  - Créer un groupe
GET    /api/groups                  - Lister les groupes
GET    /api/groups/:id              - Détails du groupe
PUT    /api/groups/:id              - Modifier un groupe
DELETE /api/groups/:id              - Supprimer un groupe
```

---

### Gestion des Membres

**Description** : Ajouter et gérer les membres du groupe

**Fonctionnalités** :
- ✅ Rejoindre un groupe public
- ✅ Inviter des amis
- ✅ Demander l'accès à un groupe privé
- ✅ Approuver/Refuser les demandes
- ✅ Expulser un membre
- ✅ Changer les rôles
- ✅ Voir la liste des membres

**Endpoints** :
```
POST   /api/groups/:id/join             - Rejoindre
POST   /api/groups/:id/request          - Demander l'accès
POST   /api/groups/:id/members/add      - Inviter des amis
POST   /api/groups/:id/members/:memberId/remove - Expulser
PUT    /api/groups/:id/members/:memberId/role   - Changer rôle
GET    /api/groups/:id/members          - Lister les membres
```

---

### Posts de Groupe

**Description** : Partager du contenu dans un groupe

**Fonctionnalités** :
- ✅ Créer des posts dans le groupe
- ✅ Modération des posts
- ✅ Épingler les posts importants
- ✅ Archiver les posts
- ✅ Commentaires dans les posts du groupe
- ✅ Notifications de groupe

**Endpoints** :
```
POST   /api/groups/:id/posts            - Créer un post groupe
GET    /api/groups/:id/posts            - Lister les posts
PUT    /api/groups/:id/posts/:postId    - Éditer post
DELETE /api/groups/:id/posts/:postId    - Supprimer post
POST   /api/groups/:id/posts/:postId/pin - Épingler post
```

---

## 📄 Pages

### Création de Pages

**Description** : Créer des pages publiques (marques, personnalités, etc.)

**Fonctionnalités** :
- ✅ Créer et gérer des pages
- ✅ Vérification de page (badge bleu)
- ✅ Description et catégories
- ✅ Page de couverture personnalisée
- ✅ Stats et analytiques
- ✅ Paramètres de confidentialité

**Endpoints** :
```
POST   /api/pages                  - Créer une page
GET    /api/pages                  - Lister mes pages
GET    /api/pages/:id              - Détails de la page
PUT    /api/pages/:id              - Modifier une page
DELETE /api/pages/:id              - Supprimer une page
```

---

### Gestion des Administrateurs

**Description** : Gérer les admins et rôles de page

**Fonctionnalités** :
- ✅ Ajouter/Retirer des admins
- ✅ Rôles (Admin, Éditeur, Modérateur)
- ✅ Permissions granulaires
- ✅ Audit log des actions

**Endpoints** :
```
POST   /api/pages/:id/admins/add        - Ajouter admin
POST   /api/pages/:id/admins/remove     - Retirer admin
PUT    /api/pages/:id/admins/:id/role   - Changer rôle
GET    /api/pages/:id/admins            - Lister les admins
```

---

### Posts de Page

**Description** : Publier du contenu sur une page

**Fonctionnalités** :
- ✅ Créer des posts de page
- ✅ Programmer les posts
- ✅ Statistiques des posts
- ✅ Brouillons sauvegardés automatiquement

**Endpoints** :
```
POST   /api/pages/:id/posts            - Créer post
GET    /api/pages/:id/posts            - Lister posts
POST   /api/pages/:id/posts/:id/edit   - Éditer post
```

---

## 🔔 Notifications

### Système de Notifications

**Description** : Notifications en temps réel pour événements importants

**Types de Notifications** :
- ✅ Quelqu'un vous a likée un post
- ✅ Quelqu'un a commenté votre post
- ✅ Demande d'ami reçue
- ✅ Ami accepté votre demande
- ✅ Message privé reçu
- ✅ Story d'un ami
- ✅ Nouveau groupe rejoignable
- ✅ Mention dans un post/commentaire

**Fonctionnalités** :
- ✅ Notifications en temps réel (WebSocket)
- ✅ Badges compteur
- ✅ Marquer comme lu
- ✅ Grouper par type
- ✅ Préférences de notification
- ✅ Notifications email optionnelles

**Endpoints** :
```
GET    /api/notifications           - Lister notifications
POST   /api/notifications/:id/read  - Marquer comme lu
DELETE /api/notifications/:id       - Supprimer notification
PUT    /api/notifications/settings  - Paramètres notifications
```

---

## 🎯 Badges & Réalisations

### Système de Badges

**Description** : Badges d'accomplissement pour les utilisateurs

**Types de Badges** :
- ✅ Nouveau Membre (inscription)
- ✅ Créateur de Contenu (100+ posts)
- ✅ Actif (30 jours consécutifs)
- ✅ Populaire (1000+ amis)
- ✅ Influenceur (10k+ likes)
- ✅ Communautaire (créé groupe)
- ✅ Vérification (admin)

**Fonctionnalités** :
- ✅ Badges auto-attribués
- ✅ Afficher les badges sur profil
- ✅ Historique des badges
- ✅ Notifications quand badge reçu

---

## ⚙️ Paramètres Utilisateur

### Profil

**Description** : Gérer les informations du profil

**Fonctionnalités** :
- ✅ Nom complet
- ✅ Bio/Description
- ✅ Photo de profil
- ✅ Image de couverture
- ✅ Genre (optionnel)
- ✅ Date de naissance (optionnel)
- ✅ Localisation
- ✅ Site web
- ✅ Liens pour réseaux sociaux

**Endpoints** :
```
GET    /api/users/:id/profile          - Récupérer le profil
PUT    /api/users/:id/profile          - Modifier le profil
POST   /api/users/:id/avatar           - Changer la photo
POST   /api/users/:id/cover            - Changer la couverture
```

---

### Confidentialité

**Description** : Contrôler la visibilité du contenu

**Fonctionnalités** :
- ✅ Profil public/privé
- ✅ Qui peut voir les amis
- ✅ Qui peut commenter
- ✅ Qui peut voir les stories
- ✅ Bloquer les utilisateurs
- ✅ Rapporter un utilisateur

**Endpoints** :
```
PUT    /api/users/:id/privacy          - Paramètres privacy
POST   /api/users/:id/block/:userId    - Bloquer utilisateur
GET    /api/users/:id/blocked          - Lister les bloqués
```

---

### Paramètres de Compte

**Description** : Gérer le compte

**Fonctionnalités** :
- ✅ Changer l'email
- ✅ Changer le mot de passe
- ✅ Authentification 2FA
- ✅ Histórique de connexion
- ✅ Appareils connectés
- ✅ Supprimer le compte (GDPR)
- ✅ Exporter les données (GDPR)

**Endpoints** :
```
PUT    /api/users/:id/email            - Changer email
PUT    /api/users/:id/password         - Changer password
POST   /api/users/:id/2fa/enable       - Activer 2FA
GET    /api/users/:id/login-history    - Historique connexions
DELETE /api/users/:id/account          - Supprimer compte
GET    /api/users/:id/export           - Exporter données
```

---

### Préférences

**Description** : Personnaliser l'interface

**Fonctionnalités** :
- ✅ Thème (clair/sombre)
- ✅ Langue (FR, MG, EN, ES, DE, ZH)
- ✅ Taille de police
- ✅ Notifications push
- ✅ Sons
- ✅ Format 12h/24h

**Endpoints** :
```
PUT    /api/users/:id/preferences      - Mettre à jour préférences
```

---

## 🔍 Recherche

### Recherche Globale

**Description** : Rechercher des utilisateurs, posts, groupes

**Fonctionnalités** :
- ✅ Recherche d'utilisateurs
- ✅ Recherche de posts
- ✅ Recherche de groupes
- ✅ Recherche de hashtags
- ✅ Suggestions en temps réel
- ✅ Historique de recherche

**Endpoints** :
```
GET    /api/search?q=query            - Recherche globale
GET    /api/search/users?q=...        - Recherche utilisateurs
GET    /api/search/posts?q=...        - Recherche posts
GET    /api/search/groups?q=...       - Recherche groupes
```

---

## 🌍 Explore

### Feed d'Exploration

**Description** : Découvrir du contenu populaire et tendances

**Fonctionnalités** :
- ✅ Posts populaires
- ✅ Utilisateurs suggérés
- ✅ Groupes tendance
- ✅ Hashtags populaires
- ✅ Pages suggérées
- ✅ Notifications

**Endpoints** :
```
GET    /api/explore/posts           - Posts populaires
GET    /api/explore/users           - Utilisateurs suggérés
GET    /api/explore/groups          - Groupes tendance
GET    /api/explore/trends          - Hashtags populaires
```

---

## 🎨 Thème & Internationalisation

### Système de Thème

**Description** : Support light/dark mode

**Fonctionnalités** :
- ✅ Thème clair (défaut)
- ✅ Thème sombre
- ✅ Thème système (suit le OS)
- ✅ Couleurs personnalisables
- ✅ Sauvegarde des préférences

---

### Langues Supportées

**Langues** :
- 🇫🇷 Français
- 🇲🇬 Malagasy
- 🇬🇧 English
- 🇪🇸 Español
- 🇩🇪 Deutsch
- 🇨🇳 中文 (Chinois Simplifié)

**Fonctionnalités** :
- ✅ Traductions complètes
- ✅ RTL support (optionnel pour arabe)
- ✅ Dates localisées
- ✅ Devises locales

---

## 📱 Responsivité & Mobile

### Support Mobile

**Fonctionnalités** :
- ✅ Design entièrement responsive
- ✅ Navigation mobile adapté (bottom nav)
- ✅ Optimisé pour tactile
- ✅ Performance mobile
- ✅ PWA support (offline mode optionnel)

---

## 🔐 Sécurité Avancée

### Protection DMCA & Propriété Intellectuelle

**Fonctionnalités** :
- ✅ Watermark sur images
- ✅ Protecteur de copie-coller
- ✅ Signalement de contenu
- ✅ Suppression sur demande

---

## 🎬 Vidéo Live (Futur)

**Planned** :
- ✅ Streaming live avec Mediasoup
- ✅ Chat pendant le livestream
- ✅ Emojis réactions live
- ✅ Voir les viewers en temps réel
- ✅ Enregistrement des lives

---

## 📊 Analytiques (Admin)

**Fonctionnalités** :
- ✅ Nombre d'utilisateurs actifs
- ✅ Usage par feature
- ✅ Engagement metrics
- ✅ Tableau de bord admin
- ✅ Rapports exportables

---

## 🗺️ Feuille de Route

Les fonctionnalités suivantes seront ajoutées :

- [ ] Vidéo Live avec streaming
- [ ] Paiements/Monetization
- [ ] Système de subscription
- [ ] Contenu premium
- [ ] API publique pour développeurs
- [ ] Webhooks
- [ ] Plugins/Extensions
- [ ] Intégration RSS
- [ ] Intégration Spotify
- [ ] Calendrier d'événements
