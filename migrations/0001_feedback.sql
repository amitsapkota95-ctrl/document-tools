DROP TABLE IF EXISTS feedback;

CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_slug TEXT NOT NULL DEFAULT 'general',
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  message TEXT,
  page_path TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_feedback_tool_slug ON feedback (tool_slug);
CREATE INDEX idx_feedback_created_at ON feedback (created_at DESC);
