import { useState, useCallback, useEffect } from 'react';
import { transactionsApi } from '@/services/walletAuthApi';

export function useTransactionVerification(intentId) {
  const [verification, setVerification] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);

  const pollVerification = useCallback(async () => {
    if (!intentId) return;
    
    try {
      const intent = await transactionsApi.getIntent(intentId);
      setVerification(intent);
      
      if (intent.status === 'CONFIRMED' || intent.status === 'FAILED' || intent.status === 'EXCEPTION_MISMATCH') {
        setIsPolling(false);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      setIsPolling(false);
    }
  }, [intentId]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
    pollVerification();
    const interval = setInterval(pollVerification, 5000);
    return () => clearInterval(interval);
  }, [pollVerification]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  const triggerVerification = useCallback(async () => {
    if (!intentId) return;
    
    try {
      setIsPolling(true);
      const result = await transactionsApi.triggerVerification(intentId);
      setVerification(result);
      return result;
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      throw err;
    } finally {
      setIsPolling(false);
    }
  }, [intentId]);

  useEffect(() => {
    if (intentId) {
      pollVerification();
      if (['PENDING_SIGNATURE', 'SUBMITTED', 'CONFIRMING'].includes('PENDING_SIGNATURE')) {
        const cleanup = startPolling();
        return cleanup;
      }
    }
  }, [intentId, startPolling, pollVerification]);

  const getStatusInfo = () => {
    if (!verification) return { label: 'Unknown', color: 'gray' };
    
    switch (verification.status) {
      case 'PENDING_SIGNATURE':
        return { label: 'Pending Signature', color: 'gray' };
      case 'SUBMITTED':
        return { label: 'Submitted', color: 'blue' };
      case 'CONFIRMING':
        return { label: 'Confirming...', color: 'yellow' };
      case 'CONFIRMED':
        return { label: 'Confirmed', color: 'green' };
      case 'FAILED':
        return { label: 'Failed', color: 'red' };
      case 'EXCEPTION_MISMATCH':
        return { label: 'Mismatch - Review Required', color: 'orange' };
      case 'EXPIRED':
        return { label: 'Expired', color: 'gray' };
      case 'CANCELLED_BEFORE_SUBMISSION':
        return { label: 'Cancelled', color: 'gray' };
      default:
        return { label: verification.status, color: 'gray' };
    }
  };

  return {
    verification,
    isPolling,
    error,
    pollVerification,
    triggerVerification,
    startPolling,
    stopPolling,
    getStatusInfo,
  };
}