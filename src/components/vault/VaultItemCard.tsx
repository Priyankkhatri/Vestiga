import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ExternalLink } from 'lucide-react';
import { VaultItem, PasswordItem } from '../../types/vault';
import { CopyButton } from '../ui/CopyButton';
import { Badge } from '../ui/Badge';
import { getCategoryIcon } from './VaultHelpers';

interface VaultItemCardProps {
  item: VaultItem;
}

export const VaultItemCard = memo(function VaultItemCard({ item }: VaultItemCardProps) {
  const navigate = useNavigate();

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
    <div 
      onClick={() => navigate(`/item/${item.id}`)}
      className="flex items-center gap-3 px-6 py-3 hover:bg-white group cursor-pointer border-b border-gray-100 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 active:scale-[0.99] relative"
    >
      {/* Icon Area */}
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 flex-shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors duration-200 border border-gray-100">
        {getCategoryIcon(item.type, 18)}
      </div>

      {/* Info Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {item.title}
          </p>
          {item.favorite && <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5 min-w-0">
          <p className="text-xs text-gray-500 truncate">{getSubtitle()}</p>
          {item.type === 'password' && (item as PasswordItem).strength && (
            <Badge variant={(item as PasswordItem).strength === 'excellent' ? 'green' : 'amber'} className="scale-75 origin-left">
              {(item as PasswordItem).strength}
            </Badge>
          )}
        </div>
      </div>

      {/* Action Buttons (Visible on hover) */}
      <div className="hidden group-hover:flex items-center gap-1">
        {getCopyValue() && (
          <div onClick={e => e.stopPropagation()}>
            <CopyButton value={getCopyValue()} size={16} />
          </div>
        )}
        {item.type === 'password' && (item as PasswordItem).website && (
          <a
            href={(item as PasswordItem).website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none transition-colors active:scale-95"
            title="Visit website"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    </div>
  );
});
