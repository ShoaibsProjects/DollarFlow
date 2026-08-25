import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, DollarSign, Send as SendIcon, Check, Loader2, ChevronRight, ExternalLink, Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useWallet } from '@/hooks/useWallet';
import { useWalletVerification } from '@/hooks/useWalletVerification';
import { useUSDCTransfer } from '@/hooks/useUSDCTransfer';
import { useTransactionVerification } from '@/hooks/useTransactionVerification';
import WalletVerificationCard from '../components/WalletVerificationCard.jsx';
import TransferReviewModal from '../components/TransferReviewModal.jsx';
import TransactionStatusTimeline from '../components/TransactionStatusTimeline.jsx';
import SafetyDisclosureModal from '../components/SafetyDisclosureModal.jsx';
import SupportTicketForm from '../components/SupportTicketForm.jsx';
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fallbackContacts = [
  { name: "Maria Santos", relationship: "Mom", color: "#FF6B9D" },
  { name: "Carlos Reyes", relationship: "Brother", color: "#4ECDC4" },
  { name: "Ana Gutierrez", relationship: "Sister", color: "#FFE66D" },
  { name: "James Okafor", relationship: "Friend", color: "#A78BFA" },
  { name: "Priya Sharma", relationship: "Colleague", color: "#00D395" },
];

