# Database Setup Instructions

Docker is not installed on your system. Here are your options:

## Option 1: Install Docker Desktop (Recommended)

1. **Download Docker Desktop for Mac:**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Download and install Docker Desktop
   - Open Docker Desktop and wait for it to start

2. **Then run:**
   ```bash
   docker-compose up -d postgres
   docker cp scripts/schema.sql $(docker-compose ps -q postgres):/tmp/schema.sql
   docker-compose exec postgres psql -U postgres -d crm_dashboard -f /tmp/schema.sql
   npm run migrate
   ```

## Option 2: Install PostgreSQL Locally

**Install PostgreSQL:**
```bash
brew install postgresql@15
```

**Start PostgreSQL:**
```bash
brew services start postgresql@15
```

**Create database:**
```bash
createdb crm_dashboard
```

**Run schema:**
```bash
psql -d crm_dashboard -f scripts/schema.sql
```

**Migrate data:**
```bash
npm run migrate
```

## Option 3: Use Cloud Database (Free Tier)

You can use a free PostgreSQL service like:
- **Supabase** (free tier): https://supabase.com
- **Neon** (free tier): https://neon.tech
- **Railway** (free tier): https://railway.app

Then create `.env.local` with your connection string:
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

And run:
```bash
npm run migrate
```

---

**Which option would you like to use?** I can help you set it up once you choose!

