import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';

const router = Router();

// Pull DB config from environment (same as db.ts)
const DB_HOST = process.env.DB_HOST || 'ekskog.xyz';
const DB_PORT = Number(process.env.DB_PORT || '3306');
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'harp_db';

// Helper to create DB connection
async function getConnection() {
  return await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  });
}

// GET /collections - List all collections
router.get('/', async (_req: Request, res: Response) => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.query('SELECT id, name FROM collections ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  } finally {
    if (conn) await conn.end();
  }
});

// GET /collections/:id - Get collection with songs in one call
router.get('/:id', async (req: Request, res: Response) => {
  console.log('GET /collections/:id');
  console.log(req.params.id);
  
  let conn;
  try {
    const collectionId = parseInt(req.params.id);
    
    if (isNaN(collectionId)) {
      res.status(400).json({ error: 'Invalid collection ID' });
      return;
    }

    conn = await getConnection();

    // Fetch collection details
    const [collectionRows] = await conn.query(
      'SELECT id, name, description, created_at FROM collections WHERE id = ?',
      [collectionId]
    );
    
    if (!Array.isArray(collectionRows) || collectionRows.length === 0) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }

    // Fetch songs for this collection
    const [songRows] = await conn.query(
      'SELECT id, title, track_order FROM songs WHERE collection_id = ? ORDER BY track_order ASC',
      [collectionId]
    );

    const collection = collectionRows[0];
    res.json({
      ...collection,
      songs: songRows
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  } finally {
    if (conn) await conn.end();
  }
});

export default router;