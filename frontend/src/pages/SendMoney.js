import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, DollarSign, Send as SendIcon, Check, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

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
  const [sending, setSending] = useState(false);
  const [contacts, setContacts] = useState(fallbackContacts);

  // Load family members as contacts
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const res = await axios.get(`${API}/family-vault`, { withCredentials: true });
        if (res.data.members?.length > 0) {
          const familyContacts = res.data.members.map(m => ({
            name: m.name,
            relationship: m.relationship,
            color: m.avatar_color,
            memberId: m.id,
          }));
          setContacts(familyContacts);
        }
      } catch { /* use fallback */ }
    };
    loadContacts();
  }, []);

  const fee = 0.03;
  const totalAmount = amount ? parseFloat(amount) + fee : 0;

  const handleSend = async () => {
    setSending(true);
    try {
      // If recipient is a family member, use the dedicated endpoint to update their balance
      if (recipient?.memberId) {
        await axios.post(
          `${API}/family-vault/send/${recipient.memberId}`,
          { amount: parseFloat(amount) },
          { withCredentials: true }
        );
      } else {
        await axios.post(`${API}/transactions`, {
          type: "send",
          amount: parseFloat(amount),
          recipient_name: recipient?.name || "Unknown",
          recipient_address: customAddress || `0x${Math.random().toString(16).slice(2, 42)}`,
          category: "transfer"
        }, { withCredentials: true });
      }
      setStep(4);
      toast.success("Payment sent successfully!");
    } catch (err) {
      toast.error("Failed to send payment");
    } finally {
      setSending(false);
    }
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
              onClick={() => setStep(2)}
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
              placeholder="Wallet address or phone number"
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              data-testid="custom-address-input"
              className="rounded-xl mb-4"
            />
            <Button
              onClick={() => { setRecipient({ name: customAddress || "External", relationship: "Custom" }); setStep(3); }}
              disabled={!customAddress}
              variant="outline"
              className="w-full rounded-full"
            >
              Send to address
            </Button>
          </motion.div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="rounded-2xl border border-border bg-card p-6 mb-6" data-testid="send-review-card">
              <p className="text-sm text-muted-foreground mb-4">Review payment</p>
              <div className="text-center mb-6">
                <div className="font-heading text-4xl font-bold text-foreground mb-1">${parseFloat(amount).toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">to {recipient?.name}</div>
              </div>
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Network fee</span>
                  <span className="text-foreground">${fee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated time</span>
                  <span className="text-[#00D395]">~15 seconds</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-border pt-3">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={sending}
              data-testid="send-confirm-btn"
              className="w-full bg-[#0052FF] hover:bg-[#0040CC] text-white rounded-full py-6 font-semibold"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirm & Send <SendIcon className="ml-2 w-4 h-4" /></>}
            </Button>
          </motion.div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-[#00D395]/10 flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-[#00D395]" />
            </motion.div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Payment Sent!</h2>
            <p className="text-muted-foreground mb-1">${parseFloat(amount).toFixed(2)} to {recipient?.name}</p>
            <p className="text-xs text-[#00D395] mb-8">Confirmed in ~15 seconds</p>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/dashboard')} variant="outline" className="flex-1 rounded-full" data-testid="send-done-btn">
                Back to Home
              </Button>
              <Button onClick={() => { setStep(1); setAmount(""); setRecipient(null); }}
                className="flex-1 bg-[#0052FF] hover:bg-[#0040CC] text-white rounded-full" data-testid="send-another-btn">
                Send More
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
