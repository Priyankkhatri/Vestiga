import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-vault-gold text-vault-bg hover:bg-vault-gold-dim font-semibold',
  secondary: 'bg-vault-surface-2 text-vault-text border border-vault-border hover:bg-vault-surface-3 hover:border-vault-border-light',
  ghost: 'text-vault-text-secondary hover:text-vault-text hover:bg-vault-surface-2',
  danger: 'bg-vault-danger/10 text-vault-danger border border-vault-danger/20 hover:bg-vault-danger/20',
  outline: 'border border-vault-border text-vault-text-secondary hover:text-vault-text hover:border-vault-border-light hover:bg-vault-surface-2',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-sm rounded-xl gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, children, className = '', ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={`inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...(props as any)}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </motion.button>
    );
  }
);
