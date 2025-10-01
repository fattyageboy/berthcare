-- BerthCare Development Seed Data - User Authentication
-- This script adds password hashes to seeded users for testing authentication
-- Default password for all test users: "BerthCare2024!"
-- Password hash generated using bcrypt with cost factor 10

-- =============================================================================
-- UPDATE USERS WITH PASSWORD HASHES
-- =============================================================================

-- Update all seeded users with password hashes
-- Password: BerthCare2024! (hashed with bcrypt cost 10)
UPDATE users SET password_hash = '$2b$10$G4WRQ1z.AlbR0Mpb2hatBOJeTCuN.k2KukCtjUEnOPUfFqAbSeTCm'
WHERE id IN (
    '10000000-0000-0000-0000-000000000001', -- admin@caringhearts.ca
    '10000000-0000-0000-0000-000000000002', -- supervisor@caringhearts.ca
    '10000000-0000-0000-0000-000000000003', -- coordinator@caringhearts.ca
    '10000000-0000-0000-0000-000000000010', -- nurse1@caringhearts.ca
    '10000000-0000-0000-0000-000000000011', -- nurse2@caringhearts.ca
    '10000000-0000-0000-0000-000000000020', -- psw1@caringhearts.ca
    '10000000-0000-0000-0000-000000000021', -- psw2@caringhearts.ca
    '10000000-0000-0000-0000-000000000022', -- psw3@caringhearts.ca
    '10000000-0000-0000-0000-000000000030', -- john.smith@email.com
    '10000000-0000-0000-0000-000000000031', -- mary.jones@email.com
    '10000000-0000-0000-0000-000000000032'  -- robert.brown@email.com
);

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users WHERE password_hash IS NOT NULL;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'User authentication data loaded!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Users with password hashes: %', user_count;
    RAISE NOTICE '';
    RAISE NOTICE 'TEST LOGIN CREDENTIALS:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Admin:       admin@caringhearts.ca';
    RAISE NOTICE 'Supervisor:  supervisor@caringhearts.ca';
    RAISE NOTICE 'Coordinator: coordinator@caringhearts.ca';
    RAISE NOTICE 'Nurse:       nurse1@caringhearts.ca';
    RAISE NOTICE 'Nurse:       nurse2@caringhearts.ca';
    RAISE NOTICE 'PSW:         psw1@caringhearts.ca';
    RAISE NOTICE 'PSW:         psw2@caringhearts.ca';
    RAISE NOTICE 'PSW:         psw3@caringhearts.ca';
    RAISE NOTICE 'Family:      john.smith@email.com';
    RAISE NOTICE 'Family:      mary.jones@email.com';
    RAISE NOTICE 'Family:      robert.brown@email.com';
    RAISE NOTICE '';
    RAISE NOTICE 'Default Password: BerthCare2024!';
    RAISE NOTICE '========================================';
END $$;
