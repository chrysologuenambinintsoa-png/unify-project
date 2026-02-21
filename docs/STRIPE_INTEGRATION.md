# Intégration Stripe - Guide Complet

## Vue d'ensemble

Ce guide documente l'intégration complète du système de paiement Stripe pour les campagnes publicitaires sponsorisées dans Unify.

## Architecture du Système de Paiement

```
┌─────────────────────────────────────────────────────────────┐
│                   Flux de Paiement Stripe                    │
└─────────────────────────────────────────────────────────────┘

1. CRÉATION DE CAMPAGNE
   User → /advertiser/create-campaign
   ↓
   Form Details (nom, description, contenu, budget)
   ↓
   POST /api/sponsored (créer campagne avec status: pending_payment)

2. PAIEMENT
   Formulaire Stripe loaded
   ↓
   POST /api/payments/create-payment-intent
   ├─ Valider montant ($10-$100,000)
   ├─ Créer/récupérer Stripe Customer
   ├─ Créer PaymentIntent
   ├─ Sauvegarder Payment dans BD
   └─ Retourner clientSecret

3. CONFIRMATION CLIENT
   CardElement (Stripe.js)
   ↓
   stripe.confirmCardPayment(clientSecret)
   ↓
   Redirection vers /advertiser/payment-confirmation

4. WEBHOOK STRIPE
   Événement payment_intent.succeeded
   ↓
   POST /api/payments/webhook
   ├─ Vérifier signature
   ├─ Mettre à jour Payment status
   └─ Activer SponsoredPost (status: active)

5. CONFIRMATION CLIENT
   GET /api/payments/verify
   ├─ Récupérer statut PaymentIntent
   ├─ Afficher confirmation
   └─ Rediriger dashboard
```

## Configuration Requise

### 1. Variables d'Environnement (.env.local)

```env
# Clés Stripe (obtenir de https://dashboard.stripe.com/apikeys)
STRIPE_PUBLIC_KEY=pk_test_... ou pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... ou pk_live_...
STRIPE_SECRET_KEY=sk_test_... ou sk_live_...

# Webhook Secret (obtenir de https://dashboard.stripe.com/webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs de redirection
NEXT_PUBLIC_APP_URL=http://localhost:3000 # ou production URL
```

### 2. Installation Dépendances

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

✅ Déjà installé dans ce projet

## Fichiers Créés

### 1. `/lib/stripe.ts`
Configuration Stripe et utilitaires.

**Exports principaux:**
- `stripe` - Instance Stripe serveur
- `STRIPE_PUBLISHABLE_KEY` - Clé publique
- `PaymentIntentData` type - Données pour créer PaymentIntent
- `formatAmountForStripe()` - Convertir montant en cents
- `formatAmountForDisplay()` - Afficher montant formaté
- `validateStripeKeys()` - Valider configuration

### 2. `/app/api/payments/create-payment-intent/route.ts`
Endpoint POST pour créer un PaymentIntent Stripe.

**Requête:**
```json
{
  "amount": 100,            // USD
  "description": "Campagne marketing",
  "campaignName": "Vente d'été",
  "sponsoredPostId": "campaign123"
}
```

**Réponse:** 
```json
{
  "clientSecret": "pi_xxx#secret_xxx",
  "paymentIntentId": "pi_xxx",
  "paymentId": "pay_xxx"
}
```

**Logique:**
1. Authentifier l'utilisateur (NextAuth)
2. Valider montant: $10 min, $100,000 max
3. Créer/récupérer Stripe Customer par email
4. Créer PaymentIntent avec metadata
5. Sauvegarder Payment dans BD (Prisma)
6. Retourner clientSecret pour client

### 3. `/app/api/payments/webhook/route.ts`
Webhook pour traiter les événements Stripe.

**Événements gérés:**
- `payment_intent.succeeded` - Paiement réussi
- `payment_intent.payment_failed` - Paiement échoué
- `payment_intent.canceled` - Paiement annulé
- `charge.refunded` - Remboursement

**Logique:**
1. Recevoir événement Stripe
2. Vérifier signature Stripe (`constructEvent`)
3. Mettre à jour Payment status dans BD
4. Émettre webhooks/notifications (optionnel)

### 4. `/app/api/payments/verify/route.ts`
Endpoint POST pour vérifier le statut d'un paiement.

**Requête:**
```json
{
  "paymentIntentId": "pi_xxx",
  "clientSecret": "secret_xxx"
}
```

**Réponse:**
```json
{
  "status": "success|pending|failed",
  "message": "Décription du statut",
  "paymentId": "pay_xxx",
  "amount": "$100.00",
  "campaignName": "Vente",
  "stripeStatus": "succeeded|processing|requires_action"
}
```

