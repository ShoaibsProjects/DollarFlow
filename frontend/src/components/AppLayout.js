import { useState, useEffect } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Home, Send, MapPin, Users, User, BarChart3, MessageSquare, Sun, Moon, LogOut, DollarSign, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/send", label: "Send", icon: Send },
  { path: "/spots", label: "Spots", icon: MapPin },
  { path: "/family", label: "Family", icon: Users },
  { path: "/chat", label: "Chat", icon: MessageSquare },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/profile", label: "Profile", icon: User },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex" data-testid="app-layout">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/50 fixed h-screen" data-testid="desktop-sidebar">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0052FF] flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">DollarFlow</span>
          </div>
        </div>

        <div className="p-3 mx-4 mt-2 rounded-xl bg-secondary/30 border border-border">
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus="address"
          />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#0052FF] text-white shadow-[0_0_15px_-3px_rgba(0,82,255,0.4)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={toggleTheme}
            data-testid="theme-toggle-desktop"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all w-full"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={logout}
            data-testid="logout-desktop"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
        {/* Mobile Top Bar */}
        <div className="lg:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0052FF] flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-foreground">DollarFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <ConnectButton
              chainStatus="none"
              showBalance={false}
              accountStatus="avatar"
            />
            <button onClick={toggleTheme} className="p-2 text-muted-foreground" data-testid="theme-toggle-mobile">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Page Content */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border" data-testid="mobile-nav">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                className="flex flex-col items-center gap-0.5 py-1 min-w-[56px]"
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#0052FF] text-white' : 'text-muted-foreground'}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] ${isActive ? 'text-[#0052FF] font-medium' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
