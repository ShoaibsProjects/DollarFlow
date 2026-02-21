import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { User, Shield, Bell, Lock, Globe, Moon, Sun, LogOut, ChevronRight, Wallet, MapPin, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const countries = [
  { code: "PH", name: "Philippines", currency: "PHP" },
  { code: "NG", name: "Nigeria", currency: "NGN" },
  { code: "AR", name: "Argentina", currency: "ARS" },
  { code: "KE", name: "Kenya", currency: "KES" },
  { code: "IN", name: "India", currency: "INR" },
  { code: "US", name: "United States", currency: "USD" },
];

function SettingRow({ icon: Icon, label, description, children, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors rounded-xl text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
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

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [shieldEnabled, setShieldEnabled] = useState(false);
  const [shieldPercentage, setShieldPercentage] = useState([100]);
  const [selectedCountry, setSelectedCountry] = useState("PH");

  useEffect(() => {
    if (user) {
      setShieldEnabled(user.inflation_shield || false);
      setShieldPercentage([user.shield_percentage || 100]);
      const country = countries.find(c => c.currency === user.currency);
      if (country) setSelectedCountry(country.code);
    }
  }, [user]);

  const updateSettings = async (updates) => {
    try {
      await axios.put(`${API}/settings`, updates, { withCredentials: true });
      toast.success("Settings updated");
    } catch {
      toast.error("Failed to update settings");
    }
  };

  const handleCountryChange = (code) => {
    setSelectedCountry(code);
    const country = countries.find(c => c.code === code);
    if (country) {
      updateSettings({ country: country.name, currency: country.currency });
    }
  };

  const handleShieldToggle = (enabled) => {
    setShieldEnabled(enabled);
    updateSettings({ inflation_shield: enabled });
  };

  const handleShieldPercentage = (value) => {
    setShieldPercentage(value);
    updateSettings({ shield_percentage: value[0] });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6" data-testid="profile-page">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6 text-center"
        data-testid="profile-header"
      >
        <Avatar className="w-20 h-20 mx-auto mb-4">
          <AvatarImage src={user?.picture} alt={user?.name} />
          <AvatarFallback className="bg-[#0052FF] text-white text-2xl font-bold">
            {user?.name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <h2 className="font-heading text-xl font-bold text-foreground">{user?.name}</h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </motion.div>

      {/* Inflation Shield Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
        data-testid="shield-settings"
      >
        <div className="p-4 border-b border-border">
          <h3 className="font-heading text-sm font-semibold text-foreground">Inflation Shield</h3>
        </div>
        <div className="p-4 space-y-4">
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
              <Slider
                value={shieldPercentage}
                onValueChange={handleShieldPercentage}
                max={100}
                min={10}
                step={10}
                data-testid="shield-percentage-slider"
                className="w-full"
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
        data-testid="preferences-section"
      >
        <div className="p-4 border-b border-border">
          <h3 className="font-heading text-sm font-semibold text-foreground">Preferences</h3>
        </div>
        <div className="p-2">
          <div className="flex items-center gap-4 p-4 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Globe className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Home Country</p>
              <p className="text-xs text-muted-foreground">Set your primary currency</p>
            </div>
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger className="w-36 rounded-xl" data-testid="country-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SettingRow
            icon={theme === 'dark' ? Moon : Sun}
            label={theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            description="Toggle app appearance"
          >
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
              data-testid="theme-toggle-settings"
            />
          </SettingRow>

          <SettingRow icon={Bell} label="Notifications" description="Manage alerts and updates" />
          <SettingRow icon={Lock} label="Security" description="PIN, biometrics, and 2FA" />
          <SettingRow icon={Wallet} label="Connected Wallets" description="Manage blockchain wallets" />
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={handleLogout}
          variant="outline"
          data-testid="logout-btn"
          className="w-full rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </motion.div>
    </div>
  );
}
