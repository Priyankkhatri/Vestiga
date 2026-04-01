import { motion } from 'framer-motion';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer group">
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && <p className="text-sm font-medium text-vault-text">{label}</p>}
          {description && <p className="text-xs text-vault-text-muted mt-0.5">{description}</p>}
        </div>
      )}
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer ${
          checked ? 'bg-vault-gold' : 'bg-vault-surface-3 border border-vault-border'
        }`}
      >
        <motion.div
          layout
          className={`absolute top-[3px] w-4 h-4 rounded-full shadow ${
            checked ? 'bg-vault-bg' : 'bg-vault-text-muted'
          }`}
          animate={{ left: checked ? 21 : 3 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </label>
  );
}
