# Backend Documentation Index

Quick reference index for all backend documentation.

---

## 📁 Directory Structure

```
backend/docs/
├── INDEX.md (this file)
├── README.md                    # Main documentation entry point
├── STRUCTURE.md                 # Project structure overview
├── guides/                      # How-to guides and quick starts
├── security/                    # Security documentation
├── testing/                     # Testing documentation
├── infrastructure/              # Infrastructure configuration
└── visit-service/              # Visit service specific docs
```

---

## 📖 Quick Start Guides

| Guide | Time | Purpose |
|-------|------|---------|
| [Quick Start](guides/QUICK_START.md) | 15 min | Get started with BerthCare backend |
| [Installation](guides/INSTALLATION.md) | 10 min | Install and configure the backend |
| [Auth Quick Start](guides/AUTH_QUICK_START.md) | 10 min | Configure Auth0 authentication |
| [Encryption Setup](guides/ENCRYPTION_SETUP_GUIDE.md) | 5 min | Enable encryption for development |
| [Location Quick Start](guides/LOCATION_QUICK_START.md) | 10 min | GPS location tracking setup |
| [Integration Tests](guides/INTREGRATION_TESTS_QUICK_START.md) | 15 min | Run integration tests |

---

## 🔒 Security

| Document | Description | Audience |
|----------|-------------|----------|
| [Encryption](security/ENCRYPTION.md) | Complete encryption implementation (S3 SSE + DB encryption) | Security Engineers, DevOps |
| [Authentication](security/AUTHENTICATION.md) | Auth0 integration and JWT management | Backend Developers |
| [RBAC](security/RBAC.md) | Role-based access control system | Backend Developers, Security |

---

## 🧪 Testing

| Document | Description |
|----------|-------------|
| [Testing Guide](testing/TESTING.md) | Testing strategies and guidelines |
| [Test Summary](testing/TEST_SUMMARY.md) | Overview of test coverage |
| [Test Flow Diagram](testing/TEST_FLOW_DIAGRAM.md) | Visual test flow documentation |

---

## 🏗️ Infrastructure

| Document | Topic |
|----------|-------|
| [PgBouncer Config](infrastructure/pgbouncer-config.md) | Database connection pooling |

---

## 🚢 Services

### Visit Service
| Document | Description |
|----------|-------------|
| [Visit Service Implementation](visit-service/VISIT_SERVICE_IMPLEMENTATION.md) | Complete visit service documentation |
| [Location Verification](visit-service/LOCATION_VERIFICATION.md) | GPS location verification details |

---

## 📋 Checklists

| Checklist | Purpose |
|-----------|---------|
| [Implementation Checklist](guides/IMPLEMENTATION_CHECKLIST.md) | Track feature implementation progress |
| [Verification Checklist](guides/VERIFICATION_CHECKLIST.md) | Verify system functionality |

---

## 🔍 Find Documentation By Topic

### Getting Started
- Quick Start: [guides/QUICK_START.md](guides/QUICK_START.md)
- Installation: [guides/INSTALLATION.md](guides/INSTALLATION.md)
- Project Structure: [STRUCTURE.md](STRUCTURE.md)

### Encryption
- Technical: [security/ENCRYPTION.md](security/ENCRYPTION.md)
- Setup: [guides/ENCRYPTION_SETUP_GUIDE.md](guides/ENCRYPTION_SETUP_GUIDE.md)

### Authentication
- Technical: [security/AUTHENTICATION.md](security/AUTHENTICATION.md)
- Setup: [guides/AUTH_QUICK_START.md](guides/AUTH_QUICK_START.md)

### Database
- Connection Pooling: [infrastructure/pgbouncer-config.md](infrastructure/pgbouncer-config.md)
- Encryption: [security/ENCRYPTION.md](security/ENCRYPTION.md)

### Testing
- Testing Guide: [testing/TESTING.md](testing/TESTING.md)
- Test Summary: [testing/TEST_SUMMARY.md](testing/TEST_SUMMARY.md)
- Integration Tests: [guides/INTREGRATION_TESTS_QUICK_START.md](guides/INTREGRATION_TESTS_QUICK_START.md)

### Visit Service
- Implementation: [visit-service/VISIT_SERVICE_IMPLEMENTATION.md](visit-service/VISIT_SERVICE_IMPLEMENTATION.md)
- Location Tracking: [guides/LOCATION_QUICK_START.md](guides/LOCATION_QUICK_START.md)
- Location Verification: [visit-service/LOCATION_VERIFICATION.md](visit-service/LOCATION_VERIFICATION.md)

---

## 📱 By Role

### Backend Developer
1. [Quick Start](guides/QUICK_START.md)
2. [Installation](guides/INSTALLATION.md)
3. [Auth Quick Start](guides/AUTH_QUICK_START.md)
4. [Encryption Setup](guides/ENCRYPTION_SETUP_GUIDE.md)
5. [Testing Guide](testing/TESTING.md)

### DevOps Engineer
1. [Installation](guides/INSTALLATION.md)
2. [PgBouncer Config](infrastructure/pgbouncer-config.md)
3. [Encryption](security/ENCRYPTION.md)

### Security Engineer
1. [Encryption](security/ENCRYPTION.md)
2. [Authentication](security/AUTHENTICATION.md)
3. [RBAC](security/RBAC.md)

---

## 🔗 Related Documentation

### Root Documentation (`docs/`)
- Task completion summaries
- Pull request descriptions
- Implementation reports

### Project Documentation (`project-documentation/`)
- Specifications
- Requirements
- Design documents

### Service Documentation (`src/services/*/README.md`)
- Visit Service: `src/services/visit/README.md`
- File Upload Service: `src/services/file-upload/README.md`
- User Service: `src/services/user/`

---

## 📝 Contributing to Documentation

When adding new backend documentation:

1. **Quick Starts & Guides** → Place in `guides/`
2. **Security Documentation** → Place in `security/`
3. **Testing Documentation** → Place in `testing/`
4. **Infrastructure Config** → Place in `infrastructure/`
5. **Service-Specific** → Create/use service folder (e.g., `visit-service/`)
6. **Update this INDEX.md** with new entries

---

*Last Updated: October 3, 2025*  
*Maintained by: Backend Development Team*
