# Guide de Développement - Unify

Guide complet pour développower sur le projet Unify.

## 🚀 Démarrer le Développement

### Setup Initial

```bash
# Cloner le dépôt
git clone https://github.com/votre-username/unify.git
cd unify

# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env.local

# Configurer la base de données
npx prisma db push
npx prisma generate

# Démarrer le serveur de développement
npm run dev

# Dans un autre terminal, démarrer le serveur WebSocket
npm run ws-server

# OU lancer les deux en même temps
npm run dev:all
```

L'application est maintenant disponible à `http://localhost:3000`

---

## 📁 Structure des Dossiers

### Pour Ajouter une Nouvelle Feature

1. **API Route** : `app/api/<feature>/route.ts`
2. **Page/Component** : `app/<feature>/page.tsx` ou `components/<feature>/`
3. **Type** : `types/<feature>.types.ts`
4. **Utilitaires** : `lib/<feature>.ts`
5. **Styles** : `app/globals.css` ou `component.module.css`

### Exemple : Ajouter une nouvelle fonctionnalité "Events"

```
app/
├── api/
│   └── events/
│       ├── route.ts          # GET, POST
│       └── [id]/
│           └── route.ts      # GET, PUT, DELETE
│
├── events/
│   ├── page.tsx              # Page principale
│   └── [id]/
│       └── page.tsx          # Détails d'un event
│
components/
├── events/
│   ├── EventCard.tsx
│   ├── EventForm.tsx
│   └── EventList.tsx
│
types/
└── events.types.ts

lib/
└── events.ts                 # Fonctions utilitaires
```

---

## 🛠️ Workflow de Développement

### 1. Créer une Branche

```bash
# Créer et switcher vers une nouvelle branche
git checkout -b feature/mon-feature

# Ou pour un bugfix
git checkout -b fix/nom-du-bug

# Ou pour une documentation
git checkout -b docs/nom-de-la-doc
```

**Conventions de Nommage** :
- `feature/` : Nouvelles fonctionnalités
- `fix/` : Correction de bugs
- `docs/` : Documentation
- `refactor/` : Restructuration de code
- `test/` : Tests

### 2. Développer

```bash
# Vérifier et linter le code
npm run lint

# Exécuter les tests
npm run test

# Watch mode
npm run test:watch
```

### 3. Commit

```bash
# Commit avec message descriptif
git commit -m "feat: ajouter le système d'events

- Ajouter les modèles Prisma
- Créer les endpoints API
- Implémenter le composant EventForm"

# Ou en utilisant commitizen (si configuré)
npm run commit
```

**Format des Messages** :
```
<type>: <courte description>

<description détaillée optionnelle>

<footer avec référence au ticket/issue>
```

Types valides :
- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage, pas de changement logique
- `refactor:` - Restrucure, pas de changement logique
- `perf:` - Amélioration de performance
- `test:` - Ajout ou modification de tests
- `chore:` - Tâches de build, dépendances, etc.

### 4. Push et Pull Request

```bash
# Push la branche
git push origin feature/mon-feature

# Créer une PR sur GitHub
# Remplir la description, lier les issues
# Attendre la review
```

---

## 📝 Conventions de Code

### Nommage

**Files** :
```
Components        : PascalCase.tsx        (EventCard.tsx)
Pages             : PascalCase.tsx        (EventsPage.tsx)
Utils functions   : camelCase.ts          (formatEventDate.ts)
Types             : PascalCase.d.ts       (Event.types.ts)
```

**Variables & Functions** :
```typescript
// Variables
const eventName = "Annual Gala";
const MAX_EVENTS = 100;

// Functions
function createEvent() { }
const getEventById = (id: string) => { }

// Boolean variables
const isVisible = true;
const hasEvents = false;
const shouldFetch = true;
```

**Classes & Types** :
```typescript
interface Event {
  id: string;
  name: string;
  date: Date;
}

class EventManager {
  // ...
}

type EventStatus = "draft" | "published" | "archived";
```

