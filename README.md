# lekhAI — AI-Powered Speech to Text

Transform your voice into written words with AI. lekhAI (lekh लेख — Nepali for "writing") supports multiple AI providers for low-latency speech-to-text with a modern UI.

## ✨ Features

- **Real-time transcription**: Streamed speech capture and fast server-side transcription
- **Multi-provider support**: OpenAI Whisper, ElevenLabs, Google Gemini (experimental)
- **Modern UI**: Tailwind CSS v4 + shadcn/ui + Radix primitives
- **Client-side history**: Recent transcripts stored locally (cookies) — no external DB required
- **Simple demo auth**: Password-protected demo (Phase 1)
- **Next.js 15 + React 19 + TypeScript**: App Router, strict TS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- At least one provider API key (OpenAI, ElevenLabs, or Gemini)

### Install & Run

1. Clone and install
   ```bash
   git clone https://github.com/devdashlabs/lekhai.git
   cd lekhai
   pnpm install
   ```

2. Create `.env.local` with your secrets (no example file is committed)
   ```bash
   # Required for API access (used by the UI and APIs via x-password header)
   SIMPLE_PASSWORD=your-demo-password

   # Optional but recommended — enable providers you want to use
   OPENAI_API_KEY=sk-proj_your_openai_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   GEMINI_API_KEY=your_gemini_key

   # Optional: JSON file path for local test storage (used by test endpoints)
   JSON_DB_PATH=./data/lekhai.json
   ```

3. Start the dev server
   ```bash
   pnpm dev
   ```

4. Open the app at http://localhost:3000

Notes
- Microphone access requires a secure context. Browsers treat `http://localhost` as secure.
- Provider availability in the UI is auto-detected from env at build-time.

## 🔐 Authentication

- The home page uses a simple client-side password gate.
- All API routes require the header `x-password: <SIMPLE_PASSWORD>` and will return 401 without it.
- This is for demo only. For production, implement real auth (e.g., NextAuth + Cognito).

## 🎙️ Using lekhAI

1. Enter the demo password
2. Pick a provider (disabled if no API key is configured)
3. Click Start Recording and speak naturally
4. Stop to transcribe; transcripts appear in real-time
5. View, search, copy, and download recent transcripts in History

Behavior
- Local history is stored in a cookie `lekhai_transcripts` (last ~10 items, text truncated to fit cookie limits).
- Silence auto-stop: recording stops after ~3s of silence.

## 🧩 Providers

- **OpenAI Whisper**: model `whisper-1`
- **ElevenLabs**: endpoint `v1/speech-to-text`, default `scribe_v1`
- **Google Gemini (experimental)**: `gemini-1.5-flash:generateContent`

Provider availability flags are set at build time:
- `NEXT_PUBLIC_OPENAI_AVAILABLE`, `NEXT_PUBLIC_ELEVENLABS_AVAILABLE`, `NEXT_PUBLIC_GEMINI_AVAILABLE` are derived from whether corresponding API keys are present.

## 🔌 API Endpoints

All endpoints expect `x-password: <SIMPLE_PASSWORD>` unless noted.

- `POST /api/transcribe/openai|elevenlabs|gemini`
  - Form-data: `file` (audio blob)
  - Returns: `{ text, provider, duration?, confidence?, processing_time_ms }`
  - Example:
    ```bash
    curl -X POST \
      -H "x-password: $SIMPLE_PASSWORD" \
      -F file=@sample.webm \
      http://localhost:3000/api/transcribe/openai
    ```

- `GET /api/transcripts` → 410 Gone (intentionally disabled; UI uses cookies for history)
- `GET /api/transcripts/[id]` → Fetches a transcript from the local JSON store if present
- `DELETE /api/transcripts/[id]` → Deletes a transcript from the local JSON store

Diagnostics & tests
- `GET /api/db-test` → Connectivity check (auth required)
- `GET /api/db-test-json` → JSON store info and a quick insert test (no auth)
- `GET /api/db-test-sqlite` → 410 Gone (SQLite disabled in this build)
- `POST /api/test-db-models` → Exercises session/transcript model flows (auth required)

## 🗂️ Data Storage

- Primary storage: Browser cookies for recent transcripts (no external DB required).
- A lightweight JSON file DB (`JSON_DB_PATH`, default `./data/lekhai.json`) backs test/diagnostic endpoints and model helpers. It's optional and created on demand.
- A PostgreSQL setup guide exists for a future DB-backed version. See `DATABASE_SETUP.md`. In this build, transcripts API listing is disabled and the UI relies on cookies.

## 🧱 Project Structure (high level)

```
lekhai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── transcribe/[provider]/route.ts   # Transcription endpoints
│   │   │   ├── transcripts/[id]/route.ts        # Per-transcript ops (JSON store)
│   │   │   ├── transcripts/route.ts             # 410 Gone (disabled)
│   │   │   ├── db-test/route.ts                 # Connectivity check
│   │   │   ├── db-test-json/route.ts            # JSON DB diagnostics
│   │   │   └── db-test-sqlite/route.ts          # 410 Gone
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── EnhancedRecorder.tsx
│   │   ├── StreamingTranscriptDisplay.tsx
│   │   ├── TranscriptHistory.tsx
│   │   ├── ProviderSelector.tsx
│   │   ├── layout/Header.tsx
│   │   └── ui/button.tsx ...
│   ├── lib/
│   │   ├── providers/{openai,elevenlabs,gemini}.ts
│   │   ├── db.ts / db-json.ts
│   │   ├── models/{transcript,session}.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   └── types/
└── public/
```

## 🔧 Scripts

```bash
pnpm dev         # Start development server (Turbopack)
pnpm build       # Build for production
pnpm start       # Start production server
pnpm lint        # Run ESLint
pnpm lint:fix    # Fix lint issues
pnpm type-check  # TypeScript checks
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript (strict)
- **UI**: Tailwind CSS v4, shadcn/ui, Radix UI, Lucide icons
- **Audio**: MediaRecorder API, waveform visualizers
- **Providers**: OpenAI Whisper, ElevenLabs, Google Gemini

## 🧪 Troubleshooting

- 401 Unauthorized from APIs → ensure `x-password` matches `SIMPLE_PASSWORD`.
- Provider disabled in dropdown → missing API key at build time.
- Mic not working → use Chrome/Safari on `http://localhost:3000` or HTTPS; allow mic permissions.

## 🌐 Deployment

Recommended: Vercel
1. Connect the repo
2. Set env vars: `SIMPLE_PASSWORD`, any provider keys you need
3. Deploy

## 📄 License

Apache-2.0 — see [LICENSE](LICENSE).

## 🙏 Acknowledgments

- [@cloudraker/use-whisper](https://github.com/chengsokdara/use-whisper)
- [OpenAI](https://openai.com/) • [ElevenLabs](https://elevenlabs.io/) • [Google AI](https://ai.google.dev/)

—

lekh (लेख) — Nepali for "writing"
