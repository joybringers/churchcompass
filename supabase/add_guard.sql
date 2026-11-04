-- ChurchCompass Guard module: run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS cc_dbs_records (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id    UUID NOT NULL REFERENCES cc_churches(id) ON DELETE CASCADE,
  person_name  VARCHAR(200) NOT NULL,
  role         VARCHAR(200),
  dbs_number   VARCHAR(100),
  issue_date   DATE,
  expiry_date  DATE,
  status       VARCHAR(50) DEFAULT 'valid',  -- valid | expiring | expired | pending
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cc_incidents (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id        UUID NOT NULL REFERENCES cc_churches(id) ON DELETE CASCADE,
  incident_date    DATE NOT NULL,
  title            VARCHAR(300) NOT NULL,
  description      TEXT,
  people_involved  TEXT,
  action_taken     TEXT,
  reported_to      VARCHAR(200),
  severity         VARCHAR(50) DEFAULT 'low',  -- low | medium | high
  status           VARCHAR(50) DEFAULT 'open', -- open | under_review | closed
  created_by       VARCHAR(200),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cc_dbs_church_idx      ON cc_dbs_records(church_id);
CREATE INDEX IF NOT EXISTS cc_incidents_church_idx ON cc_incidents(church_id);
