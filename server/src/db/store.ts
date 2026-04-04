/**
 * In-Memory Store
 * 
 * Development fallback when PostgreSQL is not available.
 * Provides the same interface as the DB layer but stores everything in RAM.
 * Data is lost on server restart — for development only.
 */

import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'dev-db.json');

// ─── In-Memory Tables ───────────────────────────────────────────

interface UserRow {
  id: string;
  email: string;
  auth_hash: string;
  kdf_salt: string;
  kdf_params: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

interface VaultItemRow {
  id: string;
  user_id: string;
  title: string;
  username?: string;
  password?: string;
  type: string;
  favorite: boolean;
  tags: string[];
  notes?: string;
  version: number;
  created_at: Date;
  updated_at: Date;
}

interface DeviceSessionRow {
  id: string;
  user_id: string;
  device_name: string;
  ip_address: string;
  user_agent: string;
  last_active: Date;
  refresh_token_hash: string;
  created_at: Date;
}



interface AuditLogRow {
  id: string;
  user_id: string | null;
  event_type: string;
  metadata: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: Date;
}

// ─── Store Singleton ────────────────────────────────────────────

const store = {
  users: new Map<string, UserRow>(),
  vaultItems: new Map<string, VaultItemRow>(),
  deviceSessions: new Map<string, DeviceSessionRow>(),
  auditLogs: [] as AuditLogRow[],
};

// ─── Persistence Layer ──────────────────────────────────────────

function saveToDisk() {
  const data = {
    users: Array.from(store.users.entries()),
    vaultItems: Array.from(store.vaultItems.entries()),
    deviceSessions: Array.from(store.deviceSessions.entries()),
    auditLogs: store.auditLogs,
  };
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function loadFromDisk() {
  if (!fs.existsSync(DB_PATH)) return;
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    store.users = new Map(data.users);
    store.vaultItems = new Map(data.vaultItems);
    store.deviceSessions = new Map(data.deviceSessions);
    store.auditLogs = data.auditLogs;
  } catch (err) {
    console.error('Failed to load dev-db.json:', err);
  }
}

// Initial load
loadFromDisk();

// ─── User Operations ────────────────────────────────────────────

export async function createUser(email: string, authHash: string, salt: string, kdfParams: Record<string, unknown>) {
  const id = uuid();
  const now = new Date();
  const user: UserRow = { id, email, auth_hash: authHash, kdf_salt: salt, kdf_params: kdfParams, created_at: now, updated_at: now };
  store.users.set(id, user);
  saveToDisk();
  return user;
}

export async function findUserByEmail(email: string) {
  for (const user of store.users.values()) {
    if (user.email === email) return user;
  }
  return null;
}

export async function findUserById(id: string) {
  return store.users.get(id) || null;
}

export async function updateUserAuth(userId: string, authHash: string, kdfSalt: string, kdfParams: Record<string, unknown>) {
  const user = store.users.get(userId);
  if (user) {
    user.auth_hash = authHash;
    user.kdf_salt = kdfSalt;
    user.kdf_params = kdfParams;
    user.updated_at = new Date();
    saveToDisk();
    return true;
  }
  return false;
}

export async function deleteUser(userId: string) {
  if (store.users.has(userId)) {
    store.users.delete(userId);
    // Cascade delete vault items
    for (const [itemId, item] of store.vaultItems.entries()) {
      if (item.user_id === userId) store.vaultItems.delete(itemId);
    }
    // Cascade delete sessions
    for (const [sessionId, session] of store.deviceSessions.entries()) {
      if (session.user_id === userId) store.deviceSessions.delete(sessionId);
    }
    saveToDisk();
    return true;
  }
  return false;
}

// ─── Vault Item Operations ──────────────────────────────────────

export async function createVaultItem(
  userId: string, id: string, title: string, username: string | undefined,
  password: string | undefined, type: string, favorite: boolean, tags: string[], notes: string | undefined
) {
  const now = new Date();
  const item: VaultItemRow = {
    id, user_id: userId, title, username, password, type,
    favorite, tags, notes, version: 1, created_at: now, updated_at: now,
  };
  store.vaultItems.set(id, item);
  saveToDisk();
  return item;
}

export async function getVaultItems(userId: string) {
  const items: VaultItemRow[] = [];
  for (const item of store.vaultItems.values()) {
    if (item.user_id === userId) items.push(item);
  }
  return items;
}

export async function getVaultItem(userId: string, itemId: string) {
  const item = store.vaultItems.get(itemId);
  if (item && item.user_id === userId) return item;
  return null;
}

export async function updateVaultItem(
  userId: string, itemId: string, title: string, username: string | undefined,
  password: string | undefined, type: string, favorite: boolean, tags: string[], notes: string | undefined, expectedVersion: number
) {
  const item = store.vaultItems.get(itemId);
  if (!item || item.user_id !== userId) return null;
  if (item.version !== expectedVersion) return { conflict: true, serverVersion: item.version };

  item.title = title;
  item.username = username;
  item.password = password;
  item.type = type;
  item.favorite = favorite;
  item.tags = tags;
  item.notes = notes;
  item.version += 1;
  item.updated_at = new Date();
  saveToDisk();
  return item;
}

export async function deleteVaultItem(userId: string, itemId: string) {
  const item = store.vaultItems.get(itemId);
  if (item && item.user_id === userId) {
    store.vaultItems.delete(itemId);
    saveToDisk();
    return true;
  }
  return false;
}

// ─── Device Session Operations ──────────────────────────────────

export async function createDeviceSession(
  userId: string, deviceName: string, ipAddress: string,
  userAgent: string, refreshTokenHash: string
) {
  const id = uuid();
  const session: DeviceSessionRow = {
    id, user_id: userId, device_name: deviceName, ip_address: ipAddress,
    user_agent: userAgent, last_active: new Date(), refresh_token_hash: refreshTokenHash,
    created_at: new Date(),
  };
  store.deviceSessions.set(id, session);
  saveToDisk();
  return session;
}

export async function findSessionByRefreshHash(hash: string) {
  for (const session of store.deviceSessions.values()) {
    if (session.refresh_token_hash === hash) return session;
  }
  return null;
}

export async function updateSessionRefreshHash(sessionId: string, newHash: string) {
  const session = store.deviceSessions.get(sessionId);
  if (session) {
    session.refresh_token_hash = newHash;
    session.last_active = new Date();
    saveToDisk();
  }
}

export async function getDeviceSessions(userId: string) {
  const sessions: DeviceSessionRow[] = [];
  for (const session of store.deviceSessions.values()) {
    if (session.user_id === userId) sessions.push(session);
  }
  return sessions;
}

export async function deleteDeviceSession(userId: string, sessionId: string) {
  const session = store.deviceSessions.get(sessionId);
  if (session && session.user_id === userId) {
    store.deviceSessions.delete(sessionId);
    saveToDisk();
    return true;
  }
  return false;
}

export async function deleteOtherDeviceSessions(userId: string, currentSessionId: string) {
  let deletedCount = 0;
  for (const [sessionId, session] of store.deviceSessions.entries()) {
    if (session.user_id === userId && sessionId !== currentSessionId) {
      store.deviceSessions.delete(sessionId);
      deletedCount++;
    }
  }
  if (deletedCount > 0) saveToDisk();
  return deletedCount;
}



// ─── Audit Log Operations ───────────────────────────────────────

export async function createAuditLog(
  userId: string | null, eventType: string, metadata: Record<string, unknown>,
  ipAddress: string, userAgent: string
) {
  const log: AuditLogRow = {
    id: uuid(), user_id: userId, event_type: eventType, metadata,
    ip_address: ipAddress, user_agent: userAgent, created_at: new Date(),
  };
  store.auditLogs.push(log);
  saveToDisk();
  return log;
}

export async function getAuditLogs(userId: string, limit = 50) {
  return store.auditLogs
    .filter(l => l.user_id === userId)
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    .slice(0, limit);
}
