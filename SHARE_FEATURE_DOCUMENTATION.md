# Post Sharing Feature - Two Modes Implementation

## Overview

The post sharing feature has been completely redesigned to support two distinct sharing modes:
1. **Private Message** - Share a post directly to a friend via private message
2. **Group Post** - Share a post to a group where you are a member

---

## Architecture

### 1. Backend API (`/api/posts/[postId]/share`)

#### Endpoint
```
POST /api/posts/[postId]/share
```

#### Request Body
```json
{
  "shareType": "message" | "group",
  "recipientId": "string (for message mode)",
  "groupId": "string (for group mode)",
  "message": "string (optional custom message)"
}
```

#### Response - Message Mode
```json
{
  "success": true,
  "shareType": "message",
  "message": {
    "id": "string",
    "content": "string",
    "senderId": "string",
    "recipientId": "string",
    "sharedPostId": "string",
    "createdAt": "datetime",
    "sender": { /* user object */ },
    "recipient": { /* user object */ },
    "sharedPost": { /* full post object */ }
  }
}
```

#### Response - Group Mode
```json
{
  "success": true,
  "shareType": "group",
  "post": {
    "id": "string",
    "content": "string",
    "userId": "string",
    "sharedPostId": "string",
    "groupId": "string",
    "createdAt": "datetime",
    "user": { /* user object */ },
    "sharedPost": { /* original post */ },
    "media": [ /* copied media from original */ ],
    "group": { /* group object */ }
  }
}
```

#### Error Responses
```json
{
  "error": "Invalid shareType. Must be 'message' or 'group'",
  "status": 400
}
```

#### Validation

**Message Mode:**
- User must be authenticated
- Post must exist
- Recipient must exist
- Users must be friends (accepted friendship)

**Group Mode:**
- User must be authenticated
- Post must exist
- Group must exist
- User must be a member of the group

---

## Frontend Components

### ShareModal Component
**Location:** `components/post/ShareModal.tsx`

A comprehensive modal that handles the entire sharing workflow:

#### Features
- **Mode Selection**: Toggle between "Private Message" and "Group Post"
- **Friends List**: Loads and displays all friends for message sharing
- **Groups List**: Loads and displays user's groups for group sharing
- **Custom Message**: Optional message field to add context when sharing
- **Visual Feedback**: Selected friend/group is highlighted with checkmark
- **Error Handling**: Displays user-friendly error messages
- **Loading States**: Shows loading indicators while fetching data

#### Props
```typescript
interface ShareModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onShare: (shareType: 'message' | 'group', id: string, message?: string) => Promise<void>;
  postContent?: string;
}
```

#### Usage Example
```tsx
<ShareModal
  postId={post.id}
  isOpen={showShareModal}
  onClose={() => setShowShareModal(false)}
  onShare={handleSharePost}
  postContent={post.content}
/>
```

### Integration Points

#### PostCard Component
- Imports `ShareModal` from `components/post/ShareModal`
- Implements `handleSharePost` function to call the API
- Manages `showShareModal` state
- Updates `shareCount` on successful share

#### Post Component
- Imports `ShareModal` from `components/post/ShareModal`
- Implements share logic in the modal's `onShare` callback
- Manages `showShareModal` state
- Increments home activity on successful share

---

## API Endpoints

### Get Friends
```
GET /api/friends
```
Returns array of friend objects with: `id`, `username`, `fullName`, `avatar`

### Get Groups
```
GET /api/groups?type=my
```
Returns array of group objects with: `id`, `name`, `image`, `memberCount`

---

## Database Models

### Message Model Enhancement
The existing `Message` model now supports shared posts:
- `sharedPostId`: Optional reference to shared post

### Post Model
Already supports:
- `sharedPostId`: Reference to original post when shared
- `groupId`: Reference to group where post is shared
- `media`: Can include copied media from shared post

---

## User Flow

### Sharing to Private Message
1. User clicks "Share" button on a post
2. ShareModal opens in "Private Message" mode
3. Friends list is loaded and displayed
4. User selects a friend from the list
5. User optionally adds a custom message
6. User clicks "Share" button
7. API creates a new message with `sharedPostId`
8. Message appears in recipient's direct messages
9. Post is linked/accessible from the message

