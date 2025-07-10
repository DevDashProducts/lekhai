#!/bin/bash

# lekhAI Database Setup Script
# This script sets up the PostgreSQL database for local development

echo "🗄️  Setting up lekhAI PostgreSQL Database..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Remove existing container if it exists
echo "🧹 Cleaning up any existing containers..."
docker-compose down -v 2>/dev/null || true

# Start PostgreSQL container
echo "🚀 Starting PostgreSQL container..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=30
counter=0

while ! docker exec lekhai-postgres pg_isready -U lekhai_user -d lekhai_dev > /dev/null 2>&1; do
    if [ $counter -eq $timeout ]; then
        echo "❌ PostgreSQL failed to start within $timeout seconds"
        docker-compose logs
        exit 1
    fi
    sleep 1
    counter=$((counter + 1))
    echo -n "."
done

echo ""
echo "✅ PostgreSQL is ready!"

# Test the connection
echo "🔍 Testing database connection..."
if docker exec lekhai-postgres psql -U lekhai_user -d lekhai_dev -c "SELECT NOW() as current_time;"; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    exit 1
fi

# Show database info
echo ""
echo "📊 Database Information:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: lekhai_dev"
echo "  Username: lekhai_user"
echo "  Password: lekhai_dev_password"
echo ""

# Check tables
echo "📋 Database tables:"
docker exec lekhai-postgres psql -U lekhai_user -d lekhai_dev -c "\dt"

echo ""
echo "🎉 Database setup complete!"
echo "💡 To stop the database: docker-compose down"
echo "💡 To view logs: docker-compose logs -f"
echo "💡 To connect manually: docker exec -it lekhai-postgres psql -U lekhai_user -d lekhai_dev"