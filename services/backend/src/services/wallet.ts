import { ethers } from 'ethers';
import { WalletNetwork } from '@prisma/client';

const EVM_NETWORKS: WalletNetwork[] = [
  WalletNetwork.ERC20,
  WalletNetwork.ARBITRUM,
  WalletNetwork.OPTIMISM,
  WalletNetwork.POLYGON,
  WalletNetwork.BSC,
  WalletNetwork.METIS
];

export interface GeneratedWallet {
  privateKey: string;
  publicKey: string;
}

export const isNetworkSupported = (network: WalletNetwork): boolean => {
  return Object.values(WalletNetwork).includes(network);
};

export const isEVMNetwork = (network: WalletNetwork): boolean => {
  return EVM_NETWORKS.includes(network);
};

export const generateWallet = (network: WalletNetwork): GeneratedWallet => {
  if (!isNetworkSupported(network)) {
    throw new Error('Unsupported network type');
  }

  if (isEVMNetwork(network)) {
    return generateEVMWallet();
  } else if (network === WalletNetwork.SOLANA) {
    throw new Error('Solana wallet generation not implemented yet');
  } else if (network === WalletNetwork.BITCOIN) {
    throw new Error('Bitcoin wallet generation not implemented yet');
  } else if (network === WalletNetwork.TRC20) {
    throw new Error('TRC20 wallet generation not implemented yet');
  } else {
    throw new Error('Unsupported network type');
  }
};

const generateEVMWallet = (): GeneratedWallet => {
  const wallet = ethers.Wallet.createRandom();
  return {
    privateKey: wallet.privateKey,
    publicKey: wallet.address  // Store the actual address instead of malformed public key
  };
}; 