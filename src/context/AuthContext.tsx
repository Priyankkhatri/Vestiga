import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  broadcastSessionToExtension,
  registerExtensionAuthBridge,
} from '../lib/extensionAuthBridge';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  tier: 'free' | 'pro';
  itemCount: number;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  tier: 'free',
  itemCount: 0,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<'free' | 'pro'>('free');
  const [itemCount, setItemCount] = useState(0);

  const refreshProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setTier(result.data.tier);
        setItemCount(result.data.itemCount);
      }
    } catch (err) {
      console.error('[Auth] Profile refresh error:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (mounted) {
        if (error) {
          console.error('[Auth] Initial session error:', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        if (session) {
          void refreshProfile();
        }
        setLoading(false);
      }
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session) refreshProfile();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => registerExtensionAuthBridge(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session ?? null;
  }), []);

  useEffect(() => {
    broadcastSessionToExtension(session);
  }, [session]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, tier, itemCount, refreshProfile }}>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 mb-6">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <div className="flex items-center gap-3 text-teal-600 font-semibold uppercase tracking-widest text-xs">
              <Loader2 size={16} className="animate-spin" />
              Initializing Vestiga
            </div>
          </motion.div>
        ) : (
          children
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
