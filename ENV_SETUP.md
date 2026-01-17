# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# AI Integrations
AI_INTEGRATIONS_OPENAI_API_KEY=your_openai_integration_key
AI_INTEGRATIONS_OPENAI_BASE_URL=your_openai_base_url

# Anthropic (Claude) - Used for conversation and scoring
ANTHROPIC_API_KEY=your_anthropic_api_key

# ElevenLabs Text-to-Speech - NEW! High-quality TTS
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Deepgram Speech-to-Text - For voice recognition fallback
DEEPGRAM_API_KEY=your_deepgram_api_key

# Email Service
RESEND_API_KEY=your_resend_api_key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Getting API Keys

### 1. ElevenLabs (Text-to-Speech) - REQUIRED
1. Visit [https://elevenlabs.io](https://elevenlabs.io)
2. Sign up for a free account (10,000 characters/month)
3. Go to Profile Settings → API Keys
4. Copy your API key
5. Add to `.env`: `ELEVENLABS_API_KEY=your_key_here`

### 2. Anthropic (Claude)
1. Visit [https://console.anthropic.com](https://console.anthropic.com)
2. Sign up and verify your account
3. Navigate to API Keys section
4. Create a new API key
5. Add to `.env`: `ANTHROPIC_API_KEY=your_key_here`

### 3. Deepgram (Speech-to-Text)
1. Visit [https://deepgram.com](https://deepgram.com)
2. Sign up for a free account
3. Go to API Keys in dashboard
4. Create a new API key
5. Add to `.env`: `DEEPGRAM_API_KEY=your_key_here`

### 4. Resend (Email Service)
1. Visit [https://resend.com](https://resend.com)
2. Sign up for an account
3. Create an API key
4. Add to `.env`: `RESEND_API_KEY=your_key_here`

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your `.env` file with the keys above

3. Push database schema:
```bash
npm run db:push
```

4. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Important Notes

- **ElevenLabs** is now the primary TTS provider (replaced OpenAI TTS)
- The app includes intelligent caching to reduce API costs
- Free tier limits:
  - ElevenLabs: 10,000 characters/month
  - With caching, this supports ~1,000 simulation messages
- Browser TTS is used as a fallback if ElevenLabs API fails

## Troubleshooting

### "TTS Error" in console
- Check that `ELEVENLABS_API_KEY` is set correctly
- Verify you haven't exceeded your monthly quota
- Check [status.elevenlabs.io](https://status.elevenlabs.io) for API status

### Audio not playing
- Check browser console for errors
- Ensure browser allows audio autoplay
- Try clicking on the page first to enable audio

### Performance issues
- Clear browser cache
- Restart development server
- Check network tab for slow API calls

For more details, see `INTEGRATION_GUIDE.md`
