import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Helper to convert PostgreSQL placeholders ($1, $2) to MySQL (?)
function convertQuery(text: string): string {
  return text.replace(/\$\d+/g, () => '?');
}

export const query = async (text: string, params?: any[]) => {
  try {
    const convertedQuery = convertQuery(text);
    
    // Use query() instead of execute() to avoid prepared statement issues with subqueries
    const [result] = await pool.query(convertedQuery, params || []);
    
    // Handle different result types
    if (Array.isArray(result)) {
      return { rows: result };
    } else {
      // For INSERT/UPDATE/DELETE, return result with insertId, affectedRows, etc.
      return { rows: result, insertId: (result as any).insertId };
    }
  } catch (error: any) {
    console.error('Database query error:', {
      query: text,
      params,
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    throw error;
  }
};

export default pool;
