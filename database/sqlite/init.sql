-- Initialize lekhAI SQLite database schema
-- This script creates the equivalent SQLite schema to the PostgreSQL version

-- Users table (for future user management)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    email TEXT UNIQUE,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (tracks user sessions for analytics)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    total_recordings INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0
);

-- Transcripts table (core data storage)
CREATE TABLE IF NOT EXISTS transcripts (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    
    -- Audio metadata
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'elevenlabs', 'gemini')),
    original_filename TEXT,
    audio_duration_seconds REAL,
    audio_size_bytes INTEGER,
    mime_type TEXT,
    
    -- Transcription data
    transcript_text TEXT NOT NULL,
    confidence_score REAL, -- Provider confidence if available (0.0 to 1.0)
    language_detected TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
    
    -- Processing metadata
    processing_time_ms INTEGER,
    provider_response_raw TEXT, -- Store full provider response as JSON string
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transcript words table (for advanced features like word-level timestamps)
CREATE TABLE IF NOT EXISTS transcript_words (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    transcript_id TEXT REFERENCES transcripts(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    start_time_seconds REAL,
    end_time_seconds REAL,
    confidence REAL,
    word_index INTEGER NOT NULL
);

-- Usage tracking table (for billing and analytics)
CREATE TABLE IF NOT EXISTS usage_events (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    transcript_id TEXT REFERENCES transcripts(id) ON DELETE CASCADE,
    
    event_type TEXT NOT NULL, -- 'transcription', 'export', etc.
    provider TEXT CHECK (provider IN ('openai', 'elevenlabs', 'gemini')),
    duration_seconds REAL,
    cost_estimate REAL, -- Estimated cost in USD
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON transcripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcripts_provider ON transcripts(provider);
CREATE INDEX IF NOT EXISTS idx_transcripts_status ON transcripts(status);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_transcript_words_transcript_id ON transcript_words(transcript_id);
CREATE INDEX IF NOT EXISTS idx_transcript_words_start_time ON transcript_words(start_time_seconds);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON usage_events(event_type);

-- Triggers to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
AFTER UPDATE ON users 
FOR EACH ROW 
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_transcripts_updated_at 
AFTER UPDATE ON transcripts 
FOR EACH ROW 
BEGIN
    UPDATE transcripts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Insert a default anonymous user for demo purposes
INSERT OR IGNORE INTO users (id, email, name) VALUES 
    ('00000000-0000-0000-0000-000000000000', 'demo@lekhai.com', 'Demo User');

-- Create a view for transcript analytics
CREATE VIEW IF NOT EXISTS transcript_analytics AS
SELECT 
    DATE(created_at) as date,
    provider,
    COUNT(*) as transcript_count,
    AVG(audio_duration_seconds) as avg_duration,
    SUM(audio_duration_seconds) as total_duration,
    AVG(confidence_score) as avg_confidence,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
FROM transcripts 
GROUP BY DATE(created_at), provider
ORDER BY date DESC, provider;