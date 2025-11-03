# 🚨 FIND THE EXACT PROBLEM - Step by Step

## We're going to test each piece individually to find what's breaking

---

## Step 1: Deploy the Test Endpoints

```bash
git add .
git commit -m "Add diagnostic endpoints"
git push origin main
```

**Wait 3-4 minutes for deployment**

---

## Step 2: Test Each Endpoint (IN ORDER)

### Test A: Basic API Routing
```
https://main.d1i0xcodmz176a.amplifyapp.com/api/simple-test
```

**Expected**: 
```json
{
  "status": "API is working",
  "method": "GET",
  "timestamp": "2025-11-03T..."
}
```

**If this fails**: API routing is completely broken (very unlikely)
**If this works**: API routes work, continue to Test B ✅

---

### Test B: Environment Variables
```
https://main.d1i0xcodmz176a.amplifyapp.com/api/test-env
```

**Expected**:
```json
{
  "status": "Environment check",
  "isLambda": true,
  "hasDbEndpoint": true,
  "hasSageMaker": true,
  "hasRegion": true,
  "nodeVersion": "v18.x.x",
  "platform": "linux"
}
```

**If hasDbEndpoint is false**: `AURORA_DSQL_ENDPOINT` not set in Amplify Console
**If hasSageMaker is false**: `SAGEMAKER_ENDPOINT_NAME` not set in Amplify Console
**If this works**: Environment variables are set, continue to Test C ✅

---

### Test C: Formidable Library
```
https://main.d1i0xcodmz176a.amplifyapp.com/api/test-formidable
```

**Expected**:
```json
{
  "status": "Formidable loaded successfully",
  "version": "v3+"
}
```

**If this fails**: Formidable can't load on Lambda (dependency issue)
**If this works**: Formidable works, the issue is in upload-document logic ✅

---

### Test D: Test Upload Endpoint
```
https://main.d1i0xcodmz176a.amplifyapp.com/api/test-upload
```

**Expected**:
```json
{
  "success": true,
  "message": "Upload endpoint is reachable",
  "env": {...}
}
```

**If this fails**: Something specific to this endpoint is broken
**If this works**: Basic endpoint works, actual upload has the issue

---

## Step 3: Based on Results

### If Test A fails:
**Problem**: Amplify deployment is broken
**Solution**: Check Amplify Console build logs

### If Test B shows false values:
**Problem**: Environment variables not set
**Solution**: 
1. Go to Amplify Console
2. App Settings → Environment variables
3. Add missing variables
4. Redeploy

### If Test C fails:
**Problem**: Formidable doesn't work on Lambda
**Solution**: We'll need to use a different upload library or approach

### If All A-D pass but upload-document still fails:
**Problem**: Something in the actual upload logic
**Solution**: Need to check CloudWatch logs for specific error

---

## 🔍 How to Check CloudWatch Logs (CRITICAL)

If tests pass but upload still fails, you MUST check CloudWatch:

### Step-by-Step:

1. **Go to AWS Console** (console.aws.amazon.com)
2. **Search for "CloudWatch"** in the top search bar
3. Click **"CloudWatch"**
4. In left sidebar, click **"Logs" → "Log groups"**
5. Find a log group like:
   - `/aws/lambda/amplify-...`
   - Or search for your app name
6. Click on it
7. Click on the **most recent log stream** (top of list)
8. **Scroll down** and look for:
   - "upload-document"
   - "Error"
   - "Exception"
   - Stack traces

### What the logs will show:

**Example 1: Missing env var**
```
Error: SAGEMAKER_ENDPOINT_NAME is required for AI extraction
```
→ Add SAGEMAKER_ENDPOINT_NAME to Amplify Console

**Example 2: Permission denied**
```
User: arn:aws:sts::...assumed-role/... is not authorized to perform: sagemaker:InvokeEndpoint
```
→ Add permissions to Lambda role

**Example 3: Module error**
```
Error: Cannot find module 'cheerio'
```
→ Dependency issue, need to fix package.json

---

## 📊 Report Back With:

After running the 4 tests above, tell me:

1. **Test A result**: Working or HTML error?
2. **Test B result**: What are the true/false values?
3. **Test C result**: Did formidable load?
4. **Test D result**: Did test-upload work?

Then I can tell you EXACTLY what's wrong and how to fix it!

---

## ⚡ Quick Commands

```bash
# Deploy tests
git add . && git commit -m "Add diagnostics" && git push origin main

# Then test (after 3-4 min):
curl https://main.d1i0xcodmz176a.amplifyapp.com/api/simple-test
curl https://main.d1i0xcodmz176a.amplifyapp.com/api/test-env
curl https://main.d1i0xcodmz176a.amplifyapp.com/api/test-formidable
curl https://main.d1i0xcodmz176a.amplifyapp.com/api/test-upload
```

---

## 🎯 This WILL Find the Problem

These tests are designed to isolate the exact failure point. Once we know which test fails, we'll know exactly what to fix!

**Deploy these tests and share the results of all 4 endpoints!** 🔍

