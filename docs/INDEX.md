# BerthCare Documentation Index

## 📚 Documentation Overview

This directory contains all project-level documentation for the BerthCare maritime nursing platform.

---

## 📁 Directory Structure

```
docs/
├── INDEX.md (this file)
├── tasks/          # Task completion summaries
├── prs/            # Pull request descriptions
├── reports/        # Implementation and completion reports
└── [root files]    # General documentation
```

---

## 🚀 Quick Start Guides

- [Quick Reference](QUICK_REFERENCE.md) - Quick reference for common tasks
- [Local Development](LOCAL_DEVELOPMENT.md) - Local development setup
- [GitHub Setup](GITHUB-SETUP.md) - GitHub repository setup
- [GitHub PR Instructions](GITHUB_PR_INSTRUCTIONS.md) - How to create pull requests

---

## 📋 Task Completion Summaries

Located in `tasks/`:

- [TASK_B9_RBAC_IMPLEMENTATION_SUMMARY 2.md](tasks/TASK_B9_RBAC_IMPLEMENTATION_SUMMARY%202.md) - RBAC implementation
- [TASK_B11_USER_AUTH_COMPLETION_REPORT.md](tasks/TASK_B11_USER_AUTH_COMPLETION_REPORT.md) - User authentication
- [TASK_B13_COMPLETION_SUMMARY.md](tasks/TASK_B13_COMPLETION_SUMMARY.md) - Visit service core
- [TASK_B14_COMPLETION_SUMMARY.md](tasks/TASK_B14_COMPLETION_SUMMARY.md) - GPS location verification
- [TASK_B15_COMPLETION_SUMMARY.md](tasks/TASK_B15_COMPLETION_SUMMARY.md) - Integration tests
- [TASK_B16_COMPLETION_SUMMARY.md](tasks/TASK_B16_COMPLETION_SUMMARY.md) - CI and merge preparation

---

## 📝 Pull Request Descriptions

Located in `prs/`:

- [PR_DESCRIPTION_BACKEND_SCAFFOLD.md](prs/PR_DESCRIPTION_BACKEND_SCAFFOLD.md) - Backend infrastructure
- [PR_DESCRIPTION_USER_AUTH.md](prs/PR_DESCRIPTION_USER_AUTH.md) - User authentication system
- [PR_DESCRIPTION_B14_GPS_LOCATION.md](prs/PR_DESCRIPTION_B14_GPS_LOCATION.md) - GPS location features
- [PR_DESCRIPTION_B15_INTEGRATION_TESTS.md](prs/PR_DESCRIPTION_B15_INTEGRATION_TESTS.md) - Integration testing
- [PR_DESCRIPTION_VISIT_SERVICE.md](prs/PR_DESCRIPTION_VISIT_SERVICE.md) - Complete visit service

---

## 📊 Implementation Reports

Located in `reports/`:

- [B14_IMPLEMENTATION_SUMMARY.md](reports/B14_IMPLEMENTATION_SUMMARY.md) - GPS implementation summary
- [B15_IMPLEMENTATION_SUMMARY.md](reports/B15_IMPLEMENTATION_SUMMARY.md) - Testing implementation summary
- [B16_COMPLETION_REPORT.md](reports/B16_COMPLETION_REPORT.md) - CI and merge completion
- [E3_COMPLETION_REPORT.md](reports/E3_COMPLETION_REPORT.md) - E3 task completion
- [E4_COMPLETION_REPORT.md](reports/E4_COMPLETION_REPORT.md) - E4 task completion
- [INTEGRATION_TESTS_COMPLETE.md](reports/INTEGRATION_TESTS_COMPLETE.md) - Integration tests completion
- [MERGE_COMPLETION_REPORT.md](reports/MERGE_COMPLETION_REPORT.md) - Merge completion details

---

## 🏗️ Architecture & Design

- [architecture-living.md](architecture-living.md) - Living architecture document
- [SEED_DATA_GUIDE.md](SEED_DATA_GUIDE.md) - Database seed data guide
- [B5_SEED_DATA_COMPLETION.md](B5_SEED_DATA_COMPLETION.md) - Seed data completion report

