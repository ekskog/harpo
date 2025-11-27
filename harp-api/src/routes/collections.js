const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const databaseService = require('../services/databaseService');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory temporarily
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

router.get('/', async (req, res) => {
  console.log('[GET /collections] Operation: Get all collections');
  console.log('[GET /collections] Params:', req.params);
  console.log('[GET /collections] Query:', req.query);
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
  console.log('[GET /collections/:id/songs] Operation: Get songs by collection');
  console.log('[GET /collections/:id/songs] Params:', req.params);
  console.log('[GET /collections/:id/songs] Query:', req.query);
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
  console.log('[GET /collections/:collectionId/songs/:songId/lyrics] Operation: Get song lyrics');
  console.log('[GET /collections/:collectionId/songs/:songId/lyrics] Params:', req.params);
  console.log('[GET /collections/:collectionId/songs/:songId/lyrics] Query:', req.query);
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

    // Get collection and song details
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

    if (song.collection_id !== collectionId) {
      return res.status(400).json({
        success: false,
        error: 'Song not in collection',
        message: 'Song does not belong to the specified collection',
        timestamp: new Date().toISOString()
      });
    }

    // Construct file path: /app/harp/{collection.source}/{song.track_order}.txt
    const filePath = `/app/harp/${collection.source}/${song.track_order}.txt`;
    console.log('Song details:', song);
    console.log('Collection details:', collection);
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
          source: collection.source,
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


// POST /collections/:collectionId/songs/:songId/lyrics - Save song lyrics
router.post('/:collectionId/songs/:songId/lyrics', authenticateToken, async (req, res) => {
  console.log('[POST /collections/:collectionId/songs/:songId/lyrics] Operation: Save song lyrics');
  console.log('[POST /collections/:collectionId/songs/:songId/lyrics] Params:', req.params);
  console.log('[POST /collections/:collectionId/songs/:songId/lyrics] Body:', req.body);
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

    // Get collection and song details
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

    // Construct directory and file path: /harp/{collection.source}/{song.track_order}.txt
    const lyricsDir = path.join('/app/harp', collection.source);
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
        source: collection.source,
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

// PATCH /collections/:collectionId/songs/:songId/lyrics - Update song lyrics
router.patch('/:collectionId/songs/:songId/lyrics', authenticateToken, async (req, res) => {
  console.log('[PATCH /collections/:collectionId/songs/:songId/lyrics] Operation: Update song lyrics');
  console.log('[PATCH /collections/:collectionId/songs/:songId/lyrics] Params:', req.params);
  console.log('[PATCH /collections/:collectionId/songs/:songId/lyrics] Body:', req.body);
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

    // Get collection and song details
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

    // Construct directory and file path: /harp/{collection.source}/{song.track_order}.txt
    const lyricsDir = path.join('/app/harp', collection.source);
    const lyricsPath = path.join(lyricsDir, `${song.track_order}.txt`);
    
    console.log('Updating lyrics at path:', lyricsPath);

    // Check if file exists
    try {
      await fs.access(lyricsPath);
    } catch (fileError) {
      return res.status(404).json({
        success: false,
        error: 'Lyrics file not found',
        message: 'Lyrics file does not exist. Use POST to create new lyrics.',
        timestamp: new Date().toISOString()
      });
    }

    // Ensure directory exists (though it should)
    await fs.mkdir(lyricsDir, { recursive: true });

    // Write lyrics to file (overwrite)
    await fs.writeFile(lyricsPath, lyrics, 'utf-8');

    res.status(200).json({
      success: true,
      message: 'Lyrics updated successfully',
      data: {
        collection_id: collectionId,
        song_id: songId,
        song_title: song.title,
        source: collection.source,
        track_order: song.track_order,
        lyrics_path: lyricsPath
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating song lyrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update song lyrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Protected routes - require authentication
router.post('/', authenticateToken, async (req, res) => {
  console.log('[POST /collections] Operation: Create collection');
  console.log('[POST /collections] Params:', req.params);
  console.log('[POST /collections] Body:', req.body);
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

router.patch('/:id', authenticateToken, async (req, res) => {
  console.log('[PATCH /collections/:id] Operation: Update collection');
  console.log('[PATCH /collections/:id] Params:', req.params);
  console.log('[PATCH /collections/:id] Body:', req.body);
  try {
    const collectionId = parseInt(req.params.id);
    const { name, description, source } = req.body;

    if (isNaN(collectionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid collection ID',
        message: 'Collection ID must be a number',
        timestamp: new Date().toISOString()
      });
    }

    // Check if at least one field is provided
    if (name === undefined && description === undefined && source === undefined) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
        message: 'At least one field (name, description, or source) must be provided',
        timestamp: new Date().toISOString()
      });
    }

    // Validate name if provided
    if (name !== undefined && (!name || typeof name !== 'string' || name.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid collection name',
        message: 'Collection name must be a non-empty string',
        timestamp: new Date().toISOString()
      });
    }

    // Validate source if provided
    if (source !== undefined && (!source || typeof source !== 'string' || source.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid source',
        message: 'Source must be a non-empty string',
        timestamp: new Date().toISOString()
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (source !== undefined) updates.source = source.trim();

    const updatedCollection = await databaseService.updateCollection(collectionId, updates);

    if (!updatedCollection) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found',
        message: 'Collection not found',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Collection updated successfully',
      data: updatedCollection,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update collection',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/:id/songs', authenticateToken, async (req, res) => {
  console.log('[POST /collections/:id/songs] Operation: Create song');
  console.log('[POST /collections/:id/songs] Params:', req.params);
  console.log('[POST /collections/:id/songs] Body:', req.body);
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

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing song title',
        message: 'Title is required and cannot be empty',
        timestamp: new Date().toISOString()
      });
    }

    const trimmedTitle = title.trim();
    const newSong = await databaseService.createSong(collectionId, trimmedTitle, null, null, trackOrder);

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

router.patch('/:collectionId/songs/:songId', authenticateToken, async (req, res) => {
  console.log('[PATCH /collections/:collectionId/songs/:songId] Operation: Update song');
  console.log('[PATCH /collections/:collectionId/songs/:songId] Params:', req.params);
  console.log('[PATCH /collections/:collectionId/songs/:songId] Body:', req.body);
  try {
    const collectionId = parseInt(req.params.collectionId);
    const songId = parseInt(req.params.songId);
    const { title, trackOrder } = req.body;

    if (isNaN(collectionId) || isNaN(songId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid IDs',
        message: 'Collection ID and Song ID must be numbers',
        timestamp: new Date().toISOString()
      });
    }

    // Check if at least one field is provided
    if (title === undefined && trackOrder === undefined) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
        message: 'At least one field (title or trackOrder) must be provided',
        timestamp: new Date().toISOString()
      });
    }

    // Validate title if provided
    if (title !== undefined && (!title || typeof title !== 'string' || title.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid song title',
        message: 'Title must be a non-empty string',
        timestamp: new Date().toISOString()
      });
    }

    // Validate trackOrder if provided
    if (trackOrder !== undefined && (isNaN(trackOrder) || trackOrder < 1)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid track order',
        message: 'Track order must be a positive number',
        timestamp: new Date().toISOString()
      });
    }

    // Get the song to verify it exists and belongs to the collection
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
        error: 'Song does not belong to collection',
        message: 'Song does not belong to the specified collection',
        timestamp: new Date().toISOString()
      });
    }

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (trackOrder !== undefined) updates.track_order = trackOrder;

    const updatedSong = await databaseService.updateSong(songId, updates);

    res.status(200).json({
      success: true,
      message: 'Song updated successfully',
      data: updatedSong,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating song:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update song',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE /collections/:collectionId/songs/:songId - Delete a song
router.delete('/:collectionId/songs/:songId', authenticateToken, async (req, res) => {
  console.log('[DELETE /collections/:collectionId/songs/:songId] Operation: Delete song');
  console.log('[DELETE /collections/:collectionId/songs/:songId] Params:', req.params);
  console.log('[DELETE /collections/:collectionId/songs/:songId] Query:', req.query);
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
  console.log('[DELETE /collections/:id] Operation: Delete collection');
  console.log('[DELETE /collections/:id] Params:', req.params);
  console.log('[DELETE /collections/:id] Query:', req.query);
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

// GET /collections/:id/cover - Get collection cover image
router.get('/:id/cover', async (req, res) => {
  console.log('[GET /collections/:id/cover] Operation: Get collection cover');
  console.log('[GET /collections/:id/cover] Params:', req.params);
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

    // Get collection details
    const collection = await databaseService.getCollectionById(collectionId);
    if (!collection) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found',
        message: 'Collection not found',
        timestamp: new Date().toISOString()
      });
    }

    if (!collection.source) {
      return res.status(404).json({
        success: false,
        error: 'Collection has no source',
        message: 'Collection cover not available',
        timestamp: new Date().toISOString()
      });
    }

    // Construct cover image path: /app/harp/{source}/folder.jpg
    const coverPath = path.join('/app/harp', collection.source, 'folder.jpg');
    console.log('Cover image path:', coverPath);

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(coverPath)) {
      return res.status(404).json({
        success: false,
        error: 'Cover image not found',
        message: `Cover image not found at ${coverPath}`,
        timestamp: new Date().toISOString()
      });
    }

    // Serve the image file
    try {
      const imageBuffer = fs.readFileSync(coverPath);
      res.setHeader('Content-Type', 'image/jpeg'); // Assuming JPEG, could detect from file
      res.send(imageBuffer);
    } catch (fileError) {
      console.error('Error reading image file:', fileError);
      res.status(500).json({
        success: false,
        error: 'Failed to read image file',
        message: fileError.message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error fetching collection cover:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collection cover',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /collections/:id/cover - Upload collection cover image
router.post('/:id/cover', authenticateToken, upload.single('cover'), async (req, res) => {
  console.log('[POST /collections/:id/cover] Operation: Upload collection cover');
  console.log('[POST /collections/:id/cover] Params:', req.params);
  console.log('[POST /collections/:id/cover] File:', req.file ? { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : 'No file');

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

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please upload an image file',
        timestamp: new Date().toISOString()
      });
    }

    // Get collection details
    const collection = await databaseService.getCollectionById(collectionId);
    if (!collection) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found',
        message: 'Collection not found',
        timestamp: new Date().toISOString()
      });
    }

    if (!collection.source) {
      return res.status(400).json({
        success: false,
        error: 'Collection has no source',
        message: 'Cannot upload cover for collection without source',
        timestamp: new Date().toISOString()
      });
    }

    // Construct directory and file path: /app/harp/{source}/folder.jpg
    const coverDir = path.join('/app/harp', collection.source);
    const coverPath = path.join(coverDir, 'folder.jpg');

    console.log('Uploading cover to path:', coverPath);

    // Ensure directory exists
    await fs.mkdir(coverDir, { recursive: true });

    // Write the uploaded file buffer to folder.jpg
    await fs.writeFile(coverPath, req.file.buffer);

    res.status(200).json({
      success: true,
      message: 'Cover image uploaded successfully',
      data: {
        collection_id: collectionId,
        collection_name: collection.name,
        source: collection.source,
        cover_path: coverPath,
        original_filename: req.file.originalname,
        file_size: req.file.size,
        mimetype: req.file.mimetype
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error uploading collection cover:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload collection cover',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;