import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, DollarSign, Send as SendIcon, Check, Loader2, ChevronRight, Lock, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card } from '@/shared/ui/card';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/shared/hooks/useWallet';
import { useWalletVerification } from '@/shared/hooks/useWalletVerification';
import { useUSDCTransfer } from '@/shared/hooks/useUSDCTransfer';
import { WalletVerificationCard } from '@/shared/components/WalletVerificationCard';
import { TransferReviewModal } from '@/shared/components/TransferReviewModal';
import { TransactionStatusTimeline } from '@/shared/components/TransactionStatusTimeline';
import { SafetyDisclosureModal } from '@/shared/components/SafetyDisclosureModal';
import { SupportTicketForm } from '@/shared/components/SupportTicketForm';
import { toast } from '@/shared/ui/sonner';
import { formatCurrency } from '@/shared/lib/utils';

const fallbackContacts = [
  { name: 'Maria Santos', relationship: 'Mom', color: '#FF6B9D' },
  { name: 'Carlos Reyes', relationship: 'Brother', color: '#4ECDC4' },
  { name: 'Ana Gutierrez', relationship: 'Sister', color: '#FFE66D' },
  { name: 'James Okafor', relationship: 'Friend', color: '#A78BFA' },
  { name: 'Priya Sharma', relationship: 'Colleague', color: '#00D395' },
];

