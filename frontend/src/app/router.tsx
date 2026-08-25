import { Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/features/landing/LandingPage';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { SendMoney } from '@/features/send/SendMoney';
import { ReceiveMoney } from '@/features/receive/ReceiveMoney';
import { FamilyVault } from '@/features/family/FamilyVault';
import { Spots } from '@/features/spots/Spots';
import { ChatToPay } from '@/features/chat/ChatToPay';
import { Analytics } from '@/features/analytics/Analytics';
import { Profile } from '@/features/profile/Profile';
import { Transactions } from '@/features/transactions/Transactions';
import { TransactionDetail } from '@/features/transactions/TransactionDetail';
import { WalletSecurity } from '@/features/wallet-security/WalletSecurity';
import { Support } from '@/features/support/Support';
import { AppLayout } from '@/shared/components/AppLayout';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      
      <Route element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>}>
        <Route path="/dashboard" index />
      </Route>
      
      <Route element={<ProtectedRoute><AppLayout><SendMoney /></AppLayout></ProtectedRoute>}>
        <Route path="/send" />
      </Route>
      
      <Route element={<ProtectedRoute><AppLayout><ReceiveMoney /></AppLayout></ProtectedRoute>}>
        <Route path="/receive" />
      </Route>
      
      <Route element={<ProtectedRoute><AppLayout><FamilyVault /></AppLayout></ProtectedRoute>}>
        <Route path="/family" />
      </Route>
      
      <Route element={<ProtectedRoute><AppLayout><Spots /></AppLayout></ProtectedRoute>}>
        <Route path="/spots" />
      </Route>
      
      <Route element={<ProtectedRoute><AppLayout><ChatToPay /></AppLayout></ProtectedRoute>}>
        <Route path="/chat" />
      </Route>
      
      <Route element={<ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>}>
        <Route path="/analytics" />
      </Route>
      
      <Route element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>}>
        <Route path="/profile" />
      </Route>
      
      <Route element={<ProtectedRoute><AppLayout><Transactions /></AppLayout></ProtectedRoute>}>
        <Route path="/transactions" />
      </Route>
      
      <Route element={<ProtectedRoute><AppLayout><TransactionDetail /></AppLayout></ProtectedRoute>}>
        <Route path="/transaction-detail/:intent_id" />
      </Route>
      
      <Route element={<ProtectedRoute><AppLayout><WalletSecurity /></AppLayout></ProtectedRoute>}>
        <Route path="/wallet-security" />
      </Route>
      
      <Route element={<ProtectedRoute><AppLayout><Support /></AppLayout></ProtectedRoute>}>
        <Route path="/support" />
      </Route>
      
      <Route path="*" element={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-6xl font-bold text-primary mb-4">404</h1>
            <p className="text-muted-foreground mb-6">Page not found</p>
            <a href="/" className="btn-primary">Go Home</a>
          </div>
        </div>
      } />
    </Routes>
  );
}