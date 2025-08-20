// Ensure we use the correct API URL in production
const getApiUrl = () => {
  // In production, prioritize the production API
  if (typeof window !== 'undefined') {
    // Client-side
    return process.env.NEXT_PUBLIC_API_URL || 'https://myodyssey.me/api';
  }
  // Server-side
  return process.env.NEXT_PUBLIC_API_URL || 'https://myodyssey.me/api';
};

export const API_URL = getApiUrl(); 