**Logique:**
1. Authentifier l'utilisateur
2. Valider clientSecret
3. Récupérer PaymentIntent de Stripe
4. Récupérer Payment de BD
5. Vérifier propriété (userId)
6. Retourner statut détaillé

### 5. `/components/StripePaymentForm.tsx`
Composant React pour formulaire de paiement.

**Props:**
```typescript
interface StripePaymentFormProps {
  amount: number;              // Montant en dollars
  description?: string;        // Description du paiement
  campaignName?: string;       // Nom de la campagne
  sponsoredPostId?: string;    // ID de la campagne
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}
```

**Utilisation:**
```tsx
import { StripePaymentForm } from '@/components/StripePaymentForm';

export default function PaymentPage() {
  return (
    <StripePaymentForm
      amount={100}
      campaignName="Vente d'été"
      description="Campagne sponsorisée"
      onSuccess={(id) => console.log('Payment successful:', id)}
      onError={(error) => console.log('Payment error:', error)}
    />
  );
}
```

**Caractéristiques:**
- CardElement Stripe intégré
- Gestion des états (loading, error)
- Création PaymentIntent automatique
- Confirmation client-side `confirmCardPayment`
- Affichage des cartes de test en développement
- Redirection automatique vers confirmation

### 6. `/app/advertiser/create-campaign/page.tsx`
Page complète pour créer campagne sponsorisée avec paiement.

**Flux à 2 étapes:**
1. **Détails:** Remplir nom, description, contenu, lien, budget
2. **Paiement:** Intégration StripePaymentForm

**Fonctionnalités:**
- Validation des champs
- Création campagne avec status `pending_payment`
- Intégration formulaire Stripe
- Messages d'erreur détaillés
- Progress indicator

### 7. `/app/advertiser/payment-confirmation/page.tsx`
Page de confirmation après paiement.

**États gérés:**
- `loading` - Vérification en cours
- `success` - Paiement réussi, campagne active
- `pending` - Paiement en cours, 3D Secure, etc.
- `failed` - Paiement échoué

**Fonctionnalités:**
- Récupération automatique du statut via `/api/payments/verify`
- Affichage du reçu
- Liens vers dashboard ou page d'aide
- Redirection automatique en cas de succès

### 8. Schéma Prisma - Modèle Payment

```prisma
model Payment {
  id                      String    @id @default(cuid())
  userId                  String
  user                    User      @relation("UserPayments", fields: [userId], references: [id])
  
  amount                  Float     // Montant en cents
  currency                String    @default("USD")
  status                  String    @default("pending")  // pending, completed, failed, cancelled, refunded
  stripeStatus            String?   // Statut Stripe: succeeded, payment_failed, canceled, etc.
  
  stripePaymentIntentId   String?   @unique
  stripeChargeId          String?   @unique
  
  description             String?
  metadata                Json?     // campaignId, impressions, etc.
  
  errorMessage            String?   // Message d'erreur si échoué
  
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  
  @@index([userId])
  @@index([status])
  @@index([stripePaymentIntentId])
  @@map("payments")
}
```

## Configuration Stripe Dashboard

### 1. Obtenir les Clés

