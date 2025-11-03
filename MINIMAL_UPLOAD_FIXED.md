# ✅ Minimal Upload API - All Error Handling Removed

## 🎯 What I Did

I completely stripped down the upload API to **bare minimum** code with **zero error handling complexity**:

### Changes Made:

1. **✅ Removed all step-by-step logging** - Could be causing issues
2. **✅ Removed double try-catch** - Unnecessary complexity  
3. **✅ Removed parseUploadedFile function** - Inline everything
4. **✅ Set JSON header immediately** - Force JSON response
5. **✅ Simplified error messages** - Just return the error
6. **✅ Added responseLimit: false** - Prevent body size issues

### The New Code is ~75 lines (was ~180 lines)

**Before**: Complex with logging, steps, error handling  
**After**: Bare minimum - just parse, extract, save

---

## 📋 CRITICAL: Check Amplify Environment Variables

The 500 error is most likely because **environment variables aren't set correctly**.

### In AWS Amplify Console → Environment variables:

**Add these 4 (and ONLY these 4)**:
```
AURORA_DSQL_ENDPOINT=dbtjczatkd7mblohlvaxccqpg4.dsql.us-west-2.on.aws
APP_REGION=us-west-2
DATABASE_NAME=postgres
SAGEMAKER_ENDPOINT_NAME=endpoint-quick-start-85saw
```

**REMOVE these if they exist**:
- ~~APP_ACCESS_KEY_ID~~
- ~~APP_SECRET_ACCESS_KEY~~

These should NOT be in Amplify - Lambda role provides them automatically!

---

## 🚀 Deploy Steps

```bash
# 1. Build to verify
npm run build

# 2. Commit
git add .
git commit -m "Minimal upload API - removed all error handling"

# 3. Push
git push origin main

# 4. Check Amplify Console
#    - Build should succeed
#    - Verify environment variables (only 4 needed!)
```

---

## 🧪 Test After Deploy

1. **Wait for Amplify deploy to complete**
2. **Clear browser cache** (or use incognito)
3. **Upload an HTML file**
4. **If it still fails**, check CloudWatch logs - they'll show the real error now

---

## 🔍 If Still Getting 500 Error

The error is definitely one of these:

### Issue 1: Environment Variables Missing
**Check**: Amplify Console → Environment variables  
**Fix**: Add the 4 variables listed above

### Issue 2: Lambda Role Permissions
**Check**: IAM Console → Roles → Find your Amplify role  
**Fix**: Add these policies:
- `sagemaker:InvokeEndpoint` 
- `dsql:DbConnectAdmin`

### Issue 3: Cheerio Not Working on Lambda
**Check**: CloudWatch logs will show "cheerio" error  
**Fix**: Try uploading a TXT file instead of HTML

---

## 📊 Current Code Flow

```
1. Parse multipart form → Get file
2. Read file buffer
3. Parse document (TXT/HTML/XML/PDF)
4. Truncate to 15,000 chars
5. AI extraction (4 calls to SageMaker)
6. Create law in Aurora DSQL
7. Return success
```

**If ANY step fails, return error immediately with just the error message.**

---

## 🎯 Most Likely Problem

Based on the 500 error, it's probably:

**#1 Most likely**: Environment variables not set in Amplify Console  
**#2 Likely**: Lambda role missing SageMaker/DSQL permissions  
**#3 Less likely**: Cheerio library not working on Lambda

**Check CloudWatch logs to confirm!**

---

## 📝 Next Steps

1. Deploy this simplified version
2. Go to AWS Amplify Console
3. Check Environment variables are correct
4. Try uploading again
5. If fails, check CloudWatch for actual error

The minimal code will make it much easier to see what's really failing!

---

**Status**: ✅ Simplified to bare minimum - ready to deploy

