# Question Lifecycle with Closure & Moderation

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER POSTS QUESTION                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  COMMUNITY INTERACTION                          │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│  │ Upvotes  │    │Downvotes │    │ Comments │                 │
│  │  (+1)    │    │  (-1)    │    │ & Edits  │                 │
│  └──────────┘    └──────────┘    └──────────┘                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┼────────────┐
                 │            │            │
                 ▼            ▼            ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│  SCORE ≥ 0       │ │ SCORE < 0    │ │ FLAGGED CONTENT  │
│  (Good)          │ │ (Poor)       │ │ (Spam/Outdated)  │
└──────────────────┘ └──────────────┘ └──────────────────┘
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│ • Normal flow    │ │ Score ≤ -5?  │ │ Review Queue     │
│ • Gets answers   │ │              │ │ • 3 votes needed │
│ • May be         │ │  YES    NO   │ │ • Hide/Keep vote │
│   accepted       │ │   ▼      │   │ │                  │
└──────────────────┘ │  AUTO-  │    │ └──────────────────┘
                     │ CLOSE   │    │           │
                     └────┬────┘    │           │
                          │         │           ▼
                          │         │   ┌──────────────────┐
                          │         │   │ 3+ Votes to Hide │
                          │         │   │                  │
                          │         │   │  Content Flagged │
                          │         │   │  (Not Deleted)   │
                          │         │   └──────────────────┘
                          │         │
                          │         ▼
                          │   ┌──────────────────┐
                          │   │ Quality Strikes  │
                          │   │ Accumulate       │
                          │   │ • 0.5 per downvote│
                          │   └──────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    QUESTION CLOSED                              │
│                                                                  │
│  Two Paths to Closure:                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │ A) Community Voting  │  │ B) Automatic         │           │
│  │ • 5 votes (500+ rep) │  │ • Score ≤ -5        │           │
│  │ • 7 close reasons    │  │ • Instant            │           │
│  │ • Gold hammer: 1 vote│  │                      │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                  │
│  Effects:                                                        │
│  ✓ Question marked as closed                                   │
│  ✓ 2.0 quality strikes awarded to author                       │
│  ✓ Notification sent to author                                 │
│  ✓ Close voters earn +2 reputation (if community vote)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              QUALITY STRIKE EVALUATION                          │
│                                                                  │
│  Total Strikes = Downvotes(0.5) + Closed(2.0) + Deleted(3.0)  │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │ 3.0 strikes  → Warning (can still post)          │          │
│  │ 5.0 strikes  → Week ban (7 days)                 │          │
│  │ 8.0 strikes  → Month ban (30 days)               │          │
│  │ 12.0 strikes → Permanent ban                      │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┼────────────┐
                 │                         │
                 ▼                         ▼
┌──────────────────────────┐    ┌──────────────────────┐
│    BAN TRIGGERED         │    │   NO BAN             │
│                          │    │                      │
│ • Can't post questions   │    │ • Can continue       │
│ • Can edit existing      │    │ • Monitor quality    │
│ • Can answer             │    │                      │
│ • Can comment            │    │                      │
└──────────────────────────┘    └──────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  IMPROVEMENT PATH                               │
│                                                                  │
│  Banned User Actions:                                           │
│  1. Edit closed/downvoted questions                            │
│  2. Make them clearer, more detailed                           │
│  3. Questions receive upvotes (score ≥ 2)                      │
│  4. System recalculates strikes                                │
│  5. If strikes < threshold → Ban lifted automatically          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REOPEN PROCESS                               │
│                                                                  │
│  For Closed Questions:                                          │
│  1. Question is edited and improved                            │
│  2. Community votes to reopen (5 votes, 500+ rep)              │
│  3. Question reopened                                          │
│  4. Close quality strike (2.0) removed                         │
│  5. Reopen voters earn +2 reputation                           │
│  6. Total strikes recalculated                                 │
│  7. Ban may be lifted if strikes < threshold                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Example Scenarios

