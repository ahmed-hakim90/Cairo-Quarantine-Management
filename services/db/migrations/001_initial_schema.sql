-- Cairo Quarantine Management — PostgreSQL schema (VPS source of truth)
-- Run via: psql $DATABASE_URL -f services/db/migrations/001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

CREATE TABLE offices (
  id TEXT PRIMARY KEY,
  governorate_id TEXT NOT NULL,
  serial_in_governorate INTEGER NOT NULL DEFAULT 9999,
  administration_ar TEXT NOT NULL DEFAULT '',
  name_ar TEXT NOT NULL DEFAULT '',
  address_ar TEXT NOT NULL DEFAULT '',
  phone TEXT,
  maps_url TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL DEFAULT 'hajj_umrah_travelers'
    CHECK (service IN ('hajj_umrah_travelers', 'hajj_umrah_only')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  traveler_state_ids TEXT[] NOT NULL DEFAULT '{}',
  daily_booking_cap INTEGER CHECK (daily_booking_cap IS NULL OR daily_booking_cap > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offices_governorate ON offices (governorate_id);
CREATE INDEX idx_offices_active ON offices (active) WHERE active = TRUE;

CREATE TABLE traveler_states (
  id TEXT PRIMARY KEY,
  label_ar TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vaccines (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL
    CHECK (category IN ('international', 'hajj', 'umrah', 'citizen')),
  name_ar TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  name_fr TEXT NOT NULL DEFAULT '',
  price_egp NUMERIC(12, 2),
  free BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vaccines_category_active ON vaccines (category, sort_order)
  WHERE active = TRUE;

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (key, value)
VALUES ('app', '{"bookingSameDayCutoffHour": 14}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Requests & booking capacity (row-lock target for bookings)
-- ---------------------------------------------------------------------------

CREATE TABLE requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  request_number TEXT NOT NULL UNIQUE,
  request_sequence INTEGER,
  governorate_id TEXT,
  office_id TEXT NOT NULL REFERENCES offices (id),
  office_name_ar TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'booking'
    CHECK (type IN ('booking', 'complaint', 'proposal')),
  traveler_state_id TEXT REFERENCES traveler_states (id),
  traveler_category TEXT
    CHECK (
      traveler_category IS NULL
      OR traveler_category IN ('international', 'hajj_umrah', 'citizen')
    ),
  preferred_date DATE,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (
      status IN ('new', 'in_progress', 'contacted', 'completed', 'cancelled')
    ),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  has_special_needs BOOLEAN NOT NULL DEFAULT FALSE,
  has_elderly BOOLEAN NOT NULL DEFAULT FALSE,
  pass_token TEXT,
  pass_token_expires_at TIMESTAMPTZ,
  last_whatsapp_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requests_office_date_type ON requests (office_id, preferred_date, type);
CREATE INDEX idx_requests_phone ON requests (phone);
CREATE INDEX idx_requests_status ON requests (status);
CREATE INDEX idx_requests_created_at ON requests (created_at DESC);

CREATE TABLE booking_capacity (
  office_id TEXT NOT NULL REFERENCES offices (id),
  preferred_date DATE NOT NULL,
  booked_count INTEGER NOT NULL DEFAULT 0 CHECK (booked_count >= 0),
  daily_cap INTEGER CHECK (daily_cap IS NULL OR daily_cap > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (office_id, preferred_date)
);

-- Per-office request number sequence (replaces Firestore counter docs)
CREATE TABLE office_request_counters (
  office_id TEXT PRIMARY KEY REFERENCES offices (id),
  last_request_sequence INTEGER NOT NULL DEFAULT 0 CHECK (last_request_sequence >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Queue
-- ---------------------------------------------------------------------------

CREATE TABLE queue_tickets (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests (id),
  request_number TEXT NOT NULL,
  office_id TEXT NOT NULL REFERENCES offices (id),
  queue_date DATE NOT NULL,
  queue_number INTEGER NOT NULL CHECK (queue_number > 0),
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'completed')),
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_from TEXT NOT NULL DEFAULT 'existing_request'
    CHECK (created_from IN ('existing_request', 'new_request')),
  UNIQUE (office_id, queue_date, queue_number),
  UNIQUE (office_id, queue_date, request_id)
);

CREATE INDEX idx_queue_tickets_office_date ON queue_tickets (office_id, queue_date);

CREATE TABLE daily_queue_stats (
  id TEXT PRIMARY KEY,
  queue_date DATE NOT NULL,
  office_id TEXT NOT NULL REFERENCES offices (id),
  total_checked_in INTEGER NOT NULL DEFAULT 0,
  total_completed INTEGER NOT NULL DEFAULT 0,
  total_no_show INTEGER NOT NULL DEFAULT 0,
  total_new_requests INTEGER NOT NULL DEFAULT 0,
  last_queue_number INTEGER NOT NULL DEFAULT 0,
  closed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (queue_date, office_id)
);

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------

CREATE TABLE admin_users (
  uid TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL
    CHECK (
      role IN ('super_admin', 'governorate_admin', 'office_admin', 'office_user')
    ),
  governorate_id TEXT,
  office_id TEXT REFERENCES offices (id),
  allowed_office_ids TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_uid TEXT NOT NULL,
  actor_label TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  summary_ar TEXT NOT NULL DEFAULT '',
  office_id TEXT REFERENCES offices (id),
  request_id TEXT REFERENCES requests (id),
  meta JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_activity_logs_created_at ON activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_office ON activity_logs (office_id, created_at DESC);
CREATE INDEX idx_activity_logs_request ON activity_logs (request_id, created_at DESC);
