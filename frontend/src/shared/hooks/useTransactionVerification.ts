import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from '@/shared/ui/sonner';

const API = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_BACKEND_URL}/api` || '/api';

interface TransactionStatus {
  status: string;
  transaction_hash?: string;
  confirmed_at?: number;
  failure_reason?: string;
  policy_result?: {
    assessment_status: string;
    disclaimer: string;
    rules_evaluated: string[];
  };
}

export function useTransactionVerification(intentId: string) {
  const [status, setStatus] = useState<TransactionStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyTransaction = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/transactions/${intentId}/verify`, { withCredentials: true });
      setStatus(res.data);
      return res.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      return null;
    }
  }, [intentId]);

  const startPolling = useCallback(() => {
    if (isPolling) return;
    setIsPolling(true);
    
    const poll = async () => {
      const data = await verifyTransaction();
      if (data && ['CONFIRMED', 'FAILED', 'EXCEPTION_MISMATCH', 'EXPIRED', 'CANCELLED_BEFORE_SUBMISSION'].includes(data.status)) {
        setIsPolling(false);
        if (data.status === 'CONFIRMED') {
          toast.success('Transaction confirmed!');
        } else if (data.status === 'EXCEPTION_MISMATCH') {
          toast.error('Transaction mismatch detected');
        } else if (data.status === 'FAILED') {
          toast.error('Transaction failed');
        }
      }
    };
    
    const interval = setInterval(poll, 5000);
    poll(); // Initial check
    
    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [isPolling, verifyTransaction]);

  useEffect(() => {
    if (intentId) {
      const cleanup = startPolling();
      return cleanup;
    }
  }, [intentId, startPolling]);

  return {
    status,
    isPolling,
    error,
    verifyTransaction,
    startPolling,
  };
}