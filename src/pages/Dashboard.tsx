import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound, MapPin, CreditCard, FileText, FolderLock,
  Shield, Plus, Wand2, Star, Clock, ArrowRight,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { SecurityRing, getCategoryIcon, getCategoryColor, getCategoryBg } from '../components/vault/VaultHelpers';
import { VaultItemCard } from '../components/vault/VaultItemCard';

const quickActions = [
  { icon: KeyRound, label: 'Password', path: '/add/password', color: 'text-vault-gold', bg: 'bg-vault-gold/10 border-vault-gold/20' },
  { icon: MapPin, label: 'Address', path: '/add/address', color: 'text-vault-info', bg: 'bg-vault-info/10 border-vault-info/20' },
  { icon: CreditCard, label: 'Card', path: '/add/card', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  { icon: FileText, label: 'Note', path: '/add/note', color: 'text-vault-success', bg: 'bg-vault-success/10 border-vault-success/20' },
  { icon: FolderLock, label: 'Document', path: '/add/document', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
  { icon: Wand2, label: 'Generate', path: '/add/password', color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/20' },
];

export function Dashboard() {
  const { items } = useVault();
  const navigate = useNavigate();

  const passwordCount = items.filter(i => i.type === 'password').length;
  const weakPasswords = items.filter(i => i.type === 'password' && (i.strength === 'weak' || i.strength === 'fair')).length;
  const healthScore = Math.round(((passwordCount - weakPasswords) / Math.max(passwordCount, 1)) * 100);
  const recentItems = [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
  const favoriteItems = items.filter(i => i.favorite);

  const stats = [
    { label: 'Total Items', value: items.length, icon: FolderLock, color: 'text-vault-gold' },
    { label: 'Passwords', value: passwordCount, icon: KeyRound, color: 'text-vault-info' },
    { label: 'Favorites', value: favoriteItems.length, icon: Star, color: 'text-yellow-400' },
    { label: 'Weak', value: weakPasswords, icon: Shield, color: weakPasswords > 0 ? 'text-vault-danger' : 'text-vault-success' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6 max-w-4xl"
    >
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-bold text-vault-text">Welcome back</h2>
        <p className="text-sm text-vault-text-muted mt-1">Your vault is secure and up to date.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="vault-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={16} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-vault-text">{stat.value}</p>
            <p className="text-[10px] text-vault-text-muted uppercase tracking-wider mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions + Security */}
      <div className="grid grid-cols-3 gap-4">
        {/* Quick actions */}
        <div className="col-span-2">
          <h3 className="text-xs font-semibold text-vault-text-secondary uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                className={`vault-card p-3 flex flex-col items-center gap-2 cursor-pointer`}
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${action.bg} ${action.color}`}>
                  <action.icon size={18} />
                </div>
                <span className="text-xs font-medium text-vault-text-secondary">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Security Health */}
        <div className="vault-card p-4 flex flex-col items-center justify-center">
          <h3 className="text-xs font-semibold text-vault-text-secondary uppercase tracking-wider mb-3">Vault Health</h3>
          <SecurityRing score={healthScore} size={100} label="Score" />
          <button
            onClick={() => navigate('/security')}
            className="mt-3 flex items-center gap-1 text-xs text-vault-gold hover:underline cursor-pointer"
          >
            View Audit <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Recent Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-vault-text-secondary uppercase tracking-wider flex items-center gap-2">
            <Clock size={14} /> Recent Items
          </h3>
          <button
            onClick={() => navigate('/vault')}
            className="text-xs text-vault-gold hover:underline cursor-pointer flex items-center gap-1"
          >
            View All <ArrowRight size={12} />
          </button>
        </div>
        <div className="space-y-1.5">
          {recentItems.map((item, i) => (
            <VaultItemCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
