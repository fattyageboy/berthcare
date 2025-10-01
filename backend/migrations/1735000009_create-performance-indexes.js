/**
 * Migration: Create performance indexes
 * Advanced indexes for full-text search, geospatial queries, and JSON queries
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Visit lookup by date range (most common query)
  // Composite index for scheduled visits within date ranges
  pgm.sql(`
    CREATE INDEX idx_visits_date_range ON visits(scheduled_start, scheduled_end)
    WHERE status IN ('scheduled', 'in_progress')
  `);

  // Geographic queries for visit verification (GIST index for PostGIS POINT type)
  pgm.sql(`
    CREATE INDEX idx_visits_location ON visits USING GIST(check_in_location)
    WHERE check_in_location IS NOT NULL
  `);

  // Full-text search on client names (GIN index with tsvector)
  pgm.sql(`
    CREATE INDEX idx_clients_name_search ON clients
    USING GIN(to_tsvector('english', first_name || ' ' || last_name))
  `);

  // Documentation search within visits (GIN index for JSONB)
  pgm.sql(`
    CREATE INDEX idx_visits_documentation_search ON visits
    USING GIN(documentation)
    WHERE documentation IS NOT NULL
  `);

  // Additional JSONB indexes for common queries

  // Client address search (for geolocation and routing)
  pgm.sql(`
    CREATE INDEX idx_clients_address_search ON clients
    USING GIN(address)
  `);

  // Client medications search (for medication-related queries)
  pgm.sql(`
    CREATE INDEX idx_clients_medications_search ON clients
    USING GIN(medications)
    WHERE medications IS NOT NULL
  `);

  // Care plan interventions search
  pgm.sql(`
    CREATE INDEX idx_care_plans_interventions_search ON care_plans
    USING GIN(interventions)
  `);

  // Care plan frequency search
  pgm.sql(`
    CREATE INDEX idx_care_plans_frequency_search ON care_plans
    USING GIN(frequency)
  `);

  // Sync log composite index for efficient sync queries
  pgm.sql(`
    CREATE INDEX idx_sync_log_entity_timestamp ON sync_log(entity_type, entity_id, server_timestamp DESC)
  `);

  // Add comments for documentation
  pgm.sql(`
    COMMENT ON INDEX idx_visits_date_range IS 'Optimizes visit queries by date range for scheduled and in-progress visits';
    COMMENT ON INDEX idx_visits_location IS 'GIST index for geospatial queries on visit check-in locations';
    COMMENT ON INDEX idx_clients_name_search IS 'Full-text search index for client name lookups';
    COMMENT ON INDEX idx_visits_documentation_search IS 'GIN index for JSON queries on visit documentation';
    COMMENT ON INDEX idx_clients_address_search IS 'GIN index for client address queries';
    COMMENT ON INDEX idx_clients_medications_search IS 'GIN index for medication-related queries';
    COMMENT ON INDEX idx_care_plans_interventions_search IS 'GIN index for care plan intervention queries';
    COMMENT ON INDEX idx_care_plans_frequency_search IS 'GIN index for care plan frequency queries';
    COMMENT ON INDEX idx_sync_log_entity_timestamp IS 'Composite index for efficient sync log queries';
  `);
};

exports.down = (pgm) => {
  // Drop all performance indexes
  pgm.dropIndex('sync_log', 'idx_sync_log_entity_timestamp');
  pgm.dropIndex('care_plans', 'idx_care_plans_frequency_search');
  pgm.dropIndex('care_plans', 'idx_care_plans_interventions_search');
  pgm.dropIndex('clients', 'idx_clients_medications_search');
  pgm.dropIndex('clients', 'idx_clients_address_search');
  pgm.dropIndex('visits', 'idx_visits_documentation_search');
  pgm.dropIndex('clients', 'idx_clients_name_search');
  pgm.dropIndex('visits', 'idx_visits_location');
  pgm.dropIndex('visits', 'idx_visits_date_range');
};
