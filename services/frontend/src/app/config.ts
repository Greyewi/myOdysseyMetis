import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, polygon, arbitrum, optimism, solana } from '@reown/appkit/networks';
import { injected } from "wagmi/connectors"

import {
  createAppKit,
  useAppKit,
  useAppKitAccount,
  useAppKitEvents,
  useAppKitNetwork,
  useAppKitState,
  useAppKitTheme,
  useDisconnect,
  useWalletInfo
} from '@reown/appkit/react'

export const projectId = 'a303940cd3fa457c213d481ab5957125'

// Define Metis Hyperion testnet network
export const metisHyperion = {
  id: 133717,
  name: 'Metis Hyperion Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Metis',
    symbol: 'tMETIS',
  },
  rpcUrls: {
    default: { http: ['https://hyperion-testnet.metisdevops.link'] },
    public: { http: ['https://hyperion-testnet.metisdevops.link'] },
  },
  blockExplorers: {
    default: {
      name: 'Metis Hyperion Explorer',
      url: 'https://hyperion-testnet-explorer.metisdevops.link',
    },
  },
  testnet: true,
}

// Setup wagmi adapter with proper storage and wallet connection settings
export const wagmiAdapter = new WagmiAdapter({
  networks: [
    // mainnet, polygon, arbitrum, optimism, 
    metisHyperion
  ],
  projectId,
  connectors: [injected()],
  ssr: true,
  pendingTransactionsFilter: {
    enable: true
  }
})

createAppKit({
  adapters: [wagmiAdapter],
  defaultNetwork: mainnet,
  defaultAccountTypes: { eip155: "eoa", solana: "eoa", polkadot: "eoa", bip122: "payment" },
  networks: [
    // mainnet, polygon, arbitrum, optimism, 
    metisHyperion
  ],
  debug: true,
  metadata: {
    name: 'My Odyssey',
    description: 'Create a goal, commit real value, and be rewarded when you succeed.',
    url: 'https://app.myodyssey.me',
    icons: ['https://app.myodyssey.me/assets/myodyssey-logo.png']
  },
  projectId,
  themeMode: 'light',
  features: {
    analytics: true
  },
  enableWalletConnect: true
})

export {
  useAppKit,
  useAppKitState,
  useAppKitTheme,
  useAppKitEvents,
  useAppKitAccount,
  useWalletInfo,
  useAppKitNetwork,
  useDisconnect
}