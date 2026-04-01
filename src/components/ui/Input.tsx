import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  sensitive?: boolean;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, sensitive, icon, className = '', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isSensitive = sensitive || type === 'password';
    const inputType = isSensitive ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-medium text-vault-text-secondary uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-text-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`w-full bg-vault-surface-2 border border-vault-border rounded-xl px-4 py-2.5 text-sm text-vault-text placeholder:text-vault-text-muted focus:outline-none focus:border-vault-gold/50 focus:ring-1 focus:ring-vault-gold/20 transition-all duration-200 ${icon ? 'pl-10' : ''} ${isSensitive ? 'pr-10 font-mono' : ''} ${error ? 'border-vault-danger/50' : ''} ${className}`}
            {...props}
          />
          {isSensitive && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-muted hover:text-vault-text transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-vault-danger">{error}</p>}
      </div>
    );
  }
);
