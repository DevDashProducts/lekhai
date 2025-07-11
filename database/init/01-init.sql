-- Initialize lekhAI database schema
-- This script runs automatically when PostgreSQL container starts

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE provider_type AS ENUM ('openai', 'elevenlabs', 'gemini');
CREATE TYPE transcript_status AS ENUM ('processing', 'completed', 'failed');

-- Users table (for future user management)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (tracks user sessions for analytics)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    total_recordings INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0
);

-- Transcripts table (core data storage)
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Audio metadata
    provider provider_type NOT NULL,
    original_filename VARCHAR(255),
    audio_duration_seconds DECIMAL(10,2),
    audio_size_bytes BIGINT,
    mime_type VARCHAR(100),
    
    -- Transcription data
    transcript_text TEXT NOT NULL,
    confidence_score DECIMAL(5,4), -- Provider confidence if available
    language_detected VARCHAR(10),
    status transcript_status DEFAULT 'completed',
    
    -- Processing metadata
    processing_time_ms INTEGER,
    provider_response_raw JSONB, -- Store full provider response for debugging
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transcript words table (for advanced features like word-level timestamps)
CREATE TABLE transcript_words (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transcript_id UUID REFERENCES transcripts(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    start_time_seconds DECIMAL(10,3),
    end_time_seconds DECIMAL(10,3),
    confidence DECIMAL(5,4),
    word_index INTEGER NOT NULL
);

-- Usage tracking table (for billing and analytics)
CREATE TABLE usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    transcript_id UUID REFERENCES transcripts(id) ON DELETE CASCADE,
    
    event_type VARCHAR(50) NOT NULL, -- 'transcription', 'export', etc.
    provider provider_type,
    duration_seconds DECIMAL(10,2),
    cost_estimate DECIMAL(10,6), -- Estimated cost in USD
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_transcripts_session_id ON transcripts(session_id);
CREATE INDEX idx_transcripts_user_id ON transcripts(user_id);
CREATE INDEX idx_transcripts_created_at ON transcripts(created_at DESC);
CREATE INDEX idx_transcripts_provider ON transcripts(provider);
CREATE INDEX idx_transcripts_status ON transcripts(status);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_started_at ON sessions(started_at DESC);

CREATE INDEX idx_transcript_words_transcript_id ON transcript_words(transcript_id);
CREATE INDEX idx_transcript_words_start_time ON transcript_words(start_time_seconds);

CREATE INDEX idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX idx_usage_events_created_at ON usage_events(created_at DESC);
CREATE INDEX idx_usage_events_event_type ON usage_events(event_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transcripts_updated_at BEFORE UPDATE ON transcripts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a default anonymous user for demo purposes
INSERT INTO users (id, email, name) VALUES 
    ('00000000-0000-0000-0000-000000000000', 'demo@lekhai.com', 'Demo User');

-- Create a view for transcript analytics
CREATE VIEW transcript_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    provider,
    COUNT(*) as transcript_count,
    AVG(audio_duration_seconds) as avg_duration,
    SUM(audio_duration_seconds) as total_duration,
    AVG(confidence_score) as avg_confidence,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
FROM transcripts 
GROUP BY DATE_TRUNC('day', created_at), provider
ORDER BY date DESC, provider;