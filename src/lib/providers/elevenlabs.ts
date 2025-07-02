import { TranscriptionResponse } from '@/types'

export async function transcribeElevenLabs(audioFile: File): Promise<TranscriptionResponse> {
  const formData = new FormData()
  formData.append('file', audioFile)
  formData.append('model', 'eleven_whisper_v1')

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ELEVENLABS_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return {
    text: data.text,
    confidence: data.confidence,
  }
} 