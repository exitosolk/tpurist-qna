-- Check user 25's quality strikes and ban status

SELECT 'Quality Strikes' as section;
SELECT 
  id,
  user_id,
  question_id,
  strike_type,
  strike_value,
  is_active,
  created_at
FROM question_quality_strikes 
WHERE user_id = 25 
ORDER BY created_at DESC;

SELECT 'Total Active Strikes' as section;
SELECT 
  user_id,
  SUM(strike_value) as total_strikes,
  COUNT(*) as strike_count
FROM question_quality_strikes 
WHERE user_id = 25 AND is_active = TRUE
GROUP BY user_id;

SELECT 'Quality Bans' as section;
SELECT * FROM user_quality_bans 
WHERE user_id = 25 
ORDER BY banned_at DESC;

SELECT 'Ban Thresholds (Config)' as section;
SELECT * FROM quality_ban_config 
WHERE config_key LIKE 'threshold%' OR config_key LIKE '%duration%';
