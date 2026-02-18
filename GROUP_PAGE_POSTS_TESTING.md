# Group & Page Posts - Testing Guide

## Quick Test Checklist

### Prerequisites
- Have a test user account logged in
- Have created or joined at least one test group and one test page
- Have created test posts in those groups/pages

### Test Steps

#### 1. **Verify API Response**
```bash
# Call the posts endpoint
GET /api/posts

# Expected Response:
# - Personal posts (type: 'personal-post')
# - Group posts (type: 'group-post') from groups you're a member of
# - Page posts (type: 'page-post') from pages you're a member of
# All sorted by createdAt descending
```

#### 2. **Verify Homepage Display**
1. Navigate to homepage
2. Check that posts appear from:
   - Your friends (existing functionality)
   - Your groups (NEW)
   - Your pages (NEW)
3. Posts should be chronologically sorted

#### 3. **Verify Group Post Context Display**
1. Find a group post in the feed
2. Look for blue badge: `👥 in {GroupName}`
3. Verify it appears in post header after timestamp
4. Verify it's not cut off on mobile (truncated if needed)

#### 4. **Verify Page Post Context Display**
1. Find a page post in the feed
2. Look for purple badge: `📄 on {PageName}`
3. Verify it appears in post header after timestamp
4. Verify it's not cut off on mobile (truncated if needed)

#### 5. **Verify Visibility Rules**
1. Group posts should ONLY appear for members of that group
2. Page posts should ONLY appear for members of that page
3. Test with a non-member account - posts shouldn't appear

#### 6. **Verify Media Display**
1. Create a group post with images/videos
2. Create a page post with images/videos
3. Verify images/videos display correctly in feed
4. Click to open fullscreen viewer
5. Verify viewer works (swipe, keyboard nav, etc.)

#### 7. **Verify Post Actions**
- [ ] Like button works on group posts
- [ ] Like button works on page posts
- [ ] Share button works
- [ ] Bookmark button works
- [ ] Comment count displays (shows 0 for group/page posts)

#### 8. **Verify Sorting**
1. Create posts at different times
2. Verify feed sorts by creation time (newest first)
3. Verify personal, group, and page posts intermix correctly

#### 9. **Test Edge Cases**
- [ ] User in 5+ groups - all group posts appear
- [ ] User in 5+ pages - all page posts appear
- [ ] User leaves a group - posts from that group no longer appear
- [ ] User removed from page - posts from that page no longer appear
- [ ] New post in group - appears on homepage immediately
- [ ] 72+ hour old posts - don't appear in feed (cutoff working)

#### 10. **Mobile Responsiveness**
- [ ] Context badge (group/page) displays properly on mobile
- [ ] Context badge truncates if too long
- [ ] Post header layout doesn't break
- [ ] Avatar and name display correctly

### Performance Testing

#### Typical Queries
```
User with:
- 10 friends
- 3 group memberships
- 2 page memberships

Typical API Response Time:
- Friend posts query: ~50ms
- Group posts query: ~30ms (3 groups)
- Page posts query: ~25ms (2 pages)
- Author enrichment: ~150ms (3 authors)
- Merge & sort: <5ms
Total: ~250ms

Scale Test:
- 100 friends + 20 groups + 10 pages
- API response should still be < 1s
```

### Database Validation

```sql
-- Verify group posts are returned correctly
SELECT gp.id, gp.content, g.name, u.fullName
FROM group_posts gp
JOIN groups g ON gp.groupId = g.id
JOIN users u ON gp.authorId = u.id
WHERE gp.groupId IN (
  SELECT groupId FROM group_members WHERE userId = 'test-user-id'
)
ORDER BY gp.createdAt DESC
LIMIT 10;

-- Verify page posts are returned correctly
SELECT pp.id, pp.content, p.name, u.fullName
FROM page_posts pp
JOIN pages p ON pp.pageId = p.id
JOIN users u ON pp.authorId = u.id
WHERE pp.pageId IN (
  SELECT pageId FROM page_members WHERE userId = 'test-user-id'
)
ORDER BY pp.createdAt DESC
LIMIT 10;
```

### Known Limitations (For Future Enhancement)

- [ ] Comment count shows 0 for group/page posts (comments table needs creation)
- [ ] Like count shows 0 for group/page posts (like action not yet integrated)
- [ ] React count shows 0 for group/page posts (reactions need table creation)
- [ ] Edit/delete not available for group/page posts
- [ ] No notifications for group/page posts

### Rollback Plan

If issues occur:
1. Revert `/app/api/posts/route.ts` to original version
2. Revert `/components/Post.tsx` to remove group/page context badges
3. Homepage will return to showing only personal and friend posts

---

## Browser Developer Tools Testing

### Network Tab
1. Go to homepage
2. Open DevTools → Network tab
3. Filter for `/api/posts`
4. Click to expand the request/response
5. Inspect JSON response:
   - Should see `type: 'personal-post'`
   - Should see `type: 'group-post'` entries
   - Should see `type: 'page-post'` entries
   - All should have proper `user`, `media`, `group`/`page` fields

### Console Logs
Add debug logging to verify flow:
```javascript
// In browser console
// Check what posts are being rendered
const posts = document.querySelectorAll('[data-post-type]');
console.log('Total posts:', posts.length);
posts.forEach(p => {
  console.log(p.dataset.postType);
});
```

---

## Success Criteria

✅ Feature is working if:
1. Homepage feed includes posts from groups and pages user is member of
2. Group posts show blue `👥 in {GroupName}` badge
3. Page posts show purple `📄 on {PageName}` badge
4. Posts are sorted chronologically (newest first)
5. Non-members don't see group/page posts
6. Media displays correctly in fullscreen viewer
7. API response time is < 1 second
8. Mobile layout is responsive

---

Date Implemented: 2024
Feature: Group and Page Posts on Homepage Feed
