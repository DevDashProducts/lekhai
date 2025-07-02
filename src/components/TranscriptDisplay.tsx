'use client'
import { useWhisper } from '@cloudraker/use-whisper'
import { Provider } from '@/types'

interface TranscriptDisplayProps {
  transcript: ReturnType<typeof useWhisper>['transcript']
  provider: Provider
  isTranscribing: boolean
}

export default function TranscriptDisplay({
  transcript,
  provider,
  isTranscribing,
}: TranscriptDisplayProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Live Transcript
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Provider: {provider}
          </span>
          {isTranscribing && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-yellow-600">Processing...</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
        {transcript.text ? (
          <div className="space-y-2">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {transcript.text}
            </p>
            {transcript.text && (
              <div className="text-xs text-gray-400 pt-2 border-t">
                Character count: {transcript.text.length}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 italic text-center">
              Start speaking to see transcription appear here...
              <br />
              <span className="text-sm">
                Using {provider} for speech recognition
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 