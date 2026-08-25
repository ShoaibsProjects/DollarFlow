import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export default function TestnetBanner({ onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white px-4 py-2.5 flex items-center justify-between shadow-lg"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 max-w-5xl mx-auto">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
        <span className="text-sm font-medium">
          <strong>DollarFlow Testnet Preview</strong> — Uses Base Sepolia test USDC only. 
          Test assets have no monetary value. Do not use DollarFlow for real financial transactions.
        </span>
      </div>
      <button
        onClick={() => {
          setDismissed(true);
          onDismiss?.();
        }}
        className="p-1 rounded hover:bg-white/20 transition-colors flex-shrink-0 ml-4"
        aria-label="Dismiss testnet banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}