# Migrated Next.js + Prisma scaffold

This workspace was scaffolded from a static `index.html` into a minimal Next.js app with Prisma and Postgres.

Quick start

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to your Postgres connection string.

2. Install dependencies:

```bash
npm install
```

3. Generate Prisma client and run initial migration:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Start dev server:

```bash
npm run dev
```

API routes

- `GET /api/items` - list items
- `POST /api/items` - create item ({ title, content })
- `GET /api/items/:id` - get single item
- `PUT /api/items/:id` - update item
- `DELETE /api/items/:id` - delete item

Next steps I can do for you:

- Convert the full original HTML's dynamic interactions to React components
- Add authentication (NextAuth) and user models
- Dockerize Postgres + app
