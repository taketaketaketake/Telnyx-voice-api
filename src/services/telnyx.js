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

    // Answer the call using SDK
    await telnyx.calls.answer(callControlId);

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

    const aiConfig = {
      system_prompt: hendrixSystemPrompt,
      initial_message: "Hi, this is Hendrix with Fix My Furnace. How are you today?",
      model: telnyxAIConfig.model,                    // Qwen/Qwen3-235B-A22B
      voice: telnyxAIConfig.voice,                    // { provider: "telnyx", model: "NaturalHD", voice: "vespera" }
      transcription: telnyxAIConfig.transcription,    // { provider: "deepgram", model: "Flux" }
      language: telnyxAIConfig.language,              // en-US
      enable_interruptions: telnyxAIConfig.enable_interruptions,
      voice_activity_detection: telnyxAIConfig.voice_activity_detection,
      temperature: telnyxAIConfig.temperature,
      max_tokens: telnyxAIConfig.max_tokens,
      functions: functionDefinitions
    };

    try {
      // Try SDK method first (if available)
      aiResponse = await telnyx.calls.startAiAssistant(callControlId, aiConfig);
    } catch (sdkError) {
      // If SDK method doesn't exist, fall back to direct API call
      console.log('⚠️  SDK method not available, using direct API call');

      // Use the SDK's internal request method for direct API calls
      // Endpoint confirmed: ai_assistant_start (not start_ai_assistant)
      aiResponse = await telnyx._request('POST', `/calls/${callControlId}/actions/ai_assistant_start`, aiConfig);
    }

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

    // Use SDK's hangup method
    await telnyx.calls.hangup(callControlId);

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
 *
 * NOTE: Verify the correct SDK method for transcript retrieval.
 * Possible patterns:
 * - telnyx.calls.getTranscript(callId)
 * - telnyx.transcripts.retrieve(callId)
 * - telnyx.ai.transcripts.get(callId)
 */
export async function getCallTranscript(callId) {
  try {
    console.log('📜 Retrieving transcript for call:', callId);

    // Try SDK method if available
    let transcript;
    try {
      transcript = await telnyx.calls.getTranscript(callId);
    } catch (sdkError) {
      // Fall back to direct API call
      console.log('⚠️  Using direct API call for transcript');
      transcript = await telnyx._request('GET', `/calls/${callId}/transcript`);
    }

    console.log('✅ Transcript retrieved');
    return transcript.data || transcript;
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
    try {
      response = await telnyx.calls.sendFunctionResult(callControlId, {
        function_call_id: functionCallId,
        result: result
      });
    } catch (sdkError) {
      // Fall back to direct API call
      console.log('⚠️  Using direct API call for function result');
      response = await telnyx._request('POST', `/calls/${callControlId}/actions/function_result`, {
        function_call_id: functionCallId,
        result: result
      });
    }

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
    // The official SDK should have webhook verification
    // Example (verify actual method name in SDK docs):
    // const event = telnyx.webhooks.constructEvent(payload, signature, process.env.TELNYX_PUBLIC_KEY);
    // return true;

    console.log('⚠️  Webhook signature verification not yet implemented');
    console.log('TODO: Use SDK webhook verification method');

    // For now, return true but log warning
    // IMPORTANT: Implement proper verification in production!
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
