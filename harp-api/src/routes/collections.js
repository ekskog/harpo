const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const databaseService = require('../services/databaseService');
const debug = require('debug')('harp:collections');
const { requireAuth } = require('../middleware/auth');

const NFS_ROOT = '/app/nfs';

// Router-level debug middleware: logs incoming request meta and body
router.use((req, res, next) => {
  debug(`[${req.method} ${req.originalUrl}] headers=%o`, { host: req.headers.host, 'content-type': req.headers['content-type'] });
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') debug('body=%o', req.body);
  next();
});

// ---------------------------------------------------------------------------
// Helper: find the image file for a given directory (any extension)
// ---------------------------------------------------------------------------
function findImageFile(dir, baseName) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => f.startsWith(baseName + '.'));
  return files.length ? path.join(dir, files[0]) : null;
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

// GET /collections
router.get('/', async (req, res) => {
  const dbTimer = `db:getAllCollections:${Date.now()}`;
  console.time(dbTimer);
  try {
    const collections = await databaseService.getAllCollections();
    res.status(200).json({ success: true, data: collections, count: collections.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch collections', message: error.message });
  } finally {
    console.timeEnd(dbTimer);
  }
});

// GET /collections/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid ID', 
        message: 'Collection ID must be a number' 
      });
    }

    const dbTimer = `db:getCollectionById:${id}:${Date.now()}`;
    console.time(dbTimer);
    const collection = await databaseService.getCollectionById(id);
    console.timeEnd(dbTimer);

    if (!collection) {
      return res.status(404).json({ 
        success: false, 
        error: 'Not Found', 
        message: 'Collection not found' 
      });
    }
    const songs = await databaseService.getSongsByCollectionId(id);
    res.status(200).json({ success: true, data: { ...collection, songs } });
  } catch (error) {
    console.error('Error fetching collection by ID:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database Error', 
      message: error.message 
    });
  }
});

// POST /collections
router.post('/', requireAuth, async (req, res) => {
  const dbTimer = `db:createCollection:${Date.now()}`;
  console.time(dbTimer);
  try {
    const { name, description, source, bandcamp_url } = req.body;
    if (!name || !source) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: 'Name and Source are required.' });
    }
    const newCollection = await databaseService.createCollection({
      name, description: description || null, source, bandcamp_url: bandcamp_url || null
    });
    res.status(201).json({ success: true, data: newCollection });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database Error', message: error.message });
  } finally {
    console.timeEnd(dbTimer);
  }
});

// PATCH /collections/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid ID' });

    const { name, description, source, bandcamp_url } = req.body;
    const dbTimer = `db:updateCollection:${id}:${Date.now()}`;
    console.time(dbTimer);
    const updated = await databaseService.updateCollection(id, { name, description, source, bandcamp_url });
    if (!updated) return res.status(404).json({ success: false, error: 'Collection not found' });

    res.status(200).json({ success: true, data: updated });
    console.timeEnd(dbTimer);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update collection', message: error.message });
  }
});

// DELETE /collections/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid ID' });

    const dbTimer = `db:deleteCollection:${id}:${Date.now()}`;
    console.time(dbTimer);
    await databaseService.deleteCollection(id);
    res.status(200).json({ success: true, message: 'Collection deleted' });
    console.timeEnd(dbTimer);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete collection', message: error.message });
  }
});

// GET /collections/:id/cover
router.get('/:id/cover', async (req, res) => {
  try {
    const collection = await databaseService.getCollectionById(parseInt(req.params.id));
    if (!collection) return res.status(404).json({ success: false, error: 'Collection not found' });
    const fsTimer = `fs:findImageFile:cover:${Date.now()}`;
    console.time(fsTimer);
    const file = findImageFile(path.join(NFS_ROOT, collection.source), 'cover');
    console.timeEnd(fsTimer);
    if (!file) return res.status(404).json({ success: false, error: 'No cover image' });
    res.sendFile(file);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch cover', message: error.message });
  }
});

// POST /collections/:id/cover — disabled until NFS writes are enabled
router.post('/:id/cover', requireAuth, (req, res) => {
  res.status(501).json({ success: false, error: 'Not implemented', message: 'Cover upload is not enabled' });
});

// ---------------------------------------------------------------------------
// Songs
// ---------------------------------------------------------------------------

