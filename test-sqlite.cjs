// Simple test to verify SQLite functionality
const Database = require('better-sqlite3');
const { readFileSync, mkdirSync } = require('fs');
const { join, dirname } = require('path');

try {
  console.log('Testing SQLite setup...');
  
  // Create data directory
  const DB_PATH = './data/lekhai-test.db';
  mkdirSync(dirname(DB_PATH), { recursive: true });
  
  // Initialize database
  const db = new Database(DB_PATH);
  console.log('✓ Database connection successful');
  
  // Test basic query
  const result = db.prepare("SELECT datetime('now') as current_time").get();
  console.log('✓ Basic query successful:', result);
  
  // Load and execute schema
  const schemaPath = join(process.cwd(), 'database/sqlite/init.sql');
  const schema = readFileSync(schemaPath, 'utf8');
  
  const statements = schema.split(';').filter(stmt => stmt.trim());
  
  db.transaction(() => {
    for (const statement of statements) {
      if (statement.trim()) {
        db.exec(statement);
      }
    }
  })();
  
  console.log('✓ Schema initialization successful');
  
  // Test insert
  const insertSession = db.prepare(`
    INSERT INTO sessions (
      id, user_id, session_token, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?)
  `);
  
  const sessionId = 'test-session-id';
  insertSession.run(sessionId, '00000000-0000-0000-0000-000000000000', 'test-token', '127.0.0.1', 'Test Agent');
  
  console.log('✓ Insert successful');
  
  // Test select
  const selectSession = db.prepare('SELECT * FROM sessions WHERE id = ?');
  const session = selectSession.get(sessionId);
  
  console.log('✓ Select successful:', session);
  
  db.close();
  console.log('✓ All tests passed!');
  
} catch (error) {
  console.error('✗ Test failed:', error);
  process.exit(1);
}