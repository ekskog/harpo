// API service for making HTTP requests
// This handles all API calls with consistent error handling

const API_BASE = '/api/v1'

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
   * Make a POST request (supports both JSON and FormData)
   */
  async post(endpoint, data, options = {}) {
    console.log('[ApiService.post] Endpoint:', endpoint)
    console.log('[ApiService.post] Data type:', typeof data)
    
    const { headers = {}, ...restOptions } = options
    
    // Check if data is FormData
    const isFormData = data instanceof FormData
    
    if (!isFormData) {
      console.log('[ApiService.post] Data:', data)
      console.log('[ApiService.post] Stringified body:', JSON.stringify(data))
    }
    
    return this.request(endpoint, {
      method: 'POST',
      ...restOptions,
      headers: {
        // Don't set Content-Type for FormData, let browser set it with boundary
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...headers
      },
      body: isFormData ? data : JSON.stringify(data)
    })
  }

  /**
   * Make a PUT request
   */
  async put(endpoint, data, options = {}) {
    const { headers = {}, ...restOptions } = options
    return this.request(endpoint, {
      method: 'PUT',
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data)
    })
  }

  /**
   * Make a PATCH request
   */
  async patch(endpoint, data, options = {}) {
    const { headers = {}, ...restOptions } = options
    return this.request(endpoint, {
      method: 'PATCH',
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data)
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
    
    // DEBUG: Log the full request
    console.log('API Request:', {
      url,
      method: options.method,
      headers: options.headers,
      body: options.body
    })
    
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

      console.log('API Response:', { status: response.status, data })

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
      // If it's already an Error object, just re-throw it
      if (error instanceof Error) {
        throw error
      }
      // Otherwise wrap it
      throw new Error(`API Error: ${error}`)
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
    api.post('/collections', collectionData, authHeaders ? { headers: authHeaders } : {}),
  
  update: (id, collectionData, authHeaders) =>
    api.patch(`/collections/${id}`, collectionData, authHeaders ? { headers: authHeaders } : {}),
  
  uploadCover: (id, formData, authHeaders) =>
    api.post(`/collections/${id}/cover`, formData, authHeaders ? { headers: authHeaders } : {}),
  
  getSongs: (collectionId) => api.get(`/collections/${collectionId}/songs`),
  
  createSong: (collectionId, songData, authHeaders) => 
    api.post(`/collections/${collectionId}/songs`, songData, authHeaders ? { headers: authHeaders } : {}),
  
  updateSong: (collectionId, songId, songData, authHeaders) => 
    api.patch(`/collections/${collectionId}/songs/${songId}`, songData, authHeaders ? { headers: authHeaders } : {}),
  
  deleteSong: (collectionId, songId, authHeaders) => 
    api.delete(`/collections/${collectionId}/songs/${songId}`, authHeaders ? { headers: authHeaders } : {}),
  
  getLyrics: (collectionId, songId) => 
    api.get(`/collections/${collectionId}/songs/${songId}/lyrics`),
  
  saveLyrics: (collectionId, songId, lyrics, authHeaders) => 
    api.post(`/collections/${collectionId}/songs/${songId}/lyrics`, { lyrics }, authHeaders ? { headers: authHeaders } : {}),
  
  updateLyrics: (collectionId, songId, lyrics, authHeaders) => 
    api.patch(`/collections/${collectionId}/songs/${songId}/lyrics`, { lyrics }, authHeaders ? { headers: authHeaders } : {}),
  
  uploadSongImage: (collectionId, songId, formData, authHeaders) =>
    api.post(`/collections/${collectionId}/songs/${songId}/image`, formData, authHeaders ? { headers: authHeaders } : {})
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