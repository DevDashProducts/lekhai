import { Pool, PoolClient } from 'pg'
import { jsonQuery, jsonTransaction, testJsonConnection } from './db-json'

// Database type configuration
const DB_TYPE = process.env.DB_TYPE || 'auto' // 'postgresql', 'sqlite', 'json', or 'auto'

// PostgreSQL configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'lekhai_dev',
  user: process.env.DB_USER || 'lekhai_user',
  password: process.env.DB_PASSWORD || 'lekhai_dev_password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // How long to wait for a connection
}

// Create a singleton pool instance
let pool: Pool | null = null
let usingPostgres = false

export function getPool(): Pool {
  // Only create a pool when explicitly configured for Postgres or when in auto mode
  // and we haven't determined Postgres is unusable yet.
  const wantPostgres = DB_TYPE === 'postgresql' || DB_TYPE === 'auto'

  if (!pool && wantPostgres) {
    pool = new Pool(dbConfig)

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
      usingPostgres = false
    })

    // Log successful connection
    pool.on('connect', () => {
      console.log('Connected to PostgreSQL database')
      usingPostgres = true
    })
  }

  if (!pool) {
    // If we don't have a pool, callers must not use it. We return a non-null type only when created.
    throw new Error('PostgreSQL pool is not initialized')
  }

  return pool
}

// Determine which database to use
function shouldUsePostgres(): boolean {
  if (DB_TYPE === 'postgresql') return true
  if (DB_TYPE === 'sqlite' || DB_TYPE === 'json') return false
  // Auto mode: prefer Postgres if we've successfully connected at least once
  return usingPostgres
}

// Get current database type being used
export function getCurrentDbType(): 'postgresql' | 'sqlite' | 'json' {
  if (DB_TYPE === 'json') return 'json'
  if (DB_TYPE === 'sqlite') return 'sqlite'
  if (DB_TYPE === 'postgresql') return 'postgresql'
  // Auto mode: report postgres when we have a live connection, otherwise json
  return usingPostgres ? 'postgresql' : 'json'
}

// Helper function to execute queries with automatic connection management
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const configuredType = getCurrentDbType()

  // JSON backend
  if (configuredType === 'json') {
    return convertSqlToJson<T>(text, params)
  }

  // SQLite backend
  if (configuredType === 'sqlite') {
    // Lazy-load sqlite adapter to avoid hard dependency
    const { sqliteQuery } = await import('./db-sqlite')
    const { sql, params: sqliteParams } = convertPostgresToSqlite(text, params)
    return sqliteQuery<T>(sql, sqliteParams)
  }

  // PostgreSQL backend
  const start = Date.now()
  try {
    const result = await getPool().query(text, params)
    const duration = Date.now() - start
    if (duration > 1000) {
      console.warn(`Slow query executed in ${duration}ms:`, { text, params })
    }
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
    }
  } catch (error) {
    console.error('PostgreSQL query error, falling back:', { text, params, error })
    usingPostgres = false
    // In auto mode, fall back to JSON seamlessly; in explicit postgres mode, still fall back to JSON to keep the app functional
    return convertSqlToJson<T>(text, params)
  }
}

