/**
 * MasterPasswordContext.tsx
 *
 * Manages the master password lifecycle for zero-knowledge encryption.
 * - Checks if the user has set up encryption (user_encryption_meta table)
 * - Shows a blocking modal until the user provides their master password
 * - Derives the AES-256-GCM key and holds it in memory ONLY
 * - Clears the key on sign-out (key is never persisted)
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import {
  generateSalt,
  deriveKey,
  generateKeyCheck,
  verifyKeyCheck,
} from '../services/cryptoService';
import { MasterPasswordModal } from '../components/vault/MasterPasswordModal';

function isMissingSupabaseSchemaError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === '42P01' || error.code === '42703') return true;
  const message = (error.message || '').toLowerCase();
  return message.includes('user_encryption_meta');
}

// ─── Context Shape ─────────────────────────────────────────────

interface MasterPasswordContextType {
  encryptionKey: CryptoKey | null;
  isUnlocked: boolean;
  lock: () => void;
}

const MasterPasswordContext = createContext<MasterPasswordContextType>({
  encryptionKey: null,
  isUnlocked: false,
  lock: () => {},
});

// ─── Provider ──────────────────────────────────────────────────

export function MasterPasswordProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Core state
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Modal state
  const [mode, setMode] = useState<'setup' | 'unlock'>('unlock');
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  // Salt/keyCheck from the database
  const metaRef = useRef<{ salt: string; key_check: string } | null>(null);

  // ─── On user change: check if encryption is set up ───────────

  useEffect(() => {
    if (!user) {
      // Logged out — clear everything
      setEncryptionKey(null);
      setIsUnlocked(false);
      metaRef.current = null;
      setIsChecking(false);
      return;
    }

    let mounted = true;

    async function checkEncryptionMeta() {
      try {
        const { data, error: fetchError } = await supabase
          .from('user_encryption_meta')
          .select('salt, key_check')
          .eq('user_id', user!.id)
          .maybeSingle();

        if (!mounted) return;

        if (fetchError) {
          console.error('[MasterPW] Error checking encryption meta:', fetchError);
        }

        if (data && data.salt && data.key_check) {
          // User has set up encryption — need to unlock
          metaRef.current = { salt: data.salt, key_check: data.key_check };
          setMode('unlock');
        } else {
          // First time — need to create master password
          metaRef.current = null;
          setMode('setup');
        }
      } catch (err) {
        console.error('[MasterPW] Check failed:', err);
        setMode('setup');
      } finally {
        if (mounted) setIsChecking(false);
      }
    }

    setIsChecking(true);
    setIsUnlocked(false);
    setEncryptionKey(null);
    setError('');
    setFailedAttempts(0);
    setLockoutTime(null);
    checkEncryptionMeta();

    // Secure Memory Cleanup: Clear key on tab close/reload
    const handleBeforeUnload = () => {
      setEncryptionKey(null);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mounted = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  // ─── Setup: Create master password for first time ────────────

  const handleSetup = useCallback(
    async (password: string, confirmPassword: string) => {
      if (!user) return;

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      if (password.length < 8) {
        setError('Master password must be at least 8 characters.');
        return;
      }

      setError('');
      setIsSubmitting(true);

      try {
        // 1. Generate unique salt for this user
        const salt = generateSalt();

        // 2. Derive encryption key
        const key = await deriveKey(password, salt);

        // 3. Generate key check (so we can verify password later)
        const keyCheck = await generateKeyCheck(key);

        // 4. Store salt + key_check in Supabase
        const { error: insertError } = await supabase
          .from('user_encryption_meta')
          .insert({
            user_id: user.id,
            salt,
            key_check: keyCheck,
          });

        if (insertError) {
          if (isMissingSupabaseSchemaError(insertError)) {
            throw new Error('Supabase is missing the user_encryption_meta table. Apply server/src/db/migrations/003_supabase_vault_encryption.sql.');
          }
          // Handle duplicate (idempotent: if already exists, try unlock instead)
          if (insertError.code === '23505') {
            setError('Encryption already set up. Please unlock instead.');
            setMode('unlock');
            // Re-fetch meta
            const { data } = await supabase
              .from('user_encryption_meta')
              .select('salt, key_check')
              .eq('user_id', user.id)
              .single();
            if (data) metaRef.current = { salt: data.salt, key_check: data.key_check };
            return;
          }
          throw new Error(insertError.message);
        }

        // 5. Success — store key in memory and unlock
        metaRef.current = { salt, key_check: keyCheck };
        setEncryptionKey(key);
        setIsUnlocked(true);
      } catch (err: any) {
        console.error('[MasterPW] Setup error:', err);
        setError(err.message || 'Failed to set up encryption.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [user]
  );

  // ─── Unlock: Verify master password ──────────────────────────

  const handleUnlock = useCallback(
    async (password: string) => {
      if (!user || !metaRef.current) return;

      // Brute-force protection: check lockout
      if (lockoutTime && Date.now() < lockoutTime) {
        const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
        setError(`Too many failed attempts. Try again in ${remaining}s.`);
        return;
      }

      setError('');
      setIsSubmitting(true);

      try {
        const { salt, key_check } = metaRef.current;

        // 1. Derive key from password + stored salt
        const key = await deriveKey(password, salt);

        // 2. Verify against stored key check
        const isValid = await verifyKeyCheck(key, key_check);

        if (!isValid) {
          const newFailed = failedAttempts + 1;
          setFailedAttempts(newFailed);
          if (newFailed >= 3) {
            const unlockAt = Date.now() + 60000; // 1 minute lockout
            setLockoutTime(unlockAt);
            setError('Too many failed attempts. Vault locked for 1 minute.');
          } else {
            setError(`Incorrect master password. ${3 - newFailed} attempts remaining.`);
          }
          return;
        }

        // 3. Success — store key in memory and unlock
        setEncryptionKey(key);
        setIsUnlocked(true);
        setFailedAttempts(0);
        setLockoutTime(null);
      } catch (err: any) {
        console.error('[MasterPW] Unlock error:', err);
        setError('Decryption failed. Please check your password.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, failedAttempts, lockoutTime]
  );

  // ─── Lock: Clear key from memory ─────────────────────────────

  const lock = useCallback(() => {
    setEncryptionKey(null);
    setIsUnlocked(false);
    setError('');
  }, []);

  // ─── Render ──────────────────────────────────────────────────

  // No user = no master password needed (login screen is shown)
  if (!user) {
    return (
      <MasterPasswordContext.Provider value={{ encryptionKey: null, isUnlocked: false, lock }}>
        {children}
      </MasterPasswordContext.Provider>
    );
  }

  // Still checking if encryption is set up
  if (isChecking) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-500 font-medium">Checking encryption status…</p>
      </div>
    );
  }

  // Show master password modal if not unlocked
  if (!isUnlocked) {
    return (
      <MasterPasswordContext.Provider value={{ encryptionKey: null, isUnlocked: false, lock }}>
        <MasterPasswordModal
          mode={mode}
          error={error}
          isLoading={isSubmitting}
          onSetup={handleSetup}
          onUnlock={handleUnlock}
        />
      </MasterPasswordContext.Provider>
    );
  }

  return (
    <MasterPasswordContext.Provider value={{ encryptionKey, isUnlocked, lock }}>
      {children}
    </MasterPasswordContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────

export function useMasterPassword() {
  const context = useContext(MasterPasswordContext);
  if (context === undefined) {
    throw new Error('useMasterPassword must be used within MasterPasswordProvider');
  }
  return context;
}
