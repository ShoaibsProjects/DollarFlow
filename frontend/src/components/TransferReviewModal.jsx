import { X, AlertTriangle, CheckCircle2, Clock, DollarSign, ExternalLink, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatUnits, parseUnits } from 'viem';
import { USDC_CONTRACT } from '@/config/contracts';
import { BASE_SEPOLIA_EXPLORER_URL } from '@/config/blockchain';

export default function TransferReviewModal({
  isOpen,
  onClose,
  onConfirm,
  amount,
  recipientAddress,
  senderAddress,
  chainConfig,
  policyResult,
  gasEstimate,
  intentExpiry,
  isLoading,
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const amountAtomic = parseUnits(amount, USDC_CONTRACT.decimals);
  const fee = '0.00';
  const totalAmount = parseFloat(amount) + parseFloat(fee);

  const shortAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="bg-card border border-border rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-heading text-lg font-bold text-foreground">Review Transfer</h3>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-6 h-6 text-[#00D395]" />
                <span className="font-heading text-3xl font-bold text-foreground">${parseFloat(amount).toFixed(2)}</span>
              </div>
              <p className="text-sm text-muted-foreground">USDC on Base Sepolia</p>
            </div>

            <div className="rounded-xl border border-border bg-background p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">To</span>
                <div className="flex items-center gap-2 text-foreground">
                  <span className="font-mono">{shortAddress(recipientAddress)}</span>
                  <a
                    href={`${BASE_SEPOLIA_EXPLORER_URL}/address/${recipientAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                <span className="text-muted-foreground">From</span>
                <span className="font-mono text-foreground">{shortAddress(senderAddress)}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                <span className="text-muted-foreground">Network</span>
                <span className="text-foreground">Base Sepolia (Testnet)</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                <span className="text-muted-foreground">Token Contract</span>
                <span className="font-mono text-xs text-foreground">{USDC_CONTRACT.address}</span>
              </div>
              {gasEstimate && (
                <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                  <span className="text-muted-foreground">Est. Gas</span>
                  <span className="text-foreground">~{gasEstimate} gwei</span>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-[#0052FF]/5 border border-[#0052FF]/20 p-3">
              <div className="flex items-center gap-2 text-xs text-[#0052FF] mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Testnet Transfer</span>
              </div>
              <p className="text-xs text-[#0052FF]/80">
                This uses Base Sepolia test USDC which has <strong>no monetary value</strong>. 
                Do not use for real financial transactions.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-foreground">${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">DollarFlow Fee</span>
                <span className="text-foreground">${fee}</span>
              </div>
              {policyResult && policyResult.assessment_status !== 'clear' && (
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Policy: {policyResult.assessment_status}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-center gap-2 text-sm text-amber-800 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Important Warnings</span>
              </div>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>Blockchain transfers are irreversible after wallet confirmation</li>
                <li>Verify the recipient address carefully before proceeding</li>
                <li>Testnet tokens have no financial value</li>
                <li>Intent expires in {Math.ceil((intentExpiry - Date.now() / 1000) / 60)} minutes</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-border text-[#0052FF] focus:ring-[#0052FF]"
              />
              <div className="text-sm text-foreground">
                <strong>I understand this is a testnet-only transfer using tokens with no financial value.</strong>
                <br />
                I have verified the recipient address and accept that blockchain transfers are irreversible.
              </div>
            </label>

            <button
              onClick={() => acknowledged && onConfirm()}
              disabled={!acknowledged || isLoading}
              className="w-full bg-[#0052FF] hover:bg-[#0040CC] text-white py-3 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>Confirming... <Loader2 className="ml-2 w-4 h-4 animate-spin" /></>
              ) : (
                'Confirm & Sign with Wallet'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}