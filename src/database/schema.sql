-- Call Data Table
CREATE TABLE IF NOT EXISTS call_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  call_id TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  customer_name TEXT,
  address TEXT,
  issue_description TEXT,
  additional_notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Call Transcripts Table
CREATE TABLE IF NOT EXISTS call_transcripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  call_id TEXT NOT NULL,
  transcript_text TEXT,
  retrieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (call_id) REFERENCES call_data(call_id)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_call_data_call_id ON call_data(call_id);
CREATE INDEX IF NOT EXISTS idx_call_data_phone ON call_data(phone_number);
CREATE INDEX IF NOT EXISTS idx_call_data_status ON call_data(status);
CREATE INDEX IF NOT EXISTS idx_call_data_created ON call_data(created_at);
CREATE INDEX IF NOT EXISTS idx_transcripts_call_id ON call_transcripts(call_id);
