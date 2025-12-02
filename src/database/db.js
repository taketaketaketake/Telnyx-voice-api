import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get database path from environment or use default
const DB_PATH = process.env.DATABASE_PATH || './data/calls.db';

// Ensure data directory exists
const dataDir = dirname(DB_PATH);
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory: ${dataDir}`);
}

// Initialize database connection
let db;

export function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better performance
    console.log(`Database connected: ${DB_PATH}`);
  }
  return db;
}

export function initDatabase() {
  const db = getDatabase();

  // Read and execute schema
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Split by semicolons and execute each statement
  const statements = schema.split(';').filter(stmt => stmt.trim());

  statements.forEach(statement => {
    if (statement.trim()) {
      db.exec(statement);
    }
  });

  console.log('Database initialized successfully');
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    console.log('Database connection closed');
  }
}

// Database operations for call data
export const callDataOperations = {
  /**
   * Create a new call data record
   */
  create(data) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO call_data
        (call_id, phone_number, customer_name, address, issue_description, additional_notes, status)
      VALUES
        (@call_id, @phone_number, @customer_name, @address, @issue_description, @additional_notes, @status)
    `);

    const result = stmt.run({
      call_id: data.call_id,
      phone_number: data.phone_number,
      customer_name: data.customer_name || null,
      address: data.address || null,
      issue_description: data.issue_description || null,
      additional_notes: data.additional_notes || null,
      status: data.status || 'pending'
    });

    return result.lastInsertRowid;
  },

  /**
   * Update existing call data
   */
  update(call_id, data) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE call_data
      SET
        customer_name = COALESCE(@customer_name, customer_name),
        address = COALESCE(@address, address),
        issue_description = COALESCE(@issue_description, issue_description),
        additional_notes = COALESCE(@additional_notes, additional_notes),
        status = COALESCE(@status, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE call_id = @call_id
    `);

    const result = stmt.run({
      call_id,
      customer_name: data.customer_name,
      address: data.address,
      issue_description: data.issue_description,
      additional_notes: data.additional_notes,
      status: data.status
    });

    return result.changes > 0;
  },

  /**
   * Get call data by call_id
   */
  getByCallId(call_id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM call_data WHERE call_id = ?');
    return stmt.get(call_id);
  },

  /**
   * Get all call data with optional filters
   */
  getAll(filters = {}) {
    const db = getDatabase();
    let query = 'SELECT * FROM call_data WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.phone_number) {
      query += ' AND phone_number = ?';
      params.push(filters.phone_number);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }
};

// Database operations for transcripts
export const transcriptOperations = {
  /**
   * Save a transcript
   */
  create(call_id, transcript_text) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO call_transcripts (call_id, transcript_text)
      VALUES (?, ?)
    `);

    const result = stmt.run(call_id, transcript_text);
    return result.lastInsertRowid;
  },

  /**
   * Get transcript by call_id
   */
  getByCallId(call_id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM call_transcripts WHERE call_id = ? ORDER BY retrieved_at DESC');
    return stmt.all(call_id);
  }
};

// Database operations for SMS messages
export const smsOperations = {
  /**
   * Create a new SMS message record
   */
  createMessage(data) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO sms_messages
        (message_id, phone_number, direction, message_text, conversation_id, status)
      VALUES
        (@message_id, @phone_number, @direction, @message_text, @conversation_id, @status)
    `);

    const result = stmt.run({
      message_id: data.message_id,
      phone_number: data.phone_number,
      direction: data.direction,
      message_text: data.message_text,
      conversation_id: data.conversation_id || null,
      status: data.status || 'received'
    });

    return result.lastInsertRowid;
  },

  /**
   * Update SMS message status
   */
  updateMessageStatus(message_id, status, response_message_id = null) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE sms_messages
      SET status = ?, processed_at = CURRENT_TIMESTAMP, response_message_id = ?
      WHERE message_id = ?
    `);

    const result = stmt.run(status, response_message_id, message_id);
    return result.changes > 0;
  },

  /**
   * Get messages by conversation ID
   */
  getMessagesByConversation(conversation_id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM sms_messages WHERE conversation_id = ? ORDER BY created_at ASC');
    return stmt.all(conversation_id);
  },

  /**
   * Get messages by phone number
   */
  getMessagesByPhone(phone_number, limit = 50) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM sms_messages WHERE phone_number = ? ORDER BY created_at DESC LIMIT ?');
    return stmt.all(phone_number, limit);
  },

  /**
   * Get all unprocessed messages
   */
  getUnprocessedMessages() {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM sms_messages WHERE direction = 'inbound' AND status = 'received' ORDER BY created_at ASC");
    return stmt.all();
  }
};

