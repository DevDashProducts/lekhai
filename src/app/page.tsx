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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #3B82F6 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, #6366F1 0%, transparent 50%)`,
            backgroundSize: '400px 400px'
          }}></div>
        </div>

        <div className="relative z-10 bg-white/80 backdrop-blur-sm p-6 sm:p-10 rounded-3xl shadow-2xl border border-white/20 w-full max-w-md mx-4 space-y-6 sm:space-y-8">
          <div className="text-center">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
              lekhAI
            </h1>
            <p className="text-gray-700 text-lg mb-2">AI-powered speech transcription</p>
            <p className="text-sm text-gray-500">
              <em>lekh</em> (लेख) - Nepali for "writing"
            </p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Demo Access
              </label>
              <input
                type="password"
                placeholder="Enter demo password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
              />
            </div>
            <Button 
              onClick={handleAuth}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 715 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                <span>Access lekhAI</span>
              </div>
            </Button>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-500 space-y-1">
              <p>Built by DevDash Labs</p>
              <div className="flex items-center justify-center space-x-2 text-xs">
                <span>OpenAI</span>
                <span>•</span>
                <span>ElevenLabs</span>
                <span>•</span>
                <span>Gemini</span>
              </div>
            </div>
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
