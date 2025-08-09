'use client'
import { Provider, ProviderConfig } from '@/types'
import { Select } from '@/components/ui/select'

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
    <div className="flex flex-col space-y-2 w-full max-w-full">
      <label className="text-sm font-medium text-foreground">
        AI Provider
      </label>
      <Select
        value={selectedProvider}
        onChange={(e) => onProviderChange(e.target.value as Provider)}
        disabled={disabled}
        className="bg-sys-color-surface-container-low"
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
      </Select>
      <p className="text-xs text-muted-foreground">
        Model: {PROVIDERS[selectedProvider].models[0]}
      </p>
    </div>
  )
} 