### 🟢 Scenario 1: Good Question
```
Post → +10 upvotes → Accepted answer → ✅ Success
```

### 🟡 Scenario 2: Mediocre Question
```
Post → -2 score → Author edits → +5 upvotes → ✅ Improved
```

### 🟠 Scenario 3: Poor Question - Community Closed
```
Post → Vague content → 5 close votes ("unclear") 
     → Closed (2.0 strikes) → Author edits
     → 5 reopen votes → Reopened (strike removed) → ✅ Recovered
```

### 🔴 Scenario 4: Spam Question - Auto Closed
```
Post → Spam content → -6 downvotes (3.0 strikes)
     → Auto-close at -5 (adds 2.0 = 5.0 total strikes)
     → Week ban triggered → ❌ Banned
```

### ⚫ Scenario 5: Serial Poor Quality
```
Post Q1 → Closed (2.0 strikes)
Post Q2 → Closed (4.0 strikes)
Post Q3 → Closed (6.0 strikes) → Week ban
Post Q4 → Closed (8.0 strikes) → Month ban
Post Q5 → Closed (10.0 strikes)
Post Q6 → Closed (12.0 strikes) → ❌ Permanent ban
```

### 🔵 Scenario 6: Gold Badge Hammer
```
Duplicate question posted
Gold badge holder sees it (has gold in question's tag)
Single vote to close → Instant close → ⚡ Hammer!
```

---

## Key Decision Points

```
Question Posted
    │
    ├─ Has good score? → Continue normally
    │
    ├─ Score ≤ -5? → Auto-close immediately
    │
    ├─ Close votes ≥ 5? → Community close
    │
    ├─ Flagged as spam? → Review queue
    │
    └─ Quality strikes ≥ threshold? → Trigger ban
```

---

## Strike Accumulation Examples

### Example A: Downvote Path
```
10 downvotes × 0.5 = 5.0 strikes → Week ban
```

### Example B: Closure Path
```
3 closed questions × 2.0 = 6.0 strikes → Week ban
```

### Example C: Mixed Path
```
4 downvotes (2.0) + 1 closed (2.0) + 2 downvotes (1.0) 
= 5.0 strikes → Week ban
```

### Example D: Deletion Path
```
4 deleted questions × 3.0 = 12.0 strikes → Permanent ban
```

---

## Reputation Flow

### Close Voters (Successful)
```
Vote to close → Question closed → +2 reputation
(Per voter, max when 5 votes reach consensus)
```

### Reopen Voters (Successful)
```
Vote to reopen → Question reopened → +2 reputation
(Per voter, max when 5 votes reach consensus)
```

### Review Voters (Successful)
```
Flag content → 3 votes consensus → +2 reputation
(Per voter who agreed with consensus)
```

---

## Time-Based Events

### Vote Aging (7 days)
```
Close vote cast → 7 days pass → Vote expires
(Only if question not yet closed)
```

### Ban Duration
```
Week ban: 7 days (unless improved)
Month ban: 30 days (unless improved)
Permanent: Indefinite (unless improved)
```

### Improvement Detection
```
Edit question → Receives upvotes → Score ≥ 2 
→ Strikes recalculated → Ban may lift
```

---

## Status Indicators

### Question States
- 🟢 **Open** - Normal, can receive answers
- 🟡 **Close Votes** - Has 1-4 close votes
- 🔴 **Closed** - Cannot receive new answers
- 🟣 **Flagged** - Has active spam/outdated flag
- ⚫ **Deleted** - Removed (future feature)

### User States
- 🟢 **Good Standing** - < 3.0 strikes
- 🟡 **Warning** - 3.0-4.9 strikes
- 🟠 **Week Ban** - 5.0-7.9 strikes
- 🔴 **Month Ban** - 8.0-11.9 strikes
- ⚫ **Permanent Ban** - 12.0+ strikes

---

**Last Updated**: January 5, 2026  
**System Version**: 1.0 Complete
