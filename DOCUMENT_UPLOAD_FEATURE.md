# 📄 AI-Powered Document Upload Feature

## Overview

Your app now includes an AI-powered document upload feature that:
1. **Accepts documents** in multiple formats (PDF, HTML, XML, TXT)
2. **Parses** the document to extract text
3. **Analyzes** the text using your AWS SageMaker AI model
4. **Extracts** law information automatically
5. **Creates** the law in Aurora DSQL database

---

## How It Works

### User Flow:
1. Click "Upload Document" button in dashboard
2. Drag & drop or select a file (PDF, HTML, XML, or TXT)
3. Click "Upload & Extract"
4. **AI processes the document** → extracts law information
5. **Law automatically created** in Aurora DSQL
6. Dashboard refreshes to show the new law

### Technical Flow:
```
Document File
    ↓
Parse to Text (cheerio/pdf-parse)
    ↓
Send to SageMaker AI Model
    ↓
AI Extracts Law Fields
    ↓
Validate & Format Data
    ↓
Insert into Aurora DSQL (laws table)
    ↓
Return Success to User
```

---

## Supported File Formats

| Format | Extension | Parser Used |
|--------|-----------|-------------|
| **PDF** | `.pdf` | `pdf-parse` |
| **HTML** | `.html`, `.htm` | `cheerio` (extracts text, removes tags) |
| **XML** | `.xml` | `cheerio` (XML mode) |
| **Plain Text** | `.txt`, `.text` | Native buffer reading |

**Max file size:** 10MB

---

## AI Model Configuration

### SageMaker Endpoint
- **Endpoint Name:** `endpoint-quick-start-85saw`
- **Region:** `us-west-2`
- **Model Type:** Qwen (text generation)

### What the AI Extracts

The AI model analyzes the document and extracts:

| Field | Type | Description |
|-------|------|-------------|
| `lawId` | string | Auto-generated unique ID (e.g., "Law_2024_ABC123") |
| `jurisdiction` | string | Geographic jurisdiction (e.g., "United States") |
| `status` | string | Must be: "Active", "Pending", or "Expired" |
| `sector` | string | Industry sector (e.g., "Technology", "Healthcare") |
| `impact` | number | Market impact score (0-10) |
| `confidence` | string | Must be: "High", "Medium", or "Low" |
| `published` | string | Publication date (YYYY-MM-DD) |
| `summary` | string | Brief summary of the law |

---

## Environment Variables Required

### For AWS Amplify, add these 6 variables:

**Basic Aurora DSQL (required):**
1. `AURORA_DSQL_ENDPOINT` = `dbtjczatkd7mblohlvaxccqpg4.dsql.us-west-2.on.aws`
2. `APP_REGION` = `us-west-2`
3. `DATABASE_NAME` = `postgres`
4. `APP_ACCESS_KEY_ID` = `AKIA6ODVAJ2DK6HO7M6I` (SECRET)
5. `APP_SECRET_ACCESS_KEY` = `[your-secret-key]` (SECRET)

**AI Document Upload (optional):**
6. `SAGEMAKER_ENDPOINT_NAME` = `endpoint-quick-start-85saw`

**Note:** If you don't set the SageMaker endpoint, the upload feature will still work but will use fallback values instead of AI extraction.

---

## Files Created

### Backend:
- **`lib/document-parser.ts`** - Parses PDF, HTML, XML, TXT files
- **`lib/sagemaker-client.ts`** - Integrates with AWS SageMaker
- **`pages/api/upload-document.ts`** - API endpoint for file upload

### Frontend:
- **`components/UploadDocumentModal.tsx`** - Drag & drop upload UI
- **Updated `components/DashboardHeader.tsx`** - Added "Upload Document" button
- **Updated `pages/index.tsx`** - Integrated upload modal

### Configuration:
- **Updated `next.config.js`** - Added SAGEMAKER_ENDPOINT_NAME to env vars
- **Updated `package.json`** - Added dependencies:
  - `@aws-sdk/client-sagemaker-runtime` - SageMaker client
  - `formidable` - File upload handling
  - `pdf-parse` - PDF parsing
  - `cheerio` - HTML/XML parsing

---

## Usage Examples

### Example 1: Upload HTML Law Document

**Document content (example.html):**
```html
<html>
<body>
  <h1>Clean Energy Act 2024</h1>
  <p>Jurisdiction: United States</p>
  <p>Status: Active</p>
  <p>This act promotes renewable energy adoption through tax incentives...</p>
  <p>Published: January 15, 2024</p>
</body>
</html>
```

**AI extracts:**
```json
{
  "lawId": "Law_2024_CLEAN",
  "jurisdiction": "United States",
  "status": "Active",
  "sector": "Clean Energy",
  "impact": 8,
  "confidence": "High",
  "published": "2024-01-15"
}
```

**Result:** New law created in Aurora DSQL automatically!

### Example 2: Upload PDF Regulation

