# Harp API Documentation

This document describes all available API endpoints for the Harp application.

## Base URL

- **Production**: `https://harp-api.ekskog.net`
- **Local Development**: `http://localhost:3000`

---

## Quick Start Example

Here's a complete example workflow using curl commands:

### 1. User logs in

```bash
# Login and save the authentication token
TOKEN=$(curl -s -X POST https://harp-api.ekskog.net/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "lucarv",
    "password": "lucaPWD$ha4p"
  }' | jq -r '.data.token')

echo "Token: $TOKEN"
```

### 2. Creates collection "My Col", with description "dummy desc" and source "mycol"

```bash
# Create collection and save the collection ID
COLLECTION_ID=$(curl -s -X POST https://harp-api.ekskog.net/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My Col",
    "description": "dummy desc",
    "source": "mycol"
  }' | jq -r '.data.id')

echo "Collection ID: $COLLECTION_ID"
```

### 3. Adds song "first song" with track number 1

```bash
# Add song to the collection and save the song ID
SONG_ID=$(curl -s -X POST https://harp-api.ekskog.net/collections/$COLLECTION_ID/songs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "first song",
    "trackOrder": 1
  }' | jq -r '.data.id')

echo "Song ID: $SONG_ID"
```

### 4. Adds lyrics to song "first song"

```bash
# Save lyrics for the song
curl -X POST https://harp-api.ekskog.net/collections/$COLLECTION_ID/songs/$SONG_ID/lyrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "lyrics": "These are the lyrics for first song\nLine 2\nLine 3"
  }'
```

---

## Authentication

Most endpoints require authentication using a JWT token. To authenticate:

1. Register a new user or login to get a token
2. Include the token in the `Authorization` header as: `Bearer <token>`

Example:
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint**: `POST /auth/register`

**Authentication**: Not required

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl -X POST https://harp-api.ekskog.net/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "securepassword123"
  }'
```

---

### Login

Authenticate and receive a JWT token.

**Endpoint**: `POST /auth/login`

**Authentication**: Not required

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl -X POST https://harp-api.ekskog.net/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "lucarv",
    "password": "lucaPWD$ha4p"
  }'
```

**Save token for later use**:
```bash
TOKEN=$(curl -s -X POST https://harp-api.ekskog.net/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"securepassword123"}' \
  | jq -r '.data.token')

echo "Token saved: $TOKEN"
```

---

### Verify Token

Check if a JWT token is valid.

**Endpoint**: `GET /auth/verify`

**Authentication**: Required (token in Authorization header)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe"
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl -X GET https://harp-api.ekskog.net/auth/verify \
  -H "Authorization: Bearer $TOKEN"
```

---

## Health Check

### Get Health Status

Check API and database health.

**Endpoint**: `GET /health`

**Authentication**: Not required

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "database": {
    "connected": true,
    "message": "Database connection successful"
  }
}
```

**cURL Example**:
```bash
curl -X GET https://harp-api.ekskog.net/health
```

---

## Collections Endpoints

### Get All Collections

Retrieve a list of all collections.

**Endpoint**: `GET /collections`

**Authentication**: Not required

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Collection Name",
      "description": "Collection description",
      "source": "source_name",
      "created_at": "2024-01-01T12:00:00.000Z"
    }
  ],
  "count": 1,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl -X GET https://harp-api.ekskog.net/collections
