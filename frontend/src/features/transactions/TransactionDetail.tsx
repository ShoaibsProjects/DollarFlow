import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Loader2, AlertTriangle, CheckCircle2, XCircle, Clock, Shield, Copy, Check, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { transactionsApi } from '@/shared/services/api';
import { BASE_SEPOLIA_EXPLORER_URL } from '@/shared/config/blockchain';
import { formatCurrency } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { TransactionStatusTimeline } from '@/shared/components/TransactionStatusTimeline';
import { toast } from '@/shared/ui/sonner';

const STATUS_COLORS = {
  CONFIRMED: 'bg-success/10 text-success border-success/20',
  FAILED: 'bg-danger/10 text-danger border-danger/20',
  EXCEPTION_MISMATCH: 'bg-warning/10 text-warning border-warning/20',
  SUBMITTED: 'bg-primary/10 text-primary border-primary/20',
  CONFIRMING: 'bg-warning/10 text-warning border-warning/20',
  PENDING_SIGNATURE: 'bg-muted/10 text-muted border-muted/20',
  EXPIRED: 'bg-muted/10 text-muted-foreground border-muted/20',
  CANCELLED_BEFORE_SUBMISSION: 'bg-muted/10 text-muted-foreground border-muted/20',
};

const STATUS_LABELS = {
  CONFIRMED: 'Confirmed',
  FAILED: 'Failed',
  EXCEPTION_MISMATCH: 'Mismatch',
  SUBMITTED: 'Submitted',
  CONFIRMING: 'Confirming',
  PENDING_SIGNATURE: 'Pending Signature',
  EXPIRED: 'Expired',
  CANCELLED_BEFORE_SUBMISSION: 'Cancelled',
};

