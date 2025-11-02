import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '@/lib/db-connection';

/**
 * Check complete database state
 * GET /api/check-database
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('\n========================================');
  console.log('🔍 Checking Complete Database State');
  console.log('========================================\n');

  try {
    // Get all laws
    const laws = await executeQuery('SELECT * FROM laws ORDER BY id');
    console.log(`Laws table: ${laws.length} rows`);
    laws.forEach((law: any) => {
      console.log(`  - ${law.id}: ${law.sector}, affected=${law.affected}, impact=${law.impact}`);
    });

    // Get all stocks
    const stocks = await executeQuery('SELECT * FROM stocks ORDER BY ticker');
    console.log(`\nStocks table: ${stocks.length} rows`);
    stocks.forEach((stock: any) => {
      console.log(`  - ${stock.ticker}: ${stock.company_name} (${stock.sector})`);
    });

    // Get all relationships
    const relationships = await executeQuery('SELECT * FROM law_stock_relationships ORDER BY law_id, stock_ticker');
    console.log(`\nLaw_stock_relationships table: ${relationships.length} rows`);
    
    // Group by law
    const byLaw: { [key: string]: any[] } = {};
    relationships.forEach((rel: any) => {
      if (!byLaw[rel.law_id]) byLaw[rel.law_id] = [];
      byLaw[rel.law_id].push(rel);
    });

    Object.keys(byLaw).forEach(lawId => {
      console.log(`  - ${lawId}: ${byLaw[lawId].length} stocks`);
      byLaw[lawId].forEach((rel: any) => {
        console.log(`      → ${rel.stock_ticker} (impact: ${rel.impact_score})`);
      });
    });

    console.log('\n========================================\n');

    return res.status(200).json({
      success: true,
      data: {
        lawsCount: laws.length,
        laws,
        stocksCount: stocks.length,
        stocks,
        relationshipsCount: relationships.length,
        relationships,
        relationshipsByLaw: byLaw
      }
    });
  } catch (error: any) {
    console.error('Error checking database:', error);
    return res.status(500).json({ error: error.message });
  }
}

