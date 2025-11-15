import { callDataOperations } from '../database/db.js';

/**
 * Save Call Data Function
 * Called by Hendrix AI when customer information is collected
 *
 * @param {Object} params - Function parameters from AI
 * @param {string} params.phone_number - Customer phone number
 * @param {string} params.customer_name - Customer's full name
 * @param {string} params.address - Service address
 * @param {string} params.issue_description - Issue description
 * @param {string} params.additional_notes - Additional notes (optional)
 * @param {string} call_id - Telnyx call ID
 * @returns {Object} - Success/failure response
 */
export async function saveCallData(params, call_id) {
  try {
    console.log('📞 Saving call data for call:', call_id);
    console.log('📋 Parameters:', JSON.stringify(params, null, 2));

    // Validate required fields
    const requiredFields = ['phone_number', 'customer_name', 'address', 'issue_description'];
    const missingFields = requiredFields.filter(field => !params[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Check if call data already exists
    const existingCall = callDataOperations.getByCallId(call_id);

    if (existingCall) {
      // Update existing record
      console.log('🔄 Updating existing call data');
      callDataOperations.update(call_id, {
        customer_name: params.customer_name,
        address: params.address,
        issue_description: params.issue_description,
        additional_notes: params.additional_notes || null,
        status: 'collected'
      });
    } else {
      // Create new record
      console.log('✨ Creating new call data record');
      callDataOperations.create({
        call_id: call_id,
        phone_number: params.phone_number,
        customer_name: params.customer_name,
        address: params.address,
        issue_description: params.issue_description,
        additional_notes: params.additional_notes || null,
        status: 'collected'
      });
    }

    console.log('✅ Call data saved successfully');

    return {
      success: true,
      message: 'Customer information saved successfully. Scheduling team will reach out shortly.',
      call_id: call_id
    };

  } catch (error) {
    console.error('❌ Error saving call data:', error);

    return {
      success: false,
      message: 'There was an error saving the information. Please try again.',
      error: error.message
    };
  }
}

export default saveCallData;
