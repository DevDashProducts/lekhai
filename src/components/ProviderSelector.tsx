'use client'
import { Provider, ProviderConfig } from '@/types'

const PROVIDERS: Record<Provider, ProviderConfig> = {
  openai: {
    name: 'openai',
    displayName: 'OpenAI Whisper',
    description: 'Most reliable, best accuracy',
    models: ['whisper-1'],
    isAvailable: Boolean(process.env.NEXT_PUBLIC_OPENAI_AVAILABLE),
  },
  elevenlabs: {
    name: 'elevenlabs',
    displayName: 'ElevenLabs',
    description: 'Fast processing, good for short clips',
    models: ['eleven_whisper_v1'],
    isAvailable: Boolean(process.env.NEXT_PUBLIC_ELEVENLABS_AVAILABLE),
  },
  gemini: {
    name: 'gemini',
    displayName: 'Google Gemini',
    description: 'Cost-effective, multilingual support',
    models: ['gemini-1.5-flash'],
    isAvailable: Boolean(process.env.NEXT_PUBLIC_GEMINI_AVAILABLE),
  },
}

interface ProviderSelectorProps {
  selectedProvider: Provider
  onProviderChange: (provider: Provider) => void
  disabled?: boolean
}

export default function ProviderSelector({
  selectedProvider,
  onProviderChange,
  disabled = false,
}: ProviderSelectorProps) {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-gray-700">
        AI Provider
      </label>
      <select
        value={selectedProvider}
        onChange={(e) => onProviderChange(e.target.value as Provider)}
        disabled={disabled}
        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {Object.values(PROVIDERS).map((provider) => (
          <option
            key={provider.name}
            value={provider.name}
            disabled={!provider.isAvailable}
          >
            {provider.displayName} - {provider.description}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        Model: {PROVIDERS[selectedProvider].models[0]}
      </p>
    </div>
  )
} 