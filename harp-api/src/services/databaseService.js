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

  async getCollectionById(collectionId) {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query('SELECT * FROM collections WHERE id = ?', [collectionId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching collection by ID:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  async getSongsByCollectionId(collectionId) {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query('SELECT id, collection_id, title, track_order, created_at FROM songs WHERE collection_id = ? ORDER BY track_order', [collectionId]);
      return rows;
    } catch (error) {
      console.error('Error fetching songs by collection ID:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  async getSongById(songId) {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query('SELECT * FROM songs WHERE id = ?', [songId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching song by ID:', error);
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

  async createCollection(name, description = null, source = null) {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query('INSERT INTO collections (name, description, source, created_at) VALUES (?, ?, ?, NOW())', [name, description, source]);
      return { id: Number(result.insertId), name, description, source };
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  async updateCollection(collectionId, updates) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const fields = [];
      const values = [];
      
      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        fields.push('description = ?');
        values.push(updates.description);
      }
      if (updates.source !== undefined) {
        fields.push('source = ?');
        values.push(updates.source);
      }
      
      if (fields.length === 0) {
        throw new Error('No fields to update');
      }
      
      const query = `UPDATE collections SET ${fields.join(', ')} WHERE id = ?`;
      values.push(collectionId);
      
      const result = await conn.query(query, values);
      
      if (result.affectedRows === 0) {
        return null; // Collection not found
      }
      
      // Return the updated collection
      return await this.getCollectionById(collectionId);
    } catch (error) {
      console.error('Error updating collection:', error);
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

  async updateSong(songId, updates) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const fields = [];
      const values = [];
      
      if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
      }
      if (updates.track_order !== undefined) {
        fields.push('track_order = ?');
        values.push(updates.track_order);
      }
      
      if (fields.length === 0) {
        throw new Error('No fields to update');
      }
      
      const query = `UPDATE songs SET ${fields.join(', ')} WHERE id = ?`;
      values.push(songId);
      
      const result = await conn.query(query, values);
      
      if (result.affectedRows === 0) {
        return null; // Song not found
      }
      
      // Return the updated song
      return await this.getSongById(songId);
    } catch (error) {
      console.error('Error updating song:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  async deleteSong(songId) {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query('DELETE FROM songs WHERE id = ?', [songId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting song:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  async deleteCollection(collectionId) {
    let conn;
    try {
      conn = await pool.getConnection();
      // First delete all songs in the collection
      await conn.query('DELETE FROM songs WHERE collection_id = ?', [collectionId]);
      // Then delete the collection
      const result = await conn.query('DELETE FROM collections WHERE id = ?', [collectionId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = new DatabaseService();