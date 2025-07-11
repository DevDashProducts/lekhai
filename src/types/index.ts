export type Provider = 'openai' | 'elevenlabs' | 'gemini'

export interface TranscriptionResponse {
  text: string
  duration?: number
  confidence?: number
}

export interface TranscriptEntry {
  id: string
  text: string
  provider: Provider
  timestamp: Date
  duration?: number
  confidence?: number
}

export interface ProviderConfig {
  name: string
  displayName: string
  description: string
  models: string[]
  isAvailable: boolean
}

export interface AuthContext {
  isAuthenticated: boolean
  user?: {
    id: string
    email: string
    plan?: string
  }
}

export interface UsageStats {
  minutesUsed: number
  minutesLimit: number
  requestsCount: number
  currentPlan: string
} 