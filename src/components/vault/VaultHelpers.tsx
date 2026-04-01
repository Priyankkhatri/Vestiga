import { VaultCategory } from '../../types/vault';
import { KeyRound, MapPin, CreditCard, FileText, FolderLock } from 'lucide-react';

interface SecurityRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function SecurityRing({ score, size = 120, strokeWidth = 8, label }: SecurityRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#d4a843';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(39,39,42,0.8)" strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={getColor()} strokeWidth={strokeWidth}
          fill="none" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-vault-text">{score}</span>
        {label && <span className="text-[10px] text-vault-text-muted uppercase tracking-wider">{label}</span>}
      </div>
    </div>
  );
}

export function getCategoryIcon(type: VaultCategory, size = 18) {
  switch (type) {
    case 'password': return <KeyRound size={size} />;
    case 'address': return <MapPin size={size} />;
    case 'card': return <CreditCard size={size} />;
    case 'note': return <FileText size={size} />;
    case 'document': return <FolderLock size={size} />;
  }
}

export function getCategoryLabel(type: VaultCategory) {
  switch (type) {
    case 'password': return 'Password';
    case 'address': return 'Address';
    case 'card': return 'Card';
    case 'note': return 'Note';
    case 'document': return 'Document';
  }
}

export function getCategoryColor(type: VaultCategory) {
  switch (type) {
    case 'password': return 'text-vault-gold';
    case 'address': return 'text-vault-info';
    case 'card': return 'text-purple-400';
    case 'note': return 'text-vault-success';
    case 'document': return 'text-orange-400';
  }
}

export function getCategoryBg(type: VaultCategory) {
  switch (type) {
    case 'password': return 'bg-vault-gold/10 border-vault-gold/20';
    case 'address': return 'bg-vault-info/10 border-vault-info/20';
    case 'card': return 'bg-purple-400/10 border-purple-400/20';
    case 'note': return 'bg-vault-success/10 border-vault-success/20';
    case 'document': return 'bg-orange-400/10 border-orange-400/20';
  }
}