```

---

### Create Collection

Create a new collection.

**Endpoint**: `POST /collections`

**Authentication**: Required

**Request Body**:
```json
{
  "name": "string",
  "description": "string (optional)",
  "source": "string"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Collection created successfully",
  "data": {
    "id": 1,
    "name": "Collection Name",
    "description": "Collection description",
    "source": "source_name",
    "created_at": "2024-01-01T12:00:00.000Z"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl -X POST https://harp-api.ekskog.net/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My New Collection",
    "description": "A collection of songs",
    "source": "my_source"
  }'
```

---

### Delete Collection

Delete a collection and all its songs.

**Endpoint**: `DELETE /collections/:id`

**Authentication**: Required

**URL Parameters**:
- `id` (integer): Collection ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Collection deleted successfully",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl -X DELETE https://harp-api.ekskog.net/collections/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Songs Endpoints

### Get Songs by Collection

Retrieve all songs in a specific collection.

**Endpoint**: `GET /collections/:id/songs`

**Authentication**: Not required

**URL Parameters**:
- `id` (integer): Collection ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Song Title",
      "collection_id": 1,
      "source": "source_name",
      "track_order": 1,
      "created_at": "2024-01-01T12:00:00.000Z"
    }
  ],
  "count": 1,
  "collection_id": 1,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl -X GET https://harp-api.ekskog.net/collections/1/songs
```

---

### Create Song

Add a new song to a collection.

**Endpoint**: `POST /collections/:id/songs`

**Authentication**: Required

**URL Parameters**:
- `id` (integer): Collection ID

**Request Body**:
```json
{
  "title": "string",
  "trackOrder": "integer (optional)"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Song added successfully",
  "data": {
    "id": 1,
    "title": "Song Title",
    "collection_id": 1,
    "track_order": 1,
    "created_at": "2024-01-01T12:00:00.000Z"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl -X POST https://harp-api.ekskog.net/collections/1/songs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "My New Song",
    "trackOrder": 1
  }'
```

---

### Delete Song

Delete a song from a collection.

**Endpoint**: `DELETE /collections/:collectionId/songs/:songId`

**Authentication**: Required

**URL Parameters**:
- `collectionId` (integer): Collection ID
- `songId` (integer): Song ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Song deleted successfully",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl -X DELETE https://harp-api.ekskog.net/collections/1/songs/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Lyrics Endpoints

### Get Song Lyrics

Retrieve lyrics for a specific song.

**Endpoint**: `GET /collections/:collectionId/songs/:songId/lyrics`

**Authentication**: Not required

**URL Parameters**:
- `collectionId` (integer): Collection ID
- `songId` (integer): Song ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "lyrics": "Song lyrics content...",
    "song_id": 1,
    "title": "Song Title",
    "source": "source_name",
    "track_order": 1
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl -X GET https://harp-api.ekskog.net/collections/1/songs/1/lyrics
```

---

### Save Song Lyrics

Save or update lyrics for a song.

**Endpoint**: `POST /collections/:collectionId/songs/:songId/lyrics`

**Authentication**: Required

**URL Parameters**:
- `collectionId` (integer): Collection ID
- `songId` (integer): Song ID

**Request Body**:
```json
{
  "lyrics": "string"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Lyrics saved successfully",
  "data": {
    "collection_id": 1,
    "song_id": 1,
    "song_title": "Song Title",
    "source": "source_name",
    "track_order": 1,
    "lyrics_path": "/app/harp/source_name/1.txt"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl -X POST https://harp-api.ekskog.net/collections/1/songs/1/lyrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "lyrics": "Verse 1\nChorus\nVerse 2"
  }'
```

**cURL Example with file**:
```bash
curl -X POST https://harp-api.ekskog.net/collections/1/songs/1/lyrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @- <<EOF
{
  "lyrics": "$(cat lyrics.txt | jq -Rs .)"
}
EOF
```

---

## Error Responses

All endpoints may return error responses in the following format:

**400 Bad Request**:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**401 Unauthorized**:
```json
{
  "success": false,
  "error": "Invalid credentials",
  "message": "Invalid username or password",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": "Resource not found",
  "message": "Resource not found",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Operation failed",
  "message": "Detailed error message",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## Complete Workflow Example

Here's a complete example workflow:

```bash
# 1. Login and save token
TOKEN=$(curl -s -X POST https://harp-api.ekskog.net/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"lucarv","password":"lucaPWD$ha4p"}' \
  | jq -r '.data.token')

# 2. Create a collection
COLLECTION_ID=$(curl -s -X POST https://harp-api.ekskog.net/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My Collection",
    "description": "A test collection",
    "source": "test_source"
  }' | jq -r '.data.id')

echo "Created collection ID: $COLLECTION_ID"

# 3. Add a song to the collection
SONG_ID=$(curl -s -X POST https://harp-api.ekskog.net/collections/$COLLECTION_ID/songs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "My Song",
    "trackOrder": 1
  }' | jq -r '.data.id')

echo "Created song ID: $SONG_ID"

# 4. Save lyrics for the song
curl -X POST https://harp-api.ekskog.net/collections/$COLLECTION_ID/songs/$SONG_ID/lyrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "lyrics": "These are the song lyrics\nLine 2\nLine 3"
  }'

# 5. Retrieve the lyrics
curl -X GET https://harp-api.ekskog.net/collections/$COLLECTION_ID/songs/$SONG_ID/lyrics

# 6. List all songs in the collection
curl -X GET https://harp-api.ekskog.net/collections/$COLLECTION_ID/songs

# 7. List all collections
curl -X GET https://harp-api.ekskog.net/collections
```

---

## Notes

- JWT tokens expire after 24 hours
- All timestamps are in ISO 8601 format (UTC)
- Collection IDs and Song IDs must be integers
- The `source` field is required when creating collections
- Lyrics are stored as plain text files on the server
- Protected endpoints will return 401 Unauthorized if the token is missing or invalid

