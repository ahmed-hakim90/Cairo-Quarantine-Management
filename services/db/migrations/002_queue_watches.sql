-- FCM queue position watches (replaces Firestore `queue_watches` when USE_VPS_API=true)

CREATE TABLE queue_watches (
  ticket_id TEXT PRIMARY KEY REFERENCES queue_tickets (id) ON DELETE CASCADE,
  office_id TEXT NOT NULL REFERENCES offices (id),
  queue_date DATE NOT NULL,
  queue_number INTEGER NOT NULL DEFAULT 0,
  fcm_token TEXT NOT NULL,
  notified_five BOOLEAN NOT NULL DEFAULT FALSE,
  notified_turn BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_queue_watches_queue_date ON queue_watches (queue_date);
CREATE INDEX idx_queue_watches_office_date ON queue_watches (office_id, queue_date);
