import { Copy, Check, QrCode, Link2, Share2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function ReceiveQRCode({ 
  address, 
  token = 'USDC', 
  chainId = 84532,
  requestedAmount,
}) {
  const [copied, setCopied] = useState(false);
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [amount, setAmount] = useState(requestedAmount || '');

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  const paymentLink = `${window.location.origin}/receive?address=${address}&token=${token}&chainId=${chainId}${amount ? `&amount=${amount}` : ''}`;

  const copyToClipboard = async (text, label = 'Copied!') => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const generateLink = () => {
    const link = `${window.location.origin}/receive?address=${address}&token=${token}&chainId=${chainId}${amount ? `&amount=${amount}` : ''}`;
    copyToClipboard(link, 'Link copied!');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div className="qr-glow inline-block p-4 rounded-2xl bg-white mb-4">
          <QRCodeSVG
            value={address}
            size={180}
            level="M"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#0A0B0D"
          />
        </div>
        <p className="text-sm text-muted-foreground mb-1">Your {token} Address</p>
        <p className="text-base font-mono text-foreground mb-2">{address}</p>
        <p className="text-xs text-muted-foreground">Base Sepolia (Chain ID: {chainId})</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => copyToClipboard(address, 'Address copied!')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-background hover:bg-secondary transition-colors"
        >
          <Copy className="w-4 h-4" />
          <span>{copied === 'Address copied!' ? 'Copied!' : 'Copy Address'}</span>
        </button>
        <button
          onClick={generateLink}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-background hover:bg-secondary transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Link</span>
        </button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 text-amber-800 mb-3">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">Testnet Only</span>
        </div>
        <p className="text-sm text-amber-700">
          Only Base Sepolia test {token} is supported. Test assets have no monetary value.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#0052FF]" />
          Request Payment
        </h3>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                className="w-full pl-7 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
              />
            </div>
            <button
              onClick={generateLink}
              className="px-4 py-3 rounded-xl bg-[#0052FF] text-white font-medium hover:bg-[#0040CC] transition-colors"
            >
              Generate Link
            </button>
          </div>
          
          {amount && (
            <p className="text-xs text-muted-foreground text-center">
              Payment request link for ${parseFloat(amount).toFixed(2)} {token}
            </p>
          )}
          
          <p className="text-xs text-muted-foreground text-center">
            This is a request only — not an invoice or guarantee of payment.
          </p>
        </div>
      </div>
    </div>
  );
}