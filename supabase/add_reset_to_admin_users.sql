-- Add password reset + last_login columns to cc_admin_users
-- Run in Supabase SQL Editor

ALTER TABLE cc_admin_users
  ADD COLUMN IF NOT EXISTS reset_token        TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login         TIMESTAMPTZ;