Upload a PDF containing regulatory text. The system:
1. Extracts text from all pages
2. Sends to SageMaker AI
3. AI analyzes and extracts key information
4. Creates law with extracted data

### Example 3: Test via cURL

```bash
curl -X POST http://localhost:3000/api/upload-document \
  -F "file=@path/to/your/document.pdf"
```

---

## Testing the Feature

### Step 1: Add SageMaker Endpoint to .env.local

```env
SAGEMAKER_ENDPOINT_NAME=endpoint-quick-start-85saw
```

### Step 2: Test Locally

1. Start app: `npm run dev`
2. Open: `http://localhost:3000`
3. Click "Upload Document" button
4. Drop a test file or click to browse
5. Click "Upload & Extract"
6. Watch console logs for AI processing
7. New law appears in dashboard!

### Step 3: Check Console Logs

You'll see:
```
📤 Document Upload & AI Extraction
📄 File received: example.pdf
  - Size: 45231 bytes
  - Type: application/pdf
✓ Parsed PDF file, 5 pages, 2341 chars
🤖 Sending document to SageMaker for analysis...
✓ Received response from SageMaker
🔍 Parsing AI response...
✓ Extracted law data: {...}
💾 Creating law in Aurora DSQL...
✅ Law created successfully!
```

---

## API Endpoints

### POST /api/upload-document

**Request:**
- Content-Type: `multipart/form-data`
- Body: File upload (field name: `file`)

**Response (Success):**
```json
{
  "success": true,
  "message": "Document processed and law created successfully",
  "data": {
    "lawId": "Law_2024_ABC123",
    "extractedData": {
      "jurisdiction": "United States",
      "status": "Active",
      "sector": "Technology",
      "impact": 8,
      "confidence": "High",
      "published": "2024-03-15",
      "summary": "..."
    },
    "createdLaw": { ... },
    "documentInfo": {
      "filename": "document.pdf",
      "size": 45231,
      "textLength": 2341
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "AI extraction failed: ...",
  "details": "..."
}
```

---

## Customizing the AI Prompt

The AI prompt is in `lib/sagemaker-client.ts`. You can customize it to extract different fields or change the format:

```typescript
const prompt = `You are a legal document analyzer. Extract the following information...

{
  "lawId": "...",
  "jurisdiction": "...",
  // Add more fields here
}

Document text:
${documentText}

Return ONLY the JSON object:`;
```

---

## Validation & Fallbacks

### Automatic Validation:
- **Status:** If AI returns invalid status, defaults to "Pending"
- **Confidence:** If invalid, defaults to "Medium"
- **Impact:** If invalid or out of range, defaults to 5
- **Date:** If missing, uses current date

### Fallback Behavior:
If AI extraction fails entirely:
- Creates law with safe default values
- Uses document text as summary
- Generates random lawId
- Sets confidence to "Low"

---

## IAM Permissions Required

Your AWS credentials need these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dsql:DbConnect",
        "dsql:DbConnectAdmin"
      ],
      "Resource": "arn:aws:dsql:*:*:cluster/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sagemaker:InvokeEndpoint"
      ],
      "Resource": "arn:aws:sagemaker:us-west-2:*:endpoint/endpoint-quick-start-85saw"
    }
  ]
}
```

---

## Troubleshooting

### "SageMaker endpoint not found"
**Solution:** 
- Check `SAGEMAKER_ENDPOINT_NAME` environment variable
- Verify endpoint exists in AWS SageMaker console
- Ensure endpoint is in the same region as APP_REGION

### "Permission denied"
**Solution:**
- Add `sagemaker:InvokeEndpoint` permission to your IAM user/role
- Verify credentials have access to the SageMaker endpoint

### "Cannot parse document"
**Solution:**
- Check file format is supported (PDF, HTML, XML, TXT)
- Verify file isn't corrupted
- Check file size (must be under 10MB)

### "AI extraction failed"
**Solution:**
- Check SageMaker endpoint is running (not stopped)
- Verify endpoint name is correct
- Check CloudWatch logs for SageMaker errors

---

## Cost Considerations

### SageMaker Endpoint:
- **Instance type:** Varies by your endpoint
- **Cost:** ~$0.05-0.50 per invocation depending on instance
- **Consider:** Use serverless inference for lower cost

### Alternative: Use AWS Bedrock
If you want to reduce costs, you can swap SageMaker for Bedrock:
- Pay per token instead of per instance
- No endpoint to manage
- Similar API

---

## Future Enhancements

Possible improvements:
- [ ] Add support for DOCX files
- [ ] Extract related stocks from document
- [ ] Batch upload multiple documents
- [ ] Preview extracted data before creating law
- [ ] Edit AI-extracted data before saving
- [ ] Support more AI models (Claude, GPT, etc.)

---

## 🎉 Feature Complete!

Your app now has:
- ✅ Manual law creation
- ✅ AI-powered document upload
- ✅ Multi-format document parsing
- ✅ Automatic data extraction
- ✅ Direct database integration

Upload any legal document and let AI do the work! 🤖

