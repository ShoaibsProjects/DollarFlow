import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Send, 
  ArrowDownLeft, 
  ExternalLink, 
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { transactionsApi } from "@/services/walletAuthApi";
import { BASE_SEPOLIA_EXPLORER_URL } from '@/config/blockchain';
import { formatUnits } from 'viem';
import { USDC_CONTRACT } from '@/config/contracts';
import { Button } from "@/components/ui/button";
import TransactionStatusTimeline from '@/components/TransactionStatusTimeline';
import { toast } from "sonner";

const STATUS_COLORS = {
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  EXCEPTION_MISMATCH: 'bg-amber-100 text-amber-800 border-amber-200',
  SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
  CONFIRMING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PENDING_SIGNATURE: 'bg-gray-100 text-gray-800 border-gray-200',
  EXPIRED: 'bg-gray-100 text-gray-600 border-gray-200',
  CANCELLED_BEFORE_SUBMISSION: 'bg-gray-100 text-gray-600 border-gray-200',
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

export default function Transactions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await transactionsApi.listIntents(50, 0);
      setTransactions(data.intents || []);
    } catch (err) {
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTxs = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'confirmed') return tx.status === 'CONFIRMED';
    if (filter === 'pending') return ['SUBMITTED', 'CONFIRMING', 'PENDING_SIGNATURE'].includes(tx.status);
    if (filter === 'failed') return ['FAILED', 'EXCEPTION_MISMATCH'].includes(tx.status);
    return true;
  });

  const shortAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : 'N/A';
  const formatDate = (ts) => ts ? new Date(ts * 1000).toLocaleString() : 'N/A';

  const handleOpenDetail = (tx) => {
    setSelectedTx(tx);
    setShowDetail(true);
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-heading text-xl font-bold text-foreground">Transactions</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#0052FF]" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-heading text-xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground">View your USDC transfer history and verification status</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['all', 'confirmed', 'pending', 'failed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filter === f 
                ? 'bg-[#0052FF] text-white' 
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {filteredTxs.length === 0 ? (
          <div className="p-12 text-center">
            <Send className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No transactions found</h3>
            <p className="text-sm text-muted-foreground">
              {filter === 'all' ? 'Start sending USDC to see your transaction history here' : `No ${filter} transactions`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredTxs.map((tx) => (
              <motion.button
                key={tx.id}
                onClick={() => handleOpenDetail(tx)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="w-full px-4 py-4 hover:bg-secondary/50 transition-colors text-left flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.recipient_wallet ? 'bg-[#0052FF]/10' : 'bg-gray-100'
                    }`}>
                      <Send className="w-4 h-4 text-[#0052FF]" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground truncate">
                        {tx.recipient_wallet ? shortAddress(tx.recipient_wallet) : 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">
                      ${parseFloat(tx.amount_display).toFixed(2)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                      STATUS_COLORS[tx.status] || STATUS_COLORS.PENDING_SIGNATURE
                    }`}>
                      {STATUS_LABELS[tx.status] || tx.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {tx.transaction_hash && (
                    <a
                      href={`${BASE_SEPOLIA_EXPLORER_URL}/tx/${tx.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              </motion.button>
            ))}
          </div>
        )},
      </div>
    </div>

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
          className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="font-heading text-lg font-bold text-foreground">Transaction Details</h2>
            <button onClick={() => setShowDetail(false)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <TransactionStatusTimeline
              status={selectedTx.status}
              txHash={selectedTx.transaction_hash}
              verificationResult={selectedTx}
              intentCreatedAt={selectedTx.created_at}
              intentConfirmedAt={selectedTx.confirmed_at}
            />
            
            <div className="border-t border-border pt-6 space-y-4">
              <h3 className="font-medium text-foreground">Intent Details</h3>
              <dl className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-muted-foreground">Intent ID</dt>
                  <dd className="font-mono text-foreground truncate">{selectedTx.id}</dd>
                  <dt className="text-muted-foreground">Client Request ID</dt>
                  <dd className="font-mono text-foreground truncate">{selectedTx.client_request_id}</dd>
                  <dt className="text-muted-foreground">Sender</dt>
                  <dd className="font-mono text-foreground truncate">{shortAddress(selectedTx.sender_wallet)}</dd>
                  <dt className="text-muted-foreground">Recipient</dt>
                  <dd className="font-mono text-foreground truncate">{shortAddress(selectedTx.recipient_wallet)}</dd>
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="font-semibold text-foreground">${parseFloat(selectedTx.amount_display).toFixed(2)}</dd>
                  <dt className="text-muted-foreground">Amount (Atomic)</dt>
                  <dd className="font-mono text-xs text-foreground">{selectedTx.amount_atomic}</dd>
                  <dt className="text-muted-foreground">Token</dt>
                  <dd className="text-foreground">{selectedTx.token_symbol} ({selectedTx.token_decimals} decimals)</dd>
                  <dt className="text-muted-foreground">Contract</dt>
                  <dd className="font-mono text-xs text-foreground truncate">{selectedTx.token_contract}</dd>
                  <dt className="text-muted-foreground">Chain ID</dt>
                  <dd className="text-foreground">{selectedTx.chain_id}</dd>
                </div>
              </dl>
            </div>

            {selectedTx.transaction_hash && (
              <div className="border-t border-border pt-6 space-y-3">
                <h3 className="font-medium text-foreground">On-Chain Transaction</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-foreground bg-background px-2 py-1 rounded border">
                    {selectedTx.transaction_hash}
                  </span>
                  <a
                    href={`${BASE_SEPOLIA_EXPLORER_URL}/tx/${selectedTx.transaction_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#0052FF] hover:underline flex items-center gap-1"
                  >
                    View on BaseScan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {selectedTx.policy_result && (
              <div className="border-t border-border pt-6 space-y-3">
                <h3 className="font-medium text-foreground">Policy Assessment</h3>
                <div className={`rounded-lg p-3 ${
                  selectedTx.policy_result.assessment_status === 'clear' ? 'bg-green-50 border-green-200' :
                  selectedTx.policy_result.assessment_status === 'review' ? 'bg-amber-50 border-amber-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium ${
                      selectedTx.policy_result.assessment_status === 'clear' ? 'bg-green-100 text-green-800' :
                      selectedTx.policy_result.assessment_status === 'review' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }">
                      {selectedTx.policy_result.assessment_status.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selectedTx.policy_result.disclaimer}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Rules: {selectedTx.policy_result.rules_evaluated?.join(', ') || 'None'}
                  </div>
                </div>
              </div>
            )}

            {selectedTx.status === 'EXCEPTION_MISMATCH' && selectedTx.failure_reason && (
              <div className="border-t border-border pt-6 space-y-3">
                <h3 className="font-medium text-red-800">Mismatch Details</h3>
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-700">{selectedTx.failure_reason}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    )}
  </>
);
}