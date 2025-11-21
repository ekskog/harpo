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

  async findUserByUsername(username) {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query('SELECT id, username, password_hash, created_at FROM users WHERE username = ?', [username]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  async createUser(username, passwordHash) {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, NOW())', [username, passwordHash]);
      return { id: Number(result.insertId), username };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  async createCollection(name, description = null) {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query('INSERT INTO collections (name, description, created_at) VALUES (?, ?, NOW())', [name, description]);
      return { id: Number(result.insertId), name, description };
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  async createSong(collectionId, title, artist, duration = null, trackOrder = null) {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query('INSERT INTO songs (collection_id, title, track_order, created_at) VALUES (?, ?, ?, NOW())', [collectionId, title, trackOrder]);
      return { id: Number(result.insertId), collectionId, title, trackOrder };
    } catch (error) {
      console.error('Error creating song:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = new DatabaseService();

module.exports = new DatabaseService();