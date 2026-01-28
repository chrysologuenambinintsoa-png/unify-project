# Splashscreen avec Animation Dynamique

## 📋 Composants créés

### 1. **SplashScreen** (`components/SplashScreen.tsx`)
Un splashscreen complet avec animations multiples qui s'affiche automatiquement lors du chargement initial de l'app.

**Caractéristiques:**
- Animation de dégradé de fond
- Icône avec pulsation et rotation
- Barre de chargement animée
- Particules décoratives flottantes
- Intégration avec NextAuth pour détecter l'état de session
- Disparition automatique après 2 secondes

**Usage:** Déjà intégré dans `components/providers.tsx`

```tsx
<SplashScreen isLoading={isInitialLoad} onComplete={onComplete} />
```

---

### 2. **SimpleSplashScreen** (`components/SimpleSplashScreen.tsx`)
Un splashscreen minimaliste et réutilisable avec 3 variantes de design.

**Variantes disponibles:**
- `modern` - Fond sombre avec dégradé bleu-violet-rose
- `minimal` - Fond blanc avec accents gris
- `colorful` - Dégradé cyan-bleu-violet

**Props:**
```tsx
interface SimpleSplashScreenProps {
  duration?: number;        // Durée d'affichage en ms (défaut: 3000)
  onComplete?: () => void;  // Callback après disparition
  variant?: 'modern' | 'minimal' | 'colorful';
}
```

**Exemple d'usage:**
```tsx
<SimpleSplashScreen
  duration={3000}
  onComplete={() => console.log('Splashscreen terminé')}
  variant="colorful"
/>
```

---

### 3. **Page Splash** (`app/splash/page.tsx`)
Une page dédiée au splashscreen avec redirection automatique.

**Accès:** `http://localhost:3000/splash`

---

## 🎨 Animations incluses

### SplashScreen principal
1. **Rotation du logo** - Le cercle gradient tourne continuellement
2. **Pulsation** - Le logo pulse doucement
3. **Flottement** - Les cercles de fond flottent
4. **Barre de chargement** - Animation de gauche à droite
5. **Particules** - 5 points blancs qui montent et disparaissent
6. **Stagger animation** - Les éléments arrivent progressivement

### SimpleSplashScreen
1. **Rotation du cercle gradient**
2. **Mouvement vertical du titre**
3. **Indicateurs de chargement** - 3 points qui pulsent
4. **Fond animé** - 2 cercles qui se déplacent doucement
5. **Animations de démarrage** - Spring effect au lancement

---

## 🚀 Intégration actuelle

Le splashscreen principal est automatiquement intégré via `components/providers.tsx`:

```tsx
<ProvidersContent>
  <SplashScreen isLoading={isInitialLoad} />
  {children}
</ProvidersContent>
```

Elle:
- S'affiche au premier chargement
- Disparaît quand NextAuth a fini de charger la session
- Reste visible pendant 2 secondes minimum

---

## 📱 Utilisation personnalisée

### Pour une page spécifique:
```tsx
'use client';

import { SimpleSplashScreen } from '@/components/SimpleSplashScreen';

export default function MyPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Votre logique de chargement
    setTimeout(() => setLoading(false), 2000);
  }, []);

  if (loading) {
    return <SimpleSplashScreen variant="colorful" />;
  }

  return <div>Contenu de la page</div>;
}
```

### Pour un formulaire:
```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e) => {
  setIsSubmitting(true);
  await submitForm();
  setIsSubmitting(false);
};

return (
  <>
    {isSubmitting && <SimpleSplashScreen duration={5000} variant="minimal" />}
    <form onSubmit={handleSubmit}>
      {/* Formulaire */}
    </form>
  </>
);
```

---

## 🎯 Personnalisation

### Modifier la durée:
```tsx
<SimpleSplashScreen duration={5000} /> // 5 secondes
```

### Modifier les couleurs:
Éditer directement les classes Tailwind dans les composants:
```tsx
// Pour SplashScreen
className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"

// Pour SimpleSplashScreen
from-blue-500 via-purple-500 to-pink-500
```

### Modifier le contenu:
Remplacer "Unify" et "Connectez-vous au monde" par vos propres textes

---

## 🔧 Dépendances

- `framer-motion` (déjà installé)
- `react` (déjà installé)
- Tailwind CSS (déjà configuré)
- `next-auth` (déjà installé, pour intégration dans providers)

---

## 📸 Résumé des animations

| Animation | Durée | Répétition |
|-----------|-------|-----------|
| Rotation logo | 4s | ∞ |
| Pulsation | 2s | ∞ |
| Flottement | 3s | ∞ |
| Barre chargement | 2s | ∞ |
| Particules | 3-8s | ∞ |
| Disparition | 0.5s | 1x |

---

## 💡 Points clés

✅ Responsive et mobile-friendly  
✅ Performance optimisée (utilise GPU)  
✅ Accessible (AnimatePresence gère l'apparition/disparition)  
✅ Réutilisable dans toute l'app  
✅ Intégré automatiquement sans configuration supplémentaire  

