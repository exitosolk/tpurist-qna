// Helper function to convert PostgreSQL placeholders to MySQL
export function convertQuery(query: string, params: any[]): { query: string; params: any[] } {
  let paramIndex = 0;
  const convertedQuery = query.replace(/\$\d+/g, () => {
    paramIndex++;
    return '?';
  });
  return { query: convertedQuery, params };
}
