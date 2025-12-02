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

-- SMS Messages Table
CREATE TABLE IF NOT EXISTS sms_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'inbound' or 'outbound'
  message_text TEXT NOT NULL,
  conversation_id TEXT,
  status TEXT DEFAULT 'received', -- 'received', 'processed', 'responded', 'failed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  response_message_id TEXT -- Reference to outbound response message
);

-- SMS Conversations Table
CREATE TABLE IF NOT EXISTS sms_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  customer_name TEXT,
  conversation_summary TEXT,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'archived'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Insights Table
CREATE TABLE IF NOT EXISTS ai_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  call_id TEXT NOT NULL,
  insight_type TEXT NOT NULL, -- 'customer_name', 'sentiment', etc.
  data TEXT NOT NULL, -- JSON data from AI insights
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (call_id) REFERENCES call_data(call_id)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_call_data_call_id ON call_data(call_id);
CREATE INDEX IF NOT EXISTS idx_call_data_phone ON call_data(phone_number);
CREATE INDEX IF NOT EXISTS idx_call_data_status ON call_data(status);
CREATE INDEX IF NOT EXISTS idx_call_data_created ON call_data(created_at);
CREATE INDEX IF NOT EXISTS idx_transcripts_call_id ON call_transcripts(call_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_phone ON sms_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_direction ON sms_messages(direction);
CREATE INDEX IF NOT EXISTS idx_sms_messages_conversation ON sms_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_conversations_phone ON sms_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_conversations_status ON sms_conversations(status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_call_id ON ai_insights(call_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
