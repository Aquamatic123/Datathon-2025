# 🚀 Deploy to AWS Amplify - Quick Guide

## ✅ Status: ALL CHECKS PASSED

```
=== Deployment Readiness Check ===
1. .gitignore protects .env.local: ✅
2. amplify.yml exists: ✅
3. next.config.js configured: ✅
4. package.json has build: ✅

Ready to deploy! 🚀
```

---

## 🚀 3-Step Deployment

### Step 1: Push to GitHub (2 minutes)

```bash
cd /Users/simongonzalez/Desktop/Datathon2025_frontend/Datathon-2025/Datathon-2025

# Add all files
git add .

# Commit
git commit -m "Production ready: 4-call AI extraction with data validation"

# Push to GitHub
git push origin main
```

**Verify:** Go to GitHub and see your code is pushed ✅

---

### Step 2: Add Environment Variables in Amplify (3 minutes)

1. **Go to:** https://console.aws.amazon.com/amplify/
2. **Select your app** (or create new app if first time)
3. **Click:** "Environment variables" in left sidebar
4. **Click:** "Manage variables"
5. **Add these 6 variables:**

```
Variable 1:
Name:  AURORA_DSQL_ENDPOINT
Value: dbtjczatkd7mblohlvaxccqpg4.dsql.us-west-2.on.aws
Secret: NO

Variable 2:
Name:  APP_REGION
Value: us-west-2
Secret: NO

Variable 3:
Name:  DATABASE_NAME
Value: postgres
Secret: NO

Variable 4:
Name:  APP_ACCESS_KEY_ID
Value: AKIA6ODVAJ2DK6HO7M6I
Secret: YES ✓ (Toggle the secret checkbox!)

Variable 5:
Name:  APP_SECRET_ACCESS_KEY
Value: [your-actual-secret-key]
Secret: YES ✓ (Toggle the secret checkbox!)

Variable 6:
Name:  SAGEMAKER_ENDPOINT_NAME
Value: endpoint-quick-start-85saw
Secret: NO
```

6. **Click:** "Save"

**Verify:** You see all 6 variables listed ✅

---

### Step 3: Deploy (5-10 minutes)

**Option A: If already connected to GitHub**
- Amplify automatically detects the push
- Build starts automatically
- Just wait for completion!

**Option B: First time setup**
1. In Amplify Console, click "New app" → "Host web app"
2. Connect to GitHub
3. Select your repository
4. Select branch: `main`
5. Amplify auto-detects `amplify.yml` ✅
6. Click "Next" → "Save and deploy"

**Watch the build:**
```
⏳ Provision  - 1 min  - Setting up build environment
⏳ Build      - 3 mins - Running npm ci && npm run build  
⏳ Deploy     - 2 mins - Deploying to CloudFront
✅ Complete   - Done!  - Your app is live!
```

---

## 🧪 Test Your Deployed App

### 1. Get Your App URL
From Amplify Console, copy your app URL:
```
https://main.d1234abcd.amplifyapp.com
```

### 2. Test Connection
```bash
# Replace with your actual URL
curl https://[your-app].amplifyapp.com/api/test-connection
```

**Expected response:**
```json
{
  "success": true,
  "message": "Successfully connected to Aurora DSQL",
  "tables": ["laws", "stocks", "law_stock_relationships"]
}
```

### 3. Test in Browser
```bash
# Open in browser
open https://[your-app].amplifyapp.com
```

**Should see:**
- ✅ Dashboard loads
- ✅ Laws displayed from database
- ✅ Analytics cards show data
- ✅ "Upload Document" button visible
- ✅ "Add Manually" button visible

### 4. Test Features
- [ ] Click a law to see details
- [ ] Click "Add Manually" to create a law
- [ ] Click "Upload Document" and upload `test-documents/example-law.html`
- [ ] Verify AI extraction works and law is created

---

## 🔍 If Something Goes Wrong

