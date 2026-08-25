import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, XCircle, Loader2, ChevronDown, ExternalLink } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { BASE_SEPOLIA_EXPLORER_URL } from '@/shared/config/blockchain';

interface WalletVerificationCardProps {
  isConnected: boolean;
  address: string;
  isCorrectChain: boolean;
  linkedWallets: Array<{ wallet_address: string; is_default: boolean }>;
  activeWallet: { wallet_address: string; is_default: boolean; verified_at?: number } | null;
  isLoading: boolean;
  error: string | null;
  nonceData: { nonce: string; message: string; expires_at: number } | null;
  requestNonce: (address?: string) => Promise<void>;
  verifyWallet: (signature: string, address?: string) => Promise<void>;
  selectWallet: (wallet: { wallet_address: string; is_default: boolean }) => void;
  ensureBaseSepolia: () => Promise<void>;
  clearError: () => void;
}

export function WalletVerificationCard({
  isConnected,
  address,
  isCorrectChain,
  linkedWallets,
  activeWallet,
  isLoading,
  error,
  nonceData,
  requestNonce,
  verifyWallet,
  selectWallet,
  ensureBaseSepolia,
  clearError,
}: WalletVerificationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [signature, setSignature] = useState('');

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl border border-border bg-surface text-center"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Connect Wallet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your wallet to verify ownership and enable transfers
        </p>
        <Button onClick={ensureBaseSepolia} className="w-full bg-primary hover:bg-primary-hover text-white rounded-full">
          Connect & Switch to Base Sepolia
        </Button>
      </motion.div>
    );
  }

  if (!isCorrectChain) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl border border-warning/30 bg-warning/5 text-center"
      >
        <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-warning" />
        </div>
        <h3 className="text-lg font-semibold text-warning mb-2">Wrong Network</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Please switch to Base Sepolia (Chain ID: 84532)
        </p>
        <Button onClick={ensureBaseSepolia} variant="secondary" className="w-full">
          Switch to Base Sepolia
        </Button>
      </motion.div>
    );
  }

  if (!activeWallet && linkedWallets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl border border-border bg-surface text-center"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Verify Wallet Ownership</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sign a message to prove you own this wallet
        </p>
        <Button onClick={() => requestNonce()} disabled={isLoading} className="w-full bg-primary hover:bg-primary-hover text-white rounded-full">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Request Verification'}
        </Button>
      </motion.div>
    );
  }

  const handleVerify = async () => {
    if (!signature.trim()) return;
    try {
      await verifyWallet(signature);
      setSignature('');
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-surface overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Wallet Verified</h3>
            <p className="text-xs text-muted-foreground font-mono">{shortAddress}</p>
          </div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success font-medium">Active</span>
      </div>

      {/* Wallet Selector */}
      {linkedWallets.length > 1 && (
        <div className="p-4 border-b border-border">
          <label className="block text-sm font-medium text-foreground mb-2">Active Wallet</label>
          <div className="flex items-center gap-2 overflow-x-auto">
            {linkedWallets.map((wallet) => (
              <button
                key={wallet.wallet_address}
                onClick={() => selectWallet(wallet)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  activeWallet?.wallet_address === wallet.wallet_address
                    ? 'bg-primary text-white'
                    : 'bg-surface-elevated text-muted-foreground hover:text-foreground'
                )}
              >
                {wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-4)}
                {wallet.is_default && <span className="ml-1 text-xs">(Default)</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Verification Status */}
      {activeWallet && !activeWallet.verified_at && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-foreground">Verify Wallet Ownership</h4>
              <p className="text-xs text-muted-foreground">Sign a message to prove you own this wallet</p>
            </div>
          </div>
          
          {nonceData ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-surface-elevated border border-border font-mono text-xs">
                {nonceData.message}
              </div>
              <Input
                type="text"
                placeholder="Paste signature here"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="rounded-xl font-mono text-xs"
              />
              <Button onClick={handleVerify} disabled={isLoading || !signature.trim()} className="w-full bg-primary hover:bg-primary-hover text-white rounded-full">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Verify Signature'}
              </Button>
            </div>
          ) : (
            <Button onClick={() => requestNonce()} disabled={isLoading} className="w-full bg-primary hover:bg-primary-hover text-white rounded-full">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Request Verification'}
            </Button>
          )}
        </div>
      )}

      {/* Expandable Details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <span className="text-sm font-medium text-foreground">Details</span>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 border-t border-border space-y-3"
        >
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Address</div>
            <div className="font-mono text-foreground truncate">{address}</div>
            <div className="text-muted-foreground">Network</div>
            <div className="text-foreground">Base Sepolia (84532)</div>
            <div className="text-muted-foreground">Explorer</div>
            <div className="text-foreground">
              <a href={`${BASE_SEPOLIA_EXPLORER_URL}/address/${address}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <ExternalLink className="w-3 h-3" /> View on BaseScan
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="w-full px-4 py-3 text-sm bg-surface border border-border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" {...props} />;
}