---

## 🔗 Related Documentation

### Backend Documentation
See `backend/docs/` for:
- Visit service documentation
- API documentation
- Test documentation
- Configuration guides

### Project Documentation
See `project-documentation/` for:
- Specifications
- Requirements
- Design documents

---

## 📖 Documentation by Topic

### Authentication & Authorization
- [TASK_B11_USER_AUTH_COMPLETION_REPORT.md](tasks/TASK_B11_USER_AUTH_COMPLETION_REPORT.md)
- [PR_DESCRIPTION_USER_AUTH.md](prs/PR_DESCRIPTION_USER_AUTH.md)

### Visit Service
- [TASK_B13_COMPLETION_SUMMARY.md](tasks/TASK_B13_COMPLETION_SUMMARY.md)
- [TASK_B14_COMPLETION_SUMMARY.md](tasks/TASK_B14_COMPLETION_SUMMARY.md)
- [PR_DESCRIPTION_VISIT_SERVICE.md](prs/PR_DESCRIPTION_VISIT_SERVICE.md)
- Backend: `backend/docs/visit-service/`

### Testing
- [TASK_B15_COMPLETION_SUMMARY.md](tasks/TASK_B15_COMPLETION_SUMMARY.md)
- [INTEGRATION_TESTS_COMPLETE.md](reports/INTEGRATION_TESTS_COMPLETE.md)
- Backend: `backend/docs/` (test documentation)

### Infrastructure & CI/CD
- [TASK_B16_COMPLETION_SUMMARY.md](tasks/TASK_B16_COMPLETION_SUMMARY.md)
- [GITHUB-SETUP.md](GITHUB-SETUP.md)
- [PR_DESCRIPTION_BACKEND_SCAFFOLD.md](prs/PR_DESCRIPTION_BACKEND_SCAFFOLD.md)

---

## 🔍 Finding Documentation

### By Task Number
- B9: RBAC → `tasks/TASK_B9_RBAC_IMPLEMENTATION_SUMMARY 2.md`
- B11: User Auth → `tasks/TASK_B11_USER_AUTH_COMPLETION_REPORT.md`
- B13: Visit Core → `tasks/TASK_B13_COMPLETION_SUMMARY.md`
- B14: GPS → `tasks/TASK_B14_COMPLETION_SUMMARY.md`
- B15: Tests → `tasks/TASK_B15_COMPLETION_SUMMARY.md`
- B16: CI/Merge → `tasks/TASK_B16_COMPLETION_SUMMARY.md`

### By Feature
- **User Authentication**: `tasks/TASK_B11_*`, `prs/PR_DESCRIPTION_USER_AUTH.md`
- **Visit Service**: `tasks/TASK_B13_*`, `tasks/TASK_B14_*`, `prs/PR_DESCRIPTION_VISIT_SERVICE.md`
- **GPS Location**: `tasks/TASK_B14_*`, `reports/B14_IMPLEMENTATION_SUMMARY.md`
- **Testing**: `tasks/TASK_B15_*`, `reports/INTEGRATION_TESTS_COMPLETE.md`

### By Document Type
- **Task Summaries**: `tasks/`
- **PR Descriptions**: `prs/`
- **Implementation Reports**: `reports/`
- **Setup Guides**: Root level (GITHUB-SETUP.md, LOCAL_DEVELOPMENT.md, etc.)

---

## 📝 Contributing to Documentation

When adding new documentation:

1. **Task Summaries** → Place in `tasks/`
2. **PR Descriptions** → Place in `prs/`
3. **Implementation Reports** → Place in `reports/`
4. **General Guides** → Place in root `docs/`
5. **Update this INDEX.md** with new entries

---

## 🔄 Document Lifecycle

1. **Task Started** → Create task summary in `tasks/`
2. **Implementation Complete** → Create implementation report in `reports/`
3. **PR Created** → Create PR description in `prs/`
4. **PR Merged** → Update merge completion report in `reports/`

---

*Last Updated: October 2, 2025*  
*Maintained by: BerthCare Development Team*
