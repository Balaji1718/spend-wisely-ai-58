# SpendPilot Backend

Node.js + Express backend for SpendPilot AI.

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Add your GROQ_API_KEY to .env
npm run dev
```

## Environment Variables

- `GROQ_API_KEY` - Your Groq API key
- `PORT` - Server port (default: 3001)
- `CORS_ORIGIN` - Frontend URL (default: http://localhost:5173)

## Endpoints

- `POST /api/analytics` - Compute spending analytics
- `POST /api/parse-expense` - Parse natural language expense input
- `POST /api/chat` - AI-powered financial chat

## Deployment

Deploy to Railway, Render, Fly.io, or any Node.js host.
Set `VITE_API_URL` in your frontend to point to the deployed backend.
