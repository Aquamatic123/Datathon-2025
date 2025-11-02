import { Law, StockImpacted, Analytics, UpdateHistory } from '@/types';
import { executeQuery } from './db-connection';

// Get all laws with their stock relationships
export async function getAllLaws(): Promise<{ [lawId: string]: Law }> {
  console.log('📚 Fetching all laws from Aurora DSQL...');
  
  const laws = await executeQuery<{
    id: string;
    jurisdiction: string;
    status: string;
    sector: string;
    impact: number;
    confidence: string;
    published: string;
    affected: number;
  }>('SELECT * FROM laws ORDER BY created_at DESC');

  const relationships = await executeQuery<{
    law_id: string;
    stock_ticker: string;
    impact_score: number;
    correlation_confidence: string;
    notes: string | null;
  }>('SELECT * FROM law_stock_relationships');

  const stocks = await executeQuery<{
    ticker: string;
    company_name: string;
    sector: string;
  }>('SELECT ticker, company_name, sector FROM stocks');

  const stockMap = new Map(stocks.map(s => [s.ticker, s]));
  const relationshipsByLaw = new Map<string, typeof relationships>();
  relationships.forEach(rel => {
    if (!relationshipsByLaw.has(rel.law_id)) {
      relationshipsByLaw.set(rel.law_id, []);
    }
    relationshipsByLaw.get(rel.law_id)!.push(rel);
  });

  const result: { [lawId: string]: Law } = {};
  
  laws.forEach(law => {
    const lawRelationships = relationshipsByLaw.get(law.id) || [];
    const stocks_impacted: StockImpacted[] = lawRelationships.map(rel => {
      const stock = stockMap.get(rel.stock_ticker);
      return {
        ticker: rel.stock_ticker,
        company_name: stock?.company_name || '',
        sector: stock?.sector || law.sector,
        impact_score: rel.impact_score,
        correlation_confidence: rel.correlation_confidence,
        notes: rel.notes || ''
      };
    });

    result[law.id] = {
      jurisdiction: law.jurisdiction,
      status: law.status,
      sector: law.sector,
      impact: law.impact,
      confidence: law.confidence,
      published: law.published,
      affected: law.affected,
      stocks_impacted: {
        STOCK_IMPACTED: stocks_impacted
      }
    };
  });

  console.log(`✓ Retrieved ${laws.length} laws from Aurora DSQL`);
  return result;
}

// Get law by ID
export async function getLawById(lawId: string): Promise<Law | null> {
  console.log(`📖 Fetching law ${lawId} from Aurora DSQL...`);
  
  const laws = await executeQuery<{
    id: string;
    jurisdiction: string;
    status: string;
    sector: string;
    impact: number;
    confidence: string;
    published: string;
    affected: number;
  }>('SELECT * FROM laws WHERE id = $1', [lawId]);

  if (laws.length === 0) {
    console.log(`✗ Law ${lawId} not found`);
    return null;
  }

  const law = laws[0];

  const relationships = await executeQuery<{
    law_id: string;
    stock_ticker: string;
    impact_score: number;
    correlation_confidence: string;
    notes: string | null;
  }>('SELECT * FROM law_stock_relationships WHERE law_id = $1', [lawId]);

  const tickers = relationships.map(r => r.stock_ticker);
  const stocks = tickers.length > 0
    ? await executeQuery<{
        ticker: string;
        company_name: string;
        sector: string;
      }>(`SELECT ticker, company_name, sector FROM stocks WHERE ticker = ANY($1::text[])`, [tickers])
    : [];

  const stockMap = new Map(stocks.map(s => [s.ticker, s]));

  const stocks_impacted: StockImpacted[] = relationships.map(rel => {
    const stock = stockMap.get(rel.stock_ticker);
    return {
      ticker: rel.stock_ticker,
      company_name: stock?.company_name || '',
      sector: stock?.sector || law.sector,
      impact_score: rel.impact_score,
      correlation_confidence: rel.correlation_confidence,
      notes: rel.notes || ''
    };
  });

  console.log(`✓ Retrieved law ${lawId} with ${stocks_impacted.length} stocks`);
  
  return {
    jurisdiction: law.jurisdiction,
    status: law.status,
    sector: law.sector,
    impact: law.impact,
    confidence: law.confidence,
    published: law.published,
    affected: law.affected,
    stocks_impacted: {
      STOCK_IMPACTED: stocks_impacted
    }
  };
}

