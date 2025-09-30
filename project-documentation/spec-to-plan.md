# BerthCare Implementation Plan

## Phase E – Environment & Tooling

| ID | Title | Description | Deps | Deliverables | Acceptance | Role | Effort |
|----|-------|-------------|------|--------------|------------|------|--------|
| E1 | Initialize Git repository | Create repository on GitHub; add `README.md`, `LICENSE`, `.gitignore`, `.editorconfig`, `CODEOWNERS`; enable branch protections on `main` (required reviews ≥2, status checks, signed commits enforced); first commit. Arch ref: Infrastructure Layer (line 682-697, architecture-output.md). | – | Repo URL; base scaffold files; branch protection rules active | Repo exists; protections active on `main`; initial commit visible; signed commits enforced | DevOps | 0.5d |
| E2 | Set up CI bootstrap | Configure GitHub Actions CI to run lint, unit tests, type checks, SAST (SonarQube), dependency audit (npm audit, Snyk) on PRs to `main`; all checks required before merge. Arch ref: CI/CD Workflow (line 914-974, architecture-output.md). | E1 | `.github/workflows/ci.yml`; passing sample run | All checks run on sample PR; checks required in branch rules; CI badge green | DevOps | 1d |
| E3 | Set up local development environment | Create `docker-compose.dev.yml` for local PostgreSQL, Redis, MinIO (S3-compatible) containers; add seed data scripts in `db/seeds`. Arch ref: Development Environment (line 826-868, architecture-output.md). Assumptions: Node 18+, Docker Desktop installed. | E1 | `docker-compose.dev.yml`, seed scripts, local `.env.example` | `docker-compose up` starts all services; seed data loads; healthchecks pass | DevOps | 1.5d |
| E4 | Configure Auth0 development tenant | Set up Auth0 tenant for dev/staging; configure roles (nurse, psw, coordinator, supervisor, admin, family_member); add test users; enable MFA (SMS + TOTP). Arch ref: Authentication & Authorization (line 711-753, architecture-output.md). | E1 | Auth0 tenant URL; test user credentials; role configuration doc | Test login succeeds; roles map correctly; MFA prompts work | Backend Dev | 1d |
| E5 | Update architecture docs – Infra Layer | Add repo URL, CI config, local dev setup details, Auth0 tenant to `/project-documentation/architecture-output.md` and create `/docs/architecture-living.md` for runtime updates. | E2, E3, E4 | Updated architecture docs; diagram annotations | Docs reflect repo/CI/local setup; engineers can onboard from doc alone | DevOps | 0.5d |

---

## Phase B – Backend Core Services

| ID | Title | Description | Deps | Deliverables | Acceptance | Role | Effort |
|----|-------|-------------|------|--------------|------------|------|--------|
| B1 | Create feature branch – backend scaffold | Branch `feat/backend-scaffold` from `main`; link issue; open draft PR with checklist (linting, tests, security scan, docs). | E2 | Branch + draft PR | PR open; CI triggered on push | Backend Dev | 0.1d |
| B2 | Scaffold Node.js backend monorepo | Initialize Node.js 18+ project with TypeScript, Express.js, folder structure (`/src/services/user`, `/src/services/visit`, `/src/services/sync`, `/src/services/notification`), `tsconfig.json`, ESLint, Prettier. Arch ref: Backend Technologies (line 630-644, architecture-output.md). | B1 | `/api` folder; `package.json`, TypeScript config | `npm install && npm run build` succeeds; linting passes | Backend Dev | 1d |
| B3 | Configure database connection and ORM | Install `pg` (PostgreSQL client), connection pooling (PgBouncer config doc), add `/src/config/database.ts` with connection logic. Arch ref: Database Strategy (line 653-665, architecture-output.md). Assumptions: env vars `DATABASE_URL`, `REDIS_URL` set via `.env`. | B2 | Database config module; connection health check endpoint | Connection to local Postgres succeeds; health check returns 200 | Backend Dev | 1d |
| B4 | Implement database migrations framework | Add `node-pg-migrate` or `knex` for migrations; create migration scripts for initial schema (users, clients, visits, care_plans, family_members, sync_log tables per schema lines 118-285, architecture-output.md). Arch ref: Database Schema Design (line 113-320, architecture-output.md). | B3 | Migration files; `npm run migrate` script | Migrations run successfully; all tables created with indexes and constraints per spec | Backend Dev | 2d |
| B5 | Seed test data for development | Add seed scripts in `db/seeds` to populate organizations, test users (nurse, coordinator, family), test clients, visits. Arch ref: Development Environment (line 856, architecture-output.md). | B4 | Seed SQL scripts | `npm run seed:dev` populates DB; test login with seeded user succeeds | Backend Dev | 1d |
| B6 | Run CI, request review, merge PR – backend scaffold | Fix lint/type/security findings; request ≥2 reviews; squash-merge using Conventional Commits; delete branch. | B2, B3, B4, B5 | Merged PR; release notes fragment | CI green; approvals met; branch deleted; `main` updated | Backend Dev | 0.25d |
| B7 | Create feature branch – user service auth | Branch `feat/user-service-auth` from `main`; link issue; open draft PR. | B6 | Branch + draft PR | PR open; CI triggered | Backend Dev | 0.1d |
| B8 | Implement user authentication endpoints | Build `POST /auth/login`, `POST /auth/refresh` using Auth0 SDK; JWT generation (1h access, 30d refresh tokens); device binding. Arch ref: Authentication Endpoints (line 325-358, architecture-output.md), Token Management (line 748-753, architecture-output.md). Assumptions: JWT secret in env `JWT_SECRET`. | B7 | Auth endpoints; JWT middleware | Login returns tokens; refresh works; invalid creds return 401; rate limiting active (10 req/min per IP) | Backend Dev | 2d |
| B9 | Implement RBAC middleware | Create Express middleware to check user roles/permissions per RBAC spec (line 721-746, architecture-output.md); apply to protected routes. | B8 | RBAC middleware; unit tests ≥80% coverage | Nurse can access own visits; cannot access admin routes; coordinator can access team data | Backend Dev | 1.5d |
| B10 | Write unit tests for auth service | Test login, refresh, role checks, token expiry, device binding, rate limiting. Target ≥80% coverage. | B8, B9 | Jest unit tests | All tests pass; coverage ≥80%; edge cases covered | Backend Dev | 1d |
| B11 | Run CI, request review, merge PR – user auth | Fix findings; request ≥2 reviews (1 senior); squash-merge. | B10 | Merged PR | CI green; security scan clean; branch deleted | Backend Dev | 0.25d |
| B12 | Create feature branch – visit service | Branch `feat/visit-service` from `main`; open draft PR. | B11 | Branch + draft PR | PR open | Backend Dev | 0.1d |
| B13 | Implement visit management endpoints | Build `GET /visits`, `POST /visits/:id/check-in`, `PUT /visits/:id/documentation`, `POST /visits/:id/complete`. Arch ref: Visit Management Endpoints (line 360-462, architecture-output.md). Add validation (express-validator). | B12 | Visit service endpoints; validation schemas | GET returns visits for user; check-in validates location; documentation updates work; status transitions correctly | Backend Dev | 3d |
| B14 | Implement GPS location verification | Build location service to validate check-in/out coords against client address (Google Maps Geocoding API); allow 100m urban, 500m rural radius. Arch ref: GPS Integration (line 1069-1094, architecture-output.md). Assumptions: Google Maps API key in env. | B13 | Location verification service; geocoding integration | Location within radius returns verified:true; outside returns false; coordinates stored in DB | Backend Dev | 2d |
| B15 | Write integration tests for visit service | Test full visit lifecycle (create → check-in → document → complete) with DB. Arch ref: Integration Testing (line 1639-1663, architecture-output.md). | B13, B14 | Supertest integration tests | All tests pass; visit flow end-to-end works; DB state correct after operations | Backend Dev | 1.5d |
| B16 | Run CI, request review, merge PR – visit service | Fix findings; request ≥2 reviews; squash-merge. | B15 | Merged PR | CI green; branch deleted | Backend Dev | 0.25d |
| B17 | Create feature branch – file upload service | Branch `feat/file-upload` from `main`; open draft PR. | B16 | Branch + draft PR | PR open | Backend Dev | 0.1d |
| B18 | Implement photo upload to S3 | Build `POST /uploads/photos` with multipart/form-data; upload to AWS S3 (dev: MinIO); generate presigned URLs; create thumbnails with Lambda/Sharp. Arch ref: File Upload Endpoints (line 464-483, architecture-output.md), File Processing (line 1116-1121, architecture-output.md). Max 10MB per image. | B17 | Upload endpoint; S3 integration; thumbnail generation | Photo uploads to S3; URL returned; thumbnail generated; file <10MB enforced | Backend Dev | 2d |
| B19 | Implement server-side encryption for uploads | Enable S3 SSE with customer-managed keys (KMS); encrypt file metadata in DB. Arch ref: Data Protection – Encryption (line 756-768, architecture-output.md). | B18 | S3 SSE config; KMS key setup | Uploaded files encrypted at rest; keys managed in KMS; metadata encrypted in DB | Backend Dev | 1d |
| B20 | Write unit tests for file upload | Test upload success, file size limits, invalid file types, S3 errors. Target ≥80% coverage. | B18, B19 | Jest unit tests | All tests pass; coverage ≥80%; error handling robust | Backend Dev | 1d |
| B21 | Run CI, request review, merge PR – file upload | Fix findings; request ≥2 reviews; squash-merge. | B20 | Merged PR | CI green; branch deleted | Backend Dev | 0.25d |
| B22 | Create feature branch – sync service | Branch `feat/sync-service` from `main`; open draft PR. | B21 | Branch + draft PR | PR open | Backend Dev | 0.1d |
| B23 | Implement offline sync endpoints | Build `POST /sync/pull`, `POST /sync/push` with incremental sync (last_sync_timestamp); conflict detection (last-write-wins with audit trail). Arch ref: Synchronization Endpoints (line 486-545, architecture-output.md), Conflict Resolution Flow (line 107-112, architecture-output.md). | B22 | Sync endpoints; sync_log table integration | Pull returns changes since timestamp; push accepts changes; conflicts logged; sync_timestamp updated | Backend Dev | 3d |
| B24 | Implement WebSocket real-time sync | Add WebSocket server (Socket.io or native WS) for real-time updates; broadcast visit changes to team members. Arch ref: Real-time Communication (line 13, architecture-output.md), Sync Service (line 86-91, architecture-output.md). | B23 | WebSocket server; event broadcasting | Clients receive live updates; connection handling robust; reconnection logic works | Backend Dev | 2d |
| B25 | Write integration tests for sync service | Test pull/push flows; conflict scenarios; WebSocket events. | B23, B24 | Integration tests | All tests pass; sync reliability confirmed; conflicts resolved correctly | Backend Dev | 1.5d |
| B26 | Run CI, request review, merge PR – sync service | Fix findings; request ≥2 reviews; squash-merge. | B25 | Merged PR | CI green; branch deleted | Backend Dev | 0.25d |
| B27 | Create feature branch – notification service | Branch `feat/notification-service` from `main`; open draft PR. | B26 | Branch + draft PR | PR open | Backend Dev | 0.1d |
| B28 | Implement push notification service | Integrate Firebase Cloud Messaging (FCM) for iOS/Android push; build `POST /notifications/send`. Arch ref: Push Notification Services (line 1096-1107, architecture-output.md), Notification Service (line 92-97, architecture-output.md). Store device tokens in DB. | B27 | Notification endpoint; FCM integration; device token storage | Push notifications delivered to iOS/Android; delivery tracked; tokens managed | Backend Dev | 2d |
| B29 | Implement email notification service | Integrate Amazon SES for transactional emails (visit reports, password resets); HTML templates. Arch ref: Email Services (line 1109-1115, architecture-output.md). | B28 | Email service; SES integration; email templates | Emails sent successfully; templates render correctly; bounce handling works | Backend Dev | 1.5d |
| B30 | Write unit tests for notification service | Test push, email, template rendering, error handling. Target ≥80% coverage. | B28, B29 | Jest unit tests | All tests pass; coverage ≥80% | Backend Dev | 1d |
| B31 | Run CI, request review, merge PR – notification service | Fix findings; request ≥2 reviews; squash-merge. | B30 | Merged PR | CI green; branch deleted | Backend Dev | 0.25d |
| B32 | Update architecture docs – Backend Services | Document all API endpoints, service boundaries, database schema as-built, auth flows in `/docs/architecture-living.md`. | B31 | Updated docs; API reference (OpenAPI/Swagger) | Docs reflect implemented services; OpenAPI spec generates client SDKs | Backend Dev | 1d |

