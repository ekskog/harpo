const pool = require('../config/database');

class DatabaseService {
  /**
   * Utility to check DB health
   */
  async checkConnection() {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query('SELECT 1');
      return { success: true, message: 'Database connection successful' };
    } catch (error) {
      console.error('Database connection error:', error);
      return { success: false, message: 'Database connection failed', error: error.message };
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * FETCH: All Collections
   */
  async getAllCollections() {
    let conn;
    try {
      conn = await pool.getConnection();
      // MariaDB returns rows directly
      const rows = await conn.query('SELECT * FROM collections ORDER BY created_at DESC');
      return rows;
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * FETCH: Single Collection by ID
   */
  async getCollectionById(id) {
    let conn;
    try {
      conn = await pool.getConnection();
      const [row] = await conn.query('SELECT * FROM collections WHERE id = ?', [id]);
      return row || null;
    } catch (error) {
      console.error('Error in getCollectionById:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * FETCH: Single Song by ID
   */
  async getSongById(id) {
    let conn;
    try {
      conn = await pool.getConnection();
      const [row] = await conn.query('SELECT * FROM songs WHERE id = ?', [id]);
      return row || null;
    } catch (error) {
      console.error('Error in getSongById:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * CREATE: New Collection
   */
  async createCollection({ name, description, source, bandcamp_url }) {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        'INSERT INTO collections (name, description, source, bandcamp_url) VALUES (?, ?, ?, ?)',
        [name, description, source, bandcamp_url]
      );

      const [row] = await conn.query(
        'SELECT * FROM collections WHERE id = ?',
        [Number(result.insertId)]
      );
      return row;
    } catch (error) {
      console.error('Error in createCollection:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * FETCH: Songs by Collection ID
   */
  async getSongsByCollectionId(collectionId) {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        'SELECT * FROM songs WHERE collection_id = ? ORDER BY track_order ASC', 
        [collectionId]
      );
      return rows;
    } catch (error) {
      console.error('Error fetching songs:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * CREATE: New Song in Collection
   */
  async addSong({ collection_id, title, track_order }) {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        'INSERT INTO songs (collection_id, title, track_order) VALUES (?, ?, ?)',
        [collection_id, title, track_order]
      );

      const [row] = await conn.query(
        'SELECT * FROM songs WHERE id = ?',
        [Number(result.insertId)]
      );
      return row;
    } catch (error) {
      console.error('Error in addSong:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * UPDATE: Collection
   */
  async updateCollection(id, { name, description, source, bandcamp_url }) {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        'UPDATE collections SET name = COALESCE(?, name), description = COALESCE(?, description), source = COALESCE(?, source), bandcamp_url = COALESCE(?, bandcamp_url) WHERE id = ?',
        [name ?? null, description ?? null, source ?? null, bandcamp_url ?? null, id]
      );
      const [row] = await conn.query('SELECT * FROM collections WHERE id = ?', [id]);
      return row || null;
    } catch (error) {
      console.error('Error in updateCollection:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * DELETE: Collection (cascades to songs via FK)
   */
  async deleteCollection(id) {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query('DELETE FROM collections WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error in deleteCollection:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * UPDATE: Song
   */
  async updateSong(id, collectionId, { title, track_order }) {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        'UPDATE songs SET title = COALESCE(?, title), track_order = COALESCE(?, track_order) WHERE id = ? AND collection_id = ?',
        [title ?? null, track_order ?? null, id, collectionId]
      );
      const [row] = await conn.query('SELECT * FROM songs WHERE id = ?', [id]);
      return row || null;
    } catch (error) {
      console.error('Error in updateSong:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * DELETE: Song
   */
  async deleteSong(id, collectionId) {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query('DELETE FROM songs WHERE id = ? AND collection_id = ?', [id, collectionId]);
    } catch (error) {
      console.error('Error in deleteSong:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  async closePool() {
    try {
      await pool.end();
      console.log('Database pool closed');
    } catch (error) {
      console.error('Error closing database pool:', error);
    }
  }
}

module.exports = new DatabaseService();