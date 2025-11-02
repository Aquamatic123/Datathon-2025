# Quick Start Guide

## Installation

```bash
npm install
```

## Running the Application

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Example Usage

### Adding a New Law

**Via UI:**
1. Click "Add New Law" button in the header
2. Fill in the form with law details
3. Click "Create Law"
4. Click on the law in the table to add stocks

**Via API:**
```bash
curl -X POST http://localhost:3000/api/laws/Law4 \
  -H "Content-Type: application/json" \
  -d '{
    "jurisdiction": "United States",
    "status": "Pending",
    "sector": "Finance",
    "impact": 7,
    "confidence": "High",
    "published": "2024-03-01",
    "affected": 0,
    "stocks_impacted": {
      "STOCK_IMPACTED": []
    }
  }'
```

### Adding a Stock to a Law

**Via UI:**
1. Click on a law in the table
2. Click "Add Stock" button
3. Fill in stock details
4. Click "Add Stock"

**Via API:**
```bash
curl -X POST "http://localhost:3000/api/laws/Law1?ticker=NVDA" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "NVDA",
    "company_name": "NVIDIA Corporation",
    "sector": "Technology",
    "impact_score": 8,
    "correlation_confidence": "High",
    "notes": "AI chip regulations"
  }'
```

### Getting Analytics

**Via API:**
```bash
curl http://localhost:3000/api/laws?analytics=true
```

### Updating a Law

**Via API:**
```bash
curl -X PUT http://localhost:3000/api/laws/Law1 \
  -H "Content-Type: application/json" \
  -d '{
    "impact": 9,
    "status": "Active"
  }'
```

### Deleting a Law

**Via UI:**
1. Click the trash icon next to a law in the table
2. Confirm deletion

**Via API:**
```bash
curl -X DELETE http://localhost:3000/api/laws/Law1
```

## Data Relationships

- **Laws ↔ Sectors**: Each law belongs to one sector
- **Laws ↔ Stocks**: Many-to-many via `stocks_impacted` array
- **Automatic Updates**:
  - Adding/removing stocks updates `affected` count
  - Stock impact scores influence law's overall `impact`
  - Sector changes propagate to associated stocks

## Environment Variables

The application requires the following environment variables for AWS Aurora DSQL connection:

```bash
AURORA_DSQL_ENDPOINT=your-cluster-endpoint-here
AWS_REGION=us-west-2
DATABASE_NAME=postgres
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Notes

- All impact scores must be between 0-10
- Stock sectors automatically match their law's sector
- The `affected` count is automatically maintained
- Update history is tracked in the `update_history` table in the database
- Database connections use AWS Aurora DSQL authentication tokens