### TypeScript Strict Mode

Tous les fichiers doivent avoir un typage strict :

```typescript
// ✅ Bon
interface User {
  id: string;
  name: string;
  age?: number;
}

const user: User = {
  id: "1",
  name: "John"
};

// ❌ Mauvais
const user = {
  id: "1",
  name: "John"
};

const result: any = fetchData(); // Éviter any
```

### React Components

```typescript
"use client"; // Pour les composants client

import { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  onClick?: () => void;
}

export function Card({ title, children, onClick }: CardProps) {
  return (
    <div onClick={onClick}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### API Routes

```typescript
// app/api/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Logique ici
    
    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🗄️ Base de Données

### Ajouter un Nouveau Modèle

1. **Éditer `prisma/schema.prisma`** :

```prisma
model Event {
  id        String   @id @default(cuid())
  title     String
  date      DateTime
  location  String
  
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([authorId])
  @@index([date])
}
```

2. **Créer une migration** :

```bash
npx prisma migrate dev --name add_events
```

3. **Utiliser dans une API Route** :

```typescript
import { prisma } from '@/lib/prisma';

const event = await prisma.event.create({
  data: {
    title: 'My Event',
    date: new Date(),
    location: 'New York',
    authorId: userId,
  },
  include: {
    author: true,
  },
});
```

### Bonnes Pratiques

```typescript
// ✅ Utiliser les relations include
const event = await prisma.event.findUnique({
  where: { id },
  include: { author: true }
});

// ❌ Éviter N+1 queries
const events = await prisma.event.findMany();
for (const event of events) {
  const author = await prisma.user.findUnique({
    where: { id: event.authorId }
  });
}

// ✅ Utiliser select pour limiter les champs
const users = await prisma.user.findMany({
  select: { id: true, name: true }
});

// Pagination
const events = await prisma.event.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
});
```

---

## 🔐 Authentification

### Vérifier la Authentification dans une API Route

```typescript
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Must be logged in' },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  // ...
}
```

### Accéder à l'Utilisateur dans un Component Client

```typescript
"use client";

import { useSession } from 'next-auth/react';

export function UserInfo() {
  const { data: session } = useSession();

  if (!session) {
    return <p>Not logged in</p>;
  }

  return <p>Hello {session.user.name}</p>;
}
```

---

## 🧪 Tests

### Unit Tests (Jest)

```typescript
// __tests__/events.test.ts

describe('Event Service', () => {
  it('should create an event', () => {
    const event = createEvent({
      title: 'Test Event',
      date: new Date(),
    });

    expect(event.title).toBe('Test Event');
  });
});
```

### Exécuter les Tests

```bash
# All tests
npm test

# Watch mode
npm test:watch

# Specific test
npm test -- events.test.ts

# Coverage
npm test -- --coverage
```

### Integration Tests

```bash
# Tester les API endpoints
npm run test:api
```

---

## 🔍 Debugging

### Logs en Développement

```typescript
// Utiliser console avec préfixes
console.log('🔍 Debug info:', value);
console.error('❌ Error:', error);
console.warn('⚠️ Warning:', message);
```

### Prisma Studio

```bash
# Ouvrir Une GUI pour explorer la base de données
npx prisma studio
```

### VS Code Debugger

