# Backend - Law Document Analyzer

Python backend that processes uploaded documents and extracts structured law data using LLM.

## Architecture

```
Frontend (Next.js) → Backend (Flask) → Document Processor → LLM Analyzer → Database
```

## Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-actual-key-here
```

### 3. Run the Server

```bash
python api_server.py
```

Server will start on `http://localhost:5000`

## API Endpoints

### POST /api/analyze-document

Main endpoint for document analysis.

**Request:**
```json
{
  "filename": "clean_energy_act_2024.html",
  "content": "base64_encoded_or_plain_text_content",
  "contentType": "text/html",
  "uploadedAt": "2025-11-02T10:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "lawData": {
    "lawId": "Clean_Energy_Act_2024",
    "title": "Clean Energy Advancement Act",
    "jurisdiction": "United States",
    "sector": "Clean Energy",
    "status": "Active",
    "impact": 8,
    "confidence": "High",
    "published": "2024-01-15",
    "affected": 5,
    "summary": "...",
    "stocks_impacted": {
      "STOCK_IMPACTED": [...]
    },
    "document": {...}
  }
}
```

### POST /api/test-extraction

Test endpoint that only extracts text without LLM analysis.

**Request:** Same as above

**Response:**
```json
{
  "success": true,
  "extractedText": "...",
  "wordCount": 1234,
  "fullLength": 5678
}
```

## Components

### 1. document_processor.py

Extracts pure text from various document formats:
- HTML (using BeautifulSoup)
- PDF (using pdfplumber and PyPDF2)
- DOCX (using python-docx)
- TXT (plain text)

### 2. law_analyzer.py

Uses OpenAI GPT-4 to extract structured data from law text:
- Law ID and title
- Jurisdiction and sector
- Impact scores
- Affected stocks
- Confidence levels

### 3. api_server.py

Flask web server that:
- Receives documents from frontend
- Orchestrates processing pipeline
- Returns structured data

## Testing

### Test Document Processing Only

```python
python document_processor.py
```

### Test LLM Analysis Only

```python
# Make sure OPENAI_API_KEY is set in .env
python law_analyzer.py
```

### Test Full API

```bash
# Start server
python api_server.py

# In another terminal, test with curl
curl -X POST http://localhost:5000/api/analyze-document \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.txt",
    "content": "Clean Energy Act 2024. Provides subsidies for EV manufacturers.",
    "contentType": "text/plain"
  }'
```

## Supported Document Formats

- ✅ HTML (.html, .htm)
- ✅ PDF (.pdf)
- ✅ Word (.docx, .doc)
- ✅ Plain Text (.txt)

## LLM Configuration

Default model: `gpt-4-turbo-preview`

For faster/cheaper processing, change in `law_analyzer.py`:
```python
model="gpt-3.5-turbo"  # Faster but less accurate
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (validation error)
- `500`: Server error

## Performance

- Text extraction: ~1-2 seconds
- LLM analysis: ~3-8 seconds
- Total: ~5-10 seconds per document

## Next Steps

1. ✅ Set up Python environment
2. ✅ Install dependencies
3. ✅ Add OpenAI API key
4. ✅ Test document extraction
5. ✅ Test LLM analysis
6. ✅ Start Flask server
7. 🔄 Update Next.js frontend to call backend
8. 🔄 Test end-to-end flow
