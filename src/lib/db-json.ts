import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs'
import { dirname } from 'path'
import { v4 as uuidv4 } from 'uuid'

// JSON database configuration
const DB_PATH = process.env.JSON_DB_PATH || './data/lekhai.json'

interface JsonDatabase {
  users: any[]
  sessions: any[]
  transcripts: any[]
  transcript_words: any[]
  usage_events: any[]
  metadata: {
    version: string
    created_at: string
    last_updated: string
  }
}

// Create a singleton database instance
let db: JsonDatabase | null = null

function getJsonDb(): JsonDatabase {
  if (!db) {
    // Ensure data directory exists
    mkdirSync(dirname(DB_PATH), { recursive: true })
    
    // Load or create database
    if (existsSync(DB_PATH)) {
      try {
        const data = readFileSync(DB_PATH, 'utf8')
        db = JSON.parse(data)
        console.log(`JSON database loaded from: ${DB_PATH}`)
      } catch (error) {
        console.error('Failed to load JSON database, creating new one:', error)
        db = createEmptyDb()
      }
    } else {
      db = createEmptyDb()
      saveDb()
      console.log(`JSON database created at: ${DB_PATH}`)
    }
    
    // Initialize with demo user if not exists
    if (!db!.users.find(u => u.id === '00000000-0000-0000-0000-000000000000')) {
      db!.users.push({
        id: '00000000-0000-0000-0000-000000000000',
        email: 'demo@lekhai.com',
        name: 'Demo User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      saveDb()
    }
  }

  return db as JsonDatabase
}

function createEmptyDb(): JsonDatabase {
  return {
    users: [],
    sessions: [],
    transcripts: [],
    transcript_words: [],
    usage_events: [],
    metadata: {
      version: '1.0.0',
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    }
  }
}

function saveDb(): void {
  if (!db) return
  
  db.metadata.last_updated = new Date().toISOString()
  
  try {
    writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
  } catch (error) {
    console.error('Failed to save JSON database:', error)
    throw error
  }
}

// Helper function to execute queries with automatic error handling
export function jsonQuery<T = any>(
  tableName: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  data?: any,
  whereClause?: (item: any) => boolean
): { rows: T[]; rowCount: number } {
  const database = getJsonDb()
  const start = Date.now()
  
  try {
    let result: { rows: T[]; rowCount: number }
    
    if (!(tableName in database)) {
      throw new Error(`Table ${tableName} does not exist`)
    }
    
    const table = database[tableName as keyof JsonDatabase] as any[]
    
    switch (operation) {
      case 'select':
        const rows = whereClause ? table.filter(whereClause) : table
        result = { rows: rows as T[], rowCount: rows.length }
        break
        
      case 'insert':
        if (!data) throw new Error('Insert operation requires data')
        const insertData = {
          ...data,
          id: data.id || uuidv4(),
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        }
        table.push(insertData)
        saveDb()
        result = { rows: [insertData] as T[], rowCount: 1 }
        break
        
      case 'update':
        if (!data || !whereClause) throw new Error('Update operation requires data and where clause')
        const updateCount = table.reduce((count, item, index) => {
          if (whereClause(item)) {
            table[index] = { ...item, ...data, updated_at: new Date().toISOString() }
            return count + 1
          }
          return count
        }, 0)
        if (updateCount > 0) saveDb()
        result = { rows: [], rowCount: updateCount }
        break
        
      case 'delete':
        if (!whereClause) throw new Error('Delete operation requires where clause')
        const originalLength = table.length
        const filteredTable = table.filter(item => !whereClause(item))
        database[tableName as keyof JsonDatabase] = filteredTable as any
        const deleteCount = originalLength - filteredTable.length
        if (deleteCount > 0) saveDb()
        result = { rows: [], rowCount: deleteCount }
        break
        
      default:
        throw new Error(`Unsupported operation: ${operation}`)
    }
    
    const duration = Date.now() - start
    
    // Log slow queries (> 100ms for JSON operations)
    if (duration > 100) {
      console.warn(`Slow JSON query executed in ${duration}ms:`, { tableName, operation })
    }
    
    return result
  } catch (error) {
    console.error('JSON query error:', { tableName, operation, error })
    throw error
  }
}

// Helper function for transactions (simulate with try/catch)
export function jsonTransaction<T>(
  callback: () => T
): T {
  const database = getJsonDb()
  
  // Create backup
  const backup = JSON.parse(JSON.stringify(database))
  
  try {
    const result = callback()
    saveDb()
    return result
  } catch (error) {
    // Restore backup on error
    db = backup
    saveDb()
    throw error
  }
}

// Test database connection
export function testJsonConnection(): boolean {
  try {
    const database = getJsonDb()
    console.log('JSON database connection successful, tables:', Object.keys(database).filter(k => k !== 'metadata'))
    return true
  } catch (error) {
    console.error('JSON database connection failed:', error)
    return false
  }
}

// Get database info
export function getJsonInfo(): {
  path: string
  size: number
  tables: string[]
  recordCounts: Record<string, number>
} {
  const database = getJsonDb()
  // Get file size
  const stats = existsSync(DB_PATH) ? statSync(DB_PATH) : { size: 0 }
  
  // Get table info
  const tables = Object.keys(database).filter(k => k !== 'metadata')
  const recordCounts: Record<string, number> = {}
  
  tables.forEach(table => {
    recordCounts[table] = (database[table as keyof JsonDatabase] as any[]).length
  })
  
  return {
    path: DB_PATH,
    size: stats.size,
    tables,
    recordCounts
  }
}

// Search functionality
export function searchInTable<T = any>(
  tableName: string,
  searchFields: string[],
  searchTerm: string
): T[] {
  const database = getJsonDb()
  const table = database[tableName as keyof JsonDatabase] as any[]
  
  if (!table) return []
  
  const lowerSearchTerm = searchTerm.toLowerCase()
  
  return table.filter(item => {
    return searchFields.some(field => {
      const value = item[field]
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowerSearchTerm)
      }
      return false
    })
  }) as T[]
}