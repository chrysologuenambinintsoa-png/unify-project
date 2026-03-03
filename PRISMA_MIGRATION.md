# Prisma Migration Instructions

The `schema.prisma` file has been updated with new fields for the `Item` and `Comment` models:

- `Item`: added `image`, `likes`, and `shares` fields.
- `Comment`: added `parentId`, `replies` relation, and `likes` field.

To apply these changes to your database when developing locally, run:

```bash
npx prisma migrate dev --name add_item_engagements
npx prisma migrate dev --name add_comment_relations
npx prisma generate
```

This will create and run two migrations and regenerate the client. If you already have existing data, Prisma will prompt you; the new fields are nullable or defaulted so the migration should be safe.

When deploying to production, run the appropriate `prisma migrate deploy` command against your production database and make sure the `DATABASE_URL` is set correctly.

For manual control, inspect the generated SQL under `prisma/migrations`.