export function TransactionDetail() {
  const navigate = useNavigate();
  const { intent_id } = useParams();
  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const formatDate = (ts: number) => ts ? new Date(ts * 1000).toLocaleString() : 'N/A';

  const copyToClipboard = async (text: string, label = 'Copied!') => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  useEffect(() => {
    if (intent_id) {
      loadTransaction();
    }
  }, [intent_id]);

  const loadTransaction = async () => {
    setIsLoading(true);
    try {
      const data = await transactionsApi.get(intent_id!);
      setTransaction(data);
    } catch (err) {
      toast.error('Failed to load transaction');
      navigate('/transactions');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/transactions')} className="p-2 rounded-xl hover:bg-surface-elevated transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-xl font-bold text-foreground">Transaction Details</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-4 lg:p-8 max-w-3xl mx-auto text-center">
        <AlertTriangle className="w-12 h-12 mx-auto text-warning mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Transaction not found</h3>
        <Button onClick={() => navigate('/transactions')} variant="secondary" className="mt-4">Back to History</Button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/transactions')} className="p-2 rounded-xl hover:bg-surface-elevated transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-foreground">Transaction Details</h1>
          <p className="text-sm text-muted-foreground">View complete transfer information</p>
        </div>
      </div>

      {/* Status Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            transaction.type === 'send' ? 'bg-danger/10' : 'bg-success/10'
          }`}>
            {transaction.type === 'send' ? <ArrowUpRight className="w-6 h-6 text-danger" /> : <ArrowDownLeft className="w-6 h-6 text-success" />}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {transaction.type === 'send' ? `Sent to ${transaction.recipient_name || 'Unknown'}` :
               transaction.type === 'receive' ? 'Received' : 'Converted'}
            </h2>
            <p className="text-xs text-muted-foreground">{formatDate(transaction.timestamp)}</p>
          </div>
          <div className="ml-auto">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[transaction.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.CONFIRMED}`}>
              {STATUS_LABELS[transaction.status as keyof typeof STATUS_LABELS] || transaction.status}
            </span>
          </div>
        </div>

        {/* Amount Card */}
        <Card variant="default">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className={`text-3xl font-display font-bold ${transaction.type === 'send' ? 'text-danger' : 'text-success'}`}>
                {transaction.type === 'send' ? '-' : '+'}{formatCurrency(transaction.amount)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl bg-surface-elevated border border-border">
                <div className="text-xs text-muted-foreground mb-1">Fee</div>
                <div className="text-lg font-semibold text-foreground">{formatCurrency(transaction.fee || 0.03)}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-border">
                <div className="text-xs text-muted-foreground mb-1">Total</div>
                <div className="text-lg font-semibold text-foreground">{formatCurrency((transaction.amount || 0) + (transaction.fee || 0.03))}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-border">
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <div className="text-sm font-medium capitalize">{STATUS_LABELS[transaction.status as keyof typeof STATUS_LABELS] || transaction.status}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Details Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4 mb-6">
        <Card variant="default">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Transfer Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <dt className="text-muted-foreground">Intent ID</dt>
                <dd className="font-mono text-foreground truncate">{transaction.intent_id}</dd>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="text-foreground capitalize">{transaction.type}</dd>
                <dt className="text-muted-foreground">Category</dt>
                <dd className="text-foreground">{transaction.category?.replace('_', ' ')}</dd>
                <dt className="text-muted-foreground">Recipient</dt>
                <dd className="text-foreground">{transaction.recipient_name || 'N/A'}</dd>
                <dt className="text-muted-foreground">Memo</dt>
                <dd className="text-foreground truncate">{transaction.memo || 'None'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Timestamps</h3>
            <dl className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-foreground">{formatDate(transaction.timestamp)}</dd>
                <dt className="text-muted-foreground">Submitted</dt>
                <dd className="text-foreground">{formatDate(transaction.submitted_at)}</dd>
                <dt className="text-muted-foreground">Confirmed</dt>
                <dd className="text-foreground">{transaction.confirmed_at ? formatDate(transaction.confirmed_at) : 'N/A'}</dd>
                <dt className="text-muted-foreground">Expires</dt>
                <dd className="text-foreground">{formatDate(transaction.expires_at)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </motion.div>

      {/* On-Chain Transaction */}
      {transaction.transaction_hash && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
          <Card variant="default">
            <CardContent className="p-5">
              <h3 className="font-display text-base font-semibold text-foreground mb-4">On-Chain Transaction</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-foreground bg-background px-2 py-1 rounded border flex-1 truncate">
                    {transaction.transaction_hash}
                  </span>
                  <button
                    onClick={() => copyToClipboard(transaction.transaction_hash, 'Hash copied!')}
                    className={`p-1 rounded hover:bg-surface-elevated transition-colors ${copied === transaction.transaction_hash ? 'text-success' : 'text-muted-foreground'}`}
                  >
                    {copied === transaction.transaction_hash ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`${BASE_SEPOLIA_EXPLORER_URL}/tx/${transaction.transaction_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    View on BaseScan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {transaction.block_number && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Block</span>
                    <span className="text-foreground font-medium">#{transaction.block_number}</span>
                  </div>
                )}
                {transaction.gas_used && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gas Used</span>
                    <span className="text-foreground font-medium">{transaction.gas_used.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Policy Assessment */}
      {transaction.policy_result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
          <Card variant="default">
            <CardContent className="p-5">
              <h3 className="font-display text-base font-semibold text-foreground mb-4">Policy Assessment</h3>
              <div className={`rounded-lg p-3 ${
                transaction.policy_result.assessment_status === 'clear' ? 'bg-success/10 border-success/20' :
                transaction.policy_result.assessment_status === 'review' ? 'bg-warning/10 border-warning/20' :
                'bg-danger/10 border-danger/20'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    transaction.policy_result.assessment_status === 'clear' ? 'bg-success/20 text-success' :
                    transaction.policy_result.assessment_status === 'review' ? 'bg-warning/20 text-warning' :
                    'bg-danger/20 text-danger'
                  }`}>
                    {transaction.policy_result.assessment_status.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">{transaction.policy_result.disclaimer}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Rules evaluated: {transaction.policy_result.rules_evaluated?.join(', ') || 'None'}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Mismatch Alert */}
      {transaction.status === 'EXCEPTION_MISMATCH' && transaction.failure_reason && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-6">
          <Card variant="default" className="border-danger/30 bg-danger/5">
            <CardContent className="p-5">
              <h3 className="font-display text-base font-semibold text-danger mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Verification Mismatch
              </h3>
              <p className="text-sm text-danger mb-3">
                The on-chain transaction does not match the expected transfer details.
              </p>
              <div className="rounded-lg bg-danger/10 border border-danger/20 p-3">
                <p className="text-sm text-danger">{transaction.failure_reason}</p>
              </div>
              <Button variant="secondary" className="mt-4 w-full rounded-full" onClick={() => navigate('/support')}>
                Report Issue / Get Help
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Status Timeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <TransactionStatusTimeline
          status={transaction.status}
          txHash={transaction.transaction_hash}
          explorerUrl={transaction.transaction_hash ? `${BASE_SEPOLIA_EXPLORER_URL}/tx/${transaction.transaction_hash}` : undefined}
        />
      </motion.div>
    </div>
  );
}