Ajouter à `.vscode/launch.json` :

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/next",
      "runtimeArgs": ["dev"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

---

## 📦 Dépendances

### Ajouter une Nouvelle Dépendance

```bash
# Production
npm install <package-name>

# Development
npm install --save-dev <package-name-dev>

# Vérifier les vulnérabilités
npm audit

# Fixer les vulnérabilités
npm audit fix
```

### Dépendances Principales

| Package | Version | Usage |
|---------|---------|-------|
| next | 15+ | Framework |
| react | 19+ | UI Library |
| prisma | 6.19+ | ORM |
| next-auth | 4.24+ | Authentification |
| tailwindcss | 3.4+ | Styling |

---

## 🎨 Styling

### Tailwind CSS

```typescript
// Utiliser les classes directement
<div className="flex items-center justify-between p-4 bg-blue-50">
  <h1 className="text-xl font-bold text-blue-900">Title</h1>
  <button className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2">
    Action
  </button>
</div>
```

### CSS Modules

```typescript
// styles/Event.module.css
.container {
  display: flex;
  gap: 1rem;
}

// Component
import styles from '@/styles/Event.module.css';

export function Event() {
  return <div className={styles.container}>...</div>;
}
```

### Thème

Le projet supporte light/dark mode via le contexte `ThemeContext`.

```typescript
"use client";

import { useTheme } from '@/contexts/ThemeContext';

export function Button() {
  const { theme } = useTheme();
  
  return (
    <button className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
      Click me
    </button>
  );
}
```

---

## 🔄 WebSocket Développement

### Ajouter un Nouvel Event WebSocket

```typescript
// Dans le serveur WebSocket (server.js ou ts)

socket.on('custom:event', (data) => {
  // Traiter l'événement
  console.log('Received:', data);
  
  // Broadcast à d'autres clients
  socket.broadcast.emit('custom:response', {
    message: 'Response from server',
  });
});
```

### Client (React Component)

```typescript
"use client";

import { useSocket } from '@/hooks/useSocket';

export function EventComponent() {
  const socket = useSocket();

  const sendEvent = () => {
    socket?.emit('custom:event', { data: 'test' });
  };

  useEffect(() => {
    socket?.on('custom:response', (data) => {
      console.log('Server response:', data);
    });

    return () => {
      socket?.off('custom:response');
    };
  }, [socket]);

  return <button onClick={sendEvent}>Send WebSocket Event</button>;
}
```

---

## 🚀 Performance

### Bundle Size

```bash
# Analyser la taille du bundle
npm run build

# Voir dans l'output .next/static
```

### Image Optimization

```typescript
import Image from 'next/image';

// ✅ Bon - Optimisé par Next.js
<Image
  src="/event.jpg"
  alt="Event"
  width={300}
  height={200}
  priority={false}
/>

// ❌ Mauvais - HTML img non optimisé
<img src="/event.jpg" alt="Event" />
```

### Code Splitting

```typescript
import dynamic from 'next/dynamic';

// Charger un composant dynamiquement
const EventForm = dynamic(
  () => import('@/components/events/EventForm'),
  { loading: () => <p>Loading...</p> }
);
```

---

## 🔒 Sécurité

### Validation des Inputs

Utiliser Zod pour valider les données :

```typescript
import { z } from 'zod';

const eventSchema = z.object({
  title: z.string().min(1).max(200),
  date: z.coerce.date().min(new Date()),
  location: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  try {
    const data = eventSchema.parse(body);
    // Données validées
  } catch (error) {
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 422 }
    );
  }
}
```

### Protéger les Variables Sensibles

```env
# .env.local (NE PAS COMMIT)
DATABASE_URL="..."
NEXTAUTH_SECRET="..."

# .env.public (peut être exposé)
NEXT_PUBLIC_API_URL="https://api.example.com"
```

### Sanitizer les Outputs

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Nettoyer le HTML avant d'afficher
const cleanContent = DOMPurify.sanitize(userContent);
```

---

## 📚 Ressources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

## 🤝 Contributing

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add some AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

Assurez-vous que :
- ✅ Le code passe la linting (`npm run lint`)
- ✅ Les tests passent (`npm test`)
- ✅ Pas d'erreurs TypeScript (`npm run type-check`)
- ✅ La documentation est mise à jour
- ✅ Les commits sont descriptifs

---

## 🐛 Signaler un Bug

Ouvrir une issue avec :
- Description du bug
- Pas pour reproduire
- Comportement attendu vs actual
- Screenshots/logs si pertinent
- Environnement (OS, Node version, etc.)

---

## 💡 Questions?

Consultez la documentation complète dans le dossier `/docs` !