// Create new law
export async function createLaw(lawId: string, law: Law): Promise<Law> {
  console.log(`➕ Creating law ${lawId} in Aurora DSQL...`);
  
  await executeQuery(
    `INSERT INTO laws (id, jurisdiction, status, sector, impact, confidence, published, affected, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [lawId, law.jurisdiction, law.status, law.sector, law.impact, law.confidence, law.published, 0]
  );

  console.log(`✓ Law ${lawId} created successfully`);
  return law;
}

// Update law
export async function updateLaw(lawId: string, updates: Partial<Law>): Promise<Law | null> {
  console.log(`📝 Updating law ${lawId} in Aurora DSQL...`);
  
  const existingLaw = await getLawById(lawId);
  if (!existingLaw) {
    return null;
  }

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.jurisdiction !== undefined) {
    fields.push(`jurisdiction = $${paramIndex++}`);
    values.push(updates.jurisdiction);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  if (updates.sector !== undefined) {
    fields.push(`sector = $${paramIndex++}`);
    values.push(updates.sector);
  }
  if (updates.impact !== undefined) {
    fields.push(`impact = $${paramIndex++}`);
    values.push(updates.impact);
  }
  if (updates.confidence !== undefined) {
    fields.push(`confidence = $${paramIndex++}`);
    values.push(updates.confidence);
  }
  if (updates.published !== undefined) {
    fields.push(`published = $${paramIndex++}`);
    values.push(updates.published);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(lawId);

  if (fields.length > 1) {
    await executeQuery(
      `UPDATE laws SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
  }

  console.log(`✓ Law ${lawId} updated successfully`);
  return await getLawById(lawId);
}

// Delete law
export async function deleteLaw(lawId: string): Promise<boolean> {
  console.log(`🗑️ Deleting law ${lawId} from Aurora DSQL...`);
  
  const existingLaw = await getLawById(lawId);
  if (!existingLaw) {
    return false;
  }

  // Delete relationships first
  await executeQuery('DELETE FROM law_stock_relationships WHERE law_id = $1', [lawId]);
  await executeQuery('DELETE FROM laws WHERE id = $1', [lawId]);
  
  console.log(`✓ Law ${lawId} deleted successfully`);
  return true;
}

// Add stock to law
export async function addStockToLaw(lawId: string, stock: StockImpacted): Promise<Law | null> {
  console.log(`📈 Adding stock ${stock.ticker} to law ${lawId}...`);
  
  const law = await getLawById(lawId);
  if (!law) {
    return null;
  }

  // Check if stock exists
  const existingStocks = await executeQuery<{ ticker: string }>(
    'SELECT ticker FROM stocks WHERE ticker = $1',
    [stock.ticker]
  );

  if (existingStocks.length > 0) {
    await executeQuery(
      'UPDATE stocks SET company_name = $1, sector = $2, updated_at = CURRENT_TIMESTAMP WHERE ticker = $3',
      [stock.company_name, law.sector, stock.ticker]
    );
  } else {
    await executeQuery(
      'INSERT INTO stocks (ticker, company_name, sector, created_at, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [stock.ticker, stock.company_name, law.sector]
    );
  }

  // Check if relationship exists
  const existingRel = await executeQuery<{ law_id: string }>(
    'SELECT law_id FROM law_stock_relationships WHERE law_id = $1 AND stock_ticker = $2',
    [lawId, stock.ticker]
  );

  if (existingRel.length > 0) {
    await executeQuery(
      'UPDATE law_stock_relationships SET impact_score = $1, correlation_confidence = $2, notes = $3, updated_at = CURRENT_TIMESTAMP WHERE law_id = $4 AND stock_ticker = $5',
      [stock.impact_score, stock.correlation_confidence, stock.notes || '', lawId, stock.ticker]
    );
  } else {
    await executeQuery(
      'INSERT INTO law_stock_relationships (law_id, stock_ticker, impact_score, correlation_confidence, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [lawId, stock.ticker, stock.impact_score, stock.correlation_confidence, stock.notes || '']
    );
  }

  // Update affected count and impact
  await recalculateLawMetrics(lawId);

  console.log(`✓ Stock ${stock.ticker} added to law ${lawId}`);
  return await getLawById(lawId);
}

