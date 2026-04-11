import { ref, computed } from 'vue';
const API_BASE = '/api/v1';
const TOKEN_KEY = 'harp_auth_token';
const USER_KEY = 'harp_user';

const token = ref(localStorage.getItem(TOKEN_KEY) || '');
const user = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'));

const isAuthenticated = computed(() => !!token.value && !!user.value);

function setAuth(tokenValue, userData) {
  token.value = tokenValue;
  user.value = userData;
  localStorage.setItem(TOKEN_KEY, tokenValue);
  localStorage.setItem(USER_KEY, JSON.stringify(userData));
}

function clearAuth() {
  token.value = '';
  user.value = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function login(username, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      setAuth(result.data.token, result.data.user);
      return { success: true };
    } else {
      return { success: false, error: result.message || 'Login failed' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function register(username, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      setAuth(result.data.token, result.data.user);
      return { success: true };
    } else {
      return { success: false, error: result.message || 'Registration failed' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function logout() {
  clearAuth();
}

function getAuthHeaders() {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {};
}

export function useAuth() {
  return {
    token: computed(() => token.value),
    user: computed(() => user.value),
    isAuthenticated,
    login,
    register,
    logout,
    getAuthHeaders,
  };
}