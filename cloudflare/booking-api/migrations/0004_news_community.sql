CREATE TABLE IF NOT EXISTS news_reactions (
  article_slug TEXT NOT NULL,
  phone TEXT NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('resonated', 'not-for-me')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (article_slug, phone)
);

CREATE INDEX IF NOT EXISTS news_reactions_article_idx ON news_reactions(article_slug, reaction);

CREATE TABLE IF NOT EXISTS news_comments (
  id TEXT PRIMARY KEY,
  article_slug TEXT NOT NULL,
  phone TEXT NOT NULL,
  body TEXT NOT NULL,
  consent_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS news_comments_article_created_idx ON news_comments(article_slug, created_at DESC);