// GET /collections/:id/songs
router.get('/:id/songs', async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    if (isNaN(collectionId)) return res.status(400).json({ success: false, error: 'Invalid ID' });

    const dbTimer = `db:getSongsByCollectionId:${collectionId}:${Date.now()}`;
    console.time(dbTimer);
    const songs = await databaseService.getSongsByCollectionId(collectionId);
    console.timeEnd(dbTimer);
    res.status(200).json({ success: true, data: songs, count: songs.length, collection_id: collectionId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /collections/:id/songs
router.post('/:id/songs', requireAuth, async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    const title = req.body.title;
    // accept both camelCase (frontend) and snake_case
    const track_order = req.body.track_order ?? req.body.trackOrder ?? null;

    if (isNaN(collectionId) || !title) {
      return res.status(400).json({ success: false, message: 'Collection ID and Song Title are required.' });
    }

    const dbTimer = `db:addSong:${collectionId}:${Date.now()}`;
    console.time(dbTimer);
    const newSong = await databaseService.addSong({ collection_id: collectionId, title, track_order });
    console.timeEnd(dbTimer);
    res.status(201).json({ success: true, data: newSong });
  } catch (error) {
    if (error.errno === 1452) {
      return res.status(404).json({ success: false, error: 'Not Found', message: `Collection ${req.params.id} does not exist` });
    }
    res.status(500).json({ success: false, error: 'Failed to add song', message: error.message });
  }
});

// PATCH /collections/:id/songs/:songId
router.patch('/:id/songs/:songId', requireAuth, async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    const songId = parseInt(req.params.songId);
    if (isNaN(collectionId) || isNaN(songId)) return res.status(400).json({ success: false, error: 'Invalid ID' });

    const { title, track_order, trackOrder } = req.body;
    const dbTimer = `db:updateSong:${songId}:${Date.now()}`;
    console.time(dbTimer);
    const updated = await databaseService.updateSong(songId, collectionId, {
      title,
      track_order: track_order ?? trackOrder ?? undefined
    });
    console.timeEnd(dbTimer);
    if (!updated) return res.status(404).json({ success: false, error: 'Song not found' });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update song', message: error.message });
  }
});

// DELETE /collections/:id/songs/:songId
router.delete('/:id/songs/:songId', requireAuth, async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    const songId = parseInt(req.params.songId);
    if (isNaN(collectionId) || isNaN(songId)) return res.status(400).json({ success: false, error: 'Invalid ID' });

    const dbTimer = `db:deleteSong:${songId}:${Date.now()}`;
    console.time(dbTimer);
    await databaseService.deleteSong(songId, collectionId);
    console.timeEnd(dbTimer);
    res.status(200).json({ success: true, message: 'Song deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete song', message: error.message });
  }
});

// GET /collections/:id/songs/:songId/image
router.get('/:id/songs/:songId/image', async (req, res) => {
  try {
    const collection = await databaseService.getCollectionById(parseInt(req.params.id));
    if (!collection) return res.status(404).json({ success: false, error: 'Collection not found' });
    const song = await databaseService.getSongById(parseInt(req.params.songId));
    if (!song) return res.status(404).json({ success: false, error: 'Song not found' });
    // Song images stored as {track_order}_image.{ext} in the collection's NFS dir
    const fsTimer = `fs:findImageFile:songImage:${Date.now()}`;
    console.time(fsTimer);
    const file = findImageFile(path.join(NFS_ROOT, collection.source), `${song.track_order}_image`);
    console.timeEnd(fsTimer);
    if (!file) return res.status(404).json({ success: false, error: 'No image' });
    res.sendFile(file);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch image', message: error.message });
  }
});

// POST /collections/:id/songs/:songId/image — disabled until NFS writes are enabled
router.post('/:id/songs/:songId/image', requireAuth, (req, res) => {
  res.status(501).json({ success: false, error: 'Not implemented', message: 'Song image upload is not enabled' });
});

// ---------------------------------------------------------------------------
// Lyrics — stored as {track_order}.txt on NFS under {collection.source}/
// ---------------------------------------------------------------------------

async function getLyricsFile(collectionId, songId) {
  const collection = await databaseService.getCollectionById(collectionId);
  if (!collection) throw Object.assign(new Error('Collection not found'), { status: 404 });
  const song = await databaseService.getSongById(songId);
  if (!song) throw Object.assign(new Error('Song not found'), { status: 404 });
  if (!song.track_order) throw Object.assign(new Error('Song has no track order — cannot derive lyrics filename'), { status: 422 });
  return path.join(NFS_ROOT, collection.source, `${song.track_order}.txt`);
}

// GET /collections/:id/songs/:songId/lyrics
router.get('/:id/songs/:songId/lyrics', async (req, res) => {
  try {
    const fsTimer = `fs:getLyrics:${Date.now()}`;
    console.time(fsTimer);
    const filePath = await getLyricsFile(parseInt(req.params.id), parseInt(req.params.songId));
    if (!fs.existsSync(filePath)) {
      console.timeEnd(fsTimer);
      return res.status(404).json({ success: false, error: 'No lyrics found' });
    }
    const lyrics = fs.readFileSync(filePath, 'utf8');
    console.timeEnd(fsTimer);
    res.status(200).json({ success: true, data: { lyrics } });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: 'Failed to fetch lyrics', message: error.message });
  }
});

// POST /collections/:id/songs/:songId/lyrics — disabled until NFS writes are enabled
router.post('/:id/songs/:songId/lyrics', requireAuth, (req, res) => {
  res.status(501).json({ success: false, error: 'Not implemented', message: 'Lyrics write is not enabled' });
});

// PATCH /collections/:id/songs/:songId/lyrics — disabled until NFS writes are enabled
router.patch('/:id/songs/:songId/lyrics', requireAuth, (req, res) => {
  res.status(501).json({ success: false, error: 'Not implemented', message: 'Lyrics write is not enabled' });
});

module.exports = router;
