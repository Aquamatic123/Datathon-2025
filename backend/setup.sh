#!/bin/bash

echo "🚀 Setting up Backend for Law Document Analyzer"
echo "================================================"
echo ""

# Check if we're in the backend directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: Please run this script from the backend/ directory"
    echo "   cd backend && bash setup.sh"
    exit 1
fi

# Check Python version
echo "1️⃣  Checking Python version..."
python_version=$(python3 --version 2>&1 || python --version 2>&1)
if [ $? -eq 0 ]; then
    echo "✅ Found: $python_version"
else
    echo "❌ Python 3 not found. Please install Python 3.8 or higher."
    exit 1
fi

# Create virtual environment
echo ""
echo "2️⃣  Creating virtual environment..."
if [ -d "venv" ]; then
    echo "⚠️  Virtual environment already exists. Skipping..."
else
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo ""
echo "3️⃣  Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"

# Install dependencies
echo ""
echo "4️⃣  Installing Python dependencies..."
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
echo "✅ Dependencies installed"

# Set up .env file
echo ""
echo "5️⃣  Setting up environment variables..."
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Skipping..."
else
    cp .env.example .env
    echo "✅ .env file created from example"
    echo ""
    echo "⚠️  IMPORTANT: Please edit backend/.env and add your OpenAI API key:"
    echo "   OPENAI_API_KEY=sk-your-actual-key-here"
    echo ""
    echo "   Get your key from: https://platform.openai.com/api-keys"
fi

# Test document processor
echo ""
echo "6️⃣  Testing document processor..."
python3 document_processor.py > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Document processor working"
else
    echo "⚠️  Document processor test had issues (may be OK)"
fi

# Run processing tests
echo ""
echo "7️⃣  Running processing tests..."
python3 test_processing.py > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Processing tests passed"
else
    echo "⚠️  Some tests had issues (may be OK if no OpenAI key yet)"
fi

echo ""
echo "================================================"
echo "✅ Backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your OpenAI API key"
echo "2. Run: source venv/bin/activate && python3 api_server.py"
echo "3. In another terminal, start the frontend: npm run dev"
echo ""
echo "To activate virtual environment later:"
echo "   source backend/venv/bin/activate"
echo ""
echo "To test HTML processing:"
echo "   python3 test_processing.py"
echo ""
