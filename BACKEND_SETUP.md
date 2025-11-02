# 🚀 Complete Setup Guide - Document Analysis System

## Overview

This system consists of:
- **Frontend**: Next.js (TypeScript) - Handles UI and user interactions
- **Backend**: Python Flask - Processes documents and extracts law data using LLM

## Architecture Flow

```
User uploads document
        ↓
Frontend (Next.js) validates file
        ↓
Sends to Backend (Python Flask) at localhost:5000
        ↓
Document Processor extracts text (HTML/PDF/DOCX/TXT)
        ↓
LLM Analyzer (OpenAI GPT-4) extracts structured data
        ↓
Returns law data to Frontend
        ↓
Frontend creates law in database
        ↓
Dashboard updates with new law
```

## Setup Instructions

### Part 1: Backend Setup (Python)

#### 1. Navigate to backend folder
```bash
cd backend
```

#### 2. Create Python virtual environment (recommended)
```bash
python -m venv venv

# Activate it:
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

#### 3. Install dependencies
```bash
pip install -r requirements.txt
```

#### 4. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
PORT=5000
DEBUG=True
```

#### 5. Test document processing
```bash
python document_processor.py
```
You should see extracted text from a sample HTML document.

#### 6. Test LLM analysis (requires API key)
```bash
python law_analyzer.py
```
Should return structured JSON with law data.

#### 7. Start the Flask server
```bash
python api_server.py
```

Server should start on `http://localhost:5000`

You should see:
```
Starting Law Document Analyzer API on port 5000
Debug mode: True
 * Running on http://0.0.0.0:5000
```

**Keep this terminal running!**

### Part 2: Frontend Setup (Next.js)

#### 1. Open a new terminal and navigate to project root
```bash
cd /home/letua/PythonProjects/Datathon/Datathon-2025
```

#### 2. Create frontend environment file
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

#### 3. Install dependencies (if not already done)
```bash
npm install
```

#### 4. Start the Next.js development server
```bash
npm run dev
```

Should start on `http://localhost:3000` or `http://localhost:3001`

## Testing the System

### 1. Test Backend Directly

With backend running, test the API:

```bash
curl -X POST http://localhost:5000/api/analyze-document \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test_law.txt",
    "content": "Clean Energy Act 2024\n\nJurisdiction: United States\nEffective: January 2024\n\nThis act provides $50B in subsidies for electric vehicle manufacturers and renewable energy companies.",
    "contentType": "text/plain"
  }'
```

Should return structured JSON with law data.

### 2. Test Full System (Frontend → Backend)

1. Open `http://localhost:3000` (or 3001) in your browser
2. Click **"Upload & Analyze Document"**
3. Upload a document (HTML, PDF, TXT, or DOCX)
4. Wait for processing (~5-10 seconds)
5. Law should be automatically created!

### 3. Create Test Documents

**Simple Text File** (`test_law.txt`):
```
Clean Energy Advancement Act 2024

Jurisdiction: United States
Status: Active
Effective Date: January 15, 2024
Sector: Clean Energy

This act provides $50 billion in subsidies for electric vehicle manufacturers,
including Tesla, Rivian, and Lucid Motors. It also includes tax incentives for
solar panel installations and battery manufacturing facilities.

Expected to significantly benefit the renewable energy sector with high confidence.
```

**HTML File** (`energy_law.html`):
```html
<!DOCTYPE html>
<html>
<head><title>Clean Energy Act 2024</title></head>
<body>
  <h1>Clean Energy Advancement Act 2024</h1>
  <p><strong>Jurisdiction:</strong> United States</p>
  <p><strong>Effective Date:</strong> January 15, 2024</p>
  <h2>Summary</h2>
  <p>This act provides $50B in subsidies for electric vehicle manufacturers...</p>
</body>
</html>
```

## Troubleshooting

### Backend Issues

**Problem: "OpenAI API key not provided"**
```bash
# Make sure .env file exists in backend folder
cd backend
cat .env
# Should show: OPENAI_API_KEY=sk-...
```

**Problem: "Module not found"**
```bash
# Make sure you're in the virtual environment
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

**Problem: "Port 5000 already in use"**
```bash
# Kill the process using port 5000
# Linux/Mac:
lsof -ti:5000 | xargs kill -9

# Or change port in backend/.env:
PORT=5001
```

### Frontend Issues

**Problem: "Failed to fetch" or CORS error**
- Make sure Python backend is running
- Check backend URL in `.env.local`
- Verify Flask CORS is enabled (already configured)

**Problem: "Backend analysis failed"**
- Check backend terminal for error logs
- Test backend directly with curl
- Verify OpenAI API key is valid

### LLM Issues

**Problem: "Rate limit exceeded"**
- You're hitting OpenAI API rate limits
- Wait a few minutes or upgrade your API plan

**Problem: "Invalid API key"**
- Get a new key from https://platform.openai.com/api-keys
- Update backend/.env file

**Problem: Analysis takes too long**
- Switch to `gpt-3.5-turbo` in `law_analyzer.py` (line 50)
- Reduces from ~8s to ~3s but less accurate

## File Structure

```
Datathon-2025/
├── backend/                        # Python backend
│   ├── api_server.py              # Flask API server
│   ├── document_processor.py      # Text extraction
│   ├── law_analyzer.py            # LLM analysis
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # API keys (create this)
│   └── README.md                  # Backend docs
│
├── components/                     # React components
│   ├── DocumentAnalysisModal.tsx  # Upload modal
│   ├── DashboardHeader.tsx        # Header with upload button
│   └── ...
│
├── pages/
│   ├── index.tsx                  # Main dashboard
│   └── api/
│       └── laws/                  # Next.js API routes
│
├── .env.local                     # Frontend env vars (create this)
└── package.json
```

## Environment Variables Summary

### Backend (.env in `backend/` folder)
```env
OPENAI_API_KEY=sk-your-key-here
PORT=5000
DEBUG=True
```

### Frontend (.env.local in project root)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

## Running Both Servers

You need TWO terminals running simultaneously:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # If using venv
python api_server.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Production Deployment

### Backend
- Deploy Flask app to: Railway, Render, Heroku, AWS, etc.
- Update `NEXT_PUBLIC_BACKEND_URL` to production URL

### Frontend
- Deploy Next.js to: Vercel, Netlify, etc.
- Set environment variable for backend URL

## Cost Estimation

**OpenAI API Usage:**
- GPT-4 Turbo: ~$0.01-0.03 per document
- GPT-3.5 Turbo: ~$0.001-0.003 per document

For testing, budget ~$5-10 should be sufficient for hundreds of tests.

## Next Steps

1. ✅ Set up Python backend
2. ✅ Get OpenAI API key
3. ✅ Test document extraction
4. ✅ Test LLM analysis
5. ✅ Start Flask server
6. ✅ Configure frontend
7. ✅ Test end-to-end
8. 🔄 Upload real law documents
9. 🔄 Refine LLM prompts for better accuracy
10. 🔄 Deploy to production

## Support

- Backend README: `backend/README.md`
- Frontend docs: `docs/UPLOAD_ANALYSIS_SYSTEM.md`
- API endpoint: `pages/api/analyze-document.ts` (old placeholder - now using Python)

---

**Ready to test!** Start both servers and upload a document. 🚀
