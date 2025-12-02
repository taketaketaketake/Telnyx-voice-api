import { aiInsightsOperations } from '../database/db.js';

/**
 * Handle Telnyx AI Insights webhook events
 */
export async function handleAIInsightsWebhook(req, res) {
  try {
    const event = req.body;
    
    console.log('🧠 Received AI Insights webhook:', JSON.stringify(event, null, 2));
    
    // Extract insights data
    const callId = event.call_id;
    const insights = event.insights || event.data || {};
    const summary = event.summary;
    const timestamp = event.timestamp || new Date().toISOString();
    
    // Log the insights for debugging
    console.log('📊 Call Insights:', {
      callId,
      summary,
      insights,
      timestamp
    });
    
    // Store insights in database
    if (callId) {
      try {
        // Store customer name if extracted
        if (insights.customer_name) {
          console.log('👤 Customer Name Extracted:', insights.customer_name);
          aiInsightsOperations.create(callId, 'customer_name', {
            customer_name: insights.customer_name,
            extracted_at: timestamp
          });
        }
        
        // Store sentiment if available
        if (insights.sentiment) {
          console.log('😊 Call Sentiment:', insights.sentiment);
          aiInsightsOperations.create(callId, 'sentiment', {
            sentiment: insights.sentiment,
            extracted_at: timestamp
          });
        }
        
        // Store keywords if available
        if (insights.keywords) {
          console.log('🔍 Keywords:', insights.keywords);
          aiInsightsOperations.create(callId, 'keywords', {
            keywords: insights.keywords,
            extracted_at: timestamp
          });
        }
        
        // Store summary if available
        if (summary) {
          console.log('📝 Call Summary:', summary);
          aiInsightsOperations.create(callId, 'summary', {
            summary: summary,
            extracted_at: timestamp
          });
        }
        
        // Store raw insights data
        aiInsightsOperations.create(callId, 'raw', {
          raw_data: event,
          extracted_at: timestamp
        });
        
        console.log('✅ AI insights stored successfully for call:', callId);
      } catch (dbError) {
        console.error('❌ Error storing AI insights:', dbError);
      }
    }
    
    // Always respond with 200 OK to acknowledge receipt
    res.status(200).json({ 
      received: true,
      message: 'AI insights processed successfully',
      callId: callId 
    });

  } catch (error) {
    console.error('❌ Error handling AI insights webhook:', error);
    // Still return 200 to prevent retries
    res.status(200).json({ 
      received: true, 
      error: error.message 
    });
  }
}

export default handleAIInsightsWebhook;