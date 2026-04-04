import { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Folder, KeyRound, MapPin, CreditCard, FileText, FolderLock, Plus, SlidersHorizontal, Loader2
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { VaultItemCard } from '../components/vault/VaultItemCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { VaultCategory } from '../types/vault';

const categories: { key: VaultCategory | 'all'; label: string; icon: any }[] = [
  { key: 'all', label: 'All Items', icon: Folder },
  { key: 'password', label: 'Passwords', icon: KeyRound },
  { key: 'address', label: 'Addresses', icon: MapPin },
  { key: 'card', label: 'Cards', icon: CreditCard },
  { key: 'note', label: 'Notes', icon: FileText },
  { key: 'document', label: 'Documents', icon: FolderLock },
];

export function VaultLibrary() {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const { 
    items, 
    searchQuery, 
    setSearchQuery, 
    debouncedSearchQuery,
    activeCategory, 
    setActiveCategory,
    isLoading
  } = useVault();
  
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setActiveCategory((category || 'all') as VaultCategory | 'all');
  }, [category, setActiveCategory]);

  // Keep local search sync with context if it changes from outside
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    setSearchQuery(val); // Context handles the secondary debounce to debouncedSearchQuery
  };

  const filteredItems = useMemo(() => {
    let filtered = activeCategory === 'all' ? items : items.filter(i => i.type === activeCategory);

    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort alphabetically by default for the vault
    return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  }, [items, activeCategory, debouncedSearchQuery]);

  const getCategoryCount = useMemo(() => (key: VaultCategory | 'all') => {
    if (key === 'all') return items.length;
    return items.filter(i => i.type === key).length;
  }, [items]);

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: typeof filteredItems } = {};
    filteredItems.forEach(item => {
      const firstLetter = item.title.charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(item);
    });
    return groups;
  }, [filteredItems]);

  return (
    <div className="flex h-full min-h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
      
      {/* LEFT PANEL: FILTERS/CATEGORIES */}
      <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200 p-6 overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Categories</h2>
        <nav className="space-y-1">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => navigate(cat.key === 'all' ? '/vault' : `/vault/${cat.key}`)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-teal-50 text-teal-700' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? "text-teal-600" : "text-gray-400"} />
                  {cat.label}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {getCategoryCount(cat.key)}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Tags</h3>
          {/* Sample tags placeholder, in a real app these would be dynamic */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 cursor-pointer">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Work
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 cursor-pointer">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Personal
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 cursor-pointer">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span> Finance
            </span>
          </div>
        </div>
      </div>

      {/* MAIN PANEL */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* TOP BAR FOR VAULT APP */}
        <div className="h-16 px-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {categories.find(c => c.key === activeCategory)?.label}
            </h1>
            <span className="text-sm text-gray-500">
              {filteredItems.length} items
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-64">
              <Input
                type="search"
                placeholder="Search category..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <Button variant="secondary" className="px-3">
              <SlidersHorizontal size={18} />
            </Button>
            <Button onClick={() => navigate('/add')}>
              <Plus size={18} className="mr-2" /> New Item
            </Button>
          </div>
        </div>

        {/* VAULT LIST */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-xl skeleton-shimmer flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded skeleton-shimmer" />
                    <div className="h-3 w-1/4 rounded skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 h-full flex items-center justify-center">
              <EmptyState
                icon={FolderLock}
                title={searchQuery ? "No items found" : "No saved passwords yet"}
                description={searchQuery 
                  ? 'No results matched your search. Try adjusting the keywords.' 
                  : 'This category is empty. Store a new encrypted entry.'
                }
                action={!searchQuery && (
                   <Button onClick={() => navigate('/add')}>
                     <Plus size={18} className="mr-2" /> Add Item
                   </Button>
                )}
              />
            </div>
          ) : (
            <div className="pb-8">
              {Object.keys(groupedItems).sort().map(letter => (
                <div key={letter}>
                  <div className="sticky top-0 bg-gray-50/95 backdrop-blur border-y border-gray-200 px-6 py-2 text-sm font-semibold text-gray-700 z-10">
                    {letter}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {groupedItems[letter].map(item => (
                      <VaultItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
