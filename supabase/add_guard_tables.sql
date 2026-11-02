-- ChurchCompass Guard: run in Supabase SQL Editor

-- Authorised collectors (who is allowed to pick up a child) — Free tier
CREATE TABLE IF NOT EXISTS cc_authorised_collectors (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id    UUID NOT NULL REFERENCES cc_churches(id) ON DELETE CASCADE,
  child_name   VARCHAR(200) NOT NULL,
  collector_name VARCHAR(200) NOT NULL,
  relationship VARCHAR(100),
  phone        VARCHAR(50),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- DBS and training records — Pro tier
CREATE TABLE IF NOT EXISTS cc_dbs_records (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id               UUID NOT NULL REFERENCES cc_churches(id) ON DELETE CASCADE,
  full_name               VARCHAR(200) NOT NULL,
  role                    VARCHAR(200),
  check_type              VARCHAR(50) DEFAULT 'enhanced',
  check_number            VARCHAR(100),
  issue_date              DATE,
  renewal_date            DATE,
  training_safeguarding   BOOLEAN DEFAULT false,
  training_first_aid      BOOLEAN DEFAULT false,
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- Incident log — Pro tier
CREATE TABLE IF NOT EXISTS cc_incidents (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id           UUID NOT NULL REFERENCES cc_churches(id) ON DELETE CASCADE,
  incident_date       DATE NOT NULL,
  person_involved     VARCHAR(200),
  reported_by         VARCHAR(200),
  incident_type       VARCHAR(50) DEFAULT 'accident',
  description         TEXT NOT NULL,
  action_taken        TEXT,
  follow_up_required  BOOLEAN DEFAULT false,
  follow_up_notes     TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cc_authorised_collectors_church_idx ON cc_authorised_collectors(church_id);
CREATE INDEX IF NOT EXISTS cc_dbs_records_church_idx ON cc_dbs_records(church_id);
CREATE INDEX IF NOT EXISTS cc_incidents_church_idx ON cc_incidents(church_id);
