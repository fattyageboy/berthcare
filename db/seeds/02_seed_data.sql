-- BerthCare Development Seed Data
-- This script populates the database with realistic test data for local development

-- =============================================================================
-- ORGANIZATIONS
-- =============================================================================

INSERT INTO organizations (id, name, address, phone, email, license_number, status, settings) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Caring Hearts Home Care',
    '{"street": "123 Main Street", "city": "Toronto", "province": "ON", "postal_code": "M5H 2N2", "country": "Canada"}',
    '+1-416-555-0100',
    'info@caringhearts.ca',
    'ON-HC-2024-001',
    'active',
    '{"timezone": "America/Toronto", "business_hours": {"start": "08:00", "end": "18:00"}}'
),
(
    '22222222-2222-2222-2222-222222222222',
    'ComfortCare Services',
    '{"street": "456 Oak Avenue", "city": "Vancouver", "province": "BC", "postal_code": "V6B 2M9", "country": "Canada"}',
    '+1-604-555-0200',
    'contact@comfortcare.ca',
    'BC-HC-2024-002',
    'active',
    '{"timezone": "America/Vancouver", "business_hours": {"start": "07:00", "end": "19:00"}}'
);

-- =============================================================================
-- USERS
-- =============================================================================

-- Administrators
INSERT INTO users (id, email, phone, first_name, last_name, role, organization_id, status) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'admin@caringhearts.ca',
    '+1-416-555-0101',
    'Sarah',
    'Johnson',
    'admin',
    '11111111-1111-1111-1111-111111111111',
    'active'
);

-- Supervisors
INSERT INTO users (id, email, phone, first_name, last_name, role, organization_id, status) VALUES
(
    '10000000-0000-0000-0000-000000000002',
    'supervisor@caringhearts.ca',
    '+1-416-555-0102',
    'Michael',
    'Chen',
    'supervisor',
    '11111111-1111-1111-1111-111111111111',
    'active'
);

-- Coordinators
INSERT INTO users (id, email, phone, first_name, last_name, role, organization_id, status) VALUES
(
    '10000000-0000-0000-0000-000000000003',
    'coordinator@caringhearts.ca',
    '+1-416-555-0103',
    'Emily',
    'Rodriguez',
    'coordinator',
    '11111111-1111-1111-1111-111111111111',
    'active'
);

-- Nurses
INSERT INTO users (id, email, phone, first_name, last_name, role, organization_id, status) VALUES
(
    '10000000-0000-0000-0000-000000000010',
    'nurse1@caringhearts.ca',
    '+1-416-555-0110',
    'Jennifer',
    'Williams',
    'nurse',
    '11111111-1111-1111-1111-111111111111',
    'active'
),
(
    '10000000-0000-0000-0000-000000000011',
    'nurse2@caringhearts.ca',
    '+1-416-555-0111',
    'David',
    'Thompson',
    'nurse',
    '11111111-1111-1111-1111-111111111111',
    'active'
);

-- Personal Support Workers (PSWs)
INSERT INTO users (id, email, phone, first_name, last_name, role, organization_id, status) VALUES
(
    '10000000-0000-0000-0000-000000000020',
    'psw1@caringhearts.ca',
    '+1-416-555-0120',
    'Maria',
    'Garcia',
    'psw',
    '11111111-1111-1111-1111-111111111111',
    'active'
),
(
    '10000000-0000-0000-0000-000000000021',
    'psw2@caringhearts.ca',
    '+1-416-555-0121',
    'James',
    'Anderson',
    'psw',
    '11111111-1111-1111-1111-111111111111',
    'active'
),
(
    '10000000-0000-0000-0000-000000000022',
    'psw3@caringhearts.ca',
    '+1-416-555-0122',
    'Priya',
    'Patel',
    'psw',
    '11111111-1111-1111-1111-111111111111',
    'active'
);