---

## Phase F – Frontend Mobile App (React Native)

| ID | Title | Description | Deps | Deliverables | Acceptance | Role | Effort |
|----|-------|-------------|------|--------------|------------|------|--------|
| F1 | Create feature branch – mobile scaffold | Branch `feat/mobile-scaffold` from `main`; open draft PR. | E2 | Branch + draft PR | PR open | Frontend Dev | 0.1d |
| F2 | Initialize React Native project | Run `npx react-native init BerthCareMobile --template react-native-template-typescript`; configure folder structure (`/src/screens`, `/src/components`, `/src/services`, `/src/store`), ESLint, Prettier. Arch ref: Mobile Application (React Native) (line 57-70, architecture-output.md). | F1 | `/mobile` folder; RN project scaffold | `npm run ios` and `npm run android` launch app on simulators; TypeScript compiles | Frontend Dev | 1d |
| F3 | Install core dependencies | Install React Navigation 6, Redux Toolkit, RTK Query, Watermelon DB (offline storage), React Native Reanimated. Arch ref: Key Libraries (line 607-612, architecture-output.md). | F2 | Updated `package.json`; dependencies installed | All packages install without conflicts; metro bundler runs | Frontend Dev | 0.5d |
| F4 | Set up design system tokens | Implement design tokens (colors, typography, spacing) from style-guide.md (line 5-117, design-system/style-guide.md) as JS constants in `/src/theme`. | F3 | `/src/theme` module; color/typography/spacing constants | Theme imports work; colors match spec; typography scales correctly | Frontend Dev | 1d |
| F5 | Build reusable UI components | Implement Button, Input, Card, Header components per style-guide.md (line 145-223, design-system/style-guide.md). Use design tokens; support accessibility props. Arch ref: Accessibility (accessibility/README.md). | F4 | Component library in `/src/components`; Storybook or component tests | Components render correctly; accessibility labels work; touch targets ≥44px | Frontend Dev | 2d |
| F6 | Configure React Navigation | Set up stack navigator for screens (Login, Schedule, PatientProfile, VisitDocumentation, Review); bottom tab navigator. Arch ref: Navigation (line 68, architecture-output.md), Design: Bottom Navigation (line 209-216, style-guide.md). | F5 | Navigation structure; deep linking config | Navigation between screens works; back button functions; deep links open correct screens | Frontend Dev | 1d |
| F7 | Set up Redux Toolkit and RTK Query | Configure Redux store, slices for auth, visits, sync; RTK Query for API calls. Arch ref: State Management (line 69, architecture-output.md). | F6 | Redux store; slices; API service | State updates trigger re-renders; API calls cached; optimistic updates work | Frontend Dev | 1.5d |
| F8 | Run CI, request review, merge PR – mobile scaffold | Fix lint/type findings; request ≥2 reviews; squash-merge. | F4, F5, F6, F7 | Merged PR | CI green (iOS/Android build checks); branch deleted | Frontend Dev | 0.25d |
| F9 | Create feature branch – authentication UI | Branch `feat/mobile-auth-ui` from `main`; open draft PR. | F8 | Branch + draft PR | PR open | Frontend Dev | 0.1d |
| F10 | Build Login screen | Implement Login screen per mobile-documentation/README.md (line 47-71). Biometric auth (Face ID/Touch ID) via `react-native-biometrics`; fallback username/password. Arch ref: Authentication (line 70, architecture-output.md). | F9 | Login screen component; biometric integration | Biometric login works on iOS/Android; fallback to password works; errors display correctly | Frontend Dev | 2d |
| F11 | Integrate Auth0 authentication | Connect Login screen to backend `POST /auth/login`; store tokens securely in Keychain (iOS) / Keystore (Android) via `react-native-keychain`. Arch ref: Auth0 (line 645-651, architecture-output.md), Token Management (line 748-753, architecture-output.md). | F10 | Auth service; secure token storage | Login API call succeeds; tokens stored securely; refresh token rotates; logout clears tokens | Frontend Dev | 1.5d |
| F12 | Write unit tests for auth flow | Test login success/failure, biometric auth, token storage, logout. Target ≥80% coverage. | F10, F11 | Jest + React Native Testing Library tests | All tests pass; coverage ≥80% | Frontend Dev | 1d |
| F13 | Run CI, request review, merge PR – auth UI | Fix findings; request ≥2 reviews; squash-merge. | F12 | Merged PR | CI green; branch deleted | Frontend Dev | 0.25d |
| F14 | Create feature branch – schedule screen | Branch `feat/mobile-schedule` from `main`; open draft PR. | F13 | Branch + draft PR | PR open | Frontend Dev | 0.1d |
| F15 | Build Daily Schedule screen | Implement Schedule screen per mobile-documentation/README.md (line 73-96). Display visit cards (patient name, address, time, status); pull-to-refresh; offline indicator. Arch ref: Visit Data (line 369-405, architecture-output.md). | F14 | Schedule screen; visit card component | Visit list displays correctly; pull-to-refresh fetches data; offline mode shows cached data | Frontend Dev | 2d |
| F16 | Integrate visit list API | Connect to `GET /visits` API; cache results in Redux; handle offline mode. Arch ref: Visit Management Endpoints (line 360-405, architecture-output.md). | F15 | API integration; offline caching | Visits load from API; cached visits display offline; sync status updates | Frontend Dev | 1.5d |
| F17 | Add navigation to patient profile | Tap visit card navigates to Patient Profile screen; pass patient ID. | F16 | Navigation logic | Tap navigates correctly; patient data loads | Frontend Dev | 0.5d |
| F18 | Write unit tests for schedule screen | Test visit list rendering, pull-to-refresh, navigation, offline mode. Target ≥80% coverage. | F15, F16, F17 | Jest tests | All tests pass; coverage ≥80% | Frontend Dev | 1d |
| F19 | Run CI, request review, merge PR – schedule screen | Fix findings; request ≥2 reviews; squash-merge. | F18 | Merged PR | CI green; branch deleted | Frontend Dev | 0.25d |
| F20 | Create feature branch – patient profile | Branch `feat/mobile-patient-profile` from `main`; open draft PR. | F19 | Branch + draft PR | PR open | Frontend Dev | 0.1d |
| F21 | Build Patient Profile screen | Implement Patient Profile per mobile-documentation/README.md (line 98-123). Tabs: Overview, Care Plan, History, Contacts. Display client demographics, medications, allergies, care plan. Arch ref: Clients Table (line 146-175, architecture-output.md), Care Plans (line 218-243, architecture-output.md). | F20 | Patient Profile screen; tabbed navigation | Profile displays patient data; tabs switch correctly; data loads from API/cache | Frontend Dev | 2.5d |
| F22 | Add "Start Visit" button | Primary CTA to navigate to Visit Documentation screen; pass visit ID. | F21 | Button + navigation | Tap "Start Visit" navigates to documentation screen; visit ID passed | Frontend Dev | 0.5d |
| F23 | Write unit tests for patient profile | Test data rendering, tab navigation, "Start Visit" flow. Target ≥80% coverage. | F21, F22 | Jest tests | All tests pass; coverage ≥80% | Frontend Dev | 1d |
| F24 | Run CI, request review, merge PR – patient profile | Fix findings; request ≥2 reviews; squash-merge. | F23 | Merged PR | CI green; branch deleted | Frontend Dev | 0.25d |
| F25 | Create feature branch – visit documentation | Branch `feat/mobile-visit-doc` from `main`; open draft PR. | F24 | Branch + draft PR | PR open | Frontend Dev | 0.1d |
| F26 | Build Visit Documentation form structure | Implement sections: Vital Signs, Assessment, Care Activities, Patient Response per mobile-documentation/README.md (line 125-163). Collapsible sections; floating save indicator. Arch ref: Visit Documentation (line 430-453, architecture-output.md). | F25 | Visit Documentation screen; form sections | Form renders sections correctly; collapsible sections work; auto-save triggers every 30s | Frontend Dev | 3d |
| F27 | Implement smart data reuse | Add "Copy from Last Visit" button; fetch previous visit data (`GET /visits/:id`); pre-populate form with copied data; visual indicators (blue background for copied fields). Arch ref: Smart Data Reuse (smart-data-reuse/README.md). | F26 | Copy feature; data selection modal; visual indicators | Copy button fetches data; form pre-populates; copied fields highlighted; editing changes indicator | Frontend Dev | 2.5d |
| F28 | Integrate voice input | Add voice-to-text for notes fields using native Speech Recognition APIs; microphone button; recording states (recording, processing, completed). Arch ref: Voice Input (line 187-190, mobile-documentation/README.md), Voice Accessibility (line 397-434, accessibility/README.md). | F26 | Voice input integration; recording UI | Voice input works; speech-to-text converts accurately; medical terms recognized | Frontend Dev | 2d |
| F29 | Implement photo capture | Integrate camera for wound/condition photos; review/retake flow; store locally with encryption. Arch ref: Photo Capture (line 192-198, mobile-documentation/README.md), File Upload (line 464-483, architecture-output.md). Max 10MB, encrypt with SQLCipher. | F26 | Camera integration; photo review; local storage | Camera opens; photos captured; preview shows correctly; photos encrypted locally | Frontend Dev | 2d |
| F30 | Write unit tests for visit documentation | Test form rendering, copy feature, voice input, photo capture, auto-save. Target ≥80% coverage. | F26, F27, F28, F29 | Jest tests | All tests pass; coverage ≥80% | Frontend Dev | 2d |
| F31 | Run CI, request review, merge PR – visit documentation | Fix findings; request ≥2 reviews; squash-merge. | F30 | Merged PR | CI green; branch deleted | Frontend Dev | 0.25d |
| F32 | Create feature branch – review and submit | Branch `feat/mobile-review-submit` from `main`; open draft PR. | F31 | Branch + draft PR | PR open | Frontend Dev | 0.1d |
| F33 | Build Review and Submit screen | Implement review screen per mobile-documentation/README.md (line 165-179). Display summary cards; required field checks; signature pad; validation. | F32 | Review screen; signature pad; validation | Summary displays correctly; missing fields flagged; signature captured; validation errors shown | Frontend Dev | 2d |
| F34 | Integrate visit completion API | Connect to `POST /visits/:id/complete`; handle success/error; mark visit complete; trigger sync. Arch ref: Visit Management (line 360-462, architecture-output.md). | F33 | API integration; completion flow | Visit submits successfully; status updates; sync triggered; error handling robust | Frontend Dev | 1.5d |
| F35 | Write unit tests for review and submit | Test validation, signature capture, submit success/error. Target ≥80% coverage. | F33, F34 | Jest tests | All tests pass; coverage ≥80% | Frontend Dev | 1d |
| F36 | Run CI, request review, merge PR – review submit | Fix findings; request ≥2 reviews; squash-merge. | F35 | Merged PR | CI green; branch deleted | Frontend Dev | 0.25d |

