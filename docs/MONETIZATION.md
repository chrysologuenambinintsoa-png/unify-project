# Système de Monétisation par Sponsorisation - Unify

Documentation complète du système de monétisation par posts sponsorisés de Unify.

## 📊 Overview

Unify inclut un **système complet de monétisation** permettant aux entreprises de faire de la publicité sur la plateforme. C'est un modèle B2B rentable qui permet de générer du revenu.

### Modèle Commercial

```
Entreprises/Annonceurs
         ↓
    Budget défini
         ↓
Posts Sponsorisés (affichés aux utilisateurs)
         ↓
Impressions & Clics trackés
         ↓
Paiement basé sur budget et performance
```

---

## 🎯 Fonctionnalités Principal

### 1. Création de Posts Sponsorisés

**Endpoint** : `POST /api/sponsored`

Les annonceurs peuvent créer des posts sponsorisés avec :

```json
{
  "title": "Découvrez notre produit XYZ",
  "description": "La meilleure solution pour...",
  "content": "Description complète du produit",
  "image": "https://cloudinary.com/image.jpg",
  "link": "https://votre-site.com",
  "advertiser": "Nom de l'entreprise",
  "budget": 500.00,
  "startDate": "2026-02-21T00:00:00Z",
  "endDate": "2026-03-21T23:59:59Z",
  "status": "active"
}
```

