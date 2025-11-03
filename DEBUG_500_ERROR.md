# 🔍 Debugging 500 Error on AWS Amplify

## ❌ Current Error
```
✗ Upload failed: Server returned HTML instead of JSON. Check server logs. Status: 500
```

This means the API endpoint is returning a 500 error. The endpoint IS being reached, but something is failing on the server.

---

## ✅ Fixes Applied

### 1. **Global Error Handler**
Added a two-level try-catch to catch ALL errors and ALWAYS return JSON:

```typescript
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Outer try-catch
    try {
      // All API logic here
    } catch (error) {
      // Return JSON error
    }
  } catch (unexpectedError) {
    // Catch even Next.js errors
    // ALWAYS return JSON
  }
}
```

### 2. **Lambda Compatibility**
- Uses `/tmp` directory on Lambda (auto-detected)
- Enhanced logging for CloudWatch

### 3. **Better Error Details**
Now returns detailed error info:
- Error message
- Error type
- Stack trace (in logs)
- Hint to check CloudWatch

---

## 🔍 **NEXT STEP: Check CloudWatch Logs**

You MUST check the CloudWatch logs to see the actual error message. Here's how:

### Step 1: Go to CloudWatch
1. Open **AWS Amplify Console**
2. Click on your app
3. Click on the failed build/deployment
4. Click **"Monitoring"** in the left sidebar
5. Click **"View logs in CloudWatch"**

### Step 2: Find the Upload API Logs
Look for logs from `/api/upload-document`

### Step 3: Look for These Messages

**Look for the START of the request:**
```
========================================
📤 Document Upload & AI Extraction
📍 Environment: production
📍 Lambda: YES
📍 AWS Region: us-west-2
========================================
```

**Then look for WHERE it fails:**

**Scenario A: Formidable Error (File Upload)**
```
📦 Initializing formidable...
📦 Parsing multipart form data...
❌ Formidable parse error: [ERROR MESSAGE HERE]
```

**Scenario B: Document Parsing Error**
```
📄 File received: example.html
📄 Parsing document: example.html (type: html)
✗ Error parsing example.html: [ERROR MESSAGE HERE]
```

**Scenario C: AI Extraction Error**
```
🤖 Starting AI extraction (4 focused API calls)...
📞 Call 1: Jurisdiction & Status...
❌ [SageMaker error message]
```

**Scenario D: Database Error**
```
💾 Creating law in Aurora DSQL...
❌ [Database error message]
```

**Scenario E: Unexpected Error**
```
🔥 UNEXPECTED ERROR (Global Handler)
Error: [ERROR MESSAGE HERE]
```

---

## 🎯 Common Causes & Solutions

### Issue 1: "SAGEMAKER_ENDPOINT_NAME not set"
**Cause**: Environment variable missing in Amplify Console  
**Solution**: Add `SAGEMAKER_ENDPOINT_NAME` in Amplify Console → Environment variables  
**Value**: `endpoint-quick-start-85saw`

### Issue 2: "AURORA_DSQL_ENDPOINT not set"
**Cause**: Environment variable missing  
**Solution**: Add all 6 environment variables in Amplify Console  
**Reference**: Check `ENV_VAR_CHANGES_SUMMARY.md`

### Issue 3: "getaddrinfo ENOTFOUND"
**Cause**: Database endpoint is incorrect  
**Solution**: Verify `AURORA_DSQL_ENDPOINT` is JUST the hostname (no protocol, no query params)  
**Example**: `dbtjczatkd7mblohlvaxccqpg4.dsql.us-west-2.on.aws`

### Issue 4: "not authorized to perform: sagemaker:InvokeEndpoint"
**Cause**: IAM permissions missing  
**Solution**: Add `sagemaker:InvokeEndpoint` permission to your IAM user  

### Issue 5: "ENOENT: no such file or directory, open '/tmp/...'"
**Cause**: File path issue on Lambda  
**Solution**: Already fixed - now uses `/tmp` directory  
**Check logs for**: "📍 Lambda: YES"

### Issue 6: "File upload error: maxFileSize exceeded"
**Cause**: File is larger than 10MB  
**Solution**: Use a smaller file for testing

---

## 📋 What to Share for Debugging

If you need help debugging, share:

1. **CloudWatch log excerpt** showing:
   - The "📤 Document Upload" header
   - The error message
   - The stack trace

2. **Environment variables status** (from logs):
   ```
   📍 Environment: production
   📍 Lambda: YES/NO
   📍 AWS Region: us-west-2
   ```

3. **File details**:
   - File type (HTML, PDF, TXT, XML)
   - File size
   - First few lines of content

---

## 🚀 Quick Deploy

The latest fixes are ready:

```bash
# 1. Build locally
npm run build  # ✅ Compiles successfully

# 2. Commit and push
git add .
git commit -m "Fix: Enhanced error handling for file uploads"
git push origin main

# 3. Check CloudWatch logs after deployment
```

---

## 🧪 Test Locally First

Before deploying, test locally:

```bash
npm run dev

# Open http://localhost:3000
# Try uploading a file
# Check terminal logs for errors
```

If it works locally but fails on Amplify, the issue is likely:
- Missing environment variables
- IAM permissions
- Lambda-specific issue (file paths, timeouts, etc.)

---

## 📊 Build Status

```
✓ Compiled successfully
✓ All API routes compiled
✓ No TypeScript errors
```

**Status**: ✅ **Code is ready** - Need to check CloudWatch logs to identify the specific error

---

## 🎯 Action Items

1. **Deploy the latest fixes**:
   ```bash
   git push origin main
   ```

2. **Try uploading a file**

3. **If it fails, check CloudWatch logs immediately**

4. **Find the error message in logs**

5. **Share the specific error for targeted help**

---

The enhanced logging will now show you EXACTLY where and why the upload is failing! 🔍