---

## Phase O – Offline Sync & Data Persistence

| ID | Title | Description | Deps | Deliverables | Acceptance | Role | Effort |
|----|-------|-------------|------|--------------|------------|------|--------|
| O1 | Create feature branch – offline storage | Branch `feat/offline-storage` from `main`; open draft PR. | F36 | Branch + draft PR | PR open | Frontend Dev | 0.1d |
| O2 | Set up Watermelon DB schema | Define Watermelon DB schema for visits, clients, users, care_plans mirroring backend tables. Arch ref: Data Layer (line 66, architecture-output.md), Database Schema (line 113-320, architecture-output.md). | O1 | Watermelon schema files; models | Schema creates tables; models instantiate correctly | Frontend Dev | 2d |
| O3 | Implement SQLCipher encryption | Enable SQLCipher for SQLite database encryption; configure encryption key from Keychain. Arch ref: Mobile Storage Encryption (line 762, architecture-output.md). | O2 | Encrypted DB config | DB file encrypted at rest; app reads/writes correctly with key | Frontend Dev | 1d |
| O4 | Build offline data write layer | Implement local CRUD operations for visits, clients; queue sync operations in sync_log table. Arch ref: Sync Log (line 266-285, architecture-output.md). | O3 | Offline data service; sync queue | Data writes locally when offline; sync queue populates; data persists across app restarts | Frontend Dev | 2d |
| O5 | Write unit tests for offline storage | Test schema, encryption, CRUD operations, sync queue. Target ≥80% coverage. | O2, O3, O4 | Jest tests | All tests pass; coverage ≥80% | Frontend Dev | 1.5d |
| O6 | Run CI, request review, merge PR – offline storage | Fix findings; request ≥2 reviews; squash-merge. | O5 | Merged PR | CI green; branch deleted | Frontend Dev | 0.25d |
| O7 | Create feature branch – sync engine | Branch `feat/sync-engine` from `main`; open draft PR. | O6 | Branch + draft PR | PR open | Frontend Dev | 0.1d |
| O8 | Implement sync pull logic | Build sync service to call `POST /sync/pull`; update local DB with server changes; handle incremental sync. Arch ref: Sync Pull (line 488-514, architecture-output.md). | O7 | Sync pull service | Pull fetches server changes; local DB updates; last_sync_timestamp tracks progress | Frontend Dev | 2d |
| O9 | Implement sync push logic | Build sync push to call `POST /sync/push`; upload local changes (visits, documentation, photos); handle conflicts. Arch ref: Sync Push (line 517-545, architecture-output.md), Conflict Resolution (line 107-112, architecture-output.md). | O8 | Sync push service; conflict handling | Push uploads local changes; conflicts logged; last-write-wins applied; audit trail maintained | Frontend Dev | 2.5d |
| O10 | Implement background sync | Use `react-native-background-fetch` for periodic background sync; trigger on network reconnect. Arch ref: Sync Engine (line 67, architecture-output.md). Assumptions: Background fetch permissions granted. | O9 | Background sync service; network listener | Background sync runs periodically; triggers on network change; battery-efficient | Frontend Dev | 1.5d |
| O11 | Add sync status UI indicators | Display sync status in header (syncing icon, offline icon, last sync time); show pending uploads count. Arch ref: Offline Indicators (line 271-276, style-guide.md). | O10 | Sync status component | Status updates in real-time; pending count accurate; user can trigger manual sync | Frontend Dev | 1d |
| O12 | Write integration tests for sync engine | Test pull, push, conflict resolution, background sync. | O8, O9, O10, O11 | Integration tests | All tests pass; sync reliability ≥99%; conflicts resolve correctly | Frontend Dev | 2d |
| O13 | Run CI, request review, merge PR – sync engine | Fix findings; request ≥2 reviews; squash-merge. | O12 | Merged PR | CI green; branch deleted | Frontend Dev | 0.25d |

