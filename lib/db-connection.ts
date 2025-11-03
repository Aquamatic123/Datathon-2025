import { DsqlSigner } from '@aws-sdk/dsql-signer';
import { Client } from 'pg';

/**
 * Get environment variables at runtime (not at module load time)
 * This is crucial for AWS Amplify compatibility
 */
function getEnvVars() {
  return {
    RAW_ENDPOINT: process.env.AURORA_DSQL_ENDPOINT!,
    APP_REGION: process.env.APP_REGION || 'us-west-2',
    DATABASE_NAME: process.env.DATABASE_NAME || 'postgres',
    APP_ACCESS_KEY_ID: process.env.APP_ACCESS_KEY_ID!,
    APP_SECRET_ACCESS_KEY: process.env.APP_SECRET_ACCESS_KEY!,
  };
}

/**
 * Extract hostname from endpoint (remove any query parameters or paths)
 */
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

/**
 * Get cluster endpoint (hostname only)
 */
function getClusterEndpoint(): string {
  const env = getEnvVars();
  return extractHostname(env.RAW_ENDPOINT);
}

/**
 * Generate Aurora DSQL authentication token
 * On AWS Lambda/Amplify: Uses Lambda execution role credentials automatically
 * On localhost: Uses explicit credentials from env vars
 */
async function generateAuthToken(): Promise<string> {
  const env = getEnvVars();
  const clusterEndpoint = getClusterEndpoint();
  
  console.log('🔑 Generating Aurora DSQL authentication token...');
  console.log('  - Using hostname:', clusterEndpoint);
  console.log('  - Using region:', env.APP_REGION);
  console.log('  - Using access key:', env.APP_ACCESS_KEY_ID ? env.APP_ACCESS_KEY_ID.substring(0, 8) + '...' : 'Lambda role');
  
  if (!clusterEndpoint) {
    throw new Error('AURORA_DSQL_ENDPOINT environment variable is required');
  }

  const signerConfig: any = {
    hostname: clusterEndpoint,
    region: env.APP_REGION,
  };
  
  // Only set explicit credentials if both are provided (for localhost)
  if (env.APP_ACCESS_KEY_ID && env.APP_SECRET_ACCESS_KEY) {
    signerConfig.credentials = {
      accessKeyId: env.APP_ACCESS_KEY_ID,
      secretAccessKey: env.APP_SECRET_ACCESS_KEY,
    };
  }
  // Otherwise, SDK will use Lambda execution role or default credential chain

  const signer = new DsqlSigner(signerConfig);

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
  const env = getEnvVars();
  const clusterEndpoint = getClusterEndpoint();
  
  console.log('\n🔌 Connecting to Aurora DSQL...');
  
  const token = await generateAuthToken();
  
  const client = new Client({
    host: clusterEndpoint,
    port: 5432,
    user: 'admin',
    password: token,
    database: env.DATABASE_NAME,
    ssl: { rejectUnauthorized: true }
  });

  console.log('  - Host:', clusterEndpoint);
  console.log('  - Port: 5432');
  console.log('  - User: admin');
  console.log('  - Database:', env.DATABASE_NAME);
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
