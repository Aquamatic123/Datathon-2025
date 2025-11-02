# AWS SageMaker Integration Setup

This document explains how to configure and use the AWS SageMaker LLM integration for parsing legal directives.

## Prerequisites

1. **AWS Account** with SageMaker access
2. **SageMaker Endpoint** deployed (e.g., Qwen model from AWS Marketplace)
3. **AWS Credentials** configured on your machine

## Configuration

### 1. Set up AWS Credentials

Make sure you have AWS credentials configured. You can do this via:

**Option A: AWS CLI Configuration**
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key  
- Default region (e.g., `us-west-2`)

**Option B: Environment Variables**
Create a `.env` file in the `backend/` directory:
```bash
cp .env.example .env
```

Edit `.env` and add:
```env
# SageMaker Configuration
SAGEMAKER_ENDPOINT_NAME=endpoint-quick-start-85saw
AWS_REGION=us-west-2

# Optional: If not using AWS CLI default profile
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

### 2. Install Dependencies

```bash
cd backend
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install boto3
```

Or reinstall all requirements:
```bash
pip install -r requirements.txt
```

### 3. Update SageMaker Endpoint Name

If your SageMaker endpoint has a different name, update it in `.env`:
```env
SAGEMAKER_ENDPOINT_NAME=your-endpoint-name-here
```

## How It Works

### Architecture Flow

```
User uploads document
        ↓
Frontend (Next.js)
        ↓
Backend API (/api/analyze-document)
        ↓
1. DocumentProcessor extracts text from HTML/PDF/DOCX
        ↓
2. SageMakerParser sends text to AWS SageMaker
        ↓
3. LLM analyzes directive and returns structured JSON
        ↓
4. API returns law data to frontend
        ↓
Frontend creates law in database
```

### SageMaker Parser

The `sagemaker_parser.py` module:

1. **Extracts text** from the directive document
2. **Creates a structured prompt** asking the LLM to extract:
   - Law ID
   - Title
   - Jurisdiction
   - Sector
   - Impact Score (1-10)
   - Compliance Cost
   - Affected Stocks
   - Summary
   - Key Provisions
   - Effective Date
   - Compliance Deadline

3. **Sends to SageMaker** endpoint via boto3
4. **Parses JSON response** from the LLM
5. **Returns structured law data** to the API

### Customizing the Prompt

Edit `backend/sagemaker_parser.py` in the `_create_parsing_prompt()` method to:
- Add more fields to extract
- Change the output format
- Adjust the analysis instructions
- Modify temperature/token settings

## Testing

### 1. Start the Backend

```bash
cd backend
python3 api_server.py
```

You should see:
```
🚀 Document Text Extraction API
Port: 5000
Endpoint: http://localhost:5000/api/analyze-document
```

### 2. Test with a Sample Directive

Upload an HTML directive file through the frontend UI:
1. Start frontend: `npm run dev`
2. Click "Upload & Analyze Document"
3. Upload a directive HTML file
4. Wait for AI analysis (this may take 10-30 seconds)

The backend will log:
```
Extracting text from directive.html...
Extracted 15234 characters
Parsing directive with SageMaker LLM...
Successfully parsed law: EU-2024-1234
```

### 3. Check the Output

The frontend will show:
- Law created successfully with parsed data
- Impact score, sector, compliance cost
- All extracted fields populated

## Troubleshooting

### Error: "SageMaker parsing failed"

**Possible causes:**
1. **Endpoint not found**: Check your endpoint name in `.env`
2. **AWS credentials invalid**: Run `aws sts get-caller-identity` to verify
3. **Wrong region**: Verify endpoint region matches `AWS_REGION` in `.env`
4. **Endpoint not active**: Check SageMaker console that endpoint is "InService"

**Fix:**
```bash
# Verify AWS credentials
aws sts get-caller-identity

# List your SageMaker endpoints
aws sagemaker list-endpoints --region us-west-2

# Check endpoint status
aws sagemaker describe-endpoint --endpoint-name your-endpoint-name --region us-west-2
```

### Error: "Failed to parse LLM response as JSON"

The LLM might be returning text before/after the JSON. The parser tries to handle this, but if it fails:

1. Check the console logs for the raw LLM output
2. Adjust the prompt in `_create_parsing_prompt()` to be more explicit
3. Lower the temperature (more deterministic): Change `temperature: 0.3` to `0.1`
4. Increase `max_new_tokens` if response is being cut off

### Performance Issues

**Slow response times:**
- SageMaker inference can take 10-30 seconds depending on model size
- Consider using a smaller model or increasing endpoint instance count
- Frontend shows "Analyzing with AI..." spinner during this time

**Rate limits:**
- Check your SageMaker quotas in AWS console
- Consider implementing request queuing for high volume

## Cost Considerations

AWS SageMaker endpoint costs include:
- **Hourly instance costs** while endpoint is running
- **Inference costs** per request
- **Data transfer costs** (usually minimal)

**To reduce costs:**
1. Stop the endpoint when not in use
2. Use smaller instance types (ml.g4dn.xlarge vs ml.g5.12xlarge)
3. Enable auto-scaling to scale down during idle periods

## Alternative: Use Different LLM

To use a different LLM service (OpenAI, Anthropic, etc.):

1. Edit `sagemaker_parser.py`
2. Replace the `invoke_endpoint()` call with your provider's API
3. Update requirements.txt with the provider's SDK
4. Adjust the prompt format for that model

Example for OpenAI:
```python
import openai
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt}]
)
```

## Support

- AWS SageMaker Docs: https://docs.aws.amazon.com/sagemaker/
- Boto3 SageMaker Docs: https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/sagemaker-runtime.html
- AWS Marketplace Models: https://aws.amazon.com/marketplace/search/results?filters=FulfillmentOptionType&FulfillmentOptionType=SageMaker
