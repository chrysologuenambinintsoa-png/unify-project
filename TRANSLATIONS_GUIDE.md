# 📋 Guide Complet des Traductions - Unify 2026

## 📚 Langues Supportées
- **FR** (Français)
- **EN** (English)
- **ES** (Español)
- **DE** (Deutsch)
- **MG** (Malagasy)
- **CH** (中文)

## 📂 Architecture des Traductions

### Localisation du système i18n
```
lib/
├── i18n.ts              # Export des traductions et fonctions
└── translations/
    ├── fr.json          # Traductions Français ✅
    ├── en.json          # Traductions English ✅
    ├── es.json          # Traductions Español
    ├── de.json          # Traductions Deutsch
    ├── mg.json          # Traductions Malagasy
    └── ch.json          # Traductions 中文
```

### Contexte Language
```
contexts/
└── LanguageContext.tsx  # Fournisseur du contexte de langue
```

## 🎯 Clés de Traductions Ajoutées (v2.0)

### 1. **privacyPolicy** 
Section de la politique de confidentialité
```json
{
  "title": "Politique de Confidentialité",
  "lastUpdated": "Dernière mise à jour : Février 2026",
  "introduction": "Chez Unify, nous prenons votre vie privée très au sérieux...",
  "dataCollection": "Collecte des Données",
  "dataUsage": "Utilisation des Données",
  "dataSecurity": "Sécurité des Données",
  "gdprRights": "Vos Droits (RGPD)",
  "cookies": "Cookies et Suivi",
  "dataRetention": "Rétention des Données",
  "childrenProtection": "Contrôle Parental",
  "contact": "Contact et Réclamations"
}
```

### 2. **termsOfService**
Section des conditions d'utilisation
```json
{
  "title": "Conditions d'Utilisation",
  "lastUpdated": "Dernière mise à jour : Février 2026",
  "introduction": "Veuillez lire et accepter nos conditions...",
  "acceptTerms": "J'accepte les conditions d'utilisation...",
  "responsibleUse": "Utilisation Responsable",
  "dataPrivacy": "Confidentialité des Données",
  "userContent": "Contenu Utilisateur",
  "intellectualProperty": "Propriété Intellectuelle",
  "limitationOfLiability": "Limitation de Responsabilité",
  "modifications": "Modification des Conditions",
  "access": "Accéder à Unify"
}
```

### 3. **helpPage**
Section de la page d'aide
```json
{
  "welcome": "Bienvenue sur Unify !",
  "discoverFeatures": "Découvrez comment utiliser toutes les fonctionnalités",
  "messaging": "Messagerie",
  "messagingDesc": "Envoyez des messages privés...",
  "friends": "Amis",
  "friendsDesc": "Trouvez et connectez-vous...",
  "sharing": "Partage",
  "sharingDesc": "Partagez photos, vidéos...",
  "stories": "Stories",
  "storiesDesc": "Créez des stories éphémères...",
  "privacy": "Confidentialité",
  "privacyDesc": "Contrôlez vos paramètres...",
  "settings": "Paramètres",
  "settingsDesc": "Personnalisez votre profil...",
  "faq": "Questions Fréquemment Posées",
  "moreQuestions": "Vous avez d'autres questions ?",
  "contactUs": "Nous contacter"
}
```

### 4. **copyright**
Section du copyright et footer
```json
{
  "allRights": "Tous droits réservés",
  "socialPlatform": "Une plateforme sociale pour connecter les communautés",
  "privacyLink": "Confidentialité",
  "termsLink": "Conditions",
  "helpLink": "Aide"
}
```

## 🔧 Comment Utiliser les Traductions

### 1. **Dans un Composant Client**
```tsx
'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export function MyComponent() {
  const { translation, language, setLanguage } = useLanguage();

  return (
    <div>
      <h1>{translation.privacyPolicy.title}</h1>
      <p>{translation.copyright.allRights}</p>
      
      {/* Changer la langue */}
      <button onClick={() => setLanguage('en')}>English</button>
      <button onClick={() => setLanguage('fr')}>Français</button>
    </div>
  );
}
```

### 2. **Accéder à une Traduction Imbriquée**
```tsx
// Syntaxe : translation.section.key
const title = translation.privacyPolicy.title;
const copyright = translation.copyright.allRights;
const helpWelcome = translation.helpPage.welcome;
```

### 3. **Ajouter une Nouvelle Traduction**
1. Ouvrir `lib/translations/fr.json`
2. Ajouter la clé dans la section appropriée
3. Répéter pour toutes les autres langues (`en.json`, `es.json`, etc.)
4. Utiliser dans un composant via `translation.section.key`

## 📄 Pages Mises à Jour (v2.0)

