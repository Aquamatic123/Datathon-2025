# ✅ Complete Guide: Add Law with Stocks to Aurora DSQL

## Current Database State (Verified)

- **Law1** (Clean Energy): 4 stocks - AAPL, ENPH, RUN, TSLA
- **Law2** (Technology): 3 stocks - GOOGL, MSFT, NVDA
- **Law3** (Healthcare): 3 stocks - JNJ, PFE, UNH

All stocks are now correctly fetched through the relational database! ✓

---

## Complete Example: Add Law4 (Finance Sector) with 3 Stocks

### Step 1: Create the Law in `laws` table

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

**Database Operation:**
```sql
INSERT INTO laws (id, jurisdiction, status, sector, impact, confidence, published, affected, created_at, updated_at)
VALUES ('Law4', 'United States', 'Active', 'Finance', 7, 'High', '2024-03-15', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

**Expected Response:**
```json
{
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
}
```

---

### Step 2: Add First Stock (JPM)

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

**Database Operations:**
```sql
-- 1. Insert/update stock in stocks table
INSERT INTO stocks (ticker, company_name, sector, created_at, updated_at)
VALUES ('JPM', 'JPMorgan Chase & Co.', 'Finance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. Create relationship in law_stock_relationships table
INSERT INTO law_stock_relationships (law_id, stock_ticker, impact_score, correlation_confidence, notes, created_at, updated_at)
VALUES ('Law4', 'JPM', 8, 'High', 'Banking regulation impact', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. Update law metrics
UPDATE laws SET affected = 1, impact = 8, updated_at = CURRENT_TIMESTAMP WHERE id = 'Law4';
```

---

### Step 3: Add Second Stock (BAC)

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

**Database Operations:**
```sql
-- 1. Insert stock
INSERT INTO stocks (ticker, company_name, sector, created_at, updated_at)
VALUES ('BAC', 'Bank of America Corp.', 'Finance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. Create relationship
INSERT INTO law_stock_relationships (law_id, stock_ticker, impact_score, correlation_confidence, notes, created_at, updated_at)
VALUES ('Law4', 'BAC', 7, 'Medium', 'Consumer banking regulations', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. Update law metrics (affected=2, impact=avg(8,7)=8)
UPDATE laws SET affected = 2, impact = 8, updated_at = CURRENT_TIMESTAMP WHERE id = 'Law4';
```

---

### Step 4: Add Third Stock (GS)

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

**Database Operations:**
```sql
-- 1. Insert stock
INSERT INTO stocks (ticker, company_name, sector, created_at, updated_at)
VALUES ('GS', 'Goldman Sachs Group Inc.', 'Finance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. Create relationship
INSERT INTO law_stock_relationships (law_id, stock_ticker, impact_score, correlation_confidence, notes, created_at, updated_at)
VALUES ('Law4', 'GS', 9, 'High', 'Investment banking regulations', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. Update law metrics (affected=3, impact=avg(8,7,9)=8)
UPDATE laws SET affected = 3, impact = 8, updated_at = CURRENT_TIMESTAMP WHERE id = 'Law4';
```

---

### Step 5: Verify Law4 with All Stocks

```bash
curl -s http://localhost:3000/api/laws/Law4 | python3 -m json.tool
```

**Expected Result:**
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
      },
      {
        "ticker": "JPM",
        "company_name": "JPMorgan Chase & Co.",
        "sector": "Finance",
        "impact_score": 8,
        "correlation_confidence": "High",
        "notes": "Banking regulation impact"
      }
    ]
  }
}
```

---

## All-in-One: Copy & Paste This Block

```bash
# Create Law4
curl -X POST http://localhost:3000/api/laws/Law4 \
  -H "Content-Type: application/json" \
  -d '{"jurisdiction":"United States","status":"Active","sector":"Finance","impact":7,"confidence":"High","published":"2024-03-15","affected":0,"stocks_impacted":{"STOCK_IMPACTED":[]}}'

# Add JPM
curl -X POST 'http://localhost:3000/api/laws/Law4?ticker=JPM' \
  -H "Content-Type: application/json" \
  -d '{"ticker":"JPM","company_name":"JPMorgan Chase & Co.","sector":"Finance","impact_score":8,"correlation_confidence":"High","notes":"Banking regulation impact"}'

# Add BAC
curl -X POST 'http://localhost:3000/api/laws/Law4?ticker=BAC' \
  -H "Content-Type: application/json" \
  -d '{"ticker":"BAC","company_name":"Bank of America Corp.","sector":"Finance","impact_score":7,"correlation_confidence":"Medium","notes":"Consumer banking regulations"}'

# Add GS
curl -X POST 'http://localhost:3000/api/laws/Law4?ticker=GS' \
  -H "Content-Type: application/json" \
  -d '{"ticker":"GS","company_name":"Goldman Sachs Group Inc.","sector":"Finance","impact_score":9,"correlation_confidence":"High","notes":"Investment banking regulations"}'

# Verify
curl -s http://localhost:3000/api/laws/Law4 | python3 -m json.tool
```

---

## Database State After Adding Law4

### `laws` table
```
id    | jurisdiction      | status | sector  | impact | confidence | published  | affected
------|-------------------|--------|---------|--------|------------|------------|----------
Law1  | United States     | Active | Clean Energy | 8    | High     | 2024-01-15 | 4
Law2  | European Union    | Pending| Technology   | 7    | Medium   | 2024-02-20 | 3
Law3  | United States     | Active | Healthcare   | 7    | High     | 2024-01-10 | 3
Law4  | United States     | Active | Finance      | 8    | High     | 2024-03-15 | 3
```

### `stocks` table (new entries)
```
ticker | company_name              | sector
-------|---------------------------|--------
JPM    | JPMorgan Chase & Co.      | Finance
BAC    | Bank of America Corp.     | Finance
GS     | Goldman Sachs Group Inc.  | Finance
```

### `law_stock_relationships` table (new entries)
```
law_id | stock_ticker | impact_score | correlation_confidence | notes
-------|--------------|--------------|------------------------|-------------------------
Law4   | JPM          | 8            | High                   | Banking regulation impact
Law4   | BAC          | 7            | Medium                 | Consumer banking regulations
Law4   | GS           | 9            | High                   | Investment banking regulations
```

---

## How the System Fetches Data

When you call `/api/laws/Law4`, the system:

1. **Queries `laws` table:**
   ```sql
   SELECT * FROM laws WHERE id = 'Law4'
   ```

2. **Queries `law_stock_relationships` table:**
   ```sql
   SELECT * FROM law_stock_relationships WHERE law_id = 'Law4'
   ```
   Returns: JPM, BAC, GS

3. **Queries `stocks` table with JOIN:**
   ```sql
   SELECT ticker, company_name, sector 
   FROM stocks 
   WHERE ticker = ANY(ARRAY['JPM', 'BAC', 'GS']::text[])
   ```

4. **Combines the data:**
   - Matches each relationship with its stock details
   - Builds the nested `stocks_impacted.STOCK_IMPACTED` structure
   - Returns complete law with all stock information

---

## System is Clean ✓

- ✓ No mock data
- ✓ No JSON files
- ✓ All data in Aurora DSQL
- ✓ All stocks fetched through JOIN queries
- ✓ Relational integrity maintained
- ✓ Law1 now correctly shows all 4 stocks

The system fetches **every single stock** from the `law_stock_relationships` table and joins with the `stocks` table to get complete information.

---

## Quick Test: Verify All Laws

```bash
# Check all laws with their stock counts
curl -s http://localhost:3000/api/check-database | python3 -c "
import sys, json
data = json.load(sys.stdin)['data']
print('Current Database State:')
for law_id, rels in data['relationshipsByLaw'].items():
    print(f'  {law_id}: {len(rels)} stocks -> {[r[\"stock_ticker\"] for r in rels]}')
"
```

This will show you exactly how many stocks each law has in the relational database.

