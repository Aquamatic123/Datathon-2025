// lib/database-sql.ts
import { Pool } from 'pg';
import { pgPool } from './db-config';
import { Law, StockImpacted, Database, Analytics, UpdateHistory } from '@/types';

// Get all laws
export async function getAllLaws(): Promise<Database> {
  const result = await pgPool.query(`
    SELECT 
      l.*,
      COALESCE(
        json_agg(
          json_build_object(
            'ticker', lsr.stock_ticker,
            'company_name', s.company_name,
            'sector', s.sector,
            'impact_score', lsr.impact_score,
            'correlation_confidence', lsr.correlation_confidence,
            'notes', lsr.notes
          )
        ) FILTER (WHERE lsr.stock_ticker IS NOT NULL),
        '[]'::json
      ) as stocks_impacted
    FROM laws l
    LEFT JOIN law_stock_relationships lsr ON l.id = lsr.law_id
    LEFT JOIN stocks s ON lsr.stock_ticker = s.ticker
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `);
  
  const DATA: { [key: string]: Law } = {};
  result.rows.forEach(row => {
    const law: Law = {
      jurisdiction: row.jurisdiction,
      status: row.status,
      sector: row.sector,
      impact: row.impact,
      confidence: row.confidence,
      published: row.published.toISOString().split('T')[0],
      affected: row.affected,
      stocks_impacted: {
        STOCK_IMPACTED: row.stocks_impacted || []
      }
    };
    
    // Add document if exists
    if (row.document_filename) {
      law.document = {
        filename: row.document_filename,
        content: row.document_content,
        contentType: row.document_content_type,
        uploadedAt: row.document_uploaded_at.toISOString()
      };
    }
    
    DATA[row.id] = law;
  });
  
  return { DATA };
}

// Get law by ID
export async function getLawById(lawId: string): Promise<Law | null> {
  const result = await pgPool.query(`
    SELECT 
      l.*,
      COALESCE(
        json_agg(
          json_build_object(
            'ticker', lsr.stock_ticker,
            'company_name', s.company_name,
            'sector', s.sector,
            'impact_score', lsr.impact_score,
            'correlation_confidence', lsr.correlation_confidence,
            'notes', lsr.notes
          )
        ) FILTER (WHERE lsr.stock_ticker IS NOT NULL),
        '[]'::json
      ) as stocks_impacted
    FROM laws l
    LEFT JOIN law_stock_relationships lsr ON l.id = lsr.law_id
    LEFT JOIN stocks s ON lsr.stock_ticker = s.ticker
    WHERE l.id = $1
    GROUP BY l.id
  `, [lawId]);
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  const law: Law = {
    jurisdiction: row.jurisdiction,
    status: row.status,
    sector: row.sector,
    impact: row.impact,
    confidence: row.confidence,
    published: row.published.toISOString().split('T')[0],
    affected: row.affected,
    stocks_impacted: {
      STOCK_IMPACTED: row.stocks_impacted || []
    }
  };
  
  // Add document if exists
  if (row.document_filename) {
    law.document = {
      filename: row.document_filename,
      content: row.document_content,
      contentType: row.document_content_type,
      uploadedAt: row.document_uploaded_at.toISOString()
    };
  }
  
  return law;
}

// Create new law
export async function createLaw(lawId: string, law: Law): Promise<Law> {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      INSERT INTO laws (
        id, jurisdiction, status, sector, impact, confidence, published, affected,
        document_filename, document_content, document_content_type, document_uploaded_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      lawId,
      law.jurisdiction,
      law.status,
      law.sector,
      law.impact,
      law.confidence,
      law.published,
      law.affected,
      law.document?.filename || null,
      law.document?.content || null,
      law.document?.contentType || null,
      law.document?.uploadedAt || null
    ]);
    
    await client.query('COMMIT');
    
    addHistory({
      timestamp: new Date().toISOString(),
      lawId,
      changes: ['Created new law'],
      notes: `Created law ${lawId} in ${law.sector} sector`
    });
    
    return law;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Update law
