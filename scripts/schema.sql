-- scripts/schema.sql
-- PostgreSQL Schema for CRM Dashboard
-- Compatible with AWS RDS PostgreSQL

-- Create sectors table
CREATE TABLE IF NOT EXISTS sectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create laws table
CREATE TABLE IF NOT EXISTS laws (
    id VARCHAR(255) PRIMARY KEY,
    jurisdiction VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Active', 'Pending', 'Expired')),
    sector VARCHAR(255) NOT NULL,
    impact INTEGER NOT NULL CHECK (impact >= 0 AND impact <= 10),
    confidence VARCHAR(50) NOT NULL CHECK (confidence IN ('High', 'Medium', 'Low')),
    published DATE NOT NULL,
    affected INTEGER NOT NULL DEFAULT 0,
    -- Document storage
    document_filename VARCHAR(500),
    document_content TEXT,
    document_content_type VARCHAR(100),
    document_uploaded_at TIMESTAMP,
    -- LLM metadata fields (JSONB for flexible storage)
    llm_metadata JSONB,
    llm_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stocks table
CREATE TABLE IF NOT EXISTS stocks (
    ticker VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    sector VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create law_stock_relationships table (junction table)
CREATE TABLE IF NOT EXISTS law_stock_relationships (
    id SERIAL PRIMARY KEY,
    law_id VARCHAR(255) NOT NULL,
    stock_ticker VARCHAR(10) NOT NULL,
    impact_score INTEGER NOT NULL CHECK (impact_score >= 0 AND impact_score <= 10),
    correlation_confidence VARCHAR(50) NOT NULL CHECK (correlation_confidence IN ('High', 'Medium', 'Low')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (law_id, stock_ticker),
    FOREIGN KEY (law_id) REFERENCES laws(id) ON DELETE CASCADE,
    FOREIGN KEY (stock_ticker) REFERENCES stocks(ticker) ON DELETE CASCADE
);

-- Create update_history table
CREATE TABLE IF NOT EXISTS update_history (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    law_id VARCHAR(255) NOT NULL,
    changes JSONB,
    notes TEXT,
    FOREIGN KEY (law_id) REFERENCES laws(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_laws_sector ON laws(sector);
CREATE INDEX IF NOT EXISTS idx_laws_status ON laws(status);
CREATE INDEX IF NOT EXISTS idx_laws_published ON laws(published);
CREATE INDEX IF NOT EXISTS idx_laws_llm_metadata ON laws USING GIN (llm_metadata);
CREATE INDEX IF NOT EXISTS idx_stocks_sector ON stocks(sector);
CREATE INDEX IF NOT EXISTS idx_law_stock_law_id ON law_stock_relationships(law_id);
CREATE INDEX IF NOT EXISTS idx_law_stock_stock_ticker ON law_stock_relationships(stock_ticker);
CREATE INDEX IF NOT EXISTS idx_history_law_id ON update_history(law_id);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON update_history(timestamp);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_laws_updated_at BEFORE UPDATE ON laws
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON stocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_law_stock_updated_at BEFORE UPDATE ON law_stock_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update affected count
CREATE OR REPLACE FUNCTION update_law_affected_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE laws 
    SET affected = (
        SELECT COUNT(*) 
        FROM law_stock_relationships 
        WHERE law_id = COALESCE(NEW.law_id, OLD.law_id)
    )
    WHERE id = COALESCE(NEW.law_id, OLD.law_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_affected_count_after_insert
AFTER INSERT ON law_stock_relationships
FOR EACH ROW EXECUTE FUNCTION update_law_affected_count();

CREATE TRIGGER update_affected_count_after_delete
AFTER DELETE ON law_stock_relationships
FOR EACH ROW EXECUTE FUNCTION update_law_affected_count();

-- Create trigger to recalculate impact score
CREATE OR REPLACE FUNCTION recalculate_law_impact()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE laws 
    SET impact = (
        SELECT COALESCE(ROUND(AVG(impact_score)), 0)
        FROM law_stock_relationships
        WHERE law_id = COALESCE(NEW.law_id, OLD.law_id)
    )
    WHERE id = COALESCE(NEW.law_id, OLD.law_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER recalculate_impact_after_change
AFTER INSERT OR UPDATE OR DELETE ON law_stock_relationships
FOR EACH ROW EXECUTE FUNCTION recalculate_law_impact();

-- Insert initial sectors
INSERT INTO sectors (name, description) VALUES
('Clean Energy', 'Renewable energy and clean technology companies'),
('Technology', 'Technology and software companies'),
('Healthcare', 'Healthcare and pharmaceutical companies'),
('Finance', 'Financial services and banking'),
('Manufacturing', 'Manufacturing and industrial companies')
ON CONFLICT (name) DO NOTHING;

