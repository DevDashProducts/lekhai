'use client'
import { useState } from 'react'
import SpeechToText from '@/components/SpeechToText'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Button } from '@/components/ui/button'

export default function Home() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleAuth = () => {
    // Simple client-side check - in production, this should be server-side
    if (password) {
      setIsAuthenticated(true)
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="relative overflow-hidden">
        {/* background grid */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-sys-color-surface),transparent_60%)] opacity-70" />
          <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]">
            <svg className="w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-sys-color-outline" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-none border border-border bg-sys-color-surface px-2.5 py-1 text-xs text-sys-color-text-secondary">
                <span className="h-1.5 w-1.5 bg-sys-color-primary" />
                Real-time AI transcription
              </div>
              <h1 className="heading-1 tracking-tight">
                Transform your voice into precise, searchable text
              </h1>
              <p className="paragraph text-sys-color-text-secondary max-w-xl mx-auto lg:mx-0">
                lekhAI supports OpenAI Whisper, Google Gemini, and ElevenLabs. Stream speech to text with low latency and modern, accessible UI.
              </p>
            </div>

            <div className="bg-card border border-border rounded-none shadow-sm p-6 sm:p-8 w-full max-w-lg mx-auto">
              <div className="mb-6">
                <h2 className="heading-3">Access</h2>
                <p className="subtle text-sys-color-text-secondary">Enter demo password to continue</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Demo Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter demo password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <Button 
                  onClick={handleAuth}
                  className="w-full rounded-none"
                  size="default"
                >
                  Access lekhAI
                </Button>
              </div>
              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">Built by DevDash Labs</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <ErrorBoundary>
      <SpeechToText password={password} />
    </ErrorBoundary>
  )
}