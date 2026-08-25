import { 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Check, 
  Radio, 
  Trash2, 
  Shield 
} from 'lucide-react';
import { useState } from 'react';

export default function WalletVerificationCard({ 
  isConnected, 
  address, 
  isCorrectChain, 
  linkedWallets, 
  activeWallet,
  isLoading, 
  error, 
  nonceData,
  requestNonce, 
  verifyWallet, 
  selectWallet, 
  unlinkWallet, 
  ensureBaseSepolia,
  clearError 
}) {
  const [verifyingAddress, setVerifyingAddress] = useState(null);
  const [unlinkingAddress, setUnlinkingAddress] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState(null);

  const shortAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleCopy = async (addr) => {
    await navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleVerify = async (walletAddress) => {
    setVerifyingAddress(walletAddress);
    try {
      await verifyWallet(walletAddress);
    } finally {
      setVerifyingAddress(null);
    }
  };

  const handleUnlink = async (walletAddress) => {
    setUnlinkingAddress(walletAddress);
    try {
      await unlinkWallet(walletAddress);
    } finally {
      setUnlinkingAddress(null);
    }
  };

  const handleSelect = async (walletAddress) => {
    await selectWallet(walletAddress);
  };

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Connect Wallet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your wallet to enable on-chain USDC transfers on Base Sepolia
        </p>
        <button
          onClick={ensureBaseSepolia}
          className="bg-[#0052FF] hover:bg-[#0040CC] text-white px-6 py-3 rounded-full font-medium transition-colors"
        >
          Connect & Switch to Base Sepolia
        </button>
      </div>
    );
  }

  if (!isCorrectChain) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
        <h3 className="text-lg font-semibold text-amber-800 mb-2">Wrong Network</h3>
        <p className="text-sm text-amber-700 mb-4">
          Please switch to Base Sepolia (Chain ID: 84532) to use on-chain features
        </p>
        <button
          onClick={ensureBaseSepolia}
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
        >
          Switch to Base Sepolia
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-[#0052FF]" />
        <h3 className="font-semibold text-foreground">Wallet Verification</h3>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
          <button onClick={clearError} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <div className="space-y-3 mb-6">
        <p className="text-xs text-muted-foreground">
          Verify ownership of your wallet by signing a message. 
          <strong>This is NOT a blockchain transaction and will NOT move any funds.</strong>
        </p>
        <p className="text-xs text-muted-foreground">
          DollarFlow never receives or stores your private key.
        </p>
      </div>

      {nonceData && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-800 font-medium mb-1">Sign this message in your wallet:</p>
          <pre className="text-xs text-blue-700 whitespace-pre-wrap font-mono bg-blue-100 p-2 rounded max-h-32 overflow-auto">
            {nonceData.message_template}
          </pre>
          <button
            onClick={() => handleVerify(address)}
            disabled={isLoading || verifyingAddress === address}
            className="mt-3 w-full bg-[#0052FF] hover:bg-[#0040CC] text-white py-2 rounded-full font-medium transition-colors disabled:opacity-50"
          >
            {verifyingAddress === address ? (
              <>Signing... <Loader2 className="ml-2 w-4 h-4 animate-spin" /></>
            ) : (
              'Sign to Verify Ownership'
            )}
          </button>
        </div>
      )}

      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Linked Wallets</h4>
        
        {linkedWallets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No wallets linked yet. Verify ownership above to link your wallet.
          </p>
        ) : (
          <div className="space-y-2">
            {linkedWallets.map((wallet) => (
              <div
                key={wallet.wallet_address}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  wallet.wallet_address === activeWallet?.wallet_address
                    ? 'border-[#0052FF] bg-[#0052FF]/5'
                    : 'border-border hover:border-[#0052FF]/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0052FF]/10 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-[#0052FF]" />
                  </div>
                  <div>
                    <div className="font-mono text-sm text-foreground">
                      {shortAddress(wallet.wallet_address)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {wallet.status === 'active' ? 'Verified' : 'Unlinked'}
                      {wallet.verified_at && ` • ${new Date(wallet.verified_at * 1000).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(wallet.wallet_address)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    aria-label="Copy address"
                  >
                    {copiedAddress === wallet.wallet_address ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {wallet.wallet_address !== activeWallet?.wallet_address && (
                    <button
                      onClick={() => handleSelect(wallet.wallet_address)}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                      aria-label="Set as active"
                    >
                      <Radio className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleUnlink(wallet.wallet_address)}
                    disabled={unlinkingAddress === wallet.wallet_address}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                    aria-label="Unlink wallet"
                  >
                    {unlinkingAddress === wallet.wallet_address ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}