# 🔧 AWS Amplify Deployment Error - FIXED

## ❌ Error Identified

```
!Failed to set up process.env.secrets
```

**Root Cause:** Environment variables are not configured in AWS Amplify Console.

---

## ✅ Solution: Configure Environment Variables

### Step 1: Go to Amplify Console

1. Open: https://console.aws.amazon.com/amplify/
2. Click on your app: **Datathon-2025**
3. In left sidebar, click **"Environment variables"**
4. Click **"Manage variables"**

### Step 2: Add All 6 Environment Variables

Add these variables **EXACTLY** as shown:

#### Variable 1:
```
Name:  AURORA_DSQL_ENDPOINT
Value: dbtjczatkd7mblohlvaxccqpg4.dsql.us-west-2.on.aws
```

#### Variable 2:
```
Name:  APP_REGION
Value: us-west-2
```

#### Variable 3:
```
Name:  DATABASE_NAME
Value: postgres
```

#### Variable 4: (Mark as SECRET!)
```
Name:  APP_ACCESS_KEY_ID
Value: AKIA6ODVAJ2DK6HO7M6I
Secret: ✓ YES (toggle the secret checkbox!)
```

#### Variable 5: (Mark as SECRET!)
```
Name:  APP_SECRET_ACCESS_KEY
Value: [your-actual-secret-access-key]
Secret: ✓ YES (toggle the secret checkbox!)
```

#### Variable 6:
```
Name:  SAGEMAKER_ENDPOINT_NAME
Value: endpoint-quick-start-85saw
```

### Step 3: Save and Redeploy

1. Click **"Save"** button
2. Go to your app's main page
3. Click **"Redeploy this version"**
4. Wait 5-10 minutes for rebuild

---

## 🔍 Why This Happened

### The Problem:
AWS Amplify tried to load environment variables but found none configured, causing:
```
SSM params {"Path":"/amplify/d1i0xcodmz176a/main/","WithDecryption":true}
!Failed to set up process.env.secrets
```

### The Fix:
Adding environment variables in Amplify Console makes them available to your app at build time and runtime.

---

## 🎯 Verification Steps

After adding variables and redeploying:

### 1. Check Build Logs
You should see:
```
✓ Environment variables loaded
✓ npm ci completed
✓ npm run build completed
✓ Build artifacts uploaded
```

### 2. Test API Endpoint
```bash
curl https://main.d1i0xcodmz176a.amplifyapp.com/api/test-connection
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully connected to Aurora DSQL",
  "tables": ["laws", "stocks", "law_stock_relationships"]
}
```

### 3. Test in Browser
Open: `https://main.d1i0xcodmz176a.amplifyapp.com`

Should see:
- ✅ Dashboard loads
- ✅ Laws displayed
- ✅ Analytics cards show data

---

## 📋 Screenshot Guide

### Where to Add Variables:

```
AWS Amplify Console
 └─ Your App (Datathon-2025)
     └─ App Settings (left sidebar)
         └─ Environment variables
             └─ Manage variables [button]
                 └─ Add variable [button]
                     ├─ Variable name: [input]
                     ├─ Value: [input]
                     └─ Secret: [checkbox] ← Toggle for sensitive vars!
```

**Important:** Click "Save" at the bottom after adding all 6!

---

## 🔐 Security Note

**Variables 4 and 5 MUST be marked as "Secret":**
- `APP_ACCESS_KEY_ID` → **Secret: YES** ✓
- `APP_SECRET_ACCESS_KEY` → **Secret: YES** ✓

When marked as secret:
- Values are encrypted in AWS
- Not visible in build logs
- Only accessible to your app at runtime

---

## 🚀 Complete Setup Checklist

### Before Adding Variables:
- [x] Code is pushed to GitHub
- [x] Amplify is connected to your repository
- [x] Build is failing with "Failed to set up process.env.secrets"

### Adding Variables:
- [ ] Open Amplify Console
- [ ] Navigate to Environment variables
- [ ] Add AURORA_DSQL_ENDPOINT
- [ ] Add APP_REGION
- [ ] Add DATABASE_NAME
- [ ] Add APP_ACCESS_KEY_ID (mark as SECRET!)
- [ ] Add APP_SECRET_ACCESS_KEY (mark as SECRET!)
- [ ] Add SAGEMAKER_ENDPOINT_NAME
- [ ] Click "Save"

### After Adding Variables:
- [ ] Click "Redeploy this version"
- [ ] Wait for build to complete (5-10 mins)
- [ ] Test API endpoint
- [ ] Test in browser
- [ ] Verify features work

---

## 🔄 If Build Still Fails

