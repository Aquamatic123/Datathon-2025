# How to Add a Law with Stocks to Aurora DSQL

## Complete Process

This guide shows how to add a new law with associated stocks to your Aurora DSQL database.

---

## Method 1: Using cURL (Testing)

### Step 1: Create the Law

```bash
curl -X POST http://localhost:3000/api/laws/Law4 \
  -H "Content-Type: application/json" \
  -d '{
    "jurisdiction": "United States",
    "status": "Active",
    "sector": "Finance",
    "impact": 7,
    "confidence": "High",
    "published": "2024-03-15",
    "affected": 0,
    "stocks_impacted": {
      "STOCK_IMPACTED": []
    }
  }'
```

**What this does:**
1. Inserts a new row into the `laws` table with id='Law4'
2. Sets all law properties (jurisdiction, status, sector, etc.)
3. Initial affected=0 (will be updated when stocks are added)

---

### Step 2: Add First Stock to Law4

```bash
curl -X POST 'http://localhost:3000/api/laws/Law4?ticker=JPM' \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "JPM",
    "company_name": "JPMorgan Chase & Co.",
    "sector": "Finance",
    "impact_score": 8,
    "correlation_confidence": "High",
    "notes": "Banking regulation impact"
  }'
```

**What this does:**
1. Inserts/updates `JPM` in the `stocks` table
2. Inserts a row in `law_stock_relationships` table linking Law4 ↔ JPM
3. Updates Law4's `affected` count to 1
4. Recalculates Law4's `impact` score based on stock impacts

---

### Step 3: Add Second Stock to Law4

```bash
curl -X POST 'http://localhost:3000/api/laws/Law4?ticker=BAC' \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "BAC",
    "company_name": "Bank of America Corp.",
    "sector": "Finance",
    "impact_score": 7,
    "correlation_confidence": "Medium",
    "notes": "Consumer banking regulations"
  }'
```

**What this does:**
1. Inserts `BAC` in the `stocks` table
2. Inserts relationship in `law_stock_relationships` table
3. Updates Law4's `affected` count to 2
4. Recalculates Law4's `impact` score (now average of 8 and 7 = 8)

---

### Step 4: Add Third Stock to Law4

```bash
curl -X POST 'http://localhost:3000/api/laws/Law4?ticker=GS' \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "GS",
    "company_name": "Goldman Sachs Group Inc.",
    "sector": "Finance",
    "impact_score": 9,
    "correlation_confidence": "High",
    "notes": "Investment banking regulations"
  }'
```

**What this does:**
1. Inserts `GS` in the `stocks` table
2. Inserts relationship in `law_stock_relationships` table
3. Updates Law4's `affected` count to 3
4. Recalculates Law4's `impact` score (now average of 8, 7, 9 = 8)

---

### Step 5: Verify Law4 with All Stocks

```bash
curl -s http://localhost:3000/api/laws/Law4 | python3 -m json.tool
```

**Expected output:**
```json
{
  "jurisdiction": "United States",
  "status": "Active",
  "sector": "Finance",
  "impact": 8,
  "confidence": "High",
  "published": "2024-03-15",
  "affected": 3,
  "stocks_impacted": {
    "STOCK_IMPACTED": [
      {
        "ticker": "JPM",
        "company_name": "JPMorgan Chase & Co.",
        "sector": "Finance",
        "impact_score": 8,
        "correlation_confidence": "High",
        "notes": "Banking regulation impact"
      },
      {
        "ticker": "BAC",
        "company_name": "Bank of America Corp.",
        "sector": "Finance",
        "impact_score": 7,
        "correlation_confidence": "Medium",
        "notes": "Consumer banking regulations"
      },
      {
        "ticker": "GS",
        "company_name": "Goldman Sachs Group Inc.",
        "sector": "Finance",
        "impact_score": 9,
        "correlation_confidence": "High",
        "notes": "Investment banking regulations"
      }
    ]
  }
}
```

---

## Method 2: Using the UI

### Step 1: Create the Law
1. Open `http://localhost:3000`
2. Click "Add New Law" button
3. Fill in:
   - **Law ID**: Law4
   - **Jurisdiction**: United States
   - **Status**: Active
   - **Sector**: Finance
   - **Impact**: 7
   - **Confidence**: High
   - **Published Date**: 2024-03-15
4. Click "Create Law"

### Step 2: Add Stocks
1. Click on "Law4" in the laws table
2. Click "Add Stock" button
3. Fill in stock details:
   - **Ticker**: JPM
   - **Company Name**: JPMorgan Chase & Co.
   - **Sector**: Finance (auto-filled)
   - **Impact Score**: 8
   - **Correlation Confidence**: High
   - **Notes**: Banking regulation impact
4. Click "Add Stock"
5. Repeat for additional stocks (BAC, GS)

---

## Database Tables Updated

### 1. `laws` table
```sql
INSERT INTO laws (id, jurisdiction, status, sector, impact, confidence, published, affected)
VALUES ('Law4', 'United States', 'Active', 'Finance', 7, 'High', '2024-03-15', 0);
```

### 2. `stocks` table
```sql
INSERT INTO stocks (ticker, company_name, sector)
VALUES 
  ('JPM', 'JPMorgan Chase & Co.', 'Finance'),
  ('BAC', 'Bank of America Corp.', 'Finance'),
  ('GS', 'Goldman Sachs Group Inc.', 'Finance');
```

