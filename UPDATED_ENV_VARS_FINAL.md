# 🎯 FINAL Environment Variables for AWS Amplify

## All 6 Environment Variables

### Required for Aurora DSQL (5 variables):

1. **AURORA_DSQL_ENDPOINT**
   - Value: `dbtjczatkd7mblohlvaxccqpg4.dsql.us-west-2.on.aws`
   - Secret: NO
   - Purpose: Aurora DSQL cluster hostname

2. **APP_REGION**
   - Value: `us-west-2`
   - Secret: NO
   - Purpose: AWS region for all services

3. **DATABASE_NAME**
   - Value: `postgres`
   - Secret: NO
   - Purpose: Database name to connect to

4. **APP_ACCESS_KEY_ID**
   - Value: `AKIA6ODVAJ2DK6HO7M6I`
   - Secret: **YES** ✓
   - Purpose: AWS access key for authentication

5. **APP_SECRET_ACCESS_KEY**
   - Value: `[your-secret-access-key]`
   - Secret: **YES** ✓
   - Purpose: AWS secret key for authentication

### Optional for AI Document Upload (1 variable):

6. **SAGEMAKER_ENDPOINT_NAME**
   - Value: `endpoint-quick-start-85saw`
   - Secret: NO
   - Purpose: SageMaker endpoint for AI document extraction

---

## Copy-Paste for Amplify Console

```
Name: AURORA_DSQL_ENDPOINT
Value: dbtjczatkd7mblohlvaxccqpg4.dsql.us-west-2.on.aws
Secret: NO

Name: APP_REGION
Value: us-west-2
Secret: NO

Name: DATABASE_NAME
Value: postgres
Secret: NO

Name: APP_ACCESS_KEY_ID
Value: AKIA6ODVAJ2DK6HO7M6I
Secret: YES ✓

Name: APP_SECRET_ACCESS_KEY
Value: [your-secret-key]
Secret: YES ✓

Name: SAGEMAKER_ENDPOINT_NAME
Value: endpoint-quick-start-85saw
Secret: NO
```

---

## Your .env.local File Should Contain:

```env
AURORA_DSQL_ENDPOINT=dbtjczatkd7mblohlvaxccqpg4.dsql.us-west-2.on.aws
APP_REGION=us-west-2
DATABASE_NAME=postgres
APP_ACCESS_KEY_ID=AKIA6ODVAJ2DK6HO7M6I
APP_SECRET_ACCESS_KEY=your-actual-secret-key-here
SAGEMAKER_ENDPOINT_NAME=endpoint-quick-start-85saw
```

---

## IAM Permissions Required

Your AWS access key needs these permissions:

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

---

## Features Enabled by Variables

### With Basic 5 Variables:
- ✅ View laws from Aurora DSQL
- ✅ Create laws manually
- ✅ Update laws
- ✅ Delete laws
- ✅ Add stocks to laws
- ✅ View analytics

### With All 6 Variables:
- ✅ All above features
- ✅ **Upload documents (PDF, HTML, XML, TXT)**
- ✅ **AI-powered data extraction**
- ✅ **Automatic law creation from documents**

---

## What Changed

**Variable names updated from AWS SDK defaults to custom APP_* names:**

| Old | New | Why? |
|-----|-----|------|
| `AWS_ACCESS_KEY_ID` | `APP_ACCESS_KEY_ID` | Your preference |
| `AWS_SECRET_ACCESS_KEY` | `APP_SECRET_ACCESS_KEY` | Your preference |
| `AWS_REGION` | `APP_REGION` | Your preference |

**Code updated to handle custom names:**
- `lib/db-connection.ts` now explicitly passes credentials to AWS SDK
- `lib/sagemaker-client.ts` uses same credentials
- All documentation updated with new variable names

---

## Deployment Checklist

- [ ] Add all 6 variables in Amplify Console
- [ ] Mark `APP_ACCESS_KEY_ID` as Secret
- [ ] Mark `APP_SECRET_ACCESS_KEY` as Secret  
- [ ] Verify IAM permissions include both DSQL and SageMaker
- [ ] Push updated code to Git
- [ ] Redeploy on Amplify
- [ ] Test upload feature with test documents

---

## New Features Added

1. **Document Upload API** (`/api/upload-document`)
   - Accepts PDF, HTML, XML, TXT files
   - Parses to extract text
   - Sends to SageMaker AI
   - Creates law in database

2. **Document Parser** (`lib/document-parser.ts`)
   - Handles multiple file formats
   - Extracts clean text
   - Truncates long documents

3. **SageMaker Client** (`lib/sagemaker-client.ts`)
   - Connects to your SageMaker endpoint
   - Sends prompts to AI model
   - Parses AI responses

4. **Upload UI** (`components/UploadDocumentModal.tsx`)
   - Drag & drop interface
   - File validation
   - Progress feedback
   - Result display

---

## Test Documents Included

I created 2 test documents in `test-documents/`:

1. **example-law.html** - Digital Privacy Protection Act
2. **example-law.txt** - Financial Services Reform Act

Use these to test the upload feature!

---

## 🚀 Ready to Deploy!

Everything is configured for AWS Amplify with AI document upload:

✅ Environment variables updated (6 total)  
✅ Code updated to use APP_* variables  
✅ SageMaker integration complete  
✅ Document upload UI created  
✅ Multiple file formats supported  
✅ All documentation updated  

**Next step:** Add the 6 environment variables in Amplify and deploy!

