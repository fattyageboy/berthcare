-- BerthCare Database Schema Initialization
-- This script creates all necessary tables, types, and indexes for the BerthCare application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================================================
-- CUSTOM TYPES
-- =============================================================================

-- User related types
CREATE TYPE user_role AS ENUM (
    'nurse',
    'psw',
    'coordinator',
    'supervisor',
    'admin',
    'family_member'
);

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

-- Client related types
CREATE TYPE care_level_enum AS ENUM (
    'level_1',
    'level_2',
    'level_3',
    'level_4',
    'palliative'
);

CREATE TYPE client_status AS ENUM ('active', 'discharged', 'deceased');

-- Visit related types
CREATE TYPE visit_type_enum AS ENUM (
    'personal_care',
    'medication',
    'assessment',
    'companionship',
    'respite',
    'palliative'
);

CREATE TYPE visit_status AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'missed',
    'cancelled'
);

-- Care plan types
CREATE TYPE care_plan_status AS ENUM (
    'draft',
    'active',
    'completed',
    'cancelled'
);

-- Family member types
CREATE TYPE family_access_level AS ENUM ('basic', 'detailed', 'emergency_only');

-- Sync operation types
CREATE TYPE sync_operation AS ENUM ('create', 'update', 'delete');

-- =============================================================================
-- ORGANIZATIONS TABLE
-- =============================================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address JSONB,
    phone VARCHAR(20),
    email VARCHAR(255),
    license_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_organizations_status ON organizations(status);

-- =============================================================================
-- USERS TABLE
-- =============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    status user_status DEFAULT 'active',
    last_login_at TIMESTAMP,
    profile_photo_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- =============================================================================
-- CLIENTS TABLE
-- =============================================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    address JSONB NOT NULL,
    emergency_contact JSONB,
    primary_diagnosis TEXT,
    allergies TEXT[],
    medications JSONB,
    care_level care_level_enum NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    status client_status DEFAULT 'active',
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clients_organization ON clients(organization_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_care_level ON clients(care_level);
CREATE INDEX idx_clients_client_number ON clients(client_number);

-- Full-text search on client names
CREATE INDEX idx_clients_name_search ON clients USING gin(
    to_tsvector('english', first_name || ' ' || last_name)
);

-- =============================================================================
-- CARE PLANS TABLE
-- =============================================================================

CREATE TABLE care_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    goals TEXT[],
    interventions JSONB NOT NULL,
    frequency JSONB NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status care_plan_status DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_care_plans_client ON care_plans(client_id);
CREATE INDEX idx_care_plans_status ON care_plans(status);
CREATE UNIQUE INDEX idx_care_plans_client_version ON care_plans(client_id, version);

-- =============================================================================
-- VISITS TABLE
-- =============================================================================

CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    check_in_location POINT,
    check_out_location POINT,
    visit_type visit_type_enum NOT NULL,
    status visit_status DEFAULT 'scheduled',
    documentation JSONB,
    photos TEXT[],
    signature_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    synced_at TIMESTAMP
);

CREATE INDEX idx_visits_client ON visits(client_id);
CREATE INDEX idx_visits_user ON visits(user_id);
CREATE INDEX idx_visits_scheduled_start ON visits(scheduled_start);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_created_at ON visits(created_at);

-- Visit lookup by date range (most common query)
CREATE INDEX idx_visits_date_range ON visits(scheduled_start, scheduled_end)
WHERE status IN ('scheduled', 'in_progress');

-- Geographic queries for visit verification
CREATE INDEX idx_visits_location ON visits USING GIST(check_in_location)
WHERE check_in_location IS NOT NULL;

-- =============================================================================
-- FAMILY MEMBERS TABLE
-- =============================================================================

CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL,
    access_level family_access_level DEFAULT 'basic',
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_family_members_client ON family_members(client_id);
CREATE INDEX idx_family_members_user ON family_members(user_id);
CREATE UNIQUE INDEX idx_family_members_client_user ON family_members(client_id, user_id);

-- =============================================================================
-- SYNC LOG TABLE
-- =============================================================================

CREATE TABLE sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    operation sync_operation NOT NULL,
    local_timestamp TIMESTAMP NOT NULL,
    server_timestamp TIMESTAMP DEFAULT NOW(),
    conflict_resolved BOOLEAN DEFAULT FALSE,
    resolution_strategy VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sync_log_user ON sync_log(user_id);
CREATE INDEX idx_sync_log_entity ON sync_log(entity_type, entity_id);
CREATE INDEX idx_sync_log_timestamp ON sync_log(server_timestamp);

-- =============================================================================
-- AUDIT LOG TABLE (for compliance and tracking)
-- =============================================================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_plans_updated_at BEFORE UPDATE ON care_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON family_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- View for active visits with client and user details
CREATE VIEW active_visits_view AS
SELECT
    v.id,
    v.scheduled_start,
    v.scheduled_end,
    v.actual_start,
    v.actual_end,
    v.status,
    v.visit_type,
    c.client_number,
    c.first_name AS client_first_name,
    c.last_name AS client_last_name,
    c.address AS client_address,
    u.first_name AS caregiver_first_name,
    u.last_name AS caregiver_last_name,
    u.role AS caregiver_role,
    u.phone AS caregiver_phone
FROM visits v
JOIN clients c ON v.client_id = c.id
JOIN users u ON v.user_id = u.id
WHERE v.status IN ('scheduled', 'in_progress')
    AND c.status = 'active'
    AND u.status = 'active';

-- View for client summary with care plan info
CREATE VIEW client_summary_view AS
SELECT
    c.id,
    c.client_number,
    c.first_name,
    c.last_name,
    c.date_of_birth,
    c.care_level,
    c.status,
    o.name AS organization_name,
    cp.title AS active_care_plan,
    cp.start_date AS care_plan_start,
    COUNT(DISTINCT v.id) AS total_visits,
    MAX(v.actual_end) AS last_visit_date
FROM clients c
LEFT JOIN organizations o ON c.organization_id = o.id
LEFT JOIN care_plans cp ON c.id = cp.client_id AND cp.status = 'active'
LEFT JOIN visits v ON c.id = v.client_id AND v.status = 'completed'
GROUP BY c.id, c.client_number, c.first_name, c.last_name, c.date_of_birth,
         c.care_level, c.status, o.name, cp.title, cp.start_date;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE organizations IS 'Healthcare organizations managing home care services';
COMMENT ON TABLE users IS 'System users including caregivers, coordinators, admins, and family members';
COMMENT ON TABLE clients IS 'Care recipients receiving home care services';
COMMENT ON TABLE care_plans IS 'Structured care plans with goals and interventions';
COMMENT ON TABLE visits IS 'Scheduled and completed care visits with offline sync support';
COMMENT ON TABLE family_members IS 'Family member relationships with access control';
COMMENT ON TABLE sync_log IS 'Offline synchronization tracking and conflict resolution';
COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for compliance and security';

-- =============================================================================
-- INITIAL CONFIGURATION
-- =============================================================================

-- Set timezone to UTC for consistency
SET timezone = 'UTC';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'BerthCare database schema initialized successfully!';
    RAISE NOTICE 'Total tables created: 9';
    RAISE NOTICE 'Total custom types: 9';
    RAISE NOTICE 'Total indexes: 30+';
    RAISE NOTICE 'Views created: 2';
END $$;
