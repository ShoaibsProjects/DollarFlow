import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'DollarFlow',
  projectId: '0b0a3dba98de20aa0a8564ed57d4b3a7',
  chains: [baseSepolia],
  ssr: false,
});

// Base Sepolia USDC contract address
export const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
export const USDC_DECIMALS = 6;

// Minimal ERC-20 ABI — only the functions we need
export const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
];
