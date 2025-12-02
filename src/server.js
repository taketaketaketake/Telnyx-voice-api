import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { initDatabase, getDatabase, callDataOperations, transcriptOperations, aiInsightsOperations } from './database/db.js';
import { handleCallWebhook } from './webhooks/callHandler.js';
import { handleSMSWebhook } from './webhooks/smsHandler.js';
import { handleAIInsightsWebhook } from './webhooks/aiInsightsHandler.js';

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
    service: 'Bags of Laundry - Hendrix'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Telnyx Voice Assistant',
    agent: 'Hendrix',
    organization: 'Bags of Laundry',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      webhook: '/webhooks/telnyx',
      calls: '/api/calls'
    }
  });
});

// Admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(new URL('../src/views/admin.html', import.meta.url).pathname);
});

// Telnyx webhook endpoints
app.post('/webhooks/telnyx', handleCallWebhook);
app.get('/webhooks/telnyx', (req, res) => res.json({ status: 'webhook endpoint ready' }));
app.post('/webhooks/sms', handleSMSWebhook);
app.post('/webhooks/ai-insights', handleAIInsightsWebhook);
app.get('/webhooks/ai-insights', (req, res) => res.json({ status: 'AI insights webhook endpoint ready' }));

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

// API endpoint to get call transcript
app.get('/api/calls/:call_id/transcript', async (req, res) => {
  try {
    const callId = req.params.call_id;
    
    // First check if transcript exists in database
    const existingTranscripts = transcriptOperations.getByCallId(callId);
    
    if (existingTranscripts && existingTranscripts.length > 0) {
      return res.json({
        success: true,
        source: 'database',
        data: existingTranscripts[0]
      });
    }
    
    // If not in database, fetch from Telnyx
    const { getCallTranscript } = await import('./services/telnyx.js');
    const transcript = await getCallTranscript(callId);
    
    if (transcript && transcript.transcript_text) {
      // Save to database
      transcriptOperations.create(callId, transcript.transcript_text);
      
      res.json({
        success: true,
        source: 'telnyx',
        data: {
          call_id: callId,
          transcript_text: transcript.transcript_text,
          retrieved_at: new Date().toISOString()
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Transcript not available yet. Please try again in a few minutes.'
      });
    }
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API endpoint to get AI insights
app.get('/api/ai-insights', (req, res) => {
  try {
    console.log('🔍 [AI-INSIGHTS] Fetching AI insights with filters:', req.query);
    
    const filters = {};
    const limit = parseInt(req.query.limit) || 50;
    
    if (req.query.insight_type) filters.insight_type = req.query.insight_type;
    if (req.query.call_id) filters.call_id = req.query.call_id;
    
    const insights = aiInsightsOperations.getAll(filters, limit);
    
    console.log(`📊 Found ${insights.length} AI insights`);
    
    res.json({
      success: true,
      data: insights,
      total: insights.length
    });
  } catch (error) {
    console.error('❌ Error fetching AI insights:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API endpoint to get AI insights for a specific call
app.get('/api/calls/:call_id/insights', (req, res) => {
  try {
    const callId = req.params.call_id;
    const insights = aiInsightsOperations.getByCallId(callId);
    
    res.json({
      success: true,
      data: insights,
      total: insights.length
    });
  } catch (error) {
    console.error('Error fetching call insights:', error);
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
  console.log('🎙️  Bags of Laundry - Michigan');
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
