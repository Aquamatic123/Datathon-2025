import { Database, Law, StockImpacted, Analytics, UpdateHistory } from '@/types';
import fs from 'fs';
import path from 'path';

// Use SQL database if DATABASE_URL is set, otherwise fallback to JSON
const USE_SQL = !!process.env.DATABASE_URL || !!process.env.DB_HOST;

// Import SQL functions if using SQL
let sqlDb: typeof import('./database-sql') | null = null;
if (USE_SQL) {
  try {
    sqlDb = require('./database-sql');
  } catch (error) {
    console.warn('⚠️  SQL database not available, falling back to JSON:', error);
  }
}

const DB_PATH = path.join(process.cwd(), 'data', 'database.json');
const HISTORY_PATH = path.join(process.cwd(), 'data', 'history.json');

// Initialize history file if it doesn't exist
function initHistoryFile() {
  if (!fs.existsSync(HISTORY_PATH)) {
    fs.writeFileSync(HISTORY_PATH, JSON.stringify({ history: [] }, null, 2));
  }
}

// Read database
export function readDatabase(): Database {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { DATA: {} };
  }
}

// Write database
export function writeDatabase(db: Database): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
    throw error;
  }
}

// Add update history
export async function addHistory(history: UpdateHistory): Promise<void> {
  if (USE_SQL && sqlDb) {
    return await sqlDb.addHistory(history);
  }
  
  initHistoryFile();
  try {
    const data = fs.readFileSync(HISTORY_PATH, 'utf-8');
    const historyData = JSON.parse(data);
    historyData.history.push(history);
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(historyData, null, 2));
  } catch (error) {
    console.error('Error writing history:', error);
  }
}

// Get all laws
export async function getAllLaws(): Promise<Database> {
  if (USE_SQL && sqlDb) {
    return await sqlDb.getAllLaws();
  }
  return readDatabase();
}

// Get law by ID
export async function getLawById(lawId: string): Promise<Law | null> {
  if (USE_SQL && sqlDb) {
    return await sqlDb.getLawById(lawId);
  }
  const db = readDatabase();
  return db.DATA[lawId] || null;
}

// Create new law
export async function createLaw(lawId: string, law: Law): Promise<Law> {
  if (USE_SQL && sqlDb) {
    // Validate relationships
    validateLawRelationships(law);
    return await sqlDb.createLaw(lawId, law);
  }
  
  const db = readDatabase();
  
  // Validate relationships
  validateLawRelationships(law);
  
  db.DATA[lawId] = law;
  writeDatabase(db);
  
  addHistory({
    timestamp: new Date().toISOString(),
    lawId,
    changes: ['Created new law'],
    notes: `Created law ${lawId} in ${law.sector} sector`
  });
  
  return law;
}

// Update law
export async function updateLaw(lawId: string, updates: Partial<Law>): Promise<Law | null> {
  if (USE_SQL && sqlDb) {
    return await sqlDb.updateLaw(lawId, updates);
  }
  
  const db = readDatabase();
  
  if (!db.DATA[lawId]) {
    return null;
  }
  
  const oldLaw = { ...db.DATA[lawId] };
  const updatedLaw = { ...db.DATA[lawId], ...updates };
  
  // Re-validate relationships
  validateLawRelationships(updatedLaw);
  
  db.DATA[lawId] = updatedLaw;
  writeDatabase(db);
  
  const changes = Object.keys(updates).filter(key => 
    JSON.stringify(oldLaw[key as keyof Law]) !== JSON.stringify(updates[key as keyof Law])
  );
  
  addHistory({
    timestamp: new Date().toISOString(),
    lawId,
    changes,
    notes: `Updated law ${lawId}`
  });
  
  return updatedLaw;
}

// Delete law
export async function deleteLaw(lawId: string): Promise<boolean> {
  if (USE_SQL && sqlDb) {
    return await sqlDb.deleteLaw(lawId);
  }
  
  const db = readDatabase();
  
  if (!db.DATA[lawId]) {
    return false;
  }
  
  delete db.DATA[lawId];
  writeDatabase(db);
  
  addHistory({
    timestamp: new Date().toISOString(),
    lawId,
    changes: ['Deleted law'],
    notes: `Deleted law ${lawId}`
  });
  
  return true;
}

