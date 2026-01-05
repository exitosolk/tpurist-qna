-- Add Silver Tier Badges
-- Level 2: The Silver Tier (The "Yaka" Level)
-- Target: Expats, frequent travelers, and enthusiastic locals

INSERT IGNORE INTO badges (name, tier, description, icon, notification_message) VALUES
(
    'Price Police',
    'silver',
    'Flagged content as "Outdated Price" which was confirmed and hidden by the community. Keeping travel info accurate!',
    '👮',
    'On Patrol! 👮 Your price flag was confirmed. You''re keeping OneCeylon''s info fresh and accurate!'
),
(
    'Local Guide',
    'silver',
    'Answered 10 questions within a specific location tag with a combined score of 20+. True local expertise!',
    '🗺️',
    'Local Legend! 🗺️ You''ve become the go-to expert for this area. Keep sharing your knowledge!'
),
(
    'Communicator',
    'silver',
    'Had 5 conversations in comments that led to an accepted answer. Your engagement makes a difference!',
    '💬',
    'Master of Dialogue! 💬 Your conversations help find the best answers. Keep the discussion flowing!'
),
(
    'Seasoned Traveler',
    'silver',
    'Visited the site 30 days in a row. You''re truly committed to the community!',
    '🔥',
    'Streak Master! 🔥 30 days straight! You''re officially part of the OneCeylon family.'
);
