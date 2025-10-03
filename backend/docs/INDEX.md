# Backend Documentation Index

## 📚 Backend Documentation Overview

This directory contains all backend-specific documentation for the BerthCare platform.

---

## 📁 Directory Structure

```
backend/docs/
├── INDEX.md (this file)
├── visit-service/      # Visit service documentation
├── reports/            # Backend reports (if any)
└── [root files]        # General backend documentation
```

---

## 🚀 Quick Start Guides

### General
- [QUICK_START.md](QUICK_START.md) - Quick start guide for backend development
- [INSTALLATION.md](INSTALLATION.md) - Installation and setup instructions

### Visit Service
- [LOCATION_QUICK_START.md](LOCATION_QUICK_START.md) - GPS location features quick start
- [LOCATION_VERIFICATION.md](LOCATION_VERIFICATION.md) - GPS verification detailed guide
- [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md) - Implementation tracking

### Testing
- [INTREGRATION_TESTS_QUICK_START.md](INTREGRATION_TESTS_QUICK_START.md) - Integration tests quick start
- [TEST_FLOW_DIAGRAM.md](TEST_FLOW_DIAGRAM.md) - Visual test flow diagrams
- [TEST_SUMMARY.md](TEST_SUMMARY.md) - Test results and summary
- [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md) - Test verification checklist

---

## 🏗️ Visit Service Documentation

Located in `visit-service/`:

- [VISIT_SERVICE_IMPLEMENTATION.md](visit-service/VISIT_SERVICE_IMPLEMENTATION.md) - Complete implementation guide

### Related Files
- Service code: `src/services/visit/`
- Service README: `src/services/visit/README.md`
- Test code: `tests/integration/visit.lifecycle.test.ts`
- Test README: `tests/README.md`

---

## 🧪 Testing Documentation

### Integration Tests
- [INTREGRATION_TESTS_QUICK_START.md](INTREGRATION_TESTS_QUICK_START.md) - Quick start
- [TEST_FLOW_DIAGRAM.md](TEST_FLOW_DIAGRAM.md) - Visual flows
- [TEST_SUMMARY.md](TEST_SUMMARY.md) - Results summary
- [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md) - Verification steps

### Test Files
- Test setup: `tests/setup.ts`
- Test helpers: `tests/helpers/db.helper.ts`
- Integration tests: `tests/integration/visit.lifecycle.test.ts`
- Test README: `tests/README.md`

---

## 🗺️ GPS Location Features

### Documentation
- [LOCATION_VERIFICATION.md](LOCATION_VERIFICATION.md) - Detailed GPS verification guide
- [LOCATION_QUICK_START.md](LOCATION_QUICK_START.md) - Quick reference

### Implementation
- Location service: `src/services/visit/location.service.ts`
- Controller integration: `src/services/visit/controller.ts`

### Features
- Google Maps Geocoding API integration
- Haversine distance calculation
- Urban/rural area detection
- Geofencing (100m urban, 500m rural)
- Location accuracy validation

---

## ⚙️ Configuration Documentation

- [pgbouncer-config.md](pgbouncer-config.md) - PgBouncer connection pooling configuration

### Configuration Files
- Environment: `.env.example`
- TypeScript: `tsconfig.json`
- ESLint: `.eslintrc.json`
- Jest: `jest.config.js`
- Package: `package.json`

---

## 📖 Documentation by Feature

### Visit Service
- **Overview**: `visit-service/VISIT_SERVICE_IMPLEMENTATION.md`
- **Quick Start**: `QUICK_START.md`
- **Implementation**: `IMPLEMENTATION_CHECKLIST.md`
- **Code**: `src/services/visit/README.md`

### GPS Location
- **Detailed Guide**: `LOCATION_VERIFICATION.md`
- **Quick Start**: `LOCATION_QUICK_START.md`
- **Implementation**: `src/services/visit/location.service.ts`

