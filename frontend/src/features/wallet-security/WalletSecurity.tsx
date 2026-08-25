import { 
  Shield, AlertTriangle, Lock, Key, Eye, 
  Wallet, Link2, ExternalLink, ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Card } from '@/shared/ui/card';
import { useWalletVerification } from '@/shared/hooks/useWalletVerification';
import { WalletVerificationCard } from '@/shared/components/WalletVerificationCard';
import { BASE_SEPOLIA_EXPLORER_URL } from '@/shared/config/blockchain';

const SECURITY_TOPICS = [
  {
    icon: Lock,
    title: 'Never Share Your Seed Phrase',
    description: 'Your seed phrase (recovery phrase) is the master key to your wallet. DollarFlow support will NEVER ask for it. Anyone with your seed phrase has full control of your funds.',
    action: 'Store it offline in a secure location. Never enter it on any website.',
  },
  {
    icon: Key,
    title: 'Private Keys Stay Private',
    description: 'Your private keys never leave your browser. DollarFlow uses your wallet (MetaMask, Coinbase Wallet, etc.) to sign transactions directly. We never see, store, or transmit your private keys.',
    action: 'Use a hardware wallet for large amounts. Keep your wallet software updated.',
  },
  {
    icon: Eye,
    title: 'Verify Recipient Addresses',
    description: 'Blockchain transfers are irreversible. Always double-check the recipient address before confirming. Check the first 6 and last 4 characters at minimum.',
    action: 'Copy addresses from trusted sources. Use QR codes when possible. Beware of address poisoning attacks.',
  },
  {
    icon: AlertTriangle,
    title: 'Testnet Tokens Have No Value',
    description: 'DollarFlow V1 uses Base Sepolia test USDC only. These tokens have NO monetary value and cannot be exchanged for real USDC, fiat currency, or goods.',
    action: 'Do not send real funds to testnet addresses. Do not accept testnet tokens as payment.',
  },
  {
    icon: Shield,
    title: 'Transaction Status Meanings',
    description: 'Understand what each status means:',
    details: [
      { status: 'Pending Signature', meaning: 'Waiting for you to sign the transaction in your wallet' },
      { status: 'Submitted', meaning: 'Transaction sent to Base Sepolia, waiting for verification' },
      { status: 'Confirming...', meaning: 'Backend is verifying the on-chain receipt and Transfer event' },
      { status: 'Confirmed', meaning: 'Transfer verified on-chain — matches intent exactly' },
      { status: 'Failed', meaning: 'Transaction reverted on-chain or verification timeout' },
      { status: 'Mismatch', meaning: 'On-chain transaction does not match expected details — review required' },
      { status: 'Expired', meaning: 'Intent expired before transaction was submitted' },
      { status: 'Cancelled', meaning: 'Cancelled before submission' },
    ],
  },
  {
    icon: AlertTriangle,
    title: 'If Your Wallet Transaction Is Rejected',
    description: 'Common reasons and solutions:',
    details: [
      { status: 'Insufficient USDC balance', meaning: 'Get test USDC from Base Sepolia faucet' },
      { status: 'Insufficient ETH for gas', meaning: 'Get test ETH from Base Sepolia faucet' },
      { status: 'Wrong network', meaning: 'Switch to Base Sepolia (Chain ID 84532)' },
      { status: 'Nonce too low/high', meaning: 'Reset wallet account in MetaMask settings' },
      { status: 'RPC rate limited', meaning: 'Wait a moment and retry — public RPC has limits' },
    ],
  },
  {
    icon: Link2,
    title: 'If You Sent to the Wrong Address',
    description: 'Blockchain transactions cannot be reversed. However:',
    details: [
      { status: 'If address is a known exchange/contract', meaning: 'Contact their support immediately with tx hash' },
      { status: 'If address is another user', meaning: 'Contact them directly if possible' },
      { status: 'Always verify', meaning: 'Use the mismatch report feature in the app' },
    ],
  },
  {
    icon: Shield,
    title: 'Report Suspicious Activity',
    description: 'If you encounter phishing, fake DollarFlow sites, or suspicious wallet addresses:',
    action: 'Use the Support page to file a Suspicious Activity Report. Include the wallet address, transaction hash, and screenshots.',
  },
];

export function WalletSecurity() {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const { linkedWallets, activeWallet } = useWalletVerification();

  const toggleExpand = (index: number) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Wallet Security Center</h1>
        <p className="text-muted-foreground">
          Learn how to keep your funds safe and understand DollarFlow's security model
        </p>
      </div>

      {/* Current Wallet Status */}
      <WalletVerificationCard
        isConnected={true}
        address={activeWallet?.wallet_address || ''}
        isCorrectChain={true}
        linkedWallets={linkedWallets}
        activeWallet={activeWallet}
        isLoading={false}
        error={null}
        nonceData={null}
        requestNonce={async () => {}}
        verifyWallet={async () => {}}
        selectWallet={() => {}}
        ensureBaseSepolia={async () => {}}
        clearError={() => {}}
      />

      {/* Security Topics */}
      <div className="space-y-4">
        {SECURITY_TOPICS.map((topic, index) => (
          <motion.div
            key={topic.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border border-border bg-surface overflow-hidden"
          >
            <button
              onClick={() => toggleExpand(index)}
              className="w-full p-5 flex items-start gap-4 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <topic.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1">{topic.title}</h3>
                <p className="text-sm text-muted-foreground">{topic.description}</p>
              </div>
              <span className={`text-muted-foreground transition-transform ${expanded[index] ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5" />
              </span>
            </button>
            
            {expanded[index] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-border px-5 pb-5 text-sm text-muted-foreground space-y-3"
              >
                <p>{topic.action}</p>
                {topic.details && (
                  <dl className="space-y-2">
                    {topic.details.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <dt className="font-medium text-foreground min-w-[180px]">{item.status}</dt>
                        <dd className="text-muted-foreground">{item.meaning}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}

        {/* Quick Links */}
        <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            Verification & Resources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a
              href={`${BASE_SEPOLIA_EXPLORER_URL}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl border border-border hover:bg-surface-elevated transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">Base Sepolia Explorer</span>
            </a>
            <a
              href="https://docs.base.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl border border-border hover:bg-surface-elevated transition-colors"
            >
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">Base Documentation</span>
            </a>
            <a
              href="https://metamask.io/support/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl border border-border hover:bg-surface-elevated transition-colors"
            >
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">MetaMask Support</span>
            </a>
            <button className="flex items-center gap-2 p-3 rounded-xl border border-border hover:bg-surface-elevated transition-colors text-left">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">Report Security Issue</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}