// Update stock in law
export async function updateStockInLaw(
  lawId: string,
  ticker: string,
  updates: Partial<StockImpacted>
): Promise<Law | null> {
  console.log(`📝 Updating stock ${ticker} in law ${lawId}...`);
  
  const law = await getLawById(lawId);
  if (!law) {
    return null;
  }

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.impact_score !== undefined) {
    fields.push(`impact_score = $${paramIndex++}`);
    values.push(updates.impact_score);
  }
  if (updates.correlation_confidence !== undefined) {
    fields.push(`correlation_confidence = $${paramIndex++}`);
    values.push(updates.correlation_confidence);
  }
  if (updates.notes !== undefined) {
    fields.push(`notes = $${paramIndex++}`);
    values.push(updates.notes);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(lawId, ticker);

  if (fields.length > 1) {
    await executeQuery(
      `UPDATE law_stock_relationships SET ${fields.join(', ')}
       WHERE law_id = $${paramIndex - 1} AND stock_ticker = $${paramIndex}`,
      values
    );
  }

  if (updates.company_name !== undefined) {
    await executeQuery(
      'UPDATE stocks SET company_name = $1, updated_at = CURRENT_TIMESTAMP WHERE ticker = $2',
      [updates.company_name, ticker]
    );
  }

  await recalculateLawMetrics(lawId);
  
  console.log(`✓ Stock ${ticker} updated in law ${lawId}`);
  return await getLawById(lawId);
}

// Remove stock from law
export async function removeStockFromLaw(lawId: string, ticker: string): Promise<Law | null> {
  console.log(`➖ Removing stock ${ticker} from law ${lawId}...`);
  
  const law = await getLawById(lawId);
  if (!law) {
    return null;
  }

  await executeQuery(
    'DELETE FROM law_stock_relationships WHERE law_id = $1 AND stock_ticker = $2',
    [lawId, ticker]
  );

  await recalculateLawMetrics(lawId);
  
  console.log(`✓ Stock ${ticker} removed from law ${lawId}`);
  return await getLawById(lawId);
}

// Get all stocks for a sector
export async function getStocksBySector(sector: string): Promise<StockImpacted[]> {
  console.log(`🏢 Fetching stocks for sector: ${sector}...`);
  
  const stocks = await executeQuery<{
    ticker: string;
    company_name: string;
    sector: string;
  }>('SELECT ticker, company_name, sector FROM stocks WHERE sector = $1', [sector]);

  const tickers = stocks.map(s => s.ticker);
  const relationships = tickers.length > 0
    ? await executeQuery<{
        stock_ticker: string;
        impact_score: number;
        correlation_confidence: string;
        notes: string | null;
      }>(`SELECT stock_ticker, impact_score, correlation_confidence, notes
          FROM law_stock_relationships
          WHERE stock_ticker = ANY($1::text[])
          ORDER BY impact_score DESC`,
      [tickers])
    : [];

  const relMap = new Map<string, typeof relationships[0]>();
  relationships.forEach(rel => {
    const existing = relMap.get(rel.stock_ticker);
    if (!existing || rel.impact_score > existing.impact_score) {
      relMap.set(rel.stock_ticker, rel);
    }
  });

  return stocks.map(stock => {
    const rel = relMap.get(stock.ticker);
    return {
      ticker: stock.ticker,
      company_name: stock.company_name,
      sector: stock.sector,
      impact_score: rel?.impact_score || 0,
      correlation_confidence: rel?.correlation_confidence || 'Medium',
      notes: rel?.notes || ''
    };
  });
}