export async function updateLaw(lawId: string, updates: Partial<Law>): Promise<Law | null> {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    
    const oldLaw = await getLawById(lawId);
    if (!oldLaw) {
      await client.query('ROLLBACK');
      return null;
    }
    
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (updates.jurisdiction !== undefined) {
      updateFields.push(`jurisdiction = $${paramCount++}`);
      values.push(updates.jurisdiction);
    }
    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.sector !== undefined) {
      updateFields.push(`sector = $${paramCount++}`);
      values.push(updates.sector);
    }
    if (updates.impact !== undefined) {
      updateFields.push(`impact = $${paramCount++}`);
      values.push(updates.impact);
    }
    if (updates.confidence !== undefined) {
      updateFields.push(`confidence = $${paramCount++}`);
      values.push(updates.confidence);
    }
    if (updates.published !== undefined) {
      updateFields.push(`published = $${paramCount++}`);
      values.push(updates.published);
    }
    if (updates.document !== undefined) {
      if (updates.document === null) {
        // Remove document
        updateFields.push(`document_filename = $${paramCount++}`);
        values.push(null);
        updateFields.push(`document_content = $${paramCount++}`);
        values.push(null);
        updateFields.push(`document_content_type = $${paramCount++}`);
        values.push(null);
        updateFields.push(`document_uploaded_at = $${paramCount++}`);
        values.push(null);
      } else {
        // Add/update document
        updateFields.push(`document_filename = $${paramCount++}`);
        values.push(updates.document.filename);
        updateFields.push(`document_content = $${paramCount++}`);
        values.push(updates.document.content);
        updateFields.push(`document_content_type = $${paramCount++}`);
        values.push(updates.document.contentType);
        updateFields.push(`document_uploaded_at = $${paramCount++}`);
        values.push(updates.document.uploadedAt);
      }
    }
    
    if (updateFields.length === 0) {
      await client.query('COMMIT');
      return oldLaw;
    }
    
    values.push(lawId);
    await client.query(`
      UPDATE laws 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
    `, values);
    
    await client.query('COMMIT');
    
    const changes = Object.keys(updates);
    addHistory({
      timestamp: new Date().toISOString(),
      lawId,
      changes,
      notes: `Updated law ${lawId}`
    });
    
    return getLawById(lawId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Delete law
export async function deleteLaw(lawId: string): Promise<boolean> {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query('DELETE FROM laws WHERE id = $1', [lawId]);
    
    await client.query('COMMIT');
    
    addHistory({
      timestamp: new Date().toISOString(),
      lawId,
      changes: ['Deleted law'],
      notes: `Deleted law ${lawId}`
    });
    
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Add stock to law
export async function addStockToLaw(lawId: string, stock: StockImpacted): Promise<Law | null> {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if law exists
    const lawExists = await client.query('SELECT id FROM laws WHERE id = $1', [lawId]);
    if (lawExists.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    
    // Get law sector to ensure consistency
    const lawResult = await client.query('SELECT sector FROM laws WHERE id = $1', [lawId]);
    const lawSector = lawResult.rows[0].sector;
    
    // Insert/update stock
    await client.query(`
      INSERT INTO stocks (ticker, company_name, sector)
      VALUES ($1, $2, $3)
      ON CONFLICT (ticker) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        sector = EXCLUDED.sector
    `, [stock.ticker, stock.company_name, lawSector]);
    
    // Create relationship
    await client.query(`
      INSERT INTO law_stock_relationships 
        (law_id, stock_ticker, impact_score, correlation_confidence, notes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (law_id, stock_ticker) DO UPDATE SET
        impact_score = EXCLUDED.impact_score,
        correlation_confidence = EXCLUDED.correlation_confidence,
        notes = EXCLUDED.notes
    `, [lawId, stock.ticker, stock.impact_score, stock.correlation_confidence, stock.notes]);
    
    await client.query('COMMIT');
    
    addHistory({
      timestamp: new Date().toISOString(),
      lawId,
      changes: [`Added stock ${stock.ticker}`],
      notes: `Added ${stock.company_name} to law ${lawId}`
    });
    
    return getLawById(lawId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Update stock in law
export async function updateStockInLaw(
  lawId: string,
  ticker: string,
  updates: Partial<StockImpacted>
): Promise<Law | null> {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (updates.impact_score !== undefined) {
      updateFields.push(`impact_score = $${paramCount++}`);
      values.push(updates.impact_score);
    }
    if (updates.correlation_confidence !== undefined) {
      updateFields.push(`correlation_confidence = $${paramCount++}`);
      values.push(updates.correlation_confidence);
    }
    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramCount++}`);
      values.push(updates.notes);
    }
    
    if (updateFields.length === 0) {
      await client.query('COMMIT');
      return getLawById(lawId);
    }
    
    values.push(lawId, ticker);
    await client.query(`
      UPDATE law_stock_relationships 
      SET ${updateFields.join(', ')}
      WHERE law_id = $${paramCount++} AND stock_ticker = $${paramCount++}
    `, values);
    
    await client.query('COMMIT');
    
    addHistory({
      timestamp: new Date().toISOString(),
      lawId,
      changes: [`Updated stock ${ticker}`],
      notes: `Updated stock ${ticker} in law ${lawId}`
    });
    
    return getLawById(lawId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Remove stock from law
export async function removeStockFromLaw(lawId: string, ticker: string): Promise<Law | null> {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      DELETE FROM law_stock_relationships 
      WHERE law_id = $1 AND stock_ticker = $2
    `, [lawId, ticker]);
    
    await client.query('COMMIT');
    
    addHistory({
      timestamp: new Date().toISOString(),
      lawId,
      changes: [`Removed stock ${ticker}`],
      notes: `Removed stock ${ticker} from law ${lawId}`
    });
    
    return getLawById(lawId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Get all stocks for a sector
export async function getStocksBySector(sector: string): Promise<StockImpacted[]> {
  const result = await pgPool.query(`
    SELECT DISTINCT
      s.ticker,
      s.company_name,
      s.sector,
      lsr.impact_score,
      lsr.correlation_confidence,
      lsr.notes
    FROM stocks s
    JOIN law_stock_relationships lsr ON s.ticker = lsr.stock_ticker
    WHERE s.sector = $1
  `, [sector]);
  
  return result.rows.map(row => ({
    ticker: row.ticker,
    company_name: row.company_name,
    sector: row.sector,
    impact_score: row.impact_score,
    correlation_confidence: row.correlation_confidence,
    notes: row.notes || ''
  }));
}

// Get all sectors
export async function getAllSectors(): Promise<string[]> {
  const result = await pgPool.query('SELECT DISTINCT name FROM sectors ORDER BY name');
  return result.rows.map(row => row.name);
}

// Calculate analytics
export async function calculateAnalytics(): Promise<Analytics> {
  const lawsResult = await pgPool.query('SELECT COUNT(*) as count FROM laws');
  const totalLaws = parseInt(lawsResult.rows[0].count);
  
  // Average impact by sector
  const sectorResult = await pgPool.query(`
    SELECT 
      sector,
      AVG(impact)::numeric(10,2) as avg_impact
    FROM laws
    GROUP BY sector
  `);
  
  const averageImpactBySector: { [sector: string]: number } = {};
  sectorResult.rows.forEach(row => {
    averageImpactBySector[row.sector] = parseFloat(row.avg_impact);
  });
  
  // SP500 affected percentage
  const stocksResult = await pgPool.query(`
    SELECT COUNT(DISTINCT stock_ticker) as count
    FROM law_stock_relationships
  `);
  const uniqueStocks = parseInt(stocksResult.rows[0].count);
  const sp500AffectedPercentage = (uniqueStocks / 500) * 100;
  
  // Confidence-weighted impact
  const weightedResult = await pgPool.query(`
    SELECT 
      AVG(
        CASE confidence
          WHEN 'High' THEN impact * 1.0
          WHEN 'Medium' THEN impact * 0.7
          WHEN 'Low' THEN impact * 0.4
          ELSE impact * 0.5
        END
      )::numeric(10,2) as weighted_impact
    FROM laws
  `);
  
  const confidenceWeightedImpact = parseFloat(weightedResult.rows[0].weighted_impact || '0');
  
  return {
    totalLaws,
    averageImpactBySector,
    sp500AffectedPercentage,
    confidenceWeightedImpact,
    totalStocksImpacted: uniqueStocks
  };
}

// Add update history
export async function addHistory(history: UpdateHistory): Promise<void> {
  await pgPool.query(`
    INSERT INTO update_history (law_id, changes, notes, timestamp)
    VALUES ($1, $2, $3, $4)
  `, [
    history.lawId,
    JSON.stringify(history.changes),
    history.notes,
    history.timestamp
  ]);
}

// Get update history
export async function getHistory(): Promise<UpdateHistory[]> {
  const result = await pgPool.query(`
    SELECT law_id, changes, notes, timestamp
    FROM update_history
    ORDER BY timestamp DESC
    LIMIT 100
  `);
  
  return result.rows.map(row => ({
    lawId: row.law_id,
    changes: typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes,
    notes: row.notes,
    timestamp: row.timestamp.toISOString()
  }));
}

// Store LLM-generated data
export async function storeLLMData(lawId: string, llmData: {
  summary?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  await pgPool.query(`
    UPDATE laws
    SET llm_summary = $1,
        llm_metadata = $2
    WHERE id = $3
  `, [
    llmData.summary || null,
    llmData.metadata ? JSON.stringify(llmData.metadata) : null,
    lawId
  ]);
}

// Get LLM data for a law
export async function getLLMData(lawId: string): Promise<{
  summary: string | null;
  metadata: Record<string, any> | null;
} | null> {
  const result = await pgPool.query(`
    SELECT llm_summary, llm_metadata
    FROM laws
    WHERE id = $1
  `, [lawId]);
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    summary: row.llm_summary,
    metadata: row.llm_metadata ? (typeof row.llm_metadata === 'string' ? JSON.parse(row.llm_metadata) : row.llm_metadata) : null
  };
}

