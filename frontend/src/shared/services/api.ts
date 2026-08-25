import axios from 'axios';

const API = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_BACKEND_URL}/api` || '/api';

const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Wallet Auth (V1 Router: /wallet-auth/*)
export const walletAuthApi = {
  login: () => window.location.href = `${API.replace('/api', '')}/auth/login`,
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  requestNonce: (address: string) => api.post('/wallet-auth/nonce', { address }),
  verifyWallet: (address: string, signature: string, nonce: string) => 
    api.post('/wallet-auth/verify', { address, signature, nonce }),
  getWallets: () => api.get('/wallet-auth/me'),
  selectWallet: (address: string) => api.post('/wallet-auth/select', { address }),
  unlinkWallet: (address: string, signature: string, message: string) => 
    api.post('/wallet-auth/unlink', { address, signature, message }),
};

// Transaction Intents (V1 Router: /transaction-intents/*)
export const transactionsApi = {
  list: (params?: { limit?: number; offset?: number; type?: string }) => 
    api.get('/transaction-intents', { params }),
  create: (data: { 
    type: string; 
    amount: number; 
    recipient_address?: string; 
    recipient_name?: string; 
    category?: string; 
    memo?: string;
    client_request_id?: string;
    risk_disclosure_version?: string;
    selected_sender_wallet?: string;
    purpose?: string;
  }) => api.post('/transaction-intents', data),
  get: (id: string) => api.get(`/transaction-intents/${id}`),
  verify: (id: string) => api.post(`/transaction-intents/${id}/verify`),
  execute: (id: string, signature: string) => api.post(`/transaction-intents/${id}/submit`, { signature }),
  cancel: (id: string) => api.post(`/transaction-intents/${id}/cancel`),
};

// Dashboard (server.py direct)
export const dashboardApi = {
  get: () => api.get('/dashboard'),
  getInflationShield: () => api.get('/inflation-shield'),
  updateInflationShield: (enabled: boolean, percentage?: number) => 
    api.put('/inflation-shield', { enabled, shield_percentage: percentage }),
};

// Family Vault (server.py direct)
export const familyVaultApi = {
  get: () => api.get('/family-vault'),
  addMember: (data: { name: string; relationship: string; monthly_allocation: number; avatar_color?: string }) => 
    api.post('/family-vault/member', data),
  updateMember: (id: string, data: Partial<{ name: string; relationship: string; monthly_allocation: number; visibility_enabled: boolean }>) => 
    api.put(`/family-vault/member/${id}`, data),
  sendToMember: (id: string, amount: number) => 
    api.post(`/family-vault/send/${id}`, { amount }),
};

// Spots (server.py direct)
export const spotsApi = {
  list: (params?: { city?: string; currency?: string; open_now?: boolean }) => api.get('/spots', { params }),
};

// Chat (server.py direct)
export const chatApi = {
  getHistory: () => api.get('/chat/history'),
  send: (message: string) => api.post('/chat', { message }),
};

// Analytics (server.py direct)
export const analyticsApi = {
  get: () => api.get('/analytics'),
  getCurrencyHistory: (currency: string) => api.get(`/currencies/history/${currency}`),
  getLiveFees: (amount: number) => api.get('/fees/live', { params: { amount } }),
};

// Support (V1 Router: /support/*)
export const supportApi = {
  listCases: (limit = 50, offset = 0) => api.get('/support/cases', { params: { limit, offset } }),
  createCase: (data: { type: string; category: string; description: string; transaction_intent_id?: string; priority?: string }) => 
    api.post('/support/cases', data),
  getCase: (id: string) => api.get(`/support/cases/${id}`),
  addComment: (caseId: string, content: string) => api.post(`/support/cases/${caseId}/comment`, { content }),
};

// Settings (server.py direct)
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: Partial<{ country: string; currency: string; inflation_shield: boolean; shield_percentage: number; use_case: string }>) => 
    api.put('/settings', data),
};

// Security (server.py direct)
export const securityApi = {
  getPinStatus: () => api.get('/security/pin/status'),
  setPin: (pin: string) => api.post('/security/pin', { pin }),
  removePin: (pin: string) => api.delete('/security/pin', { data: { pin } }),
  cleanupSessions: () => api.post('/security/sessions/cleanup'),
};

// Blockchain (V1 Router: /blockchain/*)
export const blockchainApi = {
  getUSDCBalance: (wallet: string) => api.get('/blockchain/usdc-balance', { params: { wallet } }),
  testSecurity: () => api.post('/blockchain/test-security'),
};

// Audit (V1 Router: /audit/*)
export const auditApi = {
  getEvents: (limit = 50, skip = 0) => api.get('/audit/events', { params: { limit, skip } }),
  getEventsForResource: (resourceType: string, resourceId: string) => api.get(`/audit/events/${resourceType}/${resourceId}`),
  verifyChain: () => api.get('/audit/verify-chain'),
};

// Compliance Demo (V1 Router: /compliance-demo/*)
export const complianceApi = {
  assess: (data: { 
    amount: number; 
    currency: string; 
    user_country: string; 
    transaction_type: string;
    user_id?: string;
    recipient_country?: string;
    purpose?: string;
  }) => api.post('/compliance-demo/assess', data),
};

// Wallet register (server.py direct - legacy)
export const registerWallet = (address: string) => api.post('/wallets/register', { address });

export { API };