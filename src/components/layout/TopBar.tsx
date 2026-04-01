import { Search, Plus, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '../../context/VaultContext';
import { Badge } from '../ui/Badge';

interface TopBarProps {
  onOpenCommandPalette?: () => void;
}

export function TopBar({ onOpenCommandPalette }: TopBarProps) {
  const { searchQuery, setSearchQuery } = useVault();
  const navigate = useNavigate();

  return (
    <header className="h-14 border-b border-vault-border bg-vault-surface/80 backdrop-blur-xl flex items-center gap-3 px-4 flex-shrink-0">
      {/* Search */}
      <div className="flex-1 relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-text-muted" />
        <input
          type="text"
          placeholder="Search vault..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (onOpenCommandPalette) onOpenCommandPalette();
          }}
          className="w-full bg-vault-surface-2 border border-vault-border rounded-xl pl-9 pr-16 py-2 text-sm text-vault-text placeholder:text-vault-text-muted focus:outline-none focus:border-vault-gold/30 transition-colors"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] text-vault-text-muted bg-vault-surface-3 px-1.5 py-0.5 rounded border border-vault-border">
          <Command size={10} /> K
        </kbd>
      </div>

      {/* Status */}
      <Badge variant="gold">
        <span className="w-1.5 h-1.5 rounded-full bg-vault-gold animate-pulse" />
        Unlocked
      </Badge>

      {/* Quick Add */}
      <button
        onClick={() => navigate('/add')}
        className="w-8 h-8 rounded-xl bg-vault-gold/10 border border-vault-gold/20 flex items-center justify-center text-vault-gold hover:bg-vault-gold/20 transition-colors cursor-pointer"
      >
        <Plus size={16} />
      </button>
    </header>
  );
}
