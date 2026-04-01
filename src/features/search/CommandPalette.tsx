import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, Command, KeyRound, MapPin, CreditCard, FileText, FolderLock,
  Settings, Shield, Plus, ArrowRight, Copy, ExternalLink,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { VaultItem, PasswordItem } from '../../types/vault';
import { getCategoryIcon, getCategoryColor } from '../../components/vault/VaultHelpers';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'nav' | 'action';
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { items, addToast } = useVault();
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => { setIsOpen(false); setQuery(''); setSelectedIndex(0); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const quickActions: QuickAction[] = [
    { id: 'add-password', label: 'Add Password', icon: <Plus size={14} />, action: () => { navigate('/add/password'); close(); }, category: 'action' },
    { id: 'add-card', label: 'Add Card', icon: <Plus size={14} />, action: () => { navigate('/add/card'); close(); }, category: 'action' },
    { id: 'add-note', label: 'Add Note', icon: <Plus size={14} />, action: () => { navigate('/add/note'); close(); }, category: 'action' },
    { id: 'go-vault', label: 'Go to Vault', icon: <FolderLock size={14} />, action: () => { navigate('/vault'); close(); }, category: 'nav' },
    { id: 'go-audit', label: 'Run Security Audit', icon: <Shield size={14} />, action: () => { navigate('/security'); close(); }, category: 'nav' },
    { id: 'go-settings', label: 'Settings', icon: <Settings size={14} />, action: () => { navigate('/settings'); close(); }, category: 'nav' },
  ];

  const filteredItems = query
    ? items.filter(i =>
        i.title.toLowerCase().includes(query.toLowerCase()) ||
        i.tags.some(t => t.toLowerCase().includes(query.toLowerCase())) ||
        (i.type === 'password' && ((i as PasswordItem).username?.toLowerCase().includes(query.toLowerCase()) || (i as PasswordItem).website?.toLowerCase().includes(query.toLowerCase())))
      ).slice(0, 6)
    : [];

  const filteredActions = query
    ? quickActions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))
    : quickActions;

  const allResults = [...filteredItems.map((item, i) => ({ type: 'item' as const, item, index: i })), ...filteredActions.map((a, i) => ({ type: 'action' as const, action: a, index: filteredItems.length + i }))];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const result = allResults[selectedIndex];
      if (result?.type === 'item') {
        navigate(`/item/${result.item.id}`);
        close();
      } else if (result?.type === 'action') {
        result.action.action();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15%]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-md bg-vault-surface border border-vault-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-vault-border">
              <Search size={16} className="text-vault-text-muted flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search vault or type a command..."
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-sm text-vault-text placeholder:text-vault-text-muted focus:outline-none"
              />
              <kbd className="text-[10px] text-vault-text-muted bg-vault-surface-3 px-1.5 py-0.5 rounded border border-vault-border">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto p-2">
              {/* Vault items */}
              {filteredItems.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] text-vault-text-muted uppercase tracking-wider px-2 py-1 font-medium">Vault Items</p>
                  {filteredItems.map((item, i) => (
                    <button
                      key={item.id}
                      onClick={() => { navigate(`/item/${item.id}`); close(); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                        selectedIndex === i ? 'bg-vault-gold/10 text-vault-gold' : 'hover:bg-vault-surface-2'
                      }`}
                    >
                      <span className={getCategoryColor(item.type)}>{getCategoryIcon(item.type, 16)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-vault-text truncate">{item.title}</p>
                        <p className="text-xs text-vault-text-muted truncate">
                          {item.type === 'password' ? (item as PasswordItem).username : item.type}
                        </p>
                      </div>
                      <ArrowRight size={12} className="text-vault-text-muted" />
                    </button>
                  ))}
                </div>
              )}

              {/* Quick actions */}
              <div>
                <p className="text-[10px] text-vault-text-muted uppercase tracking-wider px-2 py-1 font-medium">
                  {query ? 'Actions' : 'Quick Actions'}
                </p>
                {filteredActions.map((action, i) => {
                  const globalIndex = filteredItems.length + i;
                  return (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                        selectedIndex === globalIndex ? 'bg-vault-gold/10 text-vault-gold' : 'hover:bg-vault-surface-2'
                      }`}
                    >
                      <span className="text-vault-text-muted">{action.icon}</span>
                      <span className="text-sm text-vault-text">{action.label}</span>
                    </button>
                  );
                })}
              </div>

              {query && filteredItems.length === 0 && filteredActions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-vault-text-muted">No results for "{query}"</p>
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-vault-border">
              <span className="flex items-center gap-1 text-[10px] text-vault-text-muted">
                <kbd className="bg-vault-surface-3 px-1 rounded text-[9px]">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1 text-[10px] text-vault-text-muted">
                <kbd className="bg-vault-surface-3 px-1 rounded text-[9px]">↵</kbd> Select
              </span>
              <span className="flex items-center gap-1 text-[10px] text-vault-text-muted">
                <kbd className="bg-vault-surface-3 px-1 rounded text-[9px]">ESC</kbd> Close
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
