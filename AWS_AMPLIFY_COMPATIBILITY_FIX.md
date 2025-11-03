# AWS Amplify Compatibility Fix

## 🔧 Problem
The app was working locally but failing on AWS Amplify during build/deployment.

## 🎯 Root Cause
Both `lib/sagemaker-client.ts` and `lib/db-connection.ts` were accessing environment variables **at module load time** (during build):

```typescript
// ❌ BAD - Runs during build phase
const SAGEMAKER_ENDPOINT_NAME = process.env.SAGEMAKER_ENDPOINT_NAME!;
const APP_REGION = process.env.APP_REGION || 'us-west-2';
```

On AWS Amplify:
- **Build time**: Environment variables may not be available or accessible
- **Runtime**: Environment variables ARE available when API routes are called

## ✅ Solution
Changed both files to use **lazy evaluation** - environment variables are only accessed when functions are called:

### Before (Module Load Time):
```typescript
const SAGEMAKER_ENDPOINT_NAME = process.env.SAGEMAKER_ENDPOINT_NAME!;
console.log('Endpoint:', SAGEMAKER_ENDPOINT_NAME); // Runs during build
```

### After (Runtime):
```typescript
function getEnvVars() {
  return {
    SAGEMAKER_ENDPOINT_NAME: process.env.SAGEMAKER_ENDPOINT_NAME,
    APP_REGION: process.env.APP_REGION || 'us-west-2',
    // ... other vars
  };
}

// Only called when function is executed (runtime)
export async function extractLawInfoFromText(text: string) {
  const env = getEnvVars(); // ✅ Called at runtime
  // ...
}
```

## 📁 Files Modified

### 1. `lib/sagemaker-client.ts`
- ✅ Removed module-level `const` declarations
- ✅ Added `getEnvVars()` function
- ✅ Updated all functions to call `getEnvVars()` at runtime
- ✅ Removed console.logs that run at module load time

### 2. `lib/db-connection.ts`
- ✅ Removed module-level `const` declarations
- ✅ Added `getEnvVars()` function
- ✅ Added `getClusterEndpoint()` function
- ✅ Updated all functions to get env vars at runtime
- ✅ Removed module-level console.logs and validation

## 🔄 How It Works Now

### Local Development (Next.js Dev Server)
```bash
npm run dev
# Environment variables loaded from .env.local
# Functions called at runtime → env vars available ✅
```

### AWS Amplify Deployment
```bash
# Build Phase (Static)
npm run build
# No env var access at module level ✅ (we don't access them)
# Just compiles the code

# Runtime Phase (API Routes)
# User makes API call → function executes → getEnvVars() called ✅
# Environment variables from Amplify Console available ✅
```

## 🌐 AWS Amplify Environment Variables

Make sure these are set in **AWS Amplify Console → App Settings → Environment variables**:

1. `AURORA_DSQL_ENDPOINT` (Plain text)
2. `APP_REGION` (Plain text) - e.g., `us-west-2`
3. `DATABASE_NAME` (Plain text) - e.g., `postgres`
4. `APP_ACCESS_KEY_ID` (Secret) ⚠️ Mark as secret!
5. `APP_SECRET_ACCESS_KEY` (Secret) ⚠️ Mark as secret!
6. `SAGEMAKER_ENDPOINT_NAME` (Plain text) - e.g., `endpoint-quick-start-85saw`

## ✅ Benefits

1. **Build succeeds on Amplify** - No env var access during build
2. **Runtime works perfectly** - Env vars available when needed
3. **Same code works locally and on Amplify** - No environment-specific changes
4. **Better error handling** - Explicit errors when env vars missing
5. **More secure** - Env vars not embedded in build artifacts

## 🧪 Testing

### Test Locally
```bash
npm run dev
# Navigate to http://localhost:3000
# Try uploading a document
# Check terminal for env var logs
```

### Test on Amplify
1. Push changes to GitHub
2. AWS Amplify auto-deploys
3. Wait for build to complete
4. Test the deployed app
5. Check CloudWatch logs if needed

## 📚 Key Principles

### ✅ DO:
- Access `process.env` inside functions (runtime)
- Validate env vars when functions are called
- Use lazy evaluation for all configs

### ❌ DON'T:
- Access `process.env` at module level (during import)
- Run console.logs at module level
- Throw errors at module level for missing env vars

## 🔗 References

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [AWS Amplify Environment Variables](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)

---

**Status**: ✅ Fixed and ready for Amplify deployment
**Date**: November 3, 2025

