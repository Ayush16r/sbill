import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';

// Determine the backend API URL dynamically so that local emulators/physical devices
// can connect without hardcoding an IP address that might change.
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      return `http://${hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
  }

  // Constants.expoConfig?.hostUri is defined in Expo Go and contains the local packager host (e.g. 192.168.1.150:8081)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api`;
  }

  // Fallback to local machine IP if hostUri is unavailable (e.g. built/standalone app)
  return 'http://10.160.81.40:5000/api';
};

const BASE_URL = getBaseUrl();
console.log(`[API] Resolved base URL: ${BASE_URL}`);

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from authStore to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept responses to handle standard API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = 'Network error. Please check your internet connection.';
    
    if (error.response) {
      // Server responded with non-2xx status code
      errorMessage = error.response.data?.error || `Error: ${error.response.status}`;
      
      // If unauthorized (401/403) token expired, automatically log out
      if (error.response.status === 401 || error.response.status === 403) {
        useAuthStore.getState().logout();
      }
    }
    
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
