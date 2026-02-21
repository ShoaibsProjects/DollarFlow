import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, QrCode, Link2, Share2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ReceiveMoney() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [requestAmount, setRequestAmount] = useState("");

  const walletAddress = `0x${(user?.user_id || 'default').replace(/[^a-f0-9]/gi, '').padEnd(40, '0').slice(0, 40)}`;
  const shortAddress = `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`;
  const paymentLink = `${window.location.origin}/pay/${walletAddress}${requestAmount ? `?amount=${requestAmount}` : ''}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto" data-testid="receive-money-page">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary transition-colors" data-testid="receive-back-btn">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-heading text-xl font-bold text-foreground">Receive Money</h1>
      </div>

      {/* QR Code */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6 text-center mb-6"
        data-testid="qr-section"
      >
        <div className="qr-glow inline-block p-6 rounded-2xl bg-white mb-4">
          <div className="w-48 h-48 bg-[#0A0B0D] rounded-xl flex items-center justify-center relative overflow-hidden">
            {/* Simple QR representation */}
            <div className="grid grid-cols-8 gap-0.5 p-4">
              {Array.from({ length: 64 }, (_, i) => (
                <div key={i} className={`w-4 h-4 rounded-sm ${Math.random() > 0.4 ? 'bg-black' : 'bg-white'}`} />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-[#0052FF] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">$</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-2">Your DollarFlow Address</p>
        <p className="text-sm font-mono text-foreground">{shortAddress}</p>
      </motion.div>

      {/* Copy Address */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Button
          onClick={() => copyToClipboard(walletAddress)}
          data-testid="copy-address-btn"
          className="w-full mb-3 rounded-full bg-[#0052FF] hover:bg-[#0040CC] text-white py-5"
        >
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copied!" : "Copy Address"}
        </Button>
      </motion.div>

      {/* Request Payment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-card p-5 mt-6"
        data-testid="request-payment-section"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#0052FF]" />
          Request Payment
        </h3>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              type="number"
              placeholder="0.00"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              data-testid="request-amount-input"
              className="pl-7 rounded-xl"
            />
          </div>
          <Button
            onClick={() => copyToClipboard(paymentLink)}
            variant="outline"
            className="rounded-xl"
            data-testid="share-link-btn"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Share this link to request a specific amount
        </p>
      </motion.div>
    </div>
  );
}