// Add stock to law
export async function addStockToLaw(lawId: string, stock: StockImpacted): Promise<Law | null> {
  if (USE_SQL && sqlDb) {
    return await sqlDb.addStockToLaw(lawId, stock);
  }
  
  const db = readDatabase();
  
  if (!db.DATA[lawId]) {
    return null;
  }
  
  const law = db.DATA[lawId];
  
  // Ensure stock sector matches law sector
  if (stock.sector !== law.sector) {
    stock.sector = law.sector;
  }
  
  law.stocks_impacted.STOCK_IMPACTED.push(stock);
  
  // Update affected count
  law.affected = law.stocks_impacted.STOCK_IMPACTED.length;
  
  // Recalculate impact based on average stock impact
  const avgImpact = law.stocks_impacted.STOCK_IMPACTED.reduce(
    (sum, s) => sum + s.impact_score, 0
  ) / law.stocks_impacted.STOCK_IMPACTED.length;
  
  law.impact = Math.round(avgImpact);
  
  writeDatabase(db);
  
  addHistory({
    timestamp: new Date().toISOString(),
    lawId,
    changes: [`Added stock ${stock.ticker}`],
    notes: `Added ${stock.company_name} to law ${lawId}`
  });
  
  return law;
}

// Update stock in law
export async function updateStockInLaw(
  lawId: string,
  ticker: string,
  updates: Partial<StockImpacted>
): Promise<Law | null> {
  if (USE_SQL && sqlDb) {
    return await sqlDb.updateStockInLaw(lawId, ticker, updates);
  }
  
  const db = readDatabase();
  
  if (!db.DATA[lawId]) {
    return null;
  }
  
  const law = db.DATA[lawId];
  const stockIndex = law.stocks_impacted.STOCK_IMPACTED.findIndex(
    s => s.ticker === ticker
  );
  
  if (stockIndex === -1) {
    return null;
  }
  
  law.stocks_impacted.STOCK_IMPACTED[stockIndex] = {
    ...law.stocks_impacted.STOCK_IMPACTED[stockIndex],
    ...updates
  };
  
  // Recalculate impact
  const avgImpact = law.stocks_impacted.STOCK_IMPACTED.reduce(
    (sum, s) => sum + s.impact_score, 0
  ) / law.stocks_impacted.STOCK_IMPACTED.length;
  
  law.impact = Math.round(avgImpact);
  
  writeDatabase(db);
  
  addHistory({
    timestamp: new Date().toISOString(),
    lawId,
    changes: [`Updated stock ${ticker}`],
    notes: `Updated stock ${ticker} in law ${lawId}`
  });
  
  return law;
}

// Remove stock from law
export async function removeStockFromLaw(lawId: string, ticker: string): Promise<Law | null> {
  if (USE_SQL && sqlDb) {
    return await sqlDb.removeStockFromLaw(lawId, ticker);
  }
  
  const db = readDatabase();
  
  if (!db.DATA[lawId]) {
    return null;
  }
  
  const law = db.DATA[lawId];
  law.stocks_impacted.STOCK_IMPACTED = law.stocks_impacted.STOCK_IMPACTED.filter(
    s => s.ticker !== ticker
  );
  
  law.affected = law.stocks_impacted.STOCK_IMPACTED.length;
  
  // Recalculate impact
  if (law.stocks_impacted.STOCK_IMPACTED.length > 0) {
    const avgImpact = law.stocks_impacted.STOCK_IMPACTED.reduce(
      (sum, s) => sum + s.impact_score, 0
    ) / law.stocks_impacted.STOCK_IMPACTED.length;
    law.impact = Math.round(avgImpact);
  } else {
    law.impact = 0;
  }
  
  writeDatabase(db);
  
  addHistory({
    timestamp: new Date().toISOString(),
    lawId,
    changes: [`Removed stock ${ticker}`],
    notes: `Removed stock ${ticker} from law ${lawId}`
  });
  
  return law;
}

