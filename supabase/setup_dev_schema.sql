-- =============================================
-- Dev Schema Setup for POS Shop
-- Run ONCE in Supabase SQL Editor
-- Creates identical copies of all tables
-- under the `dev` schema for development use.
--
-- After running, also go to:
--   Settings → API → Extra search path
-- and add `dev` (e.g. "public, dev")
-- =============================================

-- 1. Create dev schema
CREATE SCHEMA IF NOT EXISTS dev;

-- 2. Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Grant usage so the anon Supabase role can access dev schema
GRANT USAGE ON SCHEMA dev TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON SEQUENCES TO anon, authenticated;

-- 4. Create tables in dev schema (identical to public)

-- dev.items
CREATE TABLE IF NOT EXISTS dev.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    image TEXT NOT NULL,
    quantity INTEGER NOT NULL
);

-- dev.users
CREATE TABLE IF NOT EXISTS dev.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- dev.transactions
CREATE TABLE IF NOT EXISTS dev.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES dev.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    receipt_url TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    order_id TEXT UNIQUE,
    additional_detail TEXT
);

-- dev.transaction_items
CREATE TABLE IF NOT EXISTS dev.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES dev.transactions(id),
    item_id UUID NOT NULL REFERENCES dev.items(id),
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL
);

-- dev.audit_log
CREATE TABLE IF NOT EXISTS dev.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event TEXT NOT NULL,
    user_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Indexes on dev schema

CREATE INDEX IF NOT EXISTS idx_dev_audit_log_user_id ON dev.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_dev_audit_log_event ON dev.audit_log(event);
CREATE INDEX IF NOT EXISTS idx_dev_audit_log_created_at ON dev.audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dev_transactions_created_by ON dev.transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_dev_transactions_status ON dev.transactions(status);
CREATE INDEX IF NOT EXISTS idx_dev_transaction_items_transaction ON dev.transaction_items(transaction_id);

-- 6. Grant table privileges to anon + authenticated roles (bypasses RLS for dev)
--    The app uses custom bcrypt auth (not Supabase Auth), so the anon key is used
--    for all requests. RLS policies scoped to 'authenticated' would block anon.
--    Instead, we grant direct table access and disable RLS on dev tables so the
--    app can function without Supabase Auth sessions.

GRANT ALL ON ALL TABLES IN SCHEMA dev TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA dev TO anon, authenticated;

-- 7. Enable RLS for consistency (optional), but add policies that allow anon too
ALTER TABLE dev.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'dev' AND tablename = 'items') THEN
        CREATE POLICY "dev_items_all" ON dev.items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
        CREATE POLICY "dev_items_select" ON dev.items FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'dev' AND tablename = 'users') THEN
        CREATE POLICY "dev_users_all" ON dev.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
        CREATE POLICY "dev_users_select" ON dev.users FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'dev' AND tablename = 'transactions') THEN
        CREATE POLICY "dev_transactions_all" ON dev.transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'dev' AND tablename = 'transaction_items') THEN
        CREATE POLICY "dev_transaction_items_all" ON dev.transaction_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'dev' AND tablename = 'audit_log') THEN
        CREATE POLICY "dev_audit_log_all" ON dev.audit_log FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
