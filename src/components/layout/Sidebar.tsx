import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, KeyRound, MapPin, CreditCard, FileText, FolderLock,
  Shield, Settings, Lock, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { useState } from 'react';

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/vault', icon: FolderLock, label: 'All Items' },
  { path: '/vault/password', icon: KeyRound, label: 'Passwords' },
  { path: '/vault/address', icon: MapPin, label: 'Addresses' },
  { path: '/vault/card', icon: CreditCard, label: 'Cards' },
  { path: '/vault/note', icon: FileText, label: 'Notes' },
  { path: '/vault/document', icon: FolderLock, label: 'Documents' },
  { path: '/security', icon: Shield, label: 'Security' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { items, lock } = useVault();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const getCategoryCount = (type: string) => {
    if (type === 'All Items') return items.length;
    const map: Record<string, string> = {
      Passwords: 'password', Addresses: 'address', Cards: 'card',
      Notes: 'note', Documents: 'document',
    };
    return items.filter(i => i.type === map[type]).length;
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.2 }}
      className="h-full bg-vault-surface border-r border-vault-border flex flex-col flex-shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-5 border-b border-vault-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-vault-gold/10 border border-vault-gold/20 flex items-center justify-center flex-shrink-0">
          <FolderLock size={16} className="text-vault-gold" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
            <h1 className="text-sm font-bold text-vault-text truncate">The Vault</h1>
            <p className="text-[10px] text-vault-text-muted uppercase tracking-widest">Encrypted</p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const count = getCategoryCount(label);
          return (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 group ${
                  isActive
                    ? 'bg-vault-gold/10 text-vault-gold border border-vault-gold/15'
                    : 'text-vault-text-secondary hover:text-vault-text hover:bg-vault-surface-2 border border-transparent'
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate font-medium">{label}</span>
                  {count > 0 && ['Passwords', 'Addresses', 'Cards', 'Notes', 'Documents', 'All Items'].includes(label) && (
                    <span className="text-[10px] text-vault-text-muted bg-vault-surface-3 px-1.5 py-0.5 rounded-md">
                      {count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-vault-border space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-vault-text-muted hover:text-vault-text hover:bg-vault-surface-2 transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
        <button
          onClick={() => { lock(); navigate('/'); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-vault-text-muted hover:text-vault-danger hover:bg-vault-danger/5 transition-colors cursor-pointer"
        >
          <Lock size={18} className="flex-shrink-0" />
          {!collapsed && <span>Lock Vault</span>}
        </button>
      </div>
    </motion.aside>
  );
}
