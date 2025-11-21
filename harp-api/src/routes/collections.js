const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');

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

module.exports = router;