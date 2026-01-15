# Universal Cone Challenge

## Overview

A web-based voice training simulation app for orthopedic sales representatives. Users engage in AI-powered role-play conversations with a simulated surgeon (Dr. Hayes), receive real-time speech-to-text transcription, and get scored feedback on their sales pitch performance. The app is designed to help sales reps practice positioning Zimmer TM cones to skeptical surgeons.

**Core Features:**
- Voice-based conversation with AI surgeon using browser speech recognition
- Real-time transcript display during conversation
- AI-generated scoring (0-100) with sectional breakdowns
- Text-to-speech for AI responses (20% faster playback for natural conversation)
- No authentication required - users just enter their name to start
- Top 10 leaderboard on results page with celebration sound for top performers
- Hidden admin dashboard at /admin for tracking all simulations (CSV export available)
- Email reports sent to semami@tjoinc.com after each completed simulation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React with TypeScript, using Vite as the build tool
- **Routing:** Wouter for lightweight client-side routing
- **State Management:** TanStack React Query for server state and API caching
- **UI Components:** shadcn/ui component library built on Radix UI primitives
- **Styling:** Tailwind CSS with custom medical/professional blue theme
- **Animations:** Framer Motion for UI transitions and microphone pulsing effects
- **Speech Recognition:** Browser's native SpeechRecognition API via react-speech-recognition
- **Text-to-Speech:** Browser's native window.speechSynthesis API
- **Charts:** Recharts for visualizing score breakdowns

### Backend Architecture
- **Runtime:** Node.js with Express
- **Language:** TypeScript with ES modules
- **API Design:** RESTful endpoints defined in shared/routes.ts with Zod validation
- **AI Integration:** OpenAI GPT-4o via Replit AI Integrations for surgeon role-play and scoring
- **Build System:** Custom build script using esbuild for server and Vite for client

### Data Storage
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM with drizzle-zod for schema validation
- **Schema Location:** shared/schema.ts (shared between client and server)
- **Tables:**
  - `simulations` - Stores user sessions with name, score, and JSON feedback
  - `transcripts` - Stores conversation history linked to simulations

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components including custom MicrophoneButton, ScoreCard
│       ├── pages/        # Route pages (Home, Simulation, Results)
│       ├── hooks/        # Custom hooks for simulations API
│       └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── routes.ts     # API route handlers
│   ├── openai.ts     # AI integration for surgeon responses and scoring
│   ├── storage.ts    # Database access layer
│   └── replit_integrations/  # Pre-built AI integration utilities
├── shared/           # Shared types and schemas
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API route definitions with Zod schemas
└── migrations/       # Drizzle database migrations
```

### Key Design Patterns
- **Shared Schema:** Database schemas and API types are defined once in `/shared` and imported by both client and server
- **Storage Interface:** Database operations abstracted behind IStorage interface for testability
- **Type-Safe API:** Route definitions include Zod schemas for input validation and response types

## External Dependencies

### AI Services
- **OpenAI API:** Used via Replit AI Integrations (environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`)
- **Model:** GPT-4o for conversation and scoring

### Database
- **PostgreSQL:** Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle Kit:** For database migrations (`npm run db:push`)

### Browser APIs
- **SpeechRecognition API:** For voice input (best support in Chrome/Edge/Safari)
- **SpeechSynthesis API:** For text-to-speech output of AI responses

### Key NPM Packages
- `drizzle-orm` / `drizzle-zod` - Database ORM and validation
- `openai` - OpenAI API client
- `react-speech-recognition` - React hook for browser speech recognition
- `framer-motion` - Animation library
- `recharts` - Charting for score visualization
- `@tanstack/react-query` - Server state management
- `zod` - Schema validation