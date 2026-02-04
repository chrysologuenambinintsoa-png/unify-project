Fix Next.js external image host configuration

- Add `via.placeholder.com` to `images.domains` in `next.config.mjs`.
- Consider adding other external hosts (cloudinary, etc.) if used.
- Run `npm run build` or `npm run dev` to verify the change.
