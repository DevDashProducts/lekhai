import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Provider } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    audio.preload = 'metadata'
    
    audio.onloadedmetadata = () => {
      resolve(audio.duration)
    }
    
    audio.onerror = () => {
      reject(new Error('Failed to load audio file'))
    }
    
    audio.src = URL.createObjectURL(file)
  })
}

export function validateApiKey(provider: Provider): boolean {
  const keys = {
    openai: process.env.OPENAI_API_KEY,
    elevenlabs: process.env.ELEVENLABS_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  }
  
  return Boolean(keys[provider])
} 