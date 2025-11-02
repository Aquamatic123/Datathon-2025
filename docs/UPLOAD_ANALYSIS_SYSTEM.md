# Document Upload & Auto-Analysis System

## Overview

The system now supports automatic law document analysis with a clean frontend interface that's ready for backend integration. Users can upload law documents and the system will automatically extract all relevant information.

## 🎯 User Flows

### Option 1: Quick Upload & Analyze (Recommended)
1. Click **"Quick Upload & Analyze"** button in dashboard header
2. Drag & drop or browse for law document
3. System uploads and prepares document for backend processing
4. Backend extracts all law details automatically
5. Law is created with extracted data

### Option 2: Auto-fill from Document
1. Click **"Add New Law"** button
2. Click **"Upload Document for Analysis"** in the highlighted section
3. Upload document for automatic extraction
4. Review and adjust extracted data if needed
5. Submit to create law

### Option 3: Manual Entry with Document Attachment
1. Click **"Add New Law"** button
2. Scroll down to manual entry section
3. Fill in all fields manually
4. Optionally attach document for reference
5. Submit to create law

## 📁 File Structure

### Frontend Components

```
components/
├── DocumentAnalysisModal.tsx    # Main upload modal for analysis
├── DocumentUpload.tsx            # Drag & drop upload component
├── DocumentViewer.tsx            # Preview/view uploaded documents
├── AddLawModal.tsx               # Updated with auto-fill option
└── DashboardHeader.tsx           # Updated with quick upload button
```

### API Endpoints

```
pages/api/
├── analyze-document.ts           # Document analysis endpoint (TODO: implement)
└── laws/
    ├── index.ts                  # CRUD operations for laws
    └── [lawId].ts                # Individual law operations
```

## 🔧 Frontend Implementation

### DocumentAnalysisModal Component

**Purpose**: Primary upload interface for document analysis

**Features**:
- ✅ Drag & drop file upload
- ✅ File type validation (HTML, PDF, TXT, DOC, DOCX)
- ✅ File size validation (max 10MB)
- ✅ Visual upload progress
- ✅ Error handling and user feedback
- ✅ Ready for backend integration

**Props**:
```typescript
interface DocumentAnalysisModalProps {
  onClose: () => void;
  onAnalysisComplete: (data: any) => void;
}
```

**Data Flow**:
```typescript
// Document is prepared and sent to backend
const analysisData = {
  filename: file.name,
  content: file.text(), // Full document content
  contentType: file.type,
  size: file.size,
  uploadedAt: new Date().toISOString(),
};

// TODO: Backend integration
// const response = await fetch('/api/analyze-document', {
//   method: 'POST',
//   body: JSON.stringify(analysisData)
// });
```

### Integration Points

**Dashboard (pages/index.tsx)**:
```typescript
const handleAnalysisComplete = (data: any) => {
  // When backend is ready, this receives:
  // - Extracted law data (jurisdiction, sector, impact, etc.)
  // - Affected stocks with impact scores
  // - Document metadata
  
  // Auto-create law with extracted data
  // Show success notification
};
```

**Add Law Modal**:
- Prominent "Auto-fill from Document" section
- Visual distinction from manual entry
- Guides users to use analysis feature

## 🚀 Backend Implementation Guide

### API Endpoint: `/api/analyze-document`

**Status**: Placeholder created, needs implementation

**Request Format**:
```typescript
POST /api/analyze-document
Content-Type: application/json

{
  "filename": "clean-energy-act-2024.html",
  "content": "<!DOCTYPE html>...",
  "contentType": "text/html",
  "size": 45678,
  "uploadedAt": "2025-11-02T10:30:00.000Z"
}
```

**Expected Response**:
```typescript
{
  "success": true,
  "lawData": {
    "lawId": "Clean_Energy_Act_2024",
    "jurisdiction": "United States",
    "status": "Active",
    "sector": "Clean Energy",
    "impact": 8,
    "confidence": "High",
    "published": "2024-01-15",
    "affected": 5,
    "stocks_impacted": {
      "STOCK_IMPACTED": [
        {
          "ticker": "TSLA",
          "company_name": "Tesla Inc.",
          "sector": "Clean Energy",
          "impact_score": 9,
          "correlation_confidence": "High",
          "notes": "Direct beneficiary of EV subsidies"
        }
        // ... more stocks
      ]
    },
    "document": {
      "filename": "clean-energy-act-2024.html",
      "content": "...",
      "contentType": "text/html",
      "uploadedAt": "2025-11-02T10:30:00.000Z"
    }
  },
  "processingTime": 3500
}
```

### Implementation Steps

#### 1. Document Parsing

Install dependencies:
```bash
npm install pdf-parse mammoth cheerio
```

Parse different formats:
```typescript
// HTML
import * as cheerio from 'cheerio';
const $ = cheerio.load(content);
const text = $('body').text();

// PDF
import pdfParse from 'pdf-parse';
const data = await pdfParse(buffer);
const text = data.text;

// DOCX
import mammoth from 'mammoth';
const result = await mammoth.extractRawText({ buffer });
const text = result.value;
```

#### 2. LLM Integration

Install OpenAI or other LLM:
```bash
npm install openai
```

Example extraction:
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "system",
      content: `You are a legal and financial analysis expert. Extract structured data from law documents.
      
      Return JSON with this exact format:
      {
        "lawId": "string",
        "jurisdiction": "string",
        "sector": "Clean Energy|Technology|Healthcare|Finance|Manufacturing",
        "status": "Active|Pending|Expired",
        "impact": 0-10,
        "confidence": "High|Medium|Low",
        "published": "YYYY-MM-DD",
        "affectedStocks": [
          {
            "ticker": "string",
            "companyName": "string",
            "impactScore": 0-10,
            "confidence": "High|Medium|Low",
            "reasoning": "string"
          }
        ]
      }`
    },
    {
      role: "user",
      content: `Analyze this law document:\n\n${documentText}`
    }
  ],
  response_format: { type: "json_object" }
});

