# Visit Service Integration Tests - Flow Diagram

## Test Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     TEST SUITE START                         │
│                  (beforeAll - runs once)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Setup Express   │
                    │  with Routes     │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Seed Test Data:  │
                    │ - Organization   │
                    │ - User (Nurse)   │
                    │ - Client         │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FOR EACH TEST                             │
│                  (beforeEach - runs 17x)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Create Fresh     │
                    │ Visit (scheduled)│
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      RUN TEST                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Make HTTP       │
                    │  Request         │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Verify HTTP     │
                    │  Response        │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Query Database  │
                    │  Directly        │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Verify DB       │
                    │  State           │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Test Complete   │
                    └──────────────────┘
                              │
                              ▼
                    (Repeat for next test)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   TEST SUITE END                             │
│                  (afterAll - runs once)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Cleanup Test    │
                    │  Data            │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Close DB        │
                    │  Connection      │
                    └──────────────────┘
```

## Full Visit Lifecycle Test Flow

```
┌─────────────────────────────────────────────────────────────┐
│              FULL LIFECYCLE END-TO-END TEST                  │
└─────────────────────────────────────────────────────────────┘

Step 1: Verify Initial State
┌──────────────────────────────────────┐
│ Query Database                       │
│ ✓ status = 'scheduled'               │
│ ✓ actual_start = NULL                │
│ ✓ actual_end = NULL                  │
└──────────────────────────────────────┘
                │
                ▼
Step 2: Check In
┌──────────────────────────────────────┐
│ POST /api/visits/:id/check-in        │
│ Body: { location, timestamp }        │
│                                      │
│ Response:                            │
│ ✓ status = 200                       │
│ ✓ data.status = 'in_progress'       │
│                                      │
│ Database:                            │
│ ✓ status = 'in_progress'            │
│ ✓ actual_start = NOW()               │
│ ✓ check_in_location = POINT(x,y)    │
└──────────────────────────────────────┘
                │
                ▼
Step 3: Update Documentation
┌──────────────────────────────────────┐
│ PUT /api/visits/:id/documentation    │
│ Body: {                              │
│   documentation: {                   │
│     vital_signs: {...},              │
│     activities: [...],               │
│     observations: "..."              │
│   },                                 │
│   notes: "...",                      │
│   photos: [...]                      │
│ }                                    │
│                                      │
│ Response:                            │
│ ✓ status = 200                       │
│ ✓ validation_status = 'valid'       │
│                                      │
│ Database:                            │
│ ✓ documentation.vital_signs exists  │
│ ✓ documentation.activities exists   │
│ ✓ notes = "..."                      │
│ ✓ photos = [...]                     │
└──────────────────────────────────────┘
                │
                ▼
Step 4: Complete Visit
┌──────────────────────────────────────┐
│ POST /api/visits/:id/complete        │
│ Body: {                              │
│   documentation: { summary: "..." }, │
│   signature: "base64...",            │
│   location: { lat, lng, accuracy }   │
│ }                                    │
│                                      │
│ Response:                            │
│ ✓ status = 200                       │
│ ✓ data.status = 'completed'         │
│ ✓ data.completed_at exists           │
│                                      │
│ Database:                            │
│ ✓ status = 'completed'               │
│ ✓ actual_end = NOW()                 │
│ ✓ signature_url = "base64..."        │
│ ✓ check_out_location = POINT(x,y)   │
│ ✓ documentation.summary exists       │
└──────────────────────────────────────┘
                │
                ▼
Step 5: Final Verification
┌──────────────────────────────────────┐
│ Query Database                       │
│ ✓ status = 'completed'               │
│ ✓ actual_start < actual_end          │
│ ✓ check_in_location exists           │
│ ✓ check_out_location exists          │
│ ✓ signature_url exists               │
│ ✓ documentation complete             │
│ ✓ All data integrity maintained      │
└──────────────────────────────────────┘
                │
                ▼
        ✅ TEST PASSED
```

## Test Categories

```
┌─────────────────────────────────────────────────────────────┐
│                    17 INTEGRATION TESTS                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Retrieval  │    │  Lifecycle   │    │    Error     │
│   (4 tests)  │    │  (8 tests)   │    │  Handling    │
│              │    │              │    │  (5 tests)   │
│ • Get visits │    │ • Check-in   │    │ • 401 Auth   │
│ • Filter     │    │ • Verify loc │    │ • 404 Not    │
│ • Paginate   │    │ • Document   │    │   found      │
│ • Auth check │    │ • Complete   │    │ • 400 Invalid│
│              │    │ • Full flow  │    │ • Status     │
│              │    │              │    │   validation │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      HTTP REQUEST                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express Routes                            │
│                  (visit/routes.ts)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Validators                                │
│              (express-validator)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Controller                                │
│                (visit/controller.ts)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Repository                                │
│                (visit/repository.ts)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL                                │
│                  (visits table)                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    HTTP RESPONSE                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    TEST ASSERTIONS                           │
│              • HTTP status code                              │
│              • Response body structure                       │
│              • Database state                                │
│              • Data integrity                                │
└─────────────────────────────────────────────────────────────┘
```

## Test Data Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    TEST DATA CREATION                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Organization    │
                    │  (Test Org)      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  User            │
                    │  (test-nurse@...) │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Client          │
                    │  (TEST-12345)    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Visit           │
                    │  (Fresh per test)│
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Run Test        │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Cleanup All     │
                    │  Test Data       │
                    └──────────────────┘
```

## Status Transitions Tested

```
┌──────────────┐
│  scheduled   │  ← Initial state
└──────────────┘
       │
       │ POST /check-in
       │ ✓ Valid location
       │ ✓ Valid timestamp
       ▼
┌──────────────┐
│ in_progress  │  ← After check-in
└──────────────┘
       │
       │ PUT /documentation
       │ ✓ Can update multiple times
       │ ✓ Partial updates merge
       │
┌──────────────┐
│ in_progress  │  ← Still in progress
└──────────────┘
       │
       │ POST /complete
       │ ✓ Optional signature
       │ ✓ Optional location
       ▼
┌──────────────┐
│  completed   │  ← Final state
└──────────────┘

Invalid Transitions Tested:
✗ scheduled → completed (must check-in first)
✗ completed → in_progress (cannot reopen)
✗ completed → documentation update (immutable)
```

## Verification Points

```
Each Test Verifies:

1. HTTP Layer
   ├─ Status code (200, 400, 401, 404)
   ├─ Response structure
   ├─ Success flag
   └─ Error messages

2. Business Logic
   ├─ Status transitions
   ├─ Data validation
   ├─ Authorization
   └─ Constraint enforcement

3. Database Layer
   ├─ Data persistence
   ├─ Relationships intact
   ├─ Timestamps correct
   └─ Constraints enforced

4. Data Integrity
   ├─ No orphaned records
   ├─ Foreign keys valid
   ├─ JSON structure valid
   └─ Sequential timestamps
```
