# Splash Screen - Implémentation Complète

## 📋 Objectif

Afficher l'écran de démarrage (splash screen) dans deux cas :
1. ✅ **À chaque nouvelle session navigateur** (réouverture du navigateur)
2. ✅ **À chaque changement de session utilisateur** (logout/login avec un autre compte)

## 🔧 Architecture

### Composants créés/modifiés

#### 1. **`hooks/useSplashScreen.ts`** (NOUVEAU)
Hook personnalisé qui gère la logique d'affichage du splash screen.

**Mécanisme :**
- Utilise `sessionStorage` pour détecter les réouvertures du navigateur
- Utilise `localStorage` pour tracker l'ID utilisateur et détecter les changements de session
- Retourne `true` quand le splash doit s'afficher

**Logique :**
```
Si sessionStorage['unify:sessionInitialized'] n'existe pas
  → C'est une nouvelle session navigateur
  → Afficher le splash + marquer la session comme initialisée

Si localStorage['unify:lastUserId'] ≠ session.user.id
  → C'est un changement d'utilisateur
  → Afficher le splash + mettre à jour lastUserId
```

#### 2. **`components/SplashScreenWrapper.tsx`** (NOUVEAU)
Wrapper qui utilise le hook `useSplashScreen` et affiche le `SimpleSplashScreen`.

**Responsabilités :**
- Utiliser le hook pour déterminer s'il faut afficher le splash
- Intégrer le composant `SimpleSplashScreen` avec les bons paramètres
- Gestion automatique du timer (2 secondes)

#### 3. **`components/providers.tsx`** (MODIFIÉ)
Intégration dans les providers principaux.

**Changements :**
- Ajout import de `SplashScreenWrapper`
- Import de `useSession` pour suivre le statut de la session
- Ajout du composant `SplashScreenWrapper` dans le rendu

## 🎯 Comportement détaillé

### Scénario 1 : Premier démarrage / Réouverture du navigateur
```
1. Utilisateur ouvre le navigateur / appelle la page
2. sessionStorage est vide → première session
3. Hook détecte une nouvelle session et définit le flag
4. Splash screen s'affiche pendant 2 secondes
5. À la fermeture du navigateur, sessionStorage est vidé
6. À la réouverture → le splash apparaît à nouveau
```

### Scénario 2 : Changement d'utilisateur (logout → login)
```
1. Utilisateur A connecté → localStorage['unify:lastUserId'] = 'A'
2. Utilisateur A se déconnecte
3. Utilisateur B se connecte → session.user.id = 'B'
4. Hook détecte que 'A' ≠ 'B'
5. Splash screen s'affiche pendant 2 secondes
6. localStorage['unify:lastUserId'] = 'B'
```

### Scénario 3 : Navigation simple (sans changement d'utilisateur)
```
1. Utilisateur A sur la page (splash déjà affiché)
2. Navigation entre les pages / rafraîchissement F5
3. Hook détecte que la session est la même
4. Aucun splash screen
```

## ⚙️ Stockage utilisé

### `sessionStorage` (réinitialisé à la fermeture du navigateur)
- **Clé:** `unify:sessionInitialized`
- **Valeur:** `'true'` si la session navigateur a été initialisée
- **Durée de vie:** Tant que l'onglet/navigateur reste ouvert

### `localStorage` (persiste à travers les fermetures)
- **Clé:** `unify:lastUserId`
- **Valeur:** ID de l'utilisateur actuellement connecté
- **Durée de vie:** Jusqu'au changement d'utilisateur

## 🔄 Flux d'intégration

```
1. Root Layout (app/layout.tsx)
   ↓
2. Providers Component (components/providers.tsx)
   ├─ SessionProvider (NextAuth)
   ├─ ThemeProvider
   ├─ LanguageProvider
   ├─ HomeActivityProvider
   └─ ToastProvider
      ↓
3. ProvidersContent
   ├─ PageProgressBar
   ├─ ToastContainer
   └─ SplashScreenWrapper ← NOUVEAU
      ├─ useSplashScreen Hook
      └─ SimpleSplashScreen Component
```

## 📊 Comparaison Avant/Après

| Cas d'usage | Avant | Après |
|---|---|---|
| Première vanne d'ouverture du navigateur | ❌ Pas de splash | ✅ Splash s'affiche |
| Réouverture du navigateur | ❌ Pas de splash | ✅ Splash s'affiche |
| Changement d'utilisateur | ❌ Pas de splash | ✅ Splash s'affiche |
| Navigation simple | ❌ N/A | ✅ Pas de splash |
| Rafraîchissement F5 | ❌ N/A | ✅ Pas de splash |

## ✅ Fichiers affectés

### Créés
- `hooks/useSplashScreen.ts`
- `components/SplashScreenWrapper.tsx`

### Modifiés
- `components/providers.tsx`

### Non modifiés (réutilisés)
- `components/SimpleSplashScreen.tsx` (vraiment existant)
- `components/SplashScreen.tsx` (optionnel, non utilisé)

## 🧪 Test recommandé

Pour tester l'implémentation :

1. **Test Ouverture/Fermeture Navigateur**
   - Ouvrir le navigateur → Splash doit s'afficher
   - Fermer le navigateur complètement
   - Rouvrir → Splash doit s'afficher à nouveau

2. **Test Changement d'Utilisateur**
   - Se connecter avec User A → Splash s'affiche
   - Se déconnecter
   - Se connecter avec User B → Splash doit s'afficher
   - Se reconnecter avec User A → Splash doit s'afficher

3. **Test Navigation**
   - Sur la page après le splash
   - Naviguer entre les pages → Pas de splash
   - Rafraîchir F5 → Pas de splash (same session)

## 🚀 Déploiement

Aucune variable d'environnement requise. Aucune base de données affectée.
Les changements sont purement côté client avec du sessionStorage et localStorage.

## 📝 Notes techniques

- **SSR Safe:** Tous les accès à `window` sont protégés par `typeof window === 'undefined'`
- **Performance:** Les storages sont vérifiés une seule fois au chargement
- **Graceful degradation:** Si le localStorage/sessionStorage est désactivé, le splash ne s'affichera qu'au changement de session basé sur l'ID utilisateur
- **Durée du splash:** Configurée à 2 secondes (modifiable dans `SplashScreenWrapper.tsx`)
