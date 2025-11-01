# SQL Migration Schema Documentation

This document outlines the SQL database schema that corresponds to the JSON mock database structure used in this CRM application.

## Overview

The CRM tracks laws, regulations, sectors, stocks, and their relationships. The SQL schema is designed to maintain referential integrity and support efficient queries while preserving the logical relationships established in the JSON structure.

## Database Schema

### Table: `laws`

Stores information about laws and regulations.

```sql
CREATE TABLE laws (
    id VARCHAR(255) PRIMARY KEY,
    jurisdiction VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Active', 'Pending', 'Expired')),
    sector VARCHAR(255) NOT NULL,
    impact INTEGER NOT NULL CHECK (impact >= 0 AND impact <= 10),
    confidence VARCHAR(50) NOT NULL CHECK (confidence IN ('High', 'Medium', 'Low')),
    published DATE NOT NULL,
    affected INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sector (sector),
    INDEX idx_status (status),
    INDEX idx_published (published)
);
```

### Table: `sectors`

Stores unique sectors for reference and normalization.

```sql
CREATE TABLE sectors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `stocks`

Stores stock information. Stocks can be associated with multiple laws.

```sql
CREATE TABLE stocks (
    ticker VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    sector VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sector (sector),
    FOREIGN KEY (sector) REFERENCES sectors(name) ON UPDATE CASCADE
);
```

### Table: `law_stock_relationships`

Junction table linking laws to stocks with relationship-specific data.

```sql
CREATE TABLE law_stock_relationships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    law_id VARCHAR(255) NOT NULL,
    stock_ticker VARCHAR(10) NOT NULL,
    impact_score INTEGER NOT NULL CHECK (impact_score >= 0 AND impact_score <= 10),
    correlation_confidence VARCHAR(50) NOT NULL CHECK (correlation_confidence IN ('High', 'Medium', 'Low')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_law_stock (law_id, stock_ticker),
    FOREIGN KEY (law_id) REFERENCES laws(id) ON DELETE CASCADE,
    FOREIGN KEY (stock_ticker) REFERENCES stocks(ticker) ON DELETE CASCADE,
    INDEX idx_law_id (law_id),
    INDEX idx_stock_ticker (stock_ticker)
);
```

### Table: `update_history`

Tracks all changes to the database for audit purposes.

```sql
CREATE TABLE update_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    law_id VARCHAR(255) NOT NULL,
    changes JSON,
    notes TEXT,
    INDEX idx_law_id (law_id),
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (law_id) REFERENCES laws(id) ON DELETE CASCADE
);
```

## Relationships

### One-to-Many: Laws → Law-Stock Relationships
- Each law can have multiple stock relationships
- Foreign key: `law_stock_relationships.law_id` → `laws.id`

### One-to-Many: Stocks → Law-Stock Relationships
- Each stock can be associated with multiple laws
- Foreign key: `law_stock_relationships.stock_ticker` → `stocks.ticker`

### Many-to-One: Laws → Sectors
- Each law belongs to one sector
- Reference: `laws.sector` → `sectors.name`

### Many-to-One: Stocks → Sectors
- Each stock belongs to one sector
- Foreign key: `stocks.sector` → `sectors.name`

## Migration Queries

### Insert Initial Sectors

```sql
INSERT INTO sectors (name, description) VALUES
('Clean Energy', 'Renewable energy and clean technology companies'),
('Technology', 'Technology and software companies'),
('Healthcare', 'Healthcare and pharmaceutical companies'),
('Finance', 'Financial services and banking'),
('Manufacturing', 'Manufacturing and industrial companies');
```

### Insert a Law with Stocks

```sql
-- Start transaction
START TRANSACTION;

-- Insert law
INSERT INTO laws (id, jurisdiction, status, sector, impact, confidence, published, affected)
VALUES ('Law1', 'United States', 'Active', 'Clean Energy', 8, 'High', '2024-01-15', 3);

-- Insert stocks
INSERT INTO stocks (ticker, company_name, sector) VALUES
('TSLA', 'Tesla Inc.', 'Clean Energy'),
('ENPH', 'Enphase Energy Inc.', 'Clean Energy'),
('RUN', 'Sunrun Inc.', 'Clean Energy')
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

