-- Create law_stock_relationships table if it doesn't exist
-- This table links laws to stocks with relationship details

CREATE TABLE IF NOT EXISTS law_stock_relationships (
    law_id VARCHAR(255) NOT NULL,
    stock_ticker VARCHAR(10) NOT NULL,
    impact_score INTEGER NOT NULL DEFAULT 0 CHECK (impact_score >= 0 AND impact_score <= 10),
    correlation_confidence VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (correlation_confidence IN ('High', 'Medium', 'Low')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (law_id, stock_ticker)
);
-- Note: Aurora DSQL does not support FOREIGN KEY constraints
-- Referential integrity must be enforced at the application level
-- Ensure that law_id exists in the laws table and stock_ticker exists in the stocks table

-- Create indexes for better query performance
-- IMPORTANT: Aurora DSQL requires ASYNC mode for CREATE INDEX
-- If these indexes already exist, you'll get an error. To recreate them:
--   1. Drop first: DROP INDEX IF EXISTS idx_law_stock_relationships_law_id;
--   2. Then run the CREATE INDEX ASYNC statement below

-- Create index on law_id column
CREATE INDEX ASYNC idx_law_stock_relationships_law_id ON law_stock_relationships(law_id);

-- Create index on stock_ticker column  
CREATE INDEX ASYNC idx_law_stock_relationships_stock_ticker ON law_stock_relationships(stock_ticker);



