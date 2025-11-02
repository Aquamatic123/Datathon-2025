postgres=> \d laws
                                  Table "public.laws"
    Column    |            Type             | Collation | Nullable |      Default      
--------------+-----------------------------+-----------+----------+-------------------
 id           | character varying(255)      |           | not null | 
 jurisdiction | character varying(255)      |           | not null | 
 status       | character varying(50)       |           | not null | 
 sector       | character varying(255)      |           | not null | 
 impact       | integer                     |           | not null | 
 confidence   | character varying(50)       |           | not null | 
 published    | date                        |           | not null | 
 affected     | integer                     |           | not null | 0
 created_at   | timestamp without time zone |           |          | CURRENT_TIMESTAMP
 updated_at   | timestamp without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "laws_pkey" PRIMARY KEY, btree_index (id) INCLUDE (jurisdiction, status, sector, impact, confidence, published, affected, created_at, updated_at)
Check constraints:
    "laws_confidence_check" CHECK (confidence::text = ANY (ARRAY['High'::character varying, 'Medium'::character varying, 'Low'::character varying]::text[]))
    "laws_impact_check" CHECK (impact >= 0 AND impact <= 10)
    "laws_status_check" CHECK (status::text = ANY (ARRAY['Active'::character varying, 'Pending'::character varying, 'Expired'::character varying]::text[]))

postgres=> \d stocks
                                 Table "public.stocks"
    Column    |            Type             | Collation | Nullable |      Default      
--------------+-----------------------------+-----------+----------+-------------------
 ticker       | character varying(10)       |           | not null | 
 company_name | character varying(255)      |           | not null | 
 sector       | character varying(255)      |           | not null | 
 created_at   | timestamp without time zone |           |          | CURRENT_TIMESTAMP
 updated_at   | timestamp without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "stocks_pkey" PRIMARY KEY, btree_index (ticker) INCLUDE (company_name, sector, created_at, updated_at)

postgres=> \d law_stock_relationships
                                  Table "public.law_stock_relationships"
         Column         |            Type             | Collation | Nullable |           Default           
------------------------+-----------------------------+-----------+----------+-----------------------------
 law_id                 | character varying(255)      |           | not null | 
 stock_ticker           | character varying(10)       |           | not null | 
 impact_score           | integer                     |           | not null | 0
 correlation_confidence | character varying(50)       |           | not null | 'Medium'::character varying
 notes                  | text                        |           |          | 
 created_at             | timestamp without time zone |           |          | CURRENT_TIMESTAMP
 updated_at             | timestamp without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "law_stock_relationships_pkey" PRIMARY KEY, btree_index (law_id, stock_ticker) INCLUDE (impact_score, correlation_confidence, notes, created_at, updated_at)
    "idx_law_stock_relationships_law_id" btree_index (law_id)
    "idx_law_stock_relationships_stock_ticker" btree_index (stock_ticker)
Check constraints:
    "law_stock_relationships_correlation_confidence_check" CHECK (correlation_confidence::text = ANY (ARRAY['High'::character varying, 'Medium'::character varying, 'Low'::character varying]::text[]))
    "law_stock_relationships_impact_score_check" CHECK (impact_score >= 0 AND impact_score <= 10)

postgres=> 