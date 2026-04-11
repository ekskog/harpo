# Harp API Documentation

This document provides a comprehensive overview of the **Harp API**, including its architecture, global configurations, and detailed endpoint specifications.

---

## 🚀 General Information

* **Base URL:** `/api/v1`
* **Default Port:** `3000`
* **Content-Type:** `application/json`
* **Authentication:** Currently supports CORS with credentials enabled for cross-origin requests.

---

## 🛠️ Global Middleware & Configuration

* **JSON Parsing:** The server is configured to parse JSON request bodies.
* **Logging:** All `POST`, `PUT`, and `PATCH` requests log the raw body and `Content-Type` to the console for debugging purposes.
* **Graceful Shutdown:** The server handles `SIGTERM` and `SIGINT` signals to close the database connection pool before exiting.
* **Static Assets:** Files (covers, lyrics, song images) are served from an NFS mount located at `/app/nfs`.

---

## 📂 API Endpoints

### 🏥 Health Check
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Returns the status of the API and its internal services. |

---

### 🎨 Collections
Manage the primary music collections.

#### 1. List All Collections
* **Endpoint:** `GET /collections`
* **Response:** A list of all available collections.

#### 2. Create Collection
* **Endpoint:** `POST /collections`
* **Body:**
    ```json
    {
      "name": "Collection Name",
      "source": "nfs_directory_path",
      "description": "Optional text",
      "bandcamp_url": "Optional URL"
    }
    ```
* **Requirement:** `name` and `source` are mandatory.

#### 3. Update Collection
* **Endpoint:** `PATCH /collections/:id`
* **Description:** Partially updates an existing collection.

#### 4. Delete Collection
* **Endpoint:** `DELETE /collections/:id`
* **Description:** Removes a collection from the database.

#### 5. Get Collection Cover
* **Endpoint:** `GET /collections/:id/cover`
* **Description:** Streams the cover image from the NFS directory associated with the collection's `source`.

---

### 🎵 Songs
Manage tracks within a specific collection.

#### 1. List Songs in Collection
* **Endpoint:** `GET /collections/:id/songs`
* **Response:** Array of songs ordered by `track_order`.

#### 2. Add Song to Collection
* **Endpoint:** `POST /collections/:id/songs`
* **Body:**
    ```json
    {
      "title": "Song Title",
      "track_order": 1
    }
    ```
* **Note:** Supports both `track_order` and `trackOrder` in the request body.

#### 3. Update Song
* **Endpoint:** `PATCH /collections/:id/songs/:songId`
* **Description:** Updates song title or track order.

#### 4. Delete Song
* **Endpoint:** `DELETE /collections/:id/songs/:songId`

#### 5. Get Song Image
* **Endpoint:** `GET /collections/:id/songs/:songId/image`
* **Description:** Fetches a track-specific image named `{track_order}_image.{ext}` from the NFS storage.

---

### 📝 Lyrics
Lyrics are stored as flat `.txt` files on the NFS mount.

#### 1. Get Lyrics
* **Endpoint:** `GET /collections/:id/songs/:songId/lyrics`
* **Mechanism:** Searches for a file named `{track_order}.txt` within the collection's source directory.
* **Response:** ```json
    {
      "success": true,
      "data": { "lyrics": "...content of file..." }
    }
    ```

---

## ⚠️ Current Limitations (Read-Only NFS)
The following endpoints are implemented but currently **disabled** (returning `501 Not Implemented`) until write permissions are enabled for the NFS mount:
* `POST /collections/:id/cover`
* `POST /collections/:id/songs/:songId/image`
* `POST /collections/:id/songs/:songId/lyrics`
* `PATCH /collections/:id/songs/:songId/lyrics`

---

## 📋 Error Responses
The API uses standard HTTP status codes:
* `200/201`: Success
* `400`: Validation Error (e.g., missing mandatory fields)
* `404`: Resource Not Found (e.g., invalid ID or missing file)
* `422`: Unprocessable Entity (e.g., missing track order for lyrics lookup)
* `500`: Internal Server Error (usually Database or File System issues)