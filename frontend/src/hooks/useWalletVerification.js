import { useState, useCallback, useEffect } from 'react';
import { useAccount, useSignMessage, useSwitchChain, useChainId } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { walletAuthApi } from '@/services/walletAuthApi';
import { BASE_SEPOLIA_CHAIN_ID } from '@/config/blockchain';

export function useWalletVerification() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();

  const [linkedWallets, setLinkedWallets] = useState([]);
  const [activeWallet, setActiveWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nonceData, setNonceData] = useState(null);

  const loadLinkedWallets = useCallback(async () => {
    if (!isConnected) return;
    try {
      const wallets = await walletAuthApi.getLinkedWallets();
      setLinkedWallets(wallets);
      const active = wallets.find(w => w.is_default) || wallets[0] || null;
      setActiveWallet(active);
    } catch (err) {
      console.error('Failed to load linked wallets:', err);
    }
  }, [isConnected]);

  useEffect(() => {
    loadLinkedWallets();
  }, [loadLinkedWallets]);

  const ensureBaseSepolia = useCallback(async () => {
    if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
      try {
        await switchChainAsync({ chainId: BASE_SEPOLIA_CHAIN_ID });
      } catch (err) {
        throw new Error('Please switch to Base Sepolia network');
      }
    }
  }, [chainId, switchChainAsync]);

  const requestNonce = useCallback(async (walletAddress) => {
    setIsLoading(true);
    setError(null);
    try {
      await ensureBaseSepolia();
      const data = await walletAuthApi.requestNonce(walletAddress);
      setNonceData(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to request nonce';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [ensureBaseSepolia]);

  const verifyWallet = useCallback(async (walletAddress) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!nonceData) {
        await requestNonce(walletAddress);
      }
      
      const message = nonceData.message_template;
      const signature = await signMessageAsync({ message });
      
      const result = await walletAuthApi.verifySignature(walletAddress, signature, message);
      
      if (result.success) {
        setNonceData(null);
        await loadLinkedWallets();
        return result;
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Verification failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [nonceData, signMessageAsync, requestNonce, loadLinkedWallets]);

  const selectWallet = useCallback(async (walletAddress) => {
    setIsLoading(true);
    setError(null);
    try {
      await walletAuthApi.selectWallet(walletAddress);
      await loadLinkedWallets();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to select wallet';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadLinkedWallets]);

  const unlinkWallet = useCallback(async (walletAddress) => {
    setIsLoading(true);
    setError(null);
    try {
      const message = `Unlink wallet ${walletAddress} from DollarFlow.\nThis action cannot be undone.\nTimestamp: ${Date.now()}`;
      const signature = await signMessageAsync({ message });
      
      await walletAuthApi.unlinkWallet(walletAddress, signature, message);
      await loadLinkedWallets();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to unlink wallet';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [signMessageAsync, loadLinkedWallets]);

  const clearError = useCallback(() => setError(null), []);

  return {
    isConnected,
    address,
    chainId,
    isCorrectChain: chainId === BASE_SEPOLIA_CHAIN_ID,
    linkedWallets,
    activeWallet,
    isLoading,
    error,
    nonceData,
    requestNonce,
    verifyWallet,
    selectWallet,
    unlinkWallet,
    loadLinkedWallets,
    clearError,
    ensureBaseSepolia,
  };
}