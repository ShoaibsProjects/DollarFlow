import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Send, QrCode, ArrowDownUp, Shield, ArrowUpRight, ArrowDownLeft, ChevronRight, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useWallet } from '@/hooks/useWallet';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function AnimatedNumber({ value, prefix = "$", decimals = 2 }) {
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

function TransactionItem({ tx }) {
  const isSend = tx.type === "send";
  const isReceive = tx.type === "receive";
  return (
    <div className="flex items-center gap-3 py-3" data-testid={`transaction-${tx.id}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        isSend ? 'bg-[#FF6B6B]/10' : isReceive ? 'bg-[#00D395]/10' : 'bg-[#0052FF]/10'
      }`}>
        {isSend ? <ArrowUpRight className="w-5 h-5 text-[#FF6B6B]" /> :
         isReceive ? <ArrowDownLeft className="w-5 h-5 text-[#00D395]" /> :
         <ArrowDownUp className="w-5 h-5 text-[#0052FF]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {isSend ? `Sent to ${tx.recipient_name || 'Unknown'}` :
           isReceive ? 'Received' : 'Converted'}
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>
      <div className={`text-sm font-semibold ${isSend ? 'text-[#FF6B6B]' : 'text-[#00D395]'}`}>
        {isSend ? '-' : '+'}${tx.amount.toFixed(2)}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { address, isConnected, ethBalance, usdcBalance } = useWallet();
  const [dashboard, setDashboard] = useState(null);
  const [shieldData, setShieldData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, shieldRes] = await Promise.all([
        axios.get(`${API}/dashboard`, { withCredentials: true }),
        axios.get(`${API}/inflation-shield`, { withCredentials: true })
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
      const res = await axios.put(`${API}/inflation-shield`, {
        enabled: !shieldData?.enabled
      }, { withCredentials: true });
      setShieldData(res.data);
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="h-48 rounded-2xl bg-secondary/50 animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-secondary/50 animate-pulse" />)}
        </div>
        <div className="h-64 rounded-2xl bg-secondary/50 animate-pulse" />
      </div>
    );
  }

  const quickActions = [
    { icon: Send, label: "Send", path: "/send", color: "#0052FF" },
    { icon: QrCode, label: "Receive", path: "/receive", color: "#00D395" },
    { icon: ArrowDownUp, label: "Convert", path: "/send", color: "#A78BFA" },
    { icon: Shield, label: "Shield", path: "/profile", color: "#FFB800" },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6" data-testid="dashboard-page">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your financial overview</p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="balance-glass rounded-2xl p-6 lg:p-8"
        data-testid="balance-card"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-white/60">Total Balance</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#00D395]/20 text-[#00D395]">USDC</span>
        </div>
        <div className="font-heading text-4xl lg:text-5xl font-bold text-white mb-2">
          <AnimatedNumber value={dashboard?.balance || 0} />
        </div>
        <div className="text-sm text-white/50">
          {dashboard?.local_symbol}{dashboard?.balance_local?.toLocaleString()} {dashboard?.local_currency}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <div className="text-xs text-white/50 mb-1">Monthly Sent</div>
            <div className="text-lg font-semibold text-[#FF6B6B] flex items-center gap-1">
              <TrendingDown className="w-4 h-4" /> ${dashboard?.monthly_sent?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div>
            <div className="text-xs text-white/50 mb-1">Monthly Received</div>
            <div className="text-lg font-semibold text-[#00D395] flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> ${dashboard?.monthly_received?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* On-Chain Wallet Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border bg-card p-6"
        data-testid="wallet-card"
      >
        {isConnected ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0052FF]/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[#0052FF]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">On-Chain Balance</h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#00D395]/20 text-[#00D395] font-medium">Connected</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/30 rounded-xl p-3">
                <div className="text-xs text-muted-foreground mb-1">USDC Balance</div>
                <div className="text-lg font-semibold text-foreground">${parseFloat(usdcBalance).toFixed(2)}</div>
              </div>
              <div className="bg-secondary/30 rounded-xl p-3">
                <div className="text-xs text-muted-foreground mb-1">ETH (Gas)</div>
                <div className="text-lg font-semibold text-foreground">{parseFloat(ethBalance).toFixed(4)}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
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
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.path)}
            data-testid={`quick-action-${action.label.toLowerCase()}`}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-[#0052FF]/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: `${action.color}15` }}
            >
              <action.icon className="w-5 h-5" style={{ color: action.color }} />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{action.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Inflation Shield Widget */}
      {shieldData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-card p-5"
          data-testid="inflation-shield-widget"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                shieldData.enabled ? 'bg-[#00D395]/10' : 'bg-secondary'
              }`}>
                <Shield className={`w-5 h-5 ${shieldData.enabled ? 'text-[#00D395]' : 'text-muted-foreground'}`} />
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
            <div className="bg-[#00D395]/5 rounded-xl p-3 mt-2">
              <p className="text-xs text-[#00D395]">
                {shieldData.historical_comparison}
              </p>
              <p className="text-xs text-[#00D395] mt-1 font-semibold">
                Money saved: ${shieldData.money_saved?.toFixed(2)}
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
        className="rounded-2xl border border-border bg-card p-5"
        data-testid="recent-transactions"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-semibold text-foreground">Recent Activity</h3>
          <button
            onClick={() => navigate('/analytics')}
            className="text-xs text-[#0052FF] hover:underline flex items-center gap-1"
            data-testid="view-all-transactions"
          >
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="divide-y divide-border">
          {dashboard?.recent_transactions?.length > 0 ? (
            dashboard.recent_transactions.slice(0, 7).map(tx => (
              <TransactionItem key={tx.id} tx={tx} />
            ))
          ) : (
            <div className="py-12 text-center">
              <Send className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <Button
                onClick={() => navigate('/send')}
                size="sm"
                className="mt-3 bg-[#0052FF] hover:bg-[#0040CC] text-white rounded-full"
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
