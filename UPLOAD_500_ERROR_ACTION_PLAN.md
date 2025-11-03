# 🎯 Action Plan: Fix File Upload 500 Error

## 📊 Current Status

**Error**: `✗ Upload failed: Server returned HTML instead of JSON. Check server logs. Status: 500`

**What this means**: 
- ✅ The API endpoint IS being reached
- ✅ Our code improvements are working (better error message)
- ❌ Something is failing on the server-side
- 🔍 **WE NEED CLOUDWATCH LOGS** to see the actual error

---

## ✅ What I Just Fixed

### 1. **Double-Layer Error Handling**
Added a global error boundary that catches ALL errors (even Next.js internal errors) and ALWAYS returns JSON.

### 2. **Enhanced Logging**
Added detailed logs that will show:
- Where the request starts
- Each step of processing
- EXACTLY where and why it fails

### 3. **AWS Lambda Compatibility**
- Auto-detects Lambda environment
- Uses `/tmp` directory on Lambda
- Shows Lambda status in logs

---

## 🚀 **STEP 1: Deploy the Latest Fixes**

```bash
# Commit and push
git add .
git commit -m "Fix: Enhanced error handling and logging for file uploads"
git push origin main

# Wait for AWS Amplify to deploy (~3-5 minutes)
```

---

## 🔍 **STEP 2: Check CloudWatch Logs**

### How to Access CloudWatch:
1. Go to **AWS Amplify Console**
2. Click your app
3. Click **"Monitoring"** (left sidebar)
4. Click **"View logs in CloudWatch"**
5. Look for `/api/upload-document` logs

### What to Look For:

**At the START, you'll see:**
```
========================================
📤 Document Upload & AI Extraction
📍 Environment: production
📍 Lambda: YES  ← Should say YES
📍 AWS Region: us-west-2  ← Should show your region
========================================
```

**Then look for the error:**

#### Scenario A: Environment Variable Missing
```
❌ No SageMaker endpoint configured!
```
**Fix**: Add `SAGEMAKER_ENDPOINT_NAME` to Amplify Console

#### Scenario B: File Upload Failed
```
📦 Initializing formidable...
❌ Formidable parse error: [error details]
```
**Fix**: Lambda file system issue (should be fixed with `/tmp`)

#### Scenario C: Document Parsing Failed
```
📄 File received: example.html
❌ Error parsing HTML: [error details]
```
**Fix**: Issue with cheerio/pdf-parse on Lambda

#### Scenario D: AI Extraction Failed
```
🤖 Starting AI extraction...
❌ [SageMaker error]
```
**Fix**: Check SageMaker endpoint + IAM permissions

#### Scenario E: Database Failed
```
💾 Creating law in Aurora DSQL...
❌ [Database error]
```
**Fix**: Check database credentials

---

## 🎯 **STEP 3: Share the CloudWatch Error**

Once you have the CloudWatch logs, share:

1. **The error section** (starting from "📤 Document Upload" to the error message)
2. **The environment status**:
   - Is Lambda: YES or NO?
   - What region?
   - Are env vars showing "NOT SET"?

---

## 📋 Quick Checklist

Before testing again, verify in **Amplify Console → Environment variables**:

- [ ] `AURORA_DSQL_ENDPOINT` is set
- [ ] `APP_REGION` is set (e.g., `us-west-2`)
- [ ] `DATABASE_NAME` is set (e.g., `postgres`)
- [ ] `APP_ACCESS_KEY_ID` is set and marked as **Secret**
- [ ] `APP_SECRET_ACCESS_KEY` is set and marked as **Secret**
- [ ] `SAGEMAKER_ENDPOINT_NAME` is set (e.g., `endpoint-quick-start-85saw`)

---

## 🧪 Test Locally First (Optional)

To verify the code works locally:

```bash
npm run dev

# Open http://localhost:3000
# Try uploading a file
# Check terminal for detailed logs
```

If it works locally but fails on Amplify, the issue is environment-specific (env vars, IAM, Lambda).

---

## 📊 Files Changed

- ✅ `pages/api/upload-document.ts` - Double error boundary + enhanced logging
- ✅ `components/UploadDocumentModal.tsx` - Better error detection
- ✅ `next.config.js` - Cleaned up invalid config
- ✅ `lib/sagemaker-client.ts` - Runtime env vars (previous fix)
- ✅ `lib/db-connection.ts` - Runtime env vars (previous fix)

---

## 🎯 Expected Outcome

After deploying and checking logs, you'll see ONE of:

1. **✅ SUCCESS**: File uploads work
2. **🔍 CLEAR ERROR MESSAGE**: Shows exactly what's failing (env var, permission, etc.)

Either way, we'll have the information needed to fix it!

---

## 📚 Documentation

- 📄 `DEBUG_500_ERROR.md` - Detailed debugging guide
- 📄 `FILE_UPLOAD_FIX_SUMMARY.md` - Previous fixes summary
- 📄 `AMPLIFY_FILE_UPLOAD_FIX.md` - Complete reference

---

## ✅ Next Steps

1. **Deploy**: `git push origin main`
2. **Wait**: ~3-5 minutes for Amplify build
3. **Test**: Try uploading a file
4. **Check logs**: Go to CloudWatch
5. **Share**: Copy the error message from logs

**The enhanced logging will show us EXACTLY what's failing!** 🔍

---

**Status**: ✅ Code ready to deploy with full error logging

