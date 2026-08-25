import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, ArrowDownLeft, ArrowUpRight, ExternalLink, Loader2, AlertTriangle, CheckCircle2, XCircle, Clock, ChevronRight, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/contexts/AuthContext';
import { transactionsApi } from '@/shared/services/api';
import { BASE_SEPOLIA_EXPLORER_URL } from '@/shared/config/blockchain';
import { formatCurrency } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
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

const formatDate = (ts: number) => ts ? new Date(ts * 1000).toLocaleString() : 'N/A';

export function Transactions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await transactionsApi.list({ limit: 100, offset: 0 });
      setTransactions(res.data.transactions || []);
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'send') return tx.type === 'send';
    if (filter === 'receive') return tx.type === 'receive';
    if (filter === 'pending') return ['PENDING_SIGNATURE', 'SUBMITTED', 'CONFIRMING'].includes(tx.status);
    if (filter === 'completed') return ['CONFIRMED', 'FAILED', 'EXCEPTION_MISMATCH'].includes(tx.status);
    return true;
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-surface-elevated transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-xl font-bold text-foreground">Transactions</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-surface-elevated transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-foreground">Transaction History</h1>
          <p className="text-sm text-muted-foreground">View and manage all your transfers</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {['all', 'send', 'receive', 'pending', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
              filter === f ? 'bg-primary text-white' : 'bg-surface-elevated text-muted-foreground hover:text-foreground'
            }`}
            data-testid={`filter-${f}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <Card variant="default">
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <Send className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No transactions yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {filter !== 'all' ? 'No transactions match this filter' : 'Start sending money to see your history here'}
              </p>
              {filter !== 'all' && (
                <Button onClick={() => setFilter('all')} variant="secondary" className="mx-auto">
                  Show All
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y border-border">
              {filteredTransactions.map((tx) => (
                <motion.button
                  key={tx.id}
                  onClick={() => { setSelectedTx(tx); setShowDetail(true); }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="w-full p-4 hover:bg-surface-elevated transition-colors text-left flex items-center justify-between gap-4"
                  data-testid={`transaction-${tx.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.type === 'send' ? 'bg-danger/10' : tx.type === 'receive' ? 'bg-success/10' : 'bg-primary/10'
                    }`}>
                      {tx.type === 'send' ? <ArrowUpRight className="w-5 h-5 text-danger" /> :
                       tx.type === 'receive' ? <ArrowDownLeft className="w-5 h-5 text-success" /> :
                       <ArrowDownLeft className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {tx.type === 'send' ? `Sent to ${tx.recipient_name || 'Unknown'}` :
                           tx.type === 'receive' ? 'Received' : 'Converted'}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[tx.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.CONFIRMED}`}>
                          {STATUS_LABELS[tx.status as keyof typeof STATUS_LABELS] || tx.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatDate(tx.timestamp)} • {tx.memo || 'No memo'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-sm font-semibold ${tx.type === 'send' ? 'text-danger' : 'text-success'}`}>
                      {tx.type === 'send' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetail && selectedTx && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowDetail(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-surface border border-border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-[var(--shadow-elevated)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display text-lg font-bold text-foreground">Transaction Details</h2>
              <button onClick={() => setShowDetail(false)} className="p-1 rounded-lg hover:bg-surface-elevated transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedTx.type === 'send' ? 'bg-danger/10' : 'bg-success/10'
                }`}>
                  {selectedTx.type === 'send' ? <ArrowUpRight className="w-6 h-6 text-danger" /> : <ArrowDownLeft className="w-6 h-6 text-success" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {selectedTx.type === 'send' ? `Sent to ${selectedTx.recipient_name || 'Unknown'}` :
                     selectedTx.type === 'receive' ? 'Received' : 'Converted'}
                  </h3>
                  <p className="text-xs text-muted-foreground">{formatDate(selectedTx.timestamp)}</p>
                </div>
                <div className="ml-auto">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[selectedTx.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.CONFIRMED}`}>
                    {STATUS_LABELS[selectedTx.status as keyof typeof STATUS_LABELS] || selectedTx.status}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-surface-elevated border border-border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className={`text-foreground font-semibold ${selectedTx.type === 'send' ? 'text-danger' : 'text-success'}`}>
                    {selectedTx.type === 'send' ? '-' : '+'}{formatCurrency(selectedTx.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="text-foreground font-medium">{formatCurrency(selectedTx.fee || 0.03)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-foreground font-semibold">{formatCurrency((selectedTx.amount || 0) + (selectedTx.fee || 0.03))}</span>
                </div>
              </div>

              <dl className="space-y-2 text-sm border-t border-border pt-4">
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-muted-foreground">Transaction ID</dt>
                  <dd className="font-mono text-foreground">{selectedTx.id}</dd>
                  <dt className="text-muted-foreground">Intent ID</dt>
                  <dd className="font-mono text-foreground">{selectedTx.intent_id}</dd>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="text-foreground capitalize">{selectedTx.type}</dd>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="text-foreground">{selectedTx.category?.replace('_', ' ')}</dd>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="text-foreground">{formatDate(selectedTx.timestamp)}</dd>
                  {selectedTx.confirmed_at && (
                    <>
                      <dt className="text-muted-foreground">Confirmed</dt>
                      <dd className="text-foreground">{formatDate(selectedTx.confirmed_at)}</dd>
                    </>
                  )}
                </div>
              </dl>

              {selectedTx.transaction_hash && (
                <div className="border-t border-border pt-4 space-y-2">
                  <h4 className="font-medium text-foreground">On-Chain Transaction</h4>
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
                    <span className="font-mono text-sm text-foreground truncate flex-1">{selectedTx.transaction_hash}</span>
                    <button className="p-1 rounded hover:bg-surface-elevated transition-colors" onClick={() => navigator.clipboard.writeText(selectedTx.transaction_hash)}>
                      <Check className="w-4 h-4 text-success" />
                    </button>
                    <a href={`${BASE_SEPOLIA_EXPLORER_URL}/tx/${selectedTx.transaction_hash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      View on BaseScan <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {selectedTx.status === 'EXCEPTION_MISMATCH' && selectedTx.failure_reason && (
                <div className="rounded-lg bg-danger/10 border border-danger/30 p-3">
                  <h4 className="font-medium text-danger mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Verification Mismatch
                  </h4>
                  <p className="text-sm text-danger">{selectedTx.failure_reason}</p>
                </div>
              )}

              {selectedTx.policy_result && (
                <div className="rounded-lg border border-border bg-surface p-3">
                  <h4 className="font-medium text-foreground mb-2">Policy Assessment</h4>
                  <div className={`rounded p-2 ${
                    selectedTx.policy_result.assessment_status === 'clear' ? 'bg-success/10 border-success/20' :
                    selectedTx.policy_result.assessment_status === 'review' ? 'bg-warning/10 border-warning/20' :
                    'bg-danger/10 border-danger/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                        selectedTx.policy_result.assessment_status === 'clear' ? 'bg-success/20 text-success' :
                        selectedTx.policy_result.assessment_status === 'review' ? 'bg-warning/20 text-warning' :
                        'bg-danger/20 text-danger'
                      }`}>
                        {selectedTx.policy_result.assessment_status.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">{selectedTx.policy_result.disclaimer}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Rules: {selectedTx.policy_result.rules_evaluated?.join(', ') || 'None'}
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={() => navigate(`/transaction-detail/${selectedTx.intent_id}`)} variant="secondary" className="w-full rounded-full">
                View Full Details <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}