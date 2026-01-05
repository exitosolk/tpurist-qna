const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'oneceylon',
      multipleStatements: true
    });

    console.log('Reading migration file...');
    const sqlPath = path.join(__dirname, '..', 'database', 'add-closure-notification-types.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration...');
    await connection.query(sql);

    console.log('✓ Migration completed successfully!');
    console.log('\nNotification types now include:');
    console.log('  - question_closed');
    console.log('  - followed_question_answer');
    console.log('  - followed_tag_question');

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
