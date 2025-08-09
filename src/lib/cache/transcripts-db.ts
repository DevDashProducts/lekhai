import Dexie, { Table } from 'dexie'
import type { Provider } from '@/types'

export interface TranscriptRecord {
  id: string
  provider: Provider
  text: string
  createdAt: number // epoch ms
  duration?: number
  confidence?: number
}

export class TranscriptsDatabase extends Dexie {
  transcripts!: Table<TranscriptRecord>

  constructor() {
    super('lekhai-db')
    this.version(1).stores({
      transcripts: '&id, provider, createdAt'
    })
  }
}

export const transcriptsDb = new TranscriptsDatabase()

export async function addTranscript(record: TranscriptRecord): Promise<void> {
  await transcriptsDb.transcripts.put(record)
}

export async function getRecentTranscripts(limit = 50): Promise<TranscriptRecord[]> {
  return transcriptsDb.transcripts
    .orderBy('createdAt')
    .reverse()
    .limit(limit)
    .toArray()
}

export async function searchTranscripts(term: string, limit = 50): Promise<TranscriptRecord[]> {
  if (!term.trim()) return getRecentTranscripts(limit)
  const lower = term.toLowerCase()
  const all = await getRecentTranscripts(500)
  return all.filter(t => t.text.toLowerCase().includes(lower)).slice(0, limit)
}

export async function deleteTranscriptById(id: string): Promise<void> {
  await transcriptsDb.transcripts.delete(id)
}

export async function clearAllTranscripts(): Promise<void> {
  await transcriptsDb.transcripts.clear()
}