### 3. `law_stock_relationships` table
```sql
INSERT INTO law_stock_relationships (law_id, stock_ticker, impact_score, correlation_confidence, notes)
VALUES 
  ('Law4', 'JPM', 8, 'High', 'Banking regulation impact'),
  ('Law4', 'BAC', 7, 'Medium', 'Consumer banking regulations'),
  ('Law4', 'GS', 9, 'High', 'Investment banking regulations');
```

### 4. Auto-updates to `laws` table
```sql
UPDATE laws 
SET affected = 3, 
    impact = 8,  -- Average of (8+7+9)/3
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'Law4';
```

---

## How the Data Flows

```
1. Create Law4 in laws table
   └─> law_id: Law4, sector: Finance

2. Add stock JPM
   ├─> INSERT into stocks table (ticker: JPM, sector: Finance)
   └─> INSERT into law_stock_relationships (Law4 ↔ JPM)

3. Add stock BAC
   ├─> INSERT into stocks table (ticker: BAC, sector: Finance)
   └─> INSERT into law_stock_relationships (Law4 ↔ BAC)

4. Add stock GS
   ├─> INSERT into stocks table (ticker: GS, sector: Finance)
   └─> INSERT into law_stock_relationships (Law4 ↔ GS)

5. When fetching Law4:
   ├─> SELECT from laws WHERE id = 'Law4'
   ├─> SELECT from law_stock_relationships WHERE law_id = 'Law4'
   ├─> SELECT from stocks WHERE ticker IN (JPM, BAC, GS)
   └─> JOIN data and return complete law with all stocks
```

---

## Verification Commands

Check each table:

```bash
# Check laws table
curl -s http://localhost:3000/api/laws | python3 -c "import sys, json; data = json.load(sys.stdin); print('Laws:', list(data['DATA'].keys()))"

# Check a specific law with all stocks
curl -s http://localhost:3000/api/laws/Law4 | python3 -m json.tool

# Check analytics (should include new stocks)
curl -s 'http://localhost:3000/api/laws?analytics=true' | python3 -m json.tool

# Debug endpoint to see raw relationships
curl -s http://localhost:3000/api/debug-law1 | python3 -m json.tool
```

---

## Complete Example: Add Law5 with Manufacturing Stocks

```bash
# Step 1: Create the law
curl -X POST http://localhost:3000/api/laws/Law5 \
  -H "Content-Type: application/json" \
  -d '{
    "jurisdiction": "European Union",
    "status": "Pending",
    "sector": "Manufacturing",
    "impact": 6,
    "confidence": "Medium",
    "published": "2024-04-01",
    "affected": 0,
    "stocks_impacted": {"STOCK_IMPACTED": []}
  }'

# Step 2: Add first stock
curl -X POST 'http://localhost:3000/api/laws/Law5?ticker=CAT' \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "CAT",
    "company_name": "Caterpillar Inc.",
    "sector": "Manufacturing",
    "impact_score": 7,
    "correlation_confidence": "High",
    "notes": "Heavy machinery regulations"
  }'

# Step 3: Add second stock
curl -X POST 'http://localhost:3000/api/laws/Law5?ticker=DE' \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "DE",
    "company_name": "Deere & Company",
    "sector": "Manufacturing",
    "impact_score": 6,
    "correlation_confidence": "Medium",
    "notes": "Agricultural equipment impact"
  }'

# Step 4: Add third stock
curl -X POST 'http://localhost:3000/api/laws/Law5?ticker=MMM' \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "MMM",
    "company_name": "3M Company",
    "sector": "Manufacturing",
    "impact_score": 5,
    "correlation_confidence": "Medium",
    "notes": "Industrial manufacturing regulations"
  }'

# Step 5: Verify
curl -s http://localhost:3000/api/laws/Law5 | python3 -m json.tool
```

**Expected Result:**
- Law5 created in `laws` table
- 3 stocks added to `stocks` table (CAT, DE, MMM)
- 3 relationships in `law_stock_relationships` table
- Law5's affected count = 3
- Law5's impact = 6 (average of 7, 6, 5)

---

## What's Actually Happening in Aurora DSQL

### Tables Schema:

**laws table:**
```
id | jurisdiction | status | sector | impact | confidence | published | affected
```

**stocks table:**
```
ticker | company_name | sector
```

**law_stock_relationships table:**
```
law_id | stock_ticker | impact_score | correlation_confidence | notes
```

### Join Query Used:
```sql
-- Get law
SELECT * FROM laws WHERE id = 'Law4';

-- Get relationships
SELECT * FROM law_stock_relationships WHERE law_id = 'Law4';

-- Get stocks
SELECT * FROM stocks WHERE ticker IN ('JPM', 'BAC', 'GS');

-- Application joins them together to create the nested structure
```

---

## All Data Stored in Aurora DSQL ✓

- ✓ No mock data
- ✓ No JSON files
- ✓ All data in PostgreSQL database
- ✓ Relational integrity maintained
- ✓ JOIN queries work correctly
- ✓ All stocks fetched through relationships table

The system is clean and fully connected to Aurora DSQL!

