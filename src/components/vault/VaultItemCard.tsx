import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, ExternalLink } from 'lucide-react';
import { VaultItem, PasswordItem } from '../../types/vault';
import { CopyButton } from '../ui/CopyButton';
import { Badge } from '../ui/Badge';
import { getCategoryIcon, getCategoryColor, getCategoryBg } from './VaultHelpers';
import { useVault } from '../../context/VaultContext';

interface VaultItemCardProps {
  item: VaultItem;
  index?: number;
}

export function VaultItemCard({ item, index = 0 }: VaultItemCardProps) {
  const navigate = useNavigate();
  const { toggleFavorite } = useVault();

  const getSubtitle = () => {
    switch (item.type) {
      case 'password': return item.username;
      case 'address': return `${item.city}, ${item.state}`;
      case 'card': return item.number;
      case 'note': return item.content.substring(0, 50) + '...';
      case 'document': return `${item.fileName} · ${item.fileSize}`;
    }
  };

  const getCopyValue = () => {
    switch (item.type) {
      case 'password': return item.password;
      case 'address': return `${item.addressLine1}, ${item.city}, ${item.state} ${item.zipCode}`;
      case 'card': return item.number.replace(/\s/g, '');
      case 'note': return item.content;
      default: return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={() => navigate(`/item/${item.id}`)}
      className="vault-card p-3.5 cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${getCategoryBg(item.type)} ${getCategoryColor(item.type)}`}>
          {getCategoryIcon(item.type, 18)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-vault-text truncate">{item.title}</p>
            {item.favorite && <Star size={12} className="text-vault-gold fill-vault-gold flex-shrink-0" />}
          </div>
          <p className="text-xs text-vault-text-muted truncate mt-0.5">{getSubtitle()}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {getCopyValue() && <CopyButton value={getCopyValue()} size={14} />}
          {item.type === 'password' && (
            <a
              href={(item as PasswordItem).url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded-lg text-vault-text-muted hover:text-vault-info transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
