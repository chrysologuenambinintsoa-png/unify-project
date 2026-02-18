#!/bin/bash

# Advanced Messaging Integration Verification Script
# Checks if all features are properly integrated

echo "🔍 Verifying Advanced Messaging Integration..."
echo ""

# Counter for checks
PASSED=0
FAILED=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
        ((PASSED++))
    else
        echo "❌ MISSING: $1"
        ((FAILED++))
    fi
}

# Function to check if pattern exists in file
check_pattern() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo "✅ $1 contains '$2'"
        ((PASSED++))
    else
        echo "❌ $1 MISSING pattern: '$2'"
        ((FAILED++))
    fi
}

echo "📁 Feature Files..."
check_file "./hooks/useWebSocket.ts"
check_file "./hooks/useOptimisticUpdates.ts"
check_file "./hooks/useOfflineSupport.ts"
check_file "./hooks/useAdvancedMessageSearch.ts"
check_file "./lib/indexedDB.ts"
check_file "./components/VirtualizedLists.tsx"

echo ""
echo "🔧 Component Integration..."

echo ""
echo "📝 MessagesList Integration:"
check_pattern "./components/messages/MessagesList.tsx" "useOptimisticUpdates"
check_pattern "./components/messages/MessagesList.tsx" "useOfflineSupport"
check_pattern "./components/messages/MessagesList.tsx" "useAdvancedMessageSearch"
check_pattern "./components/messages/MessagesList.tsx" "optimisticMessages"
check_pattern "./components/messages/MessagesList.tsx" "conversationId"

echo ""
echo "💬 MessageItem Integration:"
check_pattern "./components/messages/MessageItem.tsx" "isOptimistic"
check_pattern "./components/messages/MessageItem.tsx" "optimisticStatus"
check_pattern "./components/messages/MessageItem.tsx" "onRetry"
check_pattern "./components/messages/MessageItem.tsx" "Clock"
check_pattern "./components/messages/MessageItem.tsx" "AlertCircle"

echo ""
echo "📝 MessageInput Integration:"
check_pattern "./components/messages/MessageInput.tsx" "useOptimisticUpdates"
check_pattern "./components/messages/MessageInput.tsx" "useOfflineSupport"
check_pattern "./components/messages/MessageInput.tsx" "saveDraft"
check_pattern "./components/messages/MessageInput.tsx" "getDraft"
check_pattern "./components/messages/MessageInput.tsx" "currentUserId"
check_pattern "./components/messages/MessageInput.tsx" "isOnline"

echo ""
echo "📚 Documentation..."
check_file "./ADVANCED_MESSAGING_INTEGRATION.md"

echo ""
echo "═════════════════════════════════════════"
echo "🎉 VERIFICATION RESULTS"
echo "═════════════════════════════════════════"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🚀 All integrations verified successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Pass conversationId prop to <MessagesList /> and <MessageInput />"
    echo "2. Pass currentUserId prop to <MessageInput />"
    echo "3. Pass onRetry handler to <MessageItem />"
    echo "4. Test offline functionality"
    echo "5. Test optimistic updates"
    echo "6. Deploy with confidence!"
    exit 0
else
    echo "⚠️  Some checks failed. Please verify the integration."
    exit 1
fi
