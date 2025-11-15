#!/usr/bin/env node

/**
 * Quick database test script
 * Verifies database operations work correctly
 */

import { callDataOperations } from './src/database/db.js';

console.log('🧪 Testing database operations...\n');

// Test 1: Create a test call record
console.log('Test 1: Creating test call record...');
const testCallId = `test_${Date.now()}`;
try {
  callDataOperations.create({
    call_id: testCallId,
    phone_number: '+12345678901',
    customer_name: 'Test Customer',
    address: '123 Test St, Detroit, MI',
    issue_description: 'Test furnace issue',
    additional_notes: 'This is a test',
    status: 'collected'
  });
  console.log('✅ Test record created successfully\n');
} catch (err) {
  console.error('❌ Failed to create test record:', err.message);
  process.exit(1);
}

// Test 2: Retrieve the record
console.log('Test 2: Retrieving test record...');
try {
  const record = callDataOperations.getByCallId(testCallId);
  if (record) {
    console.log('✅ Record retrieved successfully');
    console.log('📋 Record data:', record);
    console.log('');
  } else {
    console.error('❌ Record not found');
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Failed to retrieve record:', err.message);
  process.exit(1);
}

// Test 3: Update the record
console.log('Test 3: Updating test record...');
try {
  const updated = callDataOperations.update(testCallId, {
    status: 'completed',
    additional_notes: 'Updated test note'
  });
  if (updated) {
    console.log('✅ Record updated successfully\n');
  } else {
    console.error('❌ Failed to update record');
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Update failed:', err.message);
  process.exit(1);
}

// Test 4: Get all records
console.log('Test 4: Getting all records...');
try {
  const allRecords = callDataOperations.getAll({ limit: 10 });
  console.log(`✅ Found ${allRecords.length} record(s)\n`);
} catch (err) {
  console.error('❌ Failed to get all records:', err.message);
  process.exit(1);
}

console.log('🎉 All database tests passed!\n');
console.log('💡 You can now start the server with: npm start');
console.log('');

process.exit(0);
