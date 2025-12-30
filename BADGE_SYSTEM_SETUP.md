# Badge System Setup Guide

## Overview

The badge system implements a gamification layer to increase user activation and engagement. The Bronze Tier focuses on converting "Passive Lurkers" into "Active Participants" through meaningful milestones.

## Bronze Tier Badges

### 1. 🙏 Ayubowan (The Welcome Badge)
**Purpose**: User Activation - Profile Completion

**Trigger Conditions**:
- User verifies email address AND
- User fills out "Bio" OR "Home Country" field

**Psychology**: Completion bias - users hate seeing incomplete profiles
**Platform Value**: Reduces spam accounts, provides data for personalization

### 2. 🛬 First Landing (The Icebreaker)
**Purpose**: Overcome fear of posting

**Trigger Conditions**:
- User asks their first question AND
- Question receives score >= 1 OR survives 24 hours without deletion

**Psychology**: Fear of rejection - validation through upvotes
**Platform Value**: Content generation with quality filter

### 3. 🍛 Rice & Curry (The Curator)
**Purpose**: Train users to vote

**Trigger Conditions**:
- User casts 10 upvotes on others' questions or answers
- Self-votes don't count

**Psychology**: Altruism and power - their opinion matters
**Platform Value**: Critical voting data for content ranking

### 4. 📸 Snapshot (The Visual)
**Purpose**: Encourage visual content

**Trigger Conditions**:
- User uploads an image in a question or answer AND
- That post receives 5 upvotes

**Psychology**: Vanity - photography skills validation
**Platform Value**: Visual richness without paying for stock photos

## Database Setup

### 1. Run Database Migrations

```bash
# Add home_country field to users table
mysql -u your_user -p your_database < database/add-home-country.sql

# Create badge system tables
mysql -u your_user -p your_database < database/create-badge-system.sql
```

### 2. Verify Tables Created

The following tables should exist:
- `badges` - Badge definitions (4 bronze tier badges pre-populated)
- `user_badges` - User badge awards (many-to-many relationship)
- `badge_progress` - Progress tracking for incremental badges

## Integration Points

### Automatic Badge Checks

The system automatically checks for badge awards at these integration points:

1. **Email Verification** (`/api/verify-email/verify`)
   - Checks Ayubowan badge after email verification

2. **Profile Update** (`/api/profile/update`)
   - Checks Ayubowan badge after bio/home_country update

3. **Voting** (`/api/votes`)
   - Updates Rice & Curry progress for voter
   - Checks First Landing badge for question authors (on first upvote)
   - Checks Snapshot badge for content with images (at 5 upvotes)

### Badge Award Notifications

When a badge is awarded:
1. Record created in `user_badges` table
2. Notification created with type `'badge'`
3. User receives notification with custom message

## API Endpoints

### GET /api/badges
Fetch all badges for current user

**Response**:
```json
{
  "earned": [
    {
      "id": 1,
      "name": "Ayubowan",
      "tier": "bronze",
      "description": "Verified your email and completed your profile.",
      "icon": "🙏",
      "awarded_at": "2025-12-30T10:00:00.000Z"
    }
  ],
  "progress": [
    {
      "id": 3,
      "name": "Rice & Curry",
      "tier": "bronze",
      "description": "Cast 10 upvotes on questions and answers.",
      "icon": "🍛",
      "progress": 7,
      "target": 10
    }
  ],
  "availableBronze": [...]
}
```

## UI Components

### BadgeIcon
Display a single badge with tooltip

```tsx
import BadgeIcon from '@/components/BadgeIcon';

<BadgeIcon
  name="Ayubowan"
  icon="🙏"
  tier="bronze"
  description="Verified your email and completed your profile"
  size="md" // 'sm' | 'md' | 'lg'
  showTooltip={true}
/>
```

### BadgeList
Display all badges with progress bars

```tsx
import BadgeList from '@/components/BadgeList';

// Full view with progress
<BadgeList showProgress={true} compact={false} />

// Compact view for profile sidebar
<BadgeList showProgress={false} compact={true} />
```

## Profile Page Integration

The badges are displayed in a dedicated "Badges" tab on the profile page:
- Shows earned badges with award dates
- Shows in-progress badges with progress bars
- Shows all available bronze tier badges if none earned yet

## Testing Checklist

### Ayubowan Badge
- [ ] Create new account
- [ ] Verify email
- [ ] Add bio or home country
- [ ] Check notification and badge tab

### First Landing Badge
- [ ] Ask first question
- [ ] Get 1 upvote OR wait 24 hours
- [ ] Check badge awarded

### Rice & Curry Badge
- [ ] Cast 10 upvotes on others' content
- [ ] Track progress in badge tab
- [ ] Verify badge awarded at 10

### Snapshot Badge
- [ ] Post question/answer with image
- [ ] Get 5 upvotes
- [ ] Check badge awarded

## Badge Notification Messages

All notification messages follow the Bronze Tier spec:

1. **Ayubowan**: "Ayubowan! 🙏 You've officially arrived. Your profile is set up and ready for the island."
2. **First Landing**: "Touchdown! 🛬 You just asked your first question. The community is looking into it now!"
3. **Rice & Curry**: "A staple of the island! 🍛 Thanks for helping us sort the good advice from the bad. Keep voting!"
4. **Snapshot**: "Picture Perfect! 📸 5 people loved your shot. You're making the island look good."

## Future Enhancements

### Silver Tier (Coming Soon)
- Focus on **Habit Formation**
- Daily/weekly engagement streaks
- Quality contribution milestones

### Gold Tier (Coming Soon)
- Focus on **Community Leadership**
- Expertise recognition
- Moderation and mentorship

## Troubleshooting

### Badge not awarded?
1. Check database tables exist
2. Verify all trigger conditions met
3. Check for existing badge in `user_badges`
4. Review server logs for errors

### Progress not updating?
1. Verify `badge_progress` table exists
2. Check vote counts in database
3. Ensure self-votes excluded from Rice & Curry count

### Notifications not appearing?
1. Verify `notifications` table has new entries
2. Check notification type is `'badge'`
3. Ensure NotificationDropdown is polling

## Performance Considerations

- Badge checks are async and don't block main operations
- Progress updates use `ON DUPLICATE KEY UPDATE` for efficiency
- Badge queries are indexed by user_id
- No performance impact on voting/posting endpoints
