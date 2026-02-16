-- NextGen Ops — Initial Schema
-- All tables for tournament logistics management

-- ============================================
-- CONTACTS — External contacts (org, hotel, transport, etc.)
-- ============================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'other',
  organization TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  telegram TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TEAM_INFO — Per-team logistics info (hotel, arrival, etc.)
-- ============================================
CREATE TABLE team_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id TEXT NOT NULL,
  club_code TEXT NOT NULL,
  team_name TEXT NOT NULL DEFAULT '',
  "group" TEXT NOT NULL DEFAULT '',
  arrival_date TEXT NOT NULL DEFAULT '',
  departure_date TEXT NOT NULL DEFAULT '',
  hotel TEXT NOT NULL DEFAULT '',
  flight_info TEXT NOT NULL DEFAULT '',
  dietary_notes TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, club_code)
);

-- ============================================
-- PEOPLE — Team delegation members & staff
-- ============================================
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id TEXT NOT NULL,
  team_id TEXT NOT NULL DEFAULT '',
  club_code TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'other',
  nationality TEXT NOT NULL DEFAULT '',
  passport_number TEXT NOT NULL DEFAULT '',
  passport_expiry TEXT NOT NULL DEFAULT '',
  date_of_birth TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  -- Travel
  arrival_date TEXT NOT NULL DEFAULT '',
  arrival_time TEXT NOT NULL DEFAULT '',
  arrival_flight TEXT NOT NULL DEFAULT '',
  departure_date TEXT NOT NULL DEFAULT '',
  departure_time TEXT NOT NULL DEFAULT '',
  departure_flight TEXT NOT NULL DEFAULT '',
  -- Accommodation
  hotel TEXT NOT NULL DEFAULT '',
  room_number TEXT NOT NULL DEFAULT '',
  room_type TEXT NOT NULL DEFAULT '',
  -- Health & dietary
  allergies TEXT NOT NULL DEFAULT '',
  dietary_needs TEXT NOT NULL DEFAULT '',
  medical_notes TEXT NOT NULL DEFAULT '',
  -- Other
  shirt_size TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TRANSFERS — Transport schedule
-- ============================================
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id TEXT NOT NULL,
  date TEXT NOT NULL DEFAULT '',
  time TEXT NOT NULL DEFAULT '',
  from_location TEXT NOT NULL DEFAULT '',
  to_location TEXT NOT NULL DEFAULT '',
  team_id TEXT,
  team_name TEXT NOT NULL DEFAULT '',
  driver_name TEXT NOT NULL DEFAULT '',
  driver_phone TEXT NOT NULL DEFAULT '',
  vehicle_info TEXT NOT NULL DEFAULT '',
  pax INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TASKS — Checklists and to-dos
-- ============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'daily',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL DEFAULT '',
  due_time TEXT NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'medium',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- DAILY_EVENTS — Manual timeline events
-- ============================================
CREATE TABLE daily_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id TEXT NOT NULL,
  date TEXT NOT NULL DEFAULT '',
  time TEXT NOT NULL DEFAULT '',
  end_time TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'other',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  team_id TEXT,
  team_name TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_contacts_tournament ON contacts(tournament_id);
CREATE INDEX idx_team_info_tournament ON team_info(tournament_id);
CREATE INDEX idx_people_tournament ON people(tournament_id);
CREATE INDEX idx_people_club ON people(tournament_id, club_code);
CREATE INDEX idx_transfers_tournament ON transfers(tournament_id);
CREATE INDEX idx_transfers_date ON transfers(tournament_id, date);
CREATE INDEX idx_tasks_tournament ON tasks(tournament_id);
CREATE INDEX idx_daily_events_tournament ON daily_events(tournament_id);
CREATE INDEX idx_daily_events_date ON daily_events(tournament_id, date);

-- ============================================
-- RLS — Keep it simple: allow all for authenticated users
-- For MVP we don't need complex policies — Andrea is the only user
-- ============================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_events ENABLE ROW LEVEL SECURITY;

-- Simple policy: allow everything for authenticated users
CREATE POLICY "Authenticated users full access" ON contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON team_info FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON people FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON daily_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER team_info_updated_at BEFORE UPDATE ON team_info FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER transfers_updated_at BEFORE UPDATE ON transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER daily_events_updated_at BEFORE UPDATE ON daily_events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
