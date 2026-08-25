import { motion } from 'framer-motion';
import { Check, X, AlertTriangle, DollarSign, Shield, Clock, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { formatCurrency } from '@/shared/lib/utils';
import { BASE_SEPOLIA_EXPLORER_URL } from '@/shared/config/blockchain';

interface TransferReviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (signature: string) => void;
  intentId: string;
  amount: number;
  recipient: string;
  fee: number;
}

export function TransferReviewModal({ open, onClose, onConfirm, intentId, amount, recipient, fee }: TransferReviewModalProps) {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-surface border border-border rounded-2xl max-w-md w-full shadow-[var(--shadow-elevated)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-foreground">Confirm Transfer</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-elevated transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Recipient & Amount */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-elevated border border-border">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">To</p>
              <p className="text-lg font-semibold text-foreground">{recipient}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="text-xl font-display font-bold text-foreground">{formatCurrency(amount)}</p>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="rounded-xl bg-surface-elevated border border-border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transfer Amount</span>
              <span className="text-foreground">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network Fee</span>
              <span className="text-success">{formatCurrency(fee)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span className="font-medium text-foreground">Total</span>
              <span className="font-semibold text-foreground">{formatCurrency(amount + fee)}</span>
            </div>
          </div>

          {/* Intent ID */}
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
            <p className="text-xs text-primary/70 mb-1">Intent ID</p>
            <p className="font-mono text-xs text-foreground truncate">{intentId}</p>
          </div>

          {/* Safety Warnings */}
          <div className="rounded-xl bg-warning/5 border border-warning/20 p-3 space-y-2">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Important Reminders</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 pl-4">
              <li>• This transaction cannot be reversed once confirmed</li>
              <li>• Verify the recipient address matches exactly</li>
              <li>• Testnet USDC has no monetary value</li>
              <li>• Ensure you have enough ETH for gas fees</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1 rounded-full"
            >
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button
              onClick={() => onConfirm('')} // Signature will be passed from wallet
              className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-full"
            >
              <Check className="w-4 h-4 mr-1" /> Confirm & Sign
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}