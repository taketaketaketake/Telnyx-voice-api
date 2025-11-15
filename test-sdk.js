#!/usr/bin/env node

/**
 * Telnyx SDK Integration Test
 * Verifies the official SDK is properly integrated
 */

import Telnyx from 'telnyx';
import dotenv from 'dotenv';
import { telnyxAIConfig } from './src/config/hendrix.js';

dotenv.config();

console.log('🧪 Testing Telnyx SDK Integration...\n');

// Test 1: SDK Initialization
console.log('Test 1: Initializing Telnyx SDK...');
try {
  const telnyx = new Telnyx(process.env.TELNYX_API_KEY || 'test_key');
  console.log('✅ SDK initialized successfully');
  console.log(`   Client type: ${typeof telnyx}`);
  console.log(`   Has calls namespace: ${!!telnyx.calls}`);
  console.log('');
} catch (err) {
  console.error('❌ SDK initialization failed:', err.message);
  process.exit(1);
}

// Test 2: Verify AI Configuration
console.log('Test 2: Verifying AI Configuration...');
console.log('✅ AI Config loaded:');
console.log(`   Model: ${telnyxAIConfig.model}`);
console.log(`   Provider: ${telnyxAIConfig.provider}`);
console.log(`   Voice Model: ${telnyxAIConfig.voice.model}`);
console.log(`   Voice: ${telnyxAIConfig.voice.voice}`);
console.log(`   Transcription Provider: ${telnyxAIConfig.transcription.provider}`);
console.log(`   Transcription Model: ${telnyxAIConfig.transcription.model}`);
console.log('');

// Test 3: Check expected configuration values
console.log('Test 3: Validating Required Configuration...');
const checks = [
  { name: 'Model is Qwen/Qwen3-235B-A22B', pass: telnyxAIConfig.model === 'Qwen/Qwen3-235B-A22B' },
  { name: 'Voice model is NaturalHD', pass: telnyxAIConfig.voice.model === 'NaturalHD' },
  { name: 'Voice is vespera', pass: telnyxAIConfig.voice.voice === 'vespera' },
  { name: 'Transcription is deepgram', pass: telnyxAIConfig.transcription.provider === 'deepgram' },
  { name: 'Transcription model is Flux', pass: telnyxAIConfig.transcription.model === 'Flux' }
];

let allPassed = true;
checks.forEach(check => {
  if (check.pass) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`❌ ${check.name}`);
    allPassed = false;
  }
});
console.log('');

// Test 4: Import service layer
console.log('Test 4: Testing service layer imports...');
try {
  const { answerCallWithAI, hangupCall, getCallTranscript, sendFunctionResult } = await import('./src/services/telnyx.js');
  console.log('✅ Service layer functions imported:');
  console.log(`   - answerCallWithAI: ${typeof answerCallWithAI}`);
  console.log(`   - hangupCall: ${typeof hangupCall}`);
  console.log(`   - getCallTranscript: ${typeof getCallTranscript}`);
  console.log(`   - sendFunctionResult: ${typeof sendFunctionResult}`);
  console.log('');
} catch (err) {
  console.error('❌ Service layer import failed:', err.message);
  allPassed = false;
}

// Summary
console.log('═══════════════════════════════════════');
if (allPassed) {
  console.log('🎉 All tests passed!');
  console.log('');
  console.log('✅ Telnyx SDK is properly integrated');
  console.log('✅ AI configuration is correct:');
  console.log('   • Model: Qwen/Qwen3-235B-A22B');
  console.log('   • Voice: NaturalHD/vespera');
  console.log('   • Transcription: deepgram/Flux');
  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Add your Telnyx API key to .env');
  console.log('   2. Start the server: npm start');
  console.log('   3. Configure webhook URL in Telnyx portal');
  console.log('');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  console.log('Please check the errors above');
  process.exit(1);
}
