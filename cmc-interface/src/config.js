// Simple configuration without proxy logic
const isDevelopment = import.meta.env.DEV;

// For authentication backend
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001'
  : 'http://10.50.0.57:3001';

export const API_URL = `${API_BASE_URL}/api`;

console.log('🔧 API Config:', { 
  API_BASE_URL, 
  API_URL, 
  isDevelopment,
  mode: import.meta.env.MODE 
});