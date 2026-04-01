import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, SlidersHorizontal, Grid3X3, List, Plus, Star, FolderLock,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { VaultItemCard } from '../components/vault/VaultItemCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { VaultCategory } from '../types/vault';

const categories: { key: VaultCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All Items' },
  { key: 'password', label: 'Passwords' },
  { key: 'address', label: 'Addresses' },
  { key: 'card', label: 'Cards' },
  { key: 'note', label: 'Notes' },
  { key: 'document', label: 'Documents' },
];

type SortOption = 'recent' | 'name' | 'oldest';

export function VaultLibrary() {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const { items, searchQuery, setSearchQuery } = useVault();
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFavorites, setShowFavorites] = useState(false);

  const activeCategory = (category || 'all') as VaultCategory | 'all';

  const filteredItems = useMemo(() => {
    let filtered = activeCategory === 'all' as string ? items : items.filter(i => i.type === activeCategory);

    if (showFavorites) filtered = filtered.filter(i => i.favorite);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case 'recent':
        return [...filtered].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      case 'name':
        return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
      case 'oldest':
        return [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      default:
        return filtered;
    }
  }, [items, activeCategory, searchQuery, sortBy, showFavorites]);

  const getCategoryCount = (key: VaultCategory | 'all') => {
    if (key === 'all') return items.length;
    return items.filter(i => i.type === key).length;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-5 max-w-4xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-vault-text">
            {categories.find(c => c.key === activeCategory)?.label || 'Vault'}
          </h2>
          <p className="text-xs text-vault-text-muted mt-0.5">{filteredItems.length} items</p>
        </div>
        <Button
          icon={<Plus size={16} />}
          onClick={() => navigate('/add')}
          size="sm"
        >
          Add Item
        </Button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => navigate(cat.key === 'all' ? '/vault' : `/vault/${cat.key}`)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat.key
                ? 'bg-vault-gold/10 text-vault-gold border border-vault-gold/20'
                : 'text-vault-text-muted hover:text-vault-text hover:bg-vault-surface-2 border border-transparent'
            }`}
          >
            {cat.label}
            <span className="text-[10px] opacity-60">{getCategoryCount(cat.key)}</span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-text-muted" />
          <input
            type="text"
            placeholder={`Search ${categories.find(c => c.key === activeCategory)?.label.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-vault-surface-2 border border-vault-border rounded-xl pl-9 pr-4 py-2 text-sm text-vault-text placeholder:text-vault-text-muted focus:outline-none focus:border-vault-gold/30 transition-colors"
          />
        </div>

        <button
          onClick={() => setShowFavorites(!showFavorites)}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            showFavorites
              ? 'bg-vault-gold/10 border-vault-gold/20 text-vault-gold'
              : 'bg-vault-surface-2 border-vault-border text-vault-text-muted hover:text-vault-text'
          }`}
        >
          <Star size={16} />
        </button>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="bg-vault-surface-2 border border-vault-border rounded-xl px-3 py-2 text-xs text-vault-text-secondary focus:outline-none focus:border-vault-gold/30 cursor-pointer appearance-none"
        >
          <option value="recent">Recent</option>
          <option value="name">Name</option>
          <option value="oldest">Oldest</option>
        </select>

        <div className="flex bg-vault-surface-2 border border-vault-border rounded-xl overflow-hidden">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 cursor-pointer ${viewMode === 'list' ? 'bg-vault-surface-3 text-vault-text' : 'text-vault-text-muted'}`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 cursor-pointer ${viewMode === 'grid' ? 'bg-vault-surface-3 text-vault-text' : 'text-vault-text-muted'}`}
          >
            <Grid3X3 size={16} />
          </button>
        </div>
      </div>

      {/* Items */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<FolderLock size={28} />}
          title={searchQuery ? 'No results found' : 'No items yet'}
          description={searchQuery ? 'Try a different search term' : 'Add your first item to get started'}
          action={
            !searchQuery && (
              <Button icon={<Plus size={16} />} onClick={() => navigate('/add')} size="sm">
                Add Item
              </Button>
            )
          }
        />
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-1.5'}>
          {filteredItems.map((item, i) => (
            <VaultItemCard key={item.id} item={item} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
