import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'gold' | 'success' | 'danger' | 'info' | 'warning';
  size?: 'sm' | 'md';
}

const variantStyles = {
  default: 'bg-vault-surface-3 text-vault-text-secondary border-vault-border',
  gold: 'bg-vault-gold/10 text-vault-gold border-vault-gold/20',
  success: 'bg-vault-success/10 text-vault-success border-vault-success/20',
  danger: 'bg-vault-danger/10 text-vault-danger border-vault-danger/20',
  info: 'bg-vault-info/10 text-vault-info border-vault-info/20',
  warning: 'bg-vault-warning/10 text-vault-warning border-vault-warning/20',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-lg border uppercase tracking-wider ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {children}
    </span>
  );
}
