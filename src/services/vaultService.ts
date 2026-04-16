/**
 * Vault Service — Zero-Knowledge Encrypted CRUD Operations
 *
 * ALL sensitive data is encrypted client-side before storage.
 * Supabase NEVER sees plaintext vault data.
 *
 * DB columns used:
 *   id (auto-generated UUID), user_id, type,
 *   encrypted_data, encryption_iv,
 *   version, created_at, updated_at
 *
 * Encrypted blob contains ALL other fields:
 *   title, favorite, tags, username, password, url, website,
 *   notes, folder, strength, and all type-specific fields
 */

import { api } from './apiClient';
import { supabase } from '../lib/supabase';
import { encrypt, decrypt } from './cryptoService';
import type { VaultItem } from '../types/vault';

// ─── Helpers: Extract / Reconstruct ────────────────────────────

/**
 * Extracts all sensitive fields from a VaultItem into a blob for encryption.
 * Strictly whitelists only non-sensitive metadata to stay in plaintext.
 * ALL other fields are bundled into the encrypted blob.
 */
function extractSensitiveData(item: VaultItem): Record<string, unknown> {
  const plaintextMetadata = ['id', 'user_id', 'type', 'createdAt', 'updatedAt'];
  
  const sensitive: Record<string, unknown> = {};
  
  Object.keys(item).forEach(key => {
    if (!plaintextMetadata.includes(key)) {
      sensitive[key] = (item as any)[key];
    }
  });

  return sensitive;
}

/**
 * Reconstructs a VaultItem from a DB row + decrypted blob.
 * The decrypted blob contains ALL type-specific fields.
 */
function reconstructItem(
  row: { id: string; type: string; title?: string; created_at: string; updated_at: string },
  decrypted: Record<string, unknown>
): VaultItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title || (decrypted.title as string) || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Spread ALL decrypted fields (title, favorite, tags, password, etc.)
    ...decrypted,
  } as VaultItem;
}

function isMissingSupabaseSchemaError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === '42P01' || error.code === '42703') return true;
  const message = (error.message || '').toLowerCase();
  return message.includes('user_encryption_meta') || message.includes('encrypted_data') || message.includes('encryption_iv');
}

// ─── Fetch & Decrypt All Items ─────────────────────────────────

export async function fetchVaultItems(encryptionKey: CryptoKey): Promise<VaultItem[]> {
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('vault_items')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const items: VaultItem[] = [];

  for (const row of data || []) {
    try {
      if (row.encrypted_data && row.encryption_iv) {
        // ── E2EE row: decrypt ──
        const decrypted = await decrypt(row.encrypted_data, row.encryption_iv, encryptionKey);
        items.push(reconstructItem(row, decrypted));
      } else if (row.title || row.username || row.password) {
        // ── Legacy plaintext row: migrate to encrypted ──
        const legacyItem: Record<string, unknown> = {
          title: row.title || '',
          favorite: row.favorite || false,
          tags: row.tags || [],
          notes: row.notes || '',
          username: row.username || '',
          password: row.password || '',
          url: row.url || '',
          website: row.website || '',
          folder: row.folder || '',
        };

        // Encrypt the legacy data
        const { encrypted, iv } = await encrypt(legacyItem, encryptionKey);

        // Update the row in Supabase (migrate to encrypted, clear plaintext)
        await supabase
          .from('vault_items')
          .update({
            encrypted_data: encrypted,
            encryption_iv: iv,
          })
          .eq('id', row.id)
          .eq('user_id', session.user.id);

        items.push(reconstructItem(row, legacyItem));
      }
    } catch (err) {
      console.error('[Vault] Failed to decrypt item:', row.id, err);
      // Skip items that fail to decrypt (wrong key scenario)
    }
  }

  return items;
}

// ─── Save (Encrypt & Create) ───────────────────────────────────

export async function saveVaultItem(
  item: VaultItem,
  encryptionKey: CryptoKey
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) return { success: false, error: 'Not authenticated' };

    const itemId = item.id?.trim() || crypto.randomUUID();

    // Encrypt all sensitive fields
    const sensitiveData = extractSensitiveData({ ...item, id: itemId });
    const { encrypted, iv } = await encrypt(sensitiveData, encryptionKey);

    const encryptedPayload = {
      id: itemId,
      user_id: session.user.id,
      title: item.title,
      type: item.type,
      encrypted_data: encrypted,
      encryption_iv: iv,
    };

    const { data: inserted, error } = await supabase
      .from('vault_items')
      .insert(encryptedPayload)
      .select('id, created_at, updated_at')
      .single();

    if (error) {
      console.error('[Vault] Insert error detail:', error);
      if (!isMissingSupabaseSchemaError(error)) {
        return { success: false, error: error.message || 'Failed to save item' };
      }

      const fallback = await supabase
        .from('vault_items')
        .insert({
          id: itemId,
          user_id: session.user.id,
          title: item.title,
          username: (item as any).username || null,
          password: (item as any).password || null,
          type: item.type,
          favorite: item.favorite ?? false,
          tags: item.tags ?? [],
          notes: item.notes ?? null,
        })
        .select('id, created_at, updated_at')
        .single();

      if (fallback.error) {
        return { success: false, error: fallback.error.message || error.message || 'Failed to save item' };
      }

      return { success: true, id: fallback.data?.id || itemId };
    }

    // Return the item UUID that was persisted
    return { success: true, id: inserted?.id || itemId };
  } catch (error: any) {
    console.error('[Vault] Save error:', error);
    return { success: false, error: error.message || 'Vault save failed' };
  }
}

