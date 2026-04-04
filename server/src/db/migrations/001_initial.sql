-- My-Vault Initial Database Schema
-- Run against PostgreSQL 16+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (zero-knowledge: we store auth_hash, never the password)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    auth_hash VARCHAR(128) NOT NULL,
    kdf_salt TEXT NOT NULL,
    kdf_params JSONB NOT NULL DEFAULT '{"iterations":600000}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Structured vault items
CREATE TABLE vault_items (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    password TEXT,
    type VARCHAR(50) NOT NULL,
    favorite BOOLEAN DEFAULT false,
    tags TEXT[],
    notes TEXT,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_vault_items_user ON vault_items(user_id);

-- Device sessions for multi-device tracking
CREATE TABLE device_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    refresh_token_hash VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for security events
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_user_time ON audit_logs(user_id, created_at DESC);
