import { useState, useCallback } from 'react';
import { useAccount, useSignMessage, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { USDC_ADDRESS, ERC20_ABI } from '@/shared/config/wagmi';
import { baseSepolia } from 'wagmi/chains';
import { parseUnits } from 'viem';
import axios from 'axios';
import { toast } from '@/shared/ui/sonner';

const API = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_BACKEND_URL}/api` || '/api';

interface TransferParams {
  recipient: string;
  amount: number;
  memo?: string;
}

export function useUSDCTransfer() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const createTransferIntent = useCallback(async (params: TransferParams) => {
    if (!address) throw new Error('Wallet not connected');
    
    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${API}/transactions`,
        {
          type: 'send',
          amount: params.amount,
          recipient_address: params.recipient,
          memo: params.memo,
        },
        { withCredentials: true }
      );
      return res.data;
    } finally {
      setIsSubmitting(false);
    }
  }, [address]);

  const signAndSubmit = useCallback(async (intentId: string, message: string) => {
    if (!address) throw new Error('Wallet not connected');
    
    const signature = await signMessageAsync({ message });
    
    try {
      const res = await axios.post(
        `${API}/transactions/${intentId}/execute`,
        { signature },
        { withCredentials: true }
      );
      return res.data;
    } catch (err) {
      toast.error('Failed to submit transaction');
      throw err;
    }
  }, [address, signMessageAsync]);

  const executeOnChain = useCallback(async (recipient: string, amount: number) => {
    try {
      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [recipient as `0x${string}`, parseUnits(amount.toString(), 6)],
        chainId: baseSepolia.id,
      });
      setTxHash(hash);
      return hash;
    } catch (err) {
      toast.error('On-chain transfer failed');
      throw err;
    }
  }, [writeContractAsync]);

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
    query: { enabled: !!txHash },
  });

  return {
    createTransferIntent,
    signAndSubmit,
    executeOnChain,
    isSubmitting,
    isWriting,
    isConfirming,
    isConfirmed,
    txHash,
    setTxHash,
  };
}