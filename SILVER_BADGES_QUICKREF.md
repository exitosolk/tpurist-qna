# Silver Tier Badges - Quick Reference

## When to Call Each Function

### 🔍 Price Police
```typescript
import { checkPricePoliceBadge } from '@/lib/badges';

// ✅ Call when: Review queue item is completed with "outdated" status
// 📍 Location: app/api/review/vote/route.ts

await checkPricePoliceBadge(flaggerId, reviewQueueId);
```

---

### 🗺️ Local Guide
```typescript
import { checkLocalGuideBadge } from '@/lib/badges';

// ✅ Call when: Answer is created or receives upvote
// 📍 Location: app/api/answers/route.ts, vote endpoints

// Get question's location tags
const locationTag = 'Kandy'; // or Colombo, Galle, etc.
await checkLocalGuideBadge(userId, locationTag);
```

---

### 💬 Communicator
```typescript
import { updateCommunicatorProgress } from '@/lib/badges';

// ✅ Call when: Answer is marked as accepted
// 📍 Location: app/api/answers/[id]/accept/route.ts

// For each user who commented on the accepted answer
await updateCommunicatorProgress(commenterId);
```

---

### 🔥 Seasoned Traveler
```typescript
import { updateLoginStreak } from '@/lib/badges';

// ✅ Call when: User loads any authenticated page
// 📍 Location: app/layout.tsx or auth middleware

await updateLoginStreak(userId);
// Note: Built-in duplicate prevention for same-day calls
```

---

## Database Migrations Required

```bash
# 1. Add Silver badges
mysql -u root -p oneceylon < database/add-silver-tier-badges.sql

# 2. Add streak tracking
mysql -u root -p oneceylon < database/add-login-streak-tracking.sql
```

---

## Return Type
All functions return `BadgeAwardResult`:
```typescript
{
  awarded: boolean;          // true if badge was just awarded
  badgeId?: number;          // ID of the badge
  badgeName?: string;        // Name of the badge
  notificationMessage?: string; // Message sent to user
}
```

---

## Location Tags Reference
```typescript
const LOCATION_TAGS = [
  'Kandy', 'Colombo', 'Galle', 'Ella', 
  'Nuwara Eliya', 'Sigiriya', 'Arugam Bay',
  'Mirissa', 'Trincomalee', 'Anuradhapura'
];
```

---

## Full Badge List

| Tier | Badge | Icon | Requirement |
|------|-------|------|-------------|
| **Bronze** | Ayubowan | 🙏 | Email verified + profile complete |
| **Bronze** | First Landing | 🛬 | First question with score ≥1 |
| **Bronze** | Rice & Curry | 🍛 | Cast 10 upvotes |
| **Bronze** | Snapshot | 📸 | Image post with 5 upvotes |
| **Silver** | Price Police | 👮 | Successful outdated price flag |
| **Silver** | Local Guide | 🗺️ | 10 answers in location tag, 20+ score |
| **Silver** | Communicator | 💬 | 5 comment conversations → accepted |
| **Silver** | Seasoned Traveler | 🔥 | 30-day login streak |

---

## Testing Checklist

- [ ] Run both SQL migrations
- [ ] Import and call `checkPricePoliceBadge` in review vote handler
- [ ] Import and call `checkLocalGuideBadge` in answer handlers
- [ ] Import and call `updateCommunicatorProgress` in accept answer handler
- [ ] Import and call `updateLoginStreak` in auth flow
- [ ] Test each badge award scenario
- [ ] Verify notifications are created
- [ ] Check badge display in user profile
