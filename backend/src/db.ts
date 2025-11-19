import mysql from 'mysql2/promise';

const DB_ALLOW_DEFAULTS = (process.env.DB_ALLOW_DEFAULTS || 'false').toLowerCase() === 'true';
const DB_DEBUG = (process.env.DB_DEBUG || 'false').toLowerCase() === 'true';

const DB_HOST = process.env.DB_HOST || (DB_ALLOW_DEFAULTS ? 'ekskog.xyz' : undefined);
const DB_PORT = Number(process.env.DB_PORT || '3306');
const DB_USER = process.env.DB_USER || (DB_ALLOW_DEFAULTS ? 'root' : undefined);
const DB_PASS = process.env.DB_PASS || '';
// By default check for database named 'harp_db' unless overridden
const DB_NAME = process.env.DB_NAME || 'harp_db';

export async function checkDbConnection(timeoutMs = 3000): Promise<boolean> {
  let conn: any | undefined;
  if (!DB_HOST || !DB_USER) {
    if (DB_DEBUG) console.error('DB_HOST or DB_USER not configured and DB_ALLOW_DEFAULTS is false');
    return false;
  }
  try {
    // Connect without specifying a default database so the connection won't fail if DB_NAME doesn't exist
    conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      connectTimeout: timeoutMs
    });

    // Check that the requested database exists
    const checkDb = DB_NAME;
    const [rows]: any = await conn.query(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [checkDb]
    );
    const exists = Array.isArray(rows) && rows.length > 0;
    if (!exists && DB_DEBUG) console.error(`Database '${checkDb}' not found`);
    await conn.end();
    return exists;
  } catch (err) {
    if (DB_DEBUG) console.error('DB connection/check failed:', (err as Error).message);
    return false;
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}
