# Setup Shadow Database and Run Prisma Migration
# Usage: .\scripts\setup-shadow-db.ps1
# Note: Requires PostgreSQL superuser credentials or CREATEDB privilege

param(
    [string]$PostgresUser = "postgres",
    [string]$DbHost = "localhost",
    [int]$DbPort = 5432,
    [string]$AppUser = "unify_user",
    [string]$AppPassword = "14octobre1997octobre",
    [string]$MainDb = "unify",
    [string]$ShadowDb = "unify_shadow"
)

Write-Host "🔧 Setting up Prisma Shadow Database..." -ForegroundColor Cyan

# Step 1: Create shadow database
Write-Host "`n📦 Creating shadow database '$ShadowDb'..." -ForegroundColor Yellow
try {
    $createDbCmd = "CREATE DATABASE $ShadowDb OWNER $AppUser;"
    psql -U $PostgresUser -h $DbHost -p $DbPort -c $createDbCmd
    Write-Host "✅ Shadow database created successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Shadow database might already exist or permission denied. Continuing..." -ForegroundColor Yellow
}

# Step 2: Set environment variables
Write-Host "`n🔐 Setting environment variables..." -ForegroundColor Yellow
$env:SHADOW_DATABASE_URL = "postgresql://${AppUser}:${AppPassword}@${DbHost}:${DbPort}/${ShadowDb}?schema=public"
Write-Host "✅ SHADOW_DATABASE_URL set for this session" -ForegroundColor Green

# Step 3: Generate Prisma client
Write-Host "`n🔄 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "✅ Prisma client generated" -ForegroundColor Green

# Step 4: Run migration
Write-Host "`n📤 Running Prisma migration..." -ForegroundColor Yellow
npx prisma migrate dev --name add_story_background
Write-Host "✅ Migration completed" -ForegroundColor Green

# Step 5: Generate Prisma client again
Write-Host "`n🔄 Regenerating Prisma client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "✅ Prisma client regenerated" -ForegroundColor Green

# Step 6: Instructions for restart
Write-Host "`n✨ Setup complete!" -ForegroundColor Cyan
Write-Host @"
📋 Next steps:
   1. In VS Code, press Ctrl+Shift+P and run "TypeScript: Restart TS Server"
   2. Or reload the window: Ctrl+Shift+P → "Developer: Reload Window"
   3. Check for TypeScript errors - they should be resolved

💾 To make SHADOW_DATABASE_URL permanent:
   Add this line to your .env file:
   SHADOW_DATABASE_URL="postgresql://${AppUser}:${AppPassword}@${DbHost}:${DbPort}/${ShadowDb}?schema=public"
"@
