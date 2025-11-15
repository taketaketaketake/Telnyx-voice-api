import axios from 'axios';
import dotenv from 'dotenv';
import { hendrixSystemPrompt, telnyxAIConfig, functionDefinitions } from '../config/hendrix.js';

dotenv.config();

const TELNYX_API_BASE = 'https://api.telnyx.com/v2';
const API_KEY = process.env.TELNYX_API_KEY;

/**
 * Telnyx API Service
 * Handles interactions with Telnyx Voice API
 */

const telnyxClient = axios.create({
  baseURL: TELNYX_API_BASE,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Answer incoming call and start AI assistant
 */
export async function answerCallWithAI(callControlId) {
  try {
    console.log('📞 Answering call:', callControlId);

    // Answer the call
    await telnyxClient.post(`/calls/${callControlId}/actions/answer`);

    // Start AI assistant (configuration depends on Telnyx API structure)
    // NOTE: This is a placeholder - adjust based on actual Telnyx AI API
    const aiResponse = await telnyxClient.post(`/calls/${callControlId}/actions/ai_assistant`, {
      system_prompt: hendrixSystemPrompt,
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
    console.error('❌ Error starting AI assistant:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Hangup call
 */
export async function hangupCall(callControlId) {
  try {
    console.log('📵 Hanging up call:', callControlId);
    await telnyxClient.post(`/calls/${callControlId}/actions/hangup`);
    console.log('✅ Call hung up');
  } catch (error) {
    console.error('❌ Error hanging up call:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Retrieve call transcript
 */
export async function getCallTranscript(callId) {
  try {
    console.log('📜 Retrieving transcript for call:', callId);
    const response = await telnyxClient.get(`/calls/${callId}/transcript`);
    console.log('✅ Transcript retrieved');
    return response.data;
  } catch (error) {
    console.error('❌ Error retrieving transcript:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send function call result back to AI
 */
export async function sendFunctionResult(callControlId, functionCallId, result) {
  try {
    console.log('🔄 Sending function result to AI');

    // NOTE: This endpoint structure is hypothetical - adjust based on Telnyx API docs
    await telnyxClient.post(`/calls/${callControlId}/actions/function_result`, {
      function_call_id: functionCallId,
      result: result
    });

    console.log('✅ Function result sent');
  } catch (error) {
    console.error('❌ Error sending function result:', error.response?.data || error.message);
    throw error;
  }
}

export default {
  answerCallWithAI,
  hangupCall,
  getCallTranscript,
  sendFunctionResult
};
