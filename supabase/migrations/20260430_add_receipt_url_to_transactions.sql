-- Add receipt_url column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt_url TEXT;
