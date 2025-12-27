-- Add column to track if email verification bonus was already awarded
ALTER TABLE users ADD COLUMN email_verification_bonus_awarded BOOLEAN DEFAULT FALSE;
