/**
 * SMS Webhook Handler
 * Handles incoming SMS messages from Telnyx
 */

import { sendSMS } from '../services/telnyx.js';
import { smsOperations } from '../database/db.js';

/**
 * Generate AI-powered SMS response based on customer message
 * @param {string} messageText - The customer's message
 * @param {string} phoneNumber - Customer's phone number
 * @returns {string|null} - AI generated response or null if no response needed
 */
async function generateAIResponse(messageText, phoneNumber) {
  try {
    const lowerMessage = messageText.toLowerCase().trim();
    
    // Handle common customer service scenarios
    
    // Business hours inquiry
    if (lowerMessage.includes('hours') || lowerMessage.includes('open') || lowerMessage.includes('time')) {
      return "We're open Mon-Fri 8AM-6PM, Sat 9AM-4PM, closed Sundays. Need to schedule a pickup? Call (855) 927-4224 or reply with your address!";
    }
    
    // Pricing inquiry
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('rate') || lowerMessage.includes('how much')) {
      return "Our laundry service starts at $1.50/lb with free pickup & delivery! We handle wash, dry, fold + delicates. Call (855) 927-4224 for instant quote & scheduling.";
    }
    
    // Pickup/scheduling request
    if (lowerMessage.includes('pickup') || lowerMessage.includes('schedule') || lowerMessage.includes('service') || 
        lowerMessage.includes('laundry') || lowerMessage.includes('wash')) {
      return "Great! I'd love to help schedule your laundry pickup. For fastest service, call (855) 927-4224 to speak with Hendrix who can schedule you right away! Or reply with your address.";
    }
    
    // Location/address inquiry
    if (lowerMessage.includes('address') || lowerMessage.includes('location') || lowerMessage.includes('where')) {
      return "We provide pickup & delivery throughout Michigan! Just give us your address and we'll confirm if we service your area. Call (855) 927-4224 or text your address.";
    }
    
    // Services inquiry
    if (lowerMessage.includes('what') || lowerMessage.includes('service') || lowerMessage.includes('do you')) {
      return "We handle all your laundry needs: wash/dry/fold, delicates, dry cleaning, comforters, and more! Free pickup & delivery. Call (855) 927-4224 to get started.";
    }
    
    // Contact/phone inquiry
    if (lowerMessage.includes('phone') || lowerMessage.includes('call') || lowerMessage.includes('number')) {
      return "Call us at (855) 927-4224 to speak with Hendrix, our helpful AI assistant who can answer questions and schedule your pickup instantly!";
    }
    
    // Greeting or general inquiry
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey') ||
        lowerMessage.includes('info') || lowerMessage.length < 10) {
      return "Hi! Welcome to Bags of Laundry 👋 We provide convenient pickup & delivery laundry service in Michigan. How can we help you today? Call (855) 927-4224 for instant service!";
    }
    
    // Emergency/urgent requests
    if (lowerMessage.includes('urgent') || lowerMessage.includes('emergency') || lowerMessage.includes('asap') || 
        lowerMessage.includes('today') || lowerMessage.includes('now')) {
      return "For urgent laundry needs, call (855) 927-4224 right now! Hendrix can check same-day availability and get you scheduled ASAP.";
    }
    
    // Address provided (looks like an address)
    if ((lowerMessage.includes('street') || lowerMessage.includes('st ') || lowerMessage.includes('ave') || 
         lowerMessage.includes('road') || lowerMessage.includes('rd ') || lowerMessage.includes('drive') ||
         lowerMessage.includes('michigan') || lowerMessage.includes('mi ')) &&
        (lowerMessage.includes('123') || /\d/.test(lowerMessage))) {
      return "Perfect! We can definitely service that area. Call (855) 927-4224 now and Hendrix will get your pickup scheduled right away with exact pricing and timing!";
    }
    
    // Stop/unsubscribe
    if (lowerMessage.includes('stop') || lowerMessage.includes('unsubscribe')) {
      return "You've been unsubscribed from Bags of Laundry messages. To resubscribe or schedule service, call (855) 927-4224. Thanks!";
    }
    
    // Default intelligent response for unrecognized messages
    return "Thanks for reaching out to Bags of Laundry! For the quickest help with scheduling, pricing, or questions, call (855) 927-4224 to chat with Hendrix, our AI assistant. He's available 24/7!";
    
  } catch (error) {
    console.error('Error generating AI response:', error);
    return null; // Will trigger fallback response
  }
}

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

      // Store inbound message in database
      try {
        smsOperations.createMessage({
          message_id: message.id || `inbound_${Date.now()}`,
          phone_number: fromNumber,
          direction: 'inbound',
          message_text: messageText,
          conversation_id: null, // Will be set by createMessage
          status: 'received'
        });
      } catch (dbError) {
        console.error('Error storing inbound SMS:', dbError);
      }

      // Generate intelligent AI response
      const replyText = await generateAIResponse(messageText, fromNumber);
      
      if (replyText) {
        try {
          // Send AI-powered response
          const sentMessage = await sendSMS(fromNumber, replyText);
          console.log(`✅ AI-powered reply sent to ${fromNumber}: "${replyText}"`);
          
          // Store outbound message in database
          smsOperations.createMessage({
            message_id: sentMessage.id || `outbound_${Date.now()}`,
            phone_number: fromNumber,
            direction: 'outbound',
            message_text: replyText,
            conversation_id: null, // Will be set by createMessage
            status: 'sent'
          });
        } catch (sendError) {
          console.error('Error sending SMS reply:', sendError);
        }
      } else {
        // Fallback response
        const fallbackReply = "Thanks for your message! For fastest service, please call (855) 927-4224 to speak with Hendrix, our AI assistant.";
        try {
          const sentMessage = await sendSMS(fromNumber, fallbackReply);
          console.log(`✅ Fallback reply sent to ${fromNumber}`);
          
          // Store fallback message
          smsOperations.createMessage({
            message_id: sentMessage.id || `fallback_${Date.now()}`,
            phone_number: fromNumber,
            direction: 'outbound',
            message_text: fallbackReply,
            conversation_id: null,
            status: 'sent'
          });
        } catch (sendError) {
          console.error('Error sending fallback SMS:', sendError);
        }
      }
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