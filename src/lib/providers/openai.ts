import { TranscriptionResponse } from '@/types'

export async function transcribeOpenAI(audioFile: File): Promise<TranscriptionResponse> {
  const formData = new FormData()
  formData.append('file', audioFile)
  formData.append('model', 'whisper-1')
  formData.append('language', 'en')
  formData.append('response_format', 'json')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return {
    text: data.text,
    duration: data.duration,
  }
} 