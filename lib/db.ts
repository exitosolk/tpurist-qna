import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export const query = async (text: string, params?: any[]) => {
  const [rows] = await pool.execute(text, params);
  return { rows };
};

export default pool;