### Build Fails?

**Check Amplify build logs:**
1. Go to Amplify Console
2. Click "Build history"
3. Click the failed build
4. Click "View logs"
5. Look for the error

**Common issues:**
```
❌ "Module not found"
   → Check package.json has all dependencies
   → Should be fixed already ✅

❌ "Environment variable not defined"
   → Check all 6 env vars are added in Amplify
   → Check secrets are marked as secret

❌ "Build command failed"
   → Check build logs for specific error
   → Usually missing env var or dependency
```

### App Deployed But Not Working?

**Check:**
1. Browser console for errors (F12)
2. Network tab to see API calls
3. Test `/api/test-connection` endpoint

**Test connection:**
```bash
curl https://[your-app].amplifyapp.com/api/test-connection
```

If it fails, check:
- Environment variables in Amplify Console
- IAM permissions for your AWS credentials
- Aurora DSQL cluster is running

---

## 🔄 Deploy Updates Later

To deploy changes:

```bash
# 1. Make changes locally
# 2. Test locally: npm run dev
# 3. Commit and push:

git add .
git commit -m "Your change description"
git push origin main

# Amplify auto-deploys!
# Wait 5-10 minutes, then refresh your app
```

---

## 📊 What Gets Deployed

### Included in Deploy:
✅ All application code (pages, components, lib)  
✅ Configuration files (amplify.yml, next.config.js)  
✅ Documentation files (all .md files)  
✅ Test documents (test-documents/)  
✅ Package dependencies (installed during build)  

### NOT Included (Protected by .gitignore):
❌ .env.local (your local secrets)  
❌ .env files (environment variables)  
❌ node_modules (rebuilt on Amplify)  
❌ .next (rebuild output)  
❌ AWS credentials  
❌ Log files  

**This is correct!** ✅

---

## 🎯 Deployment Flowchart

```
📝 Write Code
    ↓
🧪 Test Locally (npm run dev)
    ↓
✅ All Working?
    ↓
📤 git push origin main
    ↓
🔧 Add Env Vars in Amplify (first time only)
    ↓
⏳ Amplify Builds (5-10 mins)
    ↓
    ├─→ Provision
    ├─→ Build (npm ci && npm run build)
    └─→ Deploy
    ↓
✅ App is Live!
    ↓
🧪 Test on Live URL
    ↓
🎉 Success!
```

---

## 📝 Quick Command Reference

```bash
# Check what will be committed
git status

# Verify sensitive files are ignored
git check-ignore .env.local  # Should output: .env.local

# Deploy
git add .
git commit -m "Your message"
git push origin main

# Test deployed app
curl https://[your-app].amplifyapp.com/api/test-connection
```

---

## 🔗 Important Links

- **Amplify Console:** https://console.aws.amazon.com/amplify/
- **GitHub Repo:** Your repository URL
- **Documentation:** See AMPLIFY_DEPLOYMENT_READY.md
- **Environment Vars:** See AMPLIFY_ENV_VARS.txt

---

## ✅ Final Checklist

Before deploying:
- [ ] Code tested locally (`npm run dev` works)
- [ ] All features working (view laws, add law, upload document)
- [ ] `.env.local` has all 6 variables
- [ ] Code committed to Git
- [ ] No sensitive files in Git (check `git status`)

After deploying:
- [ ] Build completed successfully (no red X)
- [ ] App URL is accessible
- [ ] `/api/test-connection` returns success
- [ ] Dashboard loads with data
- [ ] Can add law manually
- [ ] Can upload document

---

## 🎉 You're Done!

Your app is now deployed on AWS Amplify with:
- ✅ Aurora DSQL database connection
- ✅ 4-call AI extraction system
- ✅ Document upload feature
- ✅ Real-time analytics
- ✅ Production-ready configuration

**Deploy now:**
```bash
git push origin main
```

**Your app will be live in 10 minutes!** 🚀

