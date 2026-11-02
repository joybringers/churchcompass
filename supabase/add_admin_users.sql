-- ChurchCompass Named Admin Accounts: run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS cc_admin_users (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id    UUID NOT NULL REFERENCES cc_churches(id) ON DELETE CASCADE,
  name         VARCHAR(200) NOT NULL,
  email        VARCHAR(200) NOT NULL,
  role         VARCHAR(20) NOT NULL DEFAULT 'admin',  -- 'owner' | 'admin'
  password_hash VARCHAR(200) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(church_id, email)
);

-- Migrate existing churches: seed owner admin from current admin_email + password_hash
INSERT INTO cc_admin_users (church_id, name, email, role, password_hash)
SELECT id, 'Church Admin', admin_email, 'owner', password_hash
FROM cc_churches
WHERE admin_email IS NOT NULL AND password_hash IS NOT NULL
ON CONFLICT (church_id, email) DO NOTHING;

CREATE INDEX IF NOT EXISTS cc_admin_users_church_idx ON cc_admin_users(church_id);
