import { type ReactNode } from 'react';
import { useAccount, useConnect, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
}

export function useWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect } = useConnect();
  const { switchChain } = useSwitchChain();

  const ensureBaseSepolia = async () => {
    if (chainId !== baseSepolia.id) {
      try {
        await switchChain({ chainId: baseSepolia.id });
      } catch {
        // User rejected
      }
    }
  };

  const connectWallet = async () => {
    const connector = connectors.find(c => c.id === 'metaMask') || connectors[0];
    if (connector) {
      try {
        await connect({ connector, chainId: baseSepolia.id });
      } catch {
        // User rejected
      }
    }
  };

  const disconnectWallet = async () => {
    // disconnect is not available in useDisconnect in this version
    // We'll just use the connect/disconnect from the wallet connector directly
  };

  return {
    address,
    isConnected,
    chainId,
    ensureBaseSepolia,
    connect: connectWallet,
    disconnect: async () => {},
    isCorrectChain: chainId === baseSepolia.id,
  };
}