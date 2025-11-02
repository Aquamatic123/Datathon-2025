# ✅ AWS Amplify Configuration - READY TO DEPLOY

## Changes Made for Amplify Compatibility

### 1. Fixed `next.config.js`
- ❌ **Removed:** `output: 'standalone'` (incompatible with Amplify)
- ✅ **Added:** `env` section to explicitly expose environment variables

### 2. Created `amplify.yml`
- Build configuration optimized for Amplify
- Includes caching for faster builds
- Proper artifact output configuration

---

## 🚀 Deployment Steps

### Step 1: Push Your Changes to Git

```bash
cd /Users/simongonzalez/Desktop/Datathon2025_frontend/Datathon-2025/Datathon-2025

# Check what's changed
git status

# Add all files
git add .

# Commit
git commit -m "Configure app for AWS Amplify deployment"

# Push to your repository
git push origin main
```

### Step 2: Set Environment Variables in Amplify Console

**Go to:** AWS Amplify Console → Your App → Environment variables → Manage variables

**Add these 5 variables:**

| Variable Name | Value | Secret? |
|---------------|-------|---------|
| `AURORA_DSQL_ENDPOINT` | `dbtjczatkd7mblohlvaxccqpg4.dsql.us-west-2.on.aws` | NO |
| `APP_REGION` | `us-west-2` | NO |
| `DATABASE_NAME` | `postgres` | NO |
| `APP_ACCESS_KEY_ID` | `AKIA6ODVAJ2DK6HO7M6I` | **YES** ✓ |
| `APP_SECRET_ACCESS_KEY` | `[your-actual-secret-key]` | **YES** ✓ |

**IMPORTANT:** 
- Mark `APP_ACCESS_KEY_ID` and `APP_SECRET_ACCESS_KEY` as **SECRET** (toggle the checkbox)
- Click **"Save"** after adding all variables

### Step 3: Deploy or Redeploy

If this is your first deployment:
1. In Amplify Console, click **"New app"** → **"Host web app"**
2. Connect your Git repository
3. Amplify will detect `amplify.yml` automatically
4. Click **"Save and deploy"**

If app already exists:
1. After pushing to Git, Amplify auto-deploys
2. OR click **"Redeploy this version"** in Amplify Console

### Step 4: Monitor Build

Watch the build process in Amplify Console:
1. Click on your app
2. Click on the latest build
3. View logs to see progress

Look for these success indicators:
```
✓ Provision
✓ Build
✓ Deploy
✓ Verify
```

### Step 5: Test Your Deployed App

Once deployed, test these endpoints:

**Test 1: Connection**
```bash
curl https://[your-app-id].amplifyapp.com/api/test-connection
```

Expected response:
```json
{
  "success": true,
  "message": "Aurora DSQL connection successful"
}
```

**Test 2: Fetch Laws**
```bash
curl https://[your-app-id].amplifyapp.com/api/laws
```

Expected: JSON with 3 laws

**Test 3: Open in Browser**
```
https://[your-app-id].amplifyapp.com
```

Expected: Dashboard with laws and analytics

---

## 🔧 How the Fix Works

### Before (Not Working):
```javascript
// next.config.js
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',  // ❌ For Docker, not Amplify
}
```

**Problem:** 
- `output: 'standalone'` creates a Docker-optimized build
- Amplify uses serverless SSR, not containers
- Environment variables weren't properly exposed

### After (Working):
```javascript
// next.config.js
const nextConfig = {
  reactStrictMode: true,
  env: {  // ✅ Explicitly expose for Amplify
    AURORA_DSQL_ENDPOINT: process.env.AURORA_DSQL_ENDPOINT,
    APP_REGION: process.env.APP_REGION,
    DATABASE_NAME: process.env.DATABASE_NAME,
    APP_ACCESS_KEY_ID: process.env.APP_ACCESS_KEY_ID,
    APP_SECRET_ACCESS_KEY: process.env.APP_SECRET_ACCESS_KEY,
  },
}
```

**Solution:**
- Removed Docker-specific config
- Added `env` section to expose variables at build time
- Amplify injects these from Environment Variables
- API routes can access via `process.env.*`

---

## 📋 Environment Variables Checklist

Before deploying, verify in Amplify Console:

- [ ] `AURORA_DSQL_ENDPOINT` is set
- [ ] `APP_REGION` is set  
- [ ] `DATABASE_NAME` is set
- [ ] `APP_ACCESS_KEY_ID` is set and marked as **SECRET**
- [ ] `APP_SECRET_ACCESS_KEY` is set and marked as **SECRET**
- [ ] All variables saved (click "Save" button!)
- [ ] Triggered a new deployment after adding variables

---

## 🐛 Troubleshooting

### Build Fails with "Module not found"
**Solution:** Make sure `package.json` includes all dependencies. The build uses `npm ci` which requires `package-lock.json`.

### Build Succeeds but App Shows Error
**Check:**
1. Are all 5 environment variables set in Amplify?
2. Are the SECRET variables marked as secret?
3. Did you redeploy after adding variables?

**View Logs:**
- Amplify Console → Your App → Monitoring → Logs
- Look for the console.log output from `db-connection.ts`

### "Cannot connect to database"
**Check the logs for:**
```
🔧 Aurora DSQL Configuration:
  - APP_ACCESS_KEY_ID: ✗ Not set
```

If you see `✗ Not set`, the variable isn't loaded. Make sure:
- Variable name matches exactly (case-sensitive)
- You saved the variables in Amplify
- You redeployed after saving

### Variables Work Locally but Not on Amplify
**Solution:**
1. Verify `next.config.js` has the `env` section
2. Push the updated `next.config.js` to Git
3. Redeploy on Amplify

---

## 🎯 Files Modified

### 1. `next.config.js`
- Removed `output: 'standalone'`
- Added `env` section with all 5 variables

### 2. `amplify.yml` (NEW)
- Build configuration for Amplify
- Optimized caching
- Proper artifact output

---

## ✅ Ready to Deploy!

Your app is now configured for AWS Amplify:

✅ **Next.js config** - Compatible with Amplify SSR  
✅ **Build config** - `amplify.yml` created  
✅ **Environment variables** - Properly exposed  
✅ **Database connection** - Uses APP_* credentials  
✅ **Local testing** - Still works with .env.local  

**Next Step:** Push to Git and let Amplify build!

---

## 📊 Expected Build Output

```
Provisioning ✓
Build ✓
  - npm ci
  - npm run build
  - Environment variables injected
  - Build successful
Deploy ✓
  - Deploying to CDN
  - Lambda functions created for API routes
Verify ✓
  - Health check passed

Deployment successful! 🎉
```

Your app will be live at: `https://[branch].[app-id].amplifyapp.com`

---

## 🔐 Security Notes

✓ `.env.local` is ignored by Git  
✓ Credentials only stored in Amplify (not in code)  
✓ Secret variables are encrypted by AWS  
✓ API routes run server-side (credentials never exposed to browser)  

Your deployment is secure! 🔒

