# Database Seeding Instructions

## Overview

Your application now includes a database seeding endpoint that populates Aurora DSQL with test data.

## How to Seed the Database

### Method 1: Using the API endpoint

```bash
curl -X POST http://localhost:3000/api/seed-database
```

This will:
1. Insert 10 stocks across 3 sectors (Clean Energy, Technology, Healthcare)
2. Create relationships linking stocks to laws
3. Update law metrics (affected count and impact scores)

### Method 2: From the browser

Navigate to: `http://localhost:3000/api/seed-database` (POST request required, use Postman or similar)

## What Gets Seeded

### Stocks (10 total)

**Clean Energy Sector:**
- TSLA - Tesla Inc.
- ENPH - Enphase Energy Inc.
- RUN - Sunrun Inc.

**Technology Sector:**
- NVDA - NVIDIA Corporation
- MSFT - Microsoft Corporation
- GOOGL - Alphabet Inc.

**Healthcare Sector:**
- JNJ - Johnson & Johnson
- PFE - Pfizer Inc.
- UNH - UnitedHealth Group

### Law-Stock Relationships (9 total)

**Law1 (Clean Energy):**
- TSLA: Impact 9/10, High confidence
- ENPH: Impact 8/10, High confidence
- RUN: Impact 7/10, Medium confidence

**Law2 (Technology):**
- NVDA: Impact 8/10, High confidence
- MSFT: Impact 7/10, Medium confidence
- GOOGL: Impact 6/10, Medium confidence

**Law3 (Healthcare):**
- JNJ: Impact 7/10, High confidence
- PFE: Impact 8/10, High confidence
- UNH: Impact 6/10, Medium confidence

## Expected Results

After seeding, your database will have:
- 3 laws (already existed)
- 10 stocks (newly added)
- 9 relationships (newly added)
- Updated impact scores based on stock averages

## Verification

Check that data was seeded correctly:

```bash
# Get all laws with stocks
curl http://localhost:3000/api/laws

# Get analytics
curl 'http://localhost:3000/api/laws?analytics=true'

# Get specific law with stocks
curl http://localhost:3000/api/laws/Law1
```

## View in UI

1. Start the application: `npm run dev`
2. Open: `http://localhost:3000`
3. You should see:
   - Analytics cards showing 3 laws, 10 stocks
   - Laws table with affected counts (3 stocks each)
   - Click on any law to see stock details

## Notes

- The seeding script is idempotent (safe to run multiple times)
- It checks for existing data before inserting
- All data follows the Aurora DSQL schema constraints
- Stocks are linked to laws through the `law_stock_relationships` table

## Troubleshooting

If seeding fails:
1. Check console logs for detailed error messages
2. Verify Aurora DSQL connection: `curl http://localhost:3000/api/test-connection`
3. Check environment variables are set correctly
4. Ensure AWS credentials have proper permissions

