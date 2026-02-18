#!/bin/bash

# Database Connection Test Script
# Tests connectivity to Render PostgreSQL

echo "🔍 Testing Database Connection..."
echo "=================================="

DB_HOST="dpg-d64s49p4tr6s738ql0l0-a.oregon-postgres.render.com"
DB_PORT="5432"
DB_NAME="unify_4ucr"

echo ""
echo "Database Info:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo ""

# Test 1: Check if port is accessible
echo "Test 1: Checking TCP connectivity..."
if timeout 5 bash -c "echo >/dev/tcp/$DB_HOST/$DB_PORT" 2>/dev/null; then
  echo "✅ TCP connection to $DB_HOST:$DB_PORT successful"
else
  echo "❌ Cannot reach $DB_HOST:$DB_PORT"
  echo "   Possible issues:"
  echo "   - Database server is down"
  echo "   - Network connectivity issue"
  echo "   - Firewall blocking the connection"
  exit 1
fi

echo ""

# Test 2: Try PostgreSQL connection if psql is installed
if command -v psql &> /dev/null; then
  echo "Test 2: Testing PostgreSQL connection (requires .env credentials)..."
  if [ -f .env ]; then
    # Extract DATABASE_URL from .env
    DB_URL=$(grep -oP 'DATABASE_URL="\K[^"]+' .env)
    if [ -n "$DB_URL" ]; then
      if PGPASSWORD=$(echo $DB_URL | grep -oP ':\K[^@]+') psql -h "$DB_HOST" -p "$DB_PORT" -U unify_user -d "$DB_NAME" -c "SELECT 1" 2>/dev/null; then
        echo "✅ PostgreSQL connection successful"
        echo ""
        echo "📊 Database Status:"
        psql -h "$DB_HOST" -p "$DB_PORT" -U unify_user -d "$DB_NAME" -c "SELECT version();" 2>/dev/null
      else
        echo "❌ PostgreSQL connection failed"
        echo "   Make sure credentials in .env are correct"
      fi
    fi
  else
    echo "⚠️  .env file not found - cannot test PostgreSQL connection"
  fi
else
  echo "Test 2: Skipped (psql not installed)"
  echo "   To install: apt-get install postgresql-client (Linux) or brew install postgresql (macOS)"
fi

echo ""
echo "=================================="
echo "🎯 Solution:"
echo ""
echo "If connection failed:"
echo "  1. Check Render dashboard: https://dashboard.render.com"
echo "  2. Verify PostgreSQL instance is running"
echo "  3. Check DATABASE_URL in .env file"
echo "  4. Try restarting PostgreSQL instance on Render"
echo ""
echo "If connection successful but app still fails:"
echo "  1. Run: npm run dev"
echo "  2. Check console for Prisma errors"
echo "  3. Try: npx prisma db push"
echo ""
