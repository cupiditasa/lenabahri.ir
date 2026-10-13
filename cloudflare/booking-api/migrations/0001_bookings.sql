CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  service TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'consult')),
  message TEXT NOT NULL DEFAULT '',
  photo_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'confirmed', 'completed', 'cancelled')),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_status_created_at_idx ON bookings(status, created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  scope TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (scope, ip_hash, window_start)
);
