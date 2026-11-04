-- ChurchCompass Communications: run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS cc_email_campaigns (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id     UUID NOT NULL REFERENCES cc_churches(id) ON DELETE CASCADE,
  subject       VARCHAR(300) NOT NULL,
  body          TEXT NOT NULL,
  recipient_type VARCHAR(50) NOT NULL, -- 'all' | 'group' | 'first_timers' | 'custom'
  group_id      UUID REFERENCES cc_groups(id) ON DELETE SET NULL,
  sent_count    INTEGER DEFAULT 0,
  failed_count  INTEGER DEFAULT 0,
  sent_by       VARCHAR(200),
  sent_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cc_email_campaigns_church_idx ON cc_email_campaigns(church_id);
