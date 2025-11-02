# Regulatory Impact CRM Dashboard

A professional CRM dashboard for tracking and analyzing the impact of laws and regulations on financial markets. Built with Next.js, TypeScript, and a JSON-based mock database that's designed for seamless migration to SQL.

## Features

- **Complete CRUD Operations**: Create, read, update, and delete laws, stocks, and their relationships
- **Data Relationship Management**: Bi-directional linking between laws, sectors, and stocks with automatic validation
- **Analytics Dashboard**: Real-time calculations for:
  - Total laws tracked
  - Stocks impacted
  - SP500 affected percentage
  - Confidence-weighted impact scores
  - Average impact by sector
- **Professional UI**: Modern, responsive dashboard with data tables, charts, and modals
- **Data Consistency**: Automatic validation and relationship maintenance
- **Update History**: Tracks all changes with timestamps and notes

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (AWS RDS) with automatic JSON fallback

## Project Structure

```
datathon/
├── components/          # React components
│   ├── DashboardHeader.tsx
│   ├── AnalyticsCards.tsx
│   ├── LawsTable.tsx
│   ├── LawDetailsModal.tsx
│   ├── AddLawModal.tsx
│   └── SectorChart.tsx
├── lib/                # Backend utilities
│   └── database.ts     # Database operations & CRUD logic
├── pages/              # Next.js pages
│   ├── api/           # API routes
│   │   └── laws/      # Laws API endpoints
│   └── index.tsx      # Dashboard page
├── types/              # TypeScript type definitions
│   └── index.ts
├── data/               # JSON database files
│   ├── database.json   # Main database
│   └── history.json    # Update history
└── docs/               # Documentation
    └── SQL_MIGRATION_SCHEMA.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

### Get All Laws
```
GET /api/laws
```

### Get Specific Law
```
GET /api/laws/[lawId]
```

### Get Analytics
```
GET /api/laws?analytics=true
```

### Get All Sectors
```
GET /api/laws?sectors=true
```

### Get Stocks by Sector
```
GET /api/laws?sector=[sectorName]
```

### Create Law
```
POST /api/laws/[lawId]
Body: { jurisdiction, status, sector, impact, confidence, published, affected, stocks_impacted }
```

### Update Law
```
PUT /api/laws/[lawId]
Body: { ...partial law data }
```

### Delete Law
```
DELETE /api/laws/[lawId]
```

### Add Stock to Law
```
POST /api/laws/[lawId]?ticker=[ticker]
Body: { ticker, company_name, sector, impact_score, correlation_confidence, notes }
```

### Update Stock in Law
```
PUT /api/laws/[lawId]?ticker=[ticker]
Body: { ...partial stock data }
```

### Remove Stock from Law
```
DELETE /api/laws/[lawId]?ticker=[ticker]
```

## Data Model

### Law Structure
```json
{
  "DATA": {
    "Law1": {
      "jurisdiction": "United States",
      "status": "Active",
      "sector": "Clean Energy",
      "impact": 8,
      "confidence": "High",
      "published": "2024-01-15",
      "affected": 12,
      "stocks_impacted": {
        "STOCK_IMPACTED": [
          {
            "ticker": "TSLA",
            "company_name": "Tesla Inc.",
            "sector": "Clean Energy",
            "impact_score": 9,
            "correlation_confidence": "High",
            "notes": "Direct beneficiary of clean energy subsidies"
          }
        ]
      }
    }
  }
}
```

## Data Relationships

- **Laws ↔ Sectors**: Each law belongs to one sector
- **Laws ↔ Stocks**: Many-to-many relationship via `stocks_impacted` array
- **Stocks ↔ Sectors**: Each stock belongs to one sector (must match law's sector)
- **Automatic Updates**: 
  - Adding/removing stocks updates the law's `affected` count
  - Stock impact scores influence the law's overall `impact` score
  - Sector changes propagate to associated stocks

## Data Validation

- Impact scores must be between 0-10
- Status must be: Active, Pending, or Expired
- Confidence must be: High, Medium, or Low
- Stock sectors automatically match their law's sector
- Affected count automatically matches stock count

## Database Setup

### PostgreSQL Database (Recommended)

The app now supports PostgreSQL for production use with large LLM-generated datasets.

**Quick Setup with Docker:**
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run schema
docker cp scripts/schema.sql $(docker-compose ps -q postgres):/tmp/schema.sql
docker-compose exec postgres psql -U postgres -d crm_dashboard -f /tmp/schema.sql

# Migrate data
npm run migrate
```

**Or install PostgreSQL locally:**
1. Install PostgreSQL (see `SETUP.md`)
2. Run `scripts/schema.sql` on your database
3. Run `npm run migrate` to migrate existing data
4. Start the app - it automatically uses PostgreSQL!

**See `SETUP.md` for complete setup instructions.**

### JSON Fallback

If no database is configured, the app automatically falls back to JSON files (`data/database.json`). This makes development easy and migration seamless.

### Documentation

- **Quick Start**: `QUICK_START.md` - Simple setup guide
- **Setup Guide**: `SETUP.md` - Complete setup instructions
- **SQL Schema**: `docs/SQL_MIGRATION_SCHEMA.md` - Complete database schema reference

## Usage Examples

### Adding a New Law

1. Click "Add New Law" button
2. Fill in the form:
   - Law ID (e.g., "Law4")
   - Jurisdiction (e.g., "European Union")
   - Status (Active/Pending/Expired)
   - Sector (e.g., "Finance")
   - Impact (0-10)
   - Confidence (High/Medium/Low)
   - Published Date
3. Click "Create Law"
4. Add stocks later by clicking on the law in the table

### Viewing Law Details

1. Click any row in the laws table
2. View all law information and impacted stocks
3. Edit law details or add/remove stocks from the modal

### Analytics

The dashboard automatically displays:
- Total number of laws
- Number of unique stocks impacted
- SP500 affected percentage (based on 500 total stocks)
- Confidence-weighted average impact score
- Average impact by sector (chart)

## Development

### Building for Production

```bash
npm run build
npm start
```

### Code Structure

- **`lib/database.ts`**: All database operations, validation, and relationship logic
- **`components/`**: Reusable React components
- **`pages/api/`**: Next.js API route handlers
- **`types/index.ts`**: TypeScript type definitions

## Future Enhancements

- [ ] Search and filtering functionality
- [ ] Export to CSV/Excel
- [ ] Advanced analytics and forecasting
- [ ] User authentication and permissions
- [ ] Real-time updates via WebSockets
- [ ] Bulk import/export capabilities
- [ ] Timeline visualization of law changes
- [ ] Stock performance correlation analysis

## License

MIT

