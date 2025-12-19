const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'tourist_user',
  password: 'your_strong_password',
  database: 'tourist_qna',
  waitForConnections: true,
  connectionLimit: 10,
});

app.get('/api/questions', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM questions');
  res.json(rows);
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
