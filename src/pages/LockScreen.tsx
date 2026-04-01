import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Shield, Fingerprint, FolderLock } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Button } from '../components/ui/Button';

export function LockScreen() {
  const { unlock } = useVault();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleUnlock = async () => {
    if (!password) {
      setError('Please enter your master password');
      return;
    }
    setIsUnlocking(true);
    // Simulate unlock delay
    await new Promise(resolve => setTimeout(resolve, 800));
    const success = unlock(password);
    if (!success) {
      setError('Incorrect master password');
      setIsUnlocking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleUnlock();
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-vault-bg relative overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-vault-gold/[0.02] blur-[120px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vault-gold/10 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm px-8"
      >
        {/* Vault identity */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            animate={isUnlocking ? { rotateY: 180, scale: 0.8 } : { rotateY: 0 }}
            transition={{ duration: 0.8 }}
            className="w-20 h-20 rounded-3xl bg-vault-surface border border-vault-border flex items-center justify-center mb-6 vault-glow"
          >
            <AnimatePresence mode="wait">
              {isUnlocking ? (
                <motion.div
                  key="unlocking"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-vault-gold"
                >
                  <Shield size={32} />
                </motion.div>
              ) : (
                <motion.div
                  key="locked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-vault-gold"
                >
                  <FolderLock size={32} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <h1 className="text-2xl font-bold text-vault-text tracking-tight mb-1">The Vault</h1>
          <p className="text-sm text-vault-text-muted">Enter your master password to unlock</p>
        </div>

        {/* Password input */}
        <div className="space-y-4">
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-vault-text-muted" />
            <input
              type="password"
              placeholder="Master password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoFocus
              className={`w-full bg-vault-surface border rounded-2xl pl-11 pr-4 py-3.5 text-sm text-vault-text placeholder:text-vault-text-muted focus:outline-none transition-all duration-300 font-mono ${
                error ? 'border-vault-danger/50' : focused ? 'border-vault-gold/30 shadow-[0_0_0_3px_rgba(212,168,67,0.08)]' : 'border-vault-border'
              }`}
            />
            {focused && !error && (
              <motion.div
                layoutId="input-glow"
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ boxShadow: '0 0 20px rgba(212,168,67,0.06)' }}
              />
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-vault-danger text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <Button
            onClick={handleUnlock}
            disabled={isUnlocking}
            className="w-full py-3.5 rounded-2xl text-sm"
            size="lg"
          >
            {isUnlocking ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-vault-bg/30 border-t-vault-bg rounded-full"
                />
                Unlocking...
              </motion.span>
            ) : (
              'Unlock Vault'
            )}
          </Button>
        </div>

        {/* Secondary actions */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button className="flex items-center gap-2 text-xs text-vault-text-muted hover:text-vault-text transition-colors cursor-pointer">
            <Fingerprint size={14} />
            Biometric
          </button>
          <span className="w-px h-3 bg-vault-border" />
          <button className="text-xs text-vault-text-muted hover:text-vault-text transition-colors cursor-pointer">
            Forgot password?
          </button>
        </div>

        {/* Encrypted status */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-vault-surface border border-vault-border">
            <Shield size={12} className="text-vault-success" />
            <span className="text-[10px] text-vault-text-muted uppercase tracking-widest font-medium">AES-256 Encrypted</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
