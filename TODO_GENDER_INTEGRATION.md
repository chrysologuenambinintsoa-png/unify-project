## TODO: Integrate Gender Field into User Registration & Profile

### Background
The messaging system now supports dynamic avatar generation based on user gender:
- Avatars are automatically generated using Dicebear if users don't upload real avatars
- Gender-appropriate avatar styles are used (male, female, other)

### Tasks to complete

1. **User Registration Form (app/auth/register)**
   - [ ] Add gender selection field (radio buttons or dropdown)
   - [ ] Options: Male / Female / Other / Prefer not to say
   - [ ] Make field optional (default to "other")
   - [ ] Validate gender value before submission

2. **User Profile Settings (app/settings or user profile page)**
   - [ ] Add gender field to edit profile form
   - [ ] Allow users to update their gender
   - [ ] Send PATCH request to `/api/users/profile` with gender data
   - [ ] Show avatar preview that updates in real-time based on gender selection

3. **User Profile API (app/api/users/profile)**
   - [ ] Update GET endpoint to return `gender` field
   - [ ] Update PUT/PATCH endpoint to accept and save `gender` value
   - [ ] Validate gender value in backend

4. **User Search & Discovery (optional)**
   - [ ] Consider filtering/sorting by gender in user suggestions
   - [ ] Display gender in user profiles (if user permits)

### Implementation notes

- **Default value**: If not provided, defaults to 'other'
- **Accepted values**: 'male', 'female', 'other', 'prefer-not-to-say'
- **Avatar generation**: Handled automatically by `generateAvatarUrl()` in `lib/avatar-utils.ts`
- **Database migration**: Required before implementing this feature (see GENDER_AVATAR_SETUP.md)

### User Experience

1. During registration: User selects gender (optional)
2. In profile: User can change their selected gender
3. In chat: Their avatar automatically reflects their gender preference
4. Other users: See the appropriate gender-based avatar in conversations

### Database query example

```typescript
// When user registers
const newUser = await prisma.user.create({
  data: {
    username: 'newuser',
    fullName: 'John Doe',
    email: 'john@example.com',
    gender: 'male', // or 'female' or 'other'
    // ... other fields
  },
});

// When user updates profile
await prisma.user.update({
  where: { id: userId },
  data: {
    gender: 'female',
  },
});
```

### Related files

- `prisma/schema.prisma` - Gender field definition
- `lib/avatar-utils.ts` - Avatar generation logic
- `app/api/messages/conversations/route.ts` - Uses gender for conversation avatars
- `app/api/messages/conversations/[userId]/route.ts` - Uses gender for message avatars

---
**Status**: Ready for implementation
**Priority**: Medium (enhances UX, not critical for messaging)
**Estimated effort**: 2-3 hours
