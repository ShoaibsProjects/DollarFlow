import { motion } from 'framer-motion';
import { AlertTriangle, Check, X, Shield, Lock, Eye, ExternalLink } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

interface SafetyDisclosureModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function SafetyDisclosureModal({ open, onClose, onAccept }: SafetyDisclosureModalProps) {
  if (!open) return null;

  const disclosures = [
    {
      icon: AlertTriangle,
      title: 'Testnet Tokens Only',
      description: 'DollarFlow V1 uses Base Sepolia test USDC. These tokens have NO monetary value and cannot be exchanged for real USDC, fiat currency, or goods.',
    },
    {
      icon: Lock,
      title: 'Irreversible Transactions',
      description: 'Blockchain transfers cannot be reversed. Always verify the recipient address before confirming. DollarFlow cannot recover funds sent to wrong addresses.',
    },
    {
      icon: Shield,
      title: 'Non-Custodial',
      description: 'Your private keys never leave your wallet. DollarFlow does not hold, store, or have access to your funds. You maintain full control at all times.',
    },
    {
      icon: Eye,
      title: 'Public Ledger',
      description: 'All transactions are publicly visible on the Base Sepolia blockchain. Transaction details including amounts and addresses are viewable by anyone.',
    },
    {
      icon: ExternalLink,
      title: 'No Financial Advice',
      description: 'DollarFlow is a technology demonstration, not a financial service. This is not investment, legal, tax, or financial advice. Consult professionals for your specific situation.',
    },
  ];

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
        className="bg-surface border border-border rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-[var(--shadow-elevated)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Safety Disclosures
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-elevated transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            Please read and acknowledge the following before proceeding:
          </p>

          <div className="space-y-3">
            {disclosures.map((disclosure, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-surface-elevated border border-border"
              >
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <disclosure.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">{disclosure.title}</h4>
                    <p className="text-xs text-muted-foreground">{disclosure.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1 rounded-full"
            >
              <X className="w-4 h-4 mr-1" /> Decline
            </Button>
            <Button
              onClick={() => { onAccept(); onClose(); }}
              className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-full"
            >
              <Check className="w-4 h-4 mr-1" /> I Understand & Accept
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}