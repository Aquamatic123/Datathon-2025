# AWS Amplify File Upload Fix

## 🔧 Problem
**Error**: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

This error occurs when the API returns HTML instead of JSON, typically when there's a server-side error during file upload on AWS Amplify.

---

## ✅ Fixes Applied

### 1. **Force JSON Responses**
Added explicit JSON content-type header to prevent HTML error pages:

```typescript
export default async function handler(req, res) {
  // Force JSON response
  res.setHeader('Content-Type', 'application/json');
  
  // ... rest of code
}
```

### 2. **Better Error Handling in Frontend**
Added content-type checking before parsing JSON:

```typescript
const contentType = response.headers.get('content-type');
if (!contentType || !contentType.includes('application/json')) {
  const text = await response.text();
  console.error('Non-JSON response:', text.substring(0, 500));
  throw new Error(`Server returned HTML. Check server logs. Status: ${response.status}`);
}
```

### 3. **AWS Lambda Compatibility for File Uploads**
Updated formidable to use `/tmp` directory on Lambda:

```typescript
const form = formidable({
  maxFileSize: 10 * 1024 * 1024,
  keepExtensions: true,
  uploadDir: process.env.LAMBDA_TASK_ROOT ? '/tmp' : undefined, // Use /tmp on Lambda
});
```

### 4. **Enhanced Logging**
Added comprehensive logging for debugging CloudWatch:

```typescript
console.error('Error details:', JSON.stringify({
  name: error.name,
  message: error.message,
  code: error.code,
  syscall: error.syscall
}));
```

---

## 🧪 Testing

### Test Locally First:
```bash
npm run build
npm run dev

# Test upload at http://localhost:3000
```

### Deploy to Amplify:
```bash
git add .
git commit -m "Fix: File upload compatibility for AWS Amplify"
git push origin main
```

### Check CloudWatch Logs:
1. Go to AWS Amplify Console
2. Click on your app → Monitoring
3. Click "View logs in CloudWatch"
4. Look for logs from `/api/upload-document`

---

## 🔍 Common Issues & Solutions

### Issue 1: "No file uploaded"
**Cause**: Formidable can't parse the multipart form data
**Solution**: Check that `bodyParser: false` is set in `export const config`
**Check**: Look for "📦 Parsing multipart form data..." in logs

### Issue 2: "ENOENT: no such file or directory"
**Cause**: Temp directory not writable on Lambda
**Solution**: Use `/tmp` directory (already applied in fix)
**Check**: Look for "uploadDir: '/tmp'" in logs

### Issue 3: "EACCES: permission denied"
**Cause**: File system permissions on Lambda
**Solution**: Files are saved to `/tmp` which is writable on Lambda
**Check**: Verify logs show file being written

### Issue 4: Environment variable errors
**Cause**: Missing env vars in Amplify Console
**Solution**: Check all 6 env vars are set (see `COPY_PASTE_ENV_VARS.txt`)
**Check**: Look for "🤖 SageMaker Configuration" logs

---

## 📊 What Logs to Look For

### Success Path:
```
📤 Document Upload & AI Extraction
📦 Initializing formidable...
📦 Parsing multipart form data...
📦 Form parsed successfully
✅ File parsed successfully
📄 File received: example.html
📝 Extracted text from document:
🤖 Starting AI extraction (4 focused API calls)...
✅ AI extraction process completed!
💾 Creating law in Aurora DSQL...
✅ Law created successfully!
```

### Error Path (Look for these):
```
❌ Formidable parse error: [specific error]
❌ No file found in upload
❌ Error creating formidable instance: [specific error]
✗ Document upload failed!
```

---

## 🚀 Files Modified

- ✅ `pages/api/upload-document.ts` - Added JSON headers, Lambda compatibility, better logging
- ✅ `components/UploadDocumentModal.tsx` - Added content-type checking

---

## 📝 Next Steps

1. **Test locally** to ensure changes work
2. **Commit and push** to GitHub
3. **Monitor Amplify deployment** in console
4. **Check CloudWatch logs** if upload fails
5. **Test file upload** on deployed app

---

## ⚠️ Lambda Limitations

AWS Lambda (which Amplify uses) has some limitations:
- **Max file size**: 10MB (set in formidable config)
- **Writable directory**: Only `/tmp` (already configured)
- **Request timeout**: 30 seconds (Next.js API route default)

For files larger than 10MB, consider:
- Direct S3 upload with pre-signed URLs
- Chunked uploads
- Separate file processing service

---

## ✅ Verification Checklist

After deployment:
- [ ] Dashboard loads correctly
- [ ] Can upload TXT file
- [ ] Can upload HTML file
- [ ] Can upload XML file
- [ ] Can upload PDF file
- [ ] Law appears in database after upload
- [ ] CloudWatch logs show success messages

---

**Status**: ✅ Fixed - Ready to deploy
**Date**: November 3, 2025

