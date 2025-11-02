# Regulatory Impact CRM Dashboard

A professional CRM dashboard for tracking and analyzing the impact of laws and regulations on financial markets. Built with Next.js, TypeScript, and AWS Aurora DSQL.

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
- **Database**: AWS Aurora DSQL (PostgreSQL-compatible) with token-based authentication

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
├── lib/                # Backend utilities
│   ├── database.ts     # Database operations & CRUD logic (SQL-based)
│   └── db-connection.ts # AWS Aurora DSQL connection & token management
└── docs/               # Documentation
    └── SQL_MIGRATION_SCHEMA.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- AWS Account with Aurora DSQL cluster
- AWS credentials configured (via IAM role or environment variables)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (create `.env.local`):
```bash
AURORA_DSQL_ENDPOINT=your-cluster-endpoint-here
AWS_REGION=us-west-2
DATABASE_NAME=postgres
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

3. Ensure your database has the required tables:
   - `laws` table (see `scripts/create-relationship-table.sql` and schema documentation)
   - `stocks` table
   - `law_stock_relationships` table
   - `update_history` table (optional)

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

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

## Database Schema

The application uses AWS Aurora DSQL with the following tables:

### Tables
- `laws`: Stores law information (id, jurisdiction, status, sector, impact, confidence, published, affected)
- `stocks`: Stores stock information (ticker, company_name, sector)
- `law_stock_relationships`: Links laws to stocks (law_id, stock_ticker, impact_score, correlation_confidence, notes)

See `docs/SQL_MIGRATION_SCHEMA.md` for complete schema details.

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

## Database Schema

The application uses AWS Aurora DSQL (PostgreSQL-compatible). See `docs/SQL_MIGRATION_SCHEMA.md` for:
- Complete SQL schema
- Table creation scripts
- Relationship diagrams
- Useful queries
- Data consistency triggers

The connection uses AWS Aurora DSQL token-based authentication via `@aws-sdk/dsql-signer`, which automatically refreshes tokens before expiration.

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

- **`lib/db-connection.ts`**: Aurora DSQL connection and token management
- **`lib/database.ts`**: All database CRUD operations using SQL queries
- **`components/`**: Reusable React components
- **`pages/api/`**: Next.js API route handlers
- **`types/index.ts`**: TypeScript type definitions

## Testing Connection

Test your Aurora DSQL connection:
```bash
curl http://localhost:3000/api/test-connection
```

This endpoint verifies:
- AWS credentials are configured correctly
- Token generation is working
- Database connection is successful
- Required tables exist

## Seed Test Data

Populate your database with test data:
```bash
curl -X POST http://localhost:3000/api/seed-database
```

This adds:
- 10 stocks across 3 sectors (Clean Energy, Technology, Healthcare)
- 9 law-stock relationships
- Updates law metrics automatically

See `SEED_DATABASE_INSTRUCTIONS.md` for details.

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