---

## Phase P – Photo & File Upload Module

| ID | Title | Description | Deps | Deliverables | Acceptance | Role | Effort |
|----|-------|-------------|------|--------------|------------|------|--------|
| P1 | Create feature branch – photo upload | Branch `feat/photo-upload` from `main`; open draft PR. | O13 | Branch + draft PR | PR open | Frontend Dev | 0.1d |
| P2 | Implement photo compression | Integrate `react-native-image-resizer` to compress photos before upload; target <2MB per image. Arch ref: Data Usage – Compression (line 255-256, mobile-documentation/README.md). | P1 | Compression service | Photos compressed to <2MB; quality acceptable for clinical use | Frontend Dev | 1d |
| P3 | Build upload queue for photos | Queue photos for upload in background; retry on failure; display upload progress. Arch ref: File Upload (line 464-483, architecture-output.md). | P2 | Upload queue service; progress UI | Photos queue when offline; upload when online; progress bar shows status; retries on failure | Frontend Dev | 2d |
| P4 | Integrate photo upload API | Connect to `POST /uploads/photos`; upload compressed photos; store URLs in visit record. | P3 | API integration | Photos upload to S3; URLs returned; thumbnails generated; visit record updated | Frontend Dev | 1.5d |
| P5 | Write unit tests for photo upload | Test compression, queue, upload, retry logic. Target ≥80% coverage. | P2, P3, P4 | Jest tests | All tests pass; coverage ≥80% | Frontend Dev | 1d |
| P6 | Run CI, request review, merge PR – photo upload | Fix findings; request ≥2 reviews; squash-merge. | P5 | Merged PR | CI green; branch deleted | Frontend Dev | 0.25d |

---

## Phase V – Voice Input & Accessibility

| ID | Title | Description | Deps | Deliverables | Acceptance | Role | Effort |
|----|-------|-------------|------|--------------|------------|------|--------|
| V1 | Create feature branch – voice accessibility | Branch `feat/voice-accessibility` from `main`; open draft PR. | P6 | Branch + draft PR | PR open | Frontend Dev | 0.1d |
| V2 | Enhance voice input with medical vocabulary | Train/configure speech recognition with medical terms; integrate noise cancellation. Arch ref: Voice Input Support (line 398-424, accessibility/README.md). Assumptions: Use Google Speech API or native APIs with custom vocab. | V1 | Enhanced voice service; medical vocab list | Medical terms recognized accurately (≥90%); noise cancellation improves clarity | Frontend Dev | 2d |
| V3 | Implement screen reader support | Add accessibility labels to all components; test with VoiceOver (iOS) and TalkBack (Android). Arch ref: Screen Reader Support (line 296-384, accessibility/README.md). | V2 | Accessibility labels; ARIA roles | Screen reader navigates app correctly; all content announced; forms accessible | Frontend Dev | 2d |
| V4 | Implement keyboard navigation | Ensure all interactive elements keyboard-accessible; visible focus indicators. Arch ref: Keyboard Navigation (line 149-193, accessibility/README.md). | V3 | Keyboard support; focus indicators | Tab navigation works; focus visible; shortcuts functional (where applicable) | Frontend Dev | 1.5d |
| V5 | Add high contrast mode | Implement high contrast theme per design system. Arch ref: High Contrast Mode (line 85-113, accessibility/README.md). | V4 | High contrast theme | High contrast mode toggles; meets WCAG AA contrast ratios | Frontend Dev | 1d |
| V6 | Write accessibility tests | Test screen reader, keyboard nav, high contrast, voice input. Use `@testing-library/react-native` with accessibility queries. | V2, V3, V4, V5 | Accessibility tests | All tests pass; accessibility checklist (line 561-573, accessibility/README.md) verified | Frontend Dev | 1.5d |
| V7 | Run CI, request review, merge PR – voice accessibility | Fix findings; request ≥2 reviews; squash-merge. | V6 | Merged PR | CI green; branch deleted | Frontend Dev | 0.25d |

---

## Phase FP – Family Portal (Web)

