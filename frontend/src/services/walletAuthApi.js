import axios from 'axios';
import { BASE_SEPOLIA_CHAIN_ID, BASE_SEPOLIA_USDC_ADDRESS, BASE_SEPOLIA_USDC_DECIMALS, API_BASE } from '@/config/blockchain';

// Utility to read CSRF token from cookie
function getCsrfToken() {
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  return match ? match[1] : null;
}

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Add CSRF token to state-changing requests
api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();
  if (['post', 'put', 'delete', 'patch'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  return config;
});

export const walletAuthApi = {
  async requestNonce(walletAddress) {
    const res = await api.post('/wallet-auth/nonce', { wallet_address: walletAddress.toLowerCase() });
    return res.data;
  },

  async verifySignature(walletAddress, signature, message) {
    const res = await api.post('/wallet-auth/verify', {
      wallet_address: walletAddress.toLowerCase(),
      signature,
      message,
    });
    return res.data;
  },

  async getLinkedWallets() {
    const res = await api.get('/wallet-auth/me');
    return res.data;
  },

  async selectWallet(walletAddress) {
    const res = await api.post('/wallet-auth/select', { wallet_address: walletAddress.toLowerCase() });
    return res.data;
  },

  async unlinkWallet(walletAddress, signature, message) {
    const res = await api.post('/wallet-auth/unlink', {
      wallet_address: walletAddress.toLowerCase(),
      signature,
      message,
    });
    return res.data;
  },
};

export const transactionsApi = {
  async createIntent(payload) {
    const res = await api.post('/transaction-intents', payload);
    return res.data;
  },

  async listIntents(limit = 50, skip = 0) {
    const res = await api.get('/transaction-intents', { params: { limit, skip } });
    return res.data;
  },

  async getIntent(intentId) {
    const res = await api.get(`/transaction-intents/${intentId}`);
    return res.data;
  },

  async submitHash(intentId, transactionHash) {
    const res = await api.post(`/transaction-intents/${intentId}/submit`, { transaction_hash: transactionHash });
    return res.data;
  },

  async cancelIntent(intentId) {
    const res = await api.post(`/transaction-intents/${intentId}/cancel`, {});
    return res.data;
  },

  async triggerVerification(intentId) {
    const res = await api.post(`/transaction-intents/${intentId}/verify`);
    return res.data;
  },

  async getChainConfig() {
    const res = await api.get('/transaction-intents/config/chain');
    return res.data;
  },

  async getUSDCBalance(wallet) {
    const res = await api.get('/blockchain/usdc-balance', { params: { wallet } });
    return res.data;
  },
};

export const auditApi = {
  async getEvents(limit = 50, skip = 0) {
    const res = await api.get('/audit/events', { params: { limit, skip } });
    return res.data;
  },

  async getEventsForResource(resourceType, resourceId) {
    const res = await api.get(`/audit/events/${resourceType}/${resourceId}`);
    return res.data;
  },

  async verifyChain() {
    const res = await api.get('/audit/verify-chain');
    return res.data;
  },
};

export const complianceApi = {
  async assessTransfer(payload) {
    const res = await api.post('/compliance-demo/assess', payload);
    return res.data;
  },
};

export const supportApi = {
  async createCase(payload) {
    const res = await api.post('/support/cases', payload);
    return res.data;
  },

  async listCases(limit = 50, skip = 0) {
    const res = await api.get('/support/cases', { params: { limit, skip } });
    return res.data;
  },

  async getCase(caseId) {
    const res = await api.get(`/support/cases/${caseId}`);
    return res.data;
  },

  async addComment(caseId, content) {
    const res = await api.post(`/support/cases/${caseId}/comment`, { content });
    return res.data;
  },
};

export const CHAIN_CONFIG = {
  chainId: BASE_SEPOLIA_CHAIN_ID,
  rpcUrl: BASE_SEPOLIA_RPC_URL,
  explorerUrl: BASE_SEPOLIA_EXPLORER_URL,
  usdcAddress: BASE_SEPOLIA_USDC_ADDRESS,
  usdcDecimals: BASE_SEPOLIA_USDC_DECIMALS,
  usdcSymbol: 'USDC',
};