// Get all stocks for a sector
export async function getStocksBySector(sector: string): Promise<StockImpacted[]> {
  if (USE_SQL && sqlDb) {
    return await sqlDb.getStocksBySector(sector);
  }
  
  const db = readDatabase();
  const stocks: StockImpacted[] = [];
  
  Object.values(db.DATA).forEach(law => {
    if (law.sector === sector) {
      stocks.push(...law.stocks_impacted.STOCK_IMPACTED);
    }
  });
  
  // Deduplicate by ticker
  const uniqueStocks = new Map<string, StockImpacted>();
  stocks.forEach(stock => {
    if (!uniqueStocks.has(stock.ticker)) {
      uniqueStocks.set(stock.ticker, stock);
    }
  });
  
  return Array.from(uniqueStocks.values());
}

// Get all sectors
export async function getAllSectors(): Promise<string[]> {
  if (USE_SQL && sqlDb) {
    return await sqlDb.getAllSectors();
  }
  
  const db = readDatabase();
  const sectors = new Set<string>();
  
  Object.values(db.DATA).forEach(law => {
    sectors.add(law.sector);
  });
  
  return Array.from(sectors);
}

// Calculate analytics
export async function calculateAnalytics(): Promise<Analytics> {
  if (USE_SQL && sqlDb) {
    return await sqlDb.calculateAnalytics();
  }
  
  const db = readDatabase();
  const laws = Object.values(db.DATA);
  
  const totalLaws = laws.length;
  
  // Average impact by sector
  const sectorImpacts: { [sector: string]: number[] } = {};
  laws.forEach(law => {
    if (!sectorImpacts[law.sector]) {
      sectorImpacts[law.sector] = [];
    }
    sectorImpacts[law.sector].push(law.impact);
  });
  
  const averageImpactBySector: { [sector: string]: number } = {};
  Object.keys(sectorImpacts).forEach(sector => {
    const impacts = sectorImpacts[sector];
    averageImpactBySector[sector] = impacts.reduce((a, b) => a + b, 0) / impacts.length;
  });
  
  // SP500 affected percentage (assuming 500 stocks total)
  const uniqueStocks = new Set<string>();
  laws.forEach(law => {
    law.stocks_impacted.STOCK_IMPACTED.forEach(stock => {
      uniqueStocks.add(stock.ticker);
    });
  });
  
  const sp500AffectedPercentage = (uniqueStocks.size / 500) * 100;
  
  // Confidence-weighted impact
  const confidenceWeights: { [key: string]: number } = {
    'High': 1.0,
    'Medium': 0.7,
    'Low': 0.4
  };
  
  let totalWeightedImpact = 0;
  let totalWeight = 0;
  
  laws.forEach(law => {
    const weight = confidenceWeights[law.confidence] || 0.5;
    totalWeightedImpact += law.impact * weight;
    totalWeight += weight;
  });
  
  const confidenceWeightedImpact = totalWeight > 0 ? totalWeightedImpact / totalWeight : 0;
  
  return {
    totalLaws,
    averageImpactBySector,
    sp500AffectedPercentage,
    confidenceWeightedImpact,
    totalStocksImpacted: uniqueStocks.size
  };
}

// Validate law relationships
function validateLawRelationships(law: Law): void {
  // Ensure all stocks in law match the law's sector
  law.stocks_impacted.STOCK_IMPACTED.forEach(stock => {
    if (stock.sector !== law.sector) {
      stock.sector = law.sector;
    }
  });
  
  // Ensure affected count matches stock count
  law.affected = law.stocks_impacted.STOCK_IMPACTED.length;
  
  // Validate impact score range
  if (law.impact < 0 || law.impact > 10) {
    throw new Error('Impact score must be between 0 and 10');
  }
  
  // Validate stock impact scores
  law.stocks_impacted.STOCK_IMPACTED.forEach(stock => {
    if (stock.impact_score < 0 || stock.impact_score > 10) {
      throw new Error(`Stock ${stock.ticker} impact score must be between 0 and 10`);
    }
  });
}

// Get update history
export async function getHistory(): Promise<UpdateHistory[]> {
  if (USE_SQL && sqlDb) {
    return await sqlDb.getHistory();
  }
  
  initHistoryFile();
  try {
    const data = fs.readFileSync(HISTORY_PATH, 'utf-8');
    const historyData = JSON.parse(data);
    return historyData.history || [];
  } catch (error) {
    console.error('Error reading history:', error);
    return [];
  }
}