export function SendMoney() {
  const navigate = useNavigate();
  const { address, isConnected, isCorrectChain, ensureBaseSepolia } = useWallet();
  const { activeWallet, linkedWallets } = useWalletVerification();
  const { createTransferIntent, signAndSubmit, isSubmitting } = useUSDCTransfer();
  const [step, setStep] = useState<'contacts' | 'amount' | 'review' | 'signing' | 'verifying' | 'complete'>('contacts');
  const [selectedContact, setSelectedContact] = useState<{ name: string; color: string } | null>(null);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [intentId, setIntentId] = useState<string | null>(null);
  const [showSafetyDisclosure, setShowSafetyDisclosure] = useState(false);
  const [safetyAccepted, setSafetyAccepted] = useState(false);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContactSelect = (contact: { name: string; color: string }) => {
    setSelectedContact(contact);
    setStep('amount');
  };

  const handleAmountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    if (!activeWallet) {
      setError('Please verify your wallet first');
      return;
    }
    if (!isCorrectChain) {
      await ensureBaseSepolia();
      return;
    }
    setStep('review');
  };

  const handleReviewConfirm = async () => {
    if (!activeWallet || !selectedContact) return;
    
    try {
      const res = await createTransferIntent({
        recipient: selectedContact.name,
        amount: parseFloat(amount),
        memo,
      });
      setIntentId(res.intent_id);
      setStep('signing');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create transfer';
      setError(message);
      toast.error(message);
    }
  };

  const handleSignatureComplete = async (signature: string) => {
    if (!intentId) return;
    
    setStep('verifying');
    try {
      await signAndSubmit(intentId, signature);
      setStep('complete');
      toast.success(`Sent ${formatCurrency(parseFloat(amount))} to ${selectedContact?.name}!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transfer failed';
      toast.error(message);
      setStep('review');
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'amount': setStep('contacts'); break;
      case 'review': setStep('amount'); break;
      case 'signing': setStep('review'); break;
      case 'verifying': setStep('signing'); break;
      case 'complete': navigate('/dashboard'); break;
    }
  };

  const steps = [
    { key: 'contact', label: 'Recipient', icon: User },
    { key: 'amount', label: 'Amount', icon: DollarSign },
    { key: 'review', label: 'Review', icon: Check },
    { key: 'signing', label: 'Sign', icon: Lock },
    { key: 'verifying', label: 'Verify', icon: Shield },
    { key: 'complete', label: 'Done', icon: Check },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  if (!isConnected) {
    return (
      <div className="p-4 lg:p-8 max-w-lg mx-auto" data-testid="send-money-page">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-surface-elevated transition-colors" data-testid="send-back-btn">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-xl font-bold text-foreground">Send Money</h1>
        </div>

        <Card variant="default" className="p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Connect Wallet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Connect your wallet to send USDC on Base Sepolia
          </p>
          <Button onClick={ensureBaseSepolia} className="w-full bg-primary hover:bg-primary-hover text-white rounded-full">
            Connect & Switch to Base Sepolia
          </Button>
        </Card>
      </div>
    );
  }

  if (!isCorrectChain) {
    return (
      <div className="p-4 lg:p-8 max-w-lg mx-auto" data-testid="send-money-page">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-surface-elevated transition-colors" data-testid="send-back-btn">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-xl font-bold text-foreground">Send Money</h1>
        </div>

        <Card variant="default" className="p-8 text-center border-warning/30">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <h3 className="text-lg font-semibold text-warning mb-2">Wrong Network</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please switch to Base Sepolia (Chain ID: 84532) to send USDC
          </p>
          <Button onClick={ensureBaseSepolia} variant="secondary" className="w-full">
            Switch to Base Sepolia
          </Button>
        </Card>
      </div>
    );
  }

  if (!activeWallet) {
    return (
      <div className="p-4 lg:p-8 max-w-lg mx-auto" data-testid="send-money-page">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-surface-elevated transition-colors" data-testid="send-back-btn">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-xl font-bold text-foreground">Send Money</h1>
        </div>

        <Card variant="default" className="p-8 text-center">
          <WalletVerificationCard
            isConnected={true}
            address={address || ''}
            isCorrectChain={true}
            linkedWallets={linkedWallets}
            activeWallet={activeWallet}
            isLoading={false}
            error={null}
            nonceData={null}
            requestNonce={async () => {}}
            verifyWallet={async () => {}}
            selectWallet={() => {}}
            ensureBaseSepolia={ensureBaseSepolia}
            clearError={() => {}}
          />
        </Card>
      </div>
    );
  }

  const shortAddress = activeWallet?.wallet_address 
    ? `${activeWallet.wallet_address.slice(0, 6)}...${activeWallet.wallet_address.slice(-4)}` 
    : '';

  return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto" data-testid="send-money-page">
      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.key} className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                ${i < currentStepIndex ? 'bg-primary text-white' : i === currentStepIndex ? 'bg-primary/20 text-primary' : 'bg-surface-elevated text-muted-foreground'}
              `}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs mt-1 ${i <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div className="relative h-1 mt-4 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(currentStepIndex / (steps.length - 1), 1) * 100}%` }}
            transition={{ duration: 300, ease: [0.22, 1, 0.36, 1] as const }}
            className="absolute top-0 left-0 h-full bg-primary rounded-full"
          />
        </div>
      </motion.div>

      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleBack} className="p-2 rounded-xl hover:bg-surface-elevated transition-colors" data-testid="send-back-btn">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Send Money</h1>
      </div>

      {/* Wallet Status */}
      <Card variant="default" className="mb-6 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Sending from</p>
            <p className="text-xs text-muted-foreground font-mono">{shortAddress}</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success font-medium">Verified</span>
        </div>
      </Card>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 'contacts' && (
          <motion.div
            key="contacts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 200 }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">Who are you sending to?</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {fallbackContacts.map((contact, i) => (
                <motion.button
                  key={i}
                  onClick={() => handleContactSelect(contact)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl border border-border hover:border-primary/30 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2" style={{ background: contact.color }}>
                    {contact.name[0]}
                  </div>
                  <p className="text-sm font-medium text-foreground">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                </motion.button>
              ))}
              <motion.button
                key="add"
                onClick={() => setSelectedContact({ name: 'Custom', color: '#0052FF' })}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: fallbackContacts.length * 0.05 }}
                className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all text-center"
              >
                <ChevronRight className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Add Recipient</p>
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 'amount' && (
          <motion.div
            key="amount"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 200 }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">How much?</h3>
            <form onSubmit={handleAmountSubmit}>
              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-2xl font-medium">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="send-amount-input"
                  className="pl-10 text-2xl font-semibold text-center rounded-xl"
                  autoFocus
                />
              </div>
              <Input
                placeholder="Add a memo (optional)"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="mb-6 rounded-xl"
              />
              <Button
                type="submit"
                disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
                className="w-full bg-primary hover:bg-primary-hover text-white rounded-full py-5 text-lg"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Continue'}
              </Button>
            </form>
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 200 }}
          >
            <Card variant="default" className="p-5 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Transfer Review
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To</span>
                  <span className="text-foreground font-medium">{selectedContact?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-foreground font-medium text-xl">{formatCurrency(parseFloat(amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="text-success">{formatCurrency(0.03)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-foreground font-medium text-xl">{formatCurrency(parseFloat(amount) + 0.03)}</span>
                </div>
              </div>
            </Card>

            {!safetyAccepted && (
              <Button
                variant="secondary"
                className="w-full mb-3"
                onClick={() => setShowSafetyDisclosure(true)}
              >
                <AlertTriangle className="w-4 h-4 mr-2" /> Review Safety Disclosures
              </Button>
            )}

            <Button
              onClick={handleReviewConfirm}
              disabled={!safetyAccepted || isSubmitting}
              className="w-full bg-primary hover:bg-primary-hover text-white rounded-full py-5 text-lg"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Confirm & Sign'}
            </Button>
          </motion.div>
        )}

        {step === 'signing' && (
          <motion.div
            key="signing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 200 }}
          >
            <Card variant="default" className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">Sign Transaction</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Review and sign the transaction in your wallet to authorize the transfer.
              </p>
              <TransferReviewModal
                open={true}
                onClose={() => setStep('review')}
                onConfirm={handleSignatureComplete}
                intentId={intentId || ''}
                amount={parseFloat(amount)}
                recipient={selectedContact?.name || ''}
                fee={0.03}
              />
            </Card>
          </motion.div>
        )}

        {step === 'verifying' && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 200 }}
          >
            <Card variant="default" className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">Verifying on-chain</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Waiting for blockchain confirmation. This usually takes ~15 seconds.
              </p>
              <TransactionStatusTimeline
                status="confirming"
                steps={[
                  { key: 'intent_created', label: 'Intent Created', icon: Shield },
                  { key: 'wallet_signed', label: 'Wallet Signed', icon: Lock },
                  { key: 'submitted', label: 'Submitted', icon: SendIcon },
                  { key: 'confirming', label: 'Confirming...', icon: Loader2 },
                  { key: 'confirmed', label: 'Confirmed', icon: Check },
                ]}
              />
            </Card>
          </motion.div>
        )}

        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 300, ease: [0.34, 1.56, 0.64, 1] as const }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-success" />
            </motion.div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Transfer Complete!</h2>
            <p className="text-muted-foreground mb-2">
              Sent {formatCurrency(parseFloat(amount))} to {selectedContact?.name}
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Transaction verified on Base Sepolia
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-primary hover:bg-primary-hover text-white rounded-full px-8 py-3"
            >
              Done
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safety Disclosure Modal */}
      <SafetyDisclosureModal
        open={showSafetyDisclosure}
        onClose={() => setShowSafetyDisclosure(false)}
        onAccept={() => setSafetyAccepted(true)}
      />

      {/* Support Form Modal */}
      {showSupportForm && (
        <SupportTicketForm
          onClose={() => setShowSupportForm(false)}
          onSubmit={async () => { setShowSupportForm(false); }}
        />
      )}
    </div>
  );
}