import { useEffect, useRef, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import axios from "axios";

// Pages
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import SendMoney from "@/pages/SendMoney";
import ReceiveMoney from "@/pages/ReceiveMoney";
import FamilyVault from "@/pages/FamilyVault";
import Spots from "@/pages/Spots";
import ChatToPay from "@/pages/ChatToPay";
import Analytics from "@/pages/Analytics";
import Profile from "@/pages/Profile";
import AppLayout from "@/components/AppLayout";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const sessionId = params.get('session_id');

    if (!sessionId) {
      navigate('/');
      return;
    }

    const processSession = async () => {
      try {
        const res = await axios.post(`${API}/auth/session`, { session_id: sessionId }, { withCredentials: true });
        setUser(res.data);
        navigate('/dashboard', { replace: true, state: { user: res.data } });
      } catch {
        navigate('/');
      }
    };
    processSession();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-center">
        <div className="w-12 h-12 rounded-full bg-[#0052FF] mx-auto mb-4" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-12 h-12 rounded-full bg-[#0052FF] mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !location.state?.user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppRouter() {
  const location = useLocation();

  // Detect session_id synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/send" element={
        <ProtectedRoute>
          <AppLayout><SendMoney /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/receive" element={
        <ProtectedRoute>
          <AppLayout><ReceiveMoney /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/family" element={
        <ProtectedRoute>
          <AppLayout><FamilyVault /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/spots" element={
        <ProtectedRoute>
          <AppLayout><Spots /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute>
          <AppLayout><ChatToPay /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <AppLayout><Analytics /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <AppLayout><Profile /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-heading font-bold text-[#0052FF] mb-4">404</h1>
            <p className="text-muted-foreground mb-6">Page not found</p>
            <a href="/" className="bg-[#0052FF] text-white px-6 py-3 rounded-full hover:bg-[#0040CC] transition-colors">
              Go Home
            </a>
          </div>
        </div>
      } />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
