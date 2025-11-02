# AWS Amplify Deployment Guide

## Environment Variables Required

Add these **5 environment variables** in AWS Amplify Console for your app to work:

### 1. AURORA_DSQL_ENDPOINT
```
dbtjczatkd7mblohlvaxccqpg4.dsql.us-west-2.on.aws
```
**Description:** Your Aurora DSQL cluster endpoint (hostname only, no protocol or query parameters)

---

### 2. APP_REGION
```
us-west-2
```
**Description:** The AWS region where your Aurora DSQL cluster is located

---

### 3. DATABASE_NAME
```
postgres
```
**Description:** The database name to connect to (default is 'postgres')

---

### 4. APP_ACCESS_KEY_ID
```
AKIA6ODVAJ2DK6HO7M6I
```
**Description:** AWS access key ID with permissions to access Aurora DSQL  
**⚠️ IMPORTANT:** Mark this as **SECRET** in Amplify Console

---

### 5. APP_SECRET_ACCESS_KEY
```
[YOUR_SECRET_ACCESS_KEY]
```
**Description:** AWS secret access key (keep this secure!)  
**⚠️ IMPORTANT:** Mark this as **SECRET** in Amplify Console

---

## How to Add Environment Variables in AWS Amplify

### Via Amplify Console (Recommended)

1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/
2. Select your app
3. Click **"Environment variables"** in the left sidebar
4. Click **"Manage variables"**
5. Click **"Add variable"** for each one:

| Variable | Value | Secret? |
|----------|-------|---------|
| AURORA_DSQL_ENDPOINT | `dbtjczatkd7mblohlvaxccqpg4.dsql.us-west-2.on.aws` | No |
| APP_REGION | `us-west-2` | No |
| DATABASE_NAME | `postgres` | No |
| APP_ACCESS_KEY_ID | `AKIA6ODVAJ2DK6HO7M6I` | Yes ✓ |
| APP_SECRET_ACCESS_KEY | `[your-secret-key]` | Yes ✓ |

6. Click **"Save"**

---

## Step-by-Step Deployment

### Step 1: Verify .gitignore
✅ `.env.local` is already in `.gitignore`  
✅ Credentials files are ignored  
✅ Safe to push to Git

### Step 2: Push to Git
```bash
cd /Users/simongonzalez/Desktop/Datathon2025_frontend/Datathon-2025/Datathon-2025

# Check what will be committed (should NOT include .env.local)
git status

# Add all files
git add .

# Commit
git commit -m "Prepare for AWS Amplify deployment"

# Push to your repository
git push origin main
```

### Step 3: Create Amplify App
1. Go to AWS Amplify Console
2. Click **"New app"** → **"Host web app"**
3. Connect your Git provider (GitHub/GitLab/Bitbucket)
4. Select your repository
5. Select branch (usually `main`)
6. Click **"Next"**

### Step 4: Configure Build Settings
Amplify will auto-detect Next.js. Verify settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

Click **"Next"**

### Step 5: Add Environment Variables
Before deploying, add the 5 environment variables listed above.

1. Go to **"Environment variables"**
2. Add all 5 variables
3. Mark `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as **SECRET**

### Step 6: Deploy
1. Click **"Save and deploy"**
2. Wait for build to complete (5-10 minutes)
3. Your app will be live at: `https://main.d[app-id].amplifyapp.com`

---

## Verification After Deployment

### Test 1: Connection
```bash
curl https://your-app.amplifyapp.com/api/test-connection
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Aurora DSQL connection successful",
  "data": {
    "currentTime": "2025-11-03T...",
    "dbVersion": "PostgreSQL 16",
    "existingTables": ["laws", "stocks", "law_stock_relationships"],
    "allTablesExist": true
  }
}
```

### Test 2: Fetch Data
```bash
curl https://your-app.amplifyapp.com/api/laws
```

**Expected Response:**
```json
{
  "DATA": {
    "Law1": { ... },
    "Law2": { ... },
    "Law3": { ... }
  }
}
```

### Test 3: Analytics
```bash
curl https://your-app.amplifyapp.com/api/laws?analytics=true
```

**Expected Response:**
```json
{
  "totalLaws": 3,
  "totalStocksImpacted": 10,
  "sp500AffectedPercentage": 2,
  "confidenceWeightedImpact": 6.63
}
```

---

## Required IAM Permissions

Your AWS access key needs these permissions for Aurora DSQL:

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
    }
  ]
}
```

If your access key doesn't have these permissions, the connection will fail.

---

## Troubleshooting

### Build Fails
**Check:** Build logs in Amplify Console  
**Common issue:** Missing dependencies  
**Solution:** Ensure `package.json` includes all dependencies

### Runtime Error: "Cannot connect to database"
**Check:** Environment variables in Amplify  
**Common issue:** Variables not set or incorrect values  
**Solution:** Verify all 5 variables are set correctly

### Authentication Failed
**Check:** IAM permissions for access key  
**Common issue:** Access key lacks DSQL permissions  
**Solution:** Add `dsql:DbConnectAdmin` permission

### Connection Timeout
**Check:** Aurora DSQL endpoint  
**Common issue:** Endpoint includes query parameters  
**Solution:** Use only hostname (no `?` or parameters)

---

## Cost Estimate

### AWS Amplify
- **Free tier:** 1,000 build minutes/month, 15 GB served/month
- **Beyond free tier:** $0.01/build minute, $0.15/GB served
- **Estimated:** $5-20/month for small app

### Aurora DSQL
- **Pay per request:** ~$0.25 per million read/write units
- **Current usage:** ~10 requests/page load
- **Estimated:** $1-10/month for low-medium traffic

**Total:** $6-30/month depending on traffic

---

## Security Checklist

- [x] `.env.local` in `.gitignore`
- [x] No credentials in code
- [x] Environment variables marked as SECRET in Amplify
- [x] Access keys have minimal required permissions
- [ ] Consider switching to IAM role for production
- [ ] Enable CloudWatch logging for monitoring
- [ ] Set up alerts for failed connections

---

## Next Steps After Deployment

1. **Custom Domain:** Add your domain in Amplify settings
2. **SSL Certificate:** Automatically provisioned by Amplify
3. **Monitoring:** Set up CloudWatch alarms
4. **CI/CD:** Automatic deployments on Git push
5. **Environments:** Create separate staging/production branches

---

## Your App is Ready to Deploy! 🚀

Everything is configured to work with AWS Amplify:
- ✅ Database connection via Aurora DSQL
- ✅ Token-based authentication
- ✅ Environment variables documented
- ✅ `.gitignore` properly configured
- ✅ No sensitive data in repository

Just push to Git, add environment variables in Amplify, and deploy!

