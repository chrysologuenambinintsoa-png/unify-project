# 🗄️ Database Connection Troubleshooting Guide

## Current Issue
Database server at `dpg-d64s49p4tr6s738ql0l0-a.oregon-postgres.render.com:5432` is not responding.

## ✅ Solutions Applied

### 1. **Improved Error Handling**
- Updated `/app/api/badges/route.ts` - increased timeout from 5s to 15s
- Updated `/app/api/unread-counts/route.ts` - added timeout handling and graceful fallbacks
- All database queries now return 0 counts instead of crashing when DB is unavailable

### 2. **Prisma Configuration Optimized**
- Reduced verbose logging to prevent performance issues
- Optimized error messages
- Reduced retry attempts from 5 to 3 (faster failure detection)

### 3. **API Resilience**
All database-dependent APIs now:
- Use `Promise.race()` with 15-second timeouts
- Catch errors gracefully
- Return sensible defaults (0 counts) when DB is unavailable
- Include detailed error logging for debugging

## 🔧 Render Database Status Checks

### Check 1: Verify Database is Running
```bash
# SSH into your Render PostgreSQL instance and run:
SELECT 1;
```

### Check 2: Check Connection String
Your Discord URL should match:
```
postgresql://unify_user:password@dpg-d64s49p4tr6s738ql0l0-a.oregon-postgres.render.com:5432/unify_4ucr?sslmode=require
```

### Check 3: Verify Network
```bash
# From your dev machine:
psql "postgresql://unify_user:password@dpg-d64s49p4tr6s738ql0l0-a.oregon-postgres.render.com:5432/unify_4ucr?sslmode=require"
```

## 🚀 Recommended Actions

### Option 1: Restart Render PostgreSQL (Recommended First)
1. Go to https://dashboard.render.com
2. Find your PostgreSQL instance: `unify_4ucr`
3. Click "Reboot" to restart the database
4. Wait 2-3 minutes for it to come back online

### Option 2: Check Render Service Status
- Visit https://status.render.com
- Verify no active incidents with PostgreSQL in Oregon region

### Option 3: Force Reconnect Prisma
```bash
# Clear Prisma cache and restart dev server
rm -rf node_modules/.prisma
npm install
npm run dev
```

### Option 4: Migrate to New Database Instance
If the current instance is permanently damaged:

1. Create new PostgreSQL instance on Render
2. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@new-host.oregon-postgres.render.com:5432/new_db?sslmode=require"
   ```
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

## 📊 API Timeout Configuration

| Endpoint | Timeout | Behavior |
|----------|---------|----------|
| `/api/badges` | 15s | Returns 0 counts on timeout |
| `/api/unread-counts` | 15s | Returns 0 counts on timeout |
| All other DB queries | 15-30s | Returns empty results on timeout |

## 🔍 Monitoring

### Enable Debug Logging
```bash
# Set in .env
DEBUG=*
```

### Check Logs
- Development: Check terminal output
- Production (Vercel): Check Vercel logs dashboard
- Render: Check PostgreSQL instance logs

## 🎯 Performance Notes

- Queries now have 15-second timeouts (increased from 5s)
- Promise.race() prevents hanging requests
- All errors caught and logged
- App continues running even if database is unavailable

## ⚠️ Important

If database remains unavailable:
1. Check Render dashboard for service status
2. Review PostgreSQL instance logs
3. Consider restarting the instance
4. Contact Render support if issues persist

**Last Updated**: February 17, 2026
