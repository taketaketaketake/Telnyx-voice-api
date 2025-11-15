#!/usr/bin/env node

/**
 * Database Initialization Script
 * Run this to set up the database schema
 */

import { initDatabase, closeDatabase } from './db.js';

console.log('🗄️  Initializing database...');

try {
  initDatabase();
  console.log('✅ Database initialized successfully!');
  closeDatabase();
  process.exit(0);
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}