const extractedData = JSON.parse(completion.choices[0].message.content);
```

#### 3. Stock Database Integration

Query stocks by sector and keywords:
```typescript
// Example with your stock database
const affectedStocks = await queryStocksBySector(extractedData.sector);

// Filter and score based on law content
const scoredStocks = affectedStocks.map(stock => ({
  ...stock,
  impact_score: calculateImpact(lawContent, stock),
  correlation_confidence: assessConfidence(lawContent, stock)
}));
```

#### 4. Error Handling

```typescript
try {
  // Process document
} catch (error) {
  if (error.code === 'PARSE_ERROR') {
    return {
      success: false,
      error: 'Could not parse document format',
      suggestion: 'Try converting to HTML or TXT'
    };
  }
  
  if (error.code === 'LLM_TIMEOUT') {
    return {
      success: false,
      error: 'Analysis timed out',
      suggestion: 'Document may be too large'
    };
  }
  
  // Generic error
  return {
    success: false,
    error: 'Processing failed',
    suggestion: 'Please try again or enter manually'
  };
}
```

### Environment Variables

Create `.env.local`:
```env
# LLM API Keys
OPENAI_API_KEY=sk-...
# Or use other providers:
# ANTHROPIC_API_KEY=...
# GOOGLE_AI_KEY=...

# Database (if needed)
DATABASE_URL=postgresql://...

# Optional: External APIs
STOCK_API_KEY=...
FINANCIAL_DATA_API_KEY=...
```

## 🎨 UI/UX Features

### Visual Feedback
- ✅ Drag & drop with hover states
- ✅ Upload progress indicator
- ✅ Processing animation
- ✅ Success/error messages
- ✅ File preview

### User Guidance
- ✅ Clear call-to-action buttons
- ✅ Explanatory text for each option
- ✅ Visual hierarchy (AI analysis highlighted)
- ✅ File format and size restrictions shown
- ✅ "Or enter manually" divider

### Error States
- ✅ Invalid file type warning
- ✅ File too large warning
- ✅ Upload failure handling
- ✅ Processing timeout handling
- ✅ Suggestions for resolution

## 🔄 Data Flow

```
User uploads document
        ↓
Frontend validates file
        ↓
Document sent to /api/analyze-document
        ↓
Backend parses document content
        ↓
LLM extracts structured data
        ↓
Stock database queried for matches
        ↓
Impact scores calculated
        ↓
Response sent to frontend
        ↓
Law auto-created with extracted data
        ↓
Dashboard refreshed with new law
```

## ✅ Testing Checklist

### Frontend (Already Working)
- [x] Upload modal opens and closes
- [x] Drag & drop functionality
- [x] File type validation
- [x] File size validation
- [x] Upload button disabled when no file
- [x] Processing state shown
- [x] Error messages display correctly
- [x] Integration with Add Law Modal

### Backend (TODO)
- [ ] API endpoint receives POST requests
- [ ] Document content parsed correctly
- [ ] LLM extraction returns valid JSON
- [ ] Stock matching logic works
- [ ] Impact scores are reasonable
- [ ] Error cases handled gracefully
- [ ] Response time acceptable (<10s)
- [ ] Large documents handled

## 📊 Sample Test Documents

Create test documents for validation:

**1. Clean Energy Law (HTML)**
```html
<!DOCTYPE html>
<html>
<head><title>Clean Energy Act 2024</title></head>
<body>
  <h1>Clean Energy Advancement Act 2024</h1>
  <p>Effective Date: January 15, 2024</p>
  <p>Jurisdiction: United States</p>
  <p>This act provides $50B in subsidies for electric vehicle manufacturers...</p>
</body>
</html>
```

**2. Financial Regulation (TXT)**
```
FINANCIAL REFORM ACT 2024

Jurisdiction: European Union
Status: Active
Effective: March 1, 2024

This regulation requires all financial institutions to increase capital reserves...
Affects: Banking sector, FinTech companies
```

## 🚦 Next Steps

### Immediate (Frontend - Complete ✅)
- [x] Create upload modal
- [x] Add drag & drop functionality
- [x] Integrate with dashboard
- [x] Add to new law modal
- [x] Error handling
- [x] User guidance

### Backend Implementation (TODO)
1. Choose LLM provider (OpenAI, Anthropic, etc.)
2. Implement document parsing
3. Create extraction prompts
4. Build stock matching logic
5. Calculate impact scores
6. Test with sample documents
7. Add error handling
8. Optimize performance

### Future Enhancements
- [ ] Batch document processing
- [ ] Document comparison
- [ ] Historical analysis
- [ ] Export analysis reports
- [ ] Multi-language support
- [ ] Custom extraction rules

## 🎓 Usage Examples

### For Users
```
"I have a new law document in HTML format. 
Just click 'Quick Upload & Analyze' and drag it in. 
The system will automatically extract all the details!"
```

### For Developers
```typescript
// Backend implementation example
const result = await analyzeDocument({
  content: documentText,
  options: {
    extractStocks: true,
    calculateImpact: true,
    maxStocks: 10
  }
});
```

## 📝 Notes

- Frontend is fully functional and ready
- Backend endpoint is a placeholder with detailed implementation guide
- System designed for easy integration
- All TODO comments marked in code
- Error states handled gracefully
- User experience optimized for quick uploads