-- Family Members
INSERT INTO users (id, email, phone, first_name, last_name, role, organization_id, status) VALUES
(
    '10000000-0000-0000-0000-000000000030',
    'john.smith@email.com',
    '+1-416-555-0130',
    'John',
    'Smith',
    'family_member',
    NULL,
    'active'
),
(
    '10000000-0000-0000-0000-000000000031',
    'mary.jones@email.com',
    '+1-416-555-0131',
    'Mary',
    'Jones',
    'family_member',
    NULL,
    'active'
),
(
    '10000000-0000-0000-0000-000000000032',
    'robert.brown@email.com',
    '+1-416-555-0132',
    'Robert',
    'Brown',
    'family_member',
    NULL,
    'active'
);

-- =============================================================================
-- CLIENTS
-- =============================================================================

INSERT INTO clients (id, client_number, first_name, last_name, date_of_birth, gender, address, emergency_contact, primary_diagnosis, allergies, medications, care_level, organization_id, status) VALUES
(
    '20000000-0000-0000-0000-000000000001',
    'CH-2024-001',
    'Margaret',
    'Smith',
    '1940-03-15',
    'Female',
    '{"street": "789 Elm Street", "unit": "Apt 201", "city": "Toronto", "province": "ON", "postal_code": "M4Y 1W5", "country": "Canada"}',
    '{"name": "John Smith", "relationship": "Son", "phone": "+1-416-555-0130", "email": "john.smith@email.com"}',
    'Alzheimer''s Disease - Early Stage',
    ARRAY['Penicillin', 'Sulfa drugs'],
    '{"medications": [{"name": "Donepezil", "dosage": "10mg", "frequency": "Once daily", "time": "Morning"}, {"name": "Memantine", "dosage": "10mg", "frequency": "Twice daily", "times": ["Morning", "Evening"]}]}',
    'level_2',
    '11111111-1111-1111-1111-111111111111',
    'active'
),
(
    '20000000-0000-0000-0000-000000000002',
    'CH-2024-002',
    'Robert',
    'Johnson',
    '1935-07-22',
    'Male',
    '{"street": "456 Maple Drive", "city": "Toronto", "province": "ON", "postal_code": "M2N 3B4", "country": "Canada"}',
    '{"name": "Sarah Johnson", "relationship": "Daughter", "phone": "+1-416-555-0140", "email": "sarah.johnson@email.com"}',
    'Parkinson''s Disease',
    ARRAY['None known'],
    '{"medications": [{"name": "Carbidopa-Levodopa", "dosage": "25-100mg", "frequency": "Three times daily", "times": ["8:00 AM", "1:00 PM", "6:00 PM"]}, {"name": "Pramipexole", "dosage": "0.5mg", "frequency": "Three times daily"}]}',
    'level_3',
    '11111111-1111-1111-1111-111111111111',
    'active'
),
(
    '20000000-0000-0000-0000-000000000003',
    'CH-2024-003',
    'Dorothy',
    'Williams',
    '1945-11-30',
    'Female',
    '{"street": "321 Pine Road", "unit": "Suite 5", "city": "Toronto", "province": "ON", "postal_code": "M6K 2V8", "country": "Canada"}',
    '{"name": "Mary Jones", "relationship": "Daughter", "phone": "+1-416-555-0131", "email": "mary.jones@email.com"}',
    'Diabetes Type 2, Hypertension',
    ARRAY['Latex'],
    '{"medications": [{"name": "Metformin", "dosage": "500mg", "frequency": "Twice daily", "times": ["Breakfast", "Dinner"]}, {"name": "Lisinopril", "dosage": "10mg", "frequency": "Once daily", "time": "Morning"}, {"name": "Atorvastatin", "dosage": "20mg", "frequency": "Once daily", "time": "Bedtime"}]}',
    'level_2',
    '11111111-1111-1111-1111-111111111111',
    'active'
),
(
    '20000000-0000-0000-0000-000000000004',
    'CH-2024-004',
    'James',
    'Brown',
    '1938-05-08',
    'Male',
    '{"street": "654 Cedar Avenue", "city": "Toronto", "province": "ON", "postal_code": "M5R 1B3", "country": "Canada"}',
    '{"name": "Robert Brown", "relationship": "Son", "phone": "+1-416-555-0132", "email": "robert.brown@email.com"}',
    'Congestive Heart Failure',
    ARRAY['None known'],
    '{"medications": [{"name": "Furosemide", "dosage": "40mg", "frequency": "Once daily", "time": "Morning"}, {"name": "Carvedilol", "dosage": "6.25mg", "frequency": "Twice daily", "times": ["Morning", "Evening"]}, {"name": "Spironolactone", "dosage": "25mg", "frequency": "Once daily", "time": "Morning"}]}',
    'level_3',
    '11111111-1111-1111-1111-111111111111',
    'active'
),
(
    '20000000-0000-0000-0000-000000000005',
    'CH-2024-005',
    'Elizabeth',
    'Davis',
    '1948-09-14',
    'Female',
    '{"street": "987 Birch Lane", "unit": "Unit 12", "city": "Toronto", "province": "ON", "postal_code": "M4C 1M2", "country": "Canada"}',
    '{"name": "Linda Davis", "relationship": "Daughter", "phone": "+1-416-555-0150", "email": "linda.davis@email.com"}',
    'COPD, Osteoarthritis',
    ARRAY['Aspirin'],
    '{"medications": [{"name": "Tiotropium", "dosage": "18mcg", "frequency": "Once daily (inhaler)", "time": "Morning"}, {"name": "Albuterol", "dosage": "90mcg", "frequency": "As needed (inhaler)"}, {"name": "Acetaminophen", "dosage": "500mg", "frequency": "As needed for pain", "max_daily": "3000mg"}]}',
    'level_2',
    '11111111-1111-1111-1111-111111111111',
    'active'
);

