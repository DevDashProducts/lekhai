import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'

// SQLite database configuration
const DB_PATH = process.env.SQLITE_DB_PATH || './data/lekhai.db'

// Create a singleton database instance
let db: any | null = null

export function getSqliteDb(): any {
  if (!db) {
    // Ensure data directory exists
    const { mkdirSync } = require('fs')
    const { dirname } = require('path')
    mkdirSync(dirname(DB_PATH), { recursive: true })
    
    // Initialize database
    db = new (Database as any)(DB_PATH)
    
    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL')
    db.pragma('synchronous = NORMAL')
    db.pragma('cache_size = 1000000')
    db.pragma('temp_store = memory')
    
    // Initialize schema
    initializeSchema()
    
    console.log(`SQLite database initialized at: ${DB_PATH}`)
  }
  
  return db
}

function initializeSchema(): void {
  if (!db) return
  
  try {
    // Read and execute the initialization SQL
    const schemaPath = join(process.cwd(), 'database/sqlite/init.sql')
    const schema = readFileSync(schemaPath, 'utf8')
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim())
    
    db.transaction(() => {
      for (const statement of statements) {
        if (statement.trim()) {
          (db as any).exec(statement)
        }
      }
    })()
    
    console.log('SQLite schema initialized successfully')
  } catch (error) {
    console.error('Failed to initialize SQLite schema:', error)
    throw error
  }
}

// Helper function to execute queries with automatic error handling
export function sqliteQuery<T = any>(
  sql: string,
  params: any[] = []
): { rows: T[]; rowCount: number } {
  const database = getSqliteDb()
  const start = Date.now()
  
  try {
    let result: any
    
    // Determine if it's a SELECT query or modification query
    const isSelect = sql.trim().toLowerCase().startsWith('select')
    
    if (isSelect) {
      const stmt = database.prepare(sql)
      const rows = params.length > 0 ? stmt.all(...params) : stmt.all()
      result = { rows, rowCount: rows.length }
    } else {
      const stmt = database.prepare(sql)
      const info = params.length > 0 ? stmt.run(...params) : stmt.run()
      
      // For INSERT queries, return the inserted row if possible
      if (sql.trim().toLowerCase().startsWith('insert') && sql.includes('RETURNING')) {
        // SQLite doesn't support RETURNING, so we need to handle this differently
        // For now, return empty rows array
        result = { rows: [], rowCount: info.changes }
      } else {
        result = { rows: [], rowCount: info.changes }
      }
    }
    
    const duration = Date.now() - start
    
    // Log slow queries (> 1000ms)
    if (duration > 1000) {
      console.warn(`Slow SQLite query executed in ${duration}ms:`, { sql, params })
    }
    
    return result
  } catch (error) {
    console.error('SQLite query error:', { sql, params, error })
    throw error
  }
}

// Helper function for transactions
export function sqliteTransaction<T>(
  callback: (db: any) => T
): T {
  const database = getSqliteDb()

  return database.transaction(callback)(database)
}

// Test database connection
export function testSqliteConnection(): boolean {
  try {
    const result = sqliteQuery('SELECT datetime("now") as current_time')
    console.log('SQLite connection successful:', result.rows[0])
    return true
  } catch (error) {
    console.error('SQLite connection failed:', error)
    return false
  }
}

// Close the database (useful for testing or graceful shutdown)
export function closeSqliteDb(): void {
  if (db) {
    db.close()
    db = null
    console.log('SQLite database closed')
  }
}

// Get database info
export function getSqliteInfo(): {
  path: string
  size: number
  tables: string[]
} {
  const database = getSqliteDb()
  const { statSync } = require('fs')
  
  // Get file size
  const stats = statSync(DB_PATH)
  
  // Get table names
  const tablesResult = sqliteQuery(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `)
  
  return {
    path: DB_PATH,
    size: stats.size,
    tables: tablesResult.rows.map(row => row.name)
  }
}