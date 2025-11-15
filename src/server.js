import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { initDatabase, getDatabase, callDataOperations } from './database/db.js';
import { handleCallWebhook } from './webhooks/callHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize database
console.log('🗄️  Initializing database...');
initDatabase();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Telnyx Voice Assistant - Hendrix'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Telnyx Voice Assistant',
    agent: 'Hendrix',
    organization: 'Fix My Furnace',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      webhook: '/webhooks/telnyx',
      calls: '/api/calls'
    }
  });
});

// Telnyx webhook endpoint
app.post('/webhooks/telnyx', handleCallWebhook);

// API endpoint to get all calls
app.get('/api/calls', (req, res) => {
  try {
    const filters = {};

    if (req.query.status) filters.status = req.query.status;
    if (req.query.phone_number) filters.phone_number = req.query.phone_number;
    if (req.query.limit) filters.limit = parseInt(req.query.limit);

    const calls = callDataOperations.getAll(filters);

    res.json({
      success: true,
      count: calls.length,
      data: calls
    });
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API endpoint to get specific call
app.get('/api/calls/:call_id', (req, res) => {
  try {
    const call = callDataOperations.getByCallId(req.params.call_id);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    res.json({
      success: true,
      data: call
    });
  } catch (error) {
    console.error('Error fetching call:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🎙️  ========================================');
  console.log('🎙️  Telnyx Voice Assistant - Hendrix');
  console.log('🎙️  Fix My Furnace - Michigan');
  console.log('🎙️  ========================================');
  console.log('');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Webhook URL: ${process.env.WEBHOOK_URL || `http://localhost:${PORT}/webhooks/telnyx`}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  - Health check: http://localhost:${PORT}/health`);
  console.log(`  - Webhooks: http://localhost:${PORT}/webhooks/telnyx`);
  console.log(`  - API calls: http://localhost:${PORT}/api/calls`);
  console.log('');
  console.log('🎯 Waiting for incoming calls...');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

export default app;
