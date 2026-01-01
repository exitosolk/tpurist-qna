# Follow System - Quick Setup Guide

## Step 1: Run Database Migration

Execute the SQL file to create the new tables:

```bash
# If using MySQL command line
mysql -u your_username -p your_database < database/create-question-tag-follows.sql

# Or run manually in your database tool
```

## Step 2: Verify Tables Created

Check that these tables exist:
- `question_follows`
- `tag_follows`

And verify `notifications` table has new enum values:
- `followed_question_answer`
- `followed_tag_question`

## Step 3: Test the Features

### Test Following a Question
1. Open any question page
2. Look for the "Follow" button (purple bell icon)
3. Click it - should change to "Following"
4. Post an answer (use different account)
5. Check notifications - follower should be notified

### Test Following a Tag
1. Go to a tag page (e.g., `/questions/tagged/visa`)
2. Click "Follow" button in header
3. Post a new question with that tag (use different account)
4. Check notifications - follower should be notified

### Test Profile Following Tab
1. Go to your profile
2. Click "Following" tab
3. Should see:
   - All questions you're following
   - All tags you're following
   - Stats for each

## Step 4: Verify Differences from Bookmarks

**Bookmarks (existing):**
- Use the Bookmark button (bookmark icon)
- Save to "Bookmarks" tab in profile
- No notifications

**Follow (new):**
- Use the Follow button (bell icon)
- Save to "Following" tab in profile
- **Get notifications** for new activity

Both can be used together on the same question!

## API Endpoints Available

```javascript
// Follow/unfollow a question
POST /api/follows/questions
{ questionId: 123 }

// Get followed questions
GET /api/follows/questions

// Follow/unfollow a tag
POST /api/follows/tags
{ tagName: "visa" }

// Get followed tags
GET /api/follows/tags

// Check follow status
GET /api/follows/check?questionIds=1,2,3&tagNames=visa,train
```

## Troubleshooting

### No notifications appearing?
- Check the `notifications` table for new enum types
- Verify `question_follows` table has entries
- Check console for API errors

### Follow button not showing?
- Clear browser cache
- Check browser console for errors
- Verify session is active

### Database errors?
- Make sure all migrations are run
- Check column types match schema
- Verify foreign key constraints exist

## Success Indicators

✅ Can follow/unfollow questions
✅ Can follow/unfollow tags  
✅ Notifications sent when new answers posted
✅ Notifications sent when questions with followed tags created
✅ Profile shows Following tab with data
✅ Follow and Bookmark work independently

## Next Steps

Consider implementing:
1. Email notifications for followed content
2. Notification preferences (daily digest vs real-time)
3. "Suggested follows" based on user activity
4. Ability to export/import followed items
