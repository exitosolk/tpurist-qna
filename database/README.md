# OneCeylon Database Migrations

## Run these SQL scripts on your MySQL database

### 1. Add slug column to questions (if not already added)
```bash
mysql -u oneceylon_user -p oneceylon < database/add-slug-column.sql
```

Or manually:
```sql
ALTER TABLE questions ADD COLUMN slug VARCHAR(255) UNIQUE AFTER title;
CREATE INDEX idx_questions_slug ON questions(slug);
```

### 2. Create comments table
```bash
mysql -u oneceylon_user -p oneceylon < database/create-comments-table.sql
```

Or manually:
```sql
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  commentable_type ENUM('question', 'answer') NOT NULL,
  commentable_id INT NOT NULL,
  user_id INT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_commentable (commentable_type, commentable_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Verify migrations

```sql
-- Check if columns exist
SHOW COLUMNS FROM questions LIKE 'slug';

-- Check if comments table exists
SHOW TABLES LIKE 'comments';

-- Check comments table structure
DESCRIBE comments;
```