-- Create relationships
INSERT INTO law_stock_relationships (law_id, stock_ticker, impact_score, correlation_confidence, notes)
VALUES
('Law1', 'TSLA', 9, 'High', 'Direct beneficiary of clean energy subsidies'),
('Law1', 'ENPH', 8, 'High', 'Solar energy equipment manufacturer'),
('Law1', 'RUN', 7, 'Medium', 'Residential solar installation company');

-- Update affected count
UPDATE laws SET affected = (
    SELECT COUNT(*) FROM law_stock_relationships WHERE law_id = 'Law1'
) WHERE id = 'Law1';

COMMIT;
```

## Useful Queries

### Get All Laws with Stock Counts

```sql
SELECT 
    l.*,
    COUNT(lsr.stock_ticker) as stock_count
FROM laws l
LEFT JOIN law_stock_relationships lsr ON l.id = lsr.law_id
GROUP BY l.id;
```

### Get Average Impact by Sector

```sql
SELECT 
    l.sector,
    AVG(l.impact) as average_impact,
    COUNT(DISTINCT l.id) as law_count
FROM laws l
GROUP BY l.sector;
```

### Get Stocks Impacted by Multiple Laws

```sql
SELECT 
    s.ticker,
    s.company_name,
    COUNT(DISTINCT lsr.law_id) as law_count,
    AVG(lsr.impact_score) as avg_impact_score
FROM stocks s
JOIN law_stock_relationships lsr ON s.ticker = lsr.stock_ticker
GROUP BY s.ticker, s.company_name
HAVING law_count > 1
ORDER BY law_count DESC;
```

### Calculate SP500 Affected Percentage

```sql
SELECT 
    (COUNT(DISTINCT lsr.stock_ticker) / 500.0) * 100 as sp500_affected_percentage
FROM law_stock_relationships lsr;
```

### Confidence-Weighted Impact

```sql
SELECT 
    AVG(
        CASE l.confidence
            WHEN 'High' THEN l.impact * 1.0
            WHEN 'Medium' THEN l.impact * 0.7
            WHEN 'Low' THEN l.impact * 0.4
            ELSE l.impact * 0.5
        END
    ) as confidence_weighted_impact
FROM laws l;
```

## Data Consistency Rules

1. **Sector Consistency**: When a law's sector is updated, all associated stocks in the law-stock relationships should be updated to match (if they belong to that law).

2. **Affected Count**: The `affected` field in `laws` should always equal the count of relationships in `law_stock_relationships` for that law. This can be enforced via triggers:

```sql
DELIMITER //
CREATE TRIGGER update_affected_count_after_insert
AFTER INSERT ON law_stock_relationships
FOR EACH ROW
BEGIN
    UPDATE laws 
    SET affected = (
        SELECT COUNT(*) 
        FROM law_stock_relationships 
        WHERE law_id = NEW.law_id
    )
    WHERE id = NEW.law_id;
END//

CREATE TRIGGER update_affected_count_after_delete
AFTER DELETE ON law_stock_relationships
FOR EACH ROW
BEGIN
    UPDATE laws 
    SET affected = (
        SELECT COUNT(*) 
        FROM law_stock_relationships 
        WHERE law_id = OLD.law_id
    )
    WHERE id = OLD.law_id;
END//
DELIMITER ;
```

3. **Impact Score Calculation**: The law's impact score should be recalculated when stocks are added/updated/removed:

```sql
DELIMITER //
CREATE TRIGGER recalculate_impact_after_change
AFTER INSERT ON law_stock_relationships
FOR EACH ROW
BEGIN
    UPDATE laws 
    SET impact = (
        SELECT ROUND(AVG(impact_score))
        FROM law_stock_relationships
        WHERE law_id = NEW.law_id
    )
    WHERE id = NEW.law_id;
END//
DELIMITER ;
```

## Migration Script

A complete migration script should:

1. Create all tables in the correct order (sectors first, then laws, stocks, relationships, history)
2. Insert initial sector data
3. Migrate existing JSON data to SQL tables
4. Set up triggers for data consistency
5. Create indexes for performance
6. Set up foreign key constraints

## Notes

- The JSON structure uses nested `stocks_impacted.STOCK_IMPACTED` arrays, which maps to the `law_stock_relationships` junction table in SQL.
- The `affected` count in JSON is automatically maintained; in SQL, triggers can maintain this automatically.
- Sector names are stored as strings in the JSON but can be normalized to a `sectors` table for better data integrity.
- All timestamps in SQL use `TIMESTAMP` type for automatic timezone handling.

