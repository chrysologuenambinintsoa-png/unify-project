# ✅ Vercel Deployment Checklist - Unify

## Pre-deployment Verification

### Code & Build
- [x] No TypeScript errors (`npm run build` passes)
- [x] No ESLint warnings that break build
- [x] All dependencies are in package.json
- [x] postinstall script includes `prisma generate`
- [x] Build script: `prisma generate && next build`

### Configuration Files
- [x] next.config.mjs configured
- [x] tsconfig.json configured
- [x] Cloudinary patterns in next.config.mjs
- [x] .env.example created with all variables
- [ ] .gitignore includes .env files

### Environment Variables
- [ ] DATABASE_URL set
- [ ] NEXTAUTH_URL set (production domain)
- [ ] NEXTAUTH_SECRET generated
- [ ] CLOUDINARY_CLOUD_NAME set
- [ ] CLOUDINARY_API_KEY set
- [ ] CLOUDINARY_API_SECRET set
- [ ] All NEXT_PUBLIC_* variables set

### Database
- [ ] PostgreSQL database created
- [ ] Connection string verified
- [ ] Migrations prepared (`npx prisma migrate deploy`)
- [ ] Prisma client generated (`npx prisma generate`)

### Git & GitHub
- [ ] Code pushed to GitHub
- [ ] .env.local not committed (check .gitignore)
- [ ] No sensitive keys in code

### Vercel Setup
- [ ] Vercel account created
- [ ] GitHub repository connected to Vercel
- [ ] Project created on Vercel
- [ ] Environment variables added to Vercel Dashboard

### Security
- [ ] NEXTAUTH_SECRET is 32+ characters
- [ ] API keys not logged anywhere
- [ ] CORS configured if needed
- [ ] Rate limiting considered for auth endpoints

### Testing Before Deploy
```bash
# Test build locally
npm run build

# Test production start
npm run start

# Or test with Vercel locally
vercel dev
```

### Deployment Steps

1. **Connect GitHub to Vercel:**
   ```
   - Go to vercel.com/new
   - Select GitHub repository
   - Configure project settings
   ```

2. **Add Environment Variables:**
   ```
   - Settings → Environment Variables
   - Add all from .env.example
   ```

3. **Deploy:**
   ```
   - Click Deploy
   - Wait for build to complete
   - Test at your production URL
   ```

### Post-Deployment Tests
- [ ] Homepage loads without errors
- [ ] Can register new account
- [ ] Can login with credentials
- [ ] Avatar upload works (Cloudinary)
- [ ] Posts can be created/viewed
- [ ] Friends feature works
- [ ] Profile pages load

### Monitoring
- [ ] Enable Vercel Analytics
- [ ] Check build logs for warnings
- [ ] Monitor error tracking
- [ ] Set up performance alerts

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Build fails | Check Node version matches, ensure all deps installed |
| 404 on API routes | Verify route.ts files exist in /app/api |
| DB connection fails | Check DATABASE_URL, verify IP whitelist |
| Images don't load | Verify Cloudinary credentials, check NEXT_PUBLIC_* vars |
| Auth fails | Ensure NEXTAUTH_URL matches domain |

### Useful Commands

```bash
# Check Vercel CLI is installed
vercel --version

# Deploy with Vercel CLI
vercel

# Preview deployment
vercel preview

# Production deployment
vercel --prod

# View logs
vercel logs

# Environment info
vercel env list
```

### Recommended Next Steps

1. Set up custom domain
2. Enable Vercel Analytics
3. Configure error tracking (Sentry, etc.)
4. Set up monitoring alerts
5. Create backup strategy for database
6. Document runbook for common issues

---

**Ready to Deploy? ✨**

When all items are checked, you're ready to deploy to Vercel!
