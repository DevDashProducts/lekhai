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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg w-96 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">lekhAI</h1>
            <p className="text-gray-600">Speech to Text with AI</p>
            <p className="text-sm text-gray-500 mt-1">
              <em>lekh</em> (लेख) - Nepali for "writing"
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Demo Password
              </label>
              <input
                type="password"
                placeholder="Enter demo password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button 
              onClick={handleAuth}
              className="w-full"
              size="lg"
            >
              Access lekhAI
            </Button>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            <p>Built by DevDash Labs</p>
            <p>Powered by multiple AI providers</p>
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
