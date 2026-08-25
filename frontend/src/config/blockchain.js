export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_RPC_URL = process.env.REACT_APP_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
export const BASE_SEPOLIA_EXPLORER_URL = process.env.REACT_APP_BASE_SEPOLIA_EXPLORER_URL || 'https://sepolia.basescan.org';

export const BASE_SEPOLIA_USDC_ADDRESS = process.env.REACT_APP_BASE_SEPOLIA_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
export const BASE_SEPOLIA_USDC_DECIMALS = 6;

export const getExplorerTxUrl = (txHash) => `${BASE_SEPOLIA_EXPLORER_URL}/tx/${txHash}`;
export const getExplorerAddressUrl = (address) => `${BASE_SEPOLIA_EXPLORER_URL}/address/${address}`;

export const DEMO_TRANSFER_CAP_USDC = process.env.REACT_APP_DEMO_TRANSFER_CAP_USDC || '1000.00';

export const WALLET_AUTH_DOMAIN = process.env.REACT_APP_WALLET_AUTH_DOMAIN || 'localhost:3000';

export const TESTNET_DISCLAIMER = 'DollarFlow Testnet Preview — Uses Base Sepolia test USDC only. Test assets have no monetary value. Do not use DollarFlow for real financial transactions.';

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
export const API_BASE = `${BACKEND_URL}/api`;