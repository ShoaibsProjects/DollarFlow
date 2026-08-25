import { X, AlertTriangle, Shield, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DISCLOSURES = [
  {
    icon: AlertTriangle,
    title: 'Testnet Only',
    description: 'DollarFlow V1 uses Base Sepolia testnet USDC only. Test assets have no monetary value and cannot be exchanged for real currency.',
  },
  {
    icon: Shield,
    title: 'Non-Custodial',
    description: 'You hold your own private keys. DollarFlow never receives, stores, or has access to your seed phrase, private keys, or wallet credentials.',
  },
  {
    icon: Info,
    title: 'Irreversible Transfers',
    description: 'Blockchain transfers cannot be reversed once confirmed. Always verify the recipient address before signing. DollarFlow cannot recover funds sent to the wrong address.',
  },
  {
    icon: Info,
    title: 'No Financial Services',
    description: 'DollarFlow V1 is a prototype. It does not provide banking, exchange, remittance, custody, or any regulated financial services. No KYC, AML, or sanctions screening is performed.',
  },
  {
    icon: AlertTriangle,
    title: 'No Guarantees',
    description: 'No promises of uptime, transaction speed, settlement finality, or fee amounts. The Base Sepolia public RPC is rate-limited and not suitable for production use.',
  },
  {
    icon: Shield,
    title: 'Support Limitations',
    description: 'Support is provided for prototype testing only. No account recovery, dispute resolution, or financial advisory services are available.',
  },
];

export default function SafetyDisclosureModal({ isOpen, onClose, onAccept, accepted }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">Safety Disclosures</h2>
                <p className="text-sm text-muted-foreground">Please read and acknowledge before proceeding</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {DISCLOSURES.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3 p-4 rounded-xl bg-background border border-border"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}

            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800 font-medium mb-2">
                By proceeding, you acknowledge that you have read and understand the above disclosures.
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => onAccept(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  required
                />
                <span className="text-sm text-amber-900">
                  I understand and accept the risks of using this testnet prototype
                </span>
              </label>
            </div>
          </div>

          <div className="px-6 pb-6 pt-0">
            <button
              onClick={() => onClose()}
              disabled={!accepted}
              className="w-full bg-[#0052FF] hover:bg-[#0040CC] text-white py-3 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}