import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';

const router = Router();

// Pull DB config from environment (same as db.ts)
const DB_HOST = process.env.DB_HOST || 'ekskog.xyz';
const DB_PORT = Number(process.env.DB_PORT || '3306');
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'harp_db';

// GET /collections
router.get('/', async (_req: Request, res: Response) => {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
    });

    const [rows] = await conn.query('SELECT id, name FROM collections ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  } finally {
    if (conn) await conn.end();
  }
});

export default router;