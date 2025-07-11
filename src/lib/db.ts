import { Pool, PoolClient } from 'pg'

// Database configuration
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

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig)
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
    })

    // Log successful connection
    pool.on('connect', () => {
      console.log('Connected to PostgreSQL database')
    })
  }
  
  return pool
}

// Helper function to execute queries with automatic connection management
export async function query<T = any>(
  text: string, 
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getPool()
  const start = Date.now()
  
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    
    // Log slow queries (> 1000ms)
    if (duration > 1000) {
      console.warn(`Slow query executed in ${duration}ms:`, { text, params })
    }
    
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0
    }
  } catch (error) {
    console.error('Database query error:', { text, params, error })
    throw error
  }
}

// Helper function for transactions
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool()
  const client = await pool.connect()
  
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
  try {
    const result = await query('SELECT NOW() as current_time')
    console.log('Database connection successful:', result.rows[0])
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Close the pool (useful for testing or graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    console.log('Database pool closed')
  }
}