| ID | Title | Description | Deps | Deliverables | Acceptance | Role | Effort |
|----|-------|-------------|------|--------------|------------|------|--------|
| FP1 | Create feature branch – family portal scaffold | Branch `feat/family-portal-scaffold` from `main`; open draft PR. | E2 | Branch + draft PR | PR open | Frontend Dev | 0.1d |
| FP2 | Initialize React web app | Use Vite + React 18 + TypeScript; folder structure (`/src/pages`, `/src/components`, `/src/services`); ESLint, Prettier. Arch ref: Progressive Web App (line 614-627, architecture-output.md). | FP1 | `/family-portal` folder; Vite project | `npm run dev` starts dev server; TypeScript compiles; hot reload works | Frontend Dev | 1d |
| FP3 | Install dependencies | Install TanStack Query, Mantine (UI library), React Router, Workbox (service worker for PWA). Arch ref: Key Libraries (line 620-626, architecture-output.md). | FP2 | Updated `package.json` | All packages install; dev server runs | Frontend Dev | 0.5d |
| FP4 | Set up design system tokens (web) | Implement design tokens from style-guide.md as CSS variables; ensure consistency with mobile theme. | FP3 | CSS/SCSS theme files | Theme matches mobile app; colors/typography consistent | Frontend Dev | 1d |
| FP5 | Build reusable web components | Implement Button, Card, Header, Navigation components using Mantine + custom styling. | FP4 | Component library; Storybook or component tests | Components render correctly; responsive; accessible | Frontend Dev | 2d |
| FP6 | Set up React Router | Configure routes: `/login`, `/dashboard`, `/client/:id/visits`, `/settings`. | FP5 | Router config | Routes navigate correctly; protected routes enforce auth | Frontend Dev | 0.5d |
| FP7 | Run CI, request review, merge PR – family portal scaffold | Fix findings; request ≥2 reviews; squash-merge. | FP4, FP5, FP6 | Merged PR | CI green (build succeeds); branch deleted | Frontend Dev | 0.25d |
| FP8 | Create feature branch – family portal auth | Branch `feat/family-portal-auth` from `main`; open draft PR. | FP7 | Branch + draft PR | PR open | Frontend Dev | 0.1d |
| FP9 | Build family login page | Implement login page; connect to `POST /auth/login` with family_member role. Arch ref: RBAC – Family Member Role (line 741-746, architecture-output.md). | FP8 | Login page | Family members log in successfully; tokens stored in localStorage (secure); role validated | Frontend Dev | 1.5d |
| FP10 | Write unit tests for family auth | Test login, logout, role check. Target ≥80% coverage. | FP9 | Jest tests | All tests pass; coverage ≥80% | Frontend Dev | 1d |
| FP11 | Run CI, request review, merge PR – family portal auth | Fix findings; request ≥2 reviews; squash-merge. | FP10 | Merged PR | CI green; branch deleted | Frontend Dev | 0.25d |
| FP12 | Create feature branch – family dashboard | Branch `feat/family-dashboard` from `main`; open draft PR. | FP11 | Branch + draft PR | PR open | Frontend Dev | 0.1d |
| FP13 | Build family dashboard | Display linked clients; recent visit summaries; upcoming visits. Arch ref: Family Portal Endpoints (line 548-577, architecture-output.md), Design: Family Portal (design-documentation/features/family-portal/README.md). | FP12 | Dashboard page | Dashboard shows clients; visit summaries display; data loads from API | Frontend Dev | 2d |
| FP14 | Build visit history page | Display visit history for a client (`GET /family/clients/:id/visits`); filter by date range; read-only view. | FP13 | Visit history page | Visit list displays; filters work; pagination functional | Frontend Dev | 2d |
| FP15 | Write unit tests for family dashboard | Test dashboard rendering, visit history, filters. Target ≥80% coverage. | FP13, FP14 | Jest tests | All tests pass; coverage ≥80% | Frontend Dev | 1.5d |
| FP16 | Run CI, request review, merge PR – family dashboard | Fix findings; request ≥2 reviews; squash-merge. | FP15 | Merged PR | CI green; branch deleted | Frontend Dev | 0.25d |
| FP17 | Create feature branch – PWA setup | Branch `feat/pwa-setup` from `main`; open draft PR. | FP16 | Branch + draft PR | PR open | Frontend Dev | 0.1d |
| FP18 | Configure service worker for offline | Use Workbox to generate service worker; cache API responses; offline fallback page. Arch ref: Offline capabilities (line 618-619, architecture-output.md). | FP17 | Service worker config; manifest.json | Service worker registers; offline page shows when no network; cached data loads offline | Frontend Dev | 1.5d |
| FP19 | Add PWA manifest and icons | Create `manifest.json` with app metadata, icons (192px, 512px); configure installability. | FP18 | Manifest file; app icons | PWA installable on mobile/desktop; icons display correctly | Frontend Dev | 1d |
| FP20 | Write E2E tests for family portal | Use Playwright or Cypress for login, dashboard, visit history flows. | FP18, FP19 | E2E tests | All tests pass; critical flows covered | QA | 2d |
| FP21 | Run CI, request review, merge PR – PWA setup | Fix findings; request ≥2 reviews; squash-merge. | FP20 | Merged PR | CI green; branch deleted | Frontend Dev | 0.25d |

---

## Phase C – Compliance & Security Hardening

| ID | Title | Description | Deps | Deliverables | Acceptance | Role | Effort |
|----|-------|-------------|------|--------------|------------|------|--------|
| C1 | Create feature branch – encryption at rest | Branch `feat/encryption-at-rest` from `main`; open draft PR. | B31 | Branch + draft PR | PR open | SecEng | 0.1d |
| C2 | Implement database column encryption | Use PostgreSQL pgcrypto or application-layer encryption for PHI columns (name, DOB, address, diagnosis, etc.). Arch ref: Encryption – Data at Rest (line 757-762, architecture-output.md). | C1 | Encryption functions; encrypted columns | PHI columns encrypted in DB; decryption works in app; keys managed securely (env var or KMS) | SecEng | 2d |
| C3 | Configure S3 SSE with CMK | Enable S3 server-side encryption with AWS KMS customer-managed keys for photo/document storage. Arch ref: Data Protection (line 759, architecture-output.md). | C1 | KMS key; S3 bucket config | All uploads encrypted at rest; keys rotated per policy; access logged | SecEng | 1d |
| C4 | Write security tests for encryption | Test encryption/decryption, key rotation, unauthorized access. | C2, C3 | Security tests | All tests pass; encryption verified; keys secure | SecEng | 1d |
| C5 | Run CI, request review, merge PR – encryption | Fix findings; request ≥2 reviews (1 security lead); squash-merge. | C4 | Merged PR | CI green; security scan clean; branch deleted | SecEng | 0.25d |
| C6 | Create feature branch – audit logging | Branch `feat/audit-logging` from `main`; open draft PR. | C5 | Branch + draft PR | PR open | Backend Dev | 0.1d |
| C7 | Implement audit trail for data access | Log all reads/writes to PHI tables (users, clients, visits); capture user_id, operation, timestamp, IP. Arch ref: Data Anonymization – Audit Logs (line 773-775, architecture-output.md). Store logs in separate `audit_log` table or CloudWatch. | C6 | Audit logging middleware; audit_log table | All data access logged; logs queryable; PII hashed in logs | Backend Dev | 2d |
| C8 | Implement security event logging | Log failed logins, permission denials, suspicious activity. Integrate with AWS GuardDuty. Arch ref: Intrusion Detection (line 796-799, architecture-output.md). | C7 | Security event logger; GuardDuty integration | Failed auth attempts logged; alerts triggered on anomalies; GuardDuty monitors traffic | Backend Dev | 1.5d |
| C9 | Write tests for audit logging | Test logging on CRUD operations, log integrity, query performance. | C7, C8 | Integration tests | All tests pass; logs complete and accurate; query performance acceptable | Backend Dev | 1d |
| C10 | Run CI, request review, merge PR – audit logging | Fix findings; request ≥2 reviews; squash-merge. | C9 | Merged PR | CI green; branch deleted | Backend Dev | 0.25d |
| C11 | Create feature branch – PIPEDA compliance | Branch `feat/pipeda-compliance` from `main`; open draft PR. | C10 | Branch + draft PR | PR open | Backend Dev | 0.1d |
| C12 | Implement consent management | Add `consent_log` table; track user consent for data collection/use; display consent forms; allow withdrawal. Arch ref: PIPEDA Compliance (line 779-785, architecture-output.md). | C11 | Consent management module; consent UI | Consent recorded; users can view/withdraw consent; data use respects consent | Backend Dev | 2d |
| C13 | Implement data minimization checks | Review data collection; remove unnecessary fields; document justification for PHI collection. Arch ref: PIPEDA – Data Minimization (line 781, architecture-output.md). | C12 | Data audit report; updated schema | Only necessary data collected; documentation updated | Backend Dev | 1d |
| C14 | Implement breach notification procedure | Add incident response plan; automated alerts for suspected breaches; notification templates. Arch ref: Data breach notification (line 783, architecture-output.md). | C13 | Incident response doc; alert config | Breach detection triggers alerts; notification templates ready; runbook documented | SecEng | 1.5d |
| C15 | Write compliance tests | Test consent flow, data minimization, breach alerts. | C12, C13, C14 | Compliance tests | All tests pass; compliance requirements met | Backend Dev | 1d |
| C16 | Run CI, request review, merge PR – PIPEDA compliance | Fix findings; request ≥2 reviews; squash-merge. | C15 | Merged PR | CI green; branch deleted | Backend Dev | 0.25d |
| C17 | Conduct security audit and penetration test | Hire external security firm for penetration test; remediate findings. Arch ref: Penetration Testing (line 810-814, architecture-output.md). Assumptions: Budget approved; vendor selected. | C16 | Penetration test report; remediation tickets | Test completed; critical/high findings remediated within 30d; report documented | SecEng | 5d |
| C18 | Update security documentation | Document encryption, audit logging, compliance measures, incident response in `/docs/security.md`. | C17 | Security documentation | Docs complete; engineers and auditors can verify compliance from docs | SecEng | 1d |

---

## Phase T – Testing & Quality Assurance

