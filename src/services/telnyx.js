import Telnyx from 'telnyx';
import dotenv from 'dotenv';
import { hendrixSystemPrompt, telnyxAIConfig, functionDefinitions } from '../config/hendrix.js';

dotenv.config();

/**
 * Telnyx API Service
 * Handles interactions with Telnyx Voice API
 */

const telnyx = new Telnyx({
  apiKey: process.env.TELNYX_API_KEY
});

/**
 * Answer incoming call and start AI assistant
 */
export async function answerCallWithAI(callControlId) {
  try {
    console.log('📞 Answering call:', callControlId);

    // Answer the call
    await telnyx.calls.answer(callControlId);

    // Start AI assistant
    const aiResponse = await telnyx.calls.aiAssistantStart(callControlId, {
      system_prompt: hendrixSystemPrompt,
      initial_message: "Hi, this is Hendrix with Fix My Furnace. How are you today?",
      model: telnyxAIConfig.model,
      voice: telnyxAIConfig.voice,
      transcription: telnyxAIConfig.transcription,
      language: telnyxAIConfig.language,
      enable_interruptions: telnyxAIConfig.enable_interruptions,
      voice_activity_detection: telnyxAIConfig.voice_activity_detection,
      temperature: telnyxAIConfig.temperature,
      max_tokens: telnyxAIConfig.max_tokens,
      functions: functionDefinitions
    });

    console.log('✅ AI assistant started');
    return aiResponse.data;

  } catch (error) {
    console.error('❌ Error starting AI assistant:');
    console.error('Status:', error.status);
    console.error('Data:', JSON.stringify(error.body, null, 2));
    console.error('Message:', error.message);
    throw error;
  }
}

/**
 * Hangup call
 */
export async function hangupCall(callControlId) {
  try {
    console.log('📵 Hanging up call:', callControlId);
    await telnyx.calls.hangup(callControlId);
    console.log('✅ Call hung up');
  } catch (error) {
    console.error('❌ Error hanging up call:', error.body || error.message);
    throw error;
  }
}

/**
 * Retrieve call transcript
 */
export async function getCallTranscript(callId) {
  try {
    console.log('📜 Retrieving transcript for call:', callId);
    // Note: Check Telnyx SDK docs for correct method name
    const response = await telnyx.calls.retrieve(callId);
    console.log('✅ Transcript retrieved');
    return response.data;
  } catch (error) {
    console.error('❌ Error retrieving transcript:', error.body || error.message);
    throw error;
  }
}

/**
 * Send function call result back to AI
 */
export async function sendFunctionResult(callControlId, functionCallId, result) {
  try {
    console.log('🔄 Sending function result to AI');

    // Note: Check Telnyx SDK docs for correct method name
    await telnyx.calls.functionResult(callControlId, {
      function_call_id: functionCallId,
      result: result
    });

    console.log('✅ Function result sent');
  } catch (error) {
    console.error('❌ Error sending function result:', error.body || error.message);
    throw error;
  }
}

export default {
  answerCallWithAI,
  hangupCall,
  getCallTranscript,
  sendFunctionResult
};
