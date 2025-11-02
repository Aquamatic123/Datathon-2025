# AWS RDS Database Setup Guide

This guide will help you connect your CRM dashboard to AWS RDS PostgreSQL database.

## Prerequisites

- AWS Account with RDS access
- AWS RDS PostgreSQL instance created
- Database credentials (host, port, username, password)

## Environment Variables

Create a `.env.local` file in the root directory with your AWS RDS connection details:

```env
# Option 1: Use DATABASE_URL (recommended)
DATABASE_URL=postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/crm_dashboard

# Option 2: Use individual parameters
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=crm_dashboard
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL=true
```

### Getting Your RDS Endpoint

1. Go to AWS Console → RDS → Databases
2. Select your PostgreSQL instance
3. Find the **Endpoint** field (e.g., `your-db.abc123.us-east-1.rds.amazonaws.com`)
4. Copy the endpoint and use it as `DB_HOST` or in `DATABASE_URL`

## Database Setup Steps

### Step 1: Create Database Schema

Connect to your RDS instance and run the schema script:

```bash
# Using psql command line
psql -h your-rds-endpoint.region.rds.amazonaws.com -U your_username -d crm_dashboard -f scripts/schema.sql

# Or using AWS RDS Query Editor (in AWS Console)
# Copy and paste the contents of scripts/schema.sql
```

### Step 2: Run Migration Script

Migrate your existing JSON data to PostgreSQL:

```bash
# Set environment variables first
export DATABASE_URL="postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/crm_dashboard"

# Run migration
npx ts-node scripts/migrate-json-to-sql.ts
```

Or add to `package.json`:

```json
{
  "scripts": {
    "migrate": "ts-node scripts/migrate-json-to-sql.ts"
  }
}
```

Then run: `npm run migrate`

### Step 3: Verify Connection

The application will automatically use PostgreSQL when `DATABASE_URL` or `DB_HOST` is set. If not configured, it falls back to JSON files.

To test the connection:

```bash
npm run dev
```

Check the console for:
- ✅ `Connected to PostgreSQL database` - Success!
- ❌ Error messages - Check your environment variables

## Security Best Practices

### SSL Configuration

For AWS RDS, SSL is typically required. Set `DB_SSL=true` in your `.env.local`:

```env
DB_SSL=true
```

### IAM Database Authentication (Optional)

For better security, you can use IAM database authentication:

1. Enable IAM authentication on your RDS instance
2. Create an IAM user with RDS access
3. Generate an auth token:

```bash
aws rds generate-db-auth-token \
  --hostname your-rds-endpoint.region.rds.amazonaws.com \
  --port 5432 \
  --region us-east-1 \
  --username your_iam_user
```

### Environment Variables in Production

For production (AWS App Runner, EC2, etc.):

1. **AWS Systems Manager Parameter Store** (Recommended)
2. **AWS Secrets Manager**
3. **Environment variables in deployment platform**

Example for AWS App Runner:

```yaml
# apprunner.yaml
version: 1.0
runtime: nodejs18
build:
  commands:
    - npm install
    - npm run build
run:
  command: npm start
  env:
    - name: DATABASE_URL
      value: "postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/crm_dashboard"
```

## Troubleshooting

### Connection Timeout

- Check security group rules allow inbound traffic on port 5432
- Verify VPC configuration allows your application to reach RDS
- Check if RDS is in a public subnet or requires VPN

### SSL Connection Error

- Ensure `DB_SSL=true` is set
- For production, download RDS SSL certificate and configure properly

### Migration Errors

- Ensure schema.sql has been run first
- Check database user has CREATE TABLE permissions
- Verify all foreign key constraints are satisfied

### Fallback to JSON

If you see warnings about falling back to JSON:
- Check `.env.local` file exists and has correct values
- Verify environment variables are loaded (restart dev server)
- Check database connection string format

## Database Features

### Automatic Triggers

The schema includes triggers that automatically:
- Update `affected` count when stocks are added/removed
- Recalculate `impact` score based on stock impacts
- Update `updated_at` timestamps

### LLM Data Storage

For storing LLM-generated data:

```typescript
import { storeLLMData } from '@/lib/database-sql';

await storeLLMData('Law1', {
  summary: 'Generated summary text...',
  metadata: {
    model: 'gpt-4',
    tokens: 1500,
    confidence: 0.95
  }
});
```

### Query Examples

See `docs/SQL_MIGRATION_SCHEMA.md` for useful SQL queries.

## Support

For issues:
1. Check AWS RDS console for instance status
2. Review CloudWatch logs
3. Verify security group rules
4. Test connection with `psql` command line tool

