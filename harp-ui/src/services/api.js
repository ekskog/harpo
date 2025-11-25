// API service for making HTTP requests
// This handles all API calls with consistent error handling

const API_BASE = '/api'

class ApiService {
  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl
  }

  /**
   * Make a GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options
    })
  }

  /**
   * Make a POST request
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    })
  }

  /**
   * Make a PUT request
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    })
  }

  /**
   * Make a DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    })
  }

  /**
   * Core request method
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, options)
      const contentType = response.headers.get('content-type') || ''
      
      // Handle different response types
      let data
      if (contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        // Extract error message from response
        const errorMessage = typeof data === 'object' && data.message 
          ? data.message 
          : typeof data === 'string' 
            ? data 
            : `Request failed with status ${response.status}`
        
        throw new Error(errorMessage)
      }

      return data
    } catch (error) {
      // Re-throw with more context
      throw new Error(`API Error: ${error.message}`)
    }
  }
}

// Create and export a singleton instance
export const api = new ApiService()

// Export specific API endpoints for better organization
export const collectionsApi = {
  getAll: () => api.get('/collections'),
  
  getById: (id) => api.get(`/collections/${id}`),
  
  create: (collectionData, authHeaders) =>
    api.post('/collections', collectionData, { headers: authHeaders }),
  
  getSongs: (collectionId) => api.get(`/collections/${collectionId}/songs`),
  
  createSong: (collectionId, songData, authHeaders) => 
    api.post(`/collections/${collectionId}/songs`, songData, { headers: authHeaders }),
  
  deleteSong: (collectionId, songId, authHeaders) => 
    api.delete(`/collections/${collectionId}/songs/${songId}`, { headers: authHeaders }),
  
  getLyrics: (collectionId, songId) => 
    api.get(`/collections/${collectionId}/songs/${songId}/lyrics`),
  
  saveLyrics: (collectionId, songId, lyrics, authHeaders) => 
    api.post(`/collections/${collectionId}/songs/${songId}/lyrics`, { lyrics }, { headers: authHeaders })
}

// Auth API endpoints
export const authApi = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  
  register: (username, password) =>
    api.post('/auth/register', { username, password })
}

// Health/Debug API endpoints
export const healthApi = {
  check: () => api.get('/health'),
  
  debugHeaders: () => api.get('/debug/headers')
}