### Check 1: Verify All Variables Are Added
```
Go to: Amplify → Environment variables

Should see 6 variables:
✓ AURORA_DSQL_ENDPOINT
✓ APP_REGION
✓ DATABASE_NAME
✓ APP_ACCESS_KEY_ID (shows as "Secret")
✓ APP_SECRET_ACCESS_KEY (shows as "Secret")
✓ SAGEMAKER_ENDPOINT_NAME
```

### Check 2: Verify Secret Variables Are Marked
Click "Edit" on each variable and check:
- APP_ACCESS_KEY_ID: Secret checkbox is checked ✓
- APP_SECRET_ACCESS_KEY: Secret checkbox is checked ✓

### Check 3: Check Build Logs
After redeploying, check logs for:
```
✓ Environment variables configured: 6
✓ npm ci completed
✓ npm run build started
```

If you see errors about missing modules:
```bash
# This means build is progressing!
# npm is installing dependencies
```

---

## 💡 Common Issues

### Issue: "Variable already exists"
**Solution:** Edit the existing variable instead of adding new one

### Issue: "Cannot read properties of undefined"
**Solution:** Check variable names are EXACTLY as specified (case-sensitive!)

### Issue: "Build succeeds but app doesn't work"
**Solution:** 
1. Check all 6 variables are added
2. Verify secrets are marked as secret
3. Test API endpoint manually

---

## 📝 Variables Reference Table

| Variable | Required? | Secret? | Example Value |
|----------|-----------|---------|---------------|
| `AURORA_DSQL_ENDPOINT` | ✅ YES | ❌ NO | `dbtjczatkd7mblohlvaxccqpg4.dsql.us-west-2.on.aws` |
| `APP_REGION` | ✅ YES | ❌ NO | `us-west-2` |
| `DATABASE_NAME` | ✅ YES | ❌ NO | `postgres` |
| `APP_ACCESS_KEY_ID` | ✅ YES | ✅ **YES** | `AKIA6ODVAJ2DK6HO7M6I` |
| `APP_SECRET_ACCESS_KEY` | ✅ YES | ✅ **YES** | `[your-secret-key]` |
| `SAGEMAKER_ENDPOINT_NAME` | ⚠️ Optional | ❌ NO | `endpoint-quick-start-85saw` |

**Note:** App will work without SAGEMAKER_ENDPOINT_NAME, but document upload AI extraction will use fallbacks.

---

## 🎯 Expected Build Timeline

After adding variables and redeploying:

```
0:00 - Provision      - Setting up build container
0:30 - Clone         - Fetching code from GitHub
1:00 - Pre-build     - Loading environment variables ✓
1:30 - npm ci        - Installing dependencies (warnings OK)
4:00 - npm run build - Building Next.js app
7:00 - Deploy        - Uploading to CloudFront
10:00 - Complete     - ✅ App is live!
```

**Total time:** 10-15 minutes

---

## ✅ Success Indicators

### In Build Logs:
```
✓ Retrieved environment from SSM
✓ npm ci completed
✓ Build completed successfully
✓ Artifacts uploaded
```

### In Browser:
```
✓ Dashboard loads
✓ Laws table shows data
✓ No console errors
✓ API calls succeed
```

### In API Test:
```bash
curl https://main.d1i0xcodmz176a.amplifyapp.com/api/test-connection

# Should return:
{"success":true,"message":"Successfully connected to Aurora DSQL"}
```

---

## 🔗 Direct Links

- **Your Amplify App:** https://console.aws.amazon.com/amplify/home?region=us-east-1#/d1i0xcodmz176a
- **Environment Variables:** App → Settings → Environment variables
- **Build History:** App → Build → View logs
- **Live App:** https://main.d1i0xcodmz176a.amplifyapp.com

---

## 🆘 Still Having Issues?

### Check IAM Permissions
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
      "Resource": "arn:aws:dsql:us-west-2:*:cluster/*"
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

### Verify Aurora DSQL is Running
```bash
# Test connection from local machine
npm run dev
# If local works, Amplify should work too after adding env vars
```

---

## 🎉 Summary

**The Fix:**
1. Go to AWS Amplify Console
2. Add 6 environment variables
3. Mark 2 as "Secret"
4. Click "Save"
5. Redeploy

**Expected Result:**
- Build completes successfully
- App is accessible
- Database connection works
- Features are functional

**Time to Fix:** 5 minutes to add variables + 10 minutes for rebuild = **15 minutes total**

---

## 📞 Next Steps

1. **Add environment variables** (see Step 2 above)
2. **Redeploy** (click "Redeploy this version")
3. **Wait 10 minutes** for build to complete
4. **Test your app** at the Amplify URL
5. **Verify features work** (view laws, add law, upload document)

---

**Your deployment will succeed once environment variables are added!** ✅

