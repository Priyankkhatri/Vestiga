import { motion } from 'framer-motion';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, description, confirmLabel = 'Confirm', danger = true,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        {danger && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-12 h-12 rounded-full bg-vault-danger/10 border border-vault-danger/20 flex items-center justify-center mx-auto mb-4"
          >
            <AlertTriangle size={24} className="text-vault-danger" />
          </motion.div>
        )}
        <h3 className="text-lg font-semibold text-vault-text mb-2">{title}</h3>
        <p className="text-sm text-vault-text-muted mb-6">{description}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
