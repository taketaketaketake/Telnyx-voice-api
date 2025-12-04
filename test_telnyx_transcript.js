import dotenv from 'dotenv';
import { getCallTranscript } from './src/services/telnyx.js';

dotenv.config();

async function testTranscript() {
    const call_id = 'e07a24c6-d0c4-11f0-8108-02420aef2520'; // Using the provided call_leg_id
    const telnyxApiKey = process.env.TELNYX_API_KEY;

    if (!telnyxApiKey || telnyxApiKey === 'your_telnyx_api_key_here') {
        console.error('Error: TELNYX_API_KEY is not set or is still the placeholder in your .env file.');
        console.error('Please ensure you have a .env file with your actual Telnyx API key.');
        process.exit(1);
    }

    console.log(`Testing getCallTranscript for call_id: ${call_id}`);

    try {
        const result = await getCallTranscript(call_id);
        console.log('API Response received:');
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error in test script:');
        console.error(error);
    }
}

testTranscript();