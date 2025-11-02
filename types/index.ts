export interface StockImpacted {
  ticker: string;
  company_name: string;
  sector: string;
  impact_score: number;
  correlation_confidence: string;
  notes: string;
}

export interface Law {
  jurisdiction: string;
  status: string;
  sector: string;
  impact: number;
  confidence: string;
  published: string;
  affected: number;
  document?: {
    filename: string;
    content: string;
    contentType: string;
    uploadedAt: string;
  };
  stocks_impacted: {
    STOCK_IMPACTED: StockImpacted[];
  };
}

export interface Database {
  DATA: {
    [lawId: string]: Law;
  };
}

export interface Analytics {
  totalLaws: number;
  averageImpactBySector: { [sector: string]: number };
  sp500AffectedPercentage: number;
  confidenceWeightedImpact: number;
  totalStocksImpacted: number;
}

export interface UpdateHistory {
  timestamp: string;
  lawId: string;
  changes: string[];
  notes: string;
}

