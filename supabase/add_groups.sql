-- ChurchCompass Groups: run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS cc_groups (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id   UUID NOT NULL REFERENCES cc_churches(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  group_type  VARCHAR(100) DEFAULT 'general',
  color       VARCHAR(20)  DEFAULT '#1e3a5f',
  created_at  TIMESTAMPTZ  DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cc_group_members (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id   UUID NOT NULL REFERENCES cc_groups(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES cc_members(id) ON DELETE CASCADE,
  role       VARCHAR(50) DEFAULT 'member',
  joined_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, member_id)
);

CREATE INDEX IF NOT EXISTS cc_groups_church_idx        ON cc_groups(church_id);
CREATE INDEX IF NOT EXISTS cc_group_members_group_idx  ON cc_group_members(group_id);
CREATE INDEX IF NOT EXISTS cc_group_members_member_idx ON cc_group_members(member_id);
