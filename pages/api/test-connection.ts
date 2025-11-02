import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/db-connection';

/**
 * Test endpoint to verify Aurora DSQL connection
 * GET /api/test-connection
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('\n========================================');
  console.log('🧪 Testing Aurora DSQL Connection');
  console.log('========================================\n');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test 1: Generate token and connect
    console.log('Test 1: Connecting to database...');
    const client = await connectToDatabase();
    
    // Test 2: Execute a simple query
    console.log('Test 2: Executing test query...');
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    
    // Test 3: Check if tables exist
    console.log('Test 3: Checking for required tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('laws', 'stocks', 'law_stock_relationships')
      ORDER BY table_name
    `);
    
    await client.end();

    const existingTables = tablesResult.rows.map((row: any) => row.table_name);
    const requiredTables = ['laws', 'stocks', 'law_stock_relationships'];
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    console.log('\n✓ Connection test successful!');
    console.log('  Current time:', result.rows[0]?.current_time);
    console.log('  Database version:', result.rows[0]?.db_version);
    console.log('  Existing tables:', existingTables.join(', ') || 'None');
    if (missingTables.length > 0) {
      console.log('  ⚠ Missing tables:', missingTables.join(', '));
    }
    console.log('\n========================================\n');

    return res.status(200).json({
      success: true,
      message: 'Aurora DSQL connection successful',
      data: {
        currentTime: result.rows[0]?.current_time,
        dbVersion: result.rows[0]?.db_version,
        existingTables,
        missingTables,
        allTablesExist: missingTables.length === 0
      }
    });
  } catch (error: any) {
    console.error('\n✗ Connection test failed!');
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    console.log('\n========================================\n');

    return res.status(500).json({
      success: false,
      error: error.message || 'Connection failed',
      code: error.code,
      details: error.toString()
    });
  }
}

