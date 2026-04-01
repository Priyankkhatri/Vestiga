import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, AlertTriangle, KeyRound, Copy, Clock, CheckCircle, ArrowRight, RefreshCw,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { SecurityRing } from '../components/vault/VaultHelpers';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PasswordItem } from '../types/vault';

export function SecurityAudit() {
  const { items } = useVault();
  const navigate = useNavigate();

  const audit = useMemo(() => {
    const passwords = items.filter(i => i.type === 'password') as PasswordItem[];
    const weak = passwords.filter(p => p.strength === 'weak');
    const fair = passwords.filter(p => p.strength === 'fair');
    const strong = passwords.filter(p => p.strength === 'strong' || p.strength === 'excellent');

    // Detect reused passwords
    const pwMap = new Map<string, PasswordItem[]>();
    passwords.forEach(p => {
      const existing = pwMap.get(p.password) || [];
      existing.push(p);
      pwMap.set(p.password, existing);
    });
    const reused = Array.from(pwMap.entries()).filter(([_, items]) => items.length > 1);

    // Old passwords (>6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const old = passwords.filter(p => new Date(p.updatedAt) < sixMonthsAgo);

    const totalIssues = weak.length + reused.length + old.length;
    const maxScore = passwords.length * 3;
    const issueScore = (weak.length * 3) + (fair.length * 1) + (reused.length * 2) + (old.length * 1);
    const healthScore = maxScore > 0 ? Math.max(0, Math.round(((maxScore - issueScore) / maxScore) * 100)) : 100;

    return { passwords, weak, fair, strong, reused, old, totalIssues, healthScore };
  }, [items]);

  const issueCards = [
    {
      icon: AlertTriangle, color: 'text-vault-danger', bg: 'bg-vault-danger/10 border-vault-danger/20',
      title: 'Weak Passwords', count: audit.weak.length,
      desc: 'These passwords are easy to guess or crack.',
      items: audit.weak,
      badge: 'danger' as const,
    },
    {
      icon: Copy, color: 'text-vault-warning', bg: 'bg-vault-warning/10 border-vault-warning/20',
      title: 'Reused Passwords', count: audit.reused.length,
      desc: 'Same password used across multiple sites.',
      items: audit.reused.flatMap(([_, items]) => items),
      badge: 'warning' as const,
    },
    {
      icon: Clock, color: 'text-vault-info', bg: 'bg-vault-info/10 border-vault-info/20',
      title: 'Old Passwords', count: audit.old.length,
      desc: 'Passwords not updated in over 6 months.',
      items: audit.old,
      badge: 'info' as const,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-vault-text flex items-center gap-2">
            <Shield size={20} className="text-vault-gold" /> Security Audit
          </h2>
          <p className="text-xs text-vault-text-muted mt-0.5">Analyze your vault for security risks</p>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />}>
          Re-scan
        </Button>
      </div>

      {/* Health overview */}
      <div className="vault-card p-6 flex items-center gap-8">
        <SecurityRing score={audit.healthScore} size={140} strokeWidth={10} label="Health" />
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-sm text-vault-text-secondary mb-1">Vault Overview</p>
            <p className="text-2xl font-bold text-vault-text">{audit.passwords.length} <span className="text-sm font-normal text-vault-text-muted">passwords monitored</span></p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-vault-surface-2 border border-vault-border">
              <p className="text-lg font-bold text-vault-success">{audit.strong.length}</p>
              <p className="text-[10px] text-vault-text-muted uppercase tracking-wider">Strong</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-vault-surface-2 border border-vault-border">
              <p className="text-lg font-bold text-vault-warning">{audit.fair.length}</p>
              <p className="text-[10px] text-vault-text-muted uppercase tracking-wider">Fair</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-vault-surface-2 border border-vault-border">
              <p className="text-lg font-bold text-vault-danger">{audit.weak.length}</p>
              <p className="text-[10px] text-vault-text-muted uppercase tracking-wider">Weak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Issue cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-vault-text-secondary uppercase tracking-wider">Issues Found</h3>
        {issueCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="vault-card p-4"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${card.bg}`}>
                <card.icon size={18} className={card.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-vault-text">{card.title}</p>
                  <Badge variant={card.badge}>{card.count}</Badge>
                </div>
                <p className="text-xs text-vault-text-muted mb-3">{card.desc}</p>
                {card.count > 0 && (
                  <div className="space-y-1.5">
                    {card.items.slice(0, 3).map(item => (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/item/${item.id}`)}
                        className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-vault-surface-2 transition-colors cursor-pointer"
                      >
                        <KeyRound size={14} className="text-vault-text-muted" />
                        <span className="text-xs text-vault-text truncate">{item.title}</span>
                        <span className="text-[10px] text-vault-text-muted ml-auto">{item.website}</span>
                      </button>
                    ))}
                    {card.items.length > 3 && (
                      <p className="text-xs text-vault-gold cursor-pointer hover:underline pl-2">
                        +{card.items.length - 3} more
                      </p>
                    )}
                  </div>
                )}
              </div>
              {card.count > 0 && (
                <Button variant="outline" size="sm">Fix</Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="vault-card p-5">
        <h3 className="text-xs font-semibold text-vault-text-secondary uppercase tracking-wider mb-3">Recommendations</h3>
        <div className="space-y-3">
          {[
            { text: 'Use unique passwords for every account', done: audit.reused.length === 0 },
            { text: 'Update passwords older than 6 months', done: audit.old.length === 0 },
            { text: 'Replace all weak passwords with strong ones', done: audit.weak.length === 0 },
            { text: 'Enable biometric unlock for faster access', done: false },
            { text: 'Set up vault backup and recovery key', done: false },
          ].map((rec, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${rec.done ? 'bg-vault-success/20 text-vault-success' : 'bg-vault-surface-3 text-vault-text-muted'}`}>
                <CheckCircle size={12} />
              </div>
              <span className={`text-sm ${rec.done ? 'text-vault-text-secondary line-through' : 'text-vault-text'}`}>{rec.text}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
