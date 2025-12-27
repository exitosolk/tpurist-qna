# Email Verification Requirements

## Overview
Users must verify their email address before they can:
- Post questions
- Post answers
- Vote (upvote or downvote) on questions and answers

This ensures platform quality and reduces spam while encouraging users to complete their profile setup.

## Implementation Details

### Backend API Protection

All three critical endpoints now check for email verification:

#### 1. POST /api/questions (Create Question)
```typescript
// Checks email_verified column
if (!userResult.rows[0].email_verified) {
  return NextResponse.json(
    { 
      error: "Please verify your email address before posting questions",
      verification_required: true 
    },
    { status: 403 }
  );
}
```

#### 2. POST /api/questions/[id]/answers (Post Answer)
```typescript
// Checks email_verified column
if (!userResult.rows[0].email_verified) {
  return NextResponse.json(
    { 
      error: "Please verify your email address before posting answers",
      verification_required: true 
    },
    { status: 403 }
  );
}
```

#### 3. POST /api/votes (Vote on Content)
```typescript
// Checks email_verified column
if (!userResult.rows[0].email_verified) {
  return NextResponse.json(
    { 
      error: "Please verify your email address before voting",
      verification_required: true 
    },
    { status: 403 }
  );
}
```

### Frontend User Experience

#### Error Handling
All three actions now detect the `verification_required` flag and show user-friendly messages:

**Questions** (`app/questions/ask/page.tsx`):
```typescript
if (data.verification_required) {
  setError("Please verify your email address before posting questions. Check your inbox for the verification link, or request a new one from your profile settings.");
}
```

**Answers** (`app/questions/[id]/page.tsx`):
```typescript
if (data.verification_required) {
  alert("Please verify your email address before posting answers. Check your inbox for the verification link, or request a new one from your profile settings.");
}
```

**Votes** (`app/questions/[id]/page.tsx`):
```typescript
if (data.verification_required) {
  alert("Please verify your email address before voting. Check your inbox for the verification link, or request a new one from your profile settings.");
}
```

#### Proactive Verification Banners

**Profile Page** (`app/profile/page.tsx`):
- Shows prominent yellow banner if email not verified
- Displays: "Verify your email to unlock all features and earn **10 reputation points**!"
- Includes "Send Verification Email" button
- Already implemented

**Ask Question Page** (`app/questions/ask/page.tsx`):
- Shows blue informational banner if email not verified
- Displays: "📧 Verify your email to post questions"
- Links to profile page to resend verification
- Mentions 10 reputation point reward
- Just added

### User Flow

1. **New user signs up** → Account created, verification email sent
2. **User tries to post/vote** → Blocked with friendly message
3. **User sees banner** → Encouraged to verify with clear benefits (10 points, full access)
4. **User clicks verification link** → Email verified, 10 points awarded (one-time only)
5. **User can now post/vote** → Full platform access unlocked

### Benefits

✅ **Platform Quality**: Reduces spam and fake accounts  
✅ **User Engagement**: Encourages profile completion  
✅ **Gamification**: 10 reputation points reward for verification  
✅ **User-Friendly**: Clear messages guide users to verify  
✅ **Consistent**: All write operations protected uniformly

### Technical Notes

- All API endpoints return HTTP 403 with `verification_required: true` flag
- Frontend detects this flag and shows targeted messages
- Email verification status checked via `email_verified` column in users table
- One-time 10 point bonus tracked via `email_verification_bonus_awarded` flag
- Verification banners appear proactively on profile and ask question pages

### Next Steps (Optional Enhancements)

- Add verification banner to question detail page (for answers)
- Show locked icons on vote buttons with tooltip if not verified
- Add verification progress indicator on first login
- Track verification completion rate in analytics
- A/B test different messaging strategies

## Files Modified

### Backend
- `app/api/questions/route.ts` - Added email verification check
- `app/api/questions/[id]/answers/route.ts` - Added email verification check
- `app/api/votes/route.ts` - Added email verification check

### Frontend
- `app/questions/ask/page.tsx` - Added verification banner and error handling
- `app/questions/[id]/page.tsx` - Added error handling for answers and votes
- `app/profile/page.tsx` - Already has verification banner (no changes needed)

## Testing Checklist

- [ ] Create account without verifying email
- [ ] Try to post question → Should see error message
- [ ] Try to post answer → Should see error message
- [ ] Try to vote → Should see error message
- [ ] See banner on Ask Question page
- [ ] See banner on Profile page
- [ ] Click "Send Verification Email" button
- [ ] Verify email via link
- [ ] Confirm 10 points awarded (only once)
- [ ] Try posting/voting again → Should work now
- [ ] Change email → Should require re-verification
