import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function TestnetBanner({ dismissible = true }: { dismissible?: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    const stored = localStorage.getItem('testnet-banner-dismissed');
    if (stored) setDismissed(true);
  }, []);
  
  if (dismissed) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -100 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-40',
        'bg-warning/10 border-b border-warning/30',
        'px-4 py-2 lg:px-8 lg:py-3'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-warning flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-warning">Testnet Mode</p>
          <p className="text-xs text-muted-foreground">
            Running on Base Sepolia. All USDC are test tokens with no monetary value.{' '}
            <a href="https://docs.base.org/docs/testnet-faucets" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Get test tokens
            </a>
          </p>
        </div>
        {dismissible && (
          <button
            onClick={() => {
              setDismissed(true);
              localStorage.setItem('testnet-banner-dismissed', 'true');
            }}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-warning/20 transition-colors lg:hidden"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}