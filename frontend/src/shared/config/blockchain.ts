export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_RPC = import.meta.env.VITE_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
export const BASE_SEPOLIA_EXPLORER_URL = 'https://sepolia.basescan.org';

export const BASE_SEPOLIA = {
  id: BASE_SEPOLIA_CHAIN_ID,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [BASE_SEPOLIA_RPC] } },
  blockExplorers: { default: { name: 'BaseScan', url: BASE_SEPOLIA_EXPLORER_URL } },
  testnet: true,
};

export const SUPPORTED_CHAINS = [BASE_SEPOLIA];