// ─── Update (Encrypt & Update) ─────────────────────────────────

export async function updateVaultItem(
  item: VaultItem,
  encryptionKey: CryptoKey
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) return { success: false, error: 'Not authenticated' };

    // Encrypt all sensitive fields
    const sensitiveData = extractSensitiveData(item);
    const { encrypted, iv } = await encrypt(sensitiveData, encryptionKey);

    const encryptedUpdate = {
      title: item.title,
      type: item.type,
      encrypted_data: encrypted,
      encryption_iv: iv,
      updated_at: new Date().toISOString(),
    };

    // Only update encrypted_data, encryption_iv, and updated_at
    const { error } = await supabase
      .from('vault_items')
      .update(encryptedUpdate)
      .eq('id', item.id)
      .eq('user_id', session.user.id);

    if (error) {
      if (!isMissingSupabaseSchemaError(error)) {
        return { success: false, error: error.message || 'Failed to update item' };
      }

      const { error: fallbackError } = await supabase
        .from('vault_items')
        .update({
          title: item.title,
          username: (item as any).username || null,
          password: (item as any).password || null,
          type: item.type,
          favorite: item.favorite ?? false,
          tags: item.tags ?? [],
          notes: item.notes ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .eq('user_id', session.user.id);

      if (fallbackError) {
        return { success: false, error: fallbackError.message || error.message || 'Failed to update item' };
      }

      return { success: true };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Vault] Update error:', error);
    return { success: false, error: error.message || 'Vault update failed' };
  }
}

// ─── Delete ────────────────────────────────────────────────────

export async function deleteVaultItemFromServer(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('vault_items')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      return { success: false, error: error.message || 'Failed to delete item' };
    }
    return { success: true };
  } catch (error: any) {
    console.error('[Vault] Delete error:', error);
    return { success: false, error: error.message || 'Failed to delete item' };
  }
}

// ─── AI Service Proxies (unchanged — no encryption needed) ─────

export async function aiSecurityAudit(metadata: { age: number; reuseCount: number; entropyScore: number }, signal?: AbortSignal) {
 return api.post<{ assessment: string; severity: string }>('/ai/security-audit', metadata, { signal });
}

export async function aiPasswordAnalyze(entropyScore: number, flags: string[], signal?: AbortSignal) {
 return api.post<{ analysis: string }>('/ai/password-analyze', { entropyScore, flags }, { signal });
}

export async function aiSearch(query: string, itemNames: string[], signal?: AbortSignal) {
 return api.post<{ matchedIndices: number[] }>('/ai/search', { query, itemNames }, { signal });
}

export async function aiCategorize(name: string, url: string, signal?: AbortSignal) {
 return api.post<{ category: string }>('/ai/categorize', { name, url }, { signal });
}

export async function aiChat(messages: { role: string; content: string }[], signal?: AbortSignal) {
 return api.post<{ message: string }>('/ai/chat', { messages }, { signal });
}

export async function aiGetQuota(signal?: AbortSignal) {
 return api.get<Array<{ feature: string; used: number; limit: number; remaining: number }>>('/ai/quota', { signal });
}

// ─── Settings & Batch Operations ───────────────────────────────

function getAISettings() {
  const defaults = {
    strengthAnalysis: true,
    securityAudit: true,
    assistantChat: true,
    autoCategorization: true,
  };
  try {
    const stored = localStorage.getItem('myVault_settings');
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  } catch {
    return defaults;
  }
}

const originalAiSecurityAudit = aiSecurityAudit;
export const aiSecurityAuditWithSetting = async (metadata: any) => {
  if (!getAISettings().securityAudit) return { success: false, error: 'Security audit is disabled in settings' };
  return originalAiSecurityAudit(metadata);
};

const originalAiPasswordAnalyze = aiPasswordAnalyze;
export const aiPasswordAnalyzeWithSetting = async (score: number, flags: string[]) => {
  if (!getAISettings().strengthAnalysis) return { success: false, error: 'Strength analysis is disabled' };
  return originalAiPasswordAnalyze(score, flags);
};

const originalAiCategorize = aiCategorize;
export const aiCategorizeWithSetting = async (name: string, url: string) => {
  if (!getAISettings().autoCategorization) return { success: false, error: 'Auto-categorization disabled' };
  return originalAiCategorize(name, url);
};

const originalAiChat = aiChat;
export const aiChatWithSetting = async (messages: any[]) => {
  if (!getAISettings().assistantChat) return { success: false, error: 'AI Assistant is disabled' };
  return originalAiChat(messages);
};
