import { Profile } from '../../types/profile';
import { config } from '@/config';

const API_URL = config.apiUrl;
const TOKEN_KEY = 'cryptogoals_auth_token';

export const getProfile = async (): Promise<Profile> => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 404) {
    throw new Error('Profile not found');
  }
  
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  
  const data = await response.json();
  return data.profile; // Note: The backend sends { profile: { ... } }
};

export const updateProfile = async (data: {
  username?: string;
  email?: string;
  bio?: string;
  avatar?: string;
}): Promise<Profile> => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update profile');
  }

  const responseData = await response.json();
  return responseData.profile;
};

export const linkWallet = async (address: string, signature: string): Promise<Profile> => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/users/link-wallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ address, signature })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to link wallet');
  }

  return response.json();
}; 