'use client'
import { useState, useCallback } from 'react'
import { AlertCircle, History } from 'lucide-react'
import { Provider } from '@/types'
import EnhancedRecorder from './EnhancedRecorder'
import StreamingTranscriptDisplay from './StreamingTranscriptDisplay'
import TranscriptHistory from './TranscriptHistory'
// import ThemeToggle from './ThemeToggle'
import { Button } from './ui/button'

interface SpeechToTextProps {
  password: string
}

export default function SpeechToText({ password }: SpeechToTextProps) {
  const [provider, setProvider] = useState<Provider>('elevenlabs')
  const [currentTranscript, setCurrentTranscript] = useState<any>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [globalError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const handleTranscriptUpdate = useCallback((transcript: any) => {
    setCurrentTranscript(transcript)
  }, [])

  const handleRecordingStateChange = useCallback((recording: boolean) => {
    setIsRecording(recording)
  }, [])

  const handleTranscribingStateChange = useCallback((transcribing: boolean) => {
    setIsTranscribing(transcribing)
  }, [])

  return (
    <div className="min-h-[calc(100dvh-var(--navbar-height))] bg-background">
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Local toolbar */}
        <div className="flex items-center justify-end mb-4">
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="outline"
            size="sm"
          >
            <History className="w-4 h-4 mr-2" />
            {showHistory ? 'Hide History' : 'View History'}
          </Button>
        </div>

        {/* Error Display */}
        {globalError && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-destructive flex-shrink-0" size={20} />
                <div>
                  <h3 className="text-destructive font-medium">System Error</h3>
                  <p className="text-destructive/80 text-sm mt-1">{globalError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!showHistory ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl mx-auto">
            <EnhancedRecorder
              provider={provider}
              onProviderChange={setProvider}
              password={password}
              onTranscriptUpdate={handleTranscriptUpdate}
              onRecordingStateChange={handleRecordingStateChange}
              onTranscribingStateChange={handleTranscribingStateChange}
            />
            <StreamingTranscriptDisplay
              transcript={currentTranscript || { text: '' }}
              provider={provider}
              isTranscribing={isTranscribing}
              isRecording={isRecording}
            />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <TranscriptHistory 
              password={password}
              className="w-full"
            />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-8 border-t border-border mt-8">
          <p className="text-sm text-muted-foreground">
            Built by <span className="text-primary font-medium">DevDash Labs</span>
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground mt-2">
            <span>OpenAI Whisper</span>
            <span>•</span>
            <span>ElevenLabs</span>
            <span>•</span>
            <span>Google Gemini</span>
          </div>
        </footer>
      </div>
    </div>
  )
}