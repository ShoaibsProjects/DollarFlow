import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, PieChart, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import {
  PieChart as RPieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ['#0052FF', '#00D395', '#FF6B6B', '#FFB800', '#A78BFA', '#FF6B9D', '#4ECDC4', '#87CEEB'];

function AnimatedCounter({ value, prefix = "$" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let current = 0;
    const end = value;
    const steps = 30;
    const inc = end / steps;
    const timer = setInterval(() => {
      current += inc;
      if (current >= end) { current = end; clearInterval(timer); }
      setDisplay(current);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toFixed(2)}</span>;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl px-3 py-2 text-xs">
      <p className="text-foreground font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [currencyHistory, setCurrencyHistory] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState("ARS");
  const [timeRange, setTimeRange] = useState("30d");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [analyticsRes, historyRes] = await Promise.all([
        axios.get(`${API}/analytics`, { withCredentials: true }),
        axios.get(`${API}/currencies/history/${selectedCurrency}`)
      ]);
      setAnalytics(analyticsRes.data);
      setCurrencyHistory(historyRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCurrency]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getFilteredHistory = () => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    return currencyHistory.slice(-days);
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
        {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl bg-secondary/50 animate-pulse" />)}
      </div>
    );
  }

  const savingsData = analytics?.fee_savings || {};

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6" data-testid="analytics-page">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Your financial insights at a glance</p>
      </div>

      {/* Fee Savings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "vs Western Union", value: savingsData.vs_western_union || 0, color: "#00D395" },
          { label: "vs Wise", value: savingsData.vs_wise || 0, color: "#0052FF" },
          { label: "vs Bank Wire", value: savingsData.vs_banks || 0, color: "#A78BFA" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-border bg-card p-5"
            data-testid={`savings-card-${i}`}
          >
            <p className="text-xs text-muted-foreground mb-1">You saved {item.label}</p>
            <div className="font-heading text-2xl font-bold" style={{ color: item.color }}>
              <AnimatedCounter value={item.value} />
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-[#00D395]" />
              <span className="text-xs text-[#00D395]">in total fees saved</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Comparison Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border bg-card p-5"
        data-testid="comparison-widget"
      >
        <h3 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <ArrowDownUp className="w-5 h-5 text-[#0052FF]" />
          Sending $200 Fee Comparison
        </h3>
        <div className="space-y-3">
          {[
            { name: "DollarFlow", fee: 0.03, color: "#0052FF", width: "2%" },
            { name: "Wise", fee: 4.20, color: "#A78BFA", width: "28%" },
            { name: "Western Union", fee: 14.00, color: "#FF6B6B", width: "93%" },
          ].map((service, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-28">{service.name}</span>
              <div className="flex-1 h-6 rounded-full bg-secondary/30 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: service.width }}
                  transition={{ delay: 0.5 + i * 0.2, duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ background: service.color }}
                />
              </div>
              <span className="text-xs font-medium text-foreground w-16 text-right">${service.fee.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Spending by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border bg-card p-5"
          data-testid="spending-chart"
        >
          <h3 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#0052FF]" />
            Spending by Category
          </h3>
          {analytics?.spending_by_category?.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <RPieChart>
                  <Pie
                    data={analytics.spending_by_category}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={70}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {analytics.spending_by_category.map((entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RPieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {analytics.spending_by_category.slice(0, 5).map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground flex-1 capitalize">{cat.name}</span>
                    <span className="text-foreground font-medium">${cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No spending data yet</p>
          )}
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-border bg-card p-5"
          data-testid="stats-summary"
        >
          <h3 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0052FF]" />
            Summary
          </h3>
          <div className="space-y-4">
            {[
              { label: "Total Sent", value: analytics?.total_sent || 0, icon: TrendingDown, color: "#FF6B6B" },
              { label: "Total Received", value: analytics?.total_received || 0, icon: TrendingUp, color: "#00D395" },
              { label: "Total Transactions", value: analytics?.total_transactions || 0, prefix: "", icon: BarChart3, color: "#0052FF" },
              { label: "Total Fees Paid", value: analytics?.total_fees_paid || 0, icon: DollarSign, color: "#FFB800" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {stat.prefix !== undefined ? stat.prefix : "$"}{typeof stat.value === "number" ? stat.value.toFixed(stat.prefix === "" ? 0 : 2) : stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Currency Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl border border-border bg-card p-5"
        data-testid="currency-trend"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-base font-semibold text-foreground">Dollar Strength vs Local Currency</h3>
          <div className="flex gap-2">
            {["ARS", "NGN", "PHP"].map(c => (
              <button
                key={c}
                onClick={() => setSelectedCurrency(c)}
                data-testid={`currency-btn-${c}`}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedCurrency === c ? 'bg-[#0052FF] text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {["7d", "30d", "90d"].map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              data-testid={`range-btn-${r}`}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                timeRange === r ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={getFilteredHistory()}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0052FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0052FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="rate"
              name={`1 USD = ${selectedCurrency}`}
              stroke="#0052FF"
              fillOpacity={1}
              fill="url(#colorRate)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Exchange rate trend (estimates based on historical data)
        </p>
      </motion.div>
    </div>
  );
}
