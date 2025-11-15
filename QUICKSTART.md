# Quick Start Guide

Get Hendrix up and running in 5 minutes!

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Telnyx account created
- [ ] Telnyx phone number provisioned

## Step-by-Step Setup

### 1. Install Dependencies ✅

Already done! Dependencies are installed.

### 2. Configure Telnyx Credentials

Edit the `.env` file in the project root:

```bash
nano .env
```

Update these values:

```env
TELNYX_API_KEY=KEY0123ABC...           # From Telnyx Portal
TELNYX_PUBLIC_KEY=your_public_key      # From Telnyx Portal
TELNYX_PHONE_NUMBER=+12345678901       # Your Telnyx number
```

**Where to find these:**
1. Go to https://portal.telnyx.com/
2. Navigate to **API Keys** section
3. Copy your API key
4. Find your phone number in **Numbers** section

### 3. Database Already Initialized ✅

The database has been set up and tested successfully!

### 4. Start the Server

```bash
npm start
```

You should see:

```
🎙️  ========================================
🎙️  Telnyx Voice Assistant - Hendrix
🎙️  Fix My Furnace - Michigan
🎙️  ========================================

✅ Server running on port 3000
📍 Webhook URL: http://localhost:3000/webhooks/telnyx

🎯 Waiting for incoming calls...
```

### 5. Expose Your Webhook (Development)

In a new terminal:

```bash
# Install ngrok if you haven't
npm install -g ngrok

# Expose port 3000
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 6. Configure Telnyx Webhook

1. Go to https://portal.telnyx.com/
2. Navigate to **Call Control Applications**
3. Create or edit your application
4. Set **Webhook URL** to: `https://abc123.ngrok.io/webhooks/telnyx`
5. Enable these webhook events:
   - ✅ call.initiated
   - ✅ call.answered
   - ✅ call.hangup
   - ✅ call.ai.function_call (if available)
6. Save changes
7. Associate your phone number with this application

### 7. Test the System

#### Option A: Call Your Number

Simply call your Telnyx phone number and Hendrix will answer!

#### Option B: Check the Health Endpoint

```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "service": "Telnyx Voice Assistant - Hendrix"
}
```

#### Option C: View Call Data

```bash
curl http://localhost:3000/api/calls
```

## Expected Call Flow

1. **You call the number**
2. **Hendrix answers**: "Hi, this is Hendrix with Fix My Furnace. How are you today?"
3. **You respond**: "Hi, my furnace isn't working."
4. **Hendrix collects info**:
   - Your name
   - Service address
   - Issue description
   - Last service date (optional)
5. **Data is automatically saved** to the database
6. **Hendrix closes**: "Perfect, thank you for all that information..."
7. **Call ends**

## Verify Data Was Saved

After a test call, check the database:

```bash
node test-db.js
```

Or query the API:

```bash
curl http://localhost:3000/api/calls | json_pp
```

## Troubleshooting

### "Cannot connect to Telnyx"
- Check your `TELNYX_API_KEY` in `.env`
- Verify the key is active in Telnyx Portal

### "Webhook not receiving events"
- Ensure ngrok is running
- Check that webhook URL in Telnyx matches ngrok URL
- Must use HTTPS (ngrok provides this automatically)
- Check terminal logs for incoming requests

### "AI not starting"
- Verify Telnyx AI API access is enabled on your account
- Check model name is correct: `Qwen/Qwen3-235B-A22B`
- Review `src/services/telnyx.js` for API endpoint structure

### "Function not being called"
- Check webhook logs in terminal
- Verify function definition in `src/config/hendrix.js`
- Ensure Telnyx supports function calling in your region/plan

## Next Steps

Now that your working version is running, you can:

- ✨ Customize Hendrix's personality in `src/config/hendrix.js`
- 📊 Add more API endpoints for call management
- 📝 Implement transcript retrieval
- 🔔 Add notifications when calls are received
- 🎨 Build a dashboard to view calls
- 🚀 Deploy to production (see README.md)

## Useful Commands

```bash
# Start server
npm start

# Start with auto-reload (development)
npm run dev

# Initialize/reset database
npm run db:init

# Run database test
node test-db.js

# View logs (with PM2)
pm2 logs telnyx-assistant

# Check git status
git status
```

## Support

- 📖 Full documentation: See `README.md`
- 🔧 Telnyx API docs: https://developers.telnyx.com/
- 💡 Need help? Check server logs for errors

---

**You're all set! 🎉**

Call your Telnyx number and chat with Hendrix!
