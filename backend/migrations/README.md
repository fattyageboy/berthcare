# Database Migrations

This directory contains database migration files for the BerthCare application. The migrations are managed using `node-pg-migrate`.

## Overview

The migrations create the complete BerthCare database schema including:

1. **Custom ENUM types** - User roles, statuses, care levels, visit types, etc.
2. **Organizations table** - Healthcare organizations using the system
3. **Users table** - Caregivers, coordinators, supervisors, admins, and family members
4. **Clients table** - Patients receiving home care services
5. **Visits table** - Visit documentation with location verification
6. **Care Plans table** - Care goals, interventions, and schedules
7. **Family Members table** - Junction table linking families to clients
8. **Sync Log table** - Offline synchronization tracking
9. **Performance indexes** - GIN, GIST, and composite indexes for optimal query performance

## Migration Files

```
migrations/
├── 1735000001_create-enum-types.js           # All custom ENUM types
├── 1735000002_create-organizations-table.js  # Organizations table
├── 1735000003_create-users-table.js          # Users with RBAC
├── 1735000004_create-clients-table.js        # Client (patient) records
├── 1735000005_create-visits-table.js         # Visit documentation
├── 1735000006_create-care-plans-table.js     # Care plan management
├── 1735000007_create-family-members-table.js # Family access control
├── 1735000008_create-sync-log-table.js       # Sync tracking
└── 1735000009_create-performance-indexes.js  # Advanced indexes
```

## Running Migrations

### Apply all pending migrations
```bash
npm run migrate
```

### Rollback the last migration
```bash
npm run migrate:down
```

### Redo the last migration (down then up)
```bash
npm run migrate:redo
```

### Create a new migration
```bash
npm run migrate:create my-migration-name
```

## Database Configuration

Migrations use the database connection configured in `.env`:

```env
DATABASE_URL=postgresql://postgres:dev_password_change_in_production@localhost:5432/berthcare_dev
```

Or individual parameters:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=berthcare_dev
DB_USER=postgres
DB_PASSWORD=dev_password_change_in_production
```

## Migration Configuration

The migration framework is configured in `.migration.config.js`:

- **Migration directory**: `migrations/`
- **Migration table**: `pgmigrations`
- **Schema**: `public`
- **File language**: JavaScript
- **Check order**: Enabled
- **Verbose logging**: Enabled

## Schema Details

### Tables Created

| Table | Description | Key Features |
|-------|-------------|--------------|
| organizations | Healthcare organizations | Unique organization codes |
| users | User accounts with RBAC | Multiple role types, organization scoped |
| clients | Patient records | JSONB address, allergies array, care levels |
| visits | Visit documentation | GPS location (POINT), JSONB documentation, offline sync |
| care_plans | Care management | Versioning, JSONB interventions/frequency |
| family_members | Family access control | Access levels, notification preferences |
| sync_log | Sync tracking | Conflict resolution, entity tracking |

### Custom Types (ENUMs)

- `user_role`: nurse, psw, coordinator, supervisor, admin, family_member
- `user_status`: active, inactive, suspended
- `care_level_enum`: level_1, level_2, level_3, level_4, palliative
- `client_status`: active, discharged, deceased
- `visit_type_enum`: personal_care, medication, assessment, companionship, respite, palliative
- `visit_status`: scheduled, in_progress, completed, missed, cancelled
- `care_plan_status`: draft, active, completed, cancelled
- `family_access_level`: basic, detailed, emergency_only
- `sync_operation`: create, update, delete

### Indexes

The schema includes comprehensive indexing for optimal performance:

#### B-Tree Indexes
- Primary keys on all tables
- Foreign key indexes (organization_id, client_id, user_id, etc.)
- Status and timestamp indexes for filtering
- Composite indexes for common query patterns

#### GIN Indexes (JSONB and Full-Text Search)
- `idx_clients_name_search` - Full-text search on client names
- `idx_visits_documentation_search` - JSONB queries on visit documentation
- `idx_clients_address_search` - Client address queries
- `idx_clients_medications_search` - Medication searches
- `idx_care_plans_interventions_search` - Care plan intervention queries
- `idx_care_plans_frequency_search` - Frequency pattern queries

#### GIST Indexes (Geospatial)
- `idx_visits_location` - Geospatial queries on visit check-in locations

#### Partial Indexes
- `idx_visits_date_range` - Scheduled/in-progress visits only
- `idx_visits_location` - Only when location exists
- `idx_visits_documentation_search` - Only when documentation exists

### Constraints

#### Check Constraints
- `visits_scheduled_times_check` - Ensures scheduled_end > scheduled_start
- `visits_actual_times_check` - Ensures actual_end > actual_start when both set
- `care_plans_dates_check` - Ensures end_date >= start_date when set
- `care_plans_version_check` - Ensures version > 0

#### Foreign Key Constraints
- All foreign keys properly defined with appropriate ON DELETE actions
- CASCADE deletes for dependent records (visits, care_plans, family_members)
- SET NULL for optional references (organization_id, user references)

#### Unique Constraints
- Email addresses must be unique
- Client numbers must be unique
- Organization codes must be unique
- Care plan client+version combinations must be unique
- Family member client+user combinations must be unique

## Verification

After running migrations, you can verify the schema:

### List all tables
```bash
docker exec berthcare-postgres psql -U postgres -d berthcare_dev -c "\dt"
```

### List all custom types
```bash
docker exec berthcare-postgres psql -U postgres -d berthcare_dev -c "\dT+"
```

### View a specific table structure
```bash
docker exec berthcare-postgres psql -U postgres -d berthcare_dev -c "\d visits"
```

### List all indexes
```bash
docker exec berthcare-postgres psql -U postgres -d berthcare_dev -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;"
```

### View migration history
```bash
docker exec berthcare-postgres psql -U postgres -d berthcare_dev -c "SELECT * FROM pgmigrations ORDER BY run_on;"
```

## Best Practices

1. **Never edit existing migrations** - Create new migrations for schema changes
2. **Test migrations** - Always test both up and down migrations locally
3. **Use transactions** - Keep migrations atomic and reversible
4. **Document changes** - Add clear comments in migration files
5. **Backup before production** - Always backup production database before running migrations

## Troubleshooting

### Migration fails with "relation already exists"
This usually means a migration was partially applied. Check the `pgmigrations` table to see which migrations have been recorded, and manually clean up any orphaned objects.

### Cannot rollback migration
Ensure the down migration is properly implemented. Some changes (like dropping columns with data) may not be fully reversible.

### Connection errors
Verify your database connection settings in `.env` and ensure the PostgreSQL container is running:
```bash
docker ps | grep postgres
docker logs berthcare-postgres
```

## References

- [node-pg-migrate documentation](https://salsita.github.io/node-pg-migrate/)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [BerthCare Architecture Documentation](../../project-documentation/architecture-output.md)
