# Schedula AI Configuration Guide - Groq (FREE) vs OpenAI

## Overview

Schedula now supports **TWO AI providers**:

1. **Groq (RECOMMENDED - FREE)** ✨
   - Completely free tier - no credit card required
   - Generous limits: 30,000 tokens/month
   - Super fast responses
   - Perfect for testing and development

2. **OpenAI (Paid, Optional)**
   - Requires payment method
   - Higher rate limits
   - Can be used as fallback if Groq is full

---

## Quick Start (Groq - FREE Option)

### Step 1: Get Your Groq API Key

1. Visit https://console.groq.com/
2. Click "Sign up" (free account, no card needed)
3. Create your account
4. Go to "API Keys" tab
5. Click "Create API Key"
6. Copy the key

### Step 2: Add to .env File

1. Open `backend/.env`
2. Find the `GROQ_API_KEY` line
3. Paste your key:
   ```
   GROQ_API_KEY=gsk_your_key_here
   ```
4. Save the file
5. Restart your backend server

### Step 3: Test

Visit the AI pages - everything should work with your free Groq account!

---

## Setup (OpenAI - Paid Option, Optional)

If you prefer OpenAI instead of Groq:

1. Visit https://platform.openai.com/account/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key
5. Add to `backend/.env`:
   ```
   OPENAI_API_KEY=sk_your_api_key_here
   ```

**Note:** You must have a valid payment method in your OpenAI account.

---

## Testing the Configuration

#### Test Description Generator:
```bash
curl -X POST http://localhost:5000/api/ai/generate-description \
  -H "Content-Type: application/json" \
  -d '{"event_name": "Campus Hackathon"}'
```

Expected response:
```json
{
  "descriptions": "1. Join us for...\n2. Want to...\n3. This year's..."
}
```

#### Test Chatbot:
```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I organize a campus event?"}'
```

Expected response:
```json
{
  "response": "To organize a campus event, consider..."
}
```

---

## Troubleshooting

### Error: "AI service not configured"
- Ensure either `GROQ_API_KEY` or `OPENAI_API_KEY` is set in `backend/.env`
- Restart the backend server
- Check startup logs for: ✅ or ⚠️

### Error: "API key invalid"
- Verify your key is correct (copy-paste carefully)
- For Groq: Key should start with `gsk_`
- For OpenAI: Key should start with `sk_`
- Generate a new key if needed

### Hitting quota (Groq 30k/month)
- Switch to OpenAI for more tokens
- Or wait until next month for your Groq quota to reset
- Contact Groq support for higher limits

### Slow responses
- Normal: First request may take 2-3 seconds
- Groq is actually very fast compared to OpenAI
- If consistently slow, check your internet connection

---

## API Endpoints

### Generate Event Descriptions
- **URL:** `POST /api/ai/generate-description`
- **Body:** `{"event_name": "Your Event Name"}`
- **Response:** `{"descriptions": "1. ...\n2. ...\n3. ..."}`

### Chat with AI Assistant
- **URL:** `POST /api/ai/chat`
- **Body:** `{"message": "Your question here"}`
- **Response:** `{"response": "AI answer here"}`

---

## Configuration File Template

Copy this to `backend/.env`:

```env
# Groq API Configuration (FREE - Recommended)
GROQ_API_KEY=gsk_your_api_key_here

# OpenAI API Configuration (PAID - Optional fallback)
OPENAI_API_KEY=

# Email Configuration (Optional - for notifications)
EMAIL_ADDRESS=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_SMTP_SERVER=smtp.gmail.com
EMAIL_SMTP_PORT=465
EMAIL_USE_SSL=true

# Stripe Configuration (Optional - for payments)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

---

## Why Groq for Schedula?

1. ✅ **No Billing Worries** - Perfect for development and testing
2. ✅ **Fast Enough** - Response times are excellent
3. ✅ **Generous Limits** - 30k tokens/month is plenty for most users
4. ✅ **Easy to Upgrade** - Can switch to OpenAI anytime
5. ✅ **Professional** - Used by many companies

---

## Support

- **Groq Help:** https://console.groq.com/docs
- **Groq Community:** https://community.groq.com/
- **OpenAI Help:** https://help.openai.com/
- **OpenAI Community:** https://community.openai.com/

---

**Last Updated:** 2026-06-11  
**Schedula Version:** 1.0  
**Recommended Provider:** Groq (FREE) ✨