// Get all sectors
export async function getAllSectors(): Promise<string[]> {
  console.log('🏢 Fetching all sectors from Aurora DSQL...');
  
  const result = await executeQuery<{ sector: string }>(
    'SELECT DISTINCT sector FROM laws UNION SELECT DISTINCT sector FROM stocks ORDER BY sector'
  );
  
  console.log(`✓ Retrieved ${result.length} sectors`);
  return result.map(r => r.sector);
}

// Calculate analytics
export async function calculateAnalytics(): Promise<Analytics> {
  console.log('📊 Calculating analytics from Aurora DSQL...');
  
  const totalLawsResult = await executeQuery<{ count: string }>('SELECT COUNT(*) as count FROM laws');
  const totalLaws = parseInt(totalLawsResult[0]?.count || '0', 10);

  const sectorImpacts = await executeQuery<{
    sector: string;
    average_impact: string;
  }>('SELECT sector, AVG(impact) as average_impact FROM laws GROUP BY sector');

  const averageImpactBySector: { [sector: string]: number } = {};
  sectorImpacts.forEach(row => {
    averageImpactBySector[row.sector] = parseFloat(row.average_impact);
  });

  const uniqueStocksResult = await executeQuery<{ count: string }>(
    'SELECT COUNT(DISTINCT stock_ticker) as count FROM law_stock_relationships'
  );
  const totalStocksImpacted = parseInt(uniqueStocksResult[0]?.count || '0', 10);

  const sp500AffectedPercentage = (totalStocksImpacted / 500) * 100;

  const confidenceWeightedResult = await executeQuery<{
    confidence_weighted_impact: string;
  }>(
    `SELECT AVG(
      CASE confidence
        WHEN 'High' THEN impact * 1.0
        WHEN 'Medium' THEN impact * 0.7
        WHEN 'Low' THEN impact * 0.4
        ELSE impact * 0.5
      END
    ) as confidence_weighted_impact
    FROM laws`
  );

  const confidenceWeightedImpact = parseFloat(
    confidenceWeightedResult[0]?.confidence_weighted_impact || '0'
  );

  console.log(`✓ Analytics calculated: ${totalLaws} laws, ${totalStocksImpacted} stocks`);

  return {
    totalLaws,
    averageImpactBySector,
    sp500AffectedPercentage,
    confidenceWeightedImpact,
    totalStocksImpacted
  };
}

// Recalculate law metrics
async function recalculateLawMetrics(lawId: string): Promise<void> {
  const countResult = await executeQuery<{ count: string }>(
    'SELECT COUNT(*) as count FROM law_stock_relationships WHERE law_id = $1',
    [lawId]
  );
  const affected = parseInt(countResult[0]?.count || '0', 10);

  const impactResult = await executeQuery<{ avg_impact: string | null }>(
    'SELECT AVG(impact_score) as avg_impact FROM law_stock_relationships WHERE law_id = $1',
    [lawId]
  );
  const avgImpact = impactResult[0]?.avg_impact
    ? Math.round(parseFloat(impactResult[0].avg_impact))
    : 0;

  await executeQuery(
    'UPDATE laws SET affected = $1, impact = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
    [affected, avgImpact, lawId]
  );
}

// Get update history
export async function getHistory(): Promise<UpdateHistory[]> {
  try {
    const result = await executeQuery<{
      timestamp: Date;
      law_id: string;
      changes: string;
      notes: string;
    }>('SELECT timestamp, law_id, changes, notes FROM update_history ORDER BY timestamp DESC LIMIT 100');

    return result.map(row => ({
      timestamp: row.timestamp.toISOString(),
      lawId: row.law_id,
      changes: typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes,
      notes: row.notes
    }));
  } catch (error) {
    console.warn('History table not available:', error);
    return [];
  }
}
