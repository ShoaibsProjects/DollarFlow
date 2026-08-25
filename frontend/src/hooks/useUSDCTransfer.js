import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { USDC_CONTRACT } from '@/config/contracts';
import { transactionsApi, CHAIN_CONFIG } from '@/services/walletAuthApi';
import { BASE_SEPOLIA_CHAIN_ID } from '@/config/blockchain';

export function useUSDCTransfer() {
  const { address } = useAccount();
  const chainId = useChainId();
  
  const { writeContract, data: txHash, isPending: isWriting, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isTxError, error: txError } = 
    useWaitForTransactionReceipt({ hash: txHash });

  const [intent, setIntent] = useState(null);
  const [status, setStatus] = useState('idle');
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const isCorrectChain = chainId === BASE_SEPOLIA_CHAIN_ID;

  const createIntent = useCallback(async ({
    recipientWallet,
    amount,
    purpose,
    senderWallet,
    riskDisclosureVersion = 'v1.0',
  }) => {
    setError(null);
    setStatus('creating_intent');
    
    try {
      const clientRequestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      
      const result = await transactionsApi.createIntent({
        client_request_id: clientRequestId,
        recipient_wallet: recipientWallet,
        amount,
        purpose,
        selected_sender_wallet: senderWallet,
        risk_disclosure_version: riskDisclosureVersion,
      });
      
      setIntent(result);
      setStatus('intent_created');
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to create intent';
      setError(msg);
      setStatus('error');
      throw err;
    }
  }, []);

  const sendUSDC = useCallback(async ({ amountAtomic, recipientWallet }) => {
    if (!address) throw new Error('Wallet not connected');
    if (!isCorrectChain) throw new Error('Wrong network. Please switch to Base Sepolia');
    
    setError(null);
    setStatus('signing');
    
    try {
      writeContract({
        address: USDC_CONTRACT.address,
        abi: USDC_CONTRACT.abi,
        functionName: 'transfer',
        args: [recipientWallet, BigInt(amountAtomic)],
      });
    } catch (err) {
      setError(err.message || 'Failed to initiate transfer');
      setStatus('error');
      throw err;
    }
  }, [address, writeContract, isCorrectChain]);

  const submitHash = useCallback(async () => {
    if (!intent || !txHash) return;
    
    setStatus('submitting');
    setError(null);
    
    try {
      const result = await transactionsApi.submitHash(intent.id, txHash);
      setIntent(result);
      setStatus('submitted');
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to submit transaction';
      setError(msg);
      setStatus('error');
      throw err;
    }
  }, [intent, txHash]);

  const verifyTransaction = useCallback(async () => {
    if (!intent) return;
    
    setIsVerifying(true);
    setError(null);
    
    try {
      const result = await transactionsApi.triggerVerification(intent.id);
      setIntent(result);
      setVerificationResult(result);
      
      if (result.status === 'CONFIRMED') {
        setStatus('confirmed');
      } else if (result.status === 'FAILED') {
        setStatus('failed');
      } else if (result.status === 'EXCEPTION_MISMATCH') {
        setStatus('mismatch');
      } else {
        setStatus('verifying');
      }
      
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Verification failed';
      setError(msg);
      setStatus('error');
      throw err;
    } finally {
      setIsVerifying(false);
    }
  }, [intent]);

  useEffect(() => {
    if (isConfirmed && txHash && intent && intent.status === 'SUBMITTED') {
      verifyTransaction();
    }
  }, [isConfirmed, txHash, intent, verifyTransaction]);

  const reset = useCallback(() => {
    setIntent(null);
    setStatus('idle');
    setVerificationResult(null);
    setError(null);
    resetWrite();
  }, [resetWrite]);

  const getStatusMessage = () => {
    switch (status) {
      case 'creating_intent': return 'Creating transaction intent...';
      case 'intent_created': return 'Intent created. Ready to sign.';
      case 'signing': return 'Waiting for wallet signature...';
      case 'submitting': return 'Submitting transaction hash...';
      case 'submitted': return 'Transaction submitted. Verifying...';
      case 'verifying': return 'Verifying on-chain...';
      case 'confirmed': return 'Transfer confirmed!';
      case 'failed': return 'Transfer failed';
      case 'mismatch': return 'Transfer mismatch - needs review';
      case 'error': return error || 'An error occurred';
      default: return 'Ready';
    }
  };

  return {
    address,
    isCorrectChain,
    chainConfig: CHAIN_CONFIG,
    intent,
    txHash,
    status,
    verificationResult,
    error,
    isWriting,
    isConfirming,
    isTxError,
    txError,
    isVerifying,
    createIntent,
    sendUSDC,
    submitHash,
    verifyTransaction,
    reset,
    getStatusMessage,
    formatAmount: (atomic) => formatUnits(BigInt(atomic), USDC_CONTRACT.decimals),
    parseAmount: (display) => parseUnits(display, USDC_CONTRACT.decimals),
  };
}