import { aiInsightsOperations } from '../database/db.js';

/**
 * Handle Telnyx AI Insights webhook events
 */
export async function handleAIInsightsWebhook(req, res) {
  try {
    const event = req.body;
    
    console.log('🧠 Received AI Insights webhook:', JSON.stringify(event, null, 2));
    
    // Extract insights data from conversation_insight_result payload
    const payload = event.payload || event.data || {};
    const callId = payload.call_leg_id || payload.call_session_id;
    const conversationId = payload.conversation_id;
    const results = payload.results || [];
    const timestamp = event.occurred_at || new Date().toISOString();
    
    // Parse the results to extract customer data
    let insights = {};
    let customerName = null;
    
    // Look for customer_name in results
    results.forEach(result => {
      if (result.result) {
        try {
          // Parse the JSON string in result.result
          const parsedResult = JSON.parse(result.result);
          if (parsedResult.customer_name) {
            customerName = parsedResult.customer_name;
            insights.customer_name = customerName;
          }
          // Merge any other parsed data
          insights = { ...insights, ...parsedResult };
        } catch (parseError) {
          console.error('Error parsing result JSON:', parseError);
          console.log('Raw result:', result.result);
        }
      }
    });
    
    // Log the insights for debugging
    console.log('📊 Call Insights:', {
      callId,
      conversationId,
      customerName,
      insights,
      timestamp,
      resultsCount: results.length
    });
    
    // Store insights in database
    if (callId && Object.keys(insights).length > 0) {
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
      callId: callId,
      conversationId: conversationId,
      extractedInsights: Object.keys(insights).length,
      customerName: customerName
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