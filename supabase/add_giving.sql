-- Giving / donations tracking
CREATE TABLE IF NOT EXISTS cc_giving_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID NOT NULL REFERENCES cc_churches(id) ON DELETE CASCADE,
  member_id UUID REFERENCES cc_members(id) ON DELETE SET NULL,
  donor_name VARCHAR(200),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  gift_aid BOOLEAN DEFAULT false,
  giving_date DATE NOT NULL DEFAULT CURRENT_DATE,
  giving_type VARCHAR(50) DEFAULT 'tithe', -- tithe, offering, special, mission, building
  reference VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cc_giving_church ON cc_giving_records(church_id);
CREATE INDEX IF NOT EXISTS idx_cc_giving_member ON cc_giving_records(member_id);
CREATE INDEX IF NOT EXISTS idx_cc_giving_date ON cc_giving_records(giving_date);
