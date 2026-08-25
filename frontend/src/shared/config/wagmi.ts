import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected, metaMask, coinbaseWallet, walletConnect } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export function getConfig() {
  return createConfig({
    chains: [baseSepolia],
    connectors: [
      injected(),
      metaMask(),
      coinbaseWallet({ appName: 'DollarFlow' }),
      walletConnect({ projectId, metadata: { name: 'DollarFlow', description: 'Send money globally', url: 'https://dollarflow.app', icons: ['https://dollarflow.app/icon.png'] } }),
    ],
    transports: {
      [baseSepolia.id]: http(import.meta.env.VITE_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
    },
  });
}

export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
] as const;