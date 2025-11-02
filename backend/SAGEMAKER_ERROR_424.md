# SageMaker Error 424 - Troubleshooting Guide

## Error Message
```
SageMaker parsing failed: An error occurred (ModelError) when calling the InvokeEndpoint operation: 
Received client error (424) from primary with message "{"error":"exception occurred during rolling batch inference","code":424}"
```

## What This Means
Error 424 is a **Model Error** from SageMaker, which typically means:
1. **Input too large** - The document text exceeded the model's token limit
2. **Prompt format issue** - The model couldn't process the request format
3. **Model timeout** - Processing took too long
4. **Memory issue** - The model ran out of memory

## Fixes Applied

### 1. **Text Truncation**
- Limits input text to **15,000 characters** (≈4,000 tokens)
- Long documents are truncated before sending to SageMaker
- Warning message shown when truncation occurs

### 2. **Optimized Prompt**
- **Reduced prompt length** from verbose instructions to concise format
- Changed from long example to compact JSON example
- Only sends first 3,000 chars of document in prompt
- Total prompt now much shorter

### 3. **Reduced Token Generation**
- `max_new_tokens`: Reduced from 2048 → **1024**
- Added `do_sample: False` for deterministic output
- Faster processing, less memory usage

### 4. **Fallback Mechanism**
- If SageMaker fails with 424 error, uses **fallback parser**
- Extracts basic info from text (title, jurisdiction, sector)
- Creates law entry with "Pending Review" status
- Allows you to manually edit later

### 5. **Better Logging**
- Shows prompt length before sending
- Logs when response received
- Clear error messages

## How It Works Now

### Normal Flow (SageMaker works):
```
Upload → Extract text → Truncate if needed → Send to SageMaker → Parse JSON → Create law
```

### Fallback Flow (SageMaker fails with 424):
```
Upload → Extract text → SageMaker error → Fallback parser → Basic analysis → Create law (for manual review)
```

## Testing

### If you still get 424 errors:

**Option 1: Use smaller documents**
- Try files under 50KB
- Split large directives into sections

**Option 2: Further reduce input**
Change in `sagemaker_parser.py`:
```python
max_text_length = 10000  # Reduce from 15000
```

**Option 3: Use even shorter prompt**
Change in `_create_parsing_prompt()`:
```python
{extracted_text[:2000]}  # Reduce from 3000
```

## Fallback Law Data Format

When fallback is used, you'll get:
```json
{
  "lawId": "LAW-filename",
  "title": "Extracted from first line",
  "jurisdiction": "EU" or "US" (detected from text),
  "status": "Pending Review",  // ← Indicates needs manual editing
  "sector": "Detected sector or General",
  "impact": 5,
  "confidence": "Low",  // ← Low because it's automated extraction
  "affected": 0,
  "stocks_impacted": []  // ← Empty, you can add manually
}
```

## Manual Editing

After fallback creates the law:
1. Law appears in dashboard with "Pending Review" status
2. Click the law to view details
3. Manually edit fields as needed
4. Add affected stocks
5. Change status to "Active"

## CloudWatch Logs

To see detailed SageMaker errors:
https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2#logEventViewer:group=/aws/sagemaker/Endpoints/endpoint-quick-start-85saw

Look for:
- Token limit errors
- Out of memory errors
- Request timeout errors

## Alternative: Skip SageMaker

If SageMaker continues to fail, you can:
1. Use fallback mode (already implemented)
2. Or disable SageMaker entirely and use rule-based parsing
3. Or switch to a different LLM (OpenAI, Claude, etc.)

## Success Indicators

Backend logs will show:
```
📤 Sending request to SageMaker (prompt length: 3500 chars)...
📥 Received response from SageMaker
Successfully parsed law: EU-2024-1234
```

Or if fallback:
```
❌ Error calling SageMaker endpoint: ModelError...
⚠️  Model error detected - using fallback parsing
🔄 Creating fallback law data from text analysis...
```
