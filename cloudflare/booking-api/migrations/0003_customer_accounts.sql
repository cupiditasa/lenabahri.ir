CREATE TABLE IF NOT EXISTS customer_profiles (
  phone TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  photo_data BLOB,
  photo_content_type TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  consent_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_otp_codes (
  phone TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS customer_otp_expiry_idx ON customer_otp_codes(expires_at);
