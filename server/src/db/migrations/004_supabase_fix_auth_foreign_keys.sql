-- Migration 004: Fix foreign keys to reference Supabase auth.users
--
-- Background:
-- The web app and extension both use Supabase Auth, so user ids are in auth.users.
-- If your earlier schema referenced public.users(id), inserts into vault tables will
-- fail with foreign key violations (because public.users rows are never created by Supabase Auth).
--
-- Run this in the Supabase SQL editor.

DO $$
DECLARE
  r record;
BEGIN
  -- Drop any foreign keys that point at public.users(id) for our tables.
  FOR r IN
    SELECT
      conname,
      conrelid::regclass AS table_name
    FROM pg_constraint
    WHERE contype = 'f'
      AND confrelid = to_regclass('public.users')
      AND conrelid IN (
        to_regclass('public.vault_items'),
        to_regclass('public.device_sessions'),
        to_regclass('public.audit_logs'),
        to_regclass('public.user_encryption_meta')
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.table_name, r.conname);
  END LOOP;
END $$;

DO $$
BEGIN
  IF to_regclass('public.user_encryption_meta') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_encryption_meta_user_id_fkey_auth') THEN
      EXECUTE 'ALTER TABLE public.user_encryption_meta ' ||
              'ADD CONSTRAINT user_encryption_meta_user_id_fkey_auth ' ||
              'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE';
    END IF;
  END IF;

  IF to_regclass('public.vault_items') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vault_items_user_id_fkey_auth') THEN
      EXECUTE 'ALTER TABLE public.vault_items ' ||
              'ADD CONSTRAINT vault_items_user_id_fkey_auth ' ||
              'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE';
    END IF;
  END IF;

  IF to_regclass('public.device_sessions') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'device_sessions_user_id_fkey_auth') THEN
      EXECUTE 'ALTER TABLE public.device_sessions ' ||
              'ADD CONSTRAINT device_sessions_user_id_fkey_auth ' ||
              'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE';
    END IF;
  END IF;

  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_user_id_fkey_auth') THEN
      EXECUTE 'ALTER TABLE public.audit_logs ' ||
              'ADD CONSTRAINT audit_logs_user_id_fkey_auth ' ||
              'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL';
    END IF;
  END IF;
END $$;
