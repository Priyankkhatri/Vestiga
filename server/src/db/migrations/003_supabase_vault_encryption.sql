-- Migration 003: Add encrypted vault storage and master password metadata
-- Run this against the Supabase database so the frontend can persist encrypted vault items.

CREATE TABLE IF NOT EXISTS user_encryption_meta (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    salt TEXT NOT NULL,
    key_check TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vault_items
    ADD COLUMN IF NOT EXISTS encrypted_data TEXT,
    ADD COLUMN IF NOT EXISTS encryption_iv TEXT;

ALTER TABLE vault_items
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE user_encryption_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_user_encryption_meta" ON user_encryption_meta;
CREATE POLICY "own_user_encryption_meta"
    ON user_encryption_meta
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_vault_items" ON vault_items;
CREATE POLICY "own_vault_items"
    ON vault_items
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_users" ON users;
CREATE POLICY "own_users"
    ON users
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "own_device_sessions" ON device_sessions;
CREATE POLICY "own_device_sessions"
    ON device_sessions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_audit_logs" ON audit_logs;
CREATE POLICY "own_audit_logs"
    ON audit_logs
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
