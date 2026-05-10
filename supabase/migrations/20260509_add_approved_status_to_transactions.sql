-- Add 'approved' as a valid status for transactions
-- Update the check constraint to include 'approved'
-- First, drop the existing constraint and re-add with the new value.
-- If the constraint name differs, use a generic approach.

DO $$
BEGIN
  -- Drop existing check constraint on status if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'transactions' AND constraint_type = 'CHECK' AND constraint_name LIKE '%status%'
  ) THEN
    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
  END IF;

  -- Re-add with approved status included
  ALTER TABLE transactions
    ADD CONSTRAINT transactions_status_check
    CHECK (status IN ('pending', 'approved', 'completed', 'cancelled'));
END $$;