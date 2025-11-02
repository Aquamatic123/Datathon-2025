import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '@/lib/db-connection';

/**
 * Seed database with test data
 * POST /api/seed-database
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('\n========================================');
  console.log('🌱 Seeding Aurora DSQL Database');
  console.log('========================================\n');

  try {
    // Insert stocks
    console.log('📈 Inserting stocks...');
    
    const stocks = [
      // Clean Energy stocks
      { ticker: 'TSLA', company_name: 'Tesla Inc.', sector: 'Clean Energy' },
      { ticker: 'ENPH', company_name: 'Enphase Energy Inc.', sector: 'Clean Energy' },
      { ticker: 'RUN', company_name: 'Sunrun Inc.', sector: 'Clean Energy' },
      
      // Technology stocks
      { ticker: 'NVDA', company_name: 'NVIDIA Corporation', sector: 'Technology' },
      { ticker: 'MSFT', company_name: 'Microsoft Corporation', sector: 'Technology' },
      { ticker: 'GOOGL', company_name: 'Alphabet Inc.', sector: 'Technology' },
      
      // Healthcare stocks
      { ticker: 'JNJ', company_name: 'Johnson & Johnson', sector: 'Healthcare' },
      { ticker: 'PFE', company_name: 'Pfizer Inc.', sector: 'Healthcare' },
      { ticker: 'UNH', company_name: 'UnitedHealth Group', sector: 'Healthcare' },
    ];

    for (const stock of stocks) {
      // Check if stock exists
      const existing = await executeQuery(
        'SELECT ticker FROM stocks WHERE ticker = $1',
        [stock.ticker]
      );

      if (existing.length === 0) {
        await executeQuery(
          'INSERT INTO stocks (ticker, company_name, sector, created_at, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          [stock.ticker, stock.company_name, stock.sector]
        );
        console.log(`  ✓ Added stock: ${stock.ticker} (${stock.company_name})`);
      } else {
        console.log(`  - Stock already exists: ${stock.ticker}`);
      }
    }

    // Create relationships for Law1 (Clean Energy)
    console.log('\n🔗 Creating relationships for Law1 (Clean Energy)...');
    const law1Relationships = [
      { ticker: 'TSLA', impact_score: 9, confidence: 'High', notes: 'Direct beneficiary of clean energy subsidies' },
      { ticker: 'ENPH', impact_score: 8, confidence: 'High', notes: 'Solar energy equipment manufacturer' },
      { ticker: 'RUN', impact_score: 7, confidence: 'Medium', notes: 'Residential solar installation company' },
    ];

    for (const rel of law1Relationships) {
      const existing = await executeQuery(
        'SELECT law_id FROM law_stock_relationships WHERE law_id = $1 AND stock_ticker = $2',
        ['Law1', rel.ticker]
      );

      if (existing.length === 0) {
        await executeQuery(
          'INSERT INTO law_stock_relationships (law_id, stock_ticker, impact_score, correlation_confidence, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          ['Law1', rel.ticker, rel.impact_score, rel.confidence, rel.notes]
        );
        console.log(`  ✓ Linked ${rel.ticker} to Law1`);
      } else {
        console.log(`  - Relationship already exists: Law1 → ${rel.ticker}`);
      }
    }

    // Create relationships for Law2 (Technology)
    console.log('\n🔗 Creating relationships for Law2 (Technology)...');
    const law2Relationships = [
      { ticker: 'NVDA', impact_score: 8, confidence: 'High', notes: 'AI chip regulations' },
      { ticker: 'MSFT', impact_score: 7, confidence: 'Medium', notes: 'Cloud computing and AI services' },
      { ticker: 'GOOGL', impact_score: 6, confidence: 'Medium', notes: 'Data privacy and AI regulations' },
    ];

    for (const rel of law2Relationships) {
      const existing = await executeQuery(
        'SELECT law_id FROM law_stock_relationships WHERE law_id = $1 AND stock_ticker = $2',
        ['Law2', rel.ticker]
      );

      if (existing.length === 0) {
        await executeQuery(
          'INSERT INTO law_stock_relationships (law_id, stock_ticker, impact_score, correlation_confidence, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          ['Law2', rel.ticker, rel.impact_score, rel.confidence, rel.notes]
        );
        console.log(`  ✓ Linked ${rel.ticker} to Law2`);
      } else {
        console.log(`  - Relationship already exists: Law2 → ${rel.ticker}`);
      }
    }

    // Create relationships for Law3 (Healthcare)
    console.log('\n🔗 Creating relationships for Law3 (Healthcare)...');
    const law3Relationships = [
      { ticker: 'JNJ', impact_score: 7, confidence: 'High', notes: 'Pharmaceutical regulations' },
      { ticker: 'PFE', impact_score: 8, confidence: 'High', notes: 'Vaccine and drug approval impact' },
      { ticker: 'UNH', impact_score: 6, confidence: 'Medium', notes: 'Healthcare policy changes' },
    ];

    for (const rel of law3Relationships) {
      const existing = await executeQuery(
        'SELECT law_id FROM law_stock_relationships WHERE law_id = $1 AND stock_ticker = $2',
        ['Law3', rel.ticker]
      );

      if (existing.length === 0) {
        await executeQuery(
          'INSERT INTO law_stock_relationships (law_id, stock_ticker, impact_score, correlation_confidence, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          ['Law3', rel.ticker, rel.impact_score, rel.confidence, rel.notes]
        );
        console.log(`  ✓ Linked ${rel.ticker} to Law3`);
      } else {
        console.log(`  - Relationship already exists: Law3 → ${rel.ticker}`);
      }
    }

    // Update affected counts and impacts for all laws
    console.log('\n🔄 Updating law metrics...');
    const laws = ['Law1', 'Law2', 'Law3'];
    
    for (const lawId of laws) {
      // Count relationships
      const countResult = await executeQuery<{ count: string }>(
        'SELECT COUNT(*) as count FROM law_stock_relationships WHERE law_id = $1',
        [lawId]
      );
      const affected = parseInt(countResult[0]?.count || '0', 10);

      // Calculate average impact
      const impactResult = await executeQuery<{ avg_impact: string | null }>(
        'SELECT AVG(impact_score) as avg_impact FROM law_stock_relationships WHERE law_id = $1',
        [lawId]
      );
      const avgImpact = impactResult[0]?.avg_impact
        ? Math.round(parseFloat(impactResult[0].avg_impact))
        : 0;

      // Update law
      await executeQuery(
        'UPDATE laws SET affected = $1, impact = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [affected, avgImpact, lawId]
      );
      console.log(`  ✓ Updated ${lawId}: ${affected} stocks, avg impact ${avgImpact}`);
    }

    // Get final counts
    const stockCount = await executeQuery<{ count: string }>('SELECT COUNT(*) as count FROM stocks');
    const relationshipCount = await executeQuery<{ count: string }>('SELECT COUNT(*) as count FROM law_stock_relationships');

    console.log('\n✅ Database seeding complete!');
    console.log('  - Stocks:', stockCount[0]?.count || 0);
    console.log('  - Relationships:', relationshipCount[0]?.count || 0);
    console.log('\n========================================\n');

    return res.status(200).json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        stocksAdded: parseInt(stockCount[0]?.count || '0'),
        relationshipsCreated: parseInt(relationshipCount[0]?.count || '0'),
        lawsUpdated: laws.length
      }
    });
  } catch (error: any) {
    console.error('\n✗ Database seeding failed!');
    console.error('Error:', error.message);
    console.error('Full error:', error);
    console.log('\n========================================\n');

    return res.status(500).json({
      success: false,
      error: error.message || 'Seeding failed',
      details: error.toString()
    });
  }
}

