// scripts/migrate-json-to-sql.ts
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

// Read database directly
function readDatabase() {
  const DB_PATH = path.join(process.cwd(), 'data', 'database.json');
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { DATA: {} };
  }
}

// Create database connection
const pgPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'crm_dashboard',
  user: process.env.DB_USER || process.env.USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
});

async function migrate() {
  console.log('🔄 Starting migration from JSON to PostgreSQL...');
  console.log('📝 Checking database connection...');
  
  try {
    // Test connection
    await pgPool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL database');
  } catch (error: any) {
    console.error('❌ Cannot connect to PostgreSQL:', error.message);
    console.log('\n💡 Make sure PostgreSQL is running:');
    console.log('   Option 1: docker-compose up -d postgres');
    console.log('   Option 2: Install PostgreSQL locally');
    console.log('   Option 3: Set DATABASE_URL or DB_HOST in .env.local');
    process.exit(1);
  }
  
  // Check if schema exists
  try {
    await pgPool.query('SELECT * FROM laws LIMIT 1');
    console.log('✅ Database schema found');
  } catch (error: any) {
    console.error('❌ Database schema not found!');
    console.log('\n💡 Please run the schema first:');
    console.log('   psql -d crm_dashboard -f scripts/schema.sql');
    console.log('   OR use Docker: docker-compose exec postgres psql -U postgres -d crm_dashboard -f /tmp/schema.sql');
    process.exit(1);
  }
  
  const jsonDb = readDatabase();
  const client = await pgPool.connect();
  
  try {
    await client.query('BEGIN');
    
    let lawsMigrated = 0;
    let stocksMigrated = 0;
    let relationshipsMigrated = 0;
    const uniqueStocks = new Set<string>();
    
    for (const [lawId, law] of Object.entries(jsonDb.DATA)) {
      // Insert law
      await client.query(`
        INSERT INTO laws (id, jurisdiction, status, sector, impact, confidence, published, affected)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          jurisdiction = EXCLUDED.jurisdiction,
          status = EXCLUDED.status,
          sector = EXCLUDED.sector,
          impact = EXCLUDED.impact,
          confidence = EXCLUDED.confidence,
          published = EXCLUDED.published,
          affected = EXCLUDED.affected
      `, [
        lawId,
        law.jurisdiction,
        law.status,
        law.sector,
        law.impact,
        law.confidence,
        law.published,
        law.affected
      ]);
      lawsMigrated++;
      
      // Insert stocks and relationships
      for (const stock of law.stocks_impacted.STOCK_IMPACTED) {
        // Insert/update stock (only count once per unique ticker)
        if (!uniqueStocks.has(stock.ticker)) {
          await client.query(`
            INSERT INTO stocks (ticker, company_name, sector)
            VALUES ($1, $2, $3)
            ON CONFLICT (ticker) DO UPDATE SET
              company_name = EXCLUDED.company_name,
              sector = EXCLUDED.sector
          `, [stock.ticker, stock.company_name, stock.sector]);
          uniqueStocks.add(stock.ticker);
          stocksMigrated++;
        }
        
        // Create relationship
        await client.query(`
          INSERT INTO law_stock_relationships 
            (law_id, stock_ticker, impact_score, correlation_confidence, notes)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (law_id, stock_ticker) DO UPDATE SET
            impact_score = EXCLUDED.impact_score,
            correlation_confidence = EXCLUDED.correlation_confidence,
            notes = EXCLUDED.notes
        `, [lawId, stock.ticker, stock.impact_score, 
            stock.correlation_confidence, stock.notes || '']);
        relationshipsMigrated++;
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n✅ Migration completed successfully!');
    console.log(`   - Laws migrated: ${lawsMigrated}`);
    console.log(`   - Unique stocks migrated: ${stocksMigrated}`);
    console.log(`   - Relationships migrated: ${relationshipsMigrated}`);
    console.log('\n🎉 Your data is now in PostgreSQL!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pgPool.end();
  }
}

// Run migration
migrate().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});
