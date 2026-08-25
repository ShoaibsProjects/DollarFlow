import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/shared/contexts/AuthContext';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_BACKEND_URL}/api` || '/api';

export function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      navigate('/', { replace: true });
      return;
    }

    const processSession = async () => {
      try {
        const res = await axios.post(`${API}/auth/session`, { session_id: sessionId }, { withCredentials: true });
        setUser(res.data);
        navigate('/dashboard', { replace: true, state: { user: res.data } });
      } catch (err) {
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/', { replace: true }), 2000);
      }
    };
    
    processSession();
  }, [navigate, setUser, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 rounded-full bg-primary mx-auto mb-6 flex items-center justify-center animate-pulse">
          <DollarSign className="w-8 h-8 text-white" />
        </div>
        <p className="text-muted-foreground mb-2">
          {error ? 'Authentication failed' : 'Signing you in...'}
        </p>
        {error && <p className="text-sm text-danger mt-2">{error}</p>}
      </motion.div>
    </div>
  );
}