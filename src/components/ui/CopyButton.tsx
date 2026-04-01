import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CopyButtonProps {
  value: string;
  label?: string;
  size?: number;
}

export function CopyButton({ value, label, size = 14 }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [value]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-vault-text-muted hover:text-vault-gold hover:bg-vault-gold/5 transition-all duration-200 cursor-pointer"
      title={label || 'Copy'}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Check size={size} className="text-vault-success" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Copy size={size} />
          </motion.span>
        )}
      </AnimatePresence>
      {label && <span className="text-xs">{copied ? 'Copied!' : label}</span>}
    </button>
  );
}
