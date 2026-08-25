import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  ExternalLink, 
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Copy,
  Check
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { transactionsApi } from "@/services/walletAuthApi";
import { BASE_SEPOLIA_EXPLORER_URL } from '@/config/blockchain';
import { formatUnits } from 'viem';
import { Button } from "@/components/ui/button";
import TransactionStatusTimeline from '../components/TransactionStatusTimeline.jsx';
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

export default function TransactionDetail() {
  const navigate = useNavigate();
  const { intent_id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  const shortAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : 'N/A';
  const formatDate = (ts) => ts ? new Date(ts * 1000).toLocaleString() : 'N/A';

  useEffect(() => {
    const loadTransaction = async () => {
      setIsLoading(true);
      try {
        const data = await transactionsApi.getIntent(intent_id);
        setTransaction(data);
      } catch (err) {
        toast.error("Failed to load transaction");
        navigate('/transactions');
      } finally {
        setIsLoading(false);
      }
    };
    loadTransaction();
  }, [intent_id, navigate]);

  const copyToClipboard = async (text, label = 'Copied!') => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/transactions')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-heading text-xl font-bold text-foreground">Transaction Details</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#0052FF]" />
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto text-center">
        <button onClick={() => navigate('/transactions')} className="p-2 rounded-xl hover:bg-secondary transition-colors mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Transaction not found</h3>
        <p className="text-sm text-muted-foreground">The requested transaction could not be found</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/transactions')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-heading text-xl font-bold text-foreground">Transaction Details</h1>
        </div>

        <TransactionStatusTimeline
          status={transaction.status}
          txHash={transaction.transaction_hash}
          verificationResult={transaction}
          intentCreatedAt={transaction.created_at}
          intentConfirmedAt={transaction.confirmed_at}
        />

        <div className="mt-6 space-y-6">
          <div className="space-y-3 text-sm">
            <dt className="text-muted-foreground">Intent ID</dt>
            <dd className="flex items-center gap-2">
              <span className="font-mono text-xs text-foreground truncate flex-1">{transaction.id}</span>
              <button
                onClick={() => copyToClipboard(transaction.id, 'ID copied!')}
                className={`p-1 rounded hover:bg-secondary transition-colors ${copied === transaction.id ? 'text-green-500' : 'text-muted-foreground'}`}
              >
                {copied === transaction.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </dd>
            <dt className="text-muted-foreground">Client Request ID</dt>
            <dd className="font-mono text-xs text-foreground truncate">{transaction.client_request_id}</dd>
            <dt className="text-muted-foreground">Sender</dt>
            <dd className="flex items-center gap-2">
              <span className="font-mono text-xs text-foreground truncate flex-1">{shortAddress(transaction.sender_wallet)}</span>
              <button
                onClick={() => copyToClipboard(transaction.sender_wallet, 'Address copied!')}
                className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground"
              >
                <Copy className="w-4 h-4" />
              </button>
            </dd>
            <dt className="text-muted-foreground">Recipient</dt>
            <dd className="flex items-center gap-2">
              <span className="font-mono text-xs text-foreground truncate flex-1">{shortAddress(transaction.recipient_wallet)}</span>
              <button
                onClick={() => copyToClipboard(transaction.recipient_wallet, 'Address copied!')}
                className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground"
              >
                <Copy className="w-4 h-4" />
              </button>
            </dd>
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="font-semibold text-foreground">${parseFloat(transaction.amount_display).toFixed(2)}</dd>
            <dt className="text-muted-foreground">Amount (Atomic)</dt>
            <dd className="font-mono text-xs text-foreground">{transaction.amount_atomic}</dd>
            <dt className="text-muted-foreground">Token</dt>
            <dd className="text-foreground">{transaction.token_symbol} ({transaction.token_decimals} decimals)</dd>
            <dt className="text-muted-foreground">Contract</dt>
            <dd className="flex items-center gap-2">
              <span className="font-mono text-xs text-foreground truncate flex-1">{transaction.token_contract}</span>
              <button
                onClick={() => copyToClipboard(transaction.token_contract, 'Contract copied!')}
                className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground"
              >
                <Copy className="w-4 h-4" />
              </button>
            </dd>
            <dt className="text-muted-foreground">Chain ID</dt>
            <dd className="text-foreground">{transaction.chain_id}</dd>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="text-foreground">{formatDate(transaction.created_at)}</dd>
            <dt className="text-muted-foreground">Submitted</dt>
            <dd className="text-foreground">{transaction.submitted_at ? formatDate(transaction.submitted_at) : 'N/A'}</dd>
            <dt className="text-muted-foreground">Confirmed</dt>
            <dd className="text-foreground">{transaction.confirmed_at ? formatDate(transaction.confirmed_at) : 'N/A'}</dd>
            <dt className="text-muted-foreground">Expires</dt>
            <dd className="text-foreground">{formatDate(transaction.expires_at)}</dd>
          </div>

          {transaction.transaction_hash && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-medium text-foreground mb-4">On-Chain Transaction</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-foreground bg-background px-2 py-1 rounded border flex-1 truncate">
                    {transaction.transaction_hash}
                  </span>
                  <button
                    onClick={() => copyToClipboard(transaction.transaction_hash, 'Hash copied!')}
                    className={`p-1 rounded hover:bg-secondary transition-colors ${copied === transaction.transaction_hash ? 'text-green-500' : 'text-muted-foreground'}`}
                  >
                    {copied === transaction.transaction_hash ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`${BASE_SEPOLIA_EXPLORER_URL}/tx/${transaction.transaction_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#0052FF] hover:underline flex items-center gap-1"
                  >
                    View on BaseScan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {transaction.policy_result && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-medium text-foreground mb-4">Policy Assessment</h3>
              <div className={`rounded-lg p-3 ${
                transaction.policy_result.assessment_status === 'clear' ? 'bg-green-50 border-green-200' :
                transaction.policy_result.assessment_status === 'review' ? 'bg-amber-50 border-amber-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium ${
                    transaction.policy_result.assessment_status === 'clear' ? 'bg-green-100 text-green-800' :
                    transaction.policy_result.assessment_status === 'review' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }">
                    {transaction.policy_result.assessment_status.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {transaction.policy_result.disclaimer}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Rules evaluated: {transaction.policy_result.rules_evaluated?.join(', ') || 'None'}
                </div>
              </div>
            </div>
          )}

          {transaction.status === 'EXCEPTION_MISMATCH' && transaction.failure_reason && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h3 className="font-medium text-red-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Verification Mismatch
              </h3>
              <p className="text-sm text-red-700 mb-3">
                The on-chain transaction does not match the expected transfer details.
              </p>
              <div className="rounded-lg bg-red-100 border border-red-200 p-3">
                <p className="text-sm text-red-800">{transaction.failure_reason}</p>
              </div>
              <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/support')}>
                Report Issue / Get Help
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
