const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const databaseService = require('../services/databaseService');
const { authenticateToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
  console.log('Received request for all collections');
  try {
    const collections = await databaseService.getAllCollections();

    res.status(200).json({
      success: true,
      data: collections,
      count: collections.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collections',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:id/songs', async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);

    if (isNaN(collectionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid collection ID',
        message: 'Collection ID must be a number',
        timestamp: new Date().toISOString()
      });
    }

    const songs = await databaseService.getSongsByCollectionId(collectionId);

    res.status(200).json({
      success: true,
      data: songs,
      count: songs.length,
      collection_id: collectionId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching songs for collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch songs for collection',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /collections/:collectionId/songs/:songId/lyrics - Get song lyrics
router.get('/:collectionId/songs/:songId/lyrics', async (req, res) => {
  console.log('Received request for song lyrics');
  console.log('Request params:', req.params);
  try {
    const collectionId = parseInt(req.params.collectionId);
    const songId = parseInt(req.params.songId);

    if (isNaN(collectionId) || isNaN(songId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid IDs',
        message: 'Collection ID and Song ID must be numbers',
        timestamp: new Date().toISOString()
      });
    }

    // Get song details to find the source and track_order
    const song = await databaseService.getSongById(songId);
    if (!song) {
      return res.status(404).json({
        success: false,
        error: 'Song not found',
        message: 'Song not found',
        timestamp: new Date().toISOString()
      });
    }

    if (song.collection_id !== collectionId) {
      return res.status(400).json({
        success: false,
        error: 'Song not in collection',
        message: 'Song does not belong to the specified collection',
        timestamp: new Date().toISOString()
      });
    }

    // Construct file path: /app/harp/{source}.{track_order}.txt
    const filePath = `/app/harp/${song.source}/${song.track_order}.txt`;
    console.log('SOng details:', song);
    console.log('Constructed lyrics file path:', filePath);

    // Read file synchronously (since lyrics files should be small)
    const fs = require('fs');
    const path = require('path');

    try {
      const fullPath = path.resolve(filePath);
      const lyrics = fs.readFileSync(fullPath, 'utf8');

      res.status(200).json({
        success: true,
        data: {
          lyrics: lyrics,
          song_id: songId,
          title: song.title,
          source: song.source,
          track_order: song.track_order
        },
        timestamp: new Date().toISOString()
      });
    } catch (fileError) {
      console.error('Error reading lyrics file:', fileError);
      res.status(404).json({
        success: false,
        error: 'Lyrics file not found',
        message: `Lyrics file not found at ${filePath}`,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error fetching song lyrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch song lyrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /collections/:collectionId/songs/:songId/lyrics - Fetch song lyrics
router.get('/:collectionId/songs/:songId/lyrics', async (req, res) => {
  try {
    const collectionId = parseInt(req.params.collectionId);
    const songId = parseInt(req.params.songId);

    if (isNaN(collectionId) || isNaN(songId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid IDs',
        message: 'Collection ID and Song ID must be numbers',
        timestamp: new Date().toISOString()
      });
    }

    // Fetch collection and song from database
    const collection = await databaseService.getCollectionById(collectionId);
    const song = await databaseService.getSongById(songId);

    if (!collection) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found',
        message: 'Collection not found',
        timestamp: new Date().toISOString()
      });
    }

    if (!song) {
      return res.status(404).json({
        success: false,
        error: 'Song not found',
        message: 'Song not found',
        timestamp: new Date().toISOString()
      });
    }

    // Verify song belongs to collection
    if (song.collection_id !== collectionId) {
      return res.status(400).json({
        success: false,
        error: 'Song does not belong to collection',
        message: 'Song does not belong to the specified collection',
        timestamp: new Date().toISOString()
      });
    }

    // Convert collection name and song title to lowercase (removing spaces)
    const collectionName = collection.name.toLowerCase().replace(/\s+/g, '');
    const songName = song.title.toLowerCase().replace(/\s+/g, '');

    // Construct file path
    const lyricsPath = path.join('/harp', collectionName, `${songName}.txt`);
    console.log('Constructed lyrics file path:', lyricsPath);

    try {
      // Read lyrics file
      const lyrics = await fs.readFile(lyricsPath, 'utf-8');

      res.status(200).json({
        success: true,
        data: {
          lyrics: lyrics,
          collection_id: collectionId,
          collection_name: collection.name,
          song_id: songId,
          song_title: song.title
        },
        timestamp: new Date().toISOString()
      });
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          error: 'Lyrics file not found',
          message: `Lyrics file not found at ${lyricsPath}`,
          timestamp: new Date().toISOString()
        });
      }
      throw fileError;
    }
  } catch (error) {
    console.error('Error fetching song lyrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch song lyrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /collections/:collectionId/songs/:songId/lyrics - Save song lyrics
router.post('/:collectionId/songs/:songId/lyrics', authenticateToken, async (req, res) => {
  try {
    const collectionId = parseInt(req.params.collectionId);
    const songId = parseInt(req.params.songId);
    const { lyrics } = req.body;

    if (isNaN(collectionId) || isNaN(songId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid IDs',
        message: 'Collection ID and Song ID must be numbers',
        timestamp: new Date().toISOString()
      });
    }

    if (!lyrics || typeof lyrics !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid lyrics',
        message: 'Lyrics must be provided as a string',
        timestamp: new Date().toISOString()
      });
    }

    // Get song details to find the source and track_order
    const song = await databaseService.getSongById(songId);
    
    if (!song) {
      return res.status(404).json({
        success: false,
        error: 'Song not found',
        message: 'Song not found',
        timestamp: new Date().toISOString()
      });
    }

    // Verify song belongs to collection
    if (song.collection_id !== collectionId) {
      return res.status(400).json({
        success: false,
        error: 'Song does not belong to collection',
        message: 'Song does not belong to the specified collection',
        timestamp: new Date().toISOString()
      });
    }

    // Construct directory and file path: /harp/{source}/{track_order}.txt
    const lyricsDir = path.join('/app/harp', song.source);
    const lyricsPath = path.join(lyricsDir, `${song.track_order}.txt`);
    
    console.log('Saving lyrics to path:', lyricsPath);

    // Ensure directory exists
    await fs.mkdir(lyricsDir, { recursive: true });

    // Write lyrics to file
    await fs.writeFile(lyricsPath, lyrics, 'utf-8');

    res.status(200).json({
      success: true,
      message: 'Lyrics saved successfully',
      data: {
        collection_id: collectionId,
        song_id: songId,
        song_title: song.title,
        source: song.source,
        track_order: song.track_order,
        lyrics_path: lyricsPath
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving song lyrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save song lyrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Protected routes - require authentication
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, source } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Missing collection name',
        message: 'Collection name is required',
        timestamp: new Date().toISOString()
      });
    }
    if (!source) {  // <-- Validate source
      return res.status(400).json({
        success: false,
        error: 'Missing source',
        message: 'Source is required',
        timestamp: new Date().toISOString()
      });
    }
    const newCollection = await databaseService.createCollection(name, description, source);

    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      data: newCollection,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create collection',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/:id/songs', authenticateToken, async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    const { title, trackOrder } = req.body;

    if (isNaN(collectionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid collection ID',
        message: 'Collection ID must be a number',
        timestamp: new Date().toISOString()
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Missing song title',
        message: 'Title is required',
        timestamp: new Date().toISOString()
      });
    }

    const newSong = await databaseService.createSong(collectionId, title, null, null, trackOrder);

    res.status(201).json({
      success: true,
      message: 'Song added successfully',
      data: newSong,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating song:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add song',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE /collections/:collectionId/songs/:songId - Delete a song
router.delete('/:collectionId/songs/:songId', authenticateToken, async (req, res) => {
  try {
    const collectionId = parseInt(req.params.collectionId);
    const songId = parseInt(req.params.songId);

    if (isNaN(collectionId) || isNaN(songId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid IDs',
        message: 'Collection ID and Song ID must be numbers',
        timestamp: new Date().toISOString()
      });
    }

    // Note: In a real app, you'd verify the song belongs to the collection
    // For now, we'll just delete by song ID
    const deleted = await databaseService.deleteSong(songId);

    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Song deleted successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Song not found',
        message: 'Song not found or already deleted',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete song',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE /collections/:id - Delete a collection and all its songs
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);

    if (isNaN(collectionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid collection ID',
        message: 'Collection ID must be a number',
        timestamp: new Date().toISOString()
      });
    }

    const deleted = await databaseService.deleteCollection(collectionId);

    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Collection deleted successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Collection not found',
        message: 'Collection not found or already deleted',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete collection',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;