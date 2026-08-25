import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Send, QrCode, ArrowDownUp, Shield, ArrowUpRight, ArrowDownLeft, ChevronRight, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { Card } from '@/shared/ui/card';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/shared/hooks/useWallet';
import { dashboardApi } from '@/shared/services/api';
import { formatCurrency } from '@/shared/lib/utils';

function AnimatedNumber({ value, prefix = '$', decimals = 2 }: { value: number; prefix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(value);
  const hasAnimated = useRef(false);
  useEffect(() => {
    if (!hasAnimated.current && value > 0) {
      hasAnimated.current = true;
      let start = 0;
      const end = value;
      const duration = 800;
      const steps = 25;
      const increment = (end - start) / steps;
      let current = start;
      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          current = end;
          clearInterval(timer);
        }
        setDisplay(current);
      }, duration / steps);
      return () => clearInterval(timer);
    } else {
      setDisplay(value);
    }
  }, [value]);
  return <span>{prefix}{display.toFixed(decimals)}</span>;
}

function QuickActionButton({ icon: Icon, label, onClick, color }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface border border-border hover:border-primary/30 transition-all group"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${color}15` }}>
        <div style={{ color }}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">{label}</span>
    </button>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { address, isConnected, ethBalance, usdcBalance } = useWallet();
  const [dashboard, setDashboard] = useState<any>(null);
  const [shieldData, setShieldData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, shieldRes] = await Promise.all([
        dashboardApi.get(),
        dashboardApi.getInflationShield(),
      ]);
      setDashboard(dashRes.data);
      setShieldData(shieldRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleShield = async () => {
    try {
      const res = await dashboardApi.updateInflationShield(!shieldData?.enabled);
      setShieldData(res.data);
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-48 rounded-2xl bg-surface-elevated animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-surface-elevated animate-pulse" />)}
        </div>
        <div className="h-64 rounded-2xl bg-surface-elevated animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6" data-testid="dashboard-page">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your financial overview</p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl p-6 lg:p-8 mesh-gradient"
        data-testid="balance-card"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-foreground/60">Total Balance</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">USDC</span>
        </div>
        <div className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-2">
          <AnimatedNumber value={dashboard?.balance || 0} />
        </div>
        <div className="text-sm text-foreground/50">
          {dashboard?.local_symbol}{dashboard?.balance_local?.toLocaleString()} {dashboard?.local_currency}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <div className="text-xs text-foreground/50 mb-1">Monthly Sent</div>
            <div className="text-lg font-semibold text-danger flex items-center gap-1">
              <TrendingDown className="w-4 h-4" /> {formatCurrency(dashboard?.monthly_sent || 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-foreground/50 mb-1">Monthly Received</div>
            <div className="text-lg font-semibold text-success flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> {formatCurrency(dashboard?.monthly_received || 0)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* On-Chain Wallet Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border bg-surface p-6"
        data-testid="wallet-card"
      >
        {isConnected ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">On-Chain Balance</h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success font-medium">Connected</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card variant="default" className="p-3">
                <div className="text-xs text-muted-foreground mb-1">USDC Balance</div>
                <div className="text-lg font-semibold text-foreground">{parseFloat(usdcBalance).toFixed(2)}</div>
              </Card>
              <Card variant="default" className="p-3">
                <div className="text-xs text-muted-foreground mb-1">ETH (Gas)</div>
                <div className="text-lg font-semibold text-foreground" data-testid="eth-balance-value">{parseFloat(ethBalance).toFixed(5)}</div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center">
              <Wallet className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Connect wallet for on-chain transfers</h3>
              <p className="text-xs text-muted-foreground/60">Use the wallet button in the sidebar</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-4 gap-3"
        data-testid="quick-actions"
      >
        <QuickActionButton icon={Send} label="Send" onClick={() => navigate('/send')} color="#0052FF" />
        <QuickActionButton icon={QrCode} label="Receive" onClick={() => navigate('/receive')} color="#00D395" />
        <QuickActionButton icon={ArrowDownUp} label="Convert" onClick={() => navigate('/send')} color="#A78BFA" />
        <QuickActionButton icon={Shield} label="Shield" onClick={() => navigate('/profile')} color="#FFB800" />
      </motion.div>

      {/* Inflation Shield Widget */}
      {shieldData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-surface p-5"
          data-testid="inflation-shield-widget"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                shieldData.enabled ? 'bg-success/10' : 'bg-surface-elevated'
              }`}>
                <Shield className={`w-5 h-5 ${shieldData.enabled ? 'text-success' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Inflation Shield</h3>
                <p className="text-xs text-muted-foreground">{shieldData.enabled ? 'Protecting your earnings' : 'Shield is off'}</p>
              </div>
            </div>
            <Switch
              checked={shieldData.enabled}
              onCheckedChange={toggleShield}
              data-testid="shield-toggle"
            />
          </div>
          {shieldData.enabled && (
            <div className="bg-success/5 rounded-xl p-3 mt-2">
              <p className="text-xs text-success">
                {shieldData.historical_comparison}
              </p>
              <p className="text-xs text-success mt-1 font-semibold">
                Money saved: {formatCurrency(shieldData.money_saved || 0)}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-border bg-surface p-5"
        data-testid="recent-transactions"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-foreground">Recent Activity</h3>
          <button
            onClick={() => navigate('/analytics')}
            className="text-xs text-primary hover:underline flex items-center gap-1"
            data-testid="view-all-transactions"
          >
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="divide-y border-border">
          {dashboard?.recent_transactions?.length > 0 ? (
            dashboard.recent_transactions.slice(0, 7).map((tx: any) => (
              <div key={tx.id} className="flex items-center gap-3 py-3" data-testid={`transaction-${tx.id}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tx.type === 'send' ? 'bg-danger/10' : tx.type === 'receive' ? 'bg-success/10' : 'bg-primary/10'
                }`}>
                  {tx.type === 'send' ? <ArrowUpRight className="w-5 h-5 text-danger" /> :
                   tx.type === 'receive' ? <ArrowDownLeft className="w-5 h-5 text-success" /> :
                   <ArrowDownUp className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {tx.type === 'send' ? `Sent to ${tx.recipient_name || 'Unknown'}` :
                     tx.type === 'receive' ? 'Received' : 'Converted'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(tx.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className={`text-sm font-semibold ${tx.type === 'send' ? 'text-danger' : 'text-success'}`}>
                  {tx.type === 'send' ? '-' : '+'}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <Send className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <Button
                onClick={() => navigate('/send')}
                size="sm"
                className="mt-3 bg-primary hover:bg-primary-hover text-white rounded-full"
              >
                Send your first dollar
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}