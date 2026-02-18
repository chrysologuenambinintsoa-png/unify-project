# Message Request System Implementation

## Overview
Implemented a complete message request system allowing non-friends to send direct messages that require acceptance. When accepted, the sender and receiver automatically become friends.

## Components Created

### 1. **API Endpoints** (`app/api/messages/message-request/route.ts`)
- **POST**: Send a message request to a non-friend
  - Validates users are not already friends
  - Checks if receiver has blocked sender
  - Creates a `Message` with `isMessageRequest=true` and `messageRequestStatus='pending'`
  - Returns message with sender/receiver info

- **PUT**: Accept or reject a message request
  - Validates receiver ownership
  - Updates `messageRequestStatus` to 'accepted' or 'rejected'
  - On acceptance: Automatically creates friendship between users
  - Returns updated message

### 2. **MessageRequestModal** (`components/messaging/MessageRequestModal.tsx`)
UI component displayed when a user receives a message request:
- Shows sender's profile (avatar, name, username)
- Displays message content
- "Accept & Reply" button - accepts request and becomes friends
- "Decline" button - rejects the request
- Error handling and loading states
- Dark mode support

### 3. **SendMessageRequestModal** (`components/messaging/SendMessageRequestModal.tsx`)
Modal for sending message requests from profile page:
- Input field for custom message (up to 500 chars)
- Sender validation
- Success/error feedback
- Info box explaining friendship acceptance
- "Send Request" and "Cancel" buttons
- Dark mode support

### 4. **MessagesContainer Updates** (`components/messaging/MessagesContainer.tsx`)
Enhanced messaging interface:
- Imports `MessageRequestModal` component
- New state variables:
  - `messageRequest`: Stores pending message request
  - `showMessageRequestModal`: Controls modal visibility
  - `messageRequestLoading`: Tracks request processing
- Added message request polling within existing message polling
- `handleAcceptMessageRequest()`: Accepts request, creates friendship
- `handleRejectMessageRequest()`: Rejects request, navigates back
- Detects pending message requests and auto-displays modal
- Displays modal with accept/reject actions

### 5. **Profile Page Updates** (`app/users/[userId]/profile/page.tsx`)
Added message request functionality to user profiles:
- Imports `SendMessageRequestModal`
- New state variables:
  - `showMessageRequestModal`: Controls modal visibility
  - `messageRequestLoading`: Tracks loading state
- `handleSendMessageRequest()`: Calls API to send message request
- Updated button layout in profile header:
  - When not friends: Shows both "Add Friend" and "Send Message" buttons
  - When friends: Shows "Remove Friend" button
  - When pending request sent: Shows "Cancel Request" button
  - When pending request received: Shows "Accept" button
- Renders `SendMessageRequestModal` component

## Database Schema Changes

Modified `prisma/schema.prisma` - Message model:
```prisma
model Message {
  // ... existing fields ...
  isMessageRequest      Boolean   @default(false)
  messageRequestStatus  String?   @default("pending") // pending, accepted, rejected
  
  @@index([isMessageRequest])
  // ... rest of model ...
}
```

## User Flow

### Sending a Message Request
1. Navigate to non-friend's profile
2. Click "Send Message" button (visible only for non-friends)
3. Modal opens for message composition
4. Write optional introduction message
5. Click "Send Request"
6. Request sent with `isMessageRequest=true, messageRequestStatus='pending'`

### Receiving a Message Request
1. Message request arrives via polling
2. `MessageRequestModal` auto-displays
3. Shows sender info and message content
4. Click "Accept & Reply":
   - Accepts message request
   - Creates friendship automatically
   - Conversation loads normally
5. Or click "Decline":
   - Rejects request
   - Navigates back to messages list

### After Acceptance
- Users become friends
- Message request status changes to 'accepted'
- Normal direct messaging available
- Friendship appears in both users' friend lists

## Key Features

✅ **Non-friend Messaging**: Enable direct messaging before friendship
✅ **Auto-Friendship**: Accept message request = instant friendship
✅ **Blocking Integration**: Blocked users cannot send requests
✅ **Real-time Detection**: Polling detects incoming requests
✅ **Modal UX**: Clean, intuitive interface for request actions
✅ **Multiple Paths**: Send from profile or receive and accept in messages
✅ **Status Tracking**: Pending/accepted/rejected states managed
✅ **Error Handling**: Comprehensive error messages and validation
✅ **Dark Mode**: Full dark mode support throughout

## Files Modified

1. `app/api/messages/message-request/route.ts` - NEW API endpoints
2. `components/messaging/MessageRequestModal.tsx` - NEW modal component
3. `components/messaging/SendMessageRequestModal.tsx` - NEW modal component
4. `components/messaging/MessagesContainer.tsx` - Added request polling & handling
5. `app/users/[userId]/profile/page.tsx` - Added "Send Message" button
6. `prisma/schema.prisma` - Added message request fields

## Migration
- Schema updated with `isMessageRequest` and `messageRequestStatus` fields
- Default values provided for non-breaking migration
- Database sync completed via `npx prisma db push`

## Testing Checklist

- [ ] Send message request from profile page
- [ ] Receive message request in conversation
- [ ] View message request modal with sender info
- [ ] Accept message request (creates friendship)
- [ ] Reject message request
- [ ] Verify non-friends cannot message without request
- [ ] Verify blocked users cannot send requests
- [ ] Test error handling (network errors, validation)
- [ ] Verify dark mode styling
- [ ] Test on mobile responsive view
