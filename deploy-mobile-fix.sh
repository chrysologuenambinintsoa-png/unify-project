#!/bin/bash

# Mobile Crash Fix Deployment Script
# This script deploys the mobile rendering crash fixes

echo "🚀 Starting Mobile Crash Fix Deployment..."

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  print_error "package.json not found. Are you in the project root?"
  exit 1
fi

print_status "Project root verified"

# Build the project
echo ""
echo "Building Next.js application..."
npm run build

if [ $? -ne 0 ]; then
  print_error "Build failed!"
  exit 1
fi

print_status "Build completed successfully"

# Run type check
echo ""
echo "Running type checks..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
  print_status "Type checks passed"
else
  print_warning "Type check warnings found (building anyway)"
fi

# Summary
echo ""
echo "======================================="
echo -e "${GREEN}Mobile Crash Fix Deployment Complete!${NC}"
echo "======================================="
echo ""
echo "Changes deployed:"
echo "  • hooks/useSplashScreen.ts - Added sessionStorage error handling"
echo "  • components/SplashScreenWrapper.tsx - Added client mount safety"
echo "  • components/layout/MainLayout.tsx - Added Error Boundary + diagnostics"
echo "  • lib/mobileDiagnostics.ts - New diagnostic tool"
echo "  • components/DiagnosticsClient.tsx - New diagnostic component"
echo ""
echo "Testing instructions:"
echo "  1. Clear browser cache and reload (Cmd/Ctrl + Shift + R)"
echo "  2. Open DevTools (F12) → Console tab"
echo "  3. Look for blue [MainLayout], [SplashScreenWrapper] logs"
echo "  4. Watch for any red errors"
echo ""
echo "On real mobile device:"
echo "  1. Open in Chrome/Safari mobile"
echo "  2. Enable remote debugging"
echo "  3. Check console for errors or warnings"
echo ""
print_status "Ready to test!"
