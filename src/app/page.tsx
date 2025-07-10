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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg shadow-lg p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 715 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">lekhAI</h1>
            <p className="text-sm text-muted-foreground">AI-powered speech transcription</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Demo Access
              </label>
              <input
                type="password"
                placeholder="Enter demo password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <Button 
              onClick={handleAuth}
              className="w-full"
              size="default"
            >
              Access lekhAI
            </Button>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-xs text-muted-foreground">Built by DevDash Labs</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <SpeechToText password={password} />
    </ErrorBoundary>
  )
}