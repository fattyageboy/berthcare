# BerthCare Seed Data Quick Start Guide

This guide provides quick instructions for working with BerthCare's development seed data.

## Table of Contents

- [Quick Start](#quick-start)
- [Available Commands](#available-commands)
- [Test Accounts](#test-accounts)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)

## Quick Start

### First Time Setup

1. **Ensure PostgreSQL is running:**
   ```bash
   # macOS (Homebrew)
   brew services start postgresql@14

   # Ubuntu/Debian
   sudo systemctl start postgresql

   # Docker
   docker-compose up -d postgres
   ```

2. **Create the database:**
   ```bash
   createdb berthcare_dev
   ```

3. **Configure environment:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run migrations and seed:**
   ```bash
   npm run migrate
   npm run seed:dev
   ```

5. **Verify the data:**
   ```bash
   npm run seed:verify
   ```

### Quick Reset

If you need to reset your database to a clean state:

```bash
cd backend
npm run db:reset
```

This will:
1. Rollback all migrations
2. Run migrations fresh
3. Seed test data
4. Display test login credentials

## Available Commands

All commands should be run from the `backend/` directory:

| Command | Description |
|---------|-------------|
| `npm run migrate` | Run all pending migrations |
| `npm run migrate:down` | Rollback the last migration |
| `npm run seed:dev` | Populate database with test data |
| `npm run seed:verify` | Verify seed data integrity |
| `npm run db:reset` | Complete database reset (migrations + seeds) |

## Test Accounts

After seeding, you can login with any of these accounts. All accounts use the password: **`BerthCare2024!`**

### Administrative Accounts

```yaml
Admin:
  email: admin@caringhearts.ca
  password: BerthCare2024!
  role: admin
  access: Full system access

Supervisor:
  email: supervisor@caringhearts.ca
  password: BerthCare2024!
  role: supervisor
  access: Manage staff and oversee care

Coordinator:
  email: coordinator@caringhearts.ca
  password: BerthCare2024!
  role: coordinator
  access: Schedule visits and coordinate care
```

### Healthcare Provider Accounts

```yaml
Nurse 1:
  email: nurse1@caringhearts.ca
  password: BerthCare2024!
  role: nurse
  name: Jennifer Williams

Nurse 2:
  email: nurse2@caringhearts.ca
  password: BerthCare2024!
  role: nurse
  name: David Thompson

PSW 1:
  email: psw1@caringhearts.ca
  password: BerthCare2024!
  role: psw
  name: Maria Garcia

PSW 2:
  email: psw2@caringhearts.ca
  password: BerthCare2024!
  role: psw
  name: James Anderson

PSW 3:
  email: psw3@caringhearts.ca
  password: BerthCare2024!
  role: psw
  name: Priya Patel
```

### Family Member Accounts

```yaml
John Smith:
  email: john.smith@email.com
  password: BerthCare2024!
  role: family_member
  relationship: Son of Margaret Smith
  access: Detailed access to mother's care

Mary Jones:
  email: mary.jones@email.com
  password: BerthCare2024!
  role: family_member
  relationship: Daughter of Dorothy Williams
  access: Detailed access to mother's care

Robert Brown:
  email: robert.brown@email.com
  password: BerthCare2024!
  role: family_member
  relationship: Son of James Brown
  access: Basic access to father's care
```

## Test Data Overview

The seed data includes:

### Organizations (2)
- **Caring Hearts Home Care** (Toronto, ON)
- **ComfortCare Services** (Vancouver, BC)

### Clients (5)

1. **Margaret Smith** - Alzheimer's Disease (Level 2)
2. **Robert Johnson** - Parkinson's Disease (Level 3)
3. **Dorothy Williams** - Diabetes & Hypertension (Level 2)
4. **James Brown** - Congestive Heart Failure (Level 3)
5. **Elizabeth Davis** - COPD & Osteoarthritis (Level 2)

### Active Care Plans (3)
- Alzheimer's Care and Daily Living Support
- Parkinson's Disease Management and Mobility Support
- Diabetes and Chronic Disease Management

### Visits
- Multiple completed visits (past 7 days)
- One visit currently in progress
- Several scheduled visits (today and tomorrow)

## Common Workflows

### Testing Authentication

```bash
# Test login with curl
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nurse1@caringhearts.ca",
    "password": "BerthCare2024!"
  }'
```

### Inspecting Seed Data

```bash
# Connect to database
psql -d berthcare_dev

# View all users
SELECT email, role, first_name, last_name FROM users ORDER BY role;

# View all clients
SELECT client_number, first_name, last_name, care_level, status FROM clients;

# View active visits
SELECT * FROM active_visits_view;

# View client summary
SELECT * FROM client_summary_view;

# Exit psql
\q
```

### Resetting Specific Data

If you only want to clear and reseed data (without touching migrations):

```bash
cd backend
npm run seed:dev
```

The script will detect existing data and offer to clear and reseed.

### Adding Custom Test Data

1. Create a new SQL file in `db/seeds/`:
   ```bash
   touch db/seeds/04_custom_data.sql
   ```

2. Add your INSERT statements:
   ```sql
   -- db/seeds/04_custom_data.sql
   INSERT INTO clients (...) VALUES (...);
   ```

3. Update `scripts/seed-dev.js` to include your new file:
   ```javascript
   const SEED_FILES = [
     '01_schema.sql',
     '02_seed_data.sql',
     '03_seed_users_with_auth.sql',
     '04_custom_data.sql'  // Add this line
   ];
   ```

4. Re-run seed:
   ```bash
   npm run seed:dev
   ```

### Changing Default Password

1. Generate new bcrypt hash:
   ```bash
   node scripts/generate-password-hash.js "YourNewPassword"
   ```

2. Update `db/seeds/03_seed_users_with_auth.sql` with new hash

3. Re-run seed:
   ```bash
   npm run seed:dev
   ```

## Troubleshooting

### Database Connection Failed

**Error:** `connection to server at "localhost", port 5432 failed`

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
brew services start postgresql@14  # macOS
sudo systemctl start postgresql    # Linux
```

### Database Does Not Exist

**Error:** `database "berthcare_dev" does not exist`

**Solution:**
```bash
createdb berthcare_dev
```

### Permission Denied

**Error:** `permission denied for database berthcare_dev`

**Solution:**
```bash
# Grant permissions
psql -d berthcare_dev -c "GRANT ALL PRIVILEGES ON DATABASE berthcare_dev TO postgres;"

# Or connect as postgres user
sudo -u postgres psql
```

### Migrations Failed

**Error:** Migration errors when running `npm run migrate`

**Solution:**
```bash
# Check current migration status
cd backend
npx node-pg-migrate list

# Rollback problematic migration
npm run migrate:down

# Fix migration file and re-run
npm run migrate
```

### Seed Data Already Exists

**Warning:** `Database already has N users`

**Solution:**
The script will ask if you want to continue. Options:

1. **Yes (recommended):** Clear and reseed with fresh data
2. **No:** Cancel and inspect database manually
3. **Manual clear:**
   ```sql
   -- Clear all data manually
   TRUNCATE audit_log, sync_log, family_members, visits,
            care_plans, clients, users, organizations CASCADE;
   ```

### Password Hash Not Working

**Error:** Login fails with seeded credentials

**Checks:**
1. Verify hash was set:
   ```sql
   SELECT email, password_hash IS NOT NULL as has_hash
   FROM users
   WHERE email = 'nurse1@caringhearts.ca';
   ```

2. Re-run seed with authentication:
   ```bash
   npm run seed:dev
   ```

3. Verify with seed verification script:
   ```bash
   npm run seed:verify
   ```

### Wrong Database

**Issue:** Seeds running against wrong database

**Solution:**
```bash
# Check your .env file
cat backend/.env | grep DB_NAME

# Or check DATABASE_URL
cat backend/.env | grep DATABASE_URL

# Update to correct database and re-run
npm run seed:dev
```

## Best Practices

1. **Always verify after seeding:**
   ```bash
   npm run seed:verify
   ```

2. **Use db:reset for clean slate:**
   ```bash
   npm run db:reset
   ```

3. **Don't modify seed files directly for testing:**
   - Create separate SQL files for experiments
   - Keep seed files pristine for consistent resets

4. **Document custom test data:**
   - Add comments to custom seed files
   - Update this guide with new test accounts

5. **Never use seed data in production:**
   - Default passwords are publicly known
   - Data is intentionally simple for testing

## Additional Resources

- **Full Documentation:** [`db/seeds/README.md`](../db/seeds/README.md)
- **Migration Guide:** [`backend/migrations/README.md`](../backend/migrations/README.md)
- **Database Schema:** [`db/seeds/01_schema.sql`](../db/seeds/01_schema.sql)
- **Architecture:** [`project-documentation/architecture-output.md`](../project-documentation/architecture-output.md)

## Quick Reference

```bash
# Complete setup from scratch
createdb berthcare_dev
cd backend
npm run migrate
npm run seed:dev
npm run seed:verify

# Daily development reset
cd backend
npm run db:reset

# Verify everything is working
npm run seed:verify
psql -d berthcare_dev -c "SELECT COUNT(*) FROM users;"

# Test authentication
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "nurse1@caringhearts.ca", "password": "BerthCare2024!"}'
```

## Support

For issues with seed data:

1. Check this guide's troubleshooting section
2. Verify database connection in `.env`
3. Run `npm run seed:verify` for diagnostics
4. Check seed script output for specific errors
5. Review `db/seeds/README.md` for detailed information

---

**Last Updated:** 2024-09-30
**Seed Data Version:** 1.0.0
**Default Password:** BerthCare2024!
