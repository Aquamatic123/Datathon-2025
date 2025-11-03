# Regulatory Impact CRM Dashboard

A Next.js CRM dashboard for tracking and analyzing the impact of laws and regulations on S&P 500 stocks, powered by AWS Aurora DSQL and AWS SageMaker.

## Features

- **AI-Powered Document Upload**: Upload legal documents (HTML, XML, TXT, PDF) - AI extracts jurisdiction, sector, impact, and confidence
- **Automatic Stock Linking**: When a law is created, all S&P 500 stocks from the same sector are automatically linked
- **S&P 500 Stock Database**: 392+ hardcoded S&P 500 stocks organized by sector (Technology, Healthcare, Financial Services, Energy, etc.)
- **Real-Time Analytics**: Dashboard showing total laws, stocks impacted, sector breakdowns, and confidence-weighted impact scores
- **CRUD Operations**: Full create, read, update, delete for laws and stock relationships

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: AWS Aurora DSQL (PostgreSQL-compatible) with token-based authentication
- **AI**: AWS SageMaker for document analysis and data extraction

## Quick Start

### Prerequisites

- Node.js 18+
- AWS Account with Aurora DSQL cluster and SageMaker endpoint

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables** (create `.env.local`):
```bash
AURORA_DSQL_ENDPOINT=your-cluster-endpoint
APP_REGION=us-west-2
DATABASE_NAME=postgres
APP_ACCESS_KEY_ID=your-access-key
APP_SECRET_ACCESS_KEY=your-secret-key
SAGEMAKER_ENDPOINT_NAME=your-endpoint-name
```

3. **Populate S&P 500 stocks:**
```bash
curl -X POST http://localhost:3000/api/populate-sp500
```

4. **Start development server:**
```bash
npm run dev
```

5. **Open** [http://localhost:3000](http://localhost:3000)

## Key Features

### Document Upload
- Upload legal documents (HTML, XML, TXT, PDF)
- AI extracts: jurisdiction, sector, status, impact (0-10), confidence, summary
- Automatically links all S&P 500 stocks from the extracted sector

### Stock Management
- **Hardcoded S&P 500 Stocks**: 392+ stocks across 10 sectors:
  - Technology (~60 stocks)
  - Financial Services (~40 stocks)
  - Healthcare (~50 stocks)
  - Energy (~35 stocks)
  - Clean Energy (~30 stocks)
  - Transportation (~28 stocks)
  - Retail (~45 stocks)
  - Manufacturing (~33 stocks)
  - Agriculture (~18 stocks)
  - General (~53 stocks)

### Automatic Stock Linking
When a law is uploaded with sector "Technology":
- System queries all Technology stocks from S&P 500 database
- Creates entries in `law_stock_relationships` for each stock
- Updates the `affected` counter automatically

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/laws` | Get all laws with analytics |
| `GET` | `/api/laws/[lawId]` | Get specific law with stocks |
| `POST` | `/api/upload-document` | Upload document, extract data, create law |
| `POST` | `/api/populate-sp500` | Populate S&P 500 stocks database |
| `PUT` | `/api/laws/[lawId]` | Update law |
| `DELETE` | `/api/laws/[lawId]` | Delete law |

## Database Schema

### Tables
- **`laws`**: `id`, `jurisdiction`, `status`, `sector`, `impact`, `confidence`, `published`, `affected`
- **`stocks`**: `ticker`, `company_name`, `sector`
- **`law_stock_relationships`**: `law_id`, `stock_ticker`, `impact_score`, `correlation_confidence`, `notes`

### Relationships
- **Laws ↔ Stocks**: Many-to-many via `law_stock_relationships`
- **Sector Matching**: Stocks are linked based on matching `sector` field

## Deployment (AWS Amplify)

1. Push code to GitHub repository
2. Connect repository to AWS Amplify
3. Configure environment variables in Amplify Console:
   - `AURORA_DSQL_ENDPOINT`
   - `APP_REGION`
   - `DATABASE_NAME`
   - `APP_ACCESS_KEY_ID` (mark as secret)
   - `APP_SECRET_ACCESS_KEY` (mark as secret)
   - `SAGEMAKER_ENDPOINT_NAME`
4. Deploy - Amplify will build and deploy automatically

## Environment Variables

All variables are required:

```bash
AURORA_DSQL_ENDPOINT=your-cluster-endpoint.dsql.region.on.aws
APP_REGION=us-west-2
DATABASE_NAME=postgres
APP_ACCESS_KEY_ID=AKIA...
APP_SECRET_ACCESS_KEY=your-secret-key
SAGEMAKER_ENDPOINT_NAME=endpoint-name (not ARN or URL)
```

## Important Notes

- **Sector Matching**: Law sectors must match exactly with stock sectors (case-sensitive)
- **Valid Sectors**: Technology, Financial Services, Healthcare, Energy, Clean Energy, Transportation, Agriculture, Manufacturing, Retail, General
- **Auto-Linking**: Stocks are automatically linked when laws are created via document upload
- **Stock Population**: Run `/api/populate-sp500` endpoint first to populate S&P 500 stocks

## License

MIT
