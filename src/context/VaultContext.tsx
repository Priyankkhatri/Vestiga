import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { VaultItem, VaultCategory, Toast, VaultState } from '../types/vault';
import { allMockItems } from '../data/mockData';

interface VaultContextType extends VaultState {
  unlock: (password: string) => boolean;
  lock: () => void;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: VaultCategory | 'all') => void;
  addItem: (item: VaultItem) => void;
  updateItem: (item: VaultItem) => void;
  deleteItem: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  getFilteredItems: () => VaultItem[];
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

const MASTER_PASSWORD = 'vault2026';

export function VaultProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(true);
  const [items, setItems] = useState<VaultItem[]>(allMockItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<VaultCategory | 'all'>('all');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const unlock = useCallback((password: string) => {
    if (password === MASTER_PASSWORD || password.length > 0) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, []);

  const lock = useCallback(() => {
    setIsLocked(true);
    setSearchQuery('');
  }, []);

  const addItem = useCallback((item: VaultItem) => {
    setItems(prev => [item, ...prev]);
    addToast('Item added to vault', 'success');
  }, []);

  const updateItem = useCallback((updated: VaultItem) => {
    setItems(prev => prev.map(item => item.id === updated.id ? updated : item));
    addToast('Item updated', 'success');
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    addToast('Item deleted', 'info');
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, favorite: !item.favorite } : item
    ));
  }, []);

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getFilteredItems = useCallback(() => {
    let filtered = items;
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.type === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.tags.some(tag => tag.toLowerCase().includes(q)) ||
        (item.type === 'password' && (item.username?.toLowerCase().includes(q) || item.website?.toLowerCase().includes(q)))
      );
    }
    return filtered;
  }, [items, activeCategory, searchQuery]);

  return (
    <VaultContext.Provider value={{
      isLocked, items, searchQuery, activeCategory, toasts,
      unlock, lock, setSearchQuery, setActiveCategory,
      addItem, updateItem, deleteItem, toggleFavorite,
      addToast, removeToast, getFilteredItems,
    }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) throw new Error('useVault must be used within VaultProvider');
  return context;
}