| ID | Title | Description | Deps | Deliverables | Acceptance | Role | Effort |
|----|-------|-------------|------|--------------|------------|------|--------|
| T1 | Create feature branch – E2E mobile tests | Branch `feat/e2e-mobile` from `main`; open draft PR. | V7 | Branch + draft PR | PR open | QA | 0.1d |
| T2 | Set up Detox for React Native E2E | Configure Detox; add test suite for core flows (login, schedule, visit documentation, submit). Arch ref: E2E Testing (line 1666-1691, architecture-output.md). | T1 | Detox config; E2E test suite | Detox runs on iOS/Android simulators; tests pass | QA | 2d |
| T3 | Write E2E tests for visit documentation flow | Test full visit flow: login → schedule → patient profile → documentation → submit. | T2 | E2E tests | All tests pass; critical path covered | QA | 2d |
| T4 | Write E2E tests for offline sync | Test offline data entry → sync when online → verify data integrity. | T2 | E2E tests | Offline sync tests pass; data integrity verified | QA | 1.5d |
| T5 | Run CI, request review, merge PR – E2E mobile | Fix findings; request ≥2 reviews; squash-merge. | T3, T4 | Merged PR | CI green; E2E tests in CI pipeline | QA | 0.25d |
| T6 | Create feature branch – load testing | Branch `feat/load-testing` from `main`; open draft PR. | B31 | Branch + draft PR | PR open | QA | 0.1d |
| T7 | Set up K6 load testing | Configure K6; write load test scripts for auth, visit list, visit submit endpoints. Arch ref: Load Testing (line 1447-1491, architecture-output.md). Target: 500 concurrent users, 95th percentile <2s. | T6 | K6 scripts; load test results | Load tests run; performance targets met (95th <2s, <1% errors) | QA | 2d |
| T8 | Run load tests against staging | Execute load tests on staging environment; identify bottlenecks; optimize (add caching, indexes, etc.). | T7 | Load test report; optimization tickets | Performance meets targets; bottlenecks identified and resolved | QA | 2d |
| T9 | Run CI, request review, merge PR – load testing | Fix findings; request ≥2 reviews; squash-merge. | T8 | Merged PR | CI green; load tests in CI (smoke tests only; full load manual); branch deleted | QA | 0.25d |
| T10 | Conduct accessibility audit | Manual accessibility testing per checklist (line 561-573, accessibility/README.md); test with screen readers, keyboard, high contrast. | V7, FP21 | Accessibility audit report | WCAG 2.1 AA compliance verified; issues logged and fixed | QA | 3d |
| T11 | Conduct user acceptance testing (UAT) | Recruit 5-10 nurses/PSWs for UAT; test mobile app in real-world scenarios; gather feedback. Assumptions: UAT participants recruited; test environment ready. | T5, T9 | UAT report; feedback log | UAT completed; critical issues resolved; user satisfaction ≥80% | PM | 5d |

---

## Phase D – Deployment & Infrastructure

| ID | Title | Description | Deps | Deliverables | Acceptance | Role | Effort |
|----|-------|-------------|------|--------------|------------|------|--------|
| D1 | Create feature branch – AWS infrastructure | Branch `feat/aws-infra` from `main`; open draft PR. | E5 | Branch + draft PR | PR open | DevOps | 0.1d |
| D2 | Set up AWS VPC and networking | Create VPC in ca-central-1 (Canadian region); configure subnets (public/private), NAT gateway, security groups. Arch ref: Cloud Provider (line 675-688, architecture-output.md). Use Terraform or CloudFormation. | D1 | IaC templates (Terraform/CFN); VPC ID | VPC created; subnets configured; networking functional | DevOps | 2d |
| D3 | Set up RDS PostgreSQL | Create RDS PostgreSQL 14 instance (db.r5.large); configure automated backups (30d), encryption, read replica. Arch ref: Database (line 895-899, architecture-output.md). | D2 | RDS instance; connection string | RDS instance running; backups configured; read replica operational | DevOps | 2d |
| D4 | Set up ElastiCache Redis | Create ElastiCache Redis cluster (cache.r6g.large, Multi-AZ). Arch ref: Caching (line 901-905, architecture-output.md). | D2 | ElastiCache cluster; connection string | Redis cluster running; Multi-AZ failover tested | DevOps | 1.5d |
| D5 | Set up S3 buckets and CloudFront | Create S3 buckets (photos, documents, exports); enable SSE-KMS; configure CloudFront CDN. Arch ref: File Storage (line 907-911, architecture-output.md). | D2 | S3 buckets; CloudFront distribution URL | Buckets created; CloudFront caches content; encryption enabled | DevOps | 1.5d |
| D6 | Set up ECS Fargate cluster | Create ECS cluster; define task definitions for API services (user, visit, sync, notification); configure auto-scaling (2-10 instances). Arch ref: API Services (line 888-893, architecture-output.md). | D3, D4, D5 | ECS cluster; task definitions | ECS cluster running; tasks deploy successfully; auto-scaling configured | DevOps | 2.5d |
| D7 | Set up Application Load Balancer | Create ALB; configure SSL termination, health checks, route traffic to ECS services. Arch ref: API Gateway (line 36-38, architecture-output.md), ALB Config (line 1195-1218, architecture-output.md). | D6 | ALB; HTTPS endpoint | ALB routes traffic; SSL cert installed; health checks pass | DevOps | 1.5d |
| D8 | Configure rate limiting on ALB | Implement rate limiting rules (10 req/min auth, 60 req/min general API). Arch ref: Rate Limiting (line 1206-1217, architecture-output.md). | D7 | Rate limit config | Rate limits enforced; excessive requests return 429 | DevOps | 1d |
| D9 | Run CI, request review, merge PR – AWS infrastructure | Fix findings; request ≥2 reviews; squash-merge. | D2, D3, D4, D5, D6, D7, D8 | Merged PR | CI green (terraform plan succeeds); branch deleted | DevOps | 0.25d |
| D10 | Create feature branch – CI/CD pipeline | Branch `feat/cicd-pipeline` from `main`; open draft PR. | D9 | Branch + draft PR | PR open | DevOps | 0.1d |
| D11 | Configure production deployment pipeline | Extend GitHub Actions to deploy to ECS on merge to `main`; build Docker images, push to ECR, update ECS service. Arch ref: CI/CD Workflow (line 914-974, architecture-output.md). | D10 | `.github/workflows/deploy-prod.yml` | Merge to `main` triggers deploy; ECS service updates; new tasks running | DevOps | 2d |
| D12 | Configure database migrations in CI/CD | Add migration step to deployment pipeline; run migrations before deploying new code. Arch ref: Database Migration Strategy (line 976-1008, architecture-output.md). | D11 | Migration script in CI/CD | Migrations run automatically; rollback scripts available; deployment succeeds | DevOps | 1d |
| D13 | Set up staging environment | Create staging environment (smaller instances); configure separate Auth0 tenant, RDS instance. Arch ref: Staging Environment (line 870-884, architecture-output.md). | D11 | Staging environment; staging URL | Staging environment operational; deploys on merge to `develop` branch | DevOps | 2d |
| D14 | Write deployment runbook | Document deployment process, rollback procedures, health checks, incident response. | D13 | Deployment runbook in `/docs` | Runbook complete; engineers can deploy from runbook alone | DevOps | 1d |
| D15 | Run CI, request review, merge PR – CI/CD pipeline | Fix findings; request ≥2 reviews; squash-merge. | D12, D13, D14 | Merged PR | CI green; branch deleted | DevOps | 0.25d |
| D16 | Create feature branch – monitoring setup | Branch `feat/monitoring` from `main`; open draft PR. | D15 | Branch + draft PR | PR open | DevOps | 0.1d |
| D17 | Set up New Relic APM | Integrate New Relic agent in backend services; configure dashboards for error rate, response time, DB performance. Arch ref: Application Monitoring (line 1012-1018, architecture-output.md). | D16 | New Relic integration; dashboards | APM data flows to New Relic; dashboards display metrics; alerts configured | DevOps | 1.5d |
| D18 | Set up CloudWatch monitoring | Configure CloudWatch dashboards for ECS, RDS, ALB metrics; set up alarms (CPU >70%, error rate >1%). Arch ref: Infrastructure Monitoring (line 1019-1025, architecture-output.md). | D17 | CloudWatch dashboards; alarms | Dashboards display infra metrics; alarms trigger on thresholds | DevOps | 1.5d |
| D19 | Set up Sentry for error tracking | Integrate Sentry in mobile app and backend; configure error reporting, release tracking. Arch ref: Error Tracking (line 706, architecture-output.md). | D18 | Sentry integration | Errors report to Sentry; stack traces captured; releases tracked | DevOps | 1d |
| D20 | Configure custom business metrics | Implement Prometheus metrics for visit completion rate, sync success rate, documentation time. Arch ref: Custom Business Metrics (line 1027-1050, architecture-output.md). | D19 | Prometheus metrics; Grafana dashboards | Business metrics collected; dashboards visualize KPIs | Backend Dev | 1.5d |
| D21 | Set up alerting (PagerDuty/Opsgenie) | Configure critical alerts (API down, DB failure, auth unavailable) to page on-call engineer. Arch ref: Alerting Strategy (line 1052-1063, architecture-output.md). Assumptions: PagerDuty or Opsgenie account configured. | D20 | Alert routing; escalation policies | Critical alerts page on-call; escalation works; 15min response time | DevOps | 1d |
| D22 | Run CI, request review, merge PR – monitoring | Fix findings; request ≥2 reviews; squash-merge. | D20, D21 | Merged PR | CI green; branch deleted | DevOps | 0.25d |
| D23 | Update architecture docs – Deployment & Monitoring | Document deployed infrastructure, monitoring setup, runbooks in `/docs/architecture-living.md`. | D22 | Updated docs | Docs reflect production setup; runbooks link to monitoring dashboards | DevOps | 1d |

