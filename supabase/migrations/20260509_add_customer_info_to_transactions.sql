-- Add customer information columns to transactions table for self-ordering menu
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_phone TEXT;