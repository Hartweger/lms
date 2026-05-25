-- Add detailed scoring columns to placement_test_results
ALTER TABLE public.placement_test_results
  ADD COLUMN IF NOT EXISTS scores JSONB,
  ADD COLUMN IF NOT EXISTS ip_address TEXT;