---

## Phase L – Launch Preparation & Go-Live

| ID | Title | Description | Deps | Deliverables | Acceptance | Role | Effort |
|----|-------|-------------|------|--------------|------------|------|--------|
| L1 | Conduct final security review | Review all security controls; verify encryption, audit logging, PIPEDA compliance, penetration test findings resolved. | C18, T10 | Security review report | All security requirements met; sign-off from security lead | SecEng | 2d |
| L2 | Conduct final compliance review | Review PIPEDA, provincial HIA compliance; verify consent management, data retention, breach notification procedures. Arch ref: Compliance Framework (line 777-791, architecture-output.md). | C16 | Compliance checklist; sign-off | All compliance requirements met; legal/compliance sign-off | PM | 2d |
| L3 | Create user training materials | Develop training videos, user guides, quick reference cards for nurses/PSWs. Cover mobile app usage, offline mode, troubleshooting. | T11 | Training materials; videos; user guides | Training materials complete; reviewed by users; ready for distribution | PM | 3d |
| L4 | Train pilot users | Conduct training sessions for pilot group (10-20 nurses/PSWs); hands-on practice; Q&A. Assumptions: Pilot users identified; sessions scheduled. | L3 | Training sessions; feedback log | Pilot users trained; feedback collected; critical issues resolved | PM | 3d |
| L5 | Set up customer support infrastructure | Configure support ticketing system (Zendesk, Jira Service Desk); create support runbooks; train support staff. | L3 | Support system; runbooks; trained support staff | Support system operational; staff can handle common issues | PM | 2d |
| L6 | Prepare rollback plan | Document rollback procedures for production deployment; test rollback in staging. Arch ref: Deployment Pipeline (line 976-1008, architecture-output.md). | D15 | Rollback plan; tested in staging | Rollback plan documented; staging rollback successful; RTO <1h | DevOps | 1.5d |
| L7 | Conduct disaster recovery test | Simulate database failure, region outage; execute DR procedures; validate RTO/RPO. Arch ref: Backup and Disaster Recovery (line 1186-1190, architecture-output.md). | D22 | DR test report; RTO/RPO validation | DR test successful; RTO <4h, RPO <1h met | DevOps | 2d |
| L8 | Perform production smoke tests | Deploy to production; run smoke tests (login, schedule load, visit submit, photo upload). Arch ref: Smoke Tests (line 883, architecture-output.md). | D15, L1, L2, L6 | Smoke test results | All smoke tests pass; production functional | QA | 1d |
| L9 | Deploy mobile app to App Store & Play Store | Submit iOS app to Apple App Store, Android app to Google Play Store; complete review processes. Assumptions: Developer accounts ready; app store assets prepared. | L8 | App Store listings; approved apps | Apps approved; available for download | Frontend Dev | 2d |
| L10 | Launch family portal to production | Deploy family portal web app to production; configure DNS, SSL. | L8 | Production family portal URL | Family portal accessible; HTTPS works; DNS resolves | DevOps | 0.5d |
| L11 | Enable monitoring and alerting | Verify all monitoring dashboards active; test alerts; ensure on-call rotation staffed. | L8 | Monitoring active; alerts tested | Dashboards live; alerts trigger correctly; on-call responds | DevOps | 0.5d |
| L12 | Conduct go-live checklist review | Review go-live checklist with stakeholders; verify all launch criteria met; obtain sign-off. | L8, L9, L10, L11 | Go-live checklist; stakeholder sign-off | All criteria met; stakeholders approve go-live | PM | 0.5d |
| L13 | Execute production launch | Announce launch to pilot users; monitor for issues; provide support. Begin phased rollout (pilot → regional → full). Assumptions: Communication plan ready; support staff on standby. | L12 | Launch announcement; monitoring log | Launch successful; pilot users active; no critical issues; support responsive | PM | 1d |
| L14 | Post-launch monitoring (first 72h) | Enhanced monitoring for first 72 hours; triage issues; daily standup with team. Arch ref: Post-Deploy Monitoring (line 1722, architecture-output.md). | L13 | Monitoring log; issue triage | No critical issues; error rate <2%; user adoption tracking | DevOps, PM | 3d |
| L15 | Conduct post-launch retrospective | Team retrospective to review launch, identify improvements, celebrate successes. | L14 | Retrospective notes; improvement backlog | Retrospective completed; lessons documented; improvements backlogged | PM | 0.5d |

---

## Dependency-Ordered Task List

### Phase E – Environment & Tooling
1. E1 – Initialize Git repository
2. E2 – Set up CI bootstrap
3. E3 – Set up local development environment
4. E4 – Configure Auth0 development tenant
5. E5 – Update architecture docs – Infra Layer

### Phase B – Backend Core Services
6. B1 – Create feature branch – backend scaffold
7. B2 – Scaffold Node.js backend monorepo
8. B3 – Configure database connection and ORM
9. B4 – Implement database migrations framework
10. B5 – Seed test data for development
11. B6 – Run CI, request review, merge PR – backend scaffold
12. B7 – Create feature branch – user service auth
13. B8 – Implement user authentication endpoints
14. B9 – Implement RBAC middleware
15. B10 – Write unit tests for auth service
16. B11 – Run CI, request review, merge PR – user auth
17. B12 – Create feature branch – visit service
18. B13 – Implement visit management endpoints
19. B14 – Implement GPS location verification
20. B15 – Write integration tests for visit service
21. B16 – Run CI, request review, merge PR – visit service
22. B17 – Create feature branch – file upload service
23. B18 – Implement photo upload to S3
24. B19 – Implement server-side encryption for uploads
25. B20 – Write unit tests for file upload
26. B21 – Run CI, request review, merge PR – file upload
27. B22 – Create feature branch – sync service
28. B23 – Implement offline sync endpoints
29. B24 – Implement WebSocket real-time sync
30. B25 – Write integration tests for sync service
31. B26 – Run CI, request review, merge PR – sync service
32. B27 – Create feature branch – notification service
33. B28 – Implement push notification service
34. B29 – Implement email notification service
35. B30 – Write unit tests for notification service
36. B31 – Run CI, request review, merge PR – notification service
37. B32 – Update architecture docs – Backend Services

### Phase F – Frontend Mobile App (React Native)
38. F1 – Create feature branch – mobile scaffold
39. F2 – Initialize React Native project
40. F3 – Install core dependencies
41. F4 – Set up design system tokens
42. F5 – Build reusable UI components
43. F6 – Configure React Navigation
44. F7 – Set up Redux Toolkit and RTK Query
45. F8 – Run CI, request review, merge PR – mobile scaffold
46. F9 – Create feature branch – authentication UI
47. F10 – Build Login screen
48. F11 – Integrate Auth0 authentication
49. F12 – Write unit tests for auth flow
50. F13 – Run CI, request review, merge PR – auth UI
51. F14 – Create feature branch – schedule screen
52. F15 – Build Daily Schedule screen
53. F16 – Integrate visit list API
54. F17 – Add navigation to patient profile
55. F18 – Write unit tests for schedule screen
56. F19 – Run CI, request review, merge PR – schedule screen
57. F20 – Create feature branch – patient profile
58. F21 – Build Patient Profile screen
59. F22 – Add "Start Visit" button
60. F23 – Write unit tests for patient profile
61. F24 – Run CI, request review, merge PR – patient profile
62. F25 – Create feature branch – visit documentation
63. F26 – Build Visit Documentation form structure
64. F27 – Implement smart data reuse
65. F28 – Integrate voice input
66. F29 – Implement photo capture
67. F30 – Write unit tests for visit documentation
68. F31 – Run CI, request review, merge PR – visit documentation
69. F32 – Create feature branch – review and submit
70. F33 – Build Review and Submit screen
71. F34 – Integrate visit completion API
72. F35 – Write unit tests for review and submit
73. F36 – Run CI, request review, merge PR – review submit

