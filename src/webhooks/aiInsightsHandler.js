/**
 * Handle Telnyx AI Insights webhook events
 */
export async function handleAIInsightsWebhook(req, res) {
  try {
    const event = req.body;
    
    console.log('🧠 Received AI Insights webhook:', JSON.stringify(event, null, 2));
    
    // Extract insights data
    const callId = event.call_id;
    const insights = event.insights || {};
    const summary = event.summary;
    const timestamp = event.timestamp || new Date().toISOString();
    
    // Log the insights for debugging
    console.log('📊 Call Insights:', {
      callId,
      summary,
      insights,
      timestamp
    });
    
    // TODO: Store insights in database or process them
    // You can add database operations here to save insights
    // Example:
    // await insightsOperations.create({
    //   call_id: callId,
    //   summary: summary,
    //   insights: JSON.stringify(insights),
    //   created_at: timestamp
    // });
    
    // Process specific insight types
    if (insights.sentiment) {
      console.log('😊 Call Sentiment:', insights.sentiment);
    }
    
    if (insights.keywords) {
      console.log('🔍 Keywords:', insights.keywords);
    }
    
    if (insights.duration) {
      console.log('⏱️ Call Duration:', insights.duration);
    }
    
    if (summary) {
      console.log('📝 Call Summary:', summary);
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