### Sharing to Group
1. User clicks "Share" button on a post
2. ShareModal opens (defaults to "Private Message")
3. User clicks "Group Post" tab
4. User's groups are loaded and displayed
5. User selects a group from the list
6. User optionally adds context message
7. User clicks "Share" button
8. API creates a new post in the group with `sharedPostId`
9. Original post media is copied to the new group post
10. Post appears in group feed with attribution

---

## Styling

### Modal Design
- **Width**: Max 2xl (896px)
- **Height**: Max 90vh with scrollable content
- **Header**: White with border-bottom
- **Mode Selection**: Grid with visual indicators (blue for message, green for group)
- **Recipients List**: Max height 256px with overflow scroll
- **Footer**: Sticky with Cancel and Share buttons

### Color Scheme
- **Message Mode**: Blue (#3B82F6)
- **Group Mode**: Green (#10B981)
- **Selected States**: Background color + border color
- **Disabled States**: Gray (for unselected options)

---

## Error Handling

### Client-Side
- Try-catch wrapper around API call
- User-friendly error messages displayed in modal
- Validation of selected recipient/group before submission
- Network error handling with user feedback

### Server-Side
- Validates `shareType` parameter
- Checks for required `recipientId` or `groupId`
- Verifies post existence
- Checks friendship status for message mode
- Verifies group membership for group mode
- Returns structured error responses with `error` and optional `details`

---

## Testing Scenarios

### Positive Tests
1. ✅ Share post to friend via message
2. ✅ Share post to group with custom message
3. ✅ Verify message appears in recipient's inbox
4. ✅ Verify group post appears in group feed
5. ✅ Verify original post media is copied
6. ✅ Verify share count increments

### Negative Tests
1. ❌ Share to non-friend (should fail)
2. ❌ Share to group user is not member of
3. ❌ Share non-existent post
4. ❌ Share with invalid shareType
5. ❌ Share without authentication

---

## Future Enhancements

1. **Share to Multiple Recipients**: Select multiple friends or groups
2. **Share Analytics**: Track which posts are shared most
3. **Share Permissions**: Allow post owner to control sharing
4. **Share Preview**: Show shared post in a preview before sending
5. **Schedule Share**: Share at a specific time
6. **Share History**: Track where a post has been shared
7. **Reaction to Shares**: Friends can react to shared posts in messages

---

## API Reference Quick Start

### Share to Friend
```javascript
fetch('/api/posts/123/share', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    shareType: 'message',
    recipientId: 'friend-id-456',
    message: 'Check this out!'
  })
})
.then(r => r.json())
.then(data => console.log(data.message))
```

### Share to Group
```javascript
fetch('/api/posts/123/share', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    shareType: 'group',
    groupId: 'group-id-789',
    message: 'Great content from my feed'
  })
})
.then(r => r.json())
.then(data => console.log(data.post))
```

---

## Files Modified

1. **`/app/api/posts/[postId]/share/route.ts`** - Complete rewrite for dual-mode support
2. **`/components/post/ShareModal.tsx`** - New component
3. **`/components/post/PostCard.tsx`** - Integration of ShareModal
4. **`/components/Post.tsx`** - Integration of ShareModal

---

## Database Considerations

### Indexes
- Message: `(senderId, recipientId, sharedPostId)`
- Post: `(sharedPostId, groupId, userId)`

### Performance Notes
- Friends list is loaded on-demand when modal opens
- Groups list is loaded only when group mode is selected
- Media copying for group posts is automatic

---

## Deployment Notes

1. Ensure all related API endpoints exist:
   - `/api/friends`
   - `/api/groups`
   - `/api/messages`
   - `/api/posts`

2. Verify database migrations for `sharedPostId` fields

3. Update user notifications to include share events

4. Consider rate limiting for share operations

---

## Support & Troubleshooting

### Common Issues

**"User is not your friend" error**
- Verify friendship exists and status is 'accepted'
- Check friendship model for correct status values

**"You are not a member of this group" error**
- Verify user is in GroupMember table
- Check group membership hasn't been revoked

**Share count not updating**
- Verify `setShareCount` is being called
- Check `incrementHomeActivity` dependency

**Modal not loading friends/groups**
- Check network requests in browser DevTools
- Verify `/api/friends` and `/api/groups` endpoints exist
- Check authentication token is included

