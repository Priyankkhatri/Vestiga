import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import type { Toast } from '../../types/vault';

const icons: Record<Toast['type'], React.ReactNode> = {
  success: <CheckCircle size={16} className="text-vault-success" />,
  error: <XCircle size={16} className="text-vault-danger" />,
  warning: <AlertTriangle size={16} className="text-vault-warning" />,
  info: <Info size={16} className="text-vault-info" />,
};

const borderColors: Record<Toast['type'], string> = {
  success: 'border-vault-success/20',
  error: 'border-vault-danger/20',
  warning: 'border-vault-warning/20',
  info: 'border-vault-info/20',
};

export function ToastContainer() {
  const { toasts, removeToast } = useVault();

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-xs">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`flex items-center gap-3 px-4 py-3 bg-vault-surface border ${borderColors[toast.type]} rounded-xl shadow-lg`}
          >
            {icons[toast.type]}
            <span className="text-sm text-vault-text flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-vault-text-muted hover:text-vault-text transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
