import { WalletNetwork } from '../types/goals';

export const ALL_NETWORKS: WalletNetwork[] = [
  WalletNetwork.ERC20,
  WalletNetwork.ARBITRUM,
  WalletNetwork.OPTIMISM,
  WalletNetwork.POLYGON,
  WalletNetwork.BSC,
  WalletNetwork.METIS
];

export const getSupportedNetworks = (): WalletNetwork[] => {
  const isMetisHackathon = import.meta.env.VITE_IS_METIS_HACKATHON === 'true';
  
  // Debug logging
  console.log('🔧 Network Filter Debug:');
  console.log('  - VITE_IS_METIS_HACKATHON:', import.meta.env.VITE_IS_METIS_HACKATHON);
  console.log('  - isMetisHackathon:', isMetisHackathon);
  console.log('  - Available networks:', isMetisHackathon ? ['METIS'] : ALL_NETWORKS.map(n => n));
  
  return isMetisHackathon ? [WalletNetwork.METIS] : ALL_NETWORKS;
};

export const isMetisHackathonMode = (): boolean => {
  return import.meta.env.VITE_IS_METIS_HACKATHON === 'true';
}; 