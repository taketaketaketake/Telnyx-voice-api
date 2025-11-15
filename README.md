# Telnyx Voice Assistant - Hendrix

A low-latency AI voice assistant for Fix My Furnace using Telnyx's latest APIs.

## Overview

**Hendrix** is a conversational AI voice assistant that handles inbound calls for Fix My Furnace in Michigan. He collects customer service details naturally and prepares callers for scheduling with a live technician.

### Features

- 🎙️ **Natural Conversation**: Detroit-local friendly voice with adaptive communication
- 🧠 **AI-Powered**: Uses Qwen/Qwen3-235B-A22B model via Telnyx
- 🗣️ **High-Quality Voice**: NaturalHD/vespera voice synthesis
- 📝 **Automatic Transcription**: Deepgram/Flux transcription model
- 💾 **Data Collection**: Automatically saves customer information to database
- 📊 **Call Management**: Track and retrieve call data via REST API

## Technology Stack

- **AI Model**: Qwen/Qwen3-235B-A22B
- **Voice Provider**: Telnyx NaturalHD
- **Voice**: vespera (male)
- **Transcription**: deepgram/Flux
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **API Platform**: Telnyx Voice API

## Project Structure

```
Telnyx-voice-api/
├── src/
│   ├── config/
│   │   └── hendrix.js          # AI persona & system prompt
│   ├── database/
│   │   ├── schema.sql          # Database schema
│   │   ├── db.js               # Database operations
│   │   └── init.js             # DB initialization script
│   ├── functions/
│   │   └── saveCallData.js     # Function to save customer data
│   ├── services/
│   │   └── telnyx.js           # Telnyx API client
│   ├── webhooks/
│   │   └── callHandler.js      # Webhook event handlers
│   └── server.js               # Main Express server
├── data/                       # Database files (auto-created)
├── .env                        # Environment variables
├── .env.example                # Environment template
├── package.json
└── README.md
```

## Installation

### Prerequisites

- Node.js 18+
- Telnyx account with:
  - API key
  - Phone number configured
  - Webhook URL set up

### Setup Steps

1. **Clone and install dependencies**

```bash
npm install
```

2. **Configure environment variables**

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
TELNYX_API_KEY=your_telnyx_api_key_here
TELNYX_PUBLIC_KEY=your_telnyx_public_key_here
TELNYX_PHONE_NUMBER=+1234567890
PORT=3000
WEBHOOK_URL=https://your-domain.com/webhooks/telnyx
DATABASE_PATH=./data/calls.db
NODE_ENV=development
```

3. **Initialize the database**

```bash
npm run db:init
```

4. **Start the server**

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

## Configuration

### Telnyx Setup

1. **Get API credentials** from [Telnyx Portal](https://portal.telnyx.com/)
2. **Provision a phone number** for inbound calls
3. **Configure webhook URL** in Telnyx:
   - Go to your Call Control Application
   - Set webhook URL to: `https://your-domain.com/webhooks/telnyx`
   - Enable events: `call.initiated`, `call.answered`, `call.hangup`, `call.ai.function_call`

### Local Development with ngrok

For local testing, use ngrok to expose your webhook:

```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm run dev

# In another terminal, expose port 3000
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update your .env WEBHOOK_URL and Telnyx webhook settings
```

## Hendrix Persona

Hendrix is configured to:

- Greet callers warmly with Detroit-local friendliness
- Collect customer information conversationally (name, address, issue)
- Adapt to caller's emotional state (frustrated, calm, elderly, hurried)
- Call `save_call_data` function after collecting required info
- Close gracefully and set expectations for follow-up

### System Prompt

The full system prompt is in `src/config/hendrix.js` and includes:
- Personality traits
- Conversation approach
- Caller adaptation strategies
- Conversation flow steps
- Function calling requirements

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "service": "Telnyx Voice Assistant - Hendrix"
}
```

### List All Calls
```
GET /api/calls?status=completed&limit=10
```

Query params:
- `status`: Filter by status (pending, ringing, active, collected, completed)
- `phone_number`: Filter by phone number
- `limit`: Limit results

Response:
```json
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

### Get Specific Call
```
GET /api/calls/:call_id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "call_id": "abc123",
    "phone_number": "+12345678901",
    "customer_name": "John Doe",
    "address": "123 Main St, Detroit, MI",
    "issue_description": "Furnace not heating",
    "additional_notes": "Last serviced 6 months ago",
    "status": "collected",
    "created_at": "2024-01-15 10:30:00",
    "updated_at": "2024-01-15 10:35:00"
  }
}
```

### Webhook Endpoint
```
POST /webhooks/telnyx
```

Receives Telnyx events (call.initiated, call.answered, call.hangup, etc.)

## Database Schema

