# lekhAI - AI-Powered Speech to Text

Transform your voice into written words with AI. lekhAI (*lekh* लेख - Nepali for "writing") supports multiple AI providers for real-time speech-to-text transcription.

## ✨ Features

- 🎤 **Real-time Speech Recognition** - Live transcription as you speak
- 🔄 **Multi-Provider Support** - OpenAI Whisper, ElevenLabs, Google Gemini
- 🎨 **Beautiful UI** - Clean, modern interface built with Tailwind CSS
- 🔒 **Simple Authentication** - Demo password protection (Phase 1)
- ⚡ **Next.js 14** - Fast, modern React framework
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔧 **TypeScript** - Full type safety throughout

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- At least one AI provider API key (OpenAI, ElevenLabs, or Gemini)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/devdashlabs/lekhai.git
   cd lekhai
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```bash
   # Add at least one API key
   OPENAI_API_KEY=sk-proj-your-openai-key-here
   ELEVENLABS_API_KEY=your-elevenlabs-key-here
   GEMINI_API_KEY=your-gemini-key-here
   
   # Set a demo password
   SIMPLE_PASSWORD=your-demo-password
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

5. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## 🔑 API Keys Setup

### OpenAI Whisper
1. Sign up at [OpenAI](https://platform.openai.com/)
2. Go to API Keys section
3. Create a new API key
4. Add to `.env.local` as `OPENAI_API_KEY`

### ElevenLabs
1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Go to Profile → API Keys
3. Generate a new API key
4. Add to `.env.local` as `ELEVENLABS_API_KEY`

### Google Gemini
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Add to `.env.local` as `GEMINI_API_KEY`

## 🏗️ Project Structure

```
lekhai/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── api/transcribe/  # API routes for transcription
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── SpeechToText.tsx # Main transcription component
│   │   ├── ProviderSelector.tsx
│   │   └── TranscriptDisplay.tsx
│   ├── lib/                # Utilities and providers
│   │   ├── providers/      # AI provider implementations
│   │   ├── utils.ts        # Utility functions
│   │   └── auth.ts         # Authentication helpers
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
├── .env.example           # Environment variables template
└── README.md              # Project documentation
```

## 🔧 Scripts

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm start      # Start production server
pnpm lint       # Run ESLint
pnpm type-check # Run TypeScript compiler check
```

## 🛠️ Technologies Used

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components with class-variance-authority
- **Speech-to-Text:** @cloudraker/use-whisper
- **Icons:** Lucide React
- **AI Providers:** OpenAI Whisper, ElevenLabs, Google Gemini

## 📖 Usage

1. **Access the Application:** Enter your demo password to access lekhAI
2. **Select AI Provider:** Choose from OpenAI, ElevenLabs, or Gemini
3. **Start Recording:** Click the microphone button to begin
4. **Speak Naturally:** Your speech will be transcribed in real-time
5. **Stop Recording:** Click the stop button when finished

## 🔐 Authentication

Phase 1 uses simple password authentication for demo purposes. The password is set in your `.env.local` file.

**Production Note:** For production use, implement proper authentication (AWS Cognito integration is planned for Phase 2).

## 🌐 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### AWS Amplify
1. Connect your GitHub repository
2. Configure build settings
3. Add environment variables
4. Deploy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [@cloudraker/use-whisper](https://github.com/chengsokdara/use-whisper) for the excellent React hook
- [OpenAI](https://openai.com/) for Whisper API
- [ElevenLabs](https://elevenlabs.io/) for speech-to-text services
- [Google](https://ai.google.dev/) for Gemini API

## 🏢 Built by DevDash Labs

**lekhAI** is developed by DevDash Labs - transforming ideas into digital solutions.

---

*lekh (लेख) - Nepali word meaning "writing" or "to write"*