1. Aller à [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Copier:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

### 2. Créer Webhook

1. Aller à [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquer "Add endpoint"
3. URL: `https://yourdomain.com/api/payments/webhook`
4. Événements à activer:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
5. Copier **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 3. Migrations Prisma

```bash
# Ajouter Payment model au schema.prisma
# puis:

npx prisma migrate dev --name add_payment_model
```

## Flux Complet d'Un Paiement

### 1. Utilisateur Crée Campagne

```
POST /advertiser/create-campaign
│
├─ Utilisateur entre détails (nom, budget, etc.)
│
└─ Submit
   │
   └─ POST /api/sponsored
      ├─ Créer SponsoredPost (status: pending_payment)
      ├─ Sauvegarder en BD
      └─ Rediriger à /api/payments/create-payment-intent
```

### 2. Création PaymentIntent

```
POST /api/payments/create-payment-intent
│
├─ Vérifier authentication (NextAuth)
├─ Valider montant ($10-$100,000)
├─ Récupérer stripe.Customer ou créer
│  └─ stripe.customers.create({ email })
├─ Créer stripe.PaymentIntent
│  └─ amount (en cents)
│  └─ customer (ID)
│  └─ metadata ({ campaignId, etc. })
├─ Sauvegarder Payment
│  └─ prisma.payment.create()
└─ Retourner clientSecret
```

### 3. Confirmation Client

```
<StripePaymentForm>
│
├─ CardElement rendu dans form
├─ User entre card details
│
└─ Submit
   │
   └─ stripe.confirmCardPayment(clientSecret)
      ├─ Envoyer détails carte à Stripe
      ├─ Traiter paiement
      │  ├─ Si requiresAction (3D Secure)
      │  │  └─ Afficher écran d'authentification
      │  │
      │  ├─ Si succeeded
      │  │  └─ Payment réussi!
      │  │
      │  └─ Si error
      │     └─ Afficher erreur
      │
      └─ Rediriger /advertiser/payment-confirmation?payment_intent=...
```

### 4. Webhook Stripe

```
Stripe → POST /api/payments/webhook
│
├─ Recevoir événement
├─ Vérifier signature
│  └─ stripe.webhooks.constructEvent()
│
├─ Si payment_intent.succeeded
│  └─ prisma.payment.update(status: 'completed')
│  └─ Mettre à jour SponsoredPost (status: 'active')
│  └─ Notifier utilisateur
│
└─ Retourner { received: true }
```

### 5. Vérification & Confirmation

```
GET /advertiser/payment-confirmation?payment_intent=pi_...
│
├─ Récupérer payment_intent de URL
│
└─ POST /api/payments/verify
   ├─ Vérifier authentication
   ├─ Récupérer PaymentIntent de Stripe
   ├─ Récupérer Payment de BD
   ├─ Vérifier propriété (userId)
   │
   └─ Retourner statut
      ├─ success → "Paiement réussi!"
      ├─ pending → "En cours..."
      └─ failed → "Erreur"
```

## Cartes de Test Stripe

**Mode Test (Sandbox):**

| Statut | Carte | Code CVC | Expire |
|--------|-------|----------|--------|
| ✅ Succès | 4242 4242 4242 4242 | Any | Any future |
| ❌ Décliné | 4000 0000 0000 0002 | Any | Any future |
| ⚠️ 3D Secure | 4000 0025 0000 3155 | Any | Any future |
| ⚠️ DeclinedIncorrectCvc | 4000 0000 0000 0127 | Any | Any future |

## Déploiement en Production

### 1. Basculer en Mode Live

1. Aller à [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Basculer "Test mode" OFF
3. Obtenir les clés LIVE (commencent par `pk_live_` et `sk_live_`)

### 2. Mettre à Jour Variables d'Environnement

```env
# Production
STRIPE_PUBLIC_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
```

### 3. Vérifier Webhook

1. Recréer webhook avec URL production: `https://yourdomain.com/api/payments/webhook`
2. Obtenir nouveau Signing secret
3. Mettre à jour `STRIPE_WEBHOOK_SECRET`

### 4. Tester Avant Production

```bash
# Vérifier configuration en test
curl https://yourdomain.com/api/payments/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentIntentId": "pi_test_...", "clientSecret": "..."}'
```

## Erreurs Courantes

### Issue: "Could not determine signing secret"
**Cause:** `STRIPE_WEBHOOK_SECRET` non défini ou incorrect
**Solution:** Vérifier `.env.local` ou variables d'environnement du serveur

### Issue: "Stripe is not defined"
**Cause:** Import incorrect ou clé manquante
**Solution:** Vérifier `lib/stripe.ts` et `.env.local`

### Issue: Payment créé mais webhook ne se déclenche pas
**Cause:** Webhook endpoint non configuré ou signature invalide
**Solution:** Vérifier URL webhook dans Stripe Dashboard et logs

## Monitoring & Debugging

### Logs Stripe

```bash
# Voir webhooks reçus
Dashboard → Webhooks → Cliquer endpoint

# Voir PaymentIntents
Dashboard → Developers → Events → search "payment_intent"
```

### Logs Locaux

```typescript
// Dans route.ts
console.log('PaymentIntent created:', paymentIntent.id);
console.log('Webhook event:', event.type);
console.log('Payment saved:', payment.id);
```

### Tester Webhook Localement

Utiliser Stripe CLI pour forward les webhooks:

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Authentifier
stripe login

# Forward les webhooks
stripe listen --forward-to localhost:3000/api/payments/webhook

# Trigger test event
stripe trigger payment_intent.succeeded
```

## Prochaines Étapes

1. ✅ Modèle Payment ajouté
2. ✅ Endpoints de paiement créés
3. ✅ Webhooks configurés
4. ⏳ Tests end-to-end
5. ⏳ Dashboard publicitaires
6. ⏳ Rapports et analytics
7. ⏳ Support PayPal (optionnel)
8. ⏳ Vérification KYC/AML (pour vraies entreprises)

## Support

- **Documentation Stripe:** https://stripe.com/docs
- **Webhook Testing:** https://stripe.com/docs/webhooks/test
- **Library Reference:** https://stripe.com/docs/stripe-js

---

**Créé le:** 2024
**Dernier update:** 2024
**Version:** 1.0
