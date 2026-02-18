## Installation du champ Gender

Ce changement ajoute un champ `gender` au modèle User pour générer des avatars Dicebear appropriés au sexe de l'utilisateur.

### Étapes de mise en place

#### 1. **Appliquer la migration à la base de données**

Run the SQL migration:
```bash
# Option 1: Use the provided SQL file
psql your_database_url < prisma/migrations/add_gender_field.sql

# Option 2: Manual SQL execution
ALTER TABLE "users" ADD COLUMN "gender" VARCHAR(10) DEFAULT 'other';
CREATE INDEX idx_users_gender ON "users"("gender");
```

#### 2. **Regenerate Prisma types** (optional, already done)
```bash
npx prisma generate
```

### Usage

The system now supports three gender values:
- `'male'` / `'masculin'` / `'m'` → Uses gender-neutral avatar style
- `'female'` / `'feminin'` / `'f'` → Uses gender-neutral avatar style  
- `'other'` (default) → Uses generic avatar style
- `null` / empty → Falls back to generic style

### How it works

1. **Real avatars take priority**: If a user has uploaded an avatar, it's used regardless of gender
2. **Dicebear fallback**: If no real avatar exists, the system generates one based on gender:
   - Female/Feminine users: Neutral avatar style with random backgrounds
   - Male/Masculin users: Neutral avatar style with random backgrounds
   - Other/Unknown: Standard avatars

### Files modified

- `prisma/schema.prisma` - Added `gender` field to User model
- `lib/avatar-utils.ts` - New utility function `generateAvatarUrl()` for gender-aware avatar generation
- `app/api/messages/conversations/route.ts` - Updated to use `generateAvatarUrl()`
- `app/api/messages/conversations/[userId]/route.ts` - Updated to use `generateAvatarUrl()`

### API Usage

The `generateAvatarUrl()` function can be imported and used in any API route:

```typescript
import { generateAvatarUrl } from '@/lib/avatar-utils';

const avatarUrl = generateAvatarUrl(
  user.avatar,        // real avatar (can be null)
  user.fullName,      // fallback seed for Dicebear
  user.id,            // unique identifier
  user.gender         // gender value
);
```

### Future enhancements

- Add gender selection UI to user settings
- Store gender preferences in user profile
- Generate preference-based avatars (anime, pixel art, etc.)
- Support additional gender identities
