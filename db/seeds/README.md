# BerthCare Database Seed Scripts

This directory contains SQL scripts to populate the BerthCare database with realistic test data for development purposes.

## Overview

The seed scripts create a complete test environment with:

- **2 Organizations**: Healthcare providers managing home care services
- **11 Users**: Across different roles (admin, supervisor, coordinator, nurses, PSWs, family members)
- **5 Clients**: Care recipients with various conditions and care levels
- **3 Care Plans**: Detailed care plans with goals and interventions
- **Multiple Visits**: Past, current, and future scheduled visits
- **Family Relationships**: Connections between family members and clients

## Prerequisites

Before running the seed scripts, ensure:

1. **PostgreSQL is running**
   ```bash
   # Check if PostgreSQL is running
   psql -V
   ```

2. **Database exists**
   ```bash
   # Create database if needed
   createdb berthcare_dev
   ```

3. **Migrations are up to date**
   ```bash
   cd backend
   npm run migrate
   ```

4. **Environment variables are configured**
   - Copy `backend/.env.example` to `backend/.env`
   - Update database credentials

## Seed Files

The seed scripts run in the following order:

### 1. `01_schema.sql`
Creates the complete database schema including:
- Custom PostgreSQL types (enums)
- All tables with proper relationships
- Indexes for performance
- Triggers for automatic timestamp updates
- Views for common queries
- Audit logging infrastructure

**Note**: This file is only needed for fresh databases. If you've already run migrations, skip this file.

### 2. `02_seed_data.sql`
Populates the database with realistic test data:

#### Organizations
- **Caring Hearts Home Care** (Toronto, ON)
- **ComfortCare Services** (Vancouver, BC)

#### Users by Role

**Administrative Staff:**
- `admin@caringhearts.ca` - System Administrator
- `supervisor@caringhearts.ca` - Clinical Supervisor
- `coordinator@caringhearts.ca` - Care Coordinator

**Healthcare Providers:**
- `nurse1@caringhearts.ca` - Registered Nurse (Jennifer Williams)
- `nurse2@caringhearts.ca` - Registered Nurse (David Thompson)
- `psw1@caringhearts.ca` - Personal Support Worker (Maria Garcia)
- `psw2@caringhearts.ca` - Personal Support Worker (James Anderson)
- `psw3@caringhearts.ca` - Personal Support Worker (Priya Patel)

**Family Members:**
- `john.smith@email.com` - Son of Margaret Smith
- `mary.jones@email.com` - Daughter of Dorothy Williams
- `robert.brown@email.com` - Son of James Brown

#### Clients
1. **Margaret Smith** (84 years)
   - Diagnosis: Alzheimer's Disease - Early Stage
   - Care Level: Level 2
   - Medications: Donepezil, Memantine
   - Allergies: Penicillin, Sulfa drugs

2. **Robert Johnson** (89 years)
   - Diagnosis: Parkinson's Disease
   - Care Level: Level 3
   - Medications: Carbidopa-Levodopa, Pramipexole
   - Allergies: None known

3. **Dorothy Williams** (79 years)
   - Diagnosis: Diabetes Type 2, Hypertension
   - Care Level: Level 2
   - Medications: Metformin, Lisinopril, Atorvastatin
   - Allergies: Latex

4. **James Brown** (86 years)
   - Diagnosis: Congestive Heart Failure
   - Care Level: Level 3
   - Medications: Furosemide, Carvedilol, Spironolactone
   - Allergies: None known

5. **Elizabeth Davis** (76 years)
   - Diagnosis: COPD, Osteoarthritis
   - Care Level: Level 2
   - Medications: Tiotropium, Albuterol, Acetaminophen
   - Allergies: Aspirin

#### Care Plans
- Alzheimer's Care and Daily Living Support (Margaret Smith)
- Parkinson's Disease Management and Mobility Support (Robert Johnson)
- Diabetes and Chronic Disease Management (Dorothy Williams)

#### Visits
- **Completed visits** from the past 7 days with documentation
- **Current visit** in progress
- **Scheduled visits** for today and tomorrow
- Includes realistic documentation, vital signs, and care notes

### 3. `03_seed_users_with_auth.sql`
Adds authentication credentials to all seeded users:

- **Default Password**: `BerthCare2024!`
- **Hash Algorithm**: bcrypt (cost factor: 10)
- Applies to all 11 test users

## Usage

### Quick Start

Run the complete seeding process with a single command:

```bash
cd backend
npm run seed:dev
```

This will:
1. Check database state
2. Clear existing data if present (with confirmation)
3. Execute all seed files in order
4. Display a summary of seeded data
5. Show test login credentials

### Reset Database

To completely reset your database (migrations + seeds):

```bash
cd backend
npm run db:reset
```

This runs:
1. `npm run migrate:down` - Rollback migrations
2. `npm run migrate` - Run migrations
3. `npm run seed:dev` - Seed test data

### Manual Seeding

If you prefer to run seed files manually:

