# ⚡ QUICK FIX - AWS Amplify Deployment Error

## ❌ Error:
```
!Failed to set up process.env.secrets
```

## ✅ Fix (5 minutes):

### Step 1: Open Amplify Console
🔗 https://console.aws.amazon.com/amplify/

### Step 2: Navigate to Environment Variables
```
Click your app → Left sidebar → "Environment variables" → "Manage variables"
```

### Step 3: Add These 6 Variables

Copy-paste from `COPY_PASTE_ENV_VARS.txt` or add manually:

```
1. AURORA_DSQL_ENDPOINT = dbtjczatkd7mblohlvaxccqpg4.dsql.us-west-2.on.aws
2. APP_REGION = us-west-2
3. DATABASE_NAME = postgres
4. APP_ACCESS_KEY_ID = AKIA6ODVAJ2DK6HO7M6I (Secret: YES ✓)
5. APP_SECRET_ACCESS_KEY = [your-key] (Secret: YES ✓)
6. SAGEMAKER_ENDPOINT_NAME = endpoint-quick-start-85saw
```

### Step 4: Save & Redeploy
1. Click **"Save"**
2. Click **"Redeploy this version"**
3. Wait 10 minutes

### Step 5: Test
```bash
curl https://main.d1i0xcodmz176a.amplifyapp.com/api/test-connection
```

---

## 🎯 That's It!

Your deployment will succeed once these variables are added.

**See `AMPLIFY_ERROR_FIX.md` for detailed explanation.**

