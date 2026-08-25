export const USDC_CONTRACT = {
  address: import.meta.env.VITE_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  decimals: 6,
  symbol: 'USDC',
  name: 'USD Coin',
};

export const TRANSFER_INTENT_ABI = [
  'function createIntent(address recipient, uint256 amount, string memo) returns (bytes32)',
  'function executeIntent(bytes32 intentId, bytes signature) returns (bool)',
  'function getIntent(bytes32 intentId) view returns (tuple(address sender, address recipient, uint256 amount, uint256 nonce, uint256 deadline, string memo, bool executed))',
] as const;