import axios from 'axios';
import { config } from '@/config';

export const getNonce = async (address: string) => {
  const response = await axios.get(`${config.apiUrl}/users/nonce?address=`+ address);
  return response.data.nonce;
};

export const verifySignature = async (address: string, signature: string, nonce: string) => {
  const response = await axios.post(`${config.apiUrl}/users/verify`, {
    address,
    signature,
    nonce
  });
  return response.data;
}; 