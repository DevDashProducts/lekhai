'use client'
import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const isFFmpegError = this.state.error?.message?.toLowerCase().includes('ffmpeg') ||
                           this.state.error?.message?.toLowerCase().includes('worker') ||
                           this.state.error?.message?.toLowerCase().includes('module not found')

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <AlertCircle className="text-red-500" size={48} />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {isFFmpegError ? 'Audio Processing Error' : 'Application Error'}
                </h1>
                <p className="text-gray-600 text-sm">
                  {isFFmpegError 
                    ? 'There was an issue initializing the audio processing engine.'
                    : 'Something went wrong while loading the application.'
                  }
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <p className="text-xs text-gray-500 font-mono break-all">
                  {this.state.error?.message}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Reload Application
                </Button>
                
                {isFFmpegError && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>If the problem persists:</p>
                    <ul className="list-disc list-inside space-y-1 text-left">
                      <li>Ensure you're using HTTPS</li>
                      <li>Try using a modern browser (Chrome, Firefox, Safari)</li>
                      <li>Check if your browser supports SharedArrayBuffer</li>
                      <li>Disable browser extensions that might block workers</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary 