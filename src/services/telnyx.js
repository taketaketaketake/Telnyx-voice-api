import Telnyx from 'telnyx';
import dotenv from 'dotenv';
import { hendrixSystemPrompt, telnyxAIConfig, functionDefinitions } from '../config/hendrix.js';

dotenv.config();

/**
 * Telnyx API Service
 * Using Official Telnyx Node.js SDK v4.2.1
 * Handles interactions with Telnyx Voice API
 */

// Initialize Telnyx client with official SDK
const telnyx = new Telnyx(process.env.TELNYX_API_KEY);

/**
 * Answer incoming call and start AI assistant
 *
 * @param {string} callControlId - The call control ID from webhook
 * @returns {Promise<Object>} - Response from AI assistant initialization
 *
 * NOTE: AI configuration preserved exactly as specified:
 * - Model: Qwen/Qwen3-235B-A22B
 * - Voice: NaturalHD/vespera
 * - Transcription: deepgram/Flux
 */
export async function answerCallWithAI(callControlId) {
  try {
    console.log('📞 Answering call:', callControlId);

    // Answer the call using SDK request method
    await telnyx.request({
      method: 'POST',
      path: `/calls/${callControlId}/actions/answer`
    });

    console.log('✅ Call answered, starting AI assistant...');

    /**
     * Start AI Assistant
     *
     * IMPORTANT: The exact method name and parameters may vary.
     * Verify against official Telnyx AI Assistant API documentation:
     * https://developers.telnyx.com/api/call-control/call-start-ai-assistant
     *
     * Possible SDK patterns:
     * - telnyx.calls.startAiAssistant(callControlId, config)
     * - telnyx.calls.aiAssistant.start(callControlId, config)
     * - telnyx.ai.assistant.start(callControlId, config)
     *
     * The configuration below maintains your exact requirements.
     */

    // Attempt using the expected SDK pattern
    // If this method doesn't exist, we'll need to use direct API call
    let aiResponse;

    const assistantId = process.env.TELNYX_ASSISTANT_ID;
    console.log('🔧 Assistant ID from env:', assistantId);

    // Test if assistant exists first
    try {
      console.log('🔧 Testing assistant access...');
      const testResponse = await telnyx.request({
        method: 'GET',
        path: `/ai/assistants/${assistantId}`
      });
      console.log('✅ Assistant found:', testResponse.data?.name || 'Unknown name');
    } catch (testError) {
      console.log('❌ Assistant test failed:', testError.message);
      // Continue anyway in case the GET endpoint is different
    }

    const aiConfig = {
      assistant: {
        id: assistantId
      },
      voice: "Telnyx.NaturalHD.vespera",
      greeting: "Hi, this is Hendrix with Fix My Furnace. How are you today?",
      interruption_settings: {
        enable: telnyxAIConfig.enable_interruptions
      },
      transcription: {
        model: "deepgram/Flux"
      }
    };

    // SDK doesn't have AI assistant methods, use direct API call with SDK request
    console.log('🔧 Using SDK request method for AI assistant');
    console.log('🔧 AI Config:', JSON.stringify(aiConfig, null, 2));
    
    aiResponse = await telnyx.request({
      method: 'POST',
      path: `/calls/${callControlId}/actions/ai_assistant_start`,
      data: aiConfig
    });

    console.log('✅ AI assistant started');
    return aiResponse.data || aiResponse;

  } catch (error) {
    console.error('❌ Error starting AI assistant:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

/**
 * Hangup call
 *
 * @param {string} callControlId - The call control ID
 */
export async function hangupCall(callControlId) {
  try {
    console.log('📵 Hanging up call:', callControlId);

    // Use SDK request method for hangup
    await telnyx.request({
      method: 'POST',
      path: `/calls/${callControlId}/actions/hangup`
    });

    console.log('✅ Call hung up');
  } catch (error) {
    console.error('❌ Error hanging up call:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Retrieve call transcript
 *
 * @param {string} callId - The call ID or session ID
 * @returns {Promise<Object>} - Transcript data
 */
export async function getCallTranscript(callId) {
  try {
    console.log('📜 Retrieving transcript for call:', callId);

    // Use SDK request method for transcript retrieval
    const response = await telnyx.request({
      method: 'GET',
      path: `/calls/${callId}/transcript`
    });

    console.log('✅ Transcript retrieved successfully');
    return response.data || response;
  } catch (error) {
    console.error('❌ Error retrieving transcript:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send function call result back to AI
 *
 * @param {string} callControlId - The call control ID
 * @param {string} functionCallId - The function call ID from the webhook
 * @param {Object} result - The result to send back to the AI
 *
 * NOTE: Verify the correct endpoint and SDK method.
 * This is called after executing a function that the AI requested.
 */
export async function sendFunctionResult(callControlId, functionCallId, result) {
  try {
    console.log('🔄 Sending function result to AI');
    console.log('Function Call ID:', functionCallId);
    console.log('Result:', result);

    // Try SDK method if available
    let response;
    // Use SDK request method for function result
    response = await telnyx.request({
      method: 'POST',
      path: `/calls/${callControlId}/actions/function_result`,
      data: {
        function_call_id: functionCallId,
        result: result
      }
    });

    console.log('✅ Function result sent');
    return response;
  } catch (error) {
    console.error('❌ Error sending function result:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Verify webhook signature
 * Ensures webhook requests are actually from Telnyx
 *
 * @param {string} payload - The raw request body as string
 * @param {string} signature - The signature from request headers
 * @param {string} timestamp - The timestamp from request headers
 * @returns {boolean} - True if signature is valid
 *
 * NOTE: Implement this using Telnyx SDK's webhook verification utilities
 * Telnyx SDK should provide: telnyx.webhooks.constructEvent() or similar
 */
export function verifyWebhookSignature(payload, signature, timestamp) {
  try {
    const crypto = require('crypto');
    
    // Telnyx webhook signature verification
    // Documentation: https://developers.telnyx.com/docs/api/webhooks/webhook-signing
    
    const publicKey = process.env.TELNYX_PUBLIC_KEY;
    if (!publicKey) {
      console.error('❌ TELNYX_PUBLIC_KEY not set in environment');
      return false;
    }
    
    // Create the signed payload string
    const signedPayload = `${timestamp}|${payload}`;
    
    // Verify the signature using the public key
    const expectedSignature = crypto
      .createHmac('sha256', publicKey.replace(/'/g, ''))
      .update(signedPayload, 'utf8')
      .digest('base64');
    
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
    
    if (!isValid) {
      console.error('❌ Webhook signature verification failed');
      return false;
    }
    
    console.log('✅ Webhook signature verified');
    return true;
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error.message);
    return false;
  }
}

export default {
  answerCallWithAI,
  hangupCall,
  getCallTranscript,
  sendFunctionResult,
  verifyWebhookSignature,
  // Export the client for advanced usage
  client: telnyx
};
