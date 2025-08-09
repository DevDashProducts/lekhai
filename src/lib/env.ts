import { z } from 'zod'

const envSchema = z.object({
  SIMPLE_PASSWORD: z.string().min(1, 'SIMPLE_PASSWORD is required'),
  OPENAI_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
})

export type AppEnv = z.infer<typeof envSchema>

export function getValidatedEnv(): AppEnv {
  const parsed = envSchema.safeParse({
    SIMPLE_PASSWORD: process.env.SIMPLE_PASSWORD,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  })

  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Environment validation failed: ${msg}`)
  }

  return parsed.data
}