### Phase O – Offline Sync & Data Persistence
74. O1 – Create feature branch – offline storage
75. O2 – Set up Watermelon DB schema
76. O3 – Implement SQLCipher encryption
77. O4 – Build offline data write layer
78. O5 – Write unit tests for offline storage
79. O6 – Run CI, request review, merge PR – offline storage
80. O7 – Create feature branch – sync engine
81. O8 – Implement sync pull logic
82. O9 – Implement sync push logic
83. O10 – Implement background sync
84. O11 – Add sync status UI indicators
85. O12 – Write integration tests for sync engine
86. O13 – Run CI, request review, merge PR – sync engine

### Phase P – Photo & File Upload Module
87. P1 – Create feature branch – photo upload
88. P2 – Implement photo compression
89. P3 – Build upload queue for photos
90. P4 – Integrate photo upload API
91. P5 – Write unit tests for photo upload
92. P6 – Run CI, request review, merge PR – photo upload

### Phase V – Voice Input & Accessibility
93. V1 – Create feature branch – voice accessibility
94. V2 – Enhance voice input with medical vocabulary
95. V3 – Implement screen reader support
96. V4 – Implement keyboard navigation
97. V5 – Add high contrast mode
98. V6 – Write accessibility tests
99. V7 – Run CI, request review, merge PR – voice accessibility

### Phase FP – Family Portal (Web)
100. FP1 – Create feature branch – family portal scaffold
101. FP2 – Initialize React web app
102. FP3 – Install dependencies
103. FP4 – Set up design system tokens (web)
104. FP5 – Build reusable web components
105. FP6 – Set up React Router
106. FP7 – Run CI, request review, merge PR – family portal scaffold
107. FP8 – Create feature branch – family portal auth
108. FP9 – Build family login page
109. FP10 – Write unit tests for family auth
110. FP11 – Run CI, request review, merge PR – family portal auth
111. FP12 – Create feature branch – family dashboard
112. FP13 – Build family dashboard
113. FP14 – Build visit history page
114. FP15 – Write unit tests for family dashboard
115. FP16 – Run CI, request review, merge PR – family dashboard
116. FP17 – Create feature branch – PWA setup
117. FP18 – Configure service worker for offline
118. FP19 – Add PWA manifest and icons
119. FP20 – Write E2E tests for family portal
120. FP21 – Run CI, request review, merge PR – PWA setup

### Phase C – Compliance & Security Hardening
121. C1 – Create feature branch – encryption at rest
122. C2 – Implement database column encryption
123. C3 – Configure S3 SSE with CMK
124. C4 – Write security tests for encryption
125. C5 – Run CI, request review, merge PR – encryption
126. C6 – Create feature branch – audit logging
127. C7 – Implement audit trail for data access
128. C8 – Implement security event logging
129. C9 – Write tests for audit logging
130. C10 – Run CI, request review, merge PR – audit logging
131. C11 – Create feature branch – PIPEDA compliance
132. C12 – Implement consent management
133. C13 – Implement data minimization checks
134. C14 – Implement breach notification procedure
135. C15 – Write compliance tests
136. C16 – Run CI, request review, merge PR – PIPEDA compliance
137. C17 – Conduct security audit and penetration test
138. C18 – Update security documentation

### Phase T – Testing & Quality Assurance
139. T1 – Create feature branch – E2E mobile tests
140. T2 – Set up Detox for React Native E2E
141. T3 – Write E2E tests for visit documentation flow
142. T4 – Write E2E tests for offline sync
143. T5 – Run CI, request review, merge PR – E2E mobile
144. T6 – Create feature branch – load testing
145. T7 – Set up K6 load testing
146. T8 – Run load tests against staging
147. T9 – Run CI, request review, merge PR – load testing
148. T10 – Conduct accessibility audit
149. T11 – Conduct user acceptance testing (UAT)

### Phase D – Deployment & Infrastructure
150. D1 – Create feature branch – AWS infrastructure
151. D2 – Set up AWS VPC and networking
152. D3 – Set up RDS PostgreSQL
153. D4 – Set up ElastiCache Redis
154. D5 – Set up S3 buckets and CloudFront
155. D6 – Set up ECS Fargate cluster
156. D7 – Set up Application Load Balancer
157. D8 – Configure rate limiting on ALB
158. D9 – Run CI, request review, merge PR – AWS infrastructure
159. D10 – Create feature branch – CI/CD pipeline
160. D11 – Configure production deployment pipeline
161. D12 – Configure database migrations in CI/CD
162. D13 – Set up staging environment
163. D14 – Write deployment runbook
164. D15 – Run CI, request review, merge PR – CI/CD pipeline
165. D16 – Create feature branch – monitoring setup
166. D17 – Set up New Relic APM
167. D18 – Set up CloudWatch monitoring
168. D19 – Set up Sentry for error tracking
169. D20 – Configure custom business metrics
170. D21 – Set up alerting (PagerDuty/Opsgenie)
171. D22 – Run CI, request review, merge PR – monitoring
172. D23 – Update architecture docs – Deployment & Monitoring

### Phase L – Launch Preparation & Go-Live
173. L1 – Conduct final security review
174. L2 – Conduct final compliance review
175. L3 – Create user training materials
176. L4 – Train pilot users
177. L5 – Set up customer support infrastructure
178. L6 – Prepare rollback plan
179. L7 – Conduct disaster recovery test
180. L8 – Perform production smoke tests
181. L9 – Deploy mobile app to App Store & Play Store
182. L10 – Launch family portal to production
183. L11 – Enable monitoring and alerting
184. L12 – Conduct go-live checklist review
185. L13 – Execute production launch
186. L14 – Post-launch monitoring (first 72h)
187. L15 – Conduct post-launch retrospective

---

## Timeline Feasibility

**Team Composition (Phase 1):**
- 1 Technical Lead
- 2 Senior Backend Developers
- 2 React Native Developers
- 1 Web Frontend Developer
- 1 DevOps Engineer
- 1 QA Engineer
- 1 Security Engineer (part-time)
- 1 Project Manager

**Total Effort Estimate:** ~185 ideal engineering days across 187 tasks

**Parallelization Strategy:**
- Backend and Frontend phases can run in parallel after Phase E completes
- Compliance work can start once backend core is stable (after B31)
- Testing phases overlap with feature development (continuous testing)
- Infrastructure setup can begin in parallel with late-stage feature work

**Estimated Calendar Time:** 5-6 months with the team above, assuming:
- Average velocity of 25-30 story points per 2-week sprint
- 20% buffer for unplanned work, meetings, context switching
- Parallel workstreams across backend, mobile, web, infrastructure
- Continuous integration and testing reduces late-stage surprises

**Critical Path Items:**
1. **Backend Core Services (B1-B32):** Foundation for all client applications; ~35d total, but parallelizable across 2 devs → ~18 calendar days with overlapping PRs
2. **Mobile Visit Documentation (F25-F31):** Core value proposition; ~12d effort, serial due to dependencies
3. **Offline Sync Engine (O1-O13):** Complex, critical for offline-first architecture; ~13d effort
4. **Security & Compliance (C1-C18):** Required for healthcare deployment; ~16d effort, some parallelizable
5. **Infrastructure & Deployment (D1-D23):** Blocking for production launch; ~24d effort, largely serial

**Risk Mitigation:**
- Feature flags for dark launches and gradual rollout
- Early CI/CD setup (Phase E) enables continuous deployment
- Comprehensive test automation reduces manual QA bottlenecks
- Staging environment allows parallel testing while production-readiness work continues
- Security and compliance work starts early to avoid launch blockers

**Schedule Risk Factors:**
- External dependencies: Auth0 setup, App Store review (can take 1-7 days), security audit vendor availability
- Unknowns: Offline sync conflict resolution complexity, mobile device compatibility issues, performance optimization needs
- Mitigations: Build buffers into critical path; prioritize early prototypes of risky features; maintain close communication with stakeholders

**Success Metrics Tracking:**
- Weekly velocity tracking to detect slowdowns early
- Bi-weekly demo/review to validate feature completeness
- Monthly burn-up chart to visualize progress toward launch
- Quality gates: test coverage ≥80%, WCAG AA compliance, security scan clean, load test targets met

---

*This implementation plan converts the BerthCare technical architecture and design specifications into 187 concrete, testable, dependency-ordered engineering tasks organized into 9 phases. Each task includes explicit acceptance criteria, effort estimates, and references to the source specifications, ensuring zero requirements are lost in translation from design to implementation.*
