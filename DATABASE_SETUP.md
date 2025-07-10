# PostgreSQL Database Setup for lekhAI

This guide explains how to set up the local PostgreSQL database for lekhAI development.

## Quick Setup

1. **Start Docker Desktop** (if not already running)

2. **Run the setup script:**
   ```bash
   ./scripts/setup-db.sh
   ```

3. **Start the Next.js development server:**
   ```bash
   pnpm dev
   ```

The database will automatically be initialized with the required schema and ready to use.

## Manual Setup

If you prefer to set up manually:

### 1. Start PostgreSQL Container
```bash
docker-compose up -d
```

### 2. Verify Connection
```bash
# Test database connection
curl -H "x-password: demo" http://localhost:3000/api/db-test
```

### 3. View Database
```bash
# Connect to PostgreSQL
docker exec -it lekhai-postgres psql -U lekhai_user -d lekhai_dev

# List tables
\dt

# View transcripts
SELECT * FROM transcripts LIMIT 5;
```

## Database Schema

The database includes the following main tables:

- **users** - User accounts (demo user pre-created)
- **sessions** - User sessions for analytics
- **transcripts** - Core speech-to-text data
- **transcript_words** - Word-level data (for future features)
- **usage_events** - Usage tracking for billing

## Environment Variables

Required in `.env.local`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lekhai_dev
DB_USER=lekhai_user
DB_PASSWORD=lekhai_dev_password
```

## Features Enabled

Once the database is running, you'll have:

✅ **Automatic transcript persistence** - All transcriptions are saved
✅ **Session tracking** - User sessions tracked for analytics  
✅ **Transcript history** - View past transcriptions in the UI
✅ **Search functionality** - Search through saved transcripts
✅ **Export capabilities** - Download transcripts as text files
✅ **Usage statistics** - Track transcription metrics

## API Endpoints

- `GET /api/transcripts` - List recent transcripts
- `GET /api/transcripts?action=search&search=query` - Search transcripts
- `GET /api/transcripts?action=stats` - Get usage statistics
- `GET /api/transcripts/[id]` - Get specific transcript
- `DELETE /api/transcripts/[id]` - Delete transcript
- `GET /api/db-test` - Test database connection

## Troubleshooting

### PostgreSQL won't start
```bash
# Check Docker status
docker ps

# View logs
docker-compose logs

# Restart container
docker-compose down && docker-compose up -d
```

### Connection issues
1. Verify Docker is running
2. Check port 5432 is available
3. Verify environment variables in `.env.local`
4. Test with: `curl -H "x-password: demo" http://localhost:3000/api/db-test`

### Reset database
```bash
# Remove all data and restart
docker-compose down -v
docker-compose up -d
```

## Production Notes

For production deployment:
- Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
- Update connection strings in environment variables
- Set up proper backups and monitoring
- Configure connection pooling for scale

To start Docker, you need to launch Docker Desktop. Here are the steps for your Mac:

  Starting Docker Desktop

  Method 1: From Applications

  1. Open Finder
  2. Go to Applications folder
  3. Find and double-click Docker Desktop

  Method 2: From Spotlight

  1. Press ⌘ + Space (Command + Space)
  2. Type "Docker"
  3. Press Enter when Docker Desktop appears

  Method 3: From Launchpad

  1. Open Launchpad (F4 or pinch gesture)
  2. Find and click Docker Desktop

  Verify Docker is Running

  Once Docker Desktop starts (you'll see the whale icon in your menu bar), verify it's working:

  docker --version

  You should see something like:
  Docker version 24.x.x, build xxxxx

  Then Run the Database Setup

  Once Docker is running:

  # Run the automated setup script
  ./scripts/setup-db.sh

  This will:
  - Start the PostgreSQL container
  - Initialize the database schema
  - Test the connection
  - Show you connection details

  Alternative: Manual Setup

  If the script doesn't work, you can start manually:

  # Start PostgreSQL container
  docker-compose up -d

  # Check if it's running
  docker ps

  You should see a container named lekhai-postgres running on port 5432.