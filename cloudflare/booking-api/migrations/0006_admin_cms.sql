CREATE TABLE IF NOT EXISTS cms_content (
  kind TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_news (
  slug TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER
);

CREATE INDEX IF NOT EXISTS cms_news_status_updated_idx ON cms_news(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS cms_audit_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS cms_audit_created_idx ON cms_audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS cms_media (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  alt_text TEXT NOT NULL,
  image_data BLOB NOT NULL,
  display_consent_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

ALTER TABLE news_comments
  ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS news_comments_moderation_idx ON news_comments(moderation_status, created_at DESC);
