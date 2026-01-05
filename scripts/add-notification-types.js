const mysql = require('mysql2/promise');

async function addNotificationTypes() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'oneceylon'
    });

    console.log('Adding notification types to ENUM...');
    await connection.query(`
      ALTER TABLE notifications 
      MODIFY COLUMN type ENUM(
        'answer', 
        'question_upvote', 
        'question_downvote', 
        'answer_upvote', 
        'answer_downvote', 
        'comment', 
        'accepted_answer',
        'badge',
        'question_closed',
        'followed_question_answer',
        'followed_tag_question'
      ) NOT NULL
    `);

    console.log('✅ Successfully added notification types!');
    console.log('   - question_closed');
    console.log('   - followed_question_answer');
    console.log('   - followed_tag_question');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_DATA_TOO_LONG') {
      console.error('   This might mean the ENUM already has these values or there are existing incompatible values');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addNotificationTypes();
