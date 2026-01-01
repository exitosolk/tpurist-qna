-- Add email digest preferences to users table
-- Allow users to control how often they receive digest emails about followed content

-- Check if columns exist before adding (MySQL 5.7+ compatible)
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname1 = 'digest_frequency';
SET @columnname2 = 'last_digest_sent_at';

-- Add digest_frequency column if it doesn't exist
SET @query1 = (
  SELECT IF(
    COUNT(*) = 0,
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname1, ' ENUM(''never'', ''daily'', ''weekly'') DEFAULT ''weekly'' AFTER email_verified;'),
    'SELECT ''Column digest_frequency already exists'';'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname1
);

PREPARE stmt1 FROM @query1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- Add last_digest_sent_at column if it doesn't exist
SET @query2 = (
  SELECT IF(
    COUNT(*) = 0,
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname2, ' TIMESTAMP NULL AFTER digest_frequency;'),
    'SELECT ''Column last_digest_sent_at already exists'';'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname2
);

PREPARE stmt2 FROM @query2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Create index for efficient digest sending queries (only if it doesn't exist)
SET @indexname = 'idx_digest_frequency';

SET @query3 = (
  SELECT IF(
    COUNT(*) = 0,
    CONCAT('CREATE INDEX ', @indexname, ' ON ', @tablename, '(digest_frequency, last_digest_sent_at);'),
    'SELECT ''Index idx_digest_frequency already exists'';'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND INDEX_NAME = @indexname
);

PREPARE stmt3 FROM @query3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;
