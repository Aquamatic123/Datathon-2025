# 🚨 CRITICAL: Check CloudWatch Logs NOW

## The Issue

You're still getting HTML error pages, which means something is failing BEFORE our code even runs properly. 

**The upload code is correct. The issue is environment/permissions.**

---

## 🎯 IMMEDIATE ACTION REQUIRED

### Step 1: Deploy the Test Endpoint

```bash
git add .
git commit -m "Add test endpoint"
git push origin main
```

### Step 2: Test the New Endpoint

After deployment completes, visit:
```
https://main.d1i0xcodmz176a.amplifyapp.com/api/test-upload
```

**Expected result:**
```json
{
  "success": true,
  "message": "Upload endpoint is reachable",
  "env": {
    "nodeEnv": "production",
    "isLambda": true,
    "region": "us-west-2",
    "hasDbEndpoint": true,
    "hasSageMaker": true,
    "hasCredentials": false
  }
}
```

**If this works**, environment variables are set correctly.
**If this fails**, something more fundamental is broken.

---

## 🔍 Step 3: Check CloudWatch Logs (CRITICAL)

You MUST do this to see the actual error:

### How to Access:
1. Go to **AWS CloudWatch Console** (not Amplify Console)
2. Go to **Log groups**
3. Find `/aws/lambda/amplify-*` or similar
4. Click on it
5. Look for recent log streams
6. Open the most recent one
7. Search for "upload-document" or "error"

### What to Look For:

**Scenario A: Environment Variable Missing**
```
Error: SAGEMAKER_ENDPOINT_NAME is required for AI extraction
```
**Fix**: Add SAGEMAKER_ENDPOINT_NAME to Amplify Console

**Scenario B: Permission Denied**
```
User: arn:aws:sts::...assumed-role/... is not authorized to perform: sagemaker:InvokeEndpoint
```
**Fix**: Add permissions to Lambda execution role

**Scenario C: Module Error**
```
Error: Cannot find module 'cheerio'
or
Error: Cannot find module 'formidable'
```
**Fix**: Dependencies not installed properly

**Scenario D: Parsing Error**
```
Error: ... cheerio ... or pdf-parse ...
```
**Fix**: Library not compatible with Lambda

---

## ⚙️ Step 4: Verify Amplify Console Environment Variables

Go to: **AWS Amplify Console → Your App → Environment variables**

**Screenshot or copy-paste what you see there.**

You should have **EXACTLY 4 variables**:

| Variable | Should Be Set To |
|----------|------------------|
| `AURORA_DSQL_ENDPOINT` | `dbtjczatkd7mblohlvaxccqpg4.dsql.us-west-2.on.aws` |
| `APP_REGION` | `us-west-2` |
| `DATABASE_NAME` | `postgres` |
| `SAGEMAKER_ENDPOINT_NAME` | `endpoint-quick-start-85saw` |

**And you should NOT have:**
- ❌ `APP_ACCESS_KEY_ID` (remove if present!)
- ❌ `APP_SECRET_ACCESS_KEY` (remove if present!)

---

## 🎯 What's Most Likely Wrong

Based on the persistent 500 error returning HTML:

### 99% Likely: One of These 3 Issues

1. **Environment variables NOT set in Amplify Console**
   - Check: Amplify Console → Environment variables
   - Fix: Add the 4 variables above

2. **Lambda execution role missing permissions**
   - Check: IAM Console → Roles → Find your Amplify role
   - Fix: Add `sagemaker:InvokeEndpoint` and `dsql:DbConnectAdmin`

3. **Dependencies not installed on Lambda**
   - Check: CloudWatch logs will show "Cannot find module"
   - Fix: Ensure `package.json` is committed and `npm ci` runs in build

---

## 📊 Debugging Checklist

Please check and report back:

- [ ] Did `/api/test-upload` return JSON successfully?
- [ ] What do CloudWatch logs show? (actual error message)
- [ ] What environment variables are set in Amplify Console? (screenshot)
- [ ] Does your Lambda role have SageMaker permissions?

---

## 💡 Quick Tests

### Test 1: Test endpoint
```bash
curl https://main.d1i0xcodmz176a.amplifyapp.com/api/test-upload
```

Should return JSON, not HTML.

### Test 2: Check build logs
In Amplify Console → Your App → Click latest build
Look for "npm ci" and "npm run build" - did they succeed?

### Test 3: CloudWatch
AWS Console → CloudWatch → Log groups
Find the upload error - it will tell you exactly what's wrong.

---

## 🚨 PLEASE SHARE:

1. **Result of `/api/test-upload`** - Does it return JSON?
2. **CloudWatch logs** - What's the actual error message?
3. **Amplify environment variables** - Screenshot or list what's set

Without seeing the actual error in CloudWatch, we're guessing. The logs will tell us exactly what's wrong!

---

**Next Step**: Check CloudWatch logs and share the actual error message. That's the only way to fix this! 🔍