### Testing
- **Quick Start**: `INTREGRATION_TESTS_QUICK_START.md`
- **Test Flows**: `TEST_FLOW_DIAGRAM.md`
- **Results**: `TEST_SUMMARY.md`
- **Verification**: `VERIFICATION_CHECKLIST.md`
- **Test Code**: `tests/README.md`

### Database
- **Connection Pooling**: `pgbouncer-config.md`
- **Migrations**: `migrations/`
- **Seed Data**: See root `docs/SEED_DATA_GUIDE.md`

---

## 🔗 Related Documentation

### Root Documentation
See `docs/` for:
- Task completion summaries
- Pull request descriptions
- Implementation reports
- Architecture documents

### Project Documentation
See `project-documentation/` for:
- Specifications
- Requirements
- Design documents

---

## 📝 API Documentation

### Visit Service Endpoints

1. **GET /api/visits** - Retrieve visits
2. **POST /api/visits/:id/check-in** - Check in with GPS
3. **POST /api/visits/:id/verify-location** - Verify GPS coordinates
4. **PUT /api/visits/:id/documentation** - Update documentation
5. **POST /api/visits/:id/complete** - Complete visit

See `src/services/visit/test-examples.http` for API examples.

---

## 🧪 Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Use automated script
./run-tests.sh
```

See [INTREGRATION_TESTS_QUICK_START.md](INTREGRATION_TESTS_QUICK_START.md) for details.

---

## 🚀 Development Workflow

1. **Setup**: Follow [INSTALLATION.md](INSTALLATION.md)
2. **Development**: Use [QUICK_START.md](QUICK_START.md)
3. **Testing**: Run tests per [INTREGRATION_TESTS_QUICK_START.md](INTREGRATION_TESTS_QUICK_START.md)
4. **Verification**: Check [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)

---

## 📊 Documentation Status

| Feature | Documentation | Status |
|---------|--------------|--------|
| Visit Service | ✅ Complete | visit-service/, QUICK_START.md |
| GPS Location | ✅ Complete | LOCATION_*.md |
| Integration Tests | ✅ Complete | TEST_*.md, INTREGRATION_*.md |
| Configuration | ✅ Complete | pgbouncer-config.md |
| API Examples | ✅ Complete | src/services/visit/test-examples.http |

---

## 🔍 Finding Documentation

### By Topic
- **Visit Service**: `visit-service/`, `QUICK_START.md`, `IMPLEMENTATION_CHECKLIST.md`
- **GPS Features**: `LOCATION_VERIFICATION.md`, `LOCATION_QUICK_START.md`
- **Testing**: `TEST_*.md`, `INTREGRATION_*.md`, `VERIFICATION_CHECKLIST.md`
- **Setup**: `INSTALLATION.md`, `QUICK_START.md`
- **Configuration**: `pgbouncer-config.md`, config files in root

### By File Type
- **Quick Starts**: `*QUICK_START.md`
- **Detailed Guides**: `LOCATION_VERIFICATION.md`, `visit-service/*.md`
- **Test Docs**: `TEST_*.md`, `INTREGRATION_*.md`, `VERIFICATION_*.md`
- **Configuration**: `pgbouncer-config.md`

---

## 📝 Contributing to Documentation

When adding new backend documentation:

1. **Service Documentation** → Place in `visit-service/` or create new service folder
2. **Test Documentation** → Use `TEST_*` or `INTREGRATION_*` prefix
3. **Configuration** → Use descriptive name with `-config.md` suffix
4. **Quick Starts** → Use `*_QUICK_START.md` naming
5. **Update this INDEX.md** with new entries

---

## 🔄 Documentation Maintenance

- **Keep Updated**: Update docs when code changes
- **Link Related**: Cross-reference related documentation
- **Examples**: Include code examples and API samples
- **Verification**: Test all commands and examples

---

*Last Updated: October 2, 2025*  
*Maintained by: Backend Development Team*