### ✅ app/privacy/page.tsx
- **Type:** Client Component
- **Traductions:** Utilise `translation.pages.privacy`
- **Contenu:** 10 sections complètes (RGPD conforme)
- **Sections:**
  1. Collecte des Données
  2. Utilisation des Données
  3. Partage des Données
  4. Sécurité des Données
  5. Vos Droits (RGPD)
  6. Cookies et Suivi
  7. Rétention des Données
  8. Modifications
  9. Contrôle Parental
  10. Contact et Réclamations
- **Footer:** CopyrighFooter (avec traductions)
- **Animations:** Framer Motion

### ✅ app/help/page.tsx
- **Type:** Client Component
- **Contenants:**
  - 6 cards de guides (Messagerie, Amis, Partage, Stories, Confidentialité, Paramètres)
  - Section FAQ avec 4 questions fréquemment posées
  - Boutons CTA (Accéder aux paramètres, Politique de confidentialité)
  - Section "Nous contacter"
- **Footer:** CopyrighFooter (avec traductions)
- **Animations:** Framer Motion avec délais progressifs

### ✅ app/terms/page.tsx
- **Type:** Client Component
- **Contenants:**
  - 10 sections légales complètes
  - Checkbox d'acceptation
  - Boutons de navigation (Retour / Accéder à Unify)
  - Message d'information
- **Footer:** CopyrighFooter (avec traductions)
- **Fonctionnalités:** Conditional rendering basé sur l'acceptation

## 🎨 Components Créés/Mis à Jour

### ✅ components/CopyrighFooter.tsx (NOUVEAU)
- **Réutilisable:** Peut être ajouté à n'importe quelle page
- **Contenu:**
  - © ANNÉE Unify - Tous droits réservés
  - Slogan de la plateforme
  - 3 liens navigables (Privacy, Terms, Help)
- **Traductions:** Utilise `translation.copyright.*`
- **Animations:** Framer Motion fade-in

## 📊 Statistiques de Traductions

| Clé de Section | Nombre de Clés | Status |
|---|---|---|
| common | 13 | ✅ Complet |
| auth | 16 | ✅ Complet |
| nav | 8 | ✅ Complet |
| post | 15 | ✅ Complet |
| message | 9 | ✅ Complet |
| story | 8 | ✅ Complet |
| group | 10 | ✅ Complet |
| page | 7 | ✅ Complet |
| friends | 8 | ✅ Complet |
| notification | 15 | ✅ Complet |
| settings | 14 | ✅ Complet |
| profile | 14 | ✅ Complet |
| pages | 5 | ✅ Complet |
| welcomePage | 13 | ✅ Complet |
| login | 3 | ✅ Complet |
| validation | 6 | ✅ Complet |
| errors | 7 | ✅ Complet |
| success | 4 | ✅ Complet |
| tabLabels | 6 | ✅ Complet |
| settingsPage | 3 | ✅ Complet |
| **privacyPolicy** | **8** | **✅ NOUVEAU** |
| **termsOfService** | **9** | **✅ NOUVEAU** |
| **helpPage** | **13** | **✅ NOUVEAU** |
| **copyright** | **5** | **✅ NOUVEAU** |
| **TOTAL** | **202+** | **✅ COMPLET** |

## 🌍 Langues à Compléter

Les fichiers JSON pour ces langues existent déjà :
- `en.json` - ✅ Mis à jour avec nouvelles clés
- `es.json` - ⏳ À compléter avec les mêmes clés
- `de.json` - ⏳ À compléter avec les mêmes clés
- `mg.json` - ⏳ À compléter avec les mêmes clés
- `ch.json` - ⏳ À compléter avec les mêmes clés

## 🚀 Prochaines Étapes

1. **Compléter les traductions manquantes** pour ES, DE, MG, CH
2. **Ajouter un sélecteur de langue** dans les paramètres/navbar
3. **Intégrer les traductions** dans les composants PostCard, CommentsModal, etc.
4. **Créer des pages About/Contact** traduites
5. **Tester tous les changements de langue** dans l'application

## 💡 Bonnes Pratiques

1. **Garder les clés imbriquées logiquement** (privacyPolicy, termsOfService, etc.)
2. **Utiliser des clés cohérentes** entre les langues
3. **Éviter les traductions dures** dans les composants
4. **Utiliser `useLanguage()` hook** dans tous les composants
5. **Stocker les préférences** dans localStorage
6. **Valider** que toutes les clés existent dans tous les fichiers JSON

## 📋 Checklist de Complétude

- ✅ Pages privacy/help/terms enrichies
- ✅ Copyright 2026 ajouté aux 3 pages
- ✅ Footer réutilisable créé (CopyrighFooter)
- ✅ Traductions FR complètes (privacyPolicy, termsOfService, helpPage, copyright)
- ✅ Traductions EN complètes
- ⏳ Traductions ES/DE/MG/CH à compléter
- ⏳ Sélecteur de langue à ajouter à la UI
- ⏳ Intégration des traductions dans tous les composants

---

**Version:** 2.0  
**Date:** Février 2026  
**Statut:** En Développement

