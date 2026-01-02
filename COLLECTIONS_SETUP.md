# Collections System - Quick Setup Guide

## What You Get

A complete Pinterest-style collections feature where users can:
- ��� Create named collections ("My Ella Trip", "Best Beaches")
- 📝 Add questions to collections
- 🌍 Make collections public and share them
- ✏️ Edit and manage their collections

## 1-Minute Setup

### Step 1: Run Database Migration

```bash
# Connect to MySQL
mysql -u your_user -p your_database

# Run the migration
source database/create-collections-tables.sql
```

This creates:
- `collections` table
- `collection_items` table
- All necessary indexes

### Step 2: Test It!

```bash
# Start your dev server
npm run dev

# 1. Login to your account
# 2. Go to /profile
# 3. Click "Collections" tab
# 4. Click "Create Your First Collection"
# 5. Name it "Test Collection"
# 6. Visit any question
# 7. Click "Add to Collection" button
# 8. Select your test collection
# 9. Go back to /profile → Collections
# 10. Click your collection to see the question!
```

### Step 3: Deploy

```bash
# Run migration on production database
# Then deploy your code normally
git add .
git commit -m "Add collections feature"
git push
```

## How Users Will Use It

### Create Collections

**From Profile:**
1. Go to Profile → Collections tab
2. Click "+ New Collection"
3. Enter name → Collection created!

**From Question:**
1. Click "Add to Collection" on any question
2. Type new collection name
3. Click "+ Create"

### Add Questions

1. Visit any question page
2. Click purple "Add to Collection" button
3. Either:
   - Create new collection
   - Select existing collection
4. Done!

### Share Collections

1. Open a collection
2. Click edit icon (pencil)
3. Check "Make this collection public"
4. Click copy icon to get shareable link
5. Share with anyone!

### View Shared Collections

- Anyone with the link can view public collections
- Non-logged-in users see "Sign Up" CTA

## File Structure

```
database/
  └── create-collections-tables.sql      # Migration

app/api/collections/
  ├── route.ts                          # List, create
  ├── [id]/route.ts                     # Get, update, delete
  ├── [id]/items/route.ts               # Add/remove items
  └── public/[slug]/route.ts            # Public view

app/collections/
  ├── [id]/page.tsx                     # Collection detail
  └── public/[slug]/page.tsx            # Public collection view

components/
  └── AddToCollection.tsx               # Add to collection modal

app/profile/page.tsx                    # Collections tab added
app/questions/[id]/page.tsx             # Add to collection button added
```

## Features

### Collection Management
- ✅ Create with custom name
- ✅ Add optional description
- ✅ Make public or private
- ✅ Edit name/description/visibility
- ✅ Delete collection
- ✅ Auto-generated unique slugs

### Adding Questions
- ✅ Modal interface
- ✅ Create collection on-the-fly
- ✅ Select from existing collections
- ✅ Prevents duplicates
- ✅ Shows item counts

### Viewing Collections
- ✅ Grid layout in profile
- ✅ Detailed collection page
- ✅ Question cards with metadata
- ✅ Remove items (owner only)
- ✅ Edit/delete buttons (owner only)

### Sharing
- ✅ One-click copy share URL
- ✅ Beautiful public view page
- ✅ Creator attribution
- ✅ Sign-up CTA for visitors

## API Endpoints

```typescript
// List user's collections
GET /api/collections

// Create collection
POST /api/collections
{ name: string, description?: string, is_public?: boolean }

// Get collection
GET /api/collections/[id]

// Update collection
PATCH /api/collections/[id]
{ name?: string, description?: string, is_public?: boolean }

// Delete collection
DELETE /api/collections/[id]

// Add question to collection
POST /api/collections/[id]/items
{ question_id: number, note?: string }

// Remove question from collection
DELETE /api/collections/[id]/items
{ question_id: number }

// Get public collection
GET /api/collections/public/[slug]?username=[username]
```

## Security

- ✅ Authentication required for all write operations
- ✅ Only owners can edit/delete collections
- ✅ Private collections hidden from non-owners
- ✅ Public collections viewable by anyone
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection (sanitized inputs)

## Mobile Support

- ✅ Responsive layouts
- ✅ Touch-friendly buttons
- ✅ Modal scrolling
- ✅ Grid adapts to screen size
- ✅ Horizontal tab scrolling

## Error Handling

- ✅ 401: Not authenticated
- ✅ 403: Access denied (not owner)
- ✅ 404: Collection not found
- ✅ 400: Validation errors (empty name, duplicate question)
- ✅ User-friendly error messages

## Performance

- ✅ Indexed database queries
- ✅ Single query for collection + items
- ✅ Lazy loading (only fetches when needed)
- ✅ Optimistic UI updates
- ✅ Cascading deletes (efficient cleanup)

## Troubleshooting

### "Collection not found" error
- Check if collection ID is correct
- Verify user is authenticated
- Check if collection is private and user is not owner

### Can't add question to collection
- Ensure question exists
- Check if already in collection (shows error)
- Verify user is authenticated

### Share link doesn't work
- Ensure collection is set to public
- Share URL format: `/collections/public/{slug}?username={username}`
- Check slug and username are correct

## Next Steps

Optional enhancements:
1. Add collection cover images
2. Implement drag-and-drop reordering
3. Add bulk add/remove operations
4. Create collection discovery page
5. Add collection search
6. Track collection view stats

## Support

See full documentation: `COLLECTIONS_SYSTEM_SUMMARY.md`

---

**Status**: ✅ Production Ready
**Setup Time**: < 5 minutes
**Difficulty**: Easy

Enjoy organizing questions! 📚✨
