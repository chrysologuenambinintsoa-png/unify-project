# Pages & Groups Management - Implementation Guide

## ✨ New Features Implemented

### 1. **Admin/Members Management**
- Manage page and group members with role assignments (member, moderator, admin)
- Add/Remove members from pages and groups
- Admin-only operations with proper authorization checks

**Components:**
- `PageMembers` - Manage page members
- `GroupMembers` - Manage group members
- `PageManagementPanel` - Full page admin panel
- `GroupManagementPanel` - Full group admin panel

**API Routes:**
- `GET /api/pages/[pageId]/members` - List page members
- `POST /api/pages/[pageId]/members` - Add member to page
- `PATCH /api/pages/[pageId]/members/[memberId]` - Update member role
- `DELETE /api/pages/[pageId]/members/[memberId]` - Remove member
- `GET /api/groups/[groupId]/members` - List group members
- `POST /api/groups/[groupId]/members` - Add member to group
- `PATCH /api/groups/[groupId]/members/[memberId]` - Update member role
- `DELETE /api/groups/[groupId]/members/[memberId]` - Remove member

### 2. **Direct Messages to Admin**
Members can send direct messages to page/group administrators without being contacts.

**Components:**
- `AdminMessageForm` - Send message modal
- `AdminMessagesList` - View and filter received messages

**API Routes:**
- `POST /api/admin-messages` - Send message to admin
- `GET /api/admin-messages` - Get messages (for admins only)

### 3. **Poll/Survey Functionality**
Create, manage, and vote on polls within pages and groups.

**Components:**
- `PollForm` - Create polls with multiple options
- Voting system with support for single and multiple choice

**API Routes:**
- `POST /api/polls` - Create new poll
- `GET /api/polls?pageId=X` or `?groupId=X` - Get polls
- `PATCH /api/polls/[pollId]` - Vote on poll
- `POST /api/polls/[pollId]/close` - Close poll (admin only)

### 4. **Direct Image Upload**
Upload profile images directly instead of entering URLs.

**Components:**
- `ProfileImageUpload` - Upload and preview images
- Automatic image validation and compression
- Max 5MB file size

**API Routes:**
- `POST /api/pages/[pageId]/upload-profile` - Upload page profile image
- `POST /api/groups/[groupId]/upload-profile` - Upload group profile image

### 5. **Visibility Settings**
Control page/group visibility with three levels:
- **Public** - Visible to everyone
- **Private** - Invitation only
- **Restricted** - Limited visibility

### 6. **Page/Group Deletion**
Admin-only functionality to delete pages or groups with cascade deletion.

**API Routes:**
- `DELETE /api/pages/[pageId]` - Delete page (admin only)
- `DELETE /api/groups/[groupId]` - Delete group (admin only)

## 📦 Database Models

### New/Updated Models:
```prisma
model PagePoll, GroupPoll  // Polls for pages/groups
model PollOption           // Poll answer options
model PollVote             // User votes
model AdminMessage         // Direct messages to admins

// Updated:
// - Page: added profileImage, visibility
// - Group: added profileImage, visibility
// - User: added relations for polls and admin messages
```

## 🔧 Usage Examples

### Managing Page Members
```typescript
// Fetch members
const members = await fetch(`/api/pages/{pageId}/members`);

// Add member
await fetch(`/api/pages/{pageId}/members`, {
  method: 'POST',
  body: JSON.stringify({ userId, role: 'member' })
});

// Update role
await fetch(`/api/pages/{pageId}/members/{memberId}`, {
  method: 'PATCH',
  body: JSON.stringify({ memberId, role: 'admin' })
});
```

### Sending Message to Admin
```typescript
await fetch('/api/admin-messages', {
  method: 'POST',
  body: JSON.stringify({
    pageId: '...',
    subject: 'Issue Report',
    content: 'I found a bug...'
  })
});
```

### Creating a Poll
```typescript
await fetch('/api/polls', {
  method: 'POST',
  body: JSON.stringify({
    pageId: '...',
    question: 'What feature should we add?',
    options: ['Feature A', 'Feature B', 'Feature C'],
    allowMultiple: false
  })
});
```

### Voting on Poll
```typescript
await fetch(`/api/polls/{pollId}`, {
  method: 'PATCH',
  body: JSON.stringify({
    optionIds: ['optionId1'] // Array for multiple choice
  })
});
```

### Upload Profile Image
```typescript
const formData = new FormData();
formData.append('file', imageFile);

await fetch(`/api/pages/{pageId}/upload-profile`, {
  method: 'POST',
  body: formData
});
```

## 🛡️ Security Features

✅ All endpoints require authentication
✅ Admin verification on management operations
✅ Member verification before allowing messages
✅ File size and type validation
✅ Role-based access control
✅ Cascade deletion protection

## 🚀 Integration in UI

### Page Admin Panel
```tsx
<PageManagementPanel
  pageId={pageId}
  pageData={page}
  isAdmin={isUserAdmin}
  onPageUpdated={() => refetch()}
/>
```

### Group Admin Panel
```tsx
<GroupManagementPanel
  groupId={groupId}
  groupData={group}
  isAdmin={isUserAdmin}
  onGroupUpdated={() => refetch()}
/>
```

### Contact Admin Modal
```tsx
<AdminMessageForm
  pageId={pageId}
  onMessageSent={() => showSuccess()}
  isOpen={showModal}
  onClose={setShowModal}
/>
```

## 📋 Migration Steps

1. **Update Prisma Schema** ✅
   - Added 8 new models
   - Updated Page and Group models

2. **Generate Prisma Client** ✅
   ```bash
   npx prisma generate
   ```

3. **Push to Database** (Next step)
   ```bash
   npx prisma db push
   ```

4. **Deploy** (When ready)
   - Test all features locally
   - Deploy to production

## 🔄 Next Steps

- [ ] Push database migrations
- [ ] Add poll display component
- [ ] Add message notification system
- [ ] Create admin dashboard page
- [ ] Add member invitation system
- [ ] Implement announcement system

## 📝 Notes

- All images are stored in `/public/uploads/pages/` and `/public/uploads/groups/`
- Admin messages are marked as 'unread', 'read', or 'replied'
- Polls can be closed by admins at any time
- Cascade deletion ensures no orphaned data