// Database operations for SMS conversations
export const smsConversationOperations = {
  /**
   * Create or get existing conversation
   */
  createOrGetConversation(phone_number) {
    const db = getDatabase();
    
    // First try to get active conversation
    const getStmt = db.prepare("SELECT * FROM sms_conversations WHERE phone_number = ? AND status = 'active' ORDER BY last_activity DESC LIMIT 1");
    let conversation = getStmt.get(phone_number);
    
    if (!conversation) {
      // Create new conversation
      const conversation_id = `sms_${phone_number.replace('+', '')}_${Date.now()}`;
      const createStmt = db.prepare(`
        INSERT INTO sms_conversations (conversation_id, phone_number, status)
        VALUES (?, ?, 'active')
      `);
      
      createStmt.run(conversation_id, phone_number);
      conversation = getStmt.get(phone_number);
    }
    
    return conversation;
  },

  /**
   * Update conversation activity
   */
  updateLastActivity(conversation_id, customer_name = null, summary = null) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE sms_conversations
      SET last_activity = CURRENT_TIMESTAMP,
          customer_name = COALESCE(?, customer_name),
          conversation_summary = COALESCE(?, conversation_summary)
      WHERE conversation_id = ?
    `);

    const result = stmt.run(customer_name, summary, conversation_id);
    return result.changes > 0;
  },

  /**
   * Get all active conversations
   */
  getActiveConversations() {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM sms_conversations WHERE status = 'active' ORDER BY last_activity DESC");
    return stmt.all();
  }
};

// Database operations for AI insights
export const aiInsightsOperations = {
  /**
   * Create a new AI insight record
   */
  create(call_id, insight_type, data) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO ai_insights (call_id, insight_type, data)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(call_id, insight_type, JSON.stringify(data));
    return result.lastInsertRowid;
  },

  /**
   * Get insights by call_id
   */
  getByCallId(call_id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM ai_insights WHERE call_id = ? ORDER BY created_at DESC');
    const insights = stmt.all(call_id);
    
    // Parse JSON data
    return insights.map(insight => ({
      ...insight,
      data: JSON.parse(insight.data)
    }));
  },

  /**
   * Get insights by type
   */
  getByType(insight_type, limit = 50) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM ai_insights WHERE insight_type = ? ORDER BY created_at DESC LIMIT ?');
    const insights = stmt.all(insight_type, limit);
    
    // Parse JSON data
    return insights.map(insight => ({
      ...insight,
      data: JSON.parse(insight.data)
    }));
  },

  /**
   * Get all insights with optional filters
   */
  getAll(filters = {}, limit = 50) {
    const db = getDatabase();
    let query = 'SELECT ai.*, cd.customer_name as call_customer_name, cd.phone_number FROM ai_insights ai LEFT JOIN call_data cd ON ai.call_id = cd.call_id';
    const params = [];
    const conditions = [];

    if (filters.insight_type) {
      conditions.push('ai.insight_type = ?');
      params.push(filters.insight_type);
    }

    if (filters.call_id) {
      conditions.push('ai.call_id = ?');
      params.push(filters.call_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY ai.created_at DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query);
    const insights = stmt.all(...params);
    
    // Parse JSON data
    return insights.map(insight => ({
      ...insight,
      data: JSON.parse(insight.data)
    }));
  }
};

export default {
  getDatabase,
  initDatabase,
  closeDatabase,
  callDataOperations,
  transcriptOperations,
  smsOperations,
  smsConversationOperations,
  aiInsightsOperations
};