export default function SendMoney() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [customAddress, setCustomAddress] = useState("");
  const [contacts, setContacts] = useState(fallbackContacts);
  const [hasPin, setHasPin] = useState(false);
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyAccepted, setSafetyAccepted] = useState(false);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [supportTransactionId, setSupportTransactionId] = useState(null);

  // Wallet verification hook
  const {
    isConnected,
    address: walletAddress,
    isCorrectChain,
    linkedWallets,
    activeWallet,
    isLoading: walletLoading,
    error: walletError,
    nonceData,
    requestNonce,
    verifyWallet,
    selectWallet,
    ensureBaseSepolia,
    clearError: clearWalletError,
  } = useWalletVerification();

  // USDC Transfer hook
  const {
    createIntent,
    sendUSDC,
    submitHash,
    verifyTransaction,
    reset: resetTransfer,
    intent,
    txHash,
    status: transferStatus,
    verificationResult,
    error: transferError,
    isWriting,
    isConfirming,
    isVerifying,
    getStatusMessage,
    formatAmount,
    parseAmount,
  } = useUSDCTransfer();

  // Transaction verification hook
  const { verification, getStatusInfo } = useTransactionVerification(intent?.id);

  // Load family members as contacts + check PIN status
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const [vaultRes, pinRes] = await Promise.all([
          axios.get(`${API}/family-vault`, { withCredentials: true }),
          axios.get(`${API}/security/pin/status`, { withCredentials: true }),
        ]);
        if (vaultRes.data.members?.length > 0) {
          const familyContacts = vaultRes.data.members.map(m => ({
            name: m.name,
            relationship: m.relationship,
            color: m.avatar_color,
            memberId: m.id,
          }));
          setContacts([...familyContacts, ...fallbackContacts]);
        }
        setHasPin(pinRes.data.has_pin);
      } catch { /* use fallback */ }
    };
    loadContacts();
  }, []);

  // Auto-request nonce when wallet connects
  useEffect(() => {
    if (isConnected && walletAddress && linkedWallets.length === 0 && !nonceData) {
      requestNonce(walletAddress);
    }
  }, [isConnected, walletAddress, linkedWallets.length, nonceData, requestNonce]);

  // Handle step 3 -> 4 transition after verification
  useEffect(() => {
    if (verificationResult && step === 3) {
      if (verificationResult.status === 'CONFIRMED') {
        setStep(4);
        toast.success("Transfer confirmed on-chain!");
      } else if (verificationResult.status === 'FAILED') {
        setStep(4);
        toast.error("Transfer failed on-chain");
      } else if (verificationResult.status === 'EXCEPTION_MISMATCH') {
        setStep(4);
        toast.error("Transfer mismatch - review required");
      }
    }
  }, [verificationResult, step]);

  const fee = 0.03;
  const totalAmount = amount ? parseFloat(amount) + fee : 0;
  const selectedSenderWallet = activeWallet?.wallet_address || walletAddress;

  const isOnChainAddress = (addr) => addr?.startsWith('0x') && addr?.length === 42;
  const isOnChainSend = isConnected && isCorrectChain && isOnChainAddress(customAddress);

  const attemptSend = () => {
    if (!safetyAccepted) {
      setShowSafetyModal(true);
      return;
    }
    if (hasPin && !isOnChainSend) {
      setPinValue("");
      setPinPromptOpen(true);
    } else {
      handleSend();
    }
  };

  const confirmPinAndSend = () => {
    setPinPromptOpen(false);
    handleSend(pinValue);
  };

  const handleSend = useCallback(async (pin) => {
    if (!selectedSenderWallet) {
      toast.error("Please select a sender wallet");
      return;
    }
    if (!recipient && !customAddress) {
      toast.error("Please select a recipient");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const recipientWallet = recipient?.name === customAddress ? customAddress : (customAddress || recipient?.memberId ? `0x${customAddress}` : recipient?.name);
    const actualRecipient = isOnChainSend ? customAddress : (recipient?.memberId ? `family_${recipient.memberId}` : customAddress);

    try {
      // Step 1: Create intent
      const createdIntent = await createIntent({
        recipientWallet: actualRecipient,
        amount,
        purpose: `Send to ${recipient?.name || 'External'}`,
        senderWallet: selectedSenderWallet,
      });

      // Step 2: Sign and send via wallet
      const amountAtomic = parseAmount(amount);
      await sendUSDC({ amountAtomic, recipientWallet: actualRecipient });

      // Step 3: Submit hash to backend
      await submitHash();

      // Step 4: Verify (triggered automatically by useEffect on isConfirmed)
      await verifyTransaction();

    } catch (err) {
      toast.error(err.message || "Failed to send transfer");
      resetTransfer();
      setStep(1);
    }
  }, [createIntent, sendUSDC, submitHash, verifyTransaction, resetTransfer, parseAmount, selectedSenderWallet, recipient, customAddress, amount, isOnChainSend]);

  const handleSafetyAccept = (accepted) => {
    setSafetyAccepted(accepted);
    if (accepted) {
      setTimeout(() => {
        setShowSafetyModal(false);
        attemptSend();
      }, 100);
    }
  };

  const handleSupportSubmit = (caseData) => {
    setShowSupportForm(false);
    toast.success("Support case submitted");
  };

  const openSupportForMismatch = () => {
    setSupportTransactionId(intent?.id);
    setShowSupportForm(true);
  };

  return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto" data-testid="send-money-page">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => step > 1 && step < 4 ? setStep(step - 1) : navigate('/dashboard')}
          className="p-2 rounded-xl hover:bg-secondary transition-colors" data-testid="send-back-btn">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-heading text-xl font-bold text-foreground">Send Money</h1>
      </div>

      {/* Progress */}
      {step < 4 && (
        <div className="flex gap-2 mb-8">
          {[1,2,3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-[#0052FF]' : 'bg-secondary'}`} />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Amount */}
        {step === 1 && (
          <motion.div key="amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground mb-4">Enter amount</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-heading font-bold text-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  data-testid="send-amount-input"
                  className="text-4xl lg:text-5xl font-heading font-bold text-foreground bg-transparent outline-none w-48 text-center"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground mt-4">Fee: ${fee} | Total: ${totalAmount.toFixed(2)}</p>
            </div>
            <Button
              onClick={() => {
                if (!isConnected || !isCorrectChain) {
                  setShowSafetyModal(true);
                } else {
                  setStep(2);
                }
              }}
              disabled={!amount || parseFloat(amount) <= 0}
              data-testid="send-continue-btn"
              className="w-full bg-[#0052FF] hover:bg-[#0040CC] text-white rounded-full py-6 font-semibold"
            >
              Continue <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Recipient */}
        {step === 2 && (
          <motion.div key="recipient" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="text-sm text-muted-foreground mb-4">Choose recipient</p>
            <div className="space-y-2 mb-6">
              {contacts.map((contact, i) => (
                <button
                  key={i}
                  onClick={() => { setRecipient(contact); setStep(3); }}
                  data-testid={`contact-${i}`}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    recipient?.name === contact.name ? 'border-[#0052FF] bg-[#0052FF]/5' : 'border-border hover:border-[#0052FF]/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ background: contact.color }}>
                    {contact.name[0]}
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm font-medium text-foreground">{contact.name}</div>
                    <div className="text-xs text-muted-foreground">{contact.relationship}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="px-3 bg-background text-xs text-muted-foreground">or enter address</span></div>
            </div>

            <Input
              placeholder="Wallet address (0x...)"
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              data-testid="custom-address-input"
              className="rounded-xl mb-4"
            />
            <Button
              onClick={() => { 
                setRecipient({ name: customAddress || "External", relationship: "Custom" }); 
                setStep(3); 
              }}
              disabled={!customAddress || !isOnChainAddress(customAddress)}
              variant="outline"
              className="w-full rounded-full"
            >
              Send to address
            </Button>
          </motion.div>
        )}

        {/* Step 3: Review & Sign */}
        {step === 3 && (
          <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <WalletVerificationCard
              isConnected={isConnected}
              address={walletAddress}
              isCorrectChain={isCorrectChain}
              linkedWallets={linkedWallets}
              activeWallet={activeWallet}
              isLoading={walletLoading}
              error={walletError}
              nonceData={nonceData}
              requestNonce={requestNonce}
              verifyWallet={verifyWallet}
              selectWallet={selectWallet}
              ensureBaseSepolia={ensureBaseSepolia}
              clearError={clearWalletError}
            />

            <TransferReviewModal
              isOpen={true}
              onClose={() => {}}
              onConfirm={attemptSend}
              amount={amount}
              recipientAddress={customAddress || recipient?.name || 'Unknown'}
              senderAddress={selectedSenderWallet}
              chainConfig={{
                chainId: 84532,
                rpcUrl: 'https://sepolia.base.org',
                explorerUrl: 'https://sepolia.basescan.org',
                usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
                usdcDecimals: 6,
                usdcSymbol: 'USDC',
              }}
              policyResult={intent?.policy_result}
              gasEstimate={null}
              intentExpiry={intent?.expires_at * 1000}
              isLoading={isWriting || isConfirming}
            />

            <TransactionStatusTimeline
              status={verificationResult?.status || intent?.status || 'PENDING_SIGNATURE'}
              txHash={txHash}
              verificationResult={verificationResult}
              intentCreatedAt={intent?.created_at}
              intentConfirmedAt={intent?.confirmed_at}
            />

            {verificationResult?.status === 'EXCEPTION_MISMATCH' && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-800 font-medium mb-2">Verification Mismatch Detected</p>
                <p className="text-xs text-red-700 mb-3">
                  The on-chain transaction does not match the expected transfer. This could indicate an error or issue.
                </p>
                <Button
                  variant="outline"
                  onClick={openSupportForMismatch}
                  className="w-full"
                >
                  Report Issue / Get Help
                </Button>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => {
                  setStep(1);
                  setAmount("");
                  setRecipient(null);
                  setCustomAddress("");
                  resetTransfer();
                }}
                variant="outline"
                className="flex-1 rounded-full"
                data-testid="send-reset-btn"
              >
                Start Over
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Result */}
        {step === 4 && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                verificationResult?.status === 'CONFIRMED' ? 'bg-green-100 text-green-600' :
                verificationResult?.status === 'EXCEPTION_MISMATCH' ? 'bg-amber-100 text-amber-600' :
                'bg-red-100 text-red-600'
              }`}
            >
              {verificationResult?.status === 'CONFIRMED' ? (
                <Check className="w-10 h-10" />
              ) : verificationResult?.status === 'EXCEPTION_MISMATCH' ? (
                <AlertTriangle className="w-10 h-10" />
              ) : (
                <X className="w-10 h-10" />
              )}
            </motion.div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
              {verificationResult?.status === 'CONFIRMED' ? 'Transfer Confirmed!' :
               verificationResult?.status === 'EXCEPTION_MISMATCH' ? 'Verification Mismatch' :
               'Transfer Failed'}
            </h2>
            <p className="text-muted-foreground mb-1">${parseFloat(amount).toFixed(2)} to {recipient?.name || customAddress}</p>
            
            {txHash && (
              <div className="mb-8">
                <p className="text-xs text-[#00D395] mb-2">
                  {verificationResult?.status === 'CONFIRMED' ? 'Transaction confirmed on-chain!' : 
                   verificationResult?.status === 'EXCEPTION_MISMATCH' ? 'Transaction found but details mismatch' : 
                   'Transaction failed on-chain'}
                </p>
                <a
                  href={`https://sepolia.basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#0052FF] hover:underline font-mono"
                >
                  {txHash.slice(0, 10)}...{txHash.slice(-8)} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => navigate('/dashboard')} variant="outline" className="flex-1 rounded-full" data-testid="send-done-btn">
                Back to Home
              </Button>
              <Button onClick={() => { setStep(1); setAmount(""); setRecipient(null); setCustomAddress(""); resetTransfer(); }}
                className="flex-1 bg-[#0052FF] hover:bg-[#0040CC] text-white rounded-full" data-testid="send-another-btn">
                Send More
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safety Disclosure Modal */}
      <SafetyDisclosureModal
        isOpen={showSafetyModal}
        onClose={() => { setShowSafetyModal(false); setSafetyAccepted(false); }}
        onAccept={handleSafetyAccept}
        accepted={safetyAccepted}
      />

      {/* PIN Verification Dialog */}
      {pinPromptOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" data-testid="pin-prompt-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[#0052FF]/10 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-[#0052FF]" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">Enter PIN</h3>
              <p className="text-xs text-muted-foreground mt-1">Confirm your transaction PIN to send ${amount}</p>
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter PIN"
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
              data-testid="send-pin-input"
              className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 rounded-xl border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-[#0052FF] mb-4"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPinPromptOpen(false)}
                className="flex-1 rounded-full"
                data-testid="pin-cancel-btn"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmPinAndSend}
                disabled={pinValue.length < 4}
                className="flex-1 bg-[#0052FF] hover:bg-[#0040CC] text-white rounded-full"
                data-testid="pin-confirm-send-btn"
              >
                Confirm
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Support Form Modal */}
      {showSupportForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold text-foreground">Report Issue</h2>
              <button onClick={() => setShowSupportForm(false)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SupportTicketForm
              onClose={() => setShowSupportForm(false)}
              preselectedTransactionId={supportTransactionId}
              onSubmit={handleSupportSubmit}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}