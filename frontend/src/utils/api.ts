import axios from 'axios';

// API configuration utility
export const getApiBaseUrl = (): string => {
  // If an explicit API URL is configured via environment variable, prefer it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/+$/, '');
  }

  // Browser environment checks
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Local development against separate port 5000 server
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api/v1';
    }

    // On Vercel, production, preview, or custom domain:
    // Route API calls to the same origin where the app is deployed
    return `${window.location.origin}/api/v1`;
  }

  return 'http://localhost:5000/api/v1';
};

export const getSocketUrl = (): string => {
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL.replace(/\/+$/, '');
  }
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
  }
  return '';
};

const API_BASE_URL = getApiBaseUrl();

// Centralized Axios instance with credential handling
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header if a token exists in storage
apiClient.interceptors.request.use((config) => {
  try {
    const saved = localStorage.getItem('authState');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    }
  } catch (err) {
    // Ignore storage parsing errors
  }
  return config;
});

// Also configure default axios with credentials for any direct axios calls
axios.defaults.withCredentials = true;

export const api = {
  baseURL: API_BASE_URL,

  // Helper function to get full API URL
  getUrl: (endpoint: string): string => {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_BASE_URL}/${cleanEndpoint}`;
  },

  client: apiClient,
};

export default api;
