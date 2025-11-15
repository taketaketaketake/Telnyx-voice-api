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

export default {
  getDatabase,
  initDatabase,
  closeDatabase,
  callDataOperations,
  transcriptOperations
};
