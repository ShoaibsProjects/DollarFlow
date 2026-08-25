import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Shield, Bell, Lock, Globe, Moon, Sun, LogOut, ChevronRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { Select } from '@/shared/ui/select';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { settingsApi, securityApi } from '@/shared/services/api';
import { toast } from '@/shared/ui/sonner';
import { useNavigate } from 'react-router-dom';

const countries = [
  { code: "PH", name: "Philippines", currency: "PHP" },
  { code: "NG", name: "Nigeria", currency: "NGN" },
  { code: "AR", name: "Argentina", currency: "ARS" },
  { code: "KE", name: "Kenya", currency: "KES" },
  { code: "IN", name: "India", currency: "INR" },
  { code: "US", name: "United States", currency: "USD" },
];

function SettingRow({ icon: Icon, label, description, children, onClick }: { 
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 hover:bg-surface-elevated transition-colors rounded-xl text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children || <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
    </Tag>
  );
}

export function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [shieldEnabled, setShieldEnabled] = useState(false);
  const [shieldPercentage, setShieldPercentage] = useState([100]);
  const [selectedCountry, setSelectedCountry] = useState("PH");
  const [hasPin, setHasPin] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  useEffect(() => {
    if (user) {
      setShieldEnabled(user.inflation_shield || false);
      setShieldPercentage([user.shield_percentage || 100]);
      const country = countries.find(c => c.currency === user.currency);
      if (country) setSelectedCountry(country.code);
    }
    const checkPin = async () => {
      try {
        const res = await securityApi.getPinStatus();
        setHasPin(res.data.has_pin);
      } catch { /* ignore */ }
    };
    checkPin();
  }, [user]);

  const updateSettings = async (updates: any) => {
    try {
      await settingsApi.update(updates);
      toast.success("Settings updated");
    } catch {
      toast.error("Failed to update settings");
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedCountry(code);
    const country = countries.find(c => c.code === code);
    if (country) {
      updateSettings({ country: country.name, currency: country.currency });
    }
  };

  const handleShieldToggle = (enabled: boolean) => {
    setShieldEnabled(enabled);
    updateSettings({ inflation_shield: enabled });
  };

  const handleShieldPercentage = (value: number[]) => {
    setShieldPercentage(value);
    updateSettings({ shield_percentage: value[0] });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSetPin = async () => {
    if (pinInput.length < 4 || pinInput.length > 6 || !/^\d+$/.test(pinInput)) {
      toast.error("PIN must be 4-6 digits");
      return;
    }
    if (pinInput !== pinConfirm) {
      toast.error("PINs don't match");
      return;
    }
    try {
      await securityApi.setPin(pinInput);
      toast.success("Transaction PIN set!");
      setHasPin(true);
      setPinDialogOpen(false);
      setPinInput("");
      setPinConfirm("");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to set PIN");
    }
  };

  const handleRemovePin = async () => {
    if (!pinInput || !/^\d+$/.test(pinInput)) {
      toast.error("Enter your current PIN");
      return;
    }
    try {
      await securityApi.removePin(pinInput);
      toast.success("Transaction PIN removed");
      setHasPin(false);
      setPinDialogOpen(false);
      setPinInput("");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Incorrect PIN");
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6" data-testid="profile-page">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-surface p-6 text-center"
        data-testid="profile-header"
      >
        <Avatar className="w-20 h-20 mx-auto mb-4">
          <AvatarImage src={user?.picture} alt={user?.name} />
          <AvatarFallback className="bg-primary text-white text-2xl font-bold">
            {user?.name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <h2 className="font-display text-xl font-bold text-foreground">{user?.name}</h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </motion.div>

      {/* Inflation Shield Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-surface overflow-hidden"
        data-testid="shield-settings"
      >
        <div className="p-4 border-b border-border">
          <h3 className="font-display text-sm font-semibold text-foreground">Inflation Shield</h3>
        </div>
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Auto-convert to USDC</p>
              <p className="text-xs text-muted-foreground">Protect earnings from depreciation</p>
            </div>
            <Switch
              checked={shieldEnabled}
              onCheckedChange={handleShieldToggle}
              data-testid="shield-toggle-settings"
            />
          </div>
          {shieldEnabled && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Conversion percentage</p>
                <span className="text-xs font-medium text-foreground">{shieldPercentage[0]}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={shieldPercentage[0]}
                onChange={(e) => handleShieldPercentage([parseInt(e.target.value)])}
                data-testid="shield-percentage-slider"
                className="w-full h-2 bg-surface-elevated rounded-lg appearance-none accent-primary"
              />
            </div>
          )}
        </Card>
      </motion.div>

      {/* Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-surface overflow-hidden"
        data-testid="preferences-section"
      >
        <div className="p-4 border-b border-border">
          <h3 className="font-display text-sm font-semibold text-foreground">Preferences</h3>
        </div>
        <div className="p-2">
          <div className="flex items-center gap-4 p-4 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center">
              <Globe className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Home Country</p>
              <p className="text-xs text-muted-foreground">Set your primary currency</p>
            </div>
            <Select value={selectedCountry} onChange={handleCountryChange} options={countries.map(c => ({ value: c.code, label: c.name }))} />
          </div>

          <SettingRow
            icon={theme === 'dark' ? Moon : Sun}
            label={theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            description="Toggle app appearance"
          >
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} data-testid="theme-toggle-settings" />
          </SettingRow>

          <SettingRow icon={Bell} label="Notifications" description="Manage alerts and updates" />

          <div
            onClick={() => { setPinDialogOpen(true); setPinInput(""); setPinConfirm(""); }}
            className="w-full flex items-center gap-4 p-4 hover:bg-surface-elevated transition-colors rounded-xl text-left cursor-pointer"
            data-testid="security-pin-row"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0">
              {hasPin ?
                <ShieldCheck className="w-5 h-5 text-success" /> :
                <ShieldAlert className="w-5 h-5 text-danger" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Transaction PIN</p>
              <p className="text-xs text-muted-foreground">
                {hasPin ? "PIN is active — required for all sends" : "No PIN set — add one for security"}
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              hasPin ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            }`}>
              {hasPin ? "Active" : "Off"}
            </span>
          </div>

          <SettingRow icon={Shield} label="Connected Wallets" description="Manage blockchain wallets" />
        </div>
      </motion.div>

      {/* PIN Dialog */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="rounded-2xl" data-testid="pin-dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {hasPin ? "Manage Transaction PIN" : "Set Transaction PIN"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              {hasPin
                ? "Your PIN is required before sending any money. Enter your current PIN to remove it."
                : "Set a 4-6 digit PIN to protect your transactions. You'll need to enter it before every send."}
            </p>
            <div>
              <Label>{hasPin ? "Current PIN" : "New PIN"}</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder={hasPin ? "Enter current PIN" : "Enter 4-6 digit PIN"}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                data-testid="pin-input"
                className="mt-1 rounded-xl text-center text-lg tracking-[0.5em] font-mono"
              />
            </div>
            {!hasPin && (
              <div>
                <Label>Confirm PIN</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Confirm PIN"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  data-testid="pin-confirm-input"
                  className="mt-1 rounded-xl text-center text-lg tracking-[0.5em] font-mono"
                />
              </div>
            )}
            <Button
              onClick={hasPin ? handleRemovePin : handleSetPin}
              data-testid="pin-submit-btn"
              className={`w-full rounded-full ${
                hasPin
                  ? 'bg-danger hover:bg-danger-hover text-white'
                  : 'bg-primary hover:bg-primary-hover text-white'
              }`}
            >
              {hasPin ? "Remove PIN" : "Set PIN"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={handleLogout}
          variant="secondary"
          data-testid="logout-btn"
          className="w-full rounded-full border-danger/30 text-danger hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </motion.div>
    </div>
  );
}