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
    const metadata = payload.metadata || {};
    const callId = metadata.call_leg_id || metadata.call_session_id || payload.call_leg_id || payload.call_session_id;
    const conversationId = payload.conversation_id;
    const results = payload.results || [];
    const timestamp = event.occurred_at || new Date().toISOString();
    
    // Check if this is SMS conversation insights (has conversation channel but no call_id)
    const conversationChannel = metadata.telnyx_conversation_channel;
    const isSmsConversation = conversationChannel === 'sms_chat' && !callId;
    
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
    console.log('📊 AI Insights:', {
      callId,
      conversationId,
      customerName,
      insights,
      timestamp,
      resultsCount: results.length,
      isSmsConversation,
      conversationChannel
    });
    
    // Store insights in database (use conversation_id for SMS, call_id for voice calls)
    const storageId = callId || conversationId;
    if (storageId && Object.keys(insights).length > 0) {
      try {
        // Store customer name if extracted
        if (insights.customer_name) {
          console.log('👤 Customer Name Extracted:', insights.customer_name);
          aiInsightsOperations.create(storageId, 'customer_name', {
            customer_name: insights.customer_name,
            extracted_at: timestamp,
            source: isSmsConversation ? 'sms_conversation' : 'voice_call',
            conversation_id: conversationId
          });
        }

        // Store call summary if available
        if (insights.call_summary) {
          console.log('📝 Call Summary:', insights.call_summary);
          aiInsightsOperations.create(storageId, 'call_summary', {
            call_summary: insights.call_summary,
            extracted_at: timestamp,
            source: isSmsConversation ? 'sms_conversation' : 'voice_call',
            conversation_id: conversationId
          });
        }

        // Store reason for call if available
        if (insights.reason_for_call) {
          console.log('📞 Reason for Call:', insights.reason_for_call);
          aiInsightsOperations.create(storageId, 'reason_for_call', {
            reason_for_call: insights.reason_for_call,
            extracted_at: timestamp,
            source: isSmsConversation ? 'sms_conversation' : 'voice_call',
            conversation_id: conversationId
          });
        }

        // Store customer address if available
        if (insights.customer_address) {
          console.log('🏠 Customer Address:', insights.customer_address);
          aiInsightsOperations.create(storageId, 'customer_address', {
            customer_address: insights.customer_address,
            extracted_at: timestamp,
            source: isSmsConversation ? 'sms_conversation' : 'voice_call',
            conversation_id: conversationId
          });
        }
        
        // Store raw insights data
        aiInsightsOperations.create(storageId, 'raw', {
          raw_data: event,
          extracted_at: timestamp,
          source: isSmsConversation ? 'sms_conversation' : 'voice_call',
          conversation_id: conversationId
        });
        
        const sourceType = isSmsConversation ? 'SMS conversation' : 'voice call';
        console.log(`✅ AI insights stored successfully for ${sourceType}:`, storageId);
      } catch (dbError) {
        console.error('❌ Error storing AI insights:', dbError);
        console.error('Database error details:', {
          message: dbError.message,
          stack: dbError.stack,
          storageId,
          callId,
          conversationId,
          insights
        });
      }
    } else {
      console.log('⚠️ No storage ID or insights found, skipping database storage:', {
        hasCallId: !!callId,
        hasConversationId: !!conversationId,
        hasStorageId: !!storageId,
        hasInsights: Object.keys(insights).length > 0,
        callId,
        conversationId,
        insights
      });
    }
    
    // Always respond with 200 OK to acknowledge receipt
    res.status(200).json({ 
      received: true,
      message: 'AI insights processed successfully',
      callId: callId,
      conversationId: conversationId,
      storageId: storageId,
      extractedInsights: Object.keys(insights).length,
      customerName: customerName,
      source: isSmsConversation ? 'sms_conversation' : 'voice_call'
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