```bash
# Using psql
psql -U postgres -d berthcare_dev -f db/seeds/01_schema.sql
psql -U postgres -d berthcare_dev -f db/seeds/02_seed_data.sql
psql -U postgres -d berthcare_dev -f db/seeds/03_seed_users_with_auth.sql

# Or using npm script with individual files
cd backend
node ../scripts/seed-dev.js
```

## Test Login Credentials

After seeding, you can test authentication with any of these accounts:

### Administrator Access
```
Email:    admin@caringhearts.ca
Password: BerthCare2024!
Role:     admin
```

### Supervisor Access
```
Email:    supervisor@caringhearts.ca
Password: BerthCare2024!
Role:     supervisor
```

### Care Coordinator Access
```
Email:    coordinator@caringhearts.ca
Password: BerthCare2024!
Role:     coordinator
```

### Nurse Access
```
Email:    nurse1@caringhearts.ca
Password: BerthCare2024!
Role:     nurse
```

### Personal Support Worker Access
```
Email:    psw1@caringhearts.ca
Password: BerthCare2024!
Role:     psw
```

### Family Member Access
```
Email:    john.smith@email.com
Password: BerthCare2024!
Role:     family_member
```

## Verifying Seed Data

After seeding, verify the data was created correctly:

```sql
-- Check organization count
SELECT COUNT(*) FROM organizations;
-- Expected: 2

-- Check user count by role
SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;
-- Expected: admin(1), coordinator(1), family_member(3), nurse(2), psw(3), supervisor(1)

-- Check client count
SELECT COUNT(*) FROM clients;
-- Expected: 5

-- Check care plans
SELECT COUNT(*) FROM care_plans WHERE status = 'active';
-- Expected: 3

-- Check visits
SELECT status, COUNT(*) as count FROM visits GROUP BY status ORDER BY status;
-- Expected: scheduled, in_progress, completed visits

-- Verify password hashes exist
SELECT COUNT(*) FROM users WHERE password_hash IS NOT NULL;
-- Expected: 11
```

## Testing Authentication

Test login functionality using curl:

```bash
# Test nurse login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nurse1@caringhearts.ca",
    "password": "BerthCare2024!"
  }'

# Test PSW login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "psw1@caringhearts.ca",
    "password": "BerthCare2024!"
  }'

# Test family member login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.smith@email.com",
    "password": "BerthCare2024!"
  }'
```

## Customizing Seed Data

### Changing Default Password

To change the default password for seeded users:

1. Generate a new bcrypt hash:
   ```bash
   node scripts/generate-password-hash.js "YourNewPassword"
   ```

2. Update the hash in `03_seed_users_with_auth.sql`:
   ```sql
   UPDATE users SET password_hash = 'your-new-hash-here'
   WHERE id IN (...);
   ```

3. Re-run the seed script:
   ```bash
   npm run seed:dev
   ```

### Adding More Test Data

To add additional test data:

1. Create a new SQL file in `db/seeds/` (e.g., `04_additional_data.sql`)
2. Add the file to the `SEED_FILES` array in `scripts/seed-dev.js`
3. Run the seed script

Example additional data file:

```sql
-- 04_additional_data.sql
-- Add more clients
INSERT INTO clients (client_number, first_name, last_name, ...) VALUES
  ('CH-2024-006', 'Additional', 'Client', ...);

-- Add more visits
INSERT INTO visits (client_id, user_id, ...) VALUES
  (...);
```

## Troubleshooting

### "Database already has users" Warning

If you see this warning, the script detected existing data. Options:

1. **Continue**: The script will clear and reseed
2. **Cancel**: Stop and manually inspect the database
3. **Manual clear**: Run `TRUNCATE` commands manually

### Connection Refused

If you get a connection error:

```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Start PostgreSQL (Ubuntu/Debian)
sudo systemctl start postgresql

# Start PostgreSQL (Docker)
docker-compose up -d postgres
```

### Permission Denied

If you get permission errors:

```bash
# Ensure database exists
createdb berthcare_dev

# Grant permissions
psql -d berthcare_dev -c "GRANT ALL PRIVILEGES ON DATABASE berthcare_dev TO postgres;"
```

### Migration Conflicts

If seed data conflicts with migrations:

```bash
# Reset everything
npm run db:reset

# Or manually
npm run migrate:down
npm run migrate
npm run seed:dev
```

## Production Considerations

**IMPORTANT**: These seed scripts are for development only!

- Do NOT run these scripts in production
- Production data should be migrated or imported separately
- Default passwords must be changed immediately
- Use strong, unique passwords for production accounts
- Enable additional security measures (MFA, password policies)
- Follow HIPAA and healthcare data compliance requirements

## Related Files

- `backend/package.json` - Contains npm scripts for seeding
- `scripts/seed-dev.js` - Main seeding script
- `scripts/generate-password-hash.js` - Password hash generator
- `backend/migrations/` - Database migration files
- `backend/.env` - Environment configuration

## Support

For issues or questions about seed data:

1. Check the seed script output for specific errors
2. Verify database connection settings in `.env`
3. Ensure migrations are up to date
4. Review the troubleshooting section above
5. Check application logs for authentication errors

## License

This seed data is part of the BerthCare project and follows the same license.
