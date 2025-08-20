export const config = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || process.env.VITE_BACKEND_URL || 'http://localhost:3333',
  apiUrl: `${import.meta.env.VITE_BACKEND_URL || process.env.VITE_BACKEND_URL || 'http://localhost:3333'}${import.meta.env.PROD ? '/api' : ''}`,
} as const; 