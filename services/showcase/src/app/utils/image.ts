// Helper function to format image URL
export function formatImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // If URL is already complete, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  // Remove any leading 'uploads/' from the URL to avoid duplication
  const cleanUrl = url.replace(/^uploads\//, '');
  
  // Use environment variable, falling back to production API instead of localhost
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://myodyssey.me/api';
  const baseUrl = apiUrl.replace('/api', '');
  
  return `${baseUrl}/uploads/${cleanUrl}`;
} 