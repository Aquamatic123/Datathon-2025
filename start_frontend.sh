#!/bin/bash
# Start script for Next.js frontend

cd "$(dirname "$0")"

echo "================================================"
echo "⚛️  Starting Next.js Frontend"
echo "================================================"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found, creating it..."
    echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:5000" > .env.local
    echo "✅ Created .env.local"
fi

echo ""
echo "Starting Next.js dev server..."
echo "Frontend will be available at: http://localhost:3001"
echo "Backend API: http://localhost:5000"
echo "Press Ctrl+C to stop"
echo ""

# Run with memory optimizations
NODE_OPTIONS="--max-old-space-size=2048" npm run dev
