import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { walletAuthApi } from '@/shared/services/api';
import { useAuth } from '@/shared/contexts/AuthContext';

interface WalletInfo {
  wallet_address: string;
  is_default: boolean;
  verified_at?: number;
}

interface NonceData {
  nonce: string;
  message: string;
  expires_at: number;
}

export function useWalletVerification() {
  const { address, isConnected, isCorrectChain, ensureBaseSepolia } = useWallet();
  const { user } = useAuth();
  const [linkedWallets, setLinkedWallets] = useState<WalletInfo[]>([]);
  const [activeWallet, setActiveWallet] = useState<WalletInfo | null>(null);
  const [nonceData, setNonceData] = useState<NonceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    if (!user) return;
    try {
      const res = await walletAuthApi.getWallets();
      setLinkedWallets(res.data.wallets || []);
      if (res.data.wallets?.length > 0) {
        const defaultWallet = res.data.wallets.find((w: WalletInfo) => w.is_default) || res.data.wallets[0];
        setActiveWallet(defaultWallet);
      }
    } catch (err) {
      console.error('Failed to fetch wallets:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const requestNonce = async (walletAddress?: string) => {
    const addr = walletAddress || address;
    if (!addr) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await walletAuthApi.requestNonce(addr);
      setNonceData(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to request nonce';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyWallet = async (signature: string, walletAddress?: string) => {
    const addr = walletAddress || address;
    if (!addr || !nonceData) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await walletAuthApi.verifyWallet(addr, signature, nonceData.nonce);
      fetchWallets();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to verify wallet';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const selectWallet = (wallet: WalletInfo) => {
    setActiveWallet(wallet);
  };

  const clearError = () => setError(null);

  return {
    linkedWallets,
    activeWallet,
    isConnected,
    isCorrectChain,
    isLoading,
    error,
    nonceData,
    requestNonce,
    verifyWallet,
    selectWallet,
    ensureBaseSepolia,
    clearError,
    fetchWallets,
  };
}

interface WalletInfo {
  wallet_address: string;
  is_default: boolean;
  verified_at?: number;
}

interface NonceData {
  nonce: string;
  message: string;
  expires_at: number;
}