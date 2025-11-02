# 🚀 Quick Setup Guide - Local PostgreSQL Database

## ⚡ TL;DR - What You Need to Do

### Option 1: Using Docker (Easiest - Recommended!)

**Step 1: Start PostgreSQL with Docker**
```bash
docker-compose up -d postgres
```

**Step 2: Create database schema**
```bash
docker-compose exec postgres psql -U postgres -d crm_dashboard -f /tmp/schema.sql
```

Or copy `scripts/schema.sql` and run it manually:
```bash
# Copy schema.sql into container
docker cp scripts/schema.sql $(docker-compose ps -q postgres):/tmp/schema.sql

# Run it
docker-compose exec postgres psql -U postgres -d crm_dashboard -f /tmp/schema.sql
```

**Step 3: Migrate your data**
```bash
npm run migrate
```

**Step 4: Start the app**
```bash
npm run dev
```

### Option 2: Install PostgreSQL Locally

**Step 1: Install PostgreSQL**

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

**Step 2: Create database**
```bash
createdb crm_dashboard
```

**Step 3: Run schema**
```bash
psql -d crm_dashboard -f scripts/schema.sql
```

**Step 4: Create `.env.local`** (only if not using Docker)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_dashboard
DB_USER=postgres
DB_PASSWORD=your_password
```

**Step 5: Migrate data**
```bash
npm run migrate
```

**Step 6: Start app**
```bash
npm run dev
```

---

## 📋 Complete Checklist

- [ ] PostgreSQL running (Docker or local install)
- [ ] Database schema created (`scripts/schema.sql`)
- [ ] Data migrated (`npm run migrate`)
- [ ] App tested (`npm run dev`)

---

## 🔧 Using Docker Compose (Recommended)

If you want to run both the app and database together:

```bash
# Start everything
docker-compose up

# Or start in background
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f
```

**Note:** For development, you might want to run `npm run dev` locally and only use Docker for PostgreSQL:

```bash
# Start just PostgreSQL
docker-compose up -d postgres

# Run app locally
npm run dev
```

---

## 🐛 Troubleshooting

### "Connection refused" or "Connection timeout"
- **Docker**: Make sure `docker-compose up -d postgres` is running
- **Local**: Check PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)

### "Database does not exist"
- Create it: `createdb crm_dashboard` or `docker-compose exec postgres createdb -U postgres crm_dashboard`

### "Permission denied" or "Authentication failed"
- **Docker**: Use default credentials (user: `postgres`, password: `postgres`)
- **Local**: Check your PostgreSQL user permissions

### Migration script errors
- Make sure schema.sql ran first
- Check database connection in `.env.local`

---

## 📁 File Locations

- **Environment config**: `.env.local` (optional - defaults work for Docker)
- **Database schema**: `scripts/schema.sql`
- **Migration script**: `scripts/migrate-json-to-sql.ts`
- **Docker config**: `docker-compose.yml`

---

## ✅ What's Already Done For You

- ✅ PostgreSQL client library installed (`pg`)
- ✅ Database connection config (`lib/db-config.ts`)
- ✅ SQL adapter layer (`lib/database-sql.ts`)
- ✅ API routes updated for async operations
- ✅ Automatic fallback to JSON if database not configured
- ✅ Migration script ready to use
- ✅ Database schema with triggers and indexes
- ✅ Docker Compose setup for easy PostgreSQL

---

## 🎯 Next Steps After Setup

Once connected, your app will:
- Store all data in PostgreSQL (instead of JSON files)
- Support large datasets from LLM
- Have automatic triggers for data consistency
- Scale efficiently with indexes and connection pooling

**That's it!** The app will automatically use PostgreSQL when it detects the connection.
