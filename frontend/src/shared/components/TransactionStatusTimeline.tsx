import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, XCircle, Loader2, Hash, Shield, ExternalLink } from 'lucide-react';
import { BASE_SEPOLIA_EXPLORER_URL } from '@/shared/config/blockchain';
import { cn } from '@/shared/lib/utils';

const STATUS_STEPS = [
  { key: 'intent_created', label: 'Intent Created', icon: Shield },
  { key: 'wallet_signed', label: 'Wallet Signed', icon: Hash },
  { key: 'submitted', label: 'Submitted', icon: Clock },
  { key: 'confirming', label: 'Confirming...', icon: Loader2 },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'failed', label: 'Failed', icon: XCircle },
];

const STATUS_ORDER = [
  'intent_created',
  'wallet_signed',
  'submitted',
  'confirming',
  'confirmed',
  'failed',
];

interface TransactionStatusTimelineProps {
  status: string;
  steps?: Array<{ key: string; label: string; icon: React.ComponentType<{ className?: string }> }>;
  txHash?: string;
  explorerUrl?: string;
}

export function TransactionStatusTimeline({ 
  status, 
  steps = STATUS_STEPS, 
  txHash, 
  explorerUrl 
}: TransactionStatusTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(status);
  const isFinal = ['confirmed', 'failed', 'expired', 'cancelled_before_submission'].includes(status);

  return (
    <div className="space-y-4" data-testid="transaction-status-timeline">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex && !isFinal;
        const isFuture = index > currentIndex || (isFinal && index > currentIndex);

        const stepStatus = isCompleted ? 'completed' : isCurrent ? 'current' : 'pending';

        return (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 300 }}
            className="flex items-start gap-3"
          >
            {/* Timeline line */}
            <div className="relative flex-shrink-0 w-6">
              <div className="absolute top-0 bottom-0 left-2.5 w-0.5 bg-border" />
              <div className={cn(
                'relative w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300',
                stepStatus === 'completed' && 'bg-success border-success',
                stepStatus === 'current' && 'bg-primary border-primary animate-pulse',
                stepStatus === 'pending' && 'bg-surface border-border'
              )}>
                {stepStatus === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                {stepStatus === 'current' && <step.icon className="w-3 h-3 text-white" />}
                {stepStatus === 'pending' && <step.icon className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>

            {/* Step content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className={cn(
                'text-sm font-medium transition-colors',
                stepStatus === 'completed' && 'text-foreground',
                stepStatus === 'current' && 'text-primary',
                stepStatus === 'pending' && 'text-muted-foreground'
              )}>
                {step.label}
              </div>
              {stepStatus === 'current' && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {status === 'confirming' ? 'Waiting for blockchain confirmation...' : 'In progress...'}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Transaction Hash */}
      {txHash && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-xl bg-surface-elevated border border-border"
        >
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Transaction Hash</span>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
              >
                View on BaseScan <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="font-mono text-xs text-foreground truncate">{txHash}</p>
        </motion.div>
      )}

      {/* Final Status Message */}
      {isFinal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'p-4 rounded-xl text-center',
            status === 'confirmed' ? 'bg-success/10 border border-success/20' : 'bg-danger/10 border border-danger/20'
          )}
        >
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2',
            status === 'confirmed' ? 'bg-success/20' : 'bg-danger/20'
          )}>
            {status === 'confirmed' ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <XCircle className="w-5 h-5 text-danger" />
            )}
          </div>
          <p className={cn('font-medium', status === 'confirmed' ? 'text-success' : 'text-danger')}>
            {status === 'confirmed' ? 'Transaction Confirmed' : 'Transaction Failed'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {status === 'confirmed' 
              ? 'The transfer has been verified on-chain and matches the expected details.' 
              : 'The transaction was reverted or verification timed out.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}