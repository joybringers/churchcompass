-- Run this in Supabase SQL Editor
ALTER TABLE cc_churches
  ADD COLUMN IF NOT EXISTS plan VARCHAR(20) NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
