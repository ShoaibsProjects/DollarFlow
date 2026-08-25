import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Link2, Share2, ArrowLeft, AlertTriangle, QrCode, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWalletVerification } from "@/hooks/useWalletVerification";
import { toast } from "sonner";
import { QRCodeSVG } from 'qrcode.react';
import { BASE_SEPOLIA_EXPLORER_URL } from '@/config/blockchain';

export default function ReceiveMoney() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeWallet, linkedWallets, isConnected, isCorrectChain, ensureBaseSepolia } = useWalletVerification();
  const [copied, setCopied] = useState(false);
  const [requestAmount, setRequestAmount] = useState("");
  const [selectedWallet, setSelectedWallet] = useState(null);

  const walletAddress = activeWallet?.wallet_address || (linkedWallets[0]?.wallet_address) || null;
  const shortAddress = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '';
  
  const paymentLink = walletAddress 
    ? `${window.location.origin}/receive?address=${walletAddress}&token=USDC&chainId=84532${requestAmount ? `&amount=${requestAmount}` : ''}`
    : null;

  const copyToClipboard = async (text, label = 'Copied!') => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (walletAddress && !selectedWallet) {
      setSelectedWallet(walletAddress);
    }
  }, [walletAddress, selectedWallet]);

  if (!isConnected) {
    return (
      <div className="p-4 lg:p-8 max-w-lg mx-auto" data-testid="receive-money-page">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary transition-colors" data-testid="receive-back-btn">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-heading text-xl font-bold text-foreground">Receive Money</h1>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <QrCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Connect Wallet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Connect your wallet to receive USDC on Base Sepolia
          </p>
          <button
            onClick={ensureBaseSepolia}
            className="bg-[#0052FF] hover:bg-[#0040CC] text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            Connect & Switch to Base Sepolia
          </button>
        </div>
      </div>
    );
  }

  if (!isCorrectChain) {
    return (
      <div className="p-4 lg:p-8 max-w-lg mx-auto" data-testid="receive-money-page">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary transition-colors" data-testid="receive-back-btn">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-heading text-xl font-bold text-foreground">Receive Money</h1>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Wrong Network</h3>
          <p className="text-sm text-amber-700 mb-4">
            Please switch to Base Sepolia (Chain ID: 84532) to receive USDC
          </p>
          <button
            onClick={ensureBaseSepolia}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            Switch to Base Sepolia
          </button>
        </div>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className="p-4 lg:p-8 max-w-lg mx-auto" data-testid="receive-money-page">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary transition-colors" data-testid="receive-back-btn">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-heading text-xl font-bold text-foreground">Receive Money</h1>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <QrCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Verify Wallet Ownership</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Please verify your wallet on the Send page first to link it to your account
          </p>
        </div>
      </div>
    );
  }

  const handleAmountChange = (e) => {
    setRequestAmount(e.target.value);
  };

  const generateLink = () => {
    const link = `${window.location.origin}/receive?address=${walletAddress}&token=USDC&chainId=84532${requestAmount ? `&amount=${requestAmount}` : ''}`;
    copyToClipboard(link, 'Link copied!');
  };

  return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto" data-testid="receive-money-page">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary transition-colors" data-testid="receive-back-btn">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-heading text-xl font-bold text-foreground">Receive Money</h1>
      </div>

      {/* Wallet Selector */}
      {linkedWallets.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">Receiving Wallet</label>
          <select
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
          >
            {linkedWallets.map((w) => (
              <option key={w.wallet_address} value={w.wallet_address}>
                {w.wallet_address.slice(0, 6)}...{w.wallet_address.slice(-4)} {w.is_default ? '(Default)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* QR Code */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6 text-center mb-6"
        data-testid="qr-section"
      >
        <div className="qr-glow inline-block p-4 rounded-2xl bg-white mb-4">
          <QRCodeSVG
            value={walletAddress}
            size={180}
            level="M"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#0A0B0D"
          />
        </div>
        <p className="text-sm text-muted-foreground mb-2">Your USDC Address</p>
        <p className="text-sm font-mono text-foreground mb-1">{walletAddress}</p>
        <p className="text-xs text-muted-foreground">Base Sepolia (Chain ID: 84532)</p>
        <a
          href={`${BASE_SEPOLIA_EXPLORER_URL}/address/${walletAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[#0052FF] hover:underline mt-2"
        >
          View on BaseScan <ExternalLink className="w-3 h-3" />
        </a>
      </motion.div>

      {/* Copy Address */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Button
          onClick={() => copyToClipboard(walletAddress, 'Address copied!')}
          data-testid="copy-address-btn"
          className="w-full mb-3 rounded-full bg-[#0052FF] hover:bg-[#0040CC] text-white py-5"
        >
          {copied === 'Address copied!' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
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
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={requestAmount}
              onChange={handleAmountChange}
              data-testid="request-amount-input"
              className="pl-7 rounded-xl"
            />
          </div>
          <Button
            onClick={generateLink}
            variant="outline"
            className="rounded-xl"
            data-testid="share-link-btn"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
        
        {requestAmount && paymentLink && (
          <p className="text-xs text-muted-foreground text-center mb-2">
            Payment request for ${parseFloat(requestAmount).toFixed(2)} USDC
          </p>
        )}
        
        <p className="text-xs text-muted-foreground text-center">
          This is a request only — not an invoice or guarantee of payment.
        </p>
      </motion.div>

      {/* Testnet Warning */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-amber-200 bg-amber-50 p-4"
      >
        <div className="flex items-center gap-2 text-amber-800 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">Testnet Only</span>
        </div>
        <p className="text-sm text-amber-700">
          Only Base Sepolia test USDC is supported. Test assets have no monetary value.
        </p>
      </motion.div>
    </div>
  );
}