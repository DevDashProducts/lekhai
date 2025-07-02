import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "lekhAI - AI-Powered Speech to Text",
  description: "Transform your voice into written words with AI. Supporting OpenAI Whisper, Google Gemini, and ElevenLabs.",
  keywords: ["speech to text", "ai transcription", "voice to text", "openai whisper", "real-time transcription"],
  authors: [{ name: "DevDash Labs" }],
  creator: "DevDash Labs",
  publisher: "DevDash Labs",
  robots: "index, follow",
  openGraph: {
    title: "lekhAI - AI-Powered Speech to Text",
    description: "Transform your voice into written words with AI",
    url: "https://lekhai.devdashlabs.com",
    siteName: "lekhAI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "lekhAI - AI-Powered Speech to Text",
    description: "Transform your voice into written words with AI",
    creator: "@devdashlabs",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