**Champs Requis** :
- `title` : Titre du post (attire l'attention)
- `description` : Courte description (50-100 chars)
- `content` : Contenu détaillé du post
- `advertiser` : Nom de l'entreprise
- `budget` : Budget total en USD (ou autre devise)
- `startDate` : Date de début de la campagne
- `endDate` : Date de fin de la campagne

**Champs Optionnels** :
- `image` : Image du post
- `link` : Lien vers le site (ouvert au clic)
- `status` : Statut de la campagne (active, paused, archived)

---

### 2. Affichage des Posts Sponsorisés

**Endpoint** : `GET /api/sponsored?limit=5&offset=0`

Les posts sponsorisés sont affichés dans le feed users :

**Réponse** :
```json
[
  {
    "id": "sponsored_123",
    "title": "Produit XYZ",
    "description": "La meilleure solution",
    "content": "...",
    "image": "https://...",
    "link": "https://...",
    "advertiser": "Entreprise Inc",
    "budget": 500,
    "spent": 150,
    "impressions": 5000,
    "clicks": 125,
    "conversions": 15,
    "status": "active",
    "startDate": "2026-02-21T00:00:00Z",
    "endDate": "2026-03-21T23:59:59Z"
  }
]
```

**Filtres Disponibles** :
- `limit` : Nombre de posts (max 20)
- `offset` : Pagination
- `all=true` : Admin seulement - voir toutes les campagnes

---

### 3. Tracking des Performances

**Endpoint** : `POST /api/sponsored/{id}/track`

Chaque interaction est tracée automatiquement :

```json
{
  "type": "impression"  // ou "click"
}
```

**Données Trackées** :
- **Impressions** : Chaque fois qu'un post apparaît à l'écran
- **Clicks** : Chaque clic sur le post
- **Conversions** : Événements de conversion (futur)

**Réponse** :
```json
{
  "success": true,
  "tracking": {
    "impressions": 5000,
    "clicks": 125
  }
}
```

---

### 4. Mise à Jour des Campagnes

**Endpoint** : `PUT /api/sponsored`

Les annonceurs peuvent modifier leurs campagnes :

```json
{
  "id": "sponsored_123",
  "status": "paused",
  "budget": 750,
  "endDate": "2026-04-21T23:59:59Z"
}
```

**Champs Modifiables** :
- `title`, `description`, `content`
- `image`, `link`
- `budget`, `spent`
- `status` (active, paused, archived)
- `startDate`, `endDate`

---

### 5. Suppression des Campagnes

**Endpoint** : `DELETE /api/sponsored?id=sponsored_123`

```bash
curl -X DELETE "http://localhost:3000/api/sponsored?id=sponsored_123" \
  -H "Authorization: Bearer token"
```

**Réponse** :
```json
{
  "message": "Sponsored post deleted"
}
```

---

## 💰 Modèles de Paiement

### Option 1 : Paiement par Impression (CPM)

```
Coût par 1000 impressions
= Budget / (impressions / 1000)

Exemple :
- Budget : $500
- CPM : $5
- Impressions possibles : 100,000
```

### Option 2 : Paiement par Clic (CPC)

```
Coût par clic
= Budget / clics

Exemple :
- Budget : $500
- CPC cible : $1
- Clics possibles : 500
```

### Option 3 : Budget Fixe

```
Afficher la campagne jusqu'à épuisement du budget
- Budget total : $500
- Coût par jour : $50 (si 10 jours)
- Arrêt automatique quand spent >= budget
```

---

## 🏢 Intégration pour les Entreprises

### Flux d'Intégration

```
1. Entreprise crée un compte
2. Valide les informations
3. Ajoute un moyen de paiement (Stripe, PayPal, etc.)
4. Crée une première campagne
5. Budget débité selon le modèle choisi
6. Tracking automatique des performances
7. Rapports et analytiques
```

### Dashboard Annonceur (À Créer)

Fonctionnalités requises :
- 📊 Voir les campagnes actives
- 📈 Statistiques en temps réel (impressions, clics)
- 🎯 ROI (Return on Investment)
- 💳 Historique des paiements
- ⚙️ Modifier les campagnes
- 🗑️ Archiver les campagnes terminées

---

## 🔧 Configuration Actuelle

### Base de Données (Prisma)

```prisma
model SponsoredPost {
  id          String   @id @default(cuid())
  title       String
  description String
  content     String
  image       String?
  link        String?
  advertiser  String          // Nom de l'entreprise
  budget      Float           // Budget en USD
  spent       Float           // Montant dépensé
  impressions Int             // Nombre d'impressions
  clicks      Int             // Nombre de clics
  conversions Int             // Nombre de conversions
  status      String          // active, paused, archived
  startDate   DateTime        // Début de campagne
  endDate     DateTime        // Fin de campagne
  createdAt   DateTime
  updatedAt   DateTime

  @@index([status])
  @@index([startDate])
  @@index([endDate])
}
```

### Composant Affichage

**Fichier** : `components/SponsoredPostCard.tsx`

Affiche les posts sponsorisés avec :
- Badge "📢 Sponsorisé"
- Nom de l'annonceur
- Image et description
- CTA (Call To Action)
- Tracking automatique des impressions
- Tracking des clics avec redirection

---

## 🚀 Prêt pour la Production?

### ✅ Ce Qui Fonctionne

- ✅ Modèle Prisma complet et optimisé
- ✅ API CRUD complète (GET, POST, PUT, DELETE)
- ✅ Tracking des impressions et clics
- ✅ Composant d'affichage avec animations
- ✅ Filtrage par statut et dates
- ✅ Pagination des résultats
- ✅ Gestion d'erreurs robuste

### ⚠️ À Ajouter Avant Production

#### 1. **Authentification des Annonceurs**
```typescript
// Créer un modèle Advertiser
model AdvertiserAccount {
  id             String @id @default(cuid())
  userId         String @unique
  user           User   @relation(fields: [userId], references: [id])
  businessName   String
  website        String?
  taxId          String?
  contactEmail   String
  paymentMethod  String? // "stripe", "paypal", etc
  verified       Boolean @default(false)
  sponsoredPosts SponsoredPost[]
}
```

#### 2. **Système de Paiement**
```typescript
// Intégrer Stripe ou PayPal
npm install @stripe/stripe-js

model Payment {
  id              String   @id @default(cuid())
  advertiserId    String
  advertiser      AdvertiserAccount @relation(fields: [advertiserId], references: [id])
  amount          Float
  currency        String   @default("USD")
  status          String   // pending, completed, failed
  transactionId   String?  // Stripe/PayPal ID
  createdAt       DateTime @default(now())
}
```

#### 3. **Limitations du Budget**
```typescript
// Dans la route POST /api/sponsored
const advertiser = await prisma.advertiserAccount.findUnique({
  where: { id: advertiserId },
  include: { sponsoredPosts: true }
});

// Calculer le budget utilisé
const usedBudget = advertiser.sponsoredPosts
  .reduce((sum, post) => sum + post.spent, 0);

const remainingBudget = advertiser.creditBalance - usedBudget;

if (budget > remainingBudget) {
  return NextResponse.json(
    { error: 'Insufficient budget' },
    { status: 402 }
  );
}
```

#### 4. **Validation des Campagnes**
```typescript
// Vérifier les dates
if (startDate >= endDate) {
  return NextResponse.json(
    { error: 'Invalid date range' },
    { status: 400 }
  );
}

// Vérifier le budget minimum
const MIN_BUDGET = 50;
if (budget < MIN_BUDGET) {
  return NextResponse.json(
    { error: `Minimum budget is $${MIN_BUDGET}` },
    { status: 400 }
  );
}

// Limiter le budget maximum par campagne
const MAX_BUDGET = 10000;
if (budget > MAX_BUDGET) {
  return NextResponse.json(
    { error: `Maximum budget is $${MAX_BUDGET}` },
    { status: 400 }
  );
}
```

#### 5. **Dashboard Annonceur**
```typescript
// Créer une page protégée
app/advertiser/dashboard/page.tsx
app/advertiser/campaigns/page.tsx
app/advertiser/analytics/page.tsx
```

#### 6. **Rapports et Analytiques**
```typescript
// Endpoint pour les statistiques
GET /api/advertiser/stats
GET /api/advertiser/campaigns/{id}/analytics
GET /api/advertiser/earnings
```

#### 7. **Notifications et Alertes**
```typescript
// Alerter quand le budget est presque épuisé
if (spent > budget * 0.9) {
  // Envoyer email: "Votre budget est presque épuisé"
}

// Alerter quand la campagne se termine
if (new Date() >= endDate) {
  // Automatiquement passer le statut à "archived"
}
```

#### 8. **Conformité Légale**
```
- ✅ Conditions d'utilisation pour les annonceurs
- ✅ Politique de contenu (pas de contenu prohibé)
- ✅ Vérification KYC (Know Your Customer)
- ✅ RGPD / CCPA compliance
- ✅ Contrats d'annonce
```

---

## 📈 Métriques de Succès

### Pour les Annonceurs

```
ROI = (Valeur des conversions - Spend) / Spend × 100

Exemple :
- Spend : $500
- Conversions : 50 clients
- Valeur par client : $50
- Total : 50 × $50 = $2500
- ROI : ($2500 - $500) / $500 × 100 = 400%
```

### Pour la Plateforme

```
Revenue = Impressions (CPM) ou Clics (CPC)
Average Revenue Per Advertiser = Total Revenue / Number of Advertisers
Churn Rate = Cancelled Campaigns / Total Campaigns
```

---

## 💬 Questions Fréquentes

**Q: Quelle est la limite de budget?**
A: Configurable, propose min $50, max $10,000 par campagne

**Q: Les posts sponsorisés apparaissent-ils dans le feed normal?**
A: Oui, ils sont intégrés dans le feed avec un badge "Sponsorisé"

**Q: Comment éviter les abus?**
A: Validation du contenu, vérification des entreprises, système de rapports

**Q: Peut-on mesurer le ROI?**
A: Avec le tracking des clics + un code de conversion personnalisé

**Q: Quel est le taux de commission?**
A: À définir (ex: 30% pour la plateforme, 70% pour les créateurs)

---

## 🔒 Sécurité

### Points à Vérifier

- ✅ Authentification obligatoire pour les annonceurs
- ✅ Validation des URLs (pas de malware/phishing)
- ✅ Modération du contenu
- ✅ Rate limiting sur les créations de campagnes
- ✅ Chiffrement des données de paiement
- ✅ Audit logs des transactions

---

## 🎯 Prochaines Étapes

1. **Créer le modèle AdvertiserAccount**
2. **Intégrer Stripe pour les paiements**
3. **Valider les champs d'input (XSS, injection)**
4. **Créer le dashboard annonceur**
5. **Ajouter les rapports analytiques**
6. **Mettre en place la modération de contenu**
7. **Configurer les webhooks Stripe**
8. **Mettre en ligne en version bêta**

---

## 📚 Ressources

- [Stripe Payments Documentation](https://stripe.com/docs)
- [PayPal Integration](https://developer.paypal.com/)
- [Google Ads API](https://developers.google.com/google-ads/api)
- [Facebook Ads Manager](https://www.facebook.com/ads/manager/)

---

## ✍️ Notes

- **Statut** : Fonctionnel et prêt pour MVP
- **Dernière mise à jour** : Février 2026
- **Prochaine phase** : Intégration des paiements réels
