import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import toast from 'react-hot-toast';
import { VaultItem, VaultCategory, VaultState } from '../types/vault';

import { saveVaultItem, updateVaultItem as updateVaultItemServer, deleteVaultItemFromServer, fetchVaultItems } from '../services/vaultService';
import { useAuth } from './AuthContext';
import { useMasterPassword } from './MasterPasswordContext';

interface VaultContextType extends VaultState {
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: VaultCategory | 'all') => void;
  addItem: (item: VaultItem) => Promise<void>;
  updateItem: (item: VaultItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  getFilteredItems: () => VaultItem[];
  clearVault: () => Promise<void>;
  debouncedSearchQuery: string;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { encryptionKey, isUnlocked } = useMasterPassword();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<VaultCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch items when session + encryption key are available
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    if (session && isUnlocked && encryptionKey) {
      fetchVaultItems(encryptionKey).then(serverItems => {
        if (mounted) {
          setItems(serverItems);
          setIsLoading(false);
        }
      }).catch(err => {
        if (mounted) {
          toast.error('Failed to load items from server');
          console.error('[VaultContext] Fetch error:', err);
          setIsLoading(false);
        }
      });
    } else if (!session) {
      setItems([]);
      setIsLoading(false);
    } else {
      // session exists but vault is locked — keep loading
      setIsLoading(true);
    }

    return () => { mounted = false; };
  }, [session, isUnlocked, encryptionKey]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'success': toast.success(message); break;
      case 'error': toast.error(message); break;
      case 'warning': toast.error(message, { icon: '⚠️' }); break;
      case 'info': toast(message, { icon: 'ℹ️' }); break;
      default: toast(message);
    }
  }, []);

  const addItem = useCallback(async (item: VaultItem) => {
    if (!encryptionKey) {
      addToast('Vault is locked. Please unlock first.', 'error');
      return;
    }
    const toastId = toast.loading('Syncing... ');
    try {
      const res = await saveVaultItem(item, encryptionKey);
      if (!res.success) {
        throw new Error(res.error || 'Failed to sync item to server');
      } else {
        // Use the Supabase-generated UUID for the local item
        const now = new Date().toISOString();
        const savedItem = {
          ...item,
          id: res.id || item.id,
          createdAt: item.createdAt || now,
          updatedAt: item.updatedAt || now,
        };
        setItems(prev => [savedItem, ...prev]);
        toast.success('Item encrypted and saved', { id: toastId });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred while adding item';
      toast.error(message, { id: toastId });
      console.error('[VaultContext] Add error:', err);
      throw err;
    }
  }, [addToast, encryptionKey]);

  const updateItem = useCallback(async (updated: VaultItem) => {
    if (!encryptionKey) {
      addToast('Vault is locked. Please unlock first.', 'error');
      return;
    }
    const toastId = toast.loading('Syncing... ');
    try {
      const res = await updateVaultItemServer(updated, encryptionKey);
      if (!res.success) {
        throw new Error(res.error || 'Failed to update item on server');
      } else {
        setItems(prev => prev.map(item => item.id === updated.id ? updated : item));
        toast.success('Item securely updated', { id: toastId });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred while updating item';
      toast.error(message, { id: toastId });
      console.error('[VaultContext] Update error:', err);
      throw err;
    }
  }, [addToast, encryptionKey]);

  const deleteItem = useCallback(async (id: string) => {
    const toastId = toast.loading('Deleting... ');
    try {
      const res = await deleteVaultItemFromServer(id);
      if (!res.success) {
        toast.error(res.error || 'Failed to delete item from server', { id: toastId });
      } else {
        setItems(prev => prev.filter(item => item.id !== id));
        toast.success('Item erased from vault', { id: toastId });
      }
    } catch (err) {
      toast.error('An unexpected error occurred while deleting item', { id: toastId });
      console.error('[VaultContext] Delete error:', err);
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    if (!encryptionKey) return;
    const item = items.find(i => i.id === id);
    if (!item) return;

    const updated = { ...item, favorite: !item.favorite };
    
    // First update locally for immediate UI response
    setItems(prev => prev.map(i => i.id === id ? updated : i));
    
    try {
      const res = await updateVaultItemServer(updated, encryptionKey);
      if (!res.success) {
        // Revert on failure
        setItems(prev => prev.map(i => i.id === id ? item : i));
        addToast(res.error || 'Failed to update favorite', 'error');
      }
    } catch (err) {
      setItems(prev => prev.map(i => i.id === id ? item : i));
      addToast('Connection error: Failed to update favorite', 'error');
      console.error('[VaultContext] Toggle favorite error:', err);
    }
  }, [items, addToast, encryptionKey]);

  const clearVault = useCallback(async () => {
    try {
      await Promise.all(items.map(item => deleteVaultItemFromServer(item.id)));
      setItems([]);
      addToast('All vault data cleared', 'info');
    } catch (err) {
      addToast('Failed to clear some items', 'error');
      console.error('[VaultContext] Clear vault error:', err);
    }
  }, [items, addToast]);

  const getFilteredItems = useCallback(() => {
    let filtered = items;
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.type === activeCategory);
    }
    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.tags.some(tag => tag.toLowerCase().includes(q)) ||
        (item.type === 'password' && (item.username?.toLowerCase().includes(q) || item.website?.toLowerCase().includes(q)))
      );
    }
    return filtered;
  }, [items, activeCategory, debouncedSearchQuery]);

  return (
    <VaultContext.Provider value={{
      items, searchQuery, debouncedSearchQuery, activeCategory, isLoading,
      setSearchQuery, setActiveCategory,
      addItem, updateItem, deleteItem, toggleFavorite,
      addToast, getFilteredItems, clearVault,
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
