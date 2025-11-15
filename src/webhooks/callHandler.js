import { answerCallWithAI, hangupCall, sendFunctionResult } from '../services/telnyx.js';
import { callDataOperations } from '../database/db.js';
import { saveCallData } from '../functions/saveCallData.js';

/**
 * Handle Telnyx webhook events for calls
 */
export async function handleCallWebhook(req, res) {
  try {
    const event = req.body;
    const eventType = event.data?.event_type || event.event_type;

    console.log('📨 Received webhook event:', eventType);
    console.log('📋 Event data:', JSON.stringify(event, null, 2));

    // Extract call information
    const callControlId = event.data?.payload?.call_control_id;
    const callId = event.data?.payload?.call_leg_id || event.data?.payload?.call_session_id;
    const from = event.data?.payload?.from;
    const to = event.data?.payload?.to;

    switch (eventType) {
      case 'call.initiated':
      case 'call.ringing':
        console.log(`📞 Incoming call from ${from} to ${to}`);

        // Create initial call record
        if (callId) {
          try {
            callDataOperations.create({
              call_id: callId,
              phone_number: from,
              status: 'ringing'
            });
          } catch (err) {
            // Record might already exist, that's okay
            console.log('Call record may already exist');
          }
        }

        // Answer the call and start AI assistant
        if (callControlId) {
          console.log('📞 Answering call and starting AI assistant');
          await answerCallWithAI(callControlId);
          
          // Update call status
          if (callId) {
            callDataOperations.update(callId, { status: 'active' });
          }
        }
        break;

      case 'call.answered':
        console.log('✅ Call answered, starting AI assistant');

        // Start Hendrix AI assistant
        if (callControlId) {
          await answerCallWithAI(callControlId);

          // Update call status
          if (callId) {
            callDataOperations.update(callId, { status: 'active' });
          }
        }
        break;

      case 'call.ai.function_call':
        console.log('🔧 AI function call requested');

        const functionName = event.data?.payload?.function_name;
        const functionArgs = event.data?.payload?.arguments;
        const functionCallId = event.data?.payload?.function_call_id;

        if (functionName === 'save_call_data') {
          // Execute the save_call_data function
          const result = await saveCallData(functionArgs, callId);

          // Send result back to AI
          if (callControlId && functionCallId) {
            await sendFunctionResult(callControlId, functionCallId, result);
          }
        }
        break;

      case 'call.hangup':
        console.log('📵 Call ended');

        // Update call status
        if (callId) {
          callDataOperations.update(callId, { status: 'completed' });
        }
        break;

      case 'call.ai.transcript':
        console.log('📜 Transcript received');
        // Handle transcript if sent via webhook
        // (might be retrieved separately via API instead)
        break;

      default:
        console.log(`⚠️  Unhandled event type: ${eventType}`);
    }

    // Always respond with 200 OK to acknowledge webhook
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Error handling webhook:', error);
    // Still return 200 to prevent Telnyx from retrying
    res.status(200).json({ received: true, error: error.message });
  }
}

export default handleCallWebhook;