// Convert basic SQL operations to JSON database operations
function convertSqlToJson<T>(sql: string, params: any[] = []): { rows: T[]; rowCount: number } {
  const trimmedSql = sql.trim().toLowerCase()
  
  // Handle SELECT queries
  if (trimmedSql.startsWith('select')) {
    // Simple pattern matching for basic queries
    const fromMatch = sql.match(/from\s+(\w+)/i)
    if (!fromMatch) throw new Error('Could not parse table name from SQL')
    
    const tableName = fromMatch[1]
    
    // Handle WHERE clauses for simple cases
    const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\$1/i)
    if (whereMatch && params.length > 0) {
      const fieldName = whereMatch[1]
      const value = params[0]
      return jsonQuery<T>(tableName, 'select', null, (item: any) => item[fieldName] === value)
    }
    
    // No WHERE clause - select all
    return jsonQuery<T>(tableName, 'select')
  }
  
  // Handle INSERT queries  
  if (trimmedSql.startsWith('insert')) {
    const intoMatch = sql.match(/insert\s+into\s+(\w+)/i)
    if (!intoMatch) throw new Error('Could not parse table name from INSERT')
    
    const tableName = intoMatch[1]
    
    // Extract field names and values
    const fieldsMatch = sql.match(/\(([^)]+)\)/)
    const valuesMatch = sql.match(/values\s*\(([^)]+)\)/i)
    
    if (fieldsMatch && valuesMatch) {
      const fields = fieldsMatch[1].split(',').map(f => f.trim())
      const data: any = {}
      
      fields.forEach((field, index) => {
        data[field] = params[index]
      })
      
      return jsonQuery<T>(tableName, 'insert', data)
    }
  }
  
  // Handle UPDATE queries
  if (trimmedSql.startsWith('update')) {
    const tableMatch = sql.match(/update\s+(\w+)/i)
    if (!tableMatch) throw new Error('Could not parse table name from UPDATE')
    
    const tableName = tableMatch[1]
    const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\$\d+/i)
    
    if (whereMatch) {
      const fieldName = whereMatch[1]
      const whereValue = params[params.length - 1] // Usually last param
      
      // Simple SET clause parsing
      const setData: any = {}
      // This is simplified - in reality you'd need more sophisticated parsing
      
      return jsonQuery<T>(tableName, 'update', setData, (item: any) => item[fieldName] === whereValue)
    }
  }
  
  // Handle DELETE queries
  if (trimmedSql.startsWith('delete')) {
    const fromMatch = sql.match(/delete\s+from\s+(\w+)/i)
    if (!fromMatch) throw new Error('Could not parse table name from DELETE')
    
    const tableName = fromMatch[1]
    const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\$1/i)
    
    if (whereMatch && params.length > 0) {
      const fieldName = whereMatch[1]
      const value = params[0]
      return jsonQuery<T>(tableName, 'delete', null, (item: any) => item[fieldName] === value)
    }
  }
  
  throw new Error(`Unsupported SQL operation: ${sql}`)
}

// Convert PostgreSQL queries to SQLite format
function convertPostgresToSqlite(sql: string, params: any[] = []): { sql: string, params: any[] } {
  let convertedSql = sql
  
  // Replace PostgreSQL-specific syntax with SQLite equivalents
  convertedSql = convertedSql.replace(/\bCURRENT_TIMESTAMP\b/g, 'CURRENT_TIMESTAMP')
  convertedSql = convertedSql.replace(/\bINTERVAL\s+'([^']+)'\s+(\w+)/g, "datetime('now', '-$1 $2')")
  convertedSql = convertedSql.replace(/\bDATE_TRUNC\('day',\s*([^)]+)\)/g, 'DATE($1)')
  convertedSql = convertedSql.replace(/\bILIKE\b/g, 'LIKE')
  convertedSql = convertedSql.replace(/::date/g, '')
  
  // Handle RETURNING clause - SQLite doesn't support it in the same way
  if (convertedSql.includes('RETURNING')) {
    // For now, remove RETURNING clause and handle separately if needed
    convertedSql = convertedSql.replace(/\s+RETURNING\s+.*$/, '')
  }
  
  return { sql: convertedSql, params }
}

// Helper function for transactions
export async function transaction<T>(
  callback: (client: PoolClient | any) => Promise<T>
): Promise<T> {
  const dbType = getCurrentDbType()

  if (dbType === 'json') {
    return jsonTransaction(() => {
      const mockClient = {
        query: async (sql: string, params?: any[]) => convertSqlToJson(sql, params),
      }
      return callback(mockClient)
    })
  }

  if (dbType === 'sqlite') {
    const { sqliteTransaction, sqliteQuery } = await import('./db-sqlite')
    return sqliteTransaction((db) => {
      const mockClient = {
        query: (sql: string, params?: any[]) => {
          const { sql: convertedSql, params: sqliteParams } = convertPostgresToSqlite(sql, params)
          return sqliteQuery(convertedSql, sqliteParams)
        },
      }
      return Promise.resolve(callback(mockClient)) as unknown as T
    })
  }

  // PostgreSQL transaction
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  const dbType = getCurrentDbType()

  if (dbType === 'json') return testJsonConnection()
  if (dbType === 'sqlite') {
    const { testSqliteConnection } = await import('./db-sqlite')
    return testSqliteConnection()
  }

  try {
    const result = await query('SELECT NOW() as current_time')
    console.log('PostgreSQL connection successful:', result.rows[0])
    return true
  } catch (error) {
    console.error('PostgreSQL connection failed, testing JSON fallback:', error)
    usingPostgres = false
    return testJsonConnection()
  }
}

// Close the pool (useful for testing or graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    console.log('PostgreSQL pool closed')
  }
  // Also close SQLite if it was used
  try {
    const { closeSqliteDb } = await import('./db-sqlite')
    closeSqliteDb()
  } catch {
    // ignore
  }
  console.log('Database connections closed')
}