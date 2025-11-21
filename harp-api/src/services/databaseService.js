const pool = require('../config/database');

class DatabaseService {
  async checkConnection() {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query('SELECT 1');
      return { 
        success: true, 
        message: 'Database connection successful' 
      };
    } catch (error) {
      console.error('Database connection error:', error);
      return { 
        success: false, 
        message: 'Database connection failed',
        error: error.message 
      };
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

  async getAllCollections() {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query('SELECT * FROM collections');
      return rows;
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  async getSongsByCollectionId(collectionId) {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query('SELECT * FROM songs WHERE collection_id = ? ORDER BY track_order', [collectionId]);
      return rows;
    } catch (error) {
      console.error('Error fetching songs by collection ID:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = new DatabaseService();