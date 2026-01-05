-- Check if closure system is set up
SELECT 
  'close_reasons table' as check_name,
  COUNT(*) as count 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'oneceylon' AND TABLE_NAME = 'close_reasons'
UNION ALL
SELECT 
  'is_closed column' as check_name,
  COUNT(*) as count
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'oneceylon' 
  AND TABLE_NAME = 'questions' 
  AND COLUMN_NAME = 'is_closed'
UNION ALL
SELECT 
  'auto_closure_log table' as check_name,
  COUNT(*) as count
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'oneceylon' AND TABLE_NAME = 'auto_closure_log';

-- Check question 27 status
SELECT id, title, score, is_closed, closed_at, close_reason, auto_closed
FROM questions 
WHERE id = 27;

-- Check auto_closure_log
SELECT * FROM auto_closure_log WHERE question_id = 27;
