const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');
const { authenticateToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
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

// Protected routes - require authentication
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Missing collection name',
        message: 'Collection name is required',
        timestamp: new Date().toISOString()
      });
    }

    const newCollection = await databaseService.createCollection(name, description);

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

module.exports = router;