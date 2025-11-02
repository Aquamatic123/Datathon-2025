// lib/db-config.ts
import { Pool } from 'pg';

// PostgreSQL connection configuration
// Supports both connection string and individual parameters
export const pgPool = new Pool({
  // Option 1: Use DATABASE_URL (recommended)
  connectionString: process.env.DATABASE_URL,
  
  // Option 2: Use individual parameters (fallback)
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'crm_dashboard',
  user: process.env.DB_USER || process.env.USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  
  // Connection pool settings
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // 5 seconds
  
  // SSL configuration (set to true for production/cloud databases)
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
});

// Test database connection
pgPool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pgPool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await pgPool.end();
  console.log('Database pool closed');
  process.exit(0);
});

