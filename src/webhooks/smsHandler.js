/**
 * SMS Webhook Handler
 * Handles incoming SMS messages from Telnyx
 */

import { sendSMS } from '../services/telnyx.js';

/**
 * Handle incoming SMS webhook events
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleSMSWebhook(req, res) {
  try {
    const payload = req.body;
    
    console.log('📱 SMS Webhook received:', JSON.stringify(payload, null, 2));

    // Check if this is an incoming message
    if (payload.data?.event_type === 'message.received' && 
        payload.data?.payload?.direction === 'inbound') {
      
      const message = payload.data.payload;
      const fromNumber = message.from?.phone_number;
      const messageText = message.text;

      console.log(`📨 Received SMS from ${fromNumber}: "${messageText}"`);

      // Send simple auto-reply
      const replyText = "Thanks for your message! Someone from Bags of Laundry will get back to you soon.";
      
      await sendSMS(fromNumber, replyText);
      
      console.log(`✅ Auto-reply sent to ${fromNumber}`);
    }

    // Always respond with 200 to acknowledge webhook
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Error handling SMS webhook:', error.message);
    console.error('Stack:', error.stack);
    
    // Still return 200 to prevent webhook retries
    res.status(200).json({ success: false, error: error.message });
  }
}