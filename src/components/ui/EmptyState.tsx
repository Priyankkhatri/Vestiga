import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-vault-surface-2 border border-vault-border flex items-center justify-center text-vault-text-muted mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-vault-text mb-1">{title}</h3>
      <p className="text-sm text-vault-text-muted text-center max-w-xs mb-6">{description}</p>
      {action}
    </motion.div>
  );
}
