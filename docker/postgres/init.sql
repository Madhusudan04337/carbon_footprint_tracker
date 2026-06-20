-- =============================================================================
-- PostgreSQL Init Script — runs once when the container volume is first created
-- =============================================================================

-- Enable UUID extension (useful for future UUIDs as primary keys)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_stat_statements for query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Log the init step for visibility
DO $$ BEGIN
    RAISE NOTICE '[EcoTrace] PostgreSQL initialized successfully.';
END $$;
