import { motion } from 'framer-motion';
import { KeyRound, User, ChevronDown } from 'lucide-react';

// This is a demo component showing the autofill overlay design.
// In production, this would be injected via content script.
interface AutofillEntry {
  title: string;
  username: string;
  iconUrl?: string;
}

interface AutofillOverlayProps {
  entries?: AutofillEntry[];
  onSelect?: (entry: AutofillEntry) => void;
  visible?: boolean;
}

export function AutofillOverlay({
  entries = [
    { title: 'Google Account', username: 'alex.morgan@gmail.com' },
    { title: 'Google Workspace', username: 'alex@company.com' },
  ],
  onSelect,
  visible = true,
}: AutofillOverlayProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="w-72 bg-vault-surface border border-vault-border rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-vault-border bg-vault-surface-2">
        <div className="w-5 h-5 rounded-md bg-vault-gold/10 border border-vault-gold/20 flex items-center justify-center">
          <KeyRound size={10} className="text-vault-gold" />
        </div>
        <span className="text-[10px] font-semibold text-vault-text-secondary uppercase tracking-wider">The Vault — Autofill</span>
      </div>

      {/* Entries */}
      <div className="p-1">
        {entries.map((entry, i) => (
          <button
            key={i}
            onClick={() => onSelect?.(entry)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-vault-gold/5 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-vault-surface-3 border border-vault-border flex items-center justify-center">
              <User size={14} className="text-vault-text-muted" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-semibold text-vault-text truncate">{entry.title}</p>
              <p className="text-[10px] text-vault-text-muted truncate">{entry.username}</p>
            </div>
            <span className="text-[10px] text-vault-gold opacity-0 group-hover:opacity-100 transition-opacity font-medium">Fill</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-vault-border flex items-center justify-between">
        <button className="text-[10px] text-vault-text-muted hover:text-vault-text cursor-pointer">
          Open Vault
        </button>
        <button className="text-[10px] text-vault-text-muted hover:text-vault-text cursor-pointer flex items-center gap-0.5">
          More <ChevronDown size={8} />
        </button>
      </div>
    </motion.div>
  );
}
