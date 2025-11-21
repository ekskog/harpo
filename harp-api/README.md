# Harp API

Express.js API server with MariaDB database and JWT authentication.

## Features

- Health check endpoint
- Collections and songs management
- JWT-based authentication
- CORS enabled
- Docker containerization
- Kubernetes deployment ready

## API Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "string"
    },
    "token": "jwt-token-here"
  }
}
```

#### POST /auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "string"
    },
    "token": "jwt-token-here"
  }
}
```

#### GET /auth/verify
Verify JWT token validity.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

### Collections

#### GET /collections
Get all collections (public).

#### GET /collections/:id/songs
Get songs for a specific collection (public).

#### POST /collections
Create a new collection (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string (optional)"
}
```

#### DELETE /collections/:id
Delete a collection and all its songs (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Collection deleted successfully"
}
```

#### DELETE /collections/:collectionId/songs/:songId
Delete a song from a collection (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Song deleted successfully"
}
```

### Health

#### GET /health
Check API and database health.

## Environment Variables

- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 3306)
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)
- `PORT`: Server port (default: 3000)

## Database Setup

Run the initialization script to create the users table:

```sql
-- Run database/init-users.sql
```

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm start
```

## Docker

```bash
docker build -t harp-api .
docker run -p 3000:3000 harp-api
```