import { jsonQuery, jsonTransaction, testJsonConnection } from './db-json'

// Standardize on JSON storage for this build (no Postgres/SQLite)
export function getCurrentDbType(): 'json' { return 'json' }

// Helper function to execute queries with automatic connection management
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  return convertSqlToJson<T>(text, params)
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
// No SQLite support in this build

// Helper function for transactions
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  return jsonTransaction(() => {
    const mockClient = {
      query: async (sql: string, params?: any[]) => convertSqlToJson(sql, params),
    }
    return callback(mockClient)
  })
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  return testJsonConnection()
}

// Close the pool (useful for testing or graceful shutdown)
export async function closePool(): Promise<void> {
  // No-op in JSON mode
}