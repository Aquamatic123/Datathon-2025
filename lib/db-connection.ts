import { DsqlSigner } from '@aws-sdk/dsql-signer';
import { Client } from 'pg';

// Environment variables
const RAW_ENDPOINT = process.env.AURORA_DSQL_ENDPOINT!;
const APP_REGION = process.env.APP_REGION || 'us-west-2';
const DATABASE_NAME = process.env.DATABASE_NAME || 'postgres';
const APP_ACCESS_KEY_ID = process.env.APP_ACCESS_KEY_ID!;
const APP_SECRET_ACCESS_KEY = process.env.APP_SECRET_ACCESS_KEY!;

// Extract hostname from endpoint (remove any query parameters or paths)
function extractHostname(endpoint: string): string {
  if (!endpoint) return endpoint;
  
  // Remove protocol if present
  let cleaned = endpoint.replace(/^https?:\/\//, '');
  
  // Remove query string if present (everything after ?)
  cleaned = cleaned.split('?')[0];
  
  // Remove path if present (everything after /)
  cleaned = cleaned.split('/')[0];
  
  return cleaned;
}

const CLUSTER_ENDPOINT = extractHostname(RAW_ENDPOINT);

console.log('\n🔧 Aurora DSQL Configuration:');
console.log('  - Raw Endpoint:', RAW_ENDPOINT || 'NOT SET');
console.log('  - Cleaned Hostname:', CLUSTER_ENDPOINT);
console.log('  - APP_REGION:', APP_REGION);
console.log('  - DATABASE_NAME:', DATABASE_NAME);
console.log('  - APP_ACCESS_KEY_ID:', APP_ACCESS_KEY_ID ? '✓ Set' : '✗ Not set');
console.log('  - APP_SECRET_ACCESS_KEY:', APP_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Not set\n');

if (!CLUSTER_ENDPOINT) {
  throw new Error('AURORA_DSQL_ENDPOINT environment variable is required');
}

if (!APP_ACCESS_KEY_ID || !APP_SECRET_ACCESS_KEY) {
  throw new Error('APP_ACCESS_KEY_ID and APP_SECRET_ACCESS_KEY environment variables are required');
}

/**
 * Generate Aurora DSQL authentication token
 */
async function generateAuthToken(): Promise<string> {
  console.log('🔑 Generating Aurora DSQL authentication token...');
  console.log('  - Using hostname:', CLUSTER_ENDPOINT);
  console.log('  - Using region:', APP_REGION);
  console.log('  - Using access key:', APP_ACCESS_KEY_ID.substring(0, 8) + '...');
  
  const signer = new DsqlSigner({
    hostname: CLUSTER_ENDPOINT,
    region: APP_REGION,
    // Explicitly provide credentials since we're using APP_* variable names
    credentials: {
      accessKeyId: APP_ACCESS_KEY_ID,
      secretAccessKey: APP_SECRET_ACCESS_KEY,
    }
  });

  try {
    const token = await signer.getDbConnectAdminAuthToken();
    console.log('✓ Token generated successfully (length:', token.length, 'chars)');
    return token;
  } catch (error) {
    console.error('✗ Failed to generate token:', error);
    throw error;
  }
}

/**
 * Connect to Aurora DSQL database
 */
export async function connectToDatabase(): Promise<Client> {
  console.log('\n🔌 Connecting to Aurora DSQL...');
  
  const token = await generateAuthToken();
  
  const client = new Client({
    host: CLUSTER_ENDPOINT,
    port: 5432,
    user: 'admin',
    password: token,
    database: DATABASE_NAME,
    ssl: { rejectUnauthorized: true }
  });

  console.log('  - Host:', CLUSTER_ENDPOINT);
  console.log('  - Port: 5432');
  console.log('  - User: admin');
  console.log('  - Database:', DATABASE_NAME);
  console.log('  - SSL: enabled');

  try {
    await client.connect();
    console.log('✓ Connected to Aurora DSQL successfully\n');
    return client;
  } catch (error: any) {
    console.error('✗ Failed to connect to database');
    console.error('  Error:', error.message);
    console.error('  Code:', error.code);
    console.error('  Full error:', error);
    throw error;
  }
}

/**
 * Execute a query with automatic connection management
 */
export async function executeQuery<T = any>(
  query: string,
  params?: any[]
): Promise<T[]> {
  const client = await connectToDatabase();
  
  try {
    console.log('📊 Executing query:', query.substring(0, 100) + (query.length > 100 ? '...' : ''));
    if (params && params.length > 0) {
      console.log('  - Parameters:', params);
    }
    
    const result = await client.query(query, params);
    console.log('✓ Query executed successfully, rows:', result.rows.length);
    return result.rows as T[];
  } catch (error: any) {
    console.error('✗ Query execution failed');
    console.error('  Error:', error.message);
    console.error('  Code:', error.code);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed\n');
  }
}
