#!/bin/bash
# Production Deployment Checklist Script
# Usage: bash ./deploy-production-checklist.sh

set -e

echo "🚀 PRODUCTION DEPLOYMENT CHECKLIST - VIDEO/AUDIO CALLS"
echo "======================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
    ((WARNINGS++))
}

# 1. Environment Variables
echo "1️⃣  CHECKING ENVIRONMENT VARIABLES..."
echo ""

if [ -f ".env.production" ]; then
    check_pass "Production .env file exists"
else
    check_fail ".env.production file not found"
fi

if grep -q "NEXT_PUBLIC_TURN_SERVERS" .env.production 2>/dev/null; then
    check_pass "TURN servers configured"
else
    check_warn "TURN servers not configured (recommended for production)"
fi

if grep -q "NEXT_PUBLIC_STUN_SERVERS" .env.production 2>/dev/null; then
    check_pass "STUN servers configured"
else
    check_fail "STUN servers not configured"
fi

if grep -q "LOG_LEVEL=warn\|LOG_LEVEL=error" .env.production 2>/dev/null; then
    check_pass "Logging level appropriate for production"
else
    check_warn "Verify LOG_LEVEL is set appropriately"
fi

echo ""

# 2. Database
echo "2️⃣  CHECKING DATABASE..."
echo ""

if command -v prisma &> /dev/null; then
    check_pass "Prisma CLI available"
else
    check_fail "Prisma CLI not found"
fi

if grep -q "\"type\"" prisma/schema.prisma 2>/dev/null; then
    check_pass "VideoCall type field added to schema"
else
    check_fail "VideoCall schema not updated"
fi

echo ""

# 3. API Routes
echo "3️⃣  CHECKING API ROUTES..."
echo ""

ROUTES=(
    "app/api/video-calls/route.ts"
    "app/api/video-calls/[callId]/accept/route.ts"
    "app/api/video-calls/[callId]/end/route.ts"
    "app/api/video-calls/[callId]/offer/route.ts"
    "app/api/video-calls/[callId]/ice-candidate/route.ts"
)

for route in "${ROUTES[@]}"; do
    if [ -f "$route" ]; then
        check_pass "Route exists: $route"
    else
        check_fail "Route missing: $route"
    fi
done

echo ""

# 4. Components
echo "4️⃣  CHECKING REACT COMPONENTS..."
echo ""

COMPONENTS=(
    "components/messaging/CallModal.tsx"
    "components/messaging/CallInterface.tsx"
    "components/messaging/MessagesContainer.tsx"
)

for component in "${COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        check_pass "Component exists: $component"
    else
        check_fail "Component missing: $component"
    fi
done

echo ""

# 5. Services and Utilities
echo "5️⃣  CHECKING SERVICES & UTILITIES..."
echo ""

SERVICES=(
    "lib/webrtc-service.ts"
    "lib/rtc-config.ts"
    "lib/logger.ts"
    "lib/api-errors.ts"
    "hooks/useCall.ts"
)

for service in "${SERVICES[@]}"; do
    if [ -f "$service" ]; then
        check_pass "Service exists: $service"
    else
        check_fail "Service missing: $service"
    fi
done

echo ""

# 6. Build Check
echo "6️⃣  CHECKING BUILD..."
echo ""

if npm run build &> /dev/null; then
    check_pass "Build successful"
else
    check_fail "Build failed - check npm run build output"
fi

echo ""

# 7. Type Checking
echo "7️⃣  CHECKING TYPES..."
echo ""

if npx tsc --noEmit &> /dev/null; then
    check_pass "TypeScript compilation successful"
else
    check_fail "TypeScript errors found - run: npx tsc --noEmit"
fi

echo ""

# 8. Security
echo "8️⃣  CHECKING SECURITY..."
echo ""

if grep -q "NEXTAUTH_SECRET" .env.production 2>/dev/null; then
    check_pass "NextAuth secret configured"
else
    check_fail "NextAuth secret not configured"
fi

if grep -q "NEXTAUTH_URL" .env.production 2>/dev/null; then
    if grep -q "https://" .env.production 2>/dev/null; then
        check_pass "NextAuth URL uses HTTPS"
    else
        check_fail "NextAuth URL doesn't use HTTPS"
    fi
else
    check_fail "NextAuth URL not configured"
fi

echo ""

# 9. Documentation
echo "9️⃣  CHECKING DOCUMENTATION..."
echo ""

DOCS=(
    "PRODUCTION_CALLS_CONFIGURATION.md"
    "TURN_SERVERS_CONFIGURATION.md"
    "VOICE_VIDEO_CALLS_IMPLEMENTATION.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        check_pass "Documentation exists: $doc"
    else
        check_warn "Documentation missing: $doc"
    fi
done

echo ""

# 10. Summary
echo "======================================================"
echo "📊 SUMMARY"
echo "======================================================"
echo -e "Passed:   ${GREEN}${PASSED}${NC}"
echo -e "Failed:   ${RED}${FAILED}${NC}"
echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ READY FOR PRODUCTION${NC}"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Deploy to production environment"
    echo "2. Monitor logs: LOG_LEVEL=info"
    echo "3. Test calls with 2 users"
    echo "4. Monitor bandwidth usage"
    echo "5. Setup alerts for error rates"
else
    echo -e "${RED}✗ NOT READY FOR PRODUCTION${NC}"
    echo "Please fix the failed checks above before deploying."
    exit 1
fi
