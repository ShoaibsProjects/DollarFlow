import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Loader2, 
  Hash, 
  Shield,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BASE_SEPOLIA_EXPLORER_URL } from '@/config/blockchain';

const STATUS_STEPS = [
  { key: 'intent_created', label: 'Intent Created', icon: Shield },
  { key: 'wallet_signed', label: 'Wallet Signed', icon: Hash },
  { key: 'submitted', label: 'Submitted', icon: Clock },
  { key: 'confirming', label: 'Confirming...', icon: Loader2 },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'failed', label: 'Failed', icon: XCircle },
  { key: 'mismatch', label: 'Mismatch', icon: AlertCircle },
];

const STATUS_ORDER = [
  'PENDING_SIGNATURE',
  'SUBMITTED',
  'CONFIRMING',
  'CONFIRMED',
  'FAILED',
  'EXCEPTION_MISMATCH',
  'EXPIRED',
  'CANCELLED_BEFORE_SUBMISSION',
];

function TransactionStatusTimeline({ 
  status, 
  txHash, 
  verificationResult,
  intentCreatedAt,
  intentConfirmedAt,
}) {
  const currentIndex = STATUS_ORDER.indexOf(status);
  const isFinal = ['CONFIRMED', 'FAILED', 'EXCEPTION_MISMATCH', 'EXPIRED', 'CANCELLED_BEFORE_SUBMISSION'].includes(status);
  const isError = ['FAILED', 'EXCEPTION_MISMATCH'].includes(status);
  const isSuccess = status === 'CONFIRMED';

  const getStepStatus = (stepKey) => {
    const stepIndices = {
      intent_created: 0,
      wallet_signed: 1,
      submitted: 2,
      confirming: 3,
      confirmed: 4,
      failed: 5,
      mismatch: 5,
    };
    const stepIndex = stepIndices[stepKey];
    if (stepIndex === undefined) return 'pending';
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING_SIGNATURE: 'Pending Signature',
      SUBMITTED: 'Submitted',
      CONFIRMING: 'Confirming...',
      CONFIRMED: 'Confirmed',
      FAILED: 'Failed',
      EXCEPTION_MISMATCH: 'Mismatch - Review Required',
      EXPIRED: 'Expired',
      CANCELLED_BEFORE_SUBMISSION: 'Cancelled',
    };
    return labels[status] || status;
  };

  const getMismatchReasons = () => {
    if (!verificationResult?.failure_reason) return [];
    return verificationResult.failure_reason.split(', ').map(r => r.trim());
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isSuccess ? 'bg-green-100 text-green-600' :
            isError ? 'bg-red-100 text-red-600' :
            'bg-blue-100 text-blue-600'
          }`}>
            {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : 
             isError ? <XCircle className="w-5 h-5" /> : 
             <Loader2 className="w-5 h-5 animate-spin" />}
          </div>
          <div>
            <p className="font-semibold text-foreground">{getStatusLabel(status)}</p>
            <p className="text-sm text-muted-foreground">
              {intentCreatedAt && `Created ${new Date(intentCreatedAt * 1000).toLocaleString()}`}
            </p>
          </div>
        </div>

        {txHash && (
          <div className="mt-3 p-3 rounded-lg bg-background border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-foreground">
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </span>
              <a
                href={`${BASE_SEPOLIA_EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#0052FF] hover:underline"
              >
                View on BaseScan
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {STATUS_STEPS.map((step, index) => {
          const stepStatus = getStepStatus(step.key);
          const isLast = index === STATUS_STEPS.length - 1;
          
          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 relative"
            >
              <div className="relative flex-shrink-0">
                {!isLast && (
                  <div className="absolute left-3 top-10 bottom-0 w-0.5 bg-border" />
                )}
                <div className={`relative w-6 h-6 rounded-full flex items-center justify-center ${
                  stepStatus === 'completed' ? 'bg-green-500 text-white' :
                  stepStatus === 'current' ? 'bg-[#0052FF] text-white animate-pulse' :
                  stepStatus === 'error' ? 'bg-red-500 text-white' :
                  'bg-border text-muted-foreground'
                }`}>
                  {stepStatus === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : stepStatus === 'current' && step.icon === Loader2 ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : stepStatus === 'error' ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className={`text-sm font-medium ${
                  stepStatus === 'completed' ? 'text-foreground' :
                  stepStatus === 'current' ? 'text-[#0052FF]' :
                  stepStatus === 'error' ? 'text-red-600' :
                  'text-muted-foreground'
                }`}>
                  {step.label}
                </p>
                {stepStatus === 'current' && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {status === 'CONFIRMING' && 'Waiting for Base Sepolia confirmation...'}
                    {status === 'SUBMITTED' && 'Transaction submitted, waiting for verification...'}
                    {status === 'PENDING_SIGNATURE' && 'Waiting for wallet signature...'}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {isError && verificationResult?.failure_reason && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Verification Mismatch</span>
          </div>
          <p className="text-sm text-red-700 mb-3">
            The on-chain transaction does not match the expected transfer details.
          </p>
          <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
            {getMismatchReasons().map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
          <p className="text-xs text-red-600 mt-3">
            Contact support if you believe this is an error.
          </p>
        </div>
      )}

      {isSuccess && intentConfirmedAt && (
        <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-green-800">
            Confirmed on Base Sepolia at {new Date(intentConfirmedAt * 1000).toLocaleString()}
            {verificationResult?.confirmations_observed && (
              <> • {verificationResult.confirmations_observed} confirmations</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default TransactionStatusTimeline;