-- =============================================================================
-- FAMILY MEMBERS RELATIONSHIPS
-- =============================================================================

INSERT INTO family_members (client_id, user_id, relationship, access_level, notification_preferences) VALUES
(
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000030',
    'Son',
    'detailed',
    '{"visit_updates": true, "health_changes": true, "missed_visits": true, "care_plan_updates": true, "preferred_method": "email"}'
),
(
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000031',
    'Daughter',
    'detailed',
    '{"visit_updates": true, "health_changes": true, "missed_visits": true, "care_plan_updates": true, "preferred_method": "sms"}'
),
(
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000032',
    'Son',
    'basic',
    '{"visit_updates": false, "health_changes": true, "missed_visits": true, "care_plan_updates": false, "preferred_method": "email"}'
);

-- =============================================================================
-- CARE PLANS
-- =============================================================================

INSERT INTO care_plans (id, client_id, version, title, goals, interventions, frequency, start_date, end_date, created_by, approved_by, status) VALUES
(
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    1,
    'Alzheimer''s Care and Daily Living Support',
    ARRAY[
        'Maintain current cognitive function through mental stimulation',
        'Ensure medication compliance',
        'Support independence in activities of daily living',
        'Provide companionship and reduce isolation'
    ],
    '{
        "medication_management": {"description": "Supervise medication administration", "tasks": ["Set up daily pill organizer", "Observe medication intake", "Document compliance"]},
        "cognitive_stimulation": {"description": "Engage in memory and cognitive activities", "tasks": ["Reminiscence activities", "Simple puzzles and games", "Music therapy"]},
        "personal_care": {"description": "Assist with bathing and grooming", "tasks": ["Bathing assistance 3x/week", "Daily grooming support", "Dressing assistance as needed"]},
        "safety_monitoring": {"description": "Ensure safe home environment", "tasks": ["Check for hazards", "Monitor wandering risk", "Ensure proper lighting"]}
    }',
    '{
        "daily_visits": {"morning": true, "evening": true},
        "weekly_nurse_visit": true,
        "medication_times": ["9:00 AM", "9:00 PM"]
    }',
    '2024-01-15',
    NULL,
    '10000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'active'
),
(
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    1,
    'Parkinson''s Disease Management and Mobility Support',
    ARRAY[
        'Maintain mobility and prevent falls',
        'Ensure timely medication administration',
        'Support physical therapy exercises',
        'Monitor disease progression'
    ],
    '{
        "medication_management": {"description": "Strict medication timing for motor control", "tasks": ["Administer medications on precise schedule", "Monitor for side effects", "Document response"]},
        "mobility_support": {"description": "Assist with transfers and walking", "tasks": ["Use of walker or cane", "Assist with transfers", "Fall prevention strategies"]},
        "exercise_program": {"description": "Support prescribed physical therapy", "tasks": ["Range of motion exercises", "Stretching routine", "Balance exercises"]},
        "personal_care": {"description": "Full assistance with ADLs", "tasks": ["Bathing assistance", "Dressing support", "Meal preparation"]}
    }',
    '{
        "daily_visits": {"morning": true, "midday": true, "evening": true},
        "medication_times": ["8:00 AM", "1:00 PM", "6:00 PM"],
        "weekly_nurse_assessment": true
    }',
    '2024-02-01',
    NULL,
    '10000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'active'
),
(
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000003',
    1,
    'Diabetes and Chronic Disease Management',
    ARRAY[
        'Maintain blood glucose within target range',
        'Support healthy meal planning',
        'Monitor blood pressure daily',
        'Prevent complications from diabetes'
    ],
    '{
        "glucose_monitoring": {"description": "Regular blood glucose testing", "tasks": ["Test glucose before meals and bedtime", "Document readings", "Report abnormal values"]},
        "medication_management": {"description": "Administer diabetes and BP medications", "tasks": ["Morning medications with breakfast", "Evening medications with dinner", "Monitor for side effects"]},
        "meal_support": {"description": "Prepare diabetic-appropriate meals", "tasks": ["Follow meal plan", "Monitor carbohydrate intake", "Ensure adequate nutrition"]},
        "foot_care": {"description": "Daily foot inspection and care", "tasks": ["Check for wounds or infections", "Moisturize feet", "Ensure proper footwear"]}
    }',
    '{
        "daily_visits": {"morning": true, "evening": true},
        "weekly_nurse_visit": true,
        "glucose_testing": ["Before breakfast", "Before dinner", "Bedtime"]
    }',
    '2024-01-20',
    NULL,
    '10000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'active'
);

-- =============================================================================
-- VISITS (Past, Present, and Future)
-- =============================================================================

-- Past completed visits (last 7 days)
INSERT INTO visits (id, client_id, user_id, scheduled_start, scheduled_end, actual_start, actual_end, check_in_location, check_out_location, visit_type, status, documentation, notes) VALUES
(
    '40000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000020',
    NOW() - INTERVAL '7 days' + INTERVAL '9 hours',
    NOW() - INTERVAL '7 days' + INTERVAL '10 hours',
    NOW() - INTERVAL '7 days' + INTERVAL '9 hours 5 minutes',
    NOW() - INTERVAL '7 days' + INTERVAL '10 hours 2 minutes',
    POINT(43.6532, -79.3832),
    POINT(43.6532, -79.3832),
    'personal_care',
    'completed',
    '{"vitals": {"blood_pressure": "130/82", "heart_rate": 74, "temperature": 36.8}, "activities_completed": ["Bathing assistance", "Medication administration", "Light exercise"], "mood": "Good - cooperative and pleasant"}',
    'Margaret was in good spirits. Completed morning routine without issues.'
),
(
    '40000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000021',
    NOW() - INTERVAL '6 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '6 days' + INTERVAL '9 hours',
    NOW() - INTERVAL '6 days' + INTERVAL '8 hours 3 minutes',
    NOW() - INTERVAL '6 days' + INTERVAL '9 hours 5 minutes',
    POINT(43.7615, -79.4111),
    POINT(43.7615, -79.4111),
    'medication',
    'completed',
    '{"medications_given": ["Carbidopa-Levodopa 8:00 AM", "Pramipexole 8:00 AM"], "vitals": {"blood_pressure": "125/78", "heart_rate": 68}, "mobility_assessment": "Used walker, steady gait"}',
    'Medications administered on time. Client showing good motor control today.'
);

-- Today's visits
INSERT INTO visits (id, client_id, user_id, scheduled_start, scheduled_end, actual_start, actual_end, check_in_location, visit_type, status, documentation, notes) VALUES
(
    '40000000-0000-0000-0000-000000000010',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000020',
    NOW() + INTERVAL '1 hours',
    NOW() + INTERVAL '2 hours',
    NOW() + INTERVAL '1 hours 3 minutes',
    NULL,
    POINT(43.6532, -79.3832),
    'personal_care',
    'in_progress',
    '{"activities_in_progress": ["Morning care routine", "Medication administration"]}',
    'Visit started on time. Client is responsive and cooperative.'
);

-- Upcoming scheduled visits
INSERT INTO visits (client_id, user_id, scheduled_start, scheduled_end, visit_type, status, notes) VALUES
(
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000020',
    NOW() + INTERVAL '9 hours',
    NOW() + INTERVAL '10 hours',
    'personal_care',
    'scheduled',
    'Evening care routine and medication administration'
),
(
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000021',
    NOW() + INTERVAL '5 hours',
    NOW() + INTERVAL '6 hours',
    'medication',
    'scheduled',
    'Midday medication administration - 1:00 PM dose'
),
(
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000022',
    NOW() + INTERVAL '3 hours',
    NOW() + INTERVAL '4 hours',
    'personal_care',
    'scheduled',
    'Lunch preparation and blood glucose monitoring'
),
(
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000020',
    NOW() + INTERVAL '4 hours',
    NOW() + INTERVAL '5 hours',
    'companionship',
    'scheduled',
    'Light exercise and social interaction'
),
(
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000021',
    NOW() + INTERVAL '6 hours',
    NOW() + INTERVAL '7 hours',
    'personal_care',
    'scheduled',
    'Afternoon care and respiratory therapy'
);

-- Tomorrow's visits
INSERT INTO visits (client_id, user_id, scheduled_start, scheduled_end, visit_type, status, notes) VALUES
(
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000020',
    NOW() + INTERVAL '1 day' + INTERVAL '9 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '10 hours',
    'personal_care',
    'scheduled',
    'Morning care routine'
),
(
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000010',
    NOW() + INTERVAL '1 day' + INTERVAL '10 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '11 hours',
    'assessment',
    'scheduled',
    'Weekly nursing assessment'
),
(
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000022',
    NOW() + INTERVAL '1 day' + INTERVAL '8 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '9 hours',
    'medication',
    'scheduled',
    'Morning medications and glucose monitoring'
);

-- =============================================================================
-- AUDIT LOG SAMPLE DATA
-- =============================================================================

INSERT INTO audit_log (user_id, entity_type, entity_id, action, old_values, new_values, ip_address) VALUES
(
    '10000000-0000-0000-0000-000000000003',
    'care_plan',
    '30000000-0000-0000-0000-000000000001',
    'created',
    NULL,
    '{"status": "active", "title": "Alzheimer''s Care and Daily Living Support"}',
    '192.168.1.100'
),
(
    '10000000-0000-0000-0000-000000000020',
    'visit',
    '40000000-0000-0000-0000-000000000001',
    'completed',
    '{"status": "in_progress"}',
    '{"status": "completed", "actual_end": "2024-09-23 10:02:00"}',
    '192.168.1.105'
);

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
DECLARE
    org_count INTEGER;
    user_count INTEGER;
    client_count INTEGER;
    visit_count INTEGER;
    care_plan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO org_count FROM organizations;
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO client_count FROM clients;
    SELECT COUNT(*) INTO visit_count FROM visits;
    SELECT COUNT(*) INTO care_plan_count FROM care_plans;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'BerthCare seed data loaded successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Organizations: %', org_count;
    RAISE NOTICE 'Users: %', user_count;
    RAISE NOTICE '  - Admins: 1';
    RAISE NOTICE '  - Supervisors: 1';
    RAISE NOTICE '  - Coordinators: 1';
    RAISE NOTICE '  - Nurses: 2';
    RAISE NOTICE '  - PSWs: 3';
    RAISE NOTICE '  - Family Members: 3';
    RAISE NOTICE 'Clients: %', client_count;
    RAISE NOTICE 'Care Plans: %', care_plan_count;
    RAISE NOTICE 'Visits: %', visit_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database ready for development!';
END $$;
