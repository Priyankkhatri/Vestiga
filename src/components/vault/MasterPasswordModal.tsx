/**
 * MasterPasswordModal.tsx
 *
 * Full-screen blocking modal for master password entry.
 * Cannot be dismissed — vault is inaccessible without it.
 *
 * Two modes:
 * - setup: Create a new master password (with confirmation)
 * - unlock: Enter existing master password
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface Props {
  mode: 'setup' | 'unlock';
  error: string;
  isLoading: boolean;
  onSetup: (password: string, confirm: string) => void;
  onUnlock: (password: string) => void;
}

export function MasterPasswordModal({ mode, error, isLoading, onSetup, onUnlock }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus password input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'setup') {
      onSetup(password, confirmPassword);
    } else {
      onUnlock(password);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-6">
      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className={`bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden ${error && !isLoading ? 'animate-shake' : ''}`}>
          {/* Header */}
          <div className="px-8 pt-10 pb-2 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/25 mb-6">
              {mode === 'setup' ? (
                <ShieldCheck size={32} className="text-white" />
              ) : (
                <Lock size={32} className="text-white" />
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              {mode === 'setup' ? 'Create Master Password' : 'Unlock Vault'}
            </h2>

            <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">
              {mode === 'setup'
                ? 'Your master password encrypts all vault data. It is never stored — if you forget it, your data cannot be recovered.'
                : 'Enter your master password to decrypt and access your vault.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 pt-4 space-y-4">
            {/* Master Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all placeholder:text-gray-400"
                  autoComplete="off"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm (setup mode only) */}
            {mode === 'setup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all placeholder:text-gray-400"
                  autoComplete="off"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl"
              >
                <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-600 font-medium">{error}</span>
              </motion.div>
            )}

            {/* Warning (setup mode) */}
            {mode === 'setup' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-amber-700 leading-relaxed">
                  <strong>Warning:</strong> There is no password recovery. If you forget your master password, your vault data cannot be decrypted.
                </span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !password || (mode === 'setup' && !confirmPassword)}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white text-sm font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'setup' ? 'Setting up encryption…' : 'Decrypting vault…'}
                </>
              ) : (
                <>
                  {mode === 'setup' ? 'Create & Encrypt Vault' : 'Unlock Vault'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Zero-knowledge badge */}
        <div className="mt-6 flex flex-col items-center justify-center gap-1 text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-teal-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700/80">Encrypted Locally</span>
          </div>
          <span className="text-[11px] text-gray-400">Only you can access this data.</span>
        </div>
      </motion.div>
    </div>
  );
}