### call_data table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| call_id | TEXT | Telnyx call ID (unique) |
| phone_number | TEXT | Customer phone number |
| customer_name | TEXT | Customer full name |
| address | TEXT | Service address |
| issue_description | TEXT | Furnace issue description |
| additional_notes | TEXT | Extra details |
| status | TEXT | Call status |
| created_at | DATETIME | Record creation time |
| updated_at | DATETIME | Last update time |

### call_transcripts table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| call_id | TEXT | Foreign key to call_data |
| transcript_text | TEXT | Full transcript |
| retrieved_at | DATETIME | When transcript was saved |

## Function Calling

### save_call_data

Hendrix automatically calls this function after collecting:
1. Customer name
2. Service address
3. Issue description

**Parameters:**
```javascript
{
  phone_number: string,      // Required
  customer_name: string,     // Required
  address: string,           // Required
  issue_description: string, // Required
  additional_notes: string   // Optional
}
```

**Response:**
```javascript
{
  success: true,
  message: "Customer information saved successfully...",
  call_id: "abc123"
}
```

## Call Flow

1. **Inbound call received** → `call.initiated` webhook
2. **Call answered** → `call.answered` webhook → Start Hendrix AI
3. **Hendrix greets caller** and begins conversation
4. **Information collected** (name, address, issue)
5. **Function called** → `save_call_data` executed
6. **Data saved to database**
7. **Hendrix closes** conversation gracefully
8. **Call ends** → `call.hangup` webhook

## Conversation Example

```
Hendrix: Hi, this is Hendrix with Fix My Furnace. How are you today?
Caller: Hi, I'm good but my furnace isn't working.

Hendrix: I completely understand — that sounds uncomfortable.
         Let's take care of it right away. I'm just going to
         get some basic information before I connect you with
         one of our service techs.

Hendrix: Can I get your name, please?
Caller: Sure, it's Sarah Johnson.

Hendrix: Thanks, Sarah. And what address should our tech come to?
Caller: 456 Oak Street, Detroit.

Hendrix: Got it. So your furnace isn't working — can you tell me
         a bit more about what's happening?
Caller: It's just not turning on at all. I tried adjusting the
        thermostat but nothing happens.

Hendrix: Okay, thank you. Do you remember when your system was
         last serviced?
Caller: About a year ago, I think.

[Function called: save_call_data saves all information]

Hendrix: Perfect, thank you for all that information. I'm sending
         this over to scheduling right now. One of our techs will
         reach out shortly to confirm your appointment — usually
         within a few hours. Thanks so much for calling Fix My
         Furnace — we'll take care of you.

Caller: Great, thank you!
[Call ends]
```

## Development

### Running Tests

```bash
npm test
```

### Debugging

Enable detailed logging by setting in `.env`:
```
NODE_ENV=development
```

### Database Management

**View all calls:**
```bash
sqlite3 data/calls.db "SELECT * FROM call_data;"
```

**Reset database:**
```bash
rm -rf data/calls.db
npm run db:init
```

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use production Telnyx API keys
- [ ] Set up proper webhook URL (HTTPS required)
- [ ] Configure database backups
- [ ] Set up monitoring/logging (e.g., PM2, LogRocket)
- [ ] Enable error tracking (e.g., Sentry)
- [ ] Review security (API key protection, webhook verification)

### Deployment Options

**Option 1: Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

**Option 2: Render**
- Connect GitHub repo
- Set environment variables
- Deploy

**Option 3: AWS/GCP/Azure**
- Use PM2 for process management
- Set up reverse proxy (nginx)
- Configure SSL certificates

## Troubleshooting

### Webhook not receiving events
- Check Telnyx webhook URL configuration
- Verify HTTPS is enabled (required by Telnyx)
- Check server logs for errors
- Test with ngrok for local development

### AI not starting
- Verify Telnyx API key is correct
- Check AI model and voice configuration
- Review Telnyx API docs for latest endpoint structure

### Database errors
- Run `npm run db:init` to reinitialize
- Check file permissions on `data/` directory
- Verify SQLite is installed

### Function not being called
- Check Hendrix system prompt has function definition
- Verify function schema matches expected parameters
- Review webhook logs for `call.ai.function_call` events

## Notes

### API Compatibility

The Telnyx AI API endpoints in `src/services/telnyx.js` are based on expected structure. You may need to adjust these based on Telnyx's actual API documentation:

- AI assistant initialization endpoint
- Function calling webhook structure
- Transcript retrieval method

Refer to [Telnyx Voice API docs](https://developers.telnyx.com/) for latest specifications.

### Voice Options

The voice is currently set to `vespera`. Check Telnyx documentation for:
- Available male voices
- Voice customization options
- Regional accent support

## License

MIT

## Support

For issues or questions:
- Check Telnyx documentation: https://developers.telnyx.com/
- Review server logs for errors
- Open an issue in this repository

---

**Built with ❤️